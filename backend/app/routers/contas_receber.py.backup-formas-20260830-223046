from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.conta_receber import ContaReceber
from app.models.caixa import Caixa
from app.models.movimentacao_caixa import MovimentacaoCaixa
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
                "cartao_debito, transferencia ou outro."
            ),
        )

    return forma


@router.post(
    "",
    response_model=ContaReceberResposta,
    status_code=201,
)
def criar_conta_receber(
    dados: ContaReceberCriar,
    db: Session = Depends(get_db),
):
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
    consulta = db.query(ContaReceber)

    if not incluir_inativos:
        consulta = consulta.filter(
            ContaReceber.ativo == True
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
    conta = (
        db.query(ContaReceber)
        .filter(
            ContaReceber.id == conta_id,
            ContaReceber.ativo == True,
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
    conta = (
        db.query(ContaReceber)
        .filter(
            ContaReceber.id == conta_id,
            ContaReceber.ativo == True,
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

        if nova_forma_pagamento is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Uma conta com status pago "
                    "deve possuir forma de pagamento."
                ),
            )

    # Atualiza a conta
    for campo, valor in campos.items():
        setattr(conta, campo, valor)

    # Se a conta acabou de passar para paga,
    # registra automaticamente a entrada no Caixa.
    if status_anterior != "pago" and novo_status == "pago":
        caixa = (
            db.query(Caixa)
            .filter(
                Caixa.status == "aberto",
                Caixa.ativo.is_(True),
            )
            .order_by(Caixa.id.desc())
            .first()
        )

        if not caixa:
            db.rollback()

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
            valor=novo_valor_pago,
            forma_pagamento=nova_forma_pagamento,
            observacoes=(
                f"Conta a receber #{conta.id}"
            ),
            ativo=True,
        )

        db.add(movimento)

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
    conta = (
        db.query(ContaReceber)
        .filter(
            ContaReceber.id == conta_id,
            ContaReceber.ativo == True,
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
