from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.servico import Servico
from app.schemas.servico import (
    ServicoAtualizar,
    ServicoCriar,
    ServicoResposta,
)


router = APIRouter(
    prefix="/servicos",
    tags=["Serviços"],
)


@router.post(
    "",
    response_model=ServicoResposta,
)
def criar_servico(
    dados: ServicoCriar,
    db: Session = Depends(get_db),
):
    existente = (
        db.query(Servico)
        .filter(Servico.nome == dados.nome)
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=400,
            detail="Já existe um serviço com esse nome.",
        )

    if dados.duracao_minutos <= 0:
        raise HTTPException(
            status_code=400,
            detail="A duração deve ser maior que zero.",
        )

    servico = Servico(
        nome=dados.nome.strip(),
        descricao=dados.descricao,
        duracao_minutos=dados.duracao_minutos,
        valor=dados.valor,
        ativo=dados.ativo,
    )

    db.add(servico)
    db.commit()
    db.refresh(servico)

    return servico


@router.get(
    "",
    response_model=list[ServicoResposta],
)
def listar_servicos(
    db: Session = Depends(get_db),
):
    return (
        db.query(Servico)
        .order_by(Servico.nome.asc())
        .all()
    )


@router.get(
    "/{servico_id}",
    response_model=ServicoResposta,
)
def buscar_servico(
    servico_id: int,
    db: Session = Depends(get_db),
):
    servico = (
        db.query(Servico)
        .filter(Servico.id == servico_id)
        .first()
    )

    if not servico:
        raise HTTPException(
            status_code=404,
            detail="Serviço não encontrado.",
        )

    return servico


@router.put(
    "/{servico_id}",
    response_model=ServicoResposta,
)
def atualizar_servico(
    servico_id: int,
    dados: ServicoAtualizar,
    db: Session = Depends(get_db),
):
    servico = (
        db.query(Servico)
        .filter(Servico.id == servico_id)
        .first()
    )

    if not servico:
        raise HTTPException(
            status_code=404,
            detail="Serviço não encontrado.",
        )

    campos = dados.model_dump(exclude_unset=True)

    if "nome" in campos and campos["nome"]:
        outro = (
            db.query(Servico)
            .filter(
                Servico.nome == campos["nome"],
                Servico.id != servico_id,
            )
            .first()
        )

        if outro:
            raise HTTPException(
                status_code=400,
                detail="Já existe outro serviço com esse nome.",
            )

        campos["nome"] = campos["nome"].strip()

    if (
        "duracao_minutos" in campos
        and campos["duracao_minutos"] is not None
        and campos["duracao_minutos"] <= 0
    ):
        raise HTTPException(
            status_code=400,
            detail="A duração deve ser maior que zero.",
        )

    for campo, valor in campos.items():
        setattr(servico, campo, valor)

    db.commit()
    db.refresh(servico)

    return servico
