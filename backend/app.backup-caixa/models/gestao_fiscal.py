from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.database import Base


class GestaoFiscal(Base):
    __tablename__ = "gestao_fiscal"

    id = Column(Integer, primary_key=True, index=True)

    tipo_documento = Column(
        String(50),
        nullable=False,
    )

    competencia = Column(
        String(7),
        nullable=False,
    )

    descricao = Column(
        String(255),
        nullable=False,
    )

    status = Column(
        String(30),
        nullable=False,
        default="pendente",
    )

    vencimento = Column(
        DateTime,
        nullable=True,
    )

    valor = Column(
        String(30),
        nullable=True,
    )

    observacoes = Column(
        Text,
        nullable=True,
    )

    arquivo = Column(
        String(255),
        nullable=True,
    )

    criado_em = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    atualizado_em = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    ativo = Column(
        Boolean,
        default=True,
        nullable=False,
    )
