from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models.configuracao_fiscal import ConfiguracaoFiscal
from app.routers.usuarios import router as usuarios_router
from app.routers.auth import router as auth_router
from app.routers.gestao_fiscal import router as gestao_fiscal_router
from app.routers.configuracao_fiscal import router as configuracao_fiscal_router


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