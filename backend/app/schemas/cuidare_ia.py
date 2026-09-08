from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ConfiguracaoCuidareIAResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ativa: bool
    modo_teste: bool
    limite_mensal: float
    alerta_percentual: int
    bloqueio_percentual: int
    criado_em: datetime
    atualizado_em: datetime


class ConfiguracaoCuidareIAAtualizar(BaseModel):
    ativa: bool | None = None
    modo_teste: bool | None = None
    limite_mensal: float | None = None
    alerta_percentual: int | None = None
    bloqueio_percentual: int | None = None


class CuidareIAAnaliseSolicitar(BaseModel):
    prontuario_id: int

    queixa_principal: str | None = None
    diagnostico: str | None = None
    objetivos: str | None = None
    condutas: str | None = None
    observacoes: str | None = None
    evolucoes_anteriores: list[str] = []


class CuidareIAAnaliseResposta(BaseModel):
    status: str
    modo: str

    mensagem: str

    resumo: str
    sugestao_evolucao: str

    observacoes: str

    pode_registrar: bool

    custo_estimado: float
