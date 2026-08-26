from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text

from app.database import Base


class MovimentacaoCaixa(Base):
    __tablename__ = "movimentacoes_caixa"

    id = Column(Integer, primary_key=True, index=True)

    caixa_id = Column(
        Integer,
        ForeignKey("caixas.id"),
        nullable=False,
        index=True,
    )

    tipo = Column(String(20), nullable=False)
    categoria = Column(String(50), nullable=False)

    descricao = Column(String(255), nullable=False)

    valor = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    forma_pagamento = Column(String(50), nullable=True)

    observacoes = Column(Text, nullable=True)

    data_movimentacao = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    ativo = Column(Boolean, nullable=False, default=True)

    criado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    atualizado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
