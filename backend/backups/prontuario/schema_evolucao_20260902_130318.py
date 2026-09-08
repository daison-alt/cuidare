from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EvolucaoCriar(BaseModel):
    prontuario_id: int

    profissional_id: int | None = None
    profissional_nome: str | None = None

    tipo_atendimento: str | None = None

    relato_queixa: str | None = None
    avaliacao: str | None = None
    conduta: str | None = None

    evolucao: str

    observacoes: str | None = None


class EvolucaoAtualizar(BaseModel):
    profissional_id: int | None = None
    profissional_nome: str | None = None

    tipo_atendimento: str | None = None

    relato_queixa: str | None = None
    avaliacao: str | None = None
    conduta: str | None = None

    evolucao: str | None = None

    observacoes: str | None = None


class EvolucaoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prontuario_id: int

    profissional_id: int | None
    profissional_nome: str | None

    tipo_atendimento: str | None

    relato_queixa: str | None
    avaliacao: str | None
    conduta: str | None
    evolucao: str
    observacoes: str | None

    criado_em: datetime
    atualizado_em: datetime
