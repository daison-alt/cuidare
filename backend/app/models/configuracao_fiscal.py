from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.database import Base


class ConfiguracaoFiscal(Base):
    __tablename__ = "configuracao_fiscal"

    id = Column(Integer, primary_key=True, index=True)

    razao_social = Column(String(255), nullable=False)
    nome_fantasia = Column(String(255), nullable=True)

    cnpj = Column(String(18), nullable=False, unique=True, index=True)

    inscricao_municipal = Column(String(50), nullable=True)
    inscricao_estadual = Column(String(50), nullable=True)

    endereco = Column(String(255), nullable=True)
    numero = Column(String(20), nullable=True)
    complemento = Column(String(100), nullable=True)
    bairro = Column(String(100), nullable=True)
    cep = Column(String(10), nullable=True)

    municipio = Column(String(100), nullable=False, default="Seberi")
    uf = Column(String(2), nullable=False, default="RS")
    codigo_municipio = Column(String(20), nullable=True)

    regime_tributario = Column(String(100), nullable=True)

    codigo_servico = Column(String(50), nullable=True)
    descricao_servico = Column(Text, nullable=True)

    aliquota_iss = Column(String(20), nullable=True)

    emissao_nfse_ativa = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    ambiente_nfse = Column(
        String(20),
        default="homologacao",
        nullable=False,
    )

    provedor_nfse = Column(
        String(100),
        nullable=True,
    )

    observacoes = Column(Text, nullable=True)

    ativo = Column(
        Boolean,
        default=True,
        nullable=False,
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
