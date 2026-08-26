from datetime import date, datetime, time

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text, Time

from app.database import Base


class Agendamento(Base):
    __tablename__ = "agendamentos"

    id = Column(Integer, primary_key=True, index=True)

    paciente_id = Column(
        Integer,
        ForeignKey("pacientes.id"),
        nullable=False,
        index=True,
    )

    profissional_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False,
        index=True,
    )

    servico_id = Column(
        Integer,
        ForeignKey("servicos.id"),
        nullable=False,
        index=True,
    )

    data = Column(
        Date,
        nullable=False,
        index=True,
    )

    hora_inicio = Column(
        Time,
        nullable=False,
    )

    hora_fim = Column(
        Time,
        nullable=False,
    )

    status = Column(
        String(30),
        nullable=False,
        default="agendado",
        index=True,
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
