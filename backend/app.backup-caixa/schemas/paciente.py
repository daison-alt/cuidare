from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class PacienteCriar(BaseModel):
    nome: str = Field(min_length=3, max_length=255)

    cpf: str | None = Field(default=None, min_length=11, max_length=14)
    rg: str | None = Field(default=None, max_length=30)

    data_nascimento: date | None = None

    telefone: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=255)

    endereco: str | None = Field(default=None, max_length=255)
    numero: str | None = Field(default=None, max_length=20)
    complemento: str | None = Field(default=None, max_length=100)
    bairro: str | None = Field(default=None, max_length=100)
    cep: str | None = Field(default=None, max_length=10)
    municipio: str | None = Field(default=None, max_length=100)
    uf: str | None = Field(default=None, min_length=2, max_length=2)

    contato_emergencia_nome: str | None = Field(
        default=None,
        max_length=255,
    )

    contato_emergencia_telefone: str | None = Field(
        default=None,
        max_length=30,
    )

    contato_emergencia_parentesco: str | None = Field(
        default=None,
        max_length=100,
    )

    observacoes: str | None = None


class PacienteAtualizar(BaseModel):
    nome: str | None = Field(default=None, min_length=3, max_length=255)

    cpf: str | None = Field(default=None, min_length=11, max_length=14)
    rg: str | None = Field(default=None, max_length=30)

    data_nascimento: date | None = None

    telefone: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=255)

    endereco: str | None = Field(default=None, max_length=255)
    numero: str | None = Field(default=None, max_length=20)
    complemento: str | None = Field(default=None, max_length=100)
    bairro: str | None = Field(default=None, max_length=100)
    cep: str | None = Field(default=None, max_length=10)
    municipio: str | None = Field(default=None, max_length=100)
    uf: str | None = Field(default=None, min_length=2, max_length=2)

    contato_emergencia_nome: str | None = Field(
        default=None,
        max_length=255,
    )

    contato_emergencia_telefone: str | None = Field(
        default=None,
        max_length=30,
    )

    contato_emergencia_parentesco: str | None = Field(
        default=None,
        max_length=100,
    )

    observacoes: str | None = None


class PacienteResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    nome: str
    cpf: str | None
    rg: str | None

    data_nascimento: date | None

    telefone: str | None
    email: str | None

    endereco: str | None
    numero: str | None
    complemento: str | None
    bairro: str | None
    cep: str | None
    municipio: str | None
    uf: str | None

    contato_emergencia_nome: str | None
    contato_emergencia_telefone: str | None
    contato_emergencia_parentesco: str | None

    observacoes: str | None

    ativo: bool

    criado_em: datetime
    atualizado_em: datetime
