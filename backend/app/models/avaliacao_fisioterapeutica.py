"""Avaliacoes clinicas independentes das evolucoes existentes."""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
from app.database import Base


class AvaliacaoFisioterapeutica(Base):
    __tablename__ = "avaliacoes_fisioterapeuticas"

    id = Column(Integer, primary_key=True, index=True)
    prontuario_id = Column(
        Integer, ForeignKey("prontuarios.id"), nullable=False, index=True
    )
    tipo = Column(String(20), nullable=False)
    profissional_id = Column(
        Integer, ForeignKey("usuarios.id"), nullable=False, index=True
    )
    profissional_nome = Column(String(150), nullable=False)
    formulario = Column(JSON, nullable=False)
    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)
