from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, Text

from app.database import Base


class PlanoPilates(Base):
    __tablename__ = "planos_pilates"

    id = Column(Integer, primary_key=True, index=True)

    nome = Column(String(150), nullable=False, unique=True, index=True)

    periodo = Column(
        String(20),
        nullable=False,
        index=True,
    )

    frequencia_semanal = Column(
        Integer,
        nullable=False,
    )

    quantidade_aulas = Column(
        Integer,
        nullable=False,
    )

    valor = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    descricao = Column(Text, nullable=True)

    ativo = Column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
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
