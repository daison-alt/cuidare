from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session

from app.models.cobranca_plano_pilates import CobrancaPlanoPilates
from app.models.conta_receber import ContaReceber


def criar_cobranca_plano(db: Session, contrato, plano):
    """
    Cria a conta pendente do valor contratado.
    Não cria recebimento, movimentação financeira nem exige Caixa aberto.
    Deve ser chamada antes do commit da matrícula.
    """
    existente = (
        db.query(CobrancaPlanoPilates)
        .filter(CobrancaPlanoPilates.aluno_plano_id == contrato.id)
        .first()
    )
    if existente:
        return db.get(ContaReceber, existente.conta_receber_id)

    valor = Decimal(str(contrato.valor_contratado)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    if not valor.is_finite() or valor < 0:
        raise ValueError("Valor contratado de Pilates inválido.")
    if valor == 0:
        # Plano totalmente gratuito/cortesia: nenhuma cobrança monetária.
        return None

    conta = ContaReceber(
        paciente_id=contrato.paciente_id,
        descricao=f"Plano de Pilates - {plano.nome} - Matrícula #{contrato.id}",
        categoria="Pilates",
        valor=valor,
        vencimento=contrato.data_inicio,
        status="pendente",
        valor_pago=Decimal("0.00"),
        forma_pagamento=None,
        data_pagamento=None,
        observacoes=(
            f"Matrícula de Pilates #{contrato.id}. "
            f"Vigência: {contrato.data_inicio:%d/%m/%Y} a "
            f"{contrato.data_fim:%d/%m/%Y}. "
            "Recebimento deve ser registrado pelo Financeiro com Caixa aberto."
        ),
        ativo=True,
    )
    db.add(conta)
    db.flush()

    db.add(CobrancaPlanoPilates(
        aluno_plano_id=contrato.id,
        conta_receber_id=conta.id,
    ))
    db.flush()
    return conta
