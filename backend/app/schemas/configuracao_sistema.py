from datetime import datetime

from pydantic import BaseModel


class IdentidadeVisualResposta(BaseModel):
    id: int
    logo_nome: str | None = None
    logo_tipo: str | None = None
    logo_url: str | None = None
    atualizado_em: datetime

    class Config:
        from_attributes = True
