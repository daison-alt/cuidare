from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.database import Base

class Campanha(Base):
    __tablename__ = "campanhas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    segmento_alvo = Column(String(100), nullable=False) # Ex: Inativos (+60 dias), Aniversariantes, Pilates
    canal_envio = Column(String(50), default="WhatsApp") # WhatsApp, E-mail, Ambos
    mensagem_template = Column(Text, nullable=False)
    status = Column(String(50), default="Rascunho") # Rascunho, Disparada, Concluída
    total_destinatarios = Column(Integer, default=0)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_envio = Column(DateTime, nullable=True)
