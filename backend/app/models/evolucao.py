from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Evolucao(Base):
    __tablename__ = "evolucoes"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    prontuario_id = Column(
        Integer,
        ForeignKey("prontuarios.id"),
        nullable=False,
        index=True,
    )

    profissional_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=True,
        index=True,
    )

    profissional_nome = Column(
        String(255),
        nullable=True,
    )

    tipo_atendimento = Column(
        String(100),
        nullable=True,
    )

    relato_queixa = Column(
        Text,
        nullable=True,
    )

    avaliacao = Column(
        Text,
        nullable=True,
    )

    conduta = Column(
        Text,
        nullable=True,
    )

    evolucao = Column(
        Text,
        nullable=False,
    )

    observacoes = Column(
        Text,
        nullable=True,
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

    prontuario = relationship(
        "Prontuario",
        back_populates="evolucoes",
    )

    profissional = relationship(
        "Usuario",
        foreign_keys=[profissional_id],
    )
