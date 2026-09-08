from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class ConfiguracaoSistema(Base):
    __tablename__ = "configuracoes_sistema"

    id = Column(Integer, primary_key=True, index=True)

    logo_nome = Column(String(255), nullable=True)
    logo_caminho = Column(String(500), nullable=True)
    logo_tipo = Column(String(100), nullable=True)

    atualizado_em = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
