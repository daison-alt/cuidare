from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

from app.database import Base

class Indicacao(Base):
    __tablename__ = "indicacoes"

    id = Column(Integer, primary_key=True, index=True)
    indicador_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    indicado_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    beneficio = Column(String(100), default="10% de desconto", nullable=False)
    status = Column(String(30), default="pendente", nullable=False)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
