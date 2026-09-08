from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)

from app.database import Base


class ConferenciaCaixa(Base):
    __tablename__ = "conferencias_caixa"

    id = Column(Integer, primary_key=True, index=True)

    caixa_id = Column(
        Integer,
        ForeignKey("caixas.id"),
        nullable=False,
        index=True,
    )

    dinheiro_esperado = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    dinheiro_informado = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    pix_esperado = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    pix_informado = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    cartao_credito_esperado = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    cartao_credito_informado = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    cartao_debito_esperado = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    cartao_debito_informado = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    transferencia_esperada = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    transferencia_informada = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    total_esperado = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    total_informado = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    diferenca_dinheiro = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    diferenca_eletronicos = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    diferenca_total = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    observacoes = Column(Text, nullable=True)

    conferido_por = Column(String(150), nullable=True)

    data_conferencia = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    ativo = Column(
        Boolean,
        nullable=False,
        default=True,
    )
