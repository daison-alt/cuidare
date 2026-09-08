from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text

from app.database import Base


class MovimentacaoEstoque(Base):
    __tablename__ = "movimentacoes_estoque"

    id = Column(Integer, primary_key=True, index=True)

    produto_id = Column(
        Integer,
        ForeignKey("estoque_produtos.id"),
        nullable=False,
        index=True,
    )

    tipo = Column(String(20), nullable=False)

    quantidade = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    descricao = Column(String(255), nullable=False)

    fornecedor = Column(String(200), nullable=True)

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
