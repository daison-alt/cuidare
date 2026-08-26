from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict


STATUS_AGENDAMENTO = {
    "agendado",
    "confirmado",
    "em_atendimento",
    "concluido",
    "cancelado",
    "faltou",
}


class AgendamentoCriar(BaseModel):
    paciente_id: int
    profissional_id: int
    servico_id: int

    data: date
    hora_inicio: time
    hora_fim: time

    status: str = "agendado"
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
    observacoes: str | None
    ativo: bool

    criado_em: datetime
    atualizado_em: datetime
