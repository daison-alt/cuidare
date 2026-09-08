from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EvolucaoCriar(BaseModel):
    texto: str


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


class ProntuarioCriar(BaseModel):
    paciente_id: int

    queixa_principal: str | None = None
    diagnostico: str | None = None
    objetivos: str | None = None
    condutas: str | None = None
    observacoes: str | None = None

    observacoes_gerais: str | None = None


class ProntuarioAtualizar(BaseModel):
    queixa_principal: str | None = None
    diagnostico: str | None = None
    objetivos: str | None = None
    condutas: str | None = None
    observacoes: str | None = None

    observacoes_gerais: str | None = None


class ProntuarioResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    paciente_id: int

    queixa_principal: str | None
    diagnostico: str | None
    objetivos: str | None
    condutas: str | None
    observacoes: str | None
    observacoes_gerais: str | None

    ativo: bool

    criado_em: datetime
    atualizado_em: datetime

    evolucoes: list[EvolucaoResposta] = []
