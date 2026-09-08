from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.configuracao_fiscal import ConfiguracaoFiscal
from app.models.configuracao_sistema import ConfiguracaoSistema
from app.models.conta_receber import ContaReceber
from app.models.paciente import Paciente
from app.models.recebimento_conta import RecebimentoConta
from app.models.recebimento_conta_forma import RecebimentoContaForma
from app.services.recibo_pdf import gerar_recibo_pdf


router = APIRouter(
    prefix="/contas-receber",
    tags=["Recibos"],
)


@router.get(
    "/recebimentos/{recebimento_id}/recibo.pdf"
)
def baixar_recibo_pdf(
    recebimento_id: int,
    db: Session = Depends(get_db),
):
    recebimento = (
        db.query(RecebimentoConta)
        .filter(
            RecebimentoConta.id == recebimento_id,
            RecebimentoConta.ativo.is_(True),
        )
        .first()
    )

    if not recebimento:
        raise HTTPException(
            status_code=404,
            detail="Recebimento não encontrado.",
        )

    conta = (
        db.query(ContaReceber)
        .filter(
            ContaReceber.id == recebimento.conta_receber_id,
            ContaReceber.ativo.is_(True),
        )
        .first()
    )

    if not conta:
        raise HTTPException(
            status_code=404,
            detail="Conta a receber vinculada não encontrada.",
        )

    pagamentos = (
        db.query(RecebimentoContaForma)
        .filter(
            RecebimentoContaForma.recebimento_id == recebimento.id,
            RecebimentoContaForma.ativo.is_(True),
        )
        .order_by(RecebimentoContaForma.id.asc())
        .all()
    )

    paciente = None

    if conta.paciente_id:
        paciente = (
            db.query(Paciente)
            .filter(
                Paciente.id == conta.paciente_id,
                Paciente.ativo.is_(True),
            )
            .first()
        )

    fiscal = (
        db.query(ConfiguracaoFiscal)
        .filter(
            ConfiguracaoFiscal.ativo.is_(True),
        )
        .order_by(ConfiguracaoFiscal.id.asc())
        .first()
    )

    sistema = (
        db.query(ConfiguracaoSistema)
        .order_by(ConfiguracaoSistema.id.asc())
        .first()
    )

    endereco_partes = []

    if fiscal:
        if fiscal.endereco:
            endereco = fiscal.endereco

            if fiscal.numero:
                endereco += f", {fiscal.numero}"

            endereco_partes.append(endereco)

        if fiscal.complemento:
            endereco_partes.append(
                fiscal.complemento
            )

        if fiscal.bairro:
            endereco_partes.append(
                fiscal.bairro
            )

        cidade = ""

        if fiscal.municipio:
            cidade = fiscal.municipio

        if fiscal.uf:
            cidade += f"/{fiscal.uf}"

        if fiscal.cep:
            cidade += f" - CEP {fiscal.cep}"

        if cidade:
            endereco_partes.append(cidade)

    endereco_completo = " - ".join(
        endereco_partes
    )

    valor_total_conta = Decimal(
        str(conta.valor or 0)
    )

    valor_recebido_acumulado = Decimal(
        str(conta.valor_pago or 0)
    )

    valor_pendente = (
        valor_total_conta
        - valor_recebido_acumulado
    )

    if valor_pendente < 0:
        valor_pendente = Decimal("0.00")

    dados = {
        "numero_recibo": f"{recebimento.id:06d}",
        "data_recebimento": recebimento.data_recebimento,
        "descricao": conta.descricao,
        "valor_total_conta": valor_total_conta,
        "valor_recebimento": Decimal(
            str(recebimento.valor_total or 0)
        ),
        "valor_recebido_acumulado": valor_recebido_acumulado,
        "valor_pendente": valor_pendente,
        "observacoes": recebimento.observacoes,
        "paciente_nome": (
            paciente.nome
            if paciente
            else None
        ),
        "paciente_cpf": (
            paciente.cpf
            if paciente
            else None
        ),
        "razao_social": (
            fiscal.razao_social
            if fiscal
            else None
        ),
        "nome_fantasia": (
            fiscal.nome_fantasia
            if fiscal
            else "Cuidare"
        ),
        "cnpj": (
            fiscal.cnpj
            if fiscal
            else None
        ),
        "endereco_completo": endereco_completo,
        "logo_caminho": (
            sistema.logo_caminho
            if sistema
            else None
        ),
        "pagamentos": [
            {
                "forma_pagamento": pagamento.forma_pagamento,
                "valor": Decimal(
                    str(pagamento.valor or 0)
                ),
            }
            for pagamento in pagamentos
        ],
    }

    pdf = gerar_recibo_pdf(dados)

    nome_arquivo = (
        f"recibo_cuidare_"
        f"{recebimento.id:06d}.pdf"
    )

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{nome_arquivo}"'
            )
        },
    )
