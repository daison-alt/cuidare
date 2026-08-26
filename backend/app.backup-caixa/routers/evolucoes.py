from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.evolucao import Evolucao
from app.models.prontuario import Prontuario
from app.schemas.evolucao import (
    EvolucaoAtualizar,
    EvolucaoCriar,
    EvolucaoResposta,
)


router = APIRouter(
    prefix="/evolucoes",
    tags=["Evoluções"],
)


@router.post(
    "",
    response_model=EvolucaoResposta,
)
def criar_evolucao(
    dados: EvolucaoCriar,
    db: Session = Depends(get_db),
):
    prontuario = (
        db.query(Prontuario)
        .filter(Prontuario.id == dados.prontuario_id)
        .first()
    )

    if not prontuario:
        raise HTTPException(
            status_code=404,
            detail="Prontuário não encontrado.",
        )

    evolucao = Evolucao(
        prontuario_id=dados.prontuario_id,
        profissional_id=dados.profissional_id,
        profissional_nome=dados.profissional_nome,
        tipo_atendimento=dados.tipo_atendimento,
        relato_queixa=dados.relato_queixa,
        avaliacao=dados.avaliacao,
        conduta=dados.conduta,
        evolucao=dados.evolucao,
        observacoes=dados.observacoes,
    )

    db.add(evolucao)
    db.commit()
    db.refresh(evolucao)

    return evolucao


@router.get(
    "/prontuario/{prontuario_id}",
    response_model=list[EvolucaoResposta],
)
def listar_evolucoes(
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

    return (
        db.query(Evolucao)
        .filter(Evolucao.prontuario_id == prontuario_id)
        .order_by(Evolucao.criado_em.desc())
        .all()
    )


@router.get(
    "/{evolucao_id}",
    response_model=EvolucaoResposta,
)
def buscar_evolucao(
    evolucao_id: int,
    db: Session = Depends(get_db),
):
    evolucao = (
        db.query(Evolucao)
        .filter(Evolucao.id == evolucao_id)
        .first()
    )

    if not evolucao:
        raise HTTPException(
            status_code=404,
            detail="Evolução não encontrada.",
        )

    return evolucao


@router.put(
    "/{evolucao_id}",
    response_model=EvolucaoResposta,
)
def atualizar_evolucao(
    evolucao_id: int,
    dados: EvolucaoAtualizar,
    db: Session = Depends(get_db),
):
    evolucao = (
        db.query(Evolucao)
        .filter(Evolucao.id == evolucao_id)
        .first()
    )

    if not evolucao:
        raise HTTPException(
            status_code=404,
            detail="Evolução não encontrada.",
        )

    campos = dados.model_dump(exclude_unset=True)

    for campo, valor in campos.items():
        setattr(evolucao, campo, valor)

    db.commit()
    db.refresh(evolucao)

    return evolucao
