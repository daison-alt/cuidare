from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint

from app.database import Base


class ParcelaPlanoPilates(Base):
    """Uma conta a receber por parcela, sem modificar vínculos antigos."""
    __tablename__ = "parcelas_planos_pilates"

    id = Column(Integer, primary_key=True, index=True)
    aluno_plano_id = Column(
        Integer, ForeignKey("alunos_planos_pilates.id"),
        nullable=False, index=True
    )
    conta_receber_id = Column(
        Integer, ForeignKey("contas_receber.id"),
        nullable=False, unique=True, index=True
    )
    numero_parcela = Column(Integer, nullable=False)
    total_parcelas = Column(Integer, nullable=False)
    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint(
            "aluno_plano_id", "numero_parcela",
            name="uq_parcela_pilates_matricula_numero"
        ),
    )
