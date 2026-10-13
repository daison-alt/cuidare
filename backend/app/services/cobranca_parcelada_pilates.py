import calendar
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.cobranca_plano_pilates import CobrancaPlanoPilates
from app.models.conta_receber import ContaReceber
from app.models.parcela_plano_pilates import ParcelaPlanoPilates


def somar_meses(dia: date, meses: int) -> date:
    deslocamento = (dia.month - 1) + meses
    ano = dia.year + deslocamento // 12
    mes = deslocamento % 12 + 1
    ultimo = calendar.monthrange(ano, mes)[1]
    return date(ano, mes, min(dia.day, ultimo))


def criar_cobrancas_parceladas(
    db: Session, contrato, plano, numero_parcelas: int,
) -> list[ContaReceber]:
    """Cria cobranças mensais na MESMA transação da matrícula.

    NÃO registra pagamento nem movimentação no Caixa.
    """
    permitido = {"mensal": 1, "trimestral": 3, "semestral": 6}.get(plano.periodo)
    if permitido is None or numero_parcelas != permitido or numero_parcelas <= 1:
        raise HTTPException(
            status_code=400,
            detail="Parcelamento inválido: trimestral em 3 vezes e semestral em 6 vezes."
        )

    # Uma matrícula nunca pode ter dois conjuntos de cobranças.
    if db.query(CobrancaPlanoPilates.id).filter(
        CobrancaPlanoPilates.aluno_plano_id == contrato.id
    ).first() or db.query(ParcelaPlanoPilates.id).filter(
        ParcelaPlanoPilates.aluno_plano_id == contrato.id
    ).first():
        raise HTTPException(409, "Esta matrícula já possui cobranças geradas.")

    valor = Decimal(str(contrato.valor_contratado))
    if not valor.is_finite() or valor < 0:
        raise HTTPException(400, "Valor contratado inválido.")
    valor = valor.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if valor == 0:
        return []

    centavos = int(valor * 100)
    if centavos < numero_parcelas:
        raise HTTPException(400, "O valor contratado é insuficiente para o parcelamento.")

    quociente, resto = divmod(centavos, numero_parcelas)
    contas = []

    for indice in range(numero_parcelas):
        numero = indice + 1
        parcial = Decimal(quociente + (1 if indice < resto else 0)) / Decimal(100)
        vencimento = somar_meses(contrato.data_inicio, indice)
        conta = ContaReceber(
            paciente_id=contrato.paciente_id,
            agendamento_id=None,
            descricao=(
                f"Pilates - {plano.nome} - Matrícula #{contrato.id} "
                f"- Parcela {numero}/{numero_parcelas}"
            ),
            categoria="Pilates",
            valor=parcial,
            vencimento=vencimento,
            status="pendente",
            valor_pago=Decimal("0.00"),
            data_pagamento=None,
            forma_pagamento=None,
            observacoes=(
                f"Parcela {numero} de {numero_parcelas}; "
                f"matrícula #{contrato.id}; "
                f"vigência {contrato.data_inicio:%d/%m/%Y} "
                f"a {contrato.data_fim:%d/%m/%Y}. "
                "Receba exclusivamente pelo Financeiro com Caixa aberto."
            ),
            ativo=True,
        )
        db.add(conta)
        db.flush()

        db.add(ParcelaPlanoPilates(
            aluno_plano_id=contrato.id,
            conta_receber_id=conta.id,
            numero_parcela=numero,
            total_parcelas=numero_parcelas,
        ))
        contas.append(conta)

    db.flush()
    if sum((Decimal(str(c.valor)) for c in contas), Decimal(0)) != valor:
        raise RuntimeError("O total das parcelas não corresponde ao contrato.")
    return contas
