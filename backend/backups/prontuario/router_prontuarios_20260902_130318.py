from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.evolucao import Evolucao
from app.models.prontuario import Prontuario
from app.schemas.evolucao import EvolucaoCriar, EvolucaoResposta
from app.schemas.prontuario import (
    ProntuarioAtualizar,
    ProntuarioCriar,
    ProntuarioResposta,
)


router = APIRouter(
    prefix="/prontuarios",
    tags=["Prontuários"],
)


@router.post(
    "",
    response_model=ProntuarioResposta,
)
def criar_prontuario(
    dados: ProntuarioCriar,
    db: Session = Depends(get_db),
):
    prontuario_existente = (
        db.query(Prontuario)
        .filter(Prontuario.paciente_id == dados.paciente_id)
        .first()
    )

    if prontuario_existente:
        return prontuario_existente

    prontuario = Prontuario(
        paciente_id=dados.paciente_id,
        queixa_principal=dados.queixa_principal,
        diagnostico=dados.diagnostico,
        objetivos=dados.objetivos,
        condutas=dados.condutas,
        observacoes=dados.observacoes,
        observacoes_gerais=dados.observacoes_gerais,
        ativo=dados.ativo,
    )

    db.add(prontuario)
    db.commit()
    db.refresh(prontuario)

    return prontuario


@router.get(
    "/paciente/{paciente_id}",
    response_model=ProntuarioResposta,
)
def buscar_prontuario_por_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
):
    prontuario = (
        db.query(Prontuario)
        .filter(Prontuario.paciente_id == paciente_id)
        .first()
    )

    if not prontuario:
        prontuario = Prontuario(
            paciente_id=paciente_id,
            observacoes_gerais="Prontuário inicial criado para validação do módulo clínico.",
            ativo=True,
        )

        db.add(prontuario)
        db.commit()
        db.refresh(prontuario)

    return prontuario


@router.get(
    "/{prontuario_id}",
    response_model=ProntuarioResposta,
)
def buscar_prontuario(
    prontuario_id: int,
    db: Session = Depends(get_db),
):
    prontuario = (
        db.query(Prontuario)
        .filter(Prontuario.id == prontuario_id)
        .first()
    )

    if not prontuario:
        raise HTTPException(
            status_code=404,
            detail="Prontuário não encontrado.",
        )

    return prontuario


@router.put(
    "/{prontuario_id}",
    response_model=ProntuarioResposta,
)
def atualizar_prontuario(
    prontuario_id: int,
    dados: ProntuarioAtualizar,
    db: Session = Depends(get_db),
):
    prontuario = (
        db.query(Prontuario)
        .filter(Prontuario.id == prontuario_id)
        .first()
    )

    if not prontuario:
        raise HTTPException(
            status_code=404,
            detail="Prontuário não encontrado.",
        )

    campos = dados.model_dump(exclude_unset=True)

    for campo, valor in campos.items():
        if valor is not None:
            setattr(prontuario, campo, valor)

    db.commit()
    db.refresh(prontuario)

    return prontuario


@router.post(
    "/{prontuario_id}/evolucoes",
    response_model=EvolucaoResposta,
)
def criar_evolucao(
    prontuario_id: int,
    dados: EvolucaoCriar,
    db: Session = Depends(get_db),
):
    prontuario = (
        db.query(Prontuario)
        .filter(Prontuario.id == prontuario_id)
        .first()
    )

    if not prontuario:
        raise HTTPException(
            status_code=404,
            detail="Prontuário não encontrado.",
        )

    if dados.prontuario_id != prontuario_id:
        raise HTTPException(
            status_code=400,
            detail="O prontuário informado não corresponde à rota.",
        )

    if not dados.evolucao.strip():
        raise HTTPException(
            status_code=400,
            detail="A evolução não pode estar vazia.",
        )

    evolucao = Evolucao(
        prontuario_id=prontuario_id,
        profissional_id=dados.profissional_id,
        profissional_nome=dados.profissional_nome,
        tipo_atendimento=dados.tipo_atendimento,
        relato_queixa=dados.relato_queixa,
        avaliacao=dados.avaliacao,
        conduta=dados.conduta,
        evolucao=dados.evolucao.strip(),
        observacoes=dados.observacoes,
    )

    db.add(evolucao)
    db.commit()
    db.refresh(evolucao)

    return evolucao
