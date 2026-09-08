from pydantic import BaseModel, EmailStr
from typing import Optional

class ConfiguracaoBase(BaseModel):
    razao_social: str
    nome_fantasia: Optional[str] = None
    cnpj: str
    inscricao_municipal: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    regime_tributario: Optional[str] = None
    codigo_servico_municipal: Optional[str] = None
    aliquota_iss: Optional[str] = None
    responsavel_tecnico: Optional[str] = None
    crefito_responsavel: Optional[str] = None

class ConfiguracaoCreateUpdate(ConfiguracaoBase):
    pass

class ConfiguracaoResponse(ConfiguracaoBase):
    id: int
    logo_path: Optional[str] = None
    certificado_a1_path: Optional[str] = None

    class Config:
        from_attributes = True
