import os
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auditoria_estorno import AuditoriaEstorno
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
from app.security.autorizacao import exigir_permissao


router = APIRouter(
    prefix="/contas-receber",
    tags=["Recebimentos"],
)


class EstornoRecebimentoCriar(BaseModel):
    senha_estorno: str = Field(min_length=1, max_length=255)
    motivo: str = Field(min_length=5, max_length=500)


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
                "cartao_debito ou transferencia."
            ),
        )

    return forma


def montar_resposta(
    conta: ContaReceber,
    recebimento: RecebimentoConta,
    pagamentos: list[RecebimentoContaForma],
):
    valor_total_conta = Decimal(str(conta.valor or 0))
    valor_recebido_acumulado = Decimal(str(conta.valor_pago or 0))
    valor_pendente = valor_total_conta - valor_recebido_acumulado

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
    usuario=Depends(exigir_permissao("financeiro.visualizar")),
):
    registros = (
        db.query(RecebimentoConta, ContaReceber, Paciente)
        .outerjoin(ContaReceber, ContaReceber.id == RecebimentoConta.conta_receber_id)
        .outerjoin(Paciente, Paciente.id == ContaReceber.paciente_id)
        .filter(RecebimentoConta.ativo.is_(True))
        .order_by(RecebimentoConta.id.desc())
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
    usuario=Depends(exigir_permissao("financeiro.receber")),
):
    try:
        conta = (
            db.query(ContaReceber)
            .filter(ContaReceber.id == conta_id, ContaReceber.ativo.is_(True))
            .first()
        )

        if not conta:
            raise HTTPException(status_code=404, detail="Conta a receber não encontrada.")

        if conta.status == "cancelado":
            raise HTTPException(status_code=400, detail="Não é possível receber uma conta cancelada.")

        valor_total_conta = Decimal(str(conta.valor or 0))
        valor_recebido_anterior = Decimal(str(conta.valor_pago or 0))
        valor_pendente_anterior = valor_total_conta - valor_recebido_anterior

        if valor_pendente_anterior <= 0:
            raise HTTPException(status_code=400, detail="Esta conta já está totalmente recebida.")

        if not dados.pagamentos:
            raise HTTPException(status_code=400, detail="Informe pelo menos uma forma de pagamento.")

        formas_utilizadas = set()
        valor_recebimento = Decimal("0.00")

        for pagamento in dados.pagamentos:
            forma = normalizar_forma_pagamento(pagamento.forma_pagamento)

            if forma in formas_utilizadas:
                raise HTTPException(status_code=400, detail=f"A forma de pagamento '{forma}' foi informada mais de uma vez.")

            formas_utilizadas.add(forma)
            valor = Decimal(str(pagamento.valor))

            if valor <= 0:
                raise HTTPException(status_code=400, detail="Os valores dos pagamentos devem ser maiores que zero.")

            valor_recebimento += valor

        if valor_recebimento > valor_pendente_anterior:
            raise HTTPException(
                status_code=400,
                detail=(
                    "O valor informado ultrapassa o saldo pendente da conta. "
                    f"Pendente: R$ {valor_pendente_anterior:.2f}. "
                    f"Informado: R$ {valor_recebimento:.2f}."
                ),
            )

        caixa = obter_caixa_aberto(db)
        if not caixa:
            raise HTTPException(status_code=400, detail="Não é possível registrar o recebimento porque não existe caixa aberto.")

        recebimento = RecebimentoConta(
            conta_receber_id=conta.id,
            data_recebimento=dados.data_recebimento,
            valor_total=valor_recebimento,
            observacoes=dados.observacoes,
            ativo=True,
        )
        db.add(recebimento)
        db.flush()

        for pagamento in dados.pagamentos:
            forma = normalizar_forma_pagamento(pagamento.forma_pagamento)
            valor = Decimal(str(pagamento.valor))

            registro_forma = RecebimentoContaForma(
                recebimento_id=recebimento.id,
                forma_pagamento=forma,
                valor=valor,
                ativo=True,
            )
            db.add(registro_forma)
            db.flush()

            movimento = MovimentacaoCaixa(
                caixa_id=caixa.id,
                tipo="entrada",
                categoria="recebimento",
                descricao=f"Recebimento - {conta.descricao}",
                valor=valor,
                forma_pagamento=forma,
                observacoes=f"Conta a receber #{conta.id} | Recibo #{recebimento.id:06d}",
                ativo=True,
            )
            db.add(movimento)

        novo_valor_recebido = valor_recebido_anterior + valor_recebimento
        novo_valor_pendente = valor_total_conta - novo_valor_recebido
        if novo_valor_pendente < 0:
            novo_valor_pendente = Decimal("0.00")

        conta.valor_pago = novo_valor_recebido

        if novo_valor_pendente == 0:
            conta.status = "pago"
            conta.data_pagamento = dados.data_recebimento
            conta.forma_pagamento = (
                normalizar_forma_pagamento(dados.pagamentos[0].forma_pagamento)
                if len(dados.pagamentos) == 1
                else "multiplo"
            )
        else:
            conta.status = "pendente"

        db.commit()
        db.refresh(recebimento)

        pagamentos_atualizados = (
            db.query(RecebimentoContaForma)
            .filter(
                RecebimentoContaForma.recebimento_id == recebimento.id,
                RecebimentoContaForma.ativo.is_(True),
            )
            .order_by(RecebimentoContaForma.id.asc())
            .all()
        )

        return montar_resposta(conta, recebimento, pagamentos_atualizados)

    except HTTPException:
        db.rollback()
        raise
    except Exception as error:
        db.rollback()
        print("Erro ao criar recebimento:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Não foi possível registrar o recebimento. Nenhuma alteração financeira foi concluída.",
        )


@router.post("/recibos/{recebimento_id}/estorno")
def estornar_recebimento(
    recebimento_id: int,
    dados: EstornoRecebimentoCriar,
    db: Session = Depends(get_db),
    usuario=Depends(exigir_permissao("financeiro.estornar")),
):
    """Estorna um recebimento sem apagar seu histórico financeiro."""
    senha_configurada = os.getenv("CUIDARE_ESTORNO_PASSWORD")
    if not senha_configurada:
        raise HTTPException(status_code=503, detail="Senha de estorno não configurada no ambiente da API.")

    if dados.senha_estorno != senha_configurada:
        raise HTTPException(status_code=403, detail="Senha de estorno inválida.")

    recebimento = (
        db.query(RecebimentoConta)
        .filter(RecebimentoConta.id == recebimento_id)
        .first()
    )
    if not recebimento:
        raise HTTPException(status_code=404, detail="Recebimento não encontrado.")

    if not recebimento.ativo:
        raise HTTPException(status_code=409, detail="Este recebimento já foi estornado.")

    caixa_atual = obter_caixa_aberto(db)
    if not caixa_atual:
        raise HTTPException(status_code=400, detail="É necessário existir um caixa aberto para registrar o estorno.")

    auditoria_existente = (
        db.query(AuditoriaEstorno)
        .filter(AuditoriaEstorno.recebimento_id == recebimento.id)
        .first()
    )
    if auditoria_existente:
        raise HTTPException(status_code=409, detail="Este recebimento já possui estorno registrado.")

    movimentos_originais = (
        db.query(MovimentacaoCaixa)
        .filter(
            MovimentacaoCaixa.categoria == "recebimento",
            MovimentacaoCaixa.observacoes.contains(f"Recibo #{recebimento.id:06d}"),
            MovimentacaoCaixa.ativo.is_(True),
        )
        .order_by(MovimentacaoCaixa.id.asc())
        .all()
    )

    if not movimentos_originais:
        raise HTTPException(status_code=409, detail="Movimentações originais do recebimento não foram encontradas.")

    caixa_origem_ids = {movimento.caixa_id for movimento in movimentos_originais}
    if len(caixa_origem_ids) != 1:
        raise HTTPException(status_code=409, detail="O recebimento possui movimentações em caixas inconsistentes.")

    valor_original = Decimal(str(recebimento.valor_total or 0))
    valor_movimentos = sum((Decimal(str(m.valor or 0)) for m in movimentos_originais), Decimal("0.00"))
    if valor_movimentos != valor_original:
        raise HTTPException(status_code=409, detail="O valor das movimentações não corresponde ao valor do recebimento.")

    try:
        movimentos_estorno = []

        for movimento_original in movimentos_originais:
            movimento_estorno = MovimentacaoCaixa(
                caixa_id=caixa_atual.id,
                tipo="saida",
                categoria="estorno_recebimento",
                descricao=f"Estorno do recibo #{recebimento.id:06d}",
                valor=movimento_original.valor,
                forma_pagamento=movimento_original.forma_pagamento,
                observacoes=(
                    f"Estorno do recebimento #{recebimento.id} | "
                    f"Movimentação original #{movimento_original.id} | "
                    f"Motivo: {dados.motivo}"
                ),
                ativo=True,
            )
            db.add(movimento_estorno)
            db.flush()
            movimentos_estorno.append(movimento_estorno)

        recebimento.ativo = False
        for pagamento in db.query(RecebimentoContaForma).filter(
            RecebimentoContaForma.recebimento_id == recebimento.id,
            RecebimentoContaForma.ativo.is_(True),
        ).all():
            pagamento.ativo = False

        auditoria = AuditoriaEstorno(
            recebimento_id=recebimento.id,
            usuario_id=int(usuario["id"]),
            caixa_origem_id=next(iter(caixa_origem_ids)),
            caixa_estorno_id=caixa_atual.id,
            valor=valor_original,
            motivo=dados.motivo.strip(),
            movimentacoes_originais_ids=",".join(str(m.id) for m in movimentos_originais),
            movimentacoes_estorno_ids=",".join(str(m.id) for m in movimentos_estorno),
        )
        db.add(auditoria)

        conta = (
            db.query(ContaReceber)
            .filter(ContaReceber.id == recebimento.conta_receber_id)
            .first()
        )
        if not conta:
            raise HTTPException(status_code=409, detail="Conta a receber vinculada não encontrada.")

        recebimentos_ativos = (
            db.query(RecebimentoConta)
            .filter(
                RecebimentoConta.conta_receber_id == conta.id,
                RecebimentoConta.ativo.is_(True),
            )
            .all()
        )
        novo_valor_pago = sum((Decimal(str(r.valor_total or 0)) for r in recebimentos_ativos), Decimal("0.00"))
        valor_conta = Decimal(str(conta.valor or 0))
        conta.valor_pago = novo_valor_pago

        if novo_valor_pago >= valor_conta:
            conta.status = "pago"
            ultimo_recebimento = max(recebimentos_ativos, key=lambda r: r.data_recebimento, default=None)
            conta.data_pagamento = ultimo_recebimento.data_recebimento if ultimo_recebimento else None
        else:
            conta.status = "pendente"
            conta.data_pagamento = None
            conta.forma_pagamento = None

        db.commit()
        db.refresh(auditoria)

        return {
            "status": "estornado",
            "recebimento_id": recebimento.id,
            "auditoria_id": auditoria.id,
            "valor": valor_original,
            "caixa_estorno_id": caixa_atual.id,
            "movimentacoes_estorno_ids": [m.id for m in movimentos_estorno],
            "motivo": auditoria.motivo,
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as error:
        db.rollback()
        print("Erro ao estornar recebimento:", repr(error))
        raise HTTPException(status_code=500, detail="Não foi possível concluir o estorno. Nenhuma alteração financeira foi concluída.")
