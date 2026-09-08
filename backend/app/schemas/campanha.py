from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CampanhaBase(BaseModel):
    nome: str
    segmento_alvo: str
    canal_envio: str
    mensagem_template: str

class CampanhaCreate(CampanhaBase):
    pass

class CampanhaResponse(CampanhaBase):
    id: int
    status: str
    total_destinatarios: int
    data_criacao: datetime
    data_envio: Optional[datetime] = None

    class Config:
        from_attributes = True
