from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    paciente_id = Column(Integer, nullable=False)
    paciente_nome = Column(String(200), nullable=False)
    paciente_cpf = Column(String(20), nullable=False)
    conteudo_html = Column(Text, nullable=False)
    status = Column(String(50), default="Pendente") # Pendente, Assinado, Cancelado
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_assinatura = Column(DateTime, nullable=True)
