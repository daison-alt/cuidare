from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.conta_pagar import ContaPagar
from app.schemas.conta_pagar import (
    ContaPagarAtualizar,
    ContaPagarCriar,
    ContaPagarResposta,
    FORMAS_PAGAMENTO_PERMITIDAS,
    STATUS_PERMITIDOS,
)


router = APIRouter(
    prefix="/contas-pagar",
    tags=["Contas a Pagar"],
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


@router.post(
    "",
    response_model=ContaPagarResposta,
    status_code=201,
)
def criar_conta_pagar(
    dados: ContaPagarCriar,
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

    conta = ContaPagar(
        fornecedor=(
            dados.fornecedor.strip()
            if dados.fornecedor
            else None
        ),
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
    response_model=list[ContaPagarResposta],
)
def listar_contas_pagar(
    status: str | None = Query(default=None),
    fornecedor: str | None = Query(default=None),
    vencimento: date | None = Query(default=None),
    incluir_inativos: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    consulta = db.query(ContaPagar)

    if not incluir_inativos:
        consulta = consulta.filter(
            ContaPagar.ativo == True
        )

    if status is not None:
        status_validado = validar_status(status)

        consulta = consulta.filter(
            ContaPagar.status == status_validado
        )

    if fornecedor is not None:
        consulta = consulta.filter(
            ContaPagar.fornecedor.ilike(
                f"%{fornecedor}%"
            )
        )

    if vencimento is not None:
        consulta = consulta.filter(
            ContaPagar.vencimento == vencimento
        )

    return (
        consulta
        .order_by(
            ContaPagar.vencimento.asc(),
            ContaPagar.id.asc(),
        )
        .all()
    )


@router.get(
    "/{conta_id}",
    response_model=ContaPagarResposta,
)
def buscar_conta_pagar(
    conta_id: int,
    db: Session = Depends(get_db),
):
    conta = (
        db.query(ContaPagar)
        .filter(
            ContaPagar.id == conta_id,
            ContaPagar.ativo == True,
        )
        .first()
    )

    if not conta:
        raise HTTPException(
            status_code=404,
            detail="Conta a pagar não encontrada.",
        )

    return conta


@router.put(
    "/{conta_id}",
    response_model=ContaPagarResposta,
)
def atualizar_conta_pagar(
    conta_id: int,
    dados: ContaPagarAtualizar,
    db: Session = Depends(get_db),
):
    conta = (
        db.query(ContaPagar)
        .filter(
            ContaPagar.id == conta_id,
            ContaPagar.ativo == True,
        )
        .first()
    )

    if not conta:
        raise HTTPException(
            status_code=404,
            detail="Conta a pagar não encontrada.",
        )

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

    if "fornecedor" in campos and campos["fornecedor"]:
        campos["fornecedor"] = campos["fornecedor"].strip()

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

    for campo, valor in campos.items():
        setattr(conta, campo, valor)

    db.commit()
    db.refresh(conta)

    return conta


@router.delete(
    "/{conta_id}",
)
def desativar_conta_pagar(
    conta_id: int,
    db: Session = Depends(get_db),
):
    conta = (
        db.query(ContaPagar)
        .filter(
            ContaPagar.id == conta_id,
            ContaPagar.ativo == True,
        )
        .first()
    )

    if not conta:
        raise HTTPException(
            status_code=404,
            detail="Conta a pagar não encontrada.",
        )

    conta.ativo = False

    db.commit()

    return {
        "status": "ok",
        "message": "Conta a pagar desativada com sucesso.",
    }
