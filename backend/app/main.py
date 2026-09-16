import os
import json

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import Base, engine
from app.models.configuracao_fiscal import ConfiguracaoFiscal
from app.models.paciente import Paciente
from app.models.prontuario import Prontuario
from app.models.evolucao import Evolucao
from app.models.agendamento import Agendamento
from app.models.agendamento_plano_pilates import AgendamentoPlanoPilates
from app.models.servico import Servico
from app.models.conta_receber import ContaReceber
from app.models.recebimento_conta import RecebimentoConta
from app.models.recebimento_conta_forma import RecebimentoContaForma
from app.models.caixa import Caixa
from app.models.movimentacao_caixa import MovimentacaoCaixa
from app.models.conferencia_caixa import ConferenciaCaixa
from app.models.estoque_produto import EstoqueProduto
from app.models.movimentacao_estoque import MovimentacaoEstoque
from app.models.configuracao_sistema import ConfiguracaoSistema
from app.models.configuracao_cuidare_ia import ConfiguracaoCuidareIA
from app.models.uso_cuidare_ia import UsoCuidareIA
from app.models.plano_pilates import PlanoPilates
from app.models.aluno_plano_pilates import AlunoPlanoPilates
from app.routers.usuarios import router as usuarios_router
from app.routers.auth import router as auth_router
from app.routers.gestao_fiscal import router as gestao_fiscal_router
from app.routers.configuracao_fiscal import router as configuracao_fiscal_router
from app.routers.pacientes import router as pacientes_router
from app.routers.prontuarios import router as prontuarios_router
from app.routers.evolucoes import router as evolucoes_router
from app.routers.agendamentos import router as agendamentos_router
from app.routers.servicos import router as servicos_router
from app.routers.contas_receber import router as contas_receber_router
from app.routers.recebimentos_conta import router as recebimentos_conta_router
from app.routers.contas_pagar import router as contas_pagar_router
from app.routers.caixa import router as caixa_router
from app.routers.conferencia_caixa import router as conferencia_caixa_router
from app.routers.estoque import router as estoque_router
from app.routers.configuracao_sistema import router as configuracao_sistema_router
from app.routers.cuidare_ia import router as cuidare_ia_router
from app.routers.planos_pilates import router as planos_pilates_router
from app.routers.alunos_planos_pilates import router as alunos_planos_pilates_router
from app.routers.recibo_pdf import router as recibo_pdf_router
from app.routers import campanhas
from app.routers import indicacoes
from app.routers import configuracao
from app.routers import recibo_nfse
from app.routers import contrato
from app.security.auth import verificar_token
from app.security.permissoes import tem_permissao


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Cuidare API",
    version="1.0.0",
)


cors_origins_env = os.getenv("CUIDARE_CORS_ORIGINS", "*")
cors_origins = [origem.strip() for origem in cors_origins_env.split(",") if origem.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


ROTAS_PUBLICAS = {
    "/",
    "/health",
    "/auth/login",
    "/configuracoes/identidade",
}


PERMISSOES_AGENDA = {
    "GET": "agenda.visualizar",
    "POST": "agenda.criar",
    "PUT": "agenda.editar",
    "PATCH": "agenda.editar",
    "DELETE": "agenda.editar",
}

PERMISSOES_CAIXA = {
    ("GET", "/caixa/proximo-troco"): "caixa.visualizar",
    ("GET", "/caixa/aberto"): "caixa.visualizar",
    ("POST", "/caixa/abrir"): "caixa.abrir",
    ("POST", "/caixa/fechar"): "caixa.fechar",
    ("GET", "/caixa/movimentacoes"): "caixa.visualizar",
    ("GET", "/caixa/saldo"): "caixa.visualizar",
    ("GET", "/caixa/historico"): "caixa.visualizar",
    ("GET", "/caixa/conferencia"): "caixa.conferencia",
    ("POST", "/caixa/conferencia"): "caixa.conferencia",
}

PERMISSOES_MOVIMENTACAO = {
    "entrada": "caixa.entrada",
    "saida": "caixa.saida",
    "suprimento": "caixa.suprimento",
    "sangria": "caixa.sangria",
}


def usuario_tem_permissao(payload, permissao: str) -> bool:
    perfil = str(payload.get("perfil", "")).strip().lower()
    return bool(perfil and tem_permissao(perfil, permissao))


def resposta_sem_permissao():
    return JSONResponse(
        status_code=403,
        content={"detail": "Usuário sem permissão para esta operação."},
    )


@app.middleware("http")
async def proteger_api(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    if request.url.path in ROTAS_PUBLICAS or request.url.path.startswith(
        "/configuracoes/identidade/logo/"
    ):
        return await call_next(request)

    authorization = request.headers.get("Authorization", "")

    if not authorization.startswith("Bearer "):
        return JSONResponse(
            status_code=401,
            content={"detail": "Autenticação necessária."},
        )

    token = authorization[7:].strip()

    if not token:
        return JSONResponse(
            status_code=401,
            content={"detail": "Token de autenticação ausente."},
        )

    try:
        payload = verificar_token(token)
    except ValueError:
        return JSONResponse(
            status_code=401,
            content={"detail": "Token inválido ou expirado."},
        )

    if request.url.path == "/agendamentos" or request.url.path.startswith("/agendamentos/"):
        permissao = PERMISSOES_AGENDA.get(request.method)
        if permissao and not usuario_tem_permissao(payload, permissao):
            return resposta_sem_permissao()

    if request.url.path.startswith("/caixa"):
        permissao = PERMISSOES_CAIXA.get((request.method, request.url.path))

        if permissao and not usuario_tem_permissao(payload, permissao):
            return resposta_sem_permissao()

        if request.method == "POST" and request.url.path == "/caixa/movimentacoes":
            try:
                body = await request.body()
                dados = json.loads(body.decode("utf-8") or "{}")
                tipo = str(dados.get("tipo", "")).strip().lower()
            except (UnicodeDecodeError, json.JSONDecodeError):
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Dados da movimentação inválidos."},
                )

            permissao_movimentacao = PERMISSOES_MOVIMENTACAO.get(tipo)
            if not permissao_movimentacao:
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Tipo de movimentação inválido."},
                )

            if not usuario_tem_permissao(payload, permissao_movimentacao):
                return resposta_sem_permissao()

    return await call_next(request)


app.include_router(usuarios_router)
app.include_router(auth_router)
app.include_router(gestao_fiscal_router)
app.include_router(configuracao_fiscal_router)
app.include_router(pacientes_router)
app.include_router(prontuarios_router)
app.include_router(evolucoes_router)
app.include_router(agendamentos_router)
app.include_router(servicos_router)
app.include_router(recebimentos_conta_router)
app.include_router(contas_receber_router)
app.include_router(contas_pagar_router)
app.include_router(caixa_router)
app.include_router(conferencia_caixa_router)
app.include_router(estoque_router)
app.include_router(configuracao_sistema_router)
app.include_router(cuidare_ia_router)
app.include_router(planos_pilates_router)
app.include_router(alunos_planos_pilates_router)
app.include_router(recibo_pdf_router)
app.include_router(campanhas.router)
app.include_router(indicacoes.router)
app.include_router(configuracao.router)
app.include_router(recibo_nfse.router)
app.include_router(contrato.router)


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "Cuidare API",
        "message": "API funcionando corretamente.",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Cuidare API",
    }
