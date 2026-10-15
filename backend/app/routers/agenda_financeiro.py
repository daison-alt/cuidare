"""Integração segura entre a Agenda, Contas a Receber e Caixa.

Leituras por data e criação explícita/idempotente de cobrança de atendimento
normal concluído. Recebimento permanece no Financeiro (recibo e Caixa).
"""
from datetime import date
from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.agendamento import Agendamento
from app.models.agendamento_plano_pilates import AgendamentoPlanoPilates
from app.models.conta_receber import ContaReceber
from app.models.cobranca_plano_pilates import CobrancaPlanoPilates
from app.models.parcela_plano_pilates import ParcelaPlanoPilates
from app.models.servico import Servico
from app.security.autorizacao import exigir_permissao

router = APIRouter(prefix="/agenda-financeiro", tags=["Agenda Financeiro"])


def resumo_conta(conta: ContaReceber):
    valor = Decimal(str(conta.valor or "0"))
    recebido = Decimal(str(conta.valor_pago or "0"))
    saldo = max(Decimal("0.00"), valor - recebido)
    return {
        "id": conta.id,
        "descricao": conta.descricao,
        "categoria": conta.categoria,
        "status": conta.status,
        "valor": float(valor),
        "valor_pago": float(recebido),
        "saldo_pendente": float(saldo),
        "vencimento": conta.vencimento,
    }


def obter_valor_atendimento(agendamento: Agendamento) -> Decimal:
    valor = (
        agendamento.valor_cobrado
        if agendamento.valor_cobrado is not None
        else agendamento.valor_tabela
    )
    try:
        calculado = Decimal(str(valor)).quantize(Decimal("0.01"))
    except (ValueError, InvalidOperation, TypeError):
        return Decimal("0.00")
    if not calculado.is_finite() or calculado <= 0:
        return Decimal("0.00")
    return calculado


@router.get("/resumo")
def consultar_financeiro_da_agenda(
    data: date = Query(...),
    db: Session = Depends(get_db),
    _: dict = Depends(exigir_permissao("contas_receber.visualizar")),
):
    """Só devolve cobranças vinculadas à sessão ou à matrícula exata."""
    agendamentos = (
        db.query(Agendamento)
        .filter(Agendamento.data == data, Agendamento.ativo.is_(True))
        .all()
    )
    if not agendamentos:
        return {"data": data, "atendimentos": {}}

    agendamento_ids = [item.id for item in agendamentos]
    contas_diretas = (
        db.query(ContaReceber)
        .filter(
            ContaReceber.agendamento_id.in_(agendamento_ids),
            ContaReceber.ativo.is_(True),
        )
        .all()
    )
    direta_por_id = {conta.agendamento_id: conta for conta in contas_diretas}

    vinculos = db.query(AgendamentoPlanoPilates).filter(
        AgendamentoPlanoPilates.agendamento_id.in_(agendamento_ids)
    ).all()
    contrato_por_agendamento = {
        item.agendamento_id: item.aluno_plano_id for item in vinculos
    }
    contratos = set(contrato_por_agendamento.values())

    ids_contas_por_contrato = {contrato: set() for contrato in contratos}
    if contratos:
        cobrancas = db.query(CobrancaPlanoPilates).filter(
            CobrancaPlanoPilates.aluno_plano_id.in_(contratos)
        ).all()
        parcelas = db.query(ParcelaPlanoPilates).filter(
            ParcelaPlanoPilates.aluno_plano_id.in_(contratos)
        ).all()
        for item in [*cobrancas, *parcelas]:
            ids_contas_por_contrato[item.aluno_plano_id].add(item.conta_receber_id)

    todos_ids = set(direta.id for direta in contas_diretas)
    for ids in ids_contas_por_contrato.values():
        todos_ids.update(ids)
    contas = (
        db.query(ContaReceber)
        .filter(
            ContaReceber.id.in_(todos_ids),
            ContaReceber.ativo.is_(True),
        )
        .all()
        if todos_ids else []
    )
    conta_por_id = {conta.id: conta for conta in contas}

    resultado = {}
    for item in agendamentos:
        if item.tipo_atendimento == "plano":
            contrato_id = contrato_por_agendamento.get(item.id)
            ids = ids_contas_por_contrato.get(contrato_id, set())
            relevantes = [
                conta_por_id[cid] for cid in ids
                if cid in conta_por_id and
                conta_por_id[cid].paciente_id == item.paciente_id
            ]
        else:
            vinculada = direta_por_id.get(item.id)
            relevantes = (
                [vinculada]
                if vinculada and vinculada.paciente_id == item.paciente_id
                else []
            )
        relevantes.sort(key=lambda conta: (conta.vencimento, conta.id))
        resultado[str(item.id)] = {
            "tipo_atendimento": item.tipo_atendimento,
            "valor_proposto": (
                float(obter_valor_atendimento(item))
                if item.tipo_atendimento == "normal"
                else None
            ),
            "contas": [resumo_conta(conta) for conta in relevantes],
        }

    return {"data": data, "atendimentos": resultado}


@router.post("/agendamentos/{agendamento_id}/cobranca", status_code=201)
def gerar_cobranca_atendimento(
    agendamento_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(exigir_permissao("contas_receber.criar")),
):
    """Nunca cria duas contas para o mesmo agendamento.

    A criação é explícita, nunca dispara por visualização da Agenda.
    Se já existir conta vinculada, retorna a própria conta (idempotência).
    """
    try:
        dialect = db.get_bind().dialect.name
        if dialect == "sqlite":
            db.connection().exec_driver_sql("BEGIN IMMEDIATE")

        consulta = db.query(Agendamento).filter(Agendamento.id == agendamento_id)
        if dialect != "sqlite":
            consulta = consulta.with_for_update()
        item = consulta.first()

        if not item or not item.ativo:
            raise HTTPException(404, "Agendamento não encontrado ou inativo.")

        existente = db.query(ContaReceber).filter(
            ContaReceber.agendamento_id == agendamento_id
        ).first()

        if existente:
            if not existente.ativo or existente.status == "cancelado":
                raise HTTPException(
                    409,
                    "Existe uma cobrança cancelada/inativa vinculada. "
                    "Consulte o Financeiro para regularização."
                )
            if existente.paciente_id != item.paciente_id:
                raise HTTPException(
                    409,
                    "A cobrança vinculada pertence a outro paciente. "
                    "Solicite revisão do cadastro."
                )
            return {"criada": False, "conta": resumo_conta(existente)}

        if item.tipo_atendimento != "normal":
            raise HTTPException(
                409,
                "Esse tipo de atendimento possui regra financeira própria. "
                "Não será gerada outra cobrança."
            )
        if item.status != "concluido":
            raise HTTPException(
                409,
                "Conclua o atendimento antes de gerar a cobrança."
            )

        valor = obter_valor_atendimento(item)
        if valor <= 0:
            raise HTTPException(
                409,
                "Atendimento sem valor positivo definido. "
                "Revise o preço antes de gerar cobrança."
            )

        servico = db.get(Servico, item.servico_id)
        nome_servico = servico.nome if servico else "Fisioterapia"

        conta = ContaReceber(
            paciente_id=item.paciente_id,
            agendamento_id=item.id,
            descricao=f"{nome_servico} - Atendimento #{item.id}",
            categoria="Atendimento",
            valor=valor,
            vencimento=item.data,
            status="pendente",
            valor_pago=Decimal("0.00"),
            forma_pagamento=None,
            data_pagamento=None,
            observacoes=(
                "Cobrança gerada explicitamente pela Agenda Inteligente. "
                "O recebimento deverá ser registrado pelo Financeiro "
                "com Caixa aberto. Não criar cobrança manual duplicada."
            ),
            ativo=True,
        )
        db.add(conta)
        db.commit()
        db.refresh(conta)
        return {"criada": True, "conta": resumo_conta(conta)}

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            500,
            "Não foi possível gerar a cobrança. "
            "Atualize a Agenda e confira o Financeiro antes de tentar novamente.",
        )
