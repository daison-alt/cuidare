from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CaixaBase(BaseModel):
    saldo_inicial: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
    )
    observacoes: str | None = None


class CaixaCriar(CaixaBase):
    # Quando verdadeiro, o sistema procura automaticamente
    # o troco deixado pelo último caixa fechado.
    usar_troco_anterior: bool = True


class CaixaFechar(BaseModel):
    # Dinheiro físico total encontrado no fechamento.
    saldo_final: Decimal = Field(
        ...,
        ge=0,
    )

    # Valor que permanecerá fisicamente no caixa
    # para a abertura seguinte.
    troco_proxima_abertura: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
    )

    observacoes: str | None = None


class CaixaResposta(CaixaBase):
    id: int

    data_abertura: datetime
    data_fechamento: datetime | None

    saldo_final: Decimal | None

    troco_proxima_abertura: Decimal
    valor_retirado: Decimal
    caixa_origem_troco_id: int | None

    status: str
    ativo: bool

    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)
