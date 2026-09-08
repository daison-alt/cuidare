from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.configuracao_sistema import ConfiguracaoSistema


router = APIRouter(
    prefix="/configuracoes",
    tags=["Configurações"],
)


BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

EXTENSOES_PERMITIDAS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
}

TIPOS_PERMITIDOS = {
    "image/png",
    "image/jpeg",
    "image/webp",
}

TAMANHO_MAXIMO = 5 * 1024 * 1024


def obter_configuracao(db: Session):
    configuracao = (
        db.query(ConfiguracaoSistema)
        .order_by(ConfiguracaoSistema.id.asc())
        .first()
    )

    if configuracao is None:
        configuracao = ConfiguracaoSistema()
        db.add(configuracao)
        db.commit()
        db.refresh(configuracao)

    return configuracao


@router.get("/identidade")
def obter_identidade(
    db: Session = Depends(get_db),
):
    configuracao = obter_configuracao(db)

    logo_url = None

    if configuracao.logo_caminho:
        logo_url = f"/configuracoes/identidade/logo/{configuracao.id}"

    return {
        "id": configuracao.id,
        "logo_nome": configuracao.logo_nome,
        "logo_tipo": configuracao.logo_tipo,
        "logo_url": logo_url,
        "atualizado_em": configuracao.atualizado_em,
    }


@router.post("/identidade/logo")
async def enviar_logo(
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not arquivo.filename:
        raise HTTPException(
            status_code=400,
            detail="Nenhum arquivo foi selecionado.",
        )

    extensao = Path(arquivo.filename).suffix.lower()

    if extensao not in EXTENSOES_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail="Formato de imagem não permitido. Use PNG, JPG, JPEG ou WEBP.",
        )

    if arquivo.content_type not in TIPOS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail="O arquivo enviado não é uma imagem válida.",
        )

    conteudo = await arquivo.read()

    if not conteudo:
        raise HTTPException(
            status_code=400,
            detail="O arquivo selecionado está vazio.",
        )

    if len(conteudo) > TAMANHO_MAXIMO:
        raise HTTPException(
            status_code=400,
            detail="A logo deve ter no máximo 5 MB.",
        )

    configuracao = obter_configuracao(db)

    if configuracao.logo_caminho:
        arquivo_anterior = Path(configuracao.logo_caminho)

        if arquivo_anterior.exists():
            arquivo_anterior.unlink()

    nome_arquivo = f"logo_cuidare_{uuid4().hex}{extensao}"
    caminho = UPLOAD_DIR / nome_arquivo

    caminho.write_bytes(conteudo)

    configuracao.logo_nome = arquivo.filename
    configuracao.logo_caminho = str(caminho)
    configuracao.logo_tipo = arquivo.content_type

    db.commit()
    db.refresh(configuracao)

    return {
        "id": configuracao.id,
        "logo_nome": configuracao.logo_nome,
        "logo_tipo": configuracao.logo_tipo,
        "logo_url": f"/configuracoes/identidade/logo/{configuracao.id}",
        "mensagem": "Logo salva com sucesso.",
    }


@router.get("/identidade/logo/{configuracao_id}")
def visualizar_logo(
    configuracao_id: int,
    db: Session = Depends(get_db),
):
    from fastapi.responses import FileResponse

    configuracao = (
        db.query(ConfiguracaoSistema)
        .filter(ConfiguracaoSistema.id == configuracao_id)
        .first()
    )

    if not configuracao or not configuracao.logo_caminho:
        raise HTTPException(
            status_code=404,
            detail="Logo não encontrada.",
        )

    caminho = Path(configuracao.logo_caminho)

    if not caminho.exists():
        raise HTTPException(
            status_code=404,
            detail="Arquivo da logo não encontrado.",
        )

    return FileResponse(
        path=caminho,
        media_type=configuracao.logo_tipo or "image/png",
        filename=configuracao.logo_nome or "logo_cuidare",
    )


@router.delete("/identidade/logo")
def remover_logo(
    db: Session = Depends(get_db),
):
    configuracao = obter_configuracao(db)

    if configuracao.logo_caminho:
        caminho = Path(configuracao.logo_caminho)

        if caminho.exists():
            caminho.unlink()

    configuracao.logo_nome = None
    configuracao.logo_caminho = None
    configuracao.logo_tipo = None

    db.commit()
    db.refresh(configuracao)

    return {
        "mensagem": "Logo removida com sucesso.",
    }
