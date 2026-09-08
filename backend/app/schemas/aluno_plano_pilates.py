from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


STATUS_VALIDOS = {
    "ativo",
    "encerrado",
    "cancelado",
    "suspenso",
}


class AlunoPlanoPilatesCriar(BaseModel):
    paciente_id: int
    plano_id: int

    data_inicio: date
    data_fim: date

    valor_contratado: Decimal = Field(ge=0)

    observacoes: str | None = None

    @property
    def validar_datas(self):
        if self.data_fim < self.data_inicio:
            raise ValueError(
                "A data de término não pode ser anterior à data de início."
            )


class AlunoPlanoPilatesAtualizar(BaseModel):
    data_inicio: date | None = None
    data_fim: date | None = None
    valor_contratado: Decimal | None = Field(default=None, ge=0)
    status: str | None = None
    observacoes: str | None = None
    ativo: bool | None = None


class AlunoPlanoPilatesResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    paciente_id: int
    paciente_nome: str
    plano_id: int
    plano_nome: str

    data_inicio: date
    data_fim: date

    valor_contratado: Decimal

    aulas_previstas: int
    aulas_utilizadas: int

    status: str
    observacoes: str | None
    ativo: bool

    criado_em: datetime
    atualizado_em: datetime

    aulas_restantes: int
