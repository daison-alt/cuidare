from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


STATUS_AGENDAMENTO = {
    "agendado",
    "confirmado",
    "em_atendimento",
    "concluido",
    "cancelado",
    "faltou",
}


TIPOS_ATENDIMENTO = {
    "normal",
    "cortesia",
    "plano",
    "avulsa",
    "experimental",
}


class AgendamentoCriar(BaseModel):
    paciente_id: int
    profissional_id: int
    servico_id: int

    data: date
    hora_inicio: time
    hora_fim: time

    status: str = "agendado"

    tipo_atendimento: str = "normal"

    aluno_plano_id: int | None = None

    motivo_cortesia: str | None = Field(
        default=None,
        max_length=255,
    )

    campanha_cortesia: str | None = Field(
        default=None,
        max_length=150,
    )

    observacoes: str | None = None

    ativo: bool = True


class AgendamentoAtualizar(BaseModel):
    paciente_id: int | None = None
    profissional_id: int | None = None
    servico_id: int | None = None

    data: date | None = None
    hora_inicio: time | None = None
    hora_fim: time | None = None

    status: str | None = None

    tipo_atendimento: str | None = None

    aluno_plano_id: int | None = None

    motivo_cortesia: str | None = Field(
        default=None,
        max_length=255,
    )

    campanha_cortesia: str | None = Field(
        default=None,
        max_length=150,
    )

    observacoes: str | None = None
    ativo: bool | None = None


class AgendamentoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    paciente_id: int
    profissional_id: int
    servico_id: int

    data: date
    hora_inicio: time
    hora_fim: time

    status: str

    tipo_atendimento: str

    aluno_plano_id: int | None = None

    motivo_cortesia: str | None
    campanha_cortesia: str | None

    valor_tabela: Decimal | None
    valor_cobrado: Decimal | None

    observacoes: str | None
    ativo: bool

    criado_em: datetime
    atualizado_em: datetime
