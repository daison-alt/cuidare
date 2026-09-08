from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


PERIODOS_VALIDOS = {
    "mensal",
    "trimestral",
    "semestral",
}

FREQUENCIAS_VALIDAS = {
    1,
    2,
}


class PlanoPilatesCriar(BaseModel):
    nome: str = Field(min_length=3, max_length=150)
    periodo: str
    frequencia_semanal: int
    quantidade_aulas: int = Field(gt=0)
    valor: Decimal = Field(ge=0)
    descricao: str | None = None
    ativo: bool = True

    @field_validator("periodo")
    @classmethod
    def validar_periodo(cls, valor: str) -> str:
        valor = valor.strip().lower()

        if valor not in PERIODOS_VALIDOS:
            raise ValueError(
                "Período inválido. Use mensal, trimestral ou semestral."
            )

        return valor

    @field_validator("frequencia_semanal")
    @classmethod
    def validar_frequencia(cls, valor: int) -> int:
        if valor not in FREQUENCIAS_VALIDAS:
            raise ValueError(
                "Frequência inválida. Use 1 ou 2 aulas por semana."
            )

        return valor


class PlanoPilatesAtualizar(BaseModel):
    nome: str | None = Field(default=None, min_length=3, max_length=150)
    periodo: str | None = None
    frequencia_semanal: int | None = None
    quantidade_aulas: int | None = Field(default=None, gt=0)
    valor: Decimal | None = Field(default=None, ge=0)
    descricao: str | None = None
    ativo: bool | None = None

    @field_validator("periodo")
    @classmethod
    def validar_periodo(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip().lower()

        if valor not in PERIODOS_VALIDOS:
            raise ValueError(
                "Período inválido. Use mensal, trimestral ou semestral."
            )

        return valor

    @field_validator("frequencia_semanal")
    @classmethod
    def validar_frequencia(cls, valor: int | None) -> int | None:
        if valor is None:
            return None

        if valor not in FREQUENCIAS_VALIDAS:
            raise ValueError(
                "Frequência inválida. Use 1 ou 2 aulas por semana."
            )

        return valor


class PlanoPilatesResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    periodo: str
    frequencia_semanal: int
    quantidade_aulas: int
    valor: Decimal
    descricao: str | None
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime
