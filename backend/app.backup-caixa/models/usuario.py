from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)

    nome = Column(String(150), nullable=False)

    email = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False,
    )

    telefone = Column(
        String(30),
        nullable=True,
    )

    senha_hash = Column(
        String(255),
        nullable=False,
    )

    perfil = Column(
        String(30),
        nullable=False,
    )

    status = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    criado_em = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    ultimo_acesso = Column(
        DateTime,
        nullable=True,
    )