from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer

from app.database import Base


class CobrancaPlanoPilates(Base):
    """Vínculo imutável: uma cobrança financeira por matrícula de Pilates."""
    __tablename__ = "cobrancas_planos_pilates"

    id = Column(Integer, primary_key=True, index=True)
    aluno_plano_id = Column(
        Integer, ForeignKey("alunos_planos_pilates.id"),
        nullable=False, unique=True, index=True
    )
    conta_receber_id = Column(
        Integer, ForeignKey("contas_receber.id"),
        nullable=False, unique=True, index=True
    )
    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)
