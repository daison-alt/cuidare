from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ConfiguracaoFiscalCriar(BaseModel):
    razao_social: str = Field(min_length=3, max_length=255)
    nome_fantasia: str | None = Field(default=None, max_length=255)

    cnpj: str = Field(min_length=14, max_length=18)

    inscricao_municipal: str | None = Field(default=None, max_length=50)
    inscricao_estadual: str | None = Field(default=None, max_length=50)

    endereco: str | None = Field(default=None, max_length=255)
    numero: str | None = Field(default=None, max_length=20)
    complemento: str | None = Field(default=None, max_length=100)
    bairro: str | None = Field(default=None, max_length=100)
    cep: str | None = Field(default=None, max_length=10)

    municipio: str = Field(default="Seberi", min_length=2, max_length=100)
    uf: str = Field(default="RS", min_length=2, max_length=2)
    codigo_municipio: str | None = Field(default=None, max_length=20)

    regime_tributario: str | None = Field(default=None, max_length=100)

    codigo_servico: str | None = Field(default=None, max_length=50)
    descricao_servico: str | None = None

    aliquota_iss: str | None = Field(default=None, max_length=20)

    emissao_nfse_ativa: bool = False

    ambiente_nfse: str = Field(default="homologacao", max_length=20)

    provedor_nfse: str | None = Field(default=None, max_length=100)

    observacoes: str | None = None


class ConfiguracaoFiscalAtualizar(BaseModel):
    razao_social: str | None = Field(default=None, min_length=3, max_length=255)
    nome_fantasia: str | None = Field(default=None, max_length=255)

    cnpj: str | None = Field(default=None, min_length=14, max_length=18)

    inscricao_municipal: str | None = Field(default=None, max_length=50)
    inscricao_estadual: str | None = Field(default=None, max_length=50)

    endereco: str | None = Field(default=None, max_length=255)
    numero: str | None = Field(default=None, max_length=20)
    complemento: str | None = Field(default=None, max_length=100)
    bairro: str | None = Field(default=None, max_length=100)
    cep: str | None = Field(default=None, max_length=10)

    municipio: str | None = Field(default=None, min_length=2, max_length=100)
    uf: str | None = Field(default=None, min_length=2, max_length=2)
    codigo_municipio: str | None = Field(default=None, max_length=20)

    regime_tributario: str | None = Field(default=None, max_length=100)

    codigo_servico: str | None = Field(default=None, max_length=50)
    descricao_servico: str | None = None

    aliquota_iss: str | None = Field(default=None, max_length=20)

    emissao_nfse_ativa: bool | None = None

    ambiente_nfse: str | None = Field(default=None, max_length=20)

    provedor_nfse: str | None = Field(default=None, max_length=100)

    observacoes: str | None = None


class ConfiguracaoFiscalResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    razao_social: str
    nome_fantasia: str | None

    cnpj: str

    inscricao_municipal: str | None
    inscricao_estadual: str | None

    endereco: str | None
    numero: str | None
    complemento: str | None
    bairro: str | None
    cep: str | None

    municipio: str
    uf: str
    codigo_municipio: str | None

    regime_tributario: str | None

    codigo_servico: str | None
    descricao_servico: str | None

    aliquota_iss: str | None

    emissao_nfse_ativa: bool
    ambiente_nfse: str
    provedor_nfse: str | None

    observacoes: str | None

    ativo: bool

    criado_em: datetime
    atualizado_em: datetime
