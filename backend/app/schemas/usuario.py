from datetime import datetime

from pydantic import BaseModel, EmailStr


class UsuarioCriar(BaseModel):
    nome: str
    email: EmailStr
    telefone: str | None = None
    senha: str
    perfil: str
    status: bool = True


class UsuarioResposta(BaseModel):
    id: int
    nome: str
    email: EmailStr
    telefone: str | None = None
    perfil: str
    status: bool
    criado_em: datetime
    ultimo_acesso: datetime | None = None

    class Config:
        from_attributes = True