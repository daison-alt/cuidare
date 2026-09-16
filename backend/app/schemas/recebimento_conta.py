from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


FORMAS_PAGAMENTO_RECEBIMENTO_PERMITIDAS = {
    "dinheiro",
    "pix",
    "cartao_credito",
    "cartao_debito",
    "transferencia",
}


class FormaPagamentoRecebimentoCriar(BaseModel):
    forma_pagamento: str = Field(
        min_length=1,
        max_length=50,
    )

    valor: Decimal = Field(
        gt=0,
    )


class RecebimentoContaCriar(BaseModel):
    data_recebimento: date

    pagamentos: list[FormaPagamentoRecebimentoCriar] = Field(
        min_length=1,
    )

    observacoes: str | None = None


class FormaPagamentoRecebimentoResposta(BaseModel):
    id: int
    recebimento_id: int
    forma_pagamento: str
    valor: Decimal
    ativo: bool
    criado_em: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class RecebimentoContaResposta(BaseModel):
    id: int
    numero_recibo: str
    conta_receber_id: int
    data_recebimento: date
    valor_total: Decimal
    valor_recebido_acumulado: Decimal
    valor_pendente: Decimal
    observacoes: str | None
    pagamentos: list[FormaPagamentoRecebimentoResposta]

    model_config = ConfigDict(
        from_attributes=True,
    )
