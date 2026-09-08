from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, UniqueConstraint

from app.database import Base


class AgendamentoPlanoPilates(Base):
    __tablename__ = "agendamentos_planos_pilates"

    id = Column(Integer, primary_key=True, index=True)

    agendamento_id = Column(
        Integer,
        ForeignKey("agendamentos.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    aluno_plano_id = Column(
        Integer,
        ForeignKey("alunos_planos_pilates.id"),
        nullable=False,
        index=True,
    )

    aula_consumida = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    criado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    atualizado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    __table_args__ = (
        UniqueConstraint(
            "agendamento_id",
            name="uq_agendamento_plano_agendamento",
        ),
    )
