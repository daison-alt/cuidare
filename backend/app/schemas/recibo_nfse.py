from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ReciboNFSeBase(BaseModel):
    paciente_id: int
    paciente_nome: str
    paciente_cpf: str
    paciente_email: Optional[EmailStr] = None
    valor: float
    servico_descricao: str

class ReciboNFSeCreate(ReciboNFSeBase):
    pass

class ReciboNFSeResponse(ReciboNFSeBase):
    id: int
    data_emissao: datetime
    status_recibo: str
    status_nfse: str
    numero_nfse: Optional[str] = None
    url_pdf_nfse: Optional[str] = None
    mensagem_erro_nfse: Optional[str] = None

    class Config:
        from_attributes = True
