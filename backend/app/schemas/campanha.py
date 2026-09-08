from datetime import date
from pydantic import BaseModel

class CampanhaCriar(BaseModel):
    nome: str
    tipo: str
    data_inicio: date
    data_fim: date | None = None
    regra: str | None = None
    beneficio: str | None = None
    percentual_desconto: float | None = None
    publico: str = "Todos"
    ativo: bool = True

class CampanhaResposta(CampanhaCriar):
    id: int

    class Config:
        from_attributes = True
