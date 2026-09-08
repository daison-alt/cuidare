from datetime import date, time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.agendamento import Agendamento
from app.models.paciente import Paciente
from app.models.servico import Servico
from app.models.usuario import Usuario
from app.schemas.agendamento import (
    AgendamentoAtualizar,
    AgendamentoCriar,
    AgendamentoResposta,
    STATUS_AGENDAMENTO,
)


router = APIRouter(
    prefix="/agendamentos",
    tags=["Agendamentos"],
)


def validar_horarios(
    hora_inicio: time,
    hora_fim: time,
):
    if hora_fim <= hora_inicio:
        raise HTTPException(
            status_code=400,
            detail="O horário final deve ser posterior ao horário inicial.",
        )


def validar_status(status: str):
    if status not in STATUS_AGENDAMENTO:
        raise HTTPException(
            status_code=400,
            detail="Status de agendamento inválido.",
        )


def validar_paciente(
    paciente_id: int,
    db: Session,
):
    paciente = (
        db.query(Paciente)
        .filter(Paciente.id == paciente_id)
        .first()
    )

    if not paciente:
        raise HTTPException(
            status_code=404,
            detail="Paciente não encontrado.",
        )

    if not paciente.ativo:
        raise HTTPException(
            status_code=400,
            detail="O paciente está inativo.",
        )

    return paciente


def validar_profissional(
    profissional_id: int,
    db: Session,
):
    profissional = (
        db.query(Usuario)
        .filter(Usuario.id == profissional_id)
        .first()
    )

    if not profissional:
        raise HTTPException(
            status_code=404,
            detail="Profissional não encontrado.",
        )

    if not profissional.status:
        raise HTTPException(
            status_code=400,
            detail="O profissional está inativo.",
        )

    if profissional.perfil != "fisioterapeuta":
        raise HTTPException(
            status_code=400,
            detail="O usuário informado não possui perfil de fisioterapeuta.",
        )

    return profissional


def validar_servico(
    servico_id: int,
    db: Session,
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

    if not servico.ativo:
        raise HTTPException(
            status_code=400,
            detail="O serviço está inativo.",
        )

    return servico


def verificar_conflito(
    db: Session,
    profissional_id: int,
    data: date,
    hora_inicio: time,
    hora_fim: time,
    agendamento_id: int | None = None,
):
    consulta = (
        db.query(Agendamento)
        .filter(
            Agendamento.profissional_id == profissional_id,
            Agendamento.data == data,
            Agendamento.ativo == True,
            Agendamento.status.notin_(["cancelado", "faltou"]),
            Agendamento.hora_inicio < hora_fim,
            Agendamento.hora_fim > hora_inicio,
        )
    )

    if agendamento_id is not None:
        consulta = consulta.filter(
            Agendamento.id != agendamento_id
        )

    conflito = consulta.first()

    if conflito:
        raise HTTPException(
            status_code=409,
            detail="Já existe um agendamento para este profissional nesse horário.",
        )


@router.post(
    "",
    response_model=AgendamentoResposta,
)
def criar_agendamento(
    dados: AgendamentoCriar,
    db: Session = Depends(get_db),
):
    validar_horarios(
        dados.hora_inicio,
        dados.hora_fim,
    )

    validar_status(dados.status)

    validar_paciente(
        dados.paciente_id,
        db,
    )

    validar_profissional(
        dados.profissional_id,
        db,
    )

    validar_servico(
        dados.servico_id,
        db,
    )

    verificar_conflito(
        db=db,
        profissional_id=dados.profissional_id,
        data=dados.data,
        hora_inicio=dados.hora_inicio,
        hora_fim=dados.hora_fim,
    )

    agendamento = Agendamento(
        paciente_id=dados.paciente_id,
        profissional_id=dados.profissional_id,
        servico_id=dados.servico_id,
        data=dados.data,
        hora_inicio=dados.hora_inicio,
        hora_fim=dados.hora_fim,
        status=dados.status,
        observacoes=dados.observacoes,
        ativo=dados.ativo,
    )

    db.add(agendamento)
    db.commit()
    db.refresh(agendamento)

    return agendamento


@router.get(
    "",
    response_model=list[AgendamentoResposta],
)
def listar_agendamentos(
    data: date | None = None,
    profissional_id: int | None = None,
    paciente_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    consulta = db.query(Agendamento)

    if data is not None:
        consulta = consulta.filter(
            Agendamento.data == data
        )

    if profissional_id is not None:
        consulta = consulta.filter(
            Agendamento.profissional_id == profissional_id
        )

    if paciente_id is not None:
        consulta = consulta.filter(
            Agendamento.paciente_id == paciente_id
        )

    if status is not None:
        validar_status(status)
        consulta = consulta.filter(
            Agendamento.status == status
        )

    return (
        consulta
        .order_by(
            Agendamento.data.asc(),
            Agendamento.hora_inicio.asc(),
        )
        .all()
    )


@router.get(
    "/{agendamento_id}",
    response_model=AgendamentoResposta,
)
def buscar_agendamento(
    agendamento_id: int,
    db: Session = Depends(get_db),
):
    agendamento = (
        db.query(Agendamento)
        .filter(Agendamento.id == agendamento_id)
        .first()
    )

    if not agendamento:
        raise HTTPException(
            status_code=404,
            detail="Agendamento não encontrado.",
        )

    return agendamento


@router.put(
    "/{agendamento_id}",
    response_model=AgendamentoResposta,
)
def atualizar_agendamento(
    agendamento_id: int,
    dados: AgendamentoAtualizar,
    db: Session = Depends(get_db),
):
    agendamento = (
        db.query(Agendamento)
        .filter(Agendamento.id == agendamento_id)
        .first()
    )

    if not agendamento:
        raise HTTPException(
            status_code=404,
            detail="Agendamento não encontrado.",
        )

    campos = dados.model_dump(
        exclude_unset=True
    )

    novo_paciente_id = campos.get(
        "paciente_id",
        agendamento.paciente_id,
    )

    novo_profissional_id = campos.get(
        "profissional_id",
        agendamento.profissional_id,
    )

    novo_servico_id = campos.get(
        "servico_id",
        agendamento.servico_id,
    )

    nova_data = campos.get(
        "data",
        agendamento.data,
    )

    nova_hora_inicio = campos.get(
        "hora_inicio",
        agendamento.hora_inicio,
    )

    nova_hora_fim = campos.get(
        "hora_fim",
        agendamento.hora_fim,
    )

    novo_status = campos.get(
        "status",
        agendamento.status,
    )

    validar_horarios(
        nova_hora_inicio,
        nova_hora_fim,
    )

    validar_status(novo_status)

    validar_paciente(
        novo_paciente_id,
        db,
    )

    validar_profissional(
        novo_profissional_id,
        db,
    )

    validar_servico(
        novo_servico_id,
        db,
    )

    verificar_conflito(
        db=db,
        profissional_id=novo_profissional_id,
        data=nova_data,
        hora_inicio=nova_hora_inicio,
        hora_fim=nova_hora_fim,
        agendamento_id=agendamento_id,
    )

    for campo, valor in campos.items():
        setattr(agendamento, campo, valor)

    db.commit()
    db.refresh(agendamento)

    return agendamento
