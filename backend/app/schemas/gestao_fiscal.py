from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GestaoFiscalCriar(BaseModel):
    tipo_documento: str = Field(
        min_length=2,
        max_length=50,
    )

    competencia: str = Field(
        min_length=7,
        max_length=7,
    )

    descricao: str = Field(
        min_length=3,
        max_length=255,
    )

    status: str = Field(
        default="pendente",
        min_length=3,
        max_length=30,
    )

    vencimento: datetime | None = None

    valor: str | None = Field(
        default=None,
        max_length=30,
    )

    observacoes: str | None = None

    arquivo: str | None = Field(
        default=None,
        max_length=255,
    )


class GestaoFiscalResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo_documento: str
    competencia: str
    descricao: str
    status: str
    vencimento: datetime | None
    valor: str | None
    observacoes: str | None
    arquivo: str | None
    criado_em: datetime
    atualizado_em: datetime
    ativo: bool
