from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Integer, Numeric, String, Text

from app.database import Base


class ContaPagar(Base):
    __tablename__ = "contas_pagar"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    fornecedor = Column(
        String(200),
        nullable=True,
    )

    descricao = Column(
        String(200),
        nullable=False,
    )

    categoria = Column(
        String(100),
        nullable=True,
    )

    valor = Column(
        Numeric(10, 2),
        nullable=False,
    )

    vencimento = Column(
        Date,
        nullable=False,
        index=True,
    )

    status = Column(
        String(30),
        nullable=False,
        default="pendente",
        index=True,
    )

    forma_pagamento = Column(
        String(50),
        nullable=True,
    )

    data_pagamento = Column(
        Date,
        nullable=True,
    )

    valor_pago = Column(
        Numeric(10, 2),
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
