from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.caixa import Caixa
from app.models.conta_receber import ContaReceber
from app.models.movimentacao_caixa import MovimentacaoCaixa
from app.models.paciente import Paciente
from app.models.recebimento_conta import RecebimentoConta
from app.models.recebimento_conta_forma import RecebimentoContaForma
from app.schemas.recebimento_conta import (
    FORMAS_PAGAMENTO_RECEBIMENTO_PERMITIDAS,
    RecebimentoContaCriar,
    RecebimentoContaResposta,
)


router = APIRouter(
    prefix="/contas-receber",
    tags=["Recebimentos"],
)


def obter_caixa_aberto(db: Session):
    return (
        db.query(Caixa)
        .filter(
            Caixa.status == "aberto",
            Caixa.ativo.is_(True),
        )
        .order_by(Caixa.id.desc())
        .first()
    )


def normalizar_forma_pagamento(forma_pagamento: str):
    forma = forma_pagamento.strip().lower()

    if forma not in FORMAS_PAGAMENTO_RECEBIMENTO_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Forma de pagamento inválida. "
                "Use dinheiro, pix, cartao_credito, "
                "cartao_debito, transferencia, "
                "debito_automatico ou outro."
            ),
        )

    return forma


def montar_resposta(
    conta: ContaReceber,
    recebimento: RecebimentoConta,
    pagamentos: list[RecebimentoContaForma],
):
    valor_total_conta = Decimal(
        str(conta.valor or 0)
    )

    valor_recebido_acumulado = Decimal(
        str(conta.valor_pago or 0)
    )

    valor_pendente = (
        valor_total_conta - valor_recebido_acumulado
    )

    if valor_pendente < 0:
        valor_pendente = Decimal("0.00")

    return {
        "id": recebimento.id,
        "numero_recibo": f"{recebimento.id:06d}",
        "conta_receber_id": conta.id,
        "data_recebimento": recebimento.data_recebimento,
        "valor_total": recebimento.valor_total,
        "valor_recebido_acumulado": valor_recebido_acumulado,
        "valor_pendente": valor_pendente,
        "observacoes": recebimento.observacoes,
        "pagamentos": pagamentos,
    }


@router.get("/recibos")
def listar_recibos_financeiros(
    db: Session = Depends(get_db),
):
    registros = (
        db.query(RecebimentoConta, ContaReceber, Paciente)
        .outerjoin(
            ContaReceber,
            ContaReceber.id == RecebimentoConta.conta_receber_id,
        )
        .outerjoin(
            Paciente,
            Paciente.id == ContaReceber.paciente_id,
        )
        .filter(
            RecebimentoConta.ativo.is_(True),
        )
        .order_by(
            RecebimentoConta.id.desc()
        )
        .all()
    )

    resultado = []

    for recebimento, conta, paciente in registros:
        valor_total_conta = Decimal(str(conta.valor or 0))
        valor_recebido_acumulado = Decimal(str(conta.valor_pago or 0))
        valor_pendente = valor_total_conta - valor_recebido_acumulado

        if valor_pendente < 0:
            valor_pendente = Decimal("0.00")

        pagamentos = (
            db.query(RecebimentoContaForma)
            .filter(
                RecebimentoContaForma.recebimento_id == recebimento.id,
                RecebimentoContaForma.ativo.is_(True),
            )
            .order_by(RecebimentoContaForma.id.asc())
            .all()
        )

        resultado.append({
            "id": recebimento.id,
            "numero_recibo": f"{recebimento.id:06d}",
            "data_recebimento": recebimento.data_recebimento,
            "paciente_nome": paciente.nome if paciente else "Não informado",
            "paciente_cpf": paciente.cpf if paciente else None,
            "descricao": conta.descricao if conta else "Recebimento",
            "valor_total_conta": float(valor_total_conta),
            "valor_recebimento": float(recebimento.valor_total or 0),
            "valor_recebido_acumulado": float(valor_recebido_acumulado),
            "valor_pendente": float(valor_pendente),
            "observacoes": recebimento.observacoes,
            "pagamentos": [
                {
                    "forma_pagamento": pagamento.forma_pagamento,
                    "valor": float(pagamento.valor or 0),
                }
                for pagamento in pagamentos
            ],
        })

    return resultado


@router.post(
    "/{conta_id}/recebimentos",
    response_model=RecebimentoContaResposta,
    status_code=201,
)
def criar_recebimento(
    conta_id: int,
    dados: RecebimentoContaCriar,
    db: Session = Depends(get_db),
):
    try:
        # ----------------------------------------------------
        # 1. LOCALIZA A CONTA
        # ----------------------------------------------------
        conta = (
            db.query(ContaReceber)
            .filter(
                ContaReceber.id == conta_id,
                ContaReceber.ativo.is_(True),
            )
            .first()
        )

        if not conta:
            raise HTTPException(
                status_code=404,
                detail="Conta a receber não encontrada.",
            )

        # ----------------------------------------------------
        # 2. PROTEÇÕES
        # ----------------------------------------------------
        if conta.status == "cancelado":
            raise HTTPException(
                status_code=400,
                detail="Não é possível receber uma conta cancelada.",
            )

        valor_total_conta = Decimal(
            str(conta.valor or 0)
        )

        valor_recebido_anterior = Decimal(
            str(conta.valor_pago or 0)
        )

        valor_pendente_anterior = (
            valor_total_conta - valor_recebido_anterior
        )

        if valor_pendente_anterior <= 0:
            raise HTTPException(
                status_code=400,
                detail="Esta conta já está totalmente recebida.",
            )

        # ----------------------------------------------------
        # 3. VALIDAR FORMAS DE PAGAMENTO
        # ----------------------------------------------------
        if not dados.pagamentos:
            raise HTTPException(
                status_code=400,
                detail="Informe pelo menos uma forma de pagamento.",
            )

        formas_utilizadas = set()
        valor_recebimento = Decimal("0.00")

        for pagamento in dados.pagamentos:
            forma = normalizar_forma_pagamento(
                pagamento.forma_pagamento
            )

            if forma in formas_utilizadas:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"A forma de pagamento "
                        f"'{forma}' foi informada mais de uma vez."
                    ),
                )

            formas_utilizadas.add(forma)

            valor = Decimal(
                str(pagamento.valor)
            )

            if valor <= 0:
                raise HTTPException(
                    status_code=400,
                    detail="Os valores dos pagamentos devem ser maiores que zero.",
                )

            valor_recebimento += valor

        # ----------------------------------------------------
        # 4. NÃO PERMITIR RECEBIMENTO ACIMA DO PENDENTE
        # ----------------------------------------------------
        if valor_recebimento > valor_pendente_anterior:
            raise HTTPException(
                status_code=400,
                detail=(
                    "O valor informado ultrapassa o saldo "
                    "pendente da conta. "
                    f"Pendente: R$ {valor_pendente_anterior:.2f}. "
                    f"Informado: R$ {valor_recebimento:.2f}."
                ),
            )

        # ----------------------------------------------------
        # 5. EXIGIR CAIXA ABERTO
        # ----------------------------------------------------
        caixa = obter_caixa_aberto(db)

        if not caixa:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Não é possível registrar o recebimento "
                    "porque não existe caixa aberto."
                ),
            )

        # ----------------------------------------------------
        # 6. CRIAR RECEBIMENTO
        # ----------------------------------------------------
        recebimento = RecebimentoConta(
            conta_receber_id=conta.id,
            data_recebimento=dados.data_recebimento,
            valor_total=valor_recebimento,
            observacoes=dados.observacoes,
            ativo=True,
        )

        db.add(recebimento)
        db.flush()

        # ----------------------------------------------------
        # 7. CRIAR FORMAS + MOVIMENTAÇÕES NO CAIXA
        # ----------------------------------------------------
        pagamentos_criados = []

        for pagamento in dados.pagamentos:
            forma = normalizar_forma_pagamento(
                pagamento.forma_pagamento
            )

            valor = Decimal(
                str(pagamento.valor)
            )

            registro_forma = RecebimentoContaForma(
                recebimento_id=recebimento.id,
                forma_pagamento=forma,
                valor=valor,
                ativo=True,
            )

            db.add(registro_forma)
            db.flush()

            pagamentos_criados.append(
                registro_forma
            )

            movimento = MovimentacaoCaixa(
                caixa_id=caixa.id,
                tipo="entrada",
                categoria="recebimento",
                descricao=(
                    f"Recebimento - {conta.descricao}"
                ),
                valor=valor,
                forma_pagamento=forma,
                observacoes=(
                    f"Conta a receber #{conta.id} | "
                    f"Recibo #{recebimento.id:06d}"
                ),
                ativo=True,
            )

            db.add(movimento)

        # ----------------------------------------------------
        # 8. ATUALIZAR TOTAL RECEBIDO DA CONTA
        # ----------------------------------------------------
        novo_valor_recebido = (
            valor_recebido_anterior
            + valor_recebimento
        )

        novo_valor_pendente = (
            valor_total_conta
            - novo_valor_recebido
        )

        if novo_valor_pendente < 0:
            novo_valor_pendente = Decimal("0.00")

        conta.valor_pago = novo_valor_recebido

        if novo_valor_pendente == 0:
            conta.status = "pago"
            conta.data_pagamento = dados.data_recebimento

            # Mantemos os campos antigos preenchidos
            # apenas para compatibilidade/histórico.
            if len(dados.pagamentos) == 1:
                conta.forma_pagamento = normalizar_forma_pagamento(
                    dados.pagamentos[0].forma_pagamento
                )
            else:
                conta.forma_pagamento = "multiplo"
        else:
            # Pagamento parcial continua pendente.
            conta.status = "pendente"

        # ----------------------------------------------------
        # 9. COMMIT ÚNICO
        # ----------------------------------------------------
        db.commit()

        db.refresh(recebimento)

        pagamentos_atualizados = (
            db.query(RecebimentoContaForma)
            .filter(
                RecebimentoContaForma.recebimento_id
                == recebimento.id,
                RecebimentoContaForma.ativo.is_(True),
            )
            .order_by(
                RecebimentoContaForma.id.asc()
            )
            .all()
        )

        return montar_resposta(
            conta=conta,
            recebimento=recebimento,
            pagamentos=pagamentos_atualizados,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        print(
            "Erro ao criar recebimento:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível registrar o recebimento. "
                "Nenhuma alteração financeira foi concluída."
            ),
        )
