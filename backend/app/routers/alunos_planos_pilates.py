from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.aluno_plano_pilates import AlunoPlanoPilates
from app.models.paciente import Paciente
from app.models.plano_pilates import PlanoPilates
from app.schemas.aluno_plano_pilates import (
    AlunoPlanoPilatesAtualizar,
    AlunoPlanoPilatesCriar,
    AlunoPlanoPilatesResposta,
    STATUS_VALIDOS,
)


router = APIRouter(
    prefix="/alunos-planos-pilates",
    tags=["Alunos - Planos de Pilates"],
)


def montar_resposta(registro: AlunoPlanoPilates, db: Session):
    paciente = db.query(Paciente).filter(
        Paciente.id == registro.paciente_id
    ).first()

    plano = db.query(PlanoPilates).filter(
        PlanoPilates.id == registro.plano_id
    ).first()

    return {
        "id": registro.id,
        "paciente_id": registro.paciente_id,
        "paciente_nome": paciente.nome if paciente else f"Paciente #{registro.paciente_id}",
        "plano_id": registro.plano_id,
        "plano_nome": plano.nome if plano else f"Plano #{registro.plano_id}",
        "data_inicio": registro.data_inicio,
        "data_fim": registro.data_fim,
        "valor_contratado": registro.valor_contratado,
        "aulas_previstas": registro.aulas_previstas,
        "aulas_utilizadas": registro.aulas_utilizadas,
        "status": registro.status,
        "observacoes": registro.observacoes,
        "ativo": registro.ativo,
        "criado_em": registro.criado_em,
        "atualizado_em": registro.atualizado_em,
        "aulas_restantes": max(
            registro.aulas_previstas - registro.aulas_utilizadas,
            0,
        ),
    }


@router.post(
    "",
    response_model=AlunoPlanoPilatesResposta,
    status_code=status.HTTP_201_CREATED,
)
def criar_contrato(
    dados: AlunoPlanoPilatesCriar,
    db: Session = Depends(get_db),
):
    if dados.data_fim < dados.data_inicio:
        raise HTTPException(
            status_code=400,
            detail="A data de término não pode ser anterior à data de início.",
        )

    paciente = (
        db.query(Paciente)
        .filter(Paciente.id == dados.paciente_id)
        .first()
    )

    if not paciente:
        raise HTTPException(
            status_code=404,
            detail="Paciente não encontrado.",
        )

    if hasattr(paciente, "ativo") and not paciente.ativo:
        raise HTTPException(
            status_code=400,
            detail="O paciente está inativo.",
        )

    plano = (
        db.query(PlanoPilates)
        .filter(PlanoPilates.id == dados.plano_id)
        .first()
    )

    if not plano:
        raise HTTPException(
            status_code=404,
            detail="Plano de Pilates não encontrado.",
        )

    if not plano.ativo:
        raise HTTPException(
            status_code=400,
            detail="O plano de Pilates está inativo.",
        )

    contrato_ativo = (
        db.query(AlunoPlanoPilates)
        .filter(
            AlunoPlanoPilates.paciente_id == dados.paciente_id,
            AlunoPlanoPilates.ativo.is_(True),
            AlunoPlanoPilates.status == "ativo",
        )
        .first()
    )

    if contrato_ativo:
        raise HTTPException(
            status_code=400,
            detail=(
                "O paciente já possui um plano de Pilates ativo. "
                "Encerre ou suspenda o plano atual antes de contratar outro."
            ),
        )

    registro = AlunoPlanoPilates(
        paciente_id=dados.paciente_id,
        plano_id=dados.plano_id,
        data_inicio=dados.data_inicio,
        data_fim=dados.data_fim,
        valor_contratado=dados.valor_contratado,
        aulas_previstas=plano.quantidade_aulas,
        aulas_utilizadas=0,
        status="ativo",
        observacoes=dados.observacoes,
        ativo=True,
    )

    db.add(registro)
    db.commit()
    db.refresh(registro)

    return montar_resposta(registro, db)


@router.get(
    "",
    response_model=list[AlunoPlanoPilatesResposta],
)
def listar_contratos(
    paciente_id: int | None = None,
    status_filtro: str | None = None,
    ativo: bool | None = None,
    db: Session = Depends(get_db),
):
    consulta = db.query(AlunoPlanoPilates)

    if paciente_id is not None:
        consulta = consulta.filter(
            AlunoPlanoPilates.paciente_id == paciente_id
        )

    if status_filtro is not None:
        if status_filtro not in STATUS_VALIDOS:
            raise HTTPException(
                status_code=400,
                detail="Status de plano inválido.",
            )

        consulta = consulta.filter(
            AlunoPlanoPilates.status == status_filtro
        )

    if ativo is not None:
        consulta = consulta.filter(
            AlunoPlanoPilates.ativo == ativo
        )

    registros = consulta.order_by(
        AlunoPlanoPilates.data_inicio.desc(),
        AlunoPlanoPilates.id.desc(),
    ).all()

    return [montar_resposta(registro, db) for registro in registros]


@router.get(
    "/{contrato_id}",
    response_model=AlunoPlanoPilatesResposta,
)
def obter_contrato(
    contrato_id: int,
    db: Session = Depends(get_db),
):
    registro = (
        db.query(AlunoPlanoPilates)
        .filter(AlunoPlanoPilates.id == contrato_id)
        .first()
    )

    if not registro:
        raise HTTPException(
            status_code=404,
            detail="Plano do paciente não encontrado.",
        )

    return montar_resposta(registro, db)


@router.put(
    "/{contrato_id}",
    response_model=AlunoPlanoPilatesResposta,
)
def atualizar_contrato(
    contrato_id: int,
    dados: AlunoPlanoPilatesAtualizar,
    db: Session = Depends(get_db),
):
    registro = (
        db.query(AlunoPlanoPilates)
        .filter(AlunoPlanoPilates.id == contrato_id)
        .first()
    )

    if not registro:
        raise HTTPException(
            status_code=404,
            detail="Plano do paciente não encontrado.",
        )

    alteracoes = dados.model_dump(exclude_unset=True)

    nova_data_inicio = alteracoes.get(
        "data_inicio",
        registro.data_inicio,
    )

    nova_data_fim = alteracoes.get(
        "data_fim",
        registro.data_fim,
    )

    if nova_data_fim < nova_data_inicio:
        raise HTTPException(
            status_code=400,
            detail="A data de término não pode ser anterior à data de início.",
        )

    if "status" in alteracoes:
        novo_status = alteracoes["status"]

        if novo_status not in STATUS_VALIDOS:
            raise HTTPException(
                status_code=400,
                detail="Status de plano inválido.",
            )

        if novo_status in {"encerrado", "cancelado", "suspenso"}:
            alteracoes["ativo"] = False

        elif novo_status == "ativo":
            outro_ativo = (
                db.query(AlunoPlanoPilates)
                .filter(
                    AlunoPlanoPilates.paciente_id == registro.paciente_id,
                    AlunoPlanoPilates.id != registro.id,
                    AlunoPlanoPilates.ativo.is_(True),
                    AlunoPlanoPilates.status == "ativo",
                )
                .first()
            )

            if outro_ativo:
                raise HTTPException(
                    status_code=400,
                    detail="O paciente já possui outro plano de Pilates ativo.",
                )

            alteracoes["ativo"] = True

    for campo, valor in alteracoes.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)

    return montar_resposta(registro, db)


@router.post(
    "/{contrato_id}/utilizar-aula",
    response_model=AlunoPlanoPilatesResposta,
)
def utilizar_aula(
    contrato_id: int,
    db: Session = Depends(get_db),
):
    registro = (
        db.query(AlunoPlanoPilates)
        .filter(AlunoPlanoPilates.id == contrato_id)
        .first()
    )

    if not registro:
        raise HTTPException(
            status_code=404,
            detail="Plano do paciente não encontrado.",
        )

    if registro.status != "ativo" or not registro.ativo:
        raise HTTPException(
            status_code=400,
            detail="O plano do paciente não está ativo.",
        )

    if registro.data_fim < date.today():
        raise HTTPException(
            status_code=400,
            detail="O plano do paciente está fora da validade.",
        )

    if registro.aulas_utilizadas >= registro.aulas_previstas:
        raise HTTPException(
            status_code=400,
            detail="O plano não possui aulas disponíveis.",
        )

    registro.aulas_utilizadas += 1

    db.commit()
    db.refresh(registro)

    return montar_resposta(registro, db)


@router.post(
    "/{contrato_id}/desfazer-aula",
    response_model=AlunoPlanoPilatesResposta,
)
def desfazer_aula(
    contrato_id: int,
    db: Session = Depends(get_db),
):
    registro = (
        db.query(AlunoPlanoPilates)
        .filter(AlunoPlanoPilates.id == contrato_id)
        .first()
    )

    if not registro:
        raise HTTPException(
            status_code=404,
            detail="Plano do paciente não encontrado.",
        )

    if registro.aulas_utilizadas <= 0:
        raise HTTPException(
            status_code=400,
            detail="Não há aula utilizada para desfazer.",
        )

    registro.aulas_utilizadas -= 1

    db.commit()
    db.refresh(registro)

    return montar_resposta(registro, db)
