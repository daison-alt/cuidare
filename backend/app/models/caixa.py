from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text

from app.database import Base


class Caixa(Base):
    __tablename__ = "caixas"

    id = Column(Integer, primary_key=True, index=True)

    data_abertura = Column(DateTime, nullable=False, default=datetime.utcnow)
    data_fechamento = Column(DateTime, nullable=True)

    saldo_inicial = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    saldo_final = Column(Numeric(12, 2), nullable=True)

    # ========================================================
    # CONTROLE DE TROCO
    # ========================================================
    # Valor físico deixado no caixa para a próxima abertura.
    troco_proxima_abertura = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    # Valor físico retirado no fechamento:
    # dinheiro contado - troco deixado.
    valor_retirado = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    # Identifica de qual caixa veio o troco utilizado
    # como saldo inicial desta abertura.
    caixa_origem_troco_id = Column(
        Integer,
        ForeignKey("caixas.id"),
        nullable=True,
    )

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
