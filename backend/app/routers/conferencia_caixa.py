from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.caixa import Caixa
from app.models.conferencia_caixa import ConferenciaCaixa
from app.models.movimentacao_caixa import MovimentacaoCaixa
from app.schemas.conferencia_caixa import (
    ConferenciaCaixaCriar,
    ConferenciaCaixaResposta,
)
from app.security.autorizacao import exigir_permissao


router = APIRouter(
    prefix="/caixa",
    tags=["Conferência de Caixa"],
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


def calcular_conferencia(db: Session, caixa: Caixa):
    movimentacoes = (
        db.query(MovimentacaoCaixa)
        .filter(
            MovimentacaoCaixa.caixa_id == caixa.id,
            MovimentacaoCaixa.ativo.is_(True),
        )
        .all()
    )

    valores = {
        "dinheiro": Decimal("0.00"),
        "pix": Decimal("0.00"),
        "cartao_credito": Decimal("0.00"),
        "cartao_debito": Decimal("0.00"),
        "transferencia": Decimal("0.00"),
    }

    for movimento in movimentacoes:
        valor = Decimal(str(movimento.valor or 0))
        if movimento.tipo in ("saida", "sangria"):
            valor = -valor
        forma = movimento.forma_pagamento
        if forma in valores:
            valores[forma] += valor

    dinheiro_esperado = Decimal(str(caixa.saldo_inicial or 0)) + valores["dinheiro"]
    pix_esperado = valores["pix"]
    cartao_credito_esperado = valores["cartao_credito"]
    cartao_debito_esperado = valores["cartao_debito"]
    transferencia_esperada = valores["transferencia"]
    total_esperado = (
        dinheiro_esperado
        + pix_esperado
        + cartao_credito_esperado
        + cartao_debito_esperado
        + transferencia_esperada
    )
    total_eletronico = (
        pix_esperado
        + cartao_credito_esperado
        + cartao_debito_esperado
        + transferencia_esperada
    )

    return {
        "dinheiro_esperado": dinheiro_esperado,
        "pix_esperado": pix_esperado,
        "cartao_credito_esperado": cartao_credito_esperado,
        "cartao_debito_esperado": cartao_debito_esperado,
        "transferencia_esperada": transferencia_esperada,
        "total_esperado": total_esperado,
        "total_eletronico": total_eletronico,
    }


@router.get("/conferencia")
def consultar_conferencia(
    db: Session = Depends(get_db),
    usuario=Depends(exigir_permissao("caixa.conferencia")),
):
    caixa = obter_caixa_aberto(db)
    if not caixa:
        raise HTTPException(status_code=404, detail="Não existe caixa aberto.")

    esperado = calcular_conferencia(db, caixa)
    ultima = (
        db.query(ConferenciaCaixa)
        .filter(
            ConferenciaCaixa.caixa_id == caixa.id,
            ConferenciaCaixa.ativo.is_(True),
        )
        .order_by(ConferenciaCaixa.data_conferencia.desc())
        .first()
    )

    return {
        "caixa_id": caixa.id,
        "dinheiro_esperado": esperado["dinheiro_esperado"],
        "pix_esperado": esperado["pix_esperado"],
        "cartao_credito_esperado": esperado["cartao_credito_esperado"],
        "cartao_debito_esperado": esperado["cartao_debito_esperado"],
        "transferencia_esperada": esperado["transferencia_esperada"],
        "total_esperado": esperado["total_esperado"],
        "total_eletronico_esperado": esperado["total_eletronico"],
        "ultima_conferencia": ultima,
    }


@router.post("/conferencia", response_model=ConferenciaCaixaResposta)
def registrar_conferencia(
    dados: ConferenciaCaixaCriar,
    db: Session = Depends(get_db),
    usuario=Depends(exigir_permissao("caixa.conferencia")),
):
    caixa = obter_caixa_aberto(db)
    if not caixa:
        raise HTTPException(status_code=404, detail="Não existe caixa aberto.")

    esperado = calcular_conferencia(db, caixa)

    dinheiro_informado = Decimal(str(dados.dinheiro_informado or 0))
    pix_informado = Decimal(str(dados.pix_informado or 0))
    cartao_credito_informado = Decimal(str(dados.cartao_credito_informado or 0))
    cartao_debito_informado = Decimal(str(dados.cartao_debito_informado or 0))
    transferencia_informada = Decimal(str(dados.transferencia_informada or 0))

    valores_informados = {
        "dinheiro": dinheiro_informado,
        "pix": pix_informado,
        "cartao_credito": cartao_credito_informado,
        "cartao_debito": cartao_debito_informado,
        "transferencia": transferencia_informada,
    }
    if any(valor < 0 for valor in valores_informados.values()):
        raise HTTPException(status_code=400, detail="Os valores informados não podem ser negativos.")

    total_informado = sum(valores_informados.values(), Decimal("0.00"))
    total_eletronico_informado = (
        pix_informado
        + cartao_credito_informado
        + cartao_debito_informado
        + transferencia_informada
    )
    diferenca_dinheiro = dinheiro_informado - esperado["dinheiro_esperado"]
    diferenca_eletronicos = total_eletronico_informado - esperado["total_eletronico"]
    diferenca_total = total_informado - esperado["total_esperado"]

    conferencia = ConferenciaCaixa(
        caixa_id=caixa.id,
        dinheiro_esperado=esperado["dinheiro_esperado"],
        dinheiro_informado=dinheiro_informado,
        pix_esperado=esperado["pix_esperado"],
        pix_informado=pix_informado,
        cartao_credito_esperado=esperado["cartao_credito_esperado"],
        cartao_credito_informado=cartao_credito_informado,
        cartao_debito_esperado=esperado["cartao_debito_esperado"],
        cartao_debito_informado=cartao_debito_informado,
        transferencia_esperada=esperado["transferencia_esperada"],
        transferencia_informada=transferencia_informada,
        total_esperado=esperado["total_esperado"],
        total_informado=total_informado,
        diferenca_dinheiro=diferenca_dinheiro,
        diferenca_eletronicos=diferenca_eletronicos,
        diferenca_total=diferenca_total,
        observacoes=dados.observacoes,
        conferido_por=dados.conferido_por,
    )

    db.add(conferencia)
    db.commit()
    db.refresh(conferencia)
    return conferencia
