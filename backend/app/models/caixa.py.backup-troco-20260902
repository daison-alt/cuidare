from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, Text

from app.database import Base


class Caixa(Base):
    __tablename__ = "caixas"

    id = Column(Integer, primary_key=True, index=True)

    data_abertura = Column(DateTime, nullable=False, default=datetime.utcnow)
    data_fechamento = Column(DateTime, nullable=True)

    saldo_inicial = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    saldo_final = Column(Numeric(12, 2), nullable=True)

    status = Column(String(20), nullable=False, default="aberto")

    observacoes = Column(Text, nullable=True)

    ativo = Column(Boolean, nullable=False, default=True)

    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)
    atualizado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
