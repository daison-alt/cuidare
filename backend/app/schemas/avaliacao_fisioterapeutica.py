"""Dados validados da avaliacao e reavaliacao fisioterapeutica."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


CaracteristicaDorLegada = Literal[
    "pontada",
    "queimacao",
    "latejante",
    "pressao_aperto",
    "choque_eletrico",
    "profunda_surda",
]

CaracteristicaClinicaDor = Literal[
    "neuropatica",
    "nociceptiva_inflamatoria",
    "nociplastica",
    "hiperalgesia",
    "alodinia",
    "cronica",
]


class FormularioAvaliacao(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Anamnese
    queixa_principal: str = Field(default="", max_length=10000)
    historia_doenca_atual: str = Field(default="", max_length=10000)
    historico_lesao: str = Field(default="", max_length=10000)
    antecedentes: str = Field(default="", max_length=10000)
    cirurgias: str = Field(default="", max_length=10000)
    medicacoes: str = Field(default="", max_length=10000)
    limitacoes_funcionais: str = Field(default="", max_length=10000)

    # Dor
    intensidade_dor: int | None = Field(default=None, ge=0, le=10)
    # Mantido somente para leitura de avaliacoes gravadas na primeira versao.
    caracteristica_dor: CaracteristicaDorLegada | None = None
    caracteristicas_dor: list[CaracteristicaClinicaDor] = Field(
        default_factory=list, max_length=6
    )
    localizacao_dor: str = Field(default="", max_length=10000)
    frequencia_dor: str = Field(default="", max_length=10000)
    irradiacao_dor: str = Field(default="", max_length=10000)
    fatores_agravantes: str = Field(default="", max_length=10000)
    fatores_alivio: str = Field(default="", max_length=10000)
    observacoes_dor: str = Field(default="", max_length=10000)

    # Exame fisico
    pressao_arterial: str = Field(default="", max_length=80)
    frequencia_cardiaca: int | None = Field(default=None, ge=1, le=300)
    avaliacao_estatica: str = Field(default="", max_length=10000)
    avaliacao_dinamica: str = Field(default="", max_length=10000)
    avaliacao_postural: str = Field(default="", max_length=10000)
    forca_muscular: str = Field(default="", max_length=10000)
    amplitude_movimento: str = Field(default="", max_length=10000)
    goniometria: str = Field(default="", max_length=10000)
    testes_especiais: str = Field(default="", max_length=10000)

    # Raciocinio clinico e plano
    diagnostico_fisioterapeutico: str = Field(default="", max_length=10000)
    objetivos_terapeuticos: str = Field(default="", max_length=10000)
    condutas: str = Field(default="", max_length=10000)
    plano_tratamento: str = Field(default="", max_length=10000)


class AvaliacaoCriar(BaseModel):
    tipo: Literal["inicial", "reavaliacao"]
    formulario: FormularioAvaliacao


class AvaliacaoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prontuario_id: int
    tipo: Literal["inicial", "reavaliacao"]
    profissional_id: int
    profissional_nome: str
    formulario: FormularioAvaliacao
    criado_em: datetime
