from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.plano_pilates import PlanoPilates
from app.schemas.plano_pilates import (
    PlanoPilatesAtualizar,
    PlanoPilatesCriar,
    PlanoPilatesResposta,
)


router = APIRouter(
    prefix="/planos-pilates",
    tags=["Planos de Pilates"],
)


@router.post(
    "",
    response_model=PlanoPilatesResposta,
    status_code=status.HTTP_201_CREATED,
)
def criar_plano(
    dados: PlanoPilatesCriar,
    db: Session = Depends(get_db),
):
    nome = dados.nome.strip()

    existente = (
        db.query(PlanoPilates)
        .filter(PlanoPilates.nome.ilike(nome))
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=400,
            detail="Já existe um plano de Pilates com este nome.",
        )

    plano = PlanoPilates(
        nome=nome,
        periodo=dados.periodo,
        frequencia_semanal=dados.frequencia_semanal,
        quantidade_aulas=dados.quantidade_aulas,
        valor=dados.valor,
        descricao=dados.descricao,
        ativo=dados.ativo,
    )

    db.add(plano)
    db.commit()
    db.refresh(plano)

    return plano


@router.get(
    "",
    response_model=list[PlanoPilatesResposta],
)
def listar_planos(
    ativo: bool | None = None,
    db: Session = Depends(get_db),
):
    consulta = db.query(PlanoPilates)

    if ativo is not None:
        consulta = consulta.filter(
            PlanoPilates.ativo == ativo
        )

    return consulta.order_by(
        PlanoPilates.periodo,
        PlanoPilates.frequencia_semanal,
        PlanoPilates.nome,
    ).all()


@router.get(
    "/{plano_id}",
    response_model=PlanoPilatesResposta,
)
def obter_plano(
    plano_id: int,
    db: Session = Depends(get_db),
):
    plano = (
        db.query(PlanoPilates)
        .filter(PlanoPilates.id == plano_id)
        .first()
    )

    if not plano:
        raise HTTPException(
            status_code=404,
            detail="Plano de Pilates não encontrado.",
        )

    return plano


@router.put(
    "/{plano_id}",
    response_model=PlanoPilatesResposta,
)
def atualizar_plano(
    plano_id: int,
    dados: PlanoPilatesAtualizar,
    db: Session = Depends(get_db),
):
    plano = (
        db.query(PlanoPilates)
        .filter(PlanoPilates.id == plano_id)
        .first()
    )

    if not plano:
        raise HTTPException(
            status_code=404,
            detail="Plano de Pilates não encontrado.",
        )

    alteracoes = dados.model_dump(exclude_unset=True)

    if "nome" in alteracoes:
        nome = alteracoes["nome"].strip()

        existente = (
            db.query(PlanoPilates)
            .filter(
                PlanoPilates.nome.ilike(nome),
                PlanoPilates.id != plano_id,
            )
            .first()
        )

        if existente:
            raise HTTPException(
                status_code=400,
                detail="Já existe outro plano de Pilates com este nome.",
            )

        alteracoes["nome"] = nome

    for campo, valor in alteracoes.items():
        setattr(plano, campo, valor)

    db.commit()
    db.refresh(plano)

    return plano


@router.delete(
    "/{plano_id}",
    response_model=PlanoPilatesResposta,
)
def desativar_plano(
    plano_id: int,
    db: Session = Depends(get_db),
):
    plano = (
        db.query(PlanoPilates)
        .filter(PlanoPilates.id == plano_id)
        .first()
    )

    if not plano:
        raise HTTPException(
            status_code=404,
            detail="Plano de Pilates não encontrado.",
        )

    plano.ativo = False

    db.commit()
    db.refresh(plano)

    return plano
