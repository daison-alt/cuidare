from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text

from app.database import Base


class RecebimentoConta(Base):
    __tablename__ = "recebimentos_conta"

    id = Column(Integer, primary_key=True, index=True)

    conta_receber_id = Column(
        Integer,
        ForeignKey("contas_receber.id"),
        nullable=False,
        index=True,
    )

    data_recebimento = Column(
        Date,
        nullable=False,
        default=date.today,
        index=True,
    )

    valor_total = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    observacoes = Column(
        Text,
        nullable=True,
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

    atualizado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
