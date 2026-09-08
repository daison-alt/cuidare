from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ContratoBase(BaseModel):
    titulo: str
    paciente_id: int
    paciente_nome: str
    paciente_cpf: str
    conteudo_html: str

class ContratoCreate(ContratoBase):
    pass

class ContratoResponse(ContratoBase):
    id: int
    status: str
    data_criacao: datetime
    data_assinatura: Optional[datetime] = None

    class Config:
        from_attributes = True
