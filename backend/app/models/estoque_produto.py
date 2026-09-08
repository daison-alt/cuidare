from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, Text

from app.database import Base


class EstoqueProduto(Base):
    __tablename__ = "estoque_produtos"

    id = Column(Integer, primary_key=True, index=True)

    nome = Column(String(200), nullable=False, index=True)
    categoria = Column(String(100), nullable=True)
    unidade = Column(String(30), nullable=False, default="unidade")

    quantidade_atual = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    estoque_minimo = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    fornecedor = Column(String(200), nullable=True)

    observacoes = Column(Text, nullable=True)

    ativo = Column(Boolean, nullable=False, default=True, index=True)

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
