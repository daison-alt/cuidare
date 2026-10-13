"""Conferência de receitas e Caixa. Apenas consulta, sem escritas no banco."""
from collections import defaultdict
from decimal import Decimal
import re

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auditoria_estorno import AuditoriaEstorno
from app.models.conta_receber import ContaReceber
from app.models.movimentacao_caixa import MovimentacaoCaixa
from app.models.recebimento_conta import RecebimentoConta
from app.models.recebimento_conta_forma import RecebimentoContaForma
from app.security.autorizacao import exigir_permissao


router = APIRouter(prefix="/financeiro", tags=["Conferência Financeira"])


def moeda(valor):
    return Decimal(str(valor or 0)).quantize(Decimal("0.01"))


def alerta(destino, codigo, texto, conta_id=None, recibo_id=None):
    destino.append({
        "codigo": codigo,
        "mensagem": texto,
        "conta_id": conta_id,
        "recibo_id": recibo_id,
    })


@router.get("/conciliacao")
def consultar_conciliacao(
    db: Session = Depends(get_db),
    _=Depends(exigir_permissao("financeiro.visualizar")),
):
    # Leitura apenas; nenhuma tabela ou valor é modificado.
    contas = db.query(ContaReceber).all()
    recibos = db.query(RecebimentoConta).all()
    formas = db.query(RecebimentoContaForma).all()
    movimentos = db.query(MovimentacaoCaixa).filter(
        MovimentacaoCaixa.categoria.in_(
            ("recebimento", "estorno_recebimento")
        )
    ).all()
    auditorias = db.query(AuditoriaEstorno).all()

    contas_por_id = {c.id: c for c in contas}
    recibos_por_id = {r.id: r for r in recibos}
    formas_por_recibo = defaultdict(list)
    for forma in formas:
        formas_por_recibo[forma.recebimento_id].append(forma)

    movimentos_por_id = {m.id: m for m in movimentos}
    entradas_por_recibo = defaultdict(list)
    regex = re.compile(r"Recibo #(\d+)\b")

    alertas = []
    observacoes = []
    recibos_por_conta = defaultdict(list)
    total_entradas_recibos = Decimal("0.00")
    total_recibos_ativos = Decimal("0.00")

    # Apenas entradas com referência expressa a recibo.
    # Entradas manuais antigas sem recibo não são presumidas como fraudulentas.
    for m in movimentos:
        if m.categoria != "recebimento":
            continue
        match = regex.search(m.observacoes or "")
        if match:
            id_recibo = int(match.group(1))
            entradas_por_recibo[id_recibo].append(m)
            if id_recibo not in recibos_por_id:
                alerta(
                    alertas,
                    "movimento_sem_recibo",
                    "Movimento #%d aponta para recibo inexistente #%d." %
                    (m.id, id_recibo),
                    recibo_id=id_recibo,
                )

    for recibo in recibos:
        conta = contas_por_id.get(recibo.conta_receber_id)
        recibos_por_conta[recibo.conta_receber_id].append(recibo)
        id_recibo = recibo.id
        total = moeda(recibo.valor_total)
        pagamentos = [
            f for f in formas_por_recibo[id_recibo] if f.ativo
        ]
        entradas = [
            m for m in entradas_por_recibo[id_recibo] if m.ativo
        ]

        total_formas = sum((moeda(f.valor) for f in pagamentos), Decimal("0.00"))
        total_entradas = sum((moeda(m.valor) for m in entradas), Decimal("0.00"))

        if conta is None:
            alerta(
                alertas, "recibo_sem_conta",
                "Recibo #%d não possui conta a receber existente." % id_recibo,
                recibo_id=id_recibo,
            )
        elif not conta.ativo:
            alerta(
                alertas, "conta_desativada_com_recibo",
                "Conta #%d está inativa, mas tem histórico de recibo #%d." %
                (conta.id, id_recibo),
                conta_id=conta.id, recibo_id=id_recibo,
            )

        if total_entradas != total:
            alerta(
                alertas, "recibo_movimento_divergente",
                "Recibo #%d: recebido R$ %.2f e entrada no Caixa R$ %.2f." %
                (id_recibo, total, total_entradas),
                conta_id=recibo.conta_receber_id, recibo_id=id_recibo,
            )
        for entrada in entradas:
            if entrada.tipo != "entrada":
                alerta(
                    alertas, "tipo_movimento_inesperado",
                    "Movimento #%d do recibo #%d não é uma entrada." %
                    (entrada.id, id_recibo),
                    conta_id=recibo.conta_receber_id,
                    recibo_id=id_recibo,
                )

        if recibo.ativo:
            total_recibos_ativos += total
            total_entradas_recibos += total_entradas
            if total_formas != total:
                alerta(
                    alertas, "formas_divergentes",
                    "Recibo #%d: soma dos meios de pagamento R$ %.2f, recibo R$ %.2f." %
                    (id_recibo, total_formas, total),
                    conta_id=recibo.conta_receber_id, recibo_id=id_recibo,
                )
            for forma in pagamentos:
                movimento_forma = sum(
                    (
                        moeda(m.valor) for m in entradas
                        if m.forma_pagamento == forma.forma_pagamento
                    ), Decimal("0.00")
                )
                if movimento_forma != moeda(forma.valor):
                    alerta(
                        alertas, "forma_caixa_divergente",
                        "Recibo #%d: diferença na forma de pagamento %s." %
                        (id_recibo, forma.forma_pagamento),
                        conta_id=recibo.conta_receber_id, recibo_id=id_recibo,
                    )
        else:
            if not any(a.recebimento_id == id_recibo for a in auditorias):
                alerta(
                    observacoes, "estorno_sem_auditoria",
                    "Recibo #%d está inativo sem auditoria de estorno vinculada." %
                    id_recibo,
                    conta_id=recibo.conta_receber_id, recibo_id=id_recibo,
                )
            if pagamentos:
                alerta(
                    alertas, "formas_ativas_em_estorno",
                    "Recibo estornado #%d ainda possui formas de pagamento ativas." %
                    id_recibo,
                    conta_id=recibo.conta_receber_id, recibo_id=id_recibo,
                )

    for auditoria in auditorias:
        estornos_ids = [
            x for x in (auditoria.movimentacoes_estorno_ids or "").split(",")
            if x.strip().isdigit()
        ]
        movimentos_estorno = [
            movimentos_por_id.get(int(x)) for x in estornos_ids
        ]
        if (
            not estornos_ids
            or any(m is None for m in movimentos_estorno)
            or any(
                m.tipo != "saida" or m.categoria != "estorno_recebimento" or not m.ativo
                for m in movimentos_estorno if m is not None
            )
            or sum((moeda(m.valor) for m in movimentos_estorno if m), Decimal(0))
            != moeda(auditoria.valor)
        ):
            alerta(
                alertas, "estorno_caixa_divergente",
                "Estorno auditado #%d não corresponde às saídas do Caixa." %
                auditoria.id,
                recibo_id=auditoria.recebimento_id,
            )

    for conta in contas:
        recibos_conta = recibos_por_conta.get(conta.id, [])
        total_registrado = sum(
            (moeda(r.valor_total) for r in recibos_conta if r.ativo),
            Decimal("0.00"),
        )
        valor_pago = moeda(conta.valor_pago)
        if total_registrado != valor_pago:
            destino = alertas if recibos_conta else observacoes
            alerta(
                destino,
                "saldo_sem_correspondencia" if recibos_conta else "recebimento_legado",
                "Conta #%d: saldo pago R$ %.2f; recibos ativos R$ %.2f.%s" %
                (
                    conta.id, valor_pago, total_registrado,
                    "" if recibos_conta else " Pode ser lançamento antigo sem recibo.",
                ),
                conta_id=conta.id,
            )
        if conta.ativo and conta.status == "pago" and valor_pago < moeda(conta.valor):
            alerta(
                alertas, "status_incorreto",
                "Conta #%d está marcada como paga com saldo em aberto." % conta.id,
                conta_id=conta.id,
            )

    return {
        "somente_leitura": True,
        "resumo": {
            "contas": len(contas),
            "recibos_ativos": sum(1 for r in recibos if r.ativo),
            "recibos_estornados": sum(1 for r in recibos if not r.ativo),
            "total_recibos_ativos": float(total_recibos_ativos),
            "total_entradas_vinculadas": float(total_entradas_recibos),
            "divergencias": len(alertas),
            "observacoes": len(observacoes),
        },
        "divergencias": alertas,
        "observacoes": observacoes,
        "nota": (
            "Conferência interna de registros, não conciliação bancária. "
            "Pix, cartão e depósitos só são confirmados nos extratos externos."
        ),
    }
