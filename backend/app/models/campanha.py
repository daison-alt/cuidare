from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, Text, Boolean, DateTime, Float
from app.database import Base

class Campanha(Base):
    __tablename__ = "campanhas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    tipo = Column(String(50), nullable=False)
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date, nullable=True)
    regra = Column(Text, nullable=True)
    beneficio = Column(String(255), nullable=True)
    percentual_desconto = Column(Float, nullable=True)
    publico = Column(String(100), default="Todos", nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
