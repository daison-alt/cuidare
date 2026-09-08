from decimal import Decimal
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.caixa import Caixa
from app.models.conferencia_caixa import ConferenciaCaixa
from app.models.movimentacao_caixa import MovimentacaoCaixa
from app.schemas.caixa import (
    CaixaCriar,
    CaixaFechar,
    CaixaResposta,
)
from app.security.autorizacao import exigir_permissao
from app.schemas.movimentacao_caixa import (
    MovimentacaoCaixaCriar,
    MovimentacaoCaixaResposta,
    TIPOS_MOVIMENTACAO,
    FORMAS_PAGAMENTO_PERMITIDAS,
)


router = APIRouter(
    prefix="/caixa",
    tags=["Caixa"],
)


def validar_forma_pagamento(forma_pagamento: str):
    forma = forma_pagamento.strip().lower()

    if forma not in FORMAS_PAGAMENTO_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Forma de pagamento inválida. "
                "Use: dinheiro, pix, cartao_credito, "
                "cartao_debito ou transferencia."
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


def obter_ultimo_caixa_fechado(db: Session):
    """
    Retorna o último caixa efetivamente fechado.

    O último caixa fechado é a origem possível do troco
    que será utilizado na próxima abertura.
    """
    return (
        db.query(Caixa)
        .filter(
            Caixa.status == "fechado",
            Caixa.ativo.is_(True),
        )
        .order_by(
            Caixa.data_fechamento.desc(),
            Caixa.id.desc(),
        )
        .first()
    )


def obter_troco_anterior(db: Session):
    """
    Retorna o último caixa fechado e o troco deixado nele.
    """
    caixa_anterior = obter_ultimo_caixa_fechado(db)

    if not caixa_anterior:
        return None, Decimal("0.00")

    troco = Decimal(
        str(
            caixa_anterior.troco_proxima_abertura
            or 0
        )
    )

    if troco < 0:
        troco = Decimal("0.00")

    return caixa_anterior, troco


def calcular_dinheiro_esperado(
    db: Session,
    caixa_id: int,
    saldo_inicial,
):
    """
    Calcula exclusivamente o dinheiro físico esperado no caixa.

    PIX, cartões e transferências não alteram
    o saldo físico.
    """
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
        forma_pagamento = (
            movimento.forma_pagamento or ""
        ).strip().lower()

        if forma_pagamento != "dinheiro":
            continue

        valor = Decimal(
            str(movimento.valor or 0)
        )

        if movimento.tipo in {
            "entrada",
            "suprimento",
        }:
            saldo += valor

        elif movimento.tipo in {
            "saida",
            "sangria",
        }:
            saldo -= valor

    return saldo


def calcular_saldo(
    db: Session,
    caixa_id: int,
    saldo_inicial,
):
    """
    Calcula exclusivamente o saldo físico em dinheiro.

    PIX, cartões e transferências não alteram
    o dinheiro físico disponível no caixa.
    """
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
        forma_pagamento = (
            movimento.forma_pagamento or ""
        ).strip().lower()

        if forma_pagamento != "dinheiro":
            continue

        valor = Decimal(str(movimento.valor or 0))

        if movimento.tipo in {
            "entrada",
            "suprimento",
        }:
            saldo += valor

        elif movimento.tipo in {
            "saida",
            "sangria",
        }:
            saldo -= valor

    return saldo


# ============================================================
# TROCO DA PRÓXIMA ABERTURA
# ============================================================

@router.get("/proximo-troco")
def consultar_proximo_troco(
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("caixa.visualizar")),
    """
    Consulta quanto foi deixado no último caixa fechado
    para servir como troco na próxima abertura.

    Este endpoint apenas consulta.
    Não altera o banco.
    """
    caixa_anterior, troco = obter_troco_anterior(db)

    return {
        "existe_caixa_anterior": caixa_anterior is not None,
        "caixa_origem_id": (
            caixa_anterior.id
            if caixa_anterior
            else None
        ),
        "data_fechamento": (
            caixa_anterior.data_fechamento
            if caixa_anterior
            else None
        ),
        "troco": troco,
    }


# ============================================================
# CAIXA ABERTO
# ============================================================

@router.get(
    "/aberto",
    response_model=CaixaResposta,
)
def consultar_caixa_aberto(
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("caixa.visualizar")),
    caixa = obter_caixa_aberto(db)

    if not caixa:
        raise HTTPException(
            status_code=404,
            detail="Não existe caixa aberto.",
        )

    return caixa


# ============================================================
# ABERTURA DO CAIXA
# ============================================================

@router.post(
    "/abrir",
    response_model=CaixaResposta,
)
def abrir_caixa(
    dados: CaixaCriar,
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("caixa.abrir")),
    caixa_aberto = obter_caixa_aberto(db)

    if caixa_aberto:
        raise HTTPException(
            status_code=400,
            detail="Já existe um caixa aberto.",
        )

    saldo_inicial = Decimal(
        str(dados.saldo_inicial or 0)
    )

    caixa_origem_troco_id = None

    # Se solicitado, utiliza automaticamente o troco
    # deixado pelo último caixa fechado.
    if dados.usar_troco_anterior:
        caixa_anterior, troco_anterior = (
            obter_troco_anterior(db)
        )

        if (
            caixa_anterior is not None
            and troco_anterior > 0
        ):
            saldo_inicial = troco_anterior
            caixa_origem_troco_id = caixa_anterior.id

    caixa = Caixa(
        saldo_inicial=saldo_inicial,
        status="aberto",
        observacoes=dados.observacoes,
        ativo=True,
        troco_proxima_abertura=Decimal("0.00"),
        valor_retirado=Decimal("0.00"),
        caixa_origem_troco_id=(
            caixa_origem_troco_id
        ),
    )

    db.add(caixa)
    db.commit()
    db.refresh(caixa)

    return caixa


# ============================================================
# FECHAMENTO DO CAIXA
# ============================================================

@router.post(
    "/fechar",
    response_model=CaixaResposta,
)
def fechar_caixa(
    dados: CaixaFechar,
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("caixa.fechar")),
    caixa = obter_caixa_aberto(db)

    if not caixa:
        raise HTTPException(
            status_code=404,
            detail="Não existe caixa aberto para fechar.",
        )

    dinheiro_informado = Decimal(
        str(dados.saldo_final or 0)
    )

    troco_proxima_abertura = Decimal(
        str(
            dados.troco_proxima_abertura
            or 0
        )
    )

    if dinheiro_informado < 0:
        raise HTTPException(
            status_code=400,
            detail="O dinheiro físico contado não pode ser negativo.",
        )

    if troco_proxima_abertura < 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "O troco para a próxima abertura "
                "não pode ser negativo."
            ),
        )

    if troco_proxima_abertura > dinheiro_informado:
        raise HTTPException(
            status_code=400,
            detail=(
                "O troco para a próxima abertura "
                "não pode ser maior que o dinheiro "
                "físico contado."
            ),
        )

    dinheiro_esperado = calcular_dinheiro_esperado(
        db,
        caixa.id,
        caixa.saldo_inicial,
    )

    diferenca = (
        dinheiro_informado
        - dinheiro_esperado
    )

    # Valor que efetivamente será retirado do caixa.
    valor_retirado = (
        dinheiro_informado
        - troco_proxima_abertura
    )

    caixa.saldo_final = dinheiro_informado
    caixa.troco_proxima_abertura = (
        troco_proxima_abertura
    )
    caixa.valor_retirado = valor_retirado

    if dados.observacoes is not None:
        caixa.observacoes = dados.observacoes

    caixa.data_fechamento = datetime.utcnow()
    caixa.status = "fechado"

    # --------------------------------------------------------
    # Mantém a conferência financeira existente.
    # O troco NÃO é uma movimentação financeira.
    # --------------------------------------------------------

    conferencia = (
        db.query(ConferenciaCaixa)
        .filter(
            ConferenciaCaixa.caixa_id == caixa.id
        )
        .first()
    )

    if conferencia:
        conferencia.dinheiro_esperado = (
            dinheiro_esperado
        )
        conferencia.dinheiro_contado = (
            dinheiro_informado
        )
        conferencia.diferenca_dinheiro = (
            diferenca
        )

    db.commit()
    db.refresh(caixa)

    return caixa


# ============================================================
# MOVIMENTAÇÕES
# ============================================================

@router.get(
    "/movimentacoes",
    response_model=list[MovimentacaoCaixaResposta],
)
def listar_movimentacoes(
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("caixa.visualizar")),
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
            MovimentacaoCaixa.id.desc()
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
    usuario=Depends(exigir_permissao("caixa.entrada")),
    caixa = obter_caixa_aberto(db)

    if not caixa:
        raise HTTPException(
            status_code=400,
            detail=(
                "Não existe caixa aberto "
                "para registrar movimentação."
            ),
        )

    tipo = dados.tipo.strip().lower()

    if tipo not in TIPOS_MOVIMENTACAO:
        raise HTTPException(
            status_code=400,
            detail=(
                "Tipo de movimentação inválido. "
                "Use entrada, saida, suprimento ou sangria."
            ),
        )

    forma_pagamento = validar_forma_pagamento(
        dados.forma_pagamento
    )

    valor = Decimal(str(dados.valor or 0))

    if valor <= 0:
        raise HTTPException(
            status_code=400,
            detail="O valor da movimentação deve ser maior que zero.",
        )

    # Sangria e saída em dinheiro não podem ultrapassar
    # o dinheiro físico disponível.
    if (
        forma_pagamento == "dinheiro"
        and tipo in {"saida", "sangria"}
    ):
        saldo_atual = calcular_saldo(
            db,
            caixa.id,
            caixa.saldo_inicial,
        )

        if valor > saldo_atual:
            raise HTTPException(
                status_code=400,
                detail=(
                    "O valor da saída/sangria é maior "
                    "que o dinheiro físico disponível."
                ),
            )

    movimento = MovimentacaoCaixa(
        caixa_id=caixa.id,
        tipo=tipo,
        categoria=dados.categoria,
        descricao=dados.descricao,
        valor=valor,
        forma_pagamento=forma_pagamento,
        observacoes=dados.observacoes,
        ativo=True,
    )

    db.add(movimento)
    db.commit()
    db.refresh(movimento)

    return movimento


# ============================================================
# SALDO
# ============================================================

@router.get("/saldo")
def consultar_saldo(
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("caixa.visualizar")),
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


# ============================================================
# HISTÓRICO
# ============================================================

@router.get(
    "/historico",
    response_model=list[CaixaResposta],
)
def listar_caixas_fechados(
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("caixa.visualizar")),
    return (
        db.query(Caixa)
        .filter(
            Caixa.status == "fechado",
            Caixa.ativo.is_(True),
        )
        .order_by(
            Caixa.data_fechamento.desc(),
            Caixa.id.desc(),
        )
        .all()
    )


@router.get(
    "/historico/{caixa_id}",
)
def detalhes_caixa_historico(
    caixa_id: int,
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("caixa.visualizar")),
    caixa = (
        db.query(Caixa)
        .filter(
            Caixa.id == caixa_id,
            Caixa.ativo.is_(True),
        )
        .first()
    )

    if not caixa:
        raise HTTPException(
            status_code=404,
            detail="Caixa não encontrado.",
        )

    movimentacoes = (
        db.query(MovimentacaoCaixa)
        .filter(
            MovimentacaoCaixa.caixa_id == caixa.id,
            MovimentacaoCaixa.ativo.is_(True),
        )
        .order_by(
            MovimentacaoCaixa.id.desc()
        )
        .all()
    )

    conferencia = (
        db.query(ConferenciaCaixa)
        .filter(
            ConferenciaCaixa.caixa_id == caixa.id
        )
        .first()
    )

    return {
        "caixa": caixa,
        "movimentacoes": movimentacoes,
        "conferencia": conferencia,
    }
