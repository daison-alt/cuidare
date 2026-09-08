from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


STATUS_PERMITIDOS = {
    "pendente",
    "pago",
    "vencido",
    "cancelado",
}


FORMAS_PAGAMENTO_PERMITIDAS = {
    "dinheiro",
    "pix",
    "cartao_credito",
    "cartao_debito",
    "transferencia",
    "debito_automatico",
    "outro",
}


class ContaPagarCriar(BaseModel):
    fornecedor: str | None = Field(
        default=None,
        max_length=200,
    )

    descricao: str = Field(
        min_length=1,
        max_length=200,
    )

    categoria: str | None = Field(
        default=None,
        max_length=100,
    )

    valor: Decimal = Field(
        gt=0,
    )

    vencimento: date

    status: str = "pendente"

    forma_pagamento: str | None = Field(
        default=None,
        max_length=50,
    )

    data_pagamento: date | None = None

    valor_pago: Decimal | None = Field(
        default=None,
        gt=0,
    )

    observacoes: str | None = None

    ativo: bool = True


class ContaPagarAtualizar(BaseModel):
    fornecedor: str | None = Field(
        default=None,
        max_length=200,
    )

    descricao: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    categoria: str | None = Field(
        default=None,
        max_length=100,
    )

    valor: Decimal | None = Field(
        default=None,
        gt=0,
    )

    vencimento: date | None = None

    status: str | None = None

    forma_pagamento: str | None = Field(
        default=None,
        max_length=50,
    )

    data_pagamento: date | None = None

    valor_pago: Decimal | None = Field(
        default=None,
        gt=0,
    )

    observacoes: str | None = None

    ativo: bool | None = None


class ContaPagarResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fornecedor: str | None
    descricao: str
    categoria: str | None
    valor: Decimal
    vencimento: date
    status: str
    forma_pagamento: str | None
    data_pagamento: date | None
    valor_pago: Decimal | None
    observacoes: str | None
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime
