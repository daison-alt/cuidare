from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.caixa import Caixa
from app.models.movimentacao_caixa import MovimentacaoCaixa
from app.schemas.caixa import (
    CaixaCriar,
    CaixaFechar,
    CaixaResposta,
)
from app.schemas.movimentacao_caixa import (
    MovimentacaoCaixaCriar,
    MovimentacaoCaixaResposta,
    TIPOS_MOVIMENTACAO,
)

router = APIRouter(
    prefix="/caixa",
    tags=["Caixa"],
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


def calcular_saldo(db: Session, caixa_id: int, saldo_inicial):
    movimentacoes = (
        db.query(MovimentacaoCaixa)
        .filter(
            MovimentacaoCaixa.caixa_id == caixa_id,
            MovimentacaoCaixa.ativo.is_(True),
        )
        .all()
    )

    saldo = Decimal(str(saldo_inicial or 0))

    for movimento in movimentacoes:
        valor = Decimal(str(movimento.valor or 0))

        if movimento.tipo in {"entrada", "suprimento"}:
            saldo += valor
        elif movimento.tipo in {"saida", "sangria"}:
            saldo -= valor

    return saldo


@router.get("/aberto", response_model=CaixaResposta)
def consultar_caixa_aberto(
    db: Session = Depends(get_db),
):
    caixa = obter_caixa_aberto(db)

    if not caixa:
        raise HTTPException(
            status_code=404,
            detail="Não existe caixa aberto.",
        )

    return caixa


@router.post(
    "/abrir",
    response_model=CaixaResposta,
)
def abrir_caixa(
    dados: CaixaCriar,
    db: Session = Depends(get_db),
):
    caixa_aberto = obter_caixa_aberto(db)

    if caixa_aberto:
        raise HTTPException(
            status_code=400,
            detail="Já existe um caixa aberto.",
        )

    caixa = Caixa(
        saldo_inicial=dados.saldo_inicial,
        status="aberto",
        observacoes=dados.observacoes,
        ativo=True,
    )

    db.add(caixa)
    db.commit()
    db.refresh(caixa)

    return caixa


@router.post(
    "/fechar",
    response_model=CaixaResposta,
)
def fechar_caixa(
    dados: CaixaFechar,
    db: Session = Depends(get_db),
):
    caixa = obter_caixa_aberto(db)

    if not caixa:
        raise HTTPException(
            status_code=404,
            detail="Não existe caixa aberto.",
        )

    saldo_calculado = calcular_saldo(
        db,
        caixa.id,
        caixa.saldo_inicial,
    )

    caixa.saldo_final = dados.saldo_final
    caixa.data_fechamento = __import__(
        "datetime"
    ).datetime.utcnow()
    caixa.status = "fechado"

    if dados.observacoes:
        caixa.observacoes = dados.observacoes

    db.commit()
    db.refresh(caixa)

    return caixa


@router.get(
    "/movimentacoes",
    response_model=list[MovimentacaoCaixaResposta],
)
def listar_movimentacoes(
    db: Session = Depends(get_db),
):
    caixa = obter_caixa_aberto(db)

    if not caixa:
        return []

    return (
        db.query(MovimentacaoCaixa)
        .filter(
            MovimentacaoCaixa.caixa_id == caixa.id,
            MovimentacaoCaixa.ativo.is_(True),
        )
        .order_by(
            MovimentacaoCaixa.data_movimentacao.desc()
        )
        .all()
    )


@router.post(
    "/movimentacoes",
    response_model=MovimentacaoCaixaResposta,
)
def criar_movimentacao(
    dados: MovimentacaoCaixaCriar,
    db: Session = Depends(get_db),
):
    caixa = obter_caixa_aberto(db)

    if not caixa:
        raise HTTPException(
            status_code=400,
            detail="Abra o caixa antes de registrar movimentações.",
        )

    if dados.tipo not in TIPOS_MOVIMENTACAO:
        raise HTTPException(
            status_code=400,
            detail=(
                "Tipo de movimentação inválido. "
                "Use entrada, saida, sangria ou suprimento."
            ),
        )

    movimento = MovimentacaoCaixa(
        caixa_id=caixa.id,
        tipo=dados.tipo,
        categoria=dados.categoria,
        descricao=dados.descricao,
        valor=dados.valor,
        forma_pagamento=dados.forma_pagamento,
        observacoes=dados.observacoes,
        ativo=True,
    )

    db.add(movimento)
    db.commit()
    db.refresh(movimento)

    return movimento


@router.get(
    "/saldo",
)
def consultar_saldo(
    db: Session = Depends(get_db),
):
    caixa = obter_caixa_aberto(db)

    if not caixa:
        raise HTTPException(
            status_code=404,
            detail="Não existe caixa aberto.",
        )

    saldo = calcular_saldo(
        db,
        caixa.id,
        caixa.saldo_inicial,
    )

    return {
        "caixa_id": caixa.id,
        "saldo_inicial": caixa.saldo_inicial,
        "saldo_atual": saldo,
    }
