from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ConferenciaCaixaCriar(BaseModel):
    dinheiro_informado: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
    )

    pix_informado: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
    )

    cartao_credito_informado: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
    )

    cartao_debito_informado: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
    )

    transferencia_informada: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
    )

    observacoes: str | None = None

    conferido_por: str | None = None


class ConferenciaCaixaResposta(BaseModel):
    id: int
    caixa_id: int

    dinheiro_esperado: Decimal
    dinheiro_informado: Decimal

    pix_esperado: Decimal
    pix_informado: Decimal

    cartao_credito_esperado: Decimal
    cartao_credito_informado: Decimal

    cartao_debito_esperado: Decimal
    cartao_debito_informado: Decimal

    transferencia_esperada: Decimal
    transferencia_informada: Decimal

    total_esperado: Decimal
    total_informado: Decimal

    diferenca_dinheiro: Decimal
    diferenca_eletronicos: Decimal
    diferenca_total: Decimal

    observacoes: str | None
    conferido_por: str | None
    data_conferencia: datetime

    class Config:
        from_attributes = True
