from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text

from app.database import Base


class AuditoriaEstorno(Base):
    __tablename__ = "auditorias_estorno"

    id = Column(Integer, primary_key=True, index=True)
    recebimento_id = Column(Integer, ForeignKey("recebimentos_conta.id"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    caixa_origem_id = Column(Integer, nullable=False)
    caixa_estorno_id = Column(Integer, nullable=False)
    valor = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    motivo = Column(Text, nullable=False)
    movimentacoes_originais_ids = Column(String(500), nullable=True)
    movimentacoes_estorno_ids = Column(String(500), nullable=True)
    data_estorno = Column(DateTime, nullable=False, default=datetime.utcnow)
