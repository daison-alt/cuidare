from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Time,
)

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

    tipo_atendimento = Column(
        String(20),
        nullable=False,
        default="normal",
        index=True,
    )

    motivo_cortesia = Column(
        String(255),
        nullable=True,
    )

    campanha_cortesia = Column(
        String(150),
        nullable=True,
    )

    valor_tabela = Column(
        Numeric(12, 2),
        nullable=True,
        default=Decimal("0.00"),
    )

    valor_cobrado = Column(
        Numeric(12, 2),
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
