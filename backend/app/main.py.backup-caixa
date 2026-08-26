from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models.configuracao_fiscal import ConfiguracaoFiscal
from app.models.paciente import Paciente
from app.models.prontuario import Prontuario
from app.models.evolucao import Evolucao
from app.models.agendamento import Agendamento
from app.models.servico import Servico
from app.models.conta_receber import ContaReceber
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
from app.routers.contas_pagar import router as contas_pagar_router


# Cria as tabelas do banco de dados
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Cuidare API",
    version="1.0.0",
)


# Permite que o frontend React/Vite converse com a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Rotas
app.include_router(usuarios_router)
app.include_router(auth_router)
app.include_router(gestao_fiscal_router)
app.include_router(configuracao_fiscal_router)
app.include_router(pacientes_router)
app.include_router(prontuarios_router)
app.include_router(evolucoes_router)
app.include_router(agendamentos_router)
app.include_router(servicos_router)
app.include_router(contas_receber_router)
app.include_router(contas_pagar_router)


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