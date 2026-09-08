from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric

from app.database import Base


class ConfiguracaoCuidareIA(Base):
    __tablename__ = "configuracao_cuidare_ia"

    id = Column(Integer, primary_key=True, index=True)

    ativa = Column(Boolean, nullable=False, default=False)

    modo_teste = Column(Boolean, nullable=False, default=True)

    limite_mensal = Column(
        Numeric(10, 2),
        nullable=False,
        default=50.00,
    )

    alerta_percentual = Column(
        Integer,
        nullable=False,
        default=80,
    )

    bloqueio_percentual = Column(
        Integer,
        nullable=False,
        default=100,
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
