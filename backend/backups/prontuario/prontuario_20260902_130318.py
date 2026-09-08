from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Prontuario(Base):
    __tablename__ = "prontuarios"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    paciente_id = Column(
        Integer,
        ForeignKey("pacientes.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    observacoes_gerais = Column(
        Text,
        nullable=True,
    )

    queixa_principal = Column(
        Text,
        nullable=True,
    )

    diagnostico = Column(
        Text,
        nullable=True,
    )

    objetivos = Column(
        Text,
        nullable=True,
    )

    condutas = Column(
        Text,
        nullable=True,
    )

    observacoes = Column(
        Text,
        nullable=True,
    )

    ativo = Column(
        Boolean,
        nullable=False,
        default=True,
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

    paciente = relationship(
        "Paciente",
        backref="prontuario",
    )

    evolucoes = relationship(
        "Evolucao",
        back_populates="prontuario",
        cascade="all, delete-orphan",
        order_by="Evolucao.criado_em.desc()",
    )
