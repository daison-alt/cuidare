"""Recebimento atomico de multiplas parcelas do mesmo aluno de Pilates."""
from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.caixa import Caixa
from app.models.conta_receber import ContaReceber
from app.models.movimentacao_caixa import MovimentacaoCaixa
from app.models.parcela_plano_pilates import ParcelaPlanoPilates
from app.models.recebimento_conta import RecebimentoConta
from app.models.recebimento_conta_forma import RecebimentoContaForma
from app.schemas.recebimento_conta import (
    FormaPagamentoRecebimentoCriar,
    FORMAS_PAGAMENTO_RECEBIMENTO_PERMITIDAS,
)
from app.security.autorizacao import exigir_permissao

router = APIRouter(prefix="/contas-receber", tags=["Recebimentos de Pilates"])
CENTAVOS = Decimal("0.01")


class RecebimentoLoteCriar(BaseModel):
    paciente_id: int = Field(gt=0)
    conta_ids: list[int] = Field(min_length=2, max_length=12)
    data_recebimento: date
    pagamentos: list[FormaPagamentoRecebimentoCriar] = Field(min_length=1, max_length=5)
    observacoes: Optional[str] = Field(default=None, max_length=500)


def dinheiro_exato(valor):
    bruto = Decimal(str(valor))
    if not bruto.is_finite() or bruto != bruto.quantize(CENTAVOS):
        raise HTTPException(400, "Use valores monetarios com ate duas casas decimais.")
    return bruto


@router.post("/recebimentos-lote", status_code=201)
def receber_parcelas_em_lote(
    dados: RecebimentoLoteCriar,
    db: Session = Depends(get_db),
    _=Depends(exigir_permissao("financeiro.receber")),
):
    """Tudo ou nada: um recibo por parcela e uma entrada por forma de pagamento.

    No SQLite, BEGIN IMMEDIATE serializa as escritas antes da leitura dos saldos.
    Futuras migracoes para PostgreSQL devem utilizar SELECT FOR UPDATE.
    """
    if len(set(dados.conta_ids)) != len(dados.conta_ids):
        raise HTTPException(400, "Nao selecione a mesma parcela duas vezes.")

    formas = {}
    for pagamento in dados.pagamentos:
        forma = pagamento.forma_pagamento.strip().lower()
        if forma not in FORMAS_PAGAMENTO_RECEBIMENTO_PERMITIDAS:
            raise HTTPException(400, "Forma de pagamento nao permitida: " + forma)
        if forma in formas:
            raise HTTPException(400, "Nao repita a mesma forma de pagamento.")
        valor = dinheiro_exato(pagamento.valor)
        if valor <= 0:
            raise HTTPException(400, "Informe valores positivos.")
        formas[forma] = int(valor * 100)

    try:
        # Sem SELECT antes desta chamada: impede duas baixas concorrentes
        # sobre a mesma parcela no backend SQLite.
        dialect = db.get_bind().dialect.name
        if dialect == "sqlite":
            db.connection().exec_driver_sql("BEGIN IMMEDIATE")

        caixa_query = db.query(Caixa).filter(
            Caixa.status == "aberto", Caixa.ativo.is_(True)
        ).order_by(Caixa.id.desc())
        if dialect != "sqlite":
            caixa_query = caixa_query.with_for_update()
        caixa = caixa_query.first()
        if not caixa:
            raise HTTPException(400, "Abra o Caixa antes de registrar pagamentos.")

        consulta = db.query(ContaReceber).filter(
            ContaReceber.id.in_(dados.conta_ids),
            ContaReceber.ativo.is_(True),
        )
        if dialect != "sqlite":
            consulta = consulta.with_for_update()
        contas = consulta.all()
        if len(contas) != len(dados.conta_ids):
            raise HTTPException(409, "Uma das parcelas nao existe ou esta inativa.")

        vinculadas = {
            item.conta_receber_id
            for item in db.query(ParcelaPlanoPilates).filter(
                ParcelaPlanoPilates.conta_receber_id.in_(dados.conta_ids)
            ).all()
        }
        if len(vinculadas) != len(dados.conta_ids):
            raise HTTPException(
                409, "A operacao em lote aceita apenas parcelas vinculadas a planos de Pilates."
            )

        if any(c.paciente_id != dados.paciente_id for c in contas):
            raise HTTPException(409, "Todas as parcelas precisam pertencer ao mesmo aluno.")

        contas.sort(key=lambda c: (c.vencimento, c.id))
        pendencias = []
        for c in contas:
            if c.status in ("pago", "cancelado"):
                raise HTTPException(
                    409, "A parcela #%d ja foi paga ou cancelada. Atualize a lista." % c.id
                )
            falta = dinheiro_exato(c.valor) - dinheiro_exato(c.valor_pago or 0)
            if falta <= 0:
                raise HTTPException(
                    409, "A parcela #%d ja foi recebida. Atualize a lista." % c.id
                )
            pendencias.append((c, int(falta * 100)))

        total_centavos = sum(valor for _, valor in pendencias)
        informado_centavos = sum(formas.values())
        if total_centavos != informado_centavos:
            raise HTTPException(
                409,
                "O total informado (R$ %.2f) difere do saldo das parcelas (R$ %.2f). "
                "Confira os valores atualizados." %
                (informado_centavos / 100, total_centavos / 100),
            )

        # Aloca os valores por forma entre as parcelas, sempre em centavos.
        # A soma de todos os recibos coincide com a soma das entradas.
        saldo_formas = dict(formas)
        registros = []
        for conta, pendente_centavos in pendencias:
            recibo = RecebimentoConta(
                conta_receber_id=conta.id,
                data_recebimento=dados.data_recebimento,
                valor_total=Decimal(pendente_centavos) / 100,
                observacoes=dados.observacoes,
                ativo=True,
            )
            db.add(recibo)
            db.flush()

            restante = pendente_centavos
            aplicadas = []
            for forma, disponivel in list(saldo_formas.items()):
                usar = min(restante, disponivel)
                if usar <= 0:
                    continue

                valor = Decimal(usar) / 100
                db.add(RecebimentoContaForma(
                    recebimento_id=recibo.id,
                    forma_pagamento=forma,
                    valor=valor,
                    ativo=True,
                ))
                db.add(MovimentacaoCaixa(
                    caixa_id=caixa.id,
                    tipo="entrada",
                    categoria="recebimento",
                    descricao="Recebimento - " + conta.descricao,
                    valor=valor,
                    forma_pagamento=forma,
                    observacoes=(
                        "Conta a receber #%d | Recibo #%06d" %
                        (conta.id, recibo.id)
                    ),
                    ativo=True,
                ))
                aplicadas.append(forma)
                saldo_formas[forma] -= usar
                restante -= usar
                if restante == 0:
                    break

            if restante != 0:
                raise RuntimeError("Distribuicao monetaria inconsistente.")

            conta.valor_pago = dinheiro_exato(conta.valor)
            conta.status = "pago"
            conta.data_pagamento = dados.data_recebimento
            conta.forma_pagamento = aplicadas[0] if len(aplicadas) == 1 else "multiplo"
            registros.append({
                "id": recibo.id,
                "numero_recibo": "%06d" % recibo.id,
                "conta_receber_id": conta.id,
                "valor": float(recibo.valor_total),
            })

        if any(saldo_formas.values()):
            raise RuntimeError("Sobrou um valor de pagamento nao distribuido.")

        db.commit()
        return {
            "status": "recebido",
            "paciente_id": dados.paciente_id,
            "caixa_id": caixa.id,
            "quantidade_parcelas": len(registros),
            "total": float(Decimal(total_centavos) / 100),
            "recibos": registros,
            "aviso_fiscal": "Os recibos foram registrados. Confira separadamente a preparacao fiscal.",
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            500,
            "Falha no recebimento em lote. A transacao foi revertida; atualize a pagina e confira os recibos antes de tentar novamente.",
        )
