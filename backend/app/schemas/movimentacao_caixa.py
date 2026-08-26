from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


TIPOS_MOVIMENTACAO = {
    "entrada",
    "saida",
    "sangria",
    "suprimento",
}


class MovimentacaoCaixaCriar(BaseModel):
    tipo: str
    categoria: str
    descricao: str
    valor: Decimal = Field(..., gt=0)
    forma_pagamento: str | None = None
    observacoes: str | None = None


class MovimentacaoCaixaResposta(BaseModel):
    id: int
    caixa_id: int
    tipo: str
    categoria: str
    descricao: str
    valor: Decimal
    forma_pagamento: str | None
    observacoes: str | None
    data_movimentacao: datetime
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)
