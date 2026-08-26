from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CaixaBase(BaseModel):
    saldo_inicial: Decimal = Field(default=Decimal("0.00"), ge=0)
    observacoes: str | None = None


class CaixaCriar(CaixaBase):
    pass


class CaixaFechar(BaseModel):
    saldo_final: Decimal = Field(..., ge=0)
    observacoes: str | None = None


class CaixaResposta(CaixaBase):
    id: int
    data_abertura: datetime
    data_fechamento: datetime | None
    saldo_final: Decimal | None
    status: str
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)
