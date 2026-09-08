from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCriar, UsuarioResposta
from app.security.auth import pwd_context


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuários"],
)


PERFIS_PERMITIDOS = {
    "administrador",
    "fisioterapeuta",
    "secretaria",
    "estagiario",
    "contador",
}


@router.get(
    "",
    response_model=list[UsuarioResposta],
)
def listar_usuarios(
    db: Session = Depends(get_db),
):
    usuarios = (
        db.query(Usuario)
        .order_by(Usuario.nome)
        .all()
    )

    return usuarios


@router.post(
    "",
    response_model=UsuarioResposta,
    status_code=status.HTTP_201_CREATED,
)
def criar_usuario(
    usuario: UsuarioCriar,
    db: Session = Depends(get_db),
):
    perfil = usuario.perfil.lower().strip()

    if perfil not in PERFIS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail="Perfil de usuário inválido.",
        )

    usuario_existente = (
        db.query(Usuario)
        .filter(Usuario.email == usuario.email)
        .first()
    )

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="Já existe um usuário com este e-mail.",
        )

    senha_hash = pwd_context.hash(usuario.senha)

    novo_usuario = Usuario(
        nome=usuario.nome.strip(),
        email=usuario.email,
        telefone=usuario.telefone,
        senha_hash=senha_hash,
        perfil=perfil,
        status=usuario.status,
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario