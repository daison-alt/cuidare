from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.paciente import Paciente
from app.schemas.paciente import (
    PacienteAtualizar,
    PacienteCriar,
    PacienteResposta,
)


router = APIRouter(
    prefix="/pacientes",
    tags=["Pacientes"],
)


@router.get(
    "",
    response_model=list[PacienteResposta],
)
def listar_pacientes(
    db: Session = Depends(get_db),
):
    return (
        db.query(Paciente)
        .filter(Paciente.ativo == True)
        .order_by(Paciente.nome.asc())
        .all()
    )


@router.get(
    "/{paciente_id}",
    response_model=PacienteResposta,
)
def buscar_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
):
    paciente = (
        db.query(Paciente)
        .filter(
            Paciente.id == paciente_id,
            Paciente.ativo == True,
        )
        .first()
    )

    if not paciente:
        raise HTTPException(
            status_code=404,
            detail="Paciente não encontrado.",
        )

    return paciente


@router.post(
    "",
    response_model=PacienteResposta,
    status_code=201,
)
def criar_paciente(
    dados: PacienteCriar,
    db: Session = Depends(get_db),
):
    if dados.cpf:
        cpf_existente = (
            db.query(Paciente)
            .filter(Paciente.cpf == dados.cpf.strip())
            .first()
        )

        if cpf_existente:
            raise HTTPException(
                status_code=409,
                detail="Já existe um paciente cadastrado com este CPF.",
            )

    paciente = Paciente(
        **dados.model_dump()
    )

    db.add(paciente)
    db.commit()
    db.refresh(paciente)

    return paciente


@router.put(
    "/{paciente_id}",
    response_model=PacienteResposta,
)
def atualizar_paciente(
    paciente_id: int,
    dados: PacienteAtualizar,
    db: Session = Depends(get_db),
):
    paciente = (
        db.query(Paciente)
        .filter(
            Paciente.id == paciente_id,
            Paciente.ativo == True,
        )
        .first()
    )

    if not paciente:
        raise HTTPException(
            status_code=404,
            detail="Paciente não encontrado.",
        )

    dados_atualizados = dados.model_dump(
        exclude_unset=True
    )

    if "cpf" in dados_atualizados:
        cpf = dados_atualizados["cpf"]

        if cpf:
            cpf_existente = (
                db.query(Paciente)
                .filter(
                    Paciente.cpf == cpf.strip(),
                    Paciente.id != paciente_id,
                )
                .first()
            )

            if cpf_existente:
                raise HTTPException(
                    status_code=409,
                    detail="Já existe outro paciente cadastrado com este CPF.",
                )

            dados_atualizados["cpf"] = cpf.strip()

    for campo, valor in dados_atualizados.items():
        setattr(paciente, campo, valor)

    db.commit()
    db.refresh(paciente)

    return paciente


@router.delete(
    "/{paciente_id}",
)
def desativar_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
):
    paciente = (
        db.query(Paciente)
        .filter(
            Paciente.id == paciente_id,
            Paciente.ativo == True,
        )
        .first()
    )

    if not paciente:
        raise HTTPException(
            status_code=404,
            detail="Paciente não encontrado.",
        )

    paciente.ativo = False

    db.commit()

    return {
        "status": "ok",
        "message": "Paciente desativado com sucesso.",
    }
