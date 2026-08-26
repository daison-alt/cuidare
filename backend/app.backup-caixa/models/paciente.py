from datetime import datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Integer, String, Text

from app.database import Base


class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True)

    nome = Column(String(255), nullable=False, index=True)
    cpf = Column(String(14), nullable=True, unique=True, index=True)
    rg = Column(String(30), nullable=True)

    data_nascimento = Column(Date, nullable=True)

    telefone = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)

    endereco = Column(String(255), nullable=True)
    numero = Column(String(20), nullable=True)
    complemento = Column(String(100), nullable=True)
    bairro = Column(String(100), nullable=True)
    cep = Column(String(10), nullable=True)
    municipio = Column(String(100), nullable=True)
    uf = Column(String(2), nullable=True)

    contato_emergencia_nome = Column(String(255), nullable=True)
    contato_emergencia_telefone = Column(String(30), nullable=True)
    contato_emergencia_parentesco = Column(String(100), nullable=True)

    observacoes = Column(Text, nullable=True)

    ativo = Column(Boolean, nullable=False, default=True)

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
