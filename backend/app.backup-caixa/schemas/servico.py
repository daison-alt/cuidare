from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ServicoCriar(BaseModel):
    nome: str
    descricao: str | None = None
    duracao_minutos: int = 60
    valor: str | None = None
    ativo: bool = True


class ServicoAtualizar(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    duracao_minutos: int | None = None
    valor: str | None = None
    ativo: bool | None = None


class ServicoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    descricao: str | None
    duracao_minutos: int
    valor: str | None
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime
