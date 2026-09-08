from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String

from app.database import Base


class RecebimentoContaForma(Base):
    __tablename__ = "recebimentos_conta_formas"

    id = Column(Integer, primary_key=True, index=True)

    recebimento_id = Column(
        Integer,
        ForeignKey("recebimentos_conta.id"),
        nullable=False,
        index=True,
    )

    forma_pagamento = Column(
        String(50),
        nullable=False,
        index=True,
    )

    valor = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    ativo = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    criado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
