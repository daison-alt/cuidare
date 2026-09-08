from pydantic import BaseModel

class IndicacaoCriar(BaseModel):
    indicador_id: int
    indicado_id: int

class IndicacaoResposta(IndicacaoCriar):
    id: int
    beneficio: str
    status: str

    class Config:
        from_attributes = True
