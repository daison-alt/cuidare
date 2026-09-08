from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.configuracao_cuidare_ia import ConfiguracaoCuidareIA
from app.models.conta_pagar import ContaPagar
from app.models.uso_cuidare_ia import UsoCuidareIA
from app.schemas.cuidare_ia import (
    ConfiguracaoCuidareIAAtualizar,
    ConfiguracaoCuidareIAResposta,
    CuidareIAAnaliseResposta,
    CuidareIAAnaliseSolicitar,
)
from app.security.auth import verificar_token
from app.security.permissoes import tem_permissao


router = APIRouter(
    prefix="/cuidare-ia",
    tags=["Cuidare IA"],
)

security = HTTPBearer()


def obter_usuario_atual(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        payload = verificar_token(credentials.credentials)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido ou expirado.",
        )

    perfil = payload.get("perfil")

    if not perfil:
        raise HTTPException(
            status_code=403,
            detail="Perfil do usuário não identificado.",
        )

    if not tem_permissao(perfil, "cuidare_ia.visualizar"):
        raise HTTPException(
            status_code=403,
            detail="Usuário sem permissão para utilizar a Cuidare IA.",
        )

    usuario_id = payload.get("sub")

    try:
        usuario_id = int(usuario_id) if usuario_id else None
    except (TypeError, ValueError):
        usuario_id = None

    return {
        "id": usuario_id,
        "perfil": perfil,
    }


def obter_configuracao(db: Session):
    configuracao = (
        db.query(ConfiguracaoCuidareIA)
        .order_by(ConfiguracaoCuidareIA.id.asc())
        .first()
    )

    if configuracao:
        return configuracao

    configuracao = ConfiguracaoCuidareIA(
        ativa=False,
        modo_teste=True,
        limite_mensal=50.00,
        alerta_percentual=80,
        bloqueio_percentual=100,
    )

    db.add(configuracao)
    db.commit()
    db.refresh(configuracao)

    return configuracao


def calcular_uso_mes(db: Session) -> float:
    agora = datetime.now(timezone.utc)

    inicio_mes = datetime(
        agora.year,
        agora.month,
        1,
    ).replace(tzinfo=None)

    registros = (
        db.query(UsoCuidareIA)
        .filter(
            UsoCuidareIA.criado_em >= inicio_mes,
            UsoCuidareIA.status == "sucesso",
        )
        .all()
    )

    return sum(
        float(registro.custo_estimado or 0)
        for registro in registros
    )


def calcular_referencia_mes() -> str:
    agora = datetime.now(timezone.utc)
    return f"{agora.year:04d}-{agora.month:02d}"


def calcular_descricao_mes() -> str:
    agora = datetime.now(timezone.utc)

    nomes_meses = {
        1: "Janeiro",
        2: "Fevereiro",
        3: "Março",
        4: "Abril",
        5: "Maio",
        6: "Junho",
        7: "Julho",
        8: "Agosto",
        9: "Setembro",
        10: "Outubro",
        11: "Novembro",
        12: "Dezembro",
    }

    return f"Cuidare IA — {nomes_meses[agora.month]}/{agora.year}"


@router.get(
    "/configuracao",
    response_model=ConfiguracaoCuidareIAResposta,
)
def buscar_configuracao(
    db: Session = Depends(get_db),
    usuario=Depends(obter_usuario_atual),
):
    return obter_configuracao(db)


@router.put(
    "/configuracao",
    response_model=ConfiguracaoCuidareIAResposta,
)
def atualizar_configuracao(
    dados: ConfiguracaoCuidareIAAtualizar,
    db: Session = Depends(get_db),
    usuario=Depends(obter_usuario_atual),
):
    if usuario["perfil"] != "administrador":
        raise HTTPException(
            status_code=403,
            detail="Somente o administrador pode alterar a configuração da Cuidare IA.",
        )

    configuracao = obter_configuracao(db)

    campos = dados.model_dump(exclude_unset=True)

    if "limite_mensal" in campos:
        if campos["limite_mensal"] is None or campos["limite_mensal"] < 0:
            raise HTTPException(
                status_code=400,
                detail="O limite mensal não pode ser negativo.",
            )

    if "alerta_percentual" in campos:
        valor = campos["alerta_percentual"]

        if valor is None or valor < 1 or valor > 100:
            raise HTTPException(
                status_code=400,
                detail="O alerta deve estar entre 1% e 100%.",
            )

    if "bloqueio_percentual" in campos:
        valor = campos["bloqueio_percentual"]

        if valor is None or valor < 1 or valor > 100:
            raise HTTPException(
                status_code=400,
                detail="O bloqueio deve estar entre 1% e 100%.",
            )

    alerta = campos.get(
        "alerta_percentual",
        configuracao.alerta_percentual,
    )

    bloqueio = campos.get(
        "bloqueio_percentual",
        configuracao.bloqueio_percentual,
    )

    if alerta > bloqueio:
        raise HTTPException(
            status_code=400,
            detail="O percentual de alerta não pode ser maior que o percentual de bloqueio.",
        )

    for campo, valor in campos.items():
        setattr(configuracao, campo, valor)

    db.commit()
    db.refresh(configuracao)

    return configuracao


@router.get("/uso")
def consultar_uso(
    db: Session = Depends(get_db),
    usuario=Depends(obter_usuario_atual),
):
    configuracao = obter_configuracao(db)

    uso_mes = calcular_uso_mes(db)

    limite = float(configuracao.limite_mensal or 0)

    percentual = (
        (uso_mes / limite) * 100
        if limite > 0
        else 0
    )

    bloqueada = (
        limite > 0
        and percentual >= configuracao.bloqueio_percentual
    )

    alerta = (
        limite > 0
        and percentual >= configuracao.alerta_percentual
    )

    return {
        "mes": datetime.now().strftime("%Y-%m"),
        "uso_mes": round(uso_mes, 4),
        "limite_mensal": round(limite, 2),
        "percentual": round(percentual, 2),
        "alerta": alerta,
        "bloqueada_por_orcamento": bloqueada,
        "ativa": configuracao.ativa,
        "modo_teste": configuracao.modo_teste,
    }


@router.get("/financeiro/resumo")
def resumo_financeiro_ia(
    db: Session = Depends(get_db),
    usuario=Depends(obter_usuario_atual),
):
    configuracao = obter_configuracao(db)

    agora = datetime.now(timezone.utc)

    inicio_mes = datetime(
        agora.year,
        agora.month,
        1,
    ).replace(tzinfo=None)

    if agora.month == 12:
        proximo_mes = datetime(
            agora.year + 1,
            1,
            1,
        )
    else:
        proximo_mes = datetime(
            agora.year,
            agora.month + 1,
            1,
        )

    registros = (
        db.query(UsoCuidareIA)
        .filter(
            UsoCuidareIA.criado_em >= inicio_mes,
            UsoCuidareIA.criado_em < proximo_mes,
            UsoCuidareIA.status == "sucesso",
        )
        .all()
    )

    consumo_mes = sum(
        float(registro.custo_estimado or 0)
        for registro in registros
    )

    limite = float(configuracao.limite_mensal or 0)

    percentual = (
        (consumo_mes / limite) * 100
        if limite > 0
        else 0
    )

    referencia = f"{agora.year:04d}-{agora.month:02d}"

    conta = (
        db.query(ContaPagar)
        .filter(
            ContaPagar.origem == "cuidare_ia",
            ContaPagar.referencia_ia == referencia,
            ContaPagar.ativo == True,
        )
        .first()
    )

    return {
        "mes": referencia,
        "modo": "teste" if configuracao.modo_teste else "real",
        "ativa": configuracao.ativa,
        "consumo_mes": round(consumo_mes, 4),
        "limite_mensal": round(limite, 2),
        "percentual_utilizado": round(percentual, 2),
        "valor_financeiro": (
            0.00
            if configuracao.modo_teste
            else round(consumo_mes, 2)
        ),
        "despesa_financeira_gerada": conta is not None,
        "conta_pagar_id": conta.id if conta else None,
        "conta_pagar_status": conta.status if conta else None,
        "observacao": (
            "Modo Teste: nenhum custo é enviado ao Financeiro."
            if configuracao.modo_teste
            else "Valor baseado no consumo registrado da Cuidare IA."
        ),
    }


@router.post("/financeiro/sincronizar")
def sincronizar_financeiro_ia(
    vencimento: date,
    db: Session = Depends(get_db),
    usuario=Depends(obter_usuario_atual),
):
    if usuario["perfil"] != "administrador":
        raise HTTPException(
            status_code=403,
            detail="Somente o administrador pode sincronizar a Cuidare IA com o Financeiro.",
        )

    configuracao = obter_configuracao(db)

    referencia = calcular_referencia_mes()

    conta_existente = (
        db.query(ContaPagar)
        .filter(
            ContaPagar.origem == "cuidare_ia",
            ContaPagar.referencia_ia == referencia,
            ContaPagar.ativo == True,
        )
        .first()
    )

    if conta_existente:
        return {
            "status": "ja_existente",
            "criada": False,
            "modo": "teste" if configuracao.modo_teste else "real",
            "referencia_ia": referencia,
            "conta_pagar_id": conta_existente.id,
            "valor": float(conta_existente.valor or 0),
            "status_conta": conta_existente.status,
            "mensagem": (
                "A despesa da Cuidare IA deste mês já está registrada "
                "em Contas a Pagar. Nenhuma duplicação foi criada."
            ),
        }

    if not configuracao.ativa:
        raise HTTPException(
            status_code=403,
            detail="A Cuidare IA está desativada. Nenhuma despesa financeira será sincronizada.",
        )

    consumo_mes = calcular_uso_mes(db)

    valor_decimal = Decimal(str(consumo_mes)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    if valor_decimal <= Decimal("0.00"):
        return {
            "status": "sem_consumo",
            "criada": False,
            "modo": "teste" if configuracao.modo_teste else "real",
            "referencia_ia": referencia,
            "valor": 0.00,
            "mensagem": (
                "Não há custo registrado da Cuidare IA neste mês. "
                "Nenhuma conta a pagar foi criada."
            ),
        }

    if configuracao.modo_teste:
        return {
            "status": "simulacao",
            "criada": False,
            "modo": "teste",
            "referencia_ia": referencia,
            "valor": float(valor_decimal),
            "mensagem": (
                "Modo Teste: a despesa foi apenas simulada. "
                "Nenhuma conta a pagar foi criada e nenhum lançamento "
                "foi enviado ao Caixa."
            ),
        }

    conta = ContaPagar(
        fornecedor="Cuidare IA",
        descricao=calcular_descricao_mes(),
        categoria="Tecnologia / Inteligência Artificial",
        valor=valor_decimal,
        vencimento=vencimento,
        status="pendente",
        forma_pagamento=None,
        data_pagamento=None,
        valor_pago=None,
        observacoes=(
            "Despesa gerada a partir do consumo registrado da Cuidare IA. "
            f"Referência: {referencia}. "
            "O pagamento deverá seguir o fluxo normal de Contas a Pagar."
        ),
        ativo=True,
        origem="cuidare_ia",
        referencia_ia=referencia,
    )

    db.add(conta)

    try:
        db.commit()
        db.refresh(conta)
    except IntegrityError:
        db.rollback()

        conta_existente = (
            db.query(ContaPagar)
            .filter(
                ContaPagar.origem == "cuidare_ia",
                ContaPagar.referencia_ia == referencia,
                ContaPagar.ativo == True,
            )
            .first()
        )

        if conta_existente:
            return {
                "status": "ja_existente",
                "criada": False,
                "modo": "real",
                "referencia_ia": referencia,
                "conta_pagar_id": conta_existente.id,
                "valor": float(conta_existente.valor or 0),
                "status_conta": conta_existente.status,
                "mensagem": (
                    "A despesa da Cuidare IA já havia sido registrada "
                    "por outra operação. Nenhuma duplicação foi criada."
                ),
            }

        raise HTTPException(
            status_code=500,
            detail="Não foi possível sincronizar a despesa da Cuidare IA com o Financeiro.",
        )

    return {
        "status": "criada",
        "criada": True,
        "modo": "real",
        "referencia_ia": referencia,
        "conta_pagar_id": conta.id,
        "valor": float(valor_decimal),
        "status_conta": conta.status,
        "mensagem": (
            "Despesa da Cuidare IA criada em Contas a Pagar. "
            "Nenhum lançamento foi feito diretamente no Caixa. "
            "O Caixa será movimentado somente quando a conta for paga "
            "pelo fluxo normal de Contas a Pagar."
        ),
    }


@router.post(
    "/analisar",
    response_model=CuidareIAAnaliseResposta,
)
def analisar_prontuario(
    dados: CuidareIAAnaliseSolicitar,
    db: Session = Depends(get_db),
    usuario=Depends(obter_usuario_atual),
):
    configuracao = obter_configuracao(db)

    if not configuracao.ativa:
        raise HTTPException(
            status_code=403,
            detail="A Cuidare IA está desativada.",
        )

    uso_mes = calcular_uso_mes(db)

    limite = float(configuracao.limite_mensal or 0)

    percentual = (
        (uso_mes / limite) * 100
        if limite > 0
        else 0
    )

    if (
        limite > 0
        and percentual >= configuracao.bloqueio_percentual
    ):
        raise HTTPException(
            status_code=429,
            detail="O limite mensal da Cuidare IA foi atingido.",
        )

    # ========================================================
    # MODO TESTE
    # ========================================================
    #
    # Nenhuma API externa é chamada.
    # Nenhum custo é gerado.
    # Nenhuma informação clínica é enviada para terceiros.
    #

    if configuracao.modo_teste:
        nome_base = (
            dados.queixa_principal.strip()
            if dados.queixa_principal
            else "informações clínicas registradas"
        )

        resumo = (
            "Modo Teste: a Cuidare IA identificou informações "
            f"relacionadas a {nome_base}. "
            "A análise abaixo é apenas uma demonstração da "
            "estrutura de apoio à documentação clínica."
        )

        sugestao = (
            "Paciente em acompanhamento fisioterapêutico. "
            "Com base nas informações fornecidas no prontuário, "
            "sugere-se registrar a evolução de forma objetiva, "
            "descrevendo o estado apresentado no atendimento, "
            "a resposta às intervenções realizadas e os próximos "
            "objetivos terapêuticos. "
            "Este texto é uma sugestão e deve ser revisado e "
            "adaptado pelo fisioterapeuta responsável."
        )

        observacoes = (
            "MODO TESTE: esta sugestão não constitui diagnóstico, "
            "prescrição ou decisão clínica. "
            "O profissional responsável deve revisar, editar e "
            "validar todo o conteúdo antes de qualquer registro oficial."
        )

        registro = UsoCuidareIA(
            usuario_id=usuario["id"],
            prontuario_id=dados.prontuario_id,
            acao="analise_prontuario",
            modo="teste",
            tokens_entrada=0,
            tokens_saida=0,
            custo_estimado=0,
            status="sucesso",
        )

        db.add(registro)
        db.commit()

        return CuidareIAAnaliseResposta(
            status="sucesso",
            modo="teste",
            mensagem="Análise simulada realizada com sucesso.",
            resumo=resumo,
            sugestao_evolucao=sugestao,
            observacoes=observacoes,
            pode_registrar=False,
            custo_estimado=0,
        )

    # ========================================================
    # MODO REAL
    # ========================================================
    #
    # Nesta etapa ainda não existe chamada para provedor externo.
    # Isso evita qualquer custo ou envio de dados clínicos.
    #

    raise HTTPException(
        status_code=501,
        detail=(
            "O modo real da Cuidare IA ainda não está habilitado. "
            "Utilize o Modo Teste nesta fase."
        ),
    )
