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

    porte_empresa = Column(String(50), nullable=True)
    natureza_juridica = Column(String(100), nullable=True)
    enquadramento_tributario = Column(String(100), nullable=True)

    optante_simples_nacional = Column(Boolean, default=False, nullable=False)
    anexo_simples = Column(String(20), nullable=True)
    faixa_simples = Column(String(50), nullable=True)
    aliquota_nominal_simples = Column(String(20), nullable=True)
    aliquota_efetiva_simples = Column(String(20), nullable=True)

    iss_retido = Column(Boolean, default=False, nullable=False)
    irrf_aliquota = Column(String(20), nullable=True)
    pis_aliquota = Column(String(20), nullable=True)
    cofins_aliquota = Column(String(20), nullable=True)
    csll_aliquota = Column(String(20), nullable=True)
    inss_aliquota = Column(String(20), nullable=True)

    ibs_aliquota = Column(String(20), nullable=True)
    cbs_aliquota = Column(String(20), nullable=True)

    serie_nfse = Column(String(20), nullable=True)
    ultimo_numero_nfse = Column(Integer, default=0, nullable=False)
    tipo_emissao_nfse = Column(String(50), nullable=True)
    integracao_nfse_ativa = Column(Boolean, default=False, nullable=False)

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
