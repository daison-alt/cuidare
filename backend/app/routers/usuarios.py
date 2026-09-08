from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCriar, UsuarioResposta, UsuarioAtualizar
from app.security.auth import pwd_context, verificar_token


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuários"],
)


PERFIS_PERMITIDOS = {
    "administrador",
    "fisioterapeuta",
    "secretaria",
    "estagiario",
    "contabilidade",
}


def verificar_administrador(
    authorization: str | None = Header(default=None),
):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acesso não informado.",
        )

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de autorização inválido.",
        )

    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = verificar_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
        )

    perfil = str(payload.get("perfil", "")).lower().strip()

    if perfil != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido somente para administradores.",
        )

    return payload


@router.get(
    "",
    response_model=list[UsuarioResposta],
)
def listar_usuarios(
    db: Session = Depends(get_db),
    _: dict = Depends(verificar_administrador),
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
    _: dict = Depends(verificar_administrador),
):
    perfil = usuario.perfil.lower().strip()

    if perfil not in PERFIS_PERMITIDOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Perfil de usuário inválido.",
        )

    email = str(usuario.email).strip().lower()

    usuario_existente = (
        db.query(Usuario)
        .filter(Usuario.email == email)
        .first()
    )

    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um usuário com este e-mail.",
        )

    senha = usuario.senha.strip()

    if not senha:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha é obrigatória.",
        )

    senha_hash = pwd_context.hash(senha)

    novo_usuario = Usuario(
        nome=usuario.nome.strip(),
        email=email,
        telefone=usuario.telefone.strip() if usuario.telefone else None,
        senha_hash=senha_hash,
        perfil=perfil,
        status=usuario.status,
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario


@router.put(
    "/{usuario_id}",
    response_model=UsuarioResposta,
)
def atualizar_usuario(
    usuario_id: int,
    usuario: UsuarioAtualizar,
    db: Session = Depends(get_db),
    _: dict = Depends(verificar_administrador),
):
    usuario_db = (
        db.query(Usuario)
        .filter(Usuario.id == usuario_id)
        .first()
    )

    if not usuario_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    perfil = usuario.perfil.lower().strip()

    if perfil not in PERFIS_PERMITIDOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Perfil de usuário inválido.",
        )

    email = str(usuario.email).strip().lower()

    outro_usuario = (
        db.query(Usuario)
        .filter(
            Usuario.email == email,
            Usuario.id != usuario_id,
        )
        .first()
    )

    if outro_usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe outro usuário com este e-mail.",
        )

    usuario_db.nome = usuario.nome.strip()
    usuario_db.email = email
    usuario_db.telefone = (
        usuario.telefone.strip()
        if usuario.telefone
        else None
    )
    usuario_db.perfil = perfil
    usuario_db.status = usuario.status

    db.commit()
    db.refresh(usuario_db)

    return usuario_db


@router.patch(
    "/{usuario_id}/status",
    response_model=UsuarioResposta,
)
def alterar_status_usuario(
    usuario_id: int,
    ativo: bool,
    db: Session = Depends(get_db),
    _: dict = Depends(verificar_administrador),
):
    usuario_db = (
        db.query(Usuario)
        .filter(Usuario.id == usuario_id)
        .first()
    )

    if not usuario_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    usuario_db.status = ativo

    db.commit()
    db.refresh(usuario_db)

    return usuario_db
