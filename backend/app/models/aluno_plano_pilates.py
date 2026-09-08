from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text

from app.database import Base


class AlunoPlanoPilates(Base):
    __tablename__ = "alunos_planos_pilates"

    id = Column(Integer, primary_key=True, index=True)

    paciente_id = Column(
        Integer,
        ForeignKey("pacientes.id"),
        nullable=False,
        index=True,
    )

    plano_id = Column(
        Integer,
        ForeignKey("planos_pilates.id"),
        nullable=False,
        index=True,
    )

    data_inicio = Column(
        Date,
        nullable=False,
        index=True,
    )

    data_fim = Column(
        Date,
        nullable=False,
        index=True,
    )

    valor_contratado = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    aulas_previstas = Column(
        Integer,
        nullable=False,
        default=0,
    )

    aulas_utilizadas = Column(
        Integer,
        nullable=False,
        default=0,
    )

    status = Column(
        String(30),
        nullable=False,
        default="ativo",
        index=True,
    )

    observacoes = Column(Text, nullable=True)

    ativo = Column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
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
