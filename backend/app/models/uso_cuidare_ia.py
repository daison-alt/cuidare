from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, Numeric, String

from app.database import Base


class UsoCuidareIA(Base):
    __tablename__ = "uso_cuidare_ia"

    id = Column(Integer, primary_key=True, index=True)

    usuario_id = Column(Integer, nullable=True, index=True)

    prontuario_id = Column(Integer, nullable=True, index=True)

    acao = Column(
        String(100),
        nullable=False,
        default="analise_prontuario",
    )

    modo = Column(
        String(30),
        nullable=False,
        default="teste",
    )

    tokens_entrada = Column(
        Integer,
        nullable=False,
        default=0,
    )

    tokens_saida = Column(
        Integer,
        nullable=False,
        default=0,
    )

    custo_estimado = Column(
        Numeric(10, 4),
        nullable=False,
        default=0,
    )

    status = Column(
        String(30),
        nullable=False,
        default="sucesso",
    )

    criado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )
