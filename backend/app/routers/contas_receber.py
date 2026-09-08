from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.caixa import Caixa
from app.models.conta_receber import ContaReceber
from app.models.movimentacao_caixa import MovimentacaoCaixa
from app.security.autorizacao import exigir_permissao
from app.schemas.conta_receber import (
    ContaReceberAtualizar,
    ContaReceberCriar,
    ContaReceberResposta,
    FORMAS_PAGAMENTO_PERMITIDAS,
    STATUS_PERMITIDOS,
)


router = APIRouter(
    prefix="/contas-receber",
    tags=["Contas a Receber"],
)


def validar_status(status: str):
    status = status.strip().lower()

    if status not in STATUS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Status inválido. "
                "Use: pendente, pago, vencido ou cancelado."
            ),
        )

    return status


def validar_forma_pagamento(forma_pagamento: str | None):
    if forma_pagamento is None:
        return None

    forma = forma_pagamento.strip().lower()

    if forma not in FORMAS_PAGAMENTO_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Forma de pagamento inválida. "
                "Use: dinheiro, pix, cartao_credito, "
                "cartao_debito, transferencia, "
                "debito_automatico ou outro."
            ),
        )

    return forma


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


def criar_movimentacao_recebimento(
    db: Session,
    conta: ContaReceber,
    valor_recebido,
    forma_pagamento: str,
):
    caixa = obter_caixa_aberto(db)

    if not caixa:
        raise HTTPException(
            status_code=400,
            detail=(
                "Não é possível registrar o recebimento "
                "porque não existe caixa aberto."
            ),
        )

    movimento = MovimentacaoCaixa(
        caixa_id=caixa.id,
        tipo="entrada",
        categoria="recebimento",
        descricao=f"Recebimento - {conta.descricao}",
        valor=valor_recebido,
        forma_pagamento=forma_pagamento,
        observacoes=f"Conta a receber #{conta.id}",
        ativo=True,
    )

    db.add(movimento)


@router.post(
    "",
    response_model=ContaReceberResposta,
    status_code=201,
)
def criar_conta_receber(
    dados: ContaReceberCriar,
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("contas_receber.criar")),
    status = validar_status(dados.status)

    forma_pagamento = validar_forma_pagamento(
        dados.forma_pagamento
    )

    if status == "pago":
        if dados.data_pagamento is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Uma conta com status pago "
                    "deve possuir data de pagamento."
                ),
            )

        if dados.valor_pago is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Uma conta com status pago "
                    "deve possuir valor pago."
                ),
            )

        if not forma_pagamento:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Uma conta com status pago "
                    "deve possuir forma de pagamento."
                ),
            )

    conta = ContaReceber(
        paciente_id=dados.paciente_id,
        descricao=dados.descricao.strip(),
        categoria=(
            dados.categoria.strip()
            if dados.categoria
            else None
        ),
        valor=dados.valor,
        vencimento=dados.vencimento,
        status=status,
        forma_pagamento=forma_pagamento,
        data_pagamento=dados.data_pagamento,
        valor_pago=dados.valor_pago,
        observacoes=dados.observacoes,
        ativo=dados.ativo,
    )

    db.add(conta)

    if status == "pago":
        db.flush()

        criar_movimentacao_recebimento(
            db=db,
            conta=conta,
            valor_recebido=dados.valor_pago,
            forma_pagamento=forma_pagamento,
        )

    db.commit()
    db.refresh(conta)

    return conta


@router.get(
    "",
    response_model=list[ContaReceberResposta],
)
def listar_contas_receber(
    status: str | None = Query(default=None),
    paciente_id: int | None = Query(default=None),
    vencimento: date | None = Query(default=None),
    incluir_inativos: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("contas_receber.visualizar")),
    consulta = db.query(ContaReceber)

    if not incluir_inativos:
        consulta = consulta.filter(
            ContaReceber.ativo.is_(True)
        )

    if status is not None:
        status_validado = validar_status(status)

        consulta = consulta.filter(
            ContaReceber.status == status_validado
        )

    if paciente_id is not None:
        consulta = consulta.filter(
            ContaReceber.paciente_id == paciente_id
        )

    if vencimento is not None:
        consulta = consulta.filter(
            ContaReceber.vencimento == vencimento
        )

    return (
        consulta
        .order_by(
            ContaReceber.vencimento.asc(),
            ContaReceber.id.asc(),
        )
        .all()
    )


@router.get(
    "/{conta_id}",
    response_model=ContaReceberResposta,
)
def buscar_conta_receber(
    conta_id: int,
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("contas_receber.visualizar")),
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

    return conta


@router.put(
    "/{conta_id}",
    response_model=ContaReceberResposta,
)
def atualizar_conta_receber(
    conta_id: int,
    dados: ContaReceberAtualizar,
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("contas_receber.editar")),
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

    status_anterior = conta.status

    campos = dados.model_dump(
        exclude_unset=True
    )

    if "status" in campos:
        campos["status"] = validar_status(
            campos["status"]
        )

    if "forma_pagamento" in campos:
        campos["forma_pagamento"] = validar_forma_pagamento(
            campos["forma_pagamento"]
        )

    if "descricao" in campos and campos["descricao"]:
        campos["descricao"] = campos["descricao"].strip()

    if "categoria" in campos and campos["categoria"]:
        campos["categoria"] = campos["categoria"].strip()

    novo_status = campos.get(
        "status",
        conta.status,
    )

    # --------------------------------------------------------
    # PROTEÇÃO DE INTEGRIDADE FINANCEIRA
    # --------------------------------------------------------
    # Uma conta já recebida não pode ter seus dados financeiros
    # alterados diretamente, pois o recebimento já foi registrado
    # no Caixa.
    if status_anterior == "pago":
        campos_financeiros = {
            "valor",
            "valor_pago",
            "forma_pagamento",
            "data_pagamento",
        }

        campos_financeiros_alterados = (
            campos_financeiros.intersection(campos.keys())
        )

        if campos_financeiros_alterados:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Esta conta já está paga e possui lançamento "
                    "registrado no Caixa. Não é permitido alterar "
                    "valor, valor pago, forma de pagamento ou data "
                    "de pagamento diretamente. Para corrigir um "
                    "recebimento, será necessário utilizar uma rotina "
                    "de estorno/correção."
                ),
            )

    # Proteção financeira:
    # uma conta já recebida não pode voltar diretamente
    # para pendente, vencida ou cancelada.
    if (
        status_anterior == "pago"
        and novo_status != "pago"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Uma conta já recebida não pode voltar "
                "para pendente, vencida ou cancelada. "
                "Para corrigir um recebimento, será necessário "
                "utilizar uma rotina de estorno."
            ),
        )

    if (
        status_anterior == "cancelado"
        and novo_status == "pago"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Uma conta cancelada não pode ser recebida "
                "diretamente. Reative a conta antes do recebimento."
            ),
        )

    nova_data_pagamento = campos.get(
        "data_pagamento",
        conta.data_pagamento,
    )

    novo_valor_pago = campos.get(
        "valor_pago",
        conta.valor_pago,
    )

    nova_forma_pagamento = campos.get(
        "forma_pagamento",
        conta.forma_pagamento,
    )

    if novo_status == "pago":
        if nova_data_pagamento is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Uma conta com status pago "
                    "deve possuir data de pagamento."
                ),
            )

        if novo_valor_pago is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Uma conta com status pago "
                    "deve possuir valor pago."
                ),
            )

        if not nova_forma_pagamento:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Uma conta com status pago "
                    "deve possuir forma de pagamento."
                ),
            )

    for campo, valor in campos.items():
        setattr(conta, campo, valor)

    # Só cria movimentação quando ocorre:
    #
    # pendente/vencido -> pago
    #
    # Se já estava pago, NÃO cria outra entrada.
    if (
        novo_status == "pago"
        and status_anterior != "pago"
    ):
        db.flush()

        criar_movimentacao_recebimento(
            db=db,
            conta=conta,
            valor_recebido=novo_valor_pago,
            forma_pagamento=nova_forma_pagamento,
        )

    db.commit()
    db.refresh(conta)

    return conta


@router.delete(
    "/{conta_id}",
)
def desativar_conta_receber(
    conta_id: int,
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("contas_receber.editar")),
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

    conta.ativo = False

    db.commit()

    return {
        "status": "ok",
        "message": "Conta a receber desativada com sucesso.",
    }
