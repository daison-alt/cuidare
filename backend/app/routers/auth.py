from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioResposta
from app.security.auth import criar_token_acesso, pwd_context


router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"],
)


@router.post("/login")
def login(
    email: str,
    senha: str,
    db: Session = Depends(get_db),
):
    usuario = (
        db.query(Usuario)
        .filter(Usuario.email == email)
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
        )

    if not usuario.status:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo.",
        )

    if not pwd_context.verify(
        senha,
        usuario.senha_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
        )

    token = criar_token_acesso(
        usuario_id=usuario.id,
        perfil=usuario.perfil,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": UsuarioResposta.model_validate(usuario),
    }