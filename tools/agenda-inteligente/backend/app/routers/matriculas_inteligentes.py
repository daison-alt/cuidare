from datetime import date, datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.agendamento import Agendamento
from app.models.agendamento_plano_pilates import AgendamentoPlanoPilates
from app.models.aluno_plano_pilates import AlunoPlanoPilates
from app.models.paciente import Paciente
from app.models.plano_pilates import PlanoPilates
from app.models.servico import Servico
from app.models.usuario import Usuario
from app.security.auth import verificar_token
from app.security.permissoes import tem_permissao

router = APIRouter(prefix="/matriculas-inteligentes", tags=["Matrículas inteligentes"])
DIAS = (0, 1, 2, 3, 4, 5)


def exigir_acesso(authorization: str | None = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Autenticação necessária.")
    try:
        payload = verificar_token(authorization[7:].strip())
    except ValueError:
        raise HTTPException(401, "Token inválido ou expirado.")
    perfil = str(payload.get("perfil", "")).lower().strip()
    if not tem_permissao(perfil, "agenda.criar"):
        raise HTTPException(403, "Sem permissão para matricular alunos.")


class HorarioSemanal(BaseModel):
    dia_semana: int = Field(ge=0, le=5)
    hora_inicio: time


class MatriculaInteligente(BaseModel):
    paciente_id: int
    plano_id: int
    profissional_id: int
    data_inicio: date
    data_fim: date
    valor_contratado: Decimal = Field(ge=0)
    observacoes: str | None = None
    horarios_semanais: list[HorarioSemanal] = Field(min_length=1, max_length=2)


def preparar(db, plano_id, profissional_id, inicio, fim, paciente_id=None):
    if inicio < datetime.now(ZoneInfo("America/Sao_Paulo")).date():
        raise HTTPException(400, "A matrícula não pode começar em uma data passada.")
    if fim < inicio:
        raise HTTPException(400, "A data final é anterior à data inicial.")
    plano = db.get(PlanoPilates, plano_id)
    profissional = db.get(Usuario, profissional_id)
    if not plano or not plano.ativo:
        raise HTTPException(400, "Plano de Pilates inexistente ou inativo.")
    if not profissional or not profissional.status or profissional.perfil != "fisioterapeuta":
        raise HTTPException(400, "Selecione um fisioterapeuta ativo.")
    if plano.modalidade not in {"grupo", "individual"}:
        raise HTTPException(400, "Modalidade do plano inválida.")
    servico = db.query(Servico).filter(
        Servico.modalidade_pilates == plano.modalidade,
        Servico.ativo.is_(True),
    ).first()
    if not servico:
        raise HTTPException(400, "Serviço de Pilates da modalidade não cadastrado.")
    if plano.frequencia_semanal not in (1, 2) or plano.quantidade_aulas % plano.frequencia_semanal:
        raise HTTPException(400, "Quantidade de aulas incompatível com a frequência.")
    if paciente_id is not None:
        paciente = db.get(Paciente, paciente_id)
        if not paciente or not paciente.ativo:
            raise HTTPException(400, "Paciente inexistente ou inativo.")
    return plano, servico


def datas_semanais(inicio, fim, dia_semana, quantidade):
    dia = inicio + timedelta(days=(dia_semana - inicio.weekday()) % 7)
    datas = []
    for _ in range(quantidade):
        if dia > fim:
            raise HTTPException(400, "O período do plano não comporta todas as aulas nos dias escolhidos.")
        datas.append(dia)
        dia += timedelta(days=7)
    return datas


def terminar(horario, minutos):
    total = horario.hour * 60 + horario.minute + int(minutos)
    if total >= 24 * 60:
        raise HTTPException(400, "Horário de término inválido.")
    return time(total // 60, total % 60)


def carregar_ocupacao(db, profissional_id, paciente_id, inicio, fim):
    filtros = [Agendamento.profissional_id == profissional_id]
    if paciente_id is not None:
        filtros.append(Agendamento.paciente_id == paciente_id)
    return db.query(Agendamento).filter(
        or_(*filtros),
        Agendamento.data >= inicio,
        Agendamento.data <= fim,
        Agendamento.ativo.is_(True),
        Agendamento.status.notin_(["cancelado", "faltou"]),
    ).all()


def ocupacao(agendamentos, profissional_id, paciente_id, servico, dia, inicio, fim):
    agora = datetime.now(ZoneInfo("America/Sao_Paulo"))
    if dia == agora.date() and inicio <= agora.time().replace(tzinfo=None):
        return None
    sobrepostos = [
        a for a in agendamentos
        if a.data == dia and a.hora_inicio < fim and a.hora_fim > inicio
    ]
    if paciente_id is not None and any(a.paciente_id == paciente_id for a in sobrepostos):
        return None
    ocupantes = [a for a in sobrepostos if a.profissional_id == profissional_id]
    if servico.modalidade_pilates == "individual":
        return 0 if not ocupantes else None
    if len(ocupantes) >= 3:
        return None
    if any(
        a.servico_id != servico.id or a.hora_inicio != inicio or a.hora_fim != fim
        for a in ocupantes
    ):
        return None
    return len(ocupantes)


@router.get("/opcoes", dependencies=[Depends(exigir_acesso)])
def opcoes(
    plano_id: int,
    profissional_id: int,
    data_inicio: date,
    data_fim: date,
    paciente_id: int | None = None,
    db: Session = Depends(get_db),
):
    plano, servico = preparar(
        db, plano_id, profissional_id, data_inicio, data_fim, paciente_id
    )
    por_dia = plano.quantidade_aulas // plano.frequencia_semanal
    agenda = carregar_ocupacao(db, profissional_id, paciente_id, data_inicio, data_fim)
    opcoes_validas = []
    for dia_semana in DIAS:
        try:
            datas = datas_semanais(data_inicio, data_fim, dia_semana, por_dia)
        except HTTPException:
            continue
        for hora in range(6, 20):
            inicio = time(hora, 0)
            fim = terminar(inicio, servico.duracao_minutos)
            ocupacoes = [
                ocupacao(agenda, profissional_id, paciente_id, servico, dia, inicio, fim)
                for dia in datas
            ]
            if any(n is None for n in ocupacoes):
                continue
            opcoes_validas.append({
                "dia_semana": dia_semana,
                "hora_inicio": inicio.isoformat(timespec="minutes"),
                "hora_fim": fim.isoformat(timespec="minutes"),
                "ocupacao_minima": min(ocupacoes),
                "ocupacao_media": round(sum(ocupacoes) / len(ocupacoes), 1),
                "vagas_minimas": (
                    1 if plano.modalidade == "individual" else 3 - max(ocupacoes)
                ),
                "datas_verificadas": len(datas),
            })
    opcoes_validas.sort(key=lambda x: (
        -x["ocupacao_minima"], -x["ocupacao_media"],
        x["dia_semana"], x["hora_inicio"],
    ))
    return {
        "modalidade": plano.modalidade,
        "frequencia": plano.frequencia_semanal,
        "aulas": plano.quantidade_aulas,
        "opcoes": opcoes_validas,
    }


@router.post("", status_code=201, dependencies=[Depends(exigir_acesso)])
def matricular(dados: MatriculaInteligente, db: Session = Depends(get_db)):
    # BEGIN IMMEDIATE impede que duas matrículas disputem a última vaga
    # simultaneamente no banco SQLite.
    try:
        db.connection().exec_driver_sql("BEGIN IMMEDIATE")
        plano, servico = preparar(
            db, dados.plano_id, dados.profissional_id,
            dados.data_inicio, dados.data_fim, dados.paciente_id
        )
        horarios = dados.horarios_semanais
        if len(horarios) != plano.frequencia_semanal:
            raise HTTPException(400, "Selecione os dias correspondentes à frequência do plano.")
        if len({h.dia_semana for h in horarios}) != len(horarios):
            raise HTTPException(400, "Selecione dias da semana diferentes.")
        if any(h.hora_inicio.minute != 0 or not 6 <= h.hora_inicio.hour <= 19 for h in horarios):
            raise HTTPException(400, "Selecione um dos horários disponíveis, das 06h às 19h.")
        contrato_existente = db.query(AlunoPlanoPilates.id).filter(
            AlunoPlanoPilates.paciente_id == dados.paciente_id,
            AlunoPlanoPilates.ativo.is_(True),
            AlunoPlanoPilates.status == "ativo",
        ).first()
        if contrato_existente:
            raise HTTPException(409, "Este paciente já possui um plano de Pilates ativo.")
        por_dia = plano.quantidade_aulas // plano.frequencia_semanal
        agenda = carregar_ocupacao(db, dados.profissional_id, dados.paciente_id,
                                  dados.data_inicio, dados.data_fim)
        reservas = []
        for horario in horarios:
            fim = terminar(horario.hora_inicio, servico.duracao_minutos)
            for dia in datas_semanais(dados.data_inicio, dados.data_fim,
                                     horario.dia_semana, por_dia):
                n = ocupacao(agenda, dados.profissional_id, dados.paciente_id,
                             servico, dia, horario.hora_inicio, fim)
                if n is None:
                    raise HTTPException(
                        409, f"Sem vaga para {dia:%d/%m/%Y} às "
                             f"{horario.hora_inicio:%H:%M}. Escolha outro horário."
                    )
                reservas.append((dia, horario.hora_inicio, fim))
        if len(reservas) != plano.quantidade_aulas:
            raise HTTPException(400, "A quantidade de reservas não corresponde ao plano.")
        contrato = AlunoPlanoPilates(
            paciente_id=dados.paciente_id, plano_id=plano.id,
            data_inicio=dados.data_inicio, data_fim=dados.data_fim,
            valor_contratado=dados.valor_contratado,
            aulas_previstas=plano.quantidade_aulas, aulas_utilizadas=0,
            status="ativo", observacoes=dados.observacoes, ativo=True,
        )
        db.add(contrato)
        db.flush()
        for dia, inicio, fim in sorted(reservas):
            agendamento = Agendamento(
                paciente_id=dados.paciente_id, profissional_id=dados.profissional_id,
                servico_id=servico.id, data=dia,
                hora_inicio=inicio, hora_fim=fim,
                status="agendado", tipo_atendimento="plano",
                valor_cobrado=Decimal("0.00"), ativo=True,
            )
            db.add(agendamento)
            db.flush()
            db.add(AgendamentoPlanoPilates(
                agendamento_id=agendamento.id, aluno_plano_id=contrato.id,
                aula_consumida=False,
            ))
        db.commit()
        return {"matricula_id": contrato.id, "aulas_agendadas": len(reservas)}
    except Exception:
        db.rollback()
        raise
