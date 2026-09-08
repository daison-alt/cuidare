from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.security.auth import verificar_token
from app.security.permissoes import tem_permissao

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

    perfil = str(payload.get("perfil", "")).strip().lower()

    if not perfil:
        raise HTTPException(
            status_code=403,
            detail="Perfil do usuário não identificado.",
        )

    return {
        "id": payload.get("sub"),
        "perfil": perfil,
    }


def exigir_permissao(permissao: str):
    def dependencia(
        usuario=Depends(obter_usuario_atual),
    ):
        if not tem_permissao(usuario["perfil"], permissao):
            raise HTTPException(
                status_code=403,
                detail="Usuário sem permissão para esta operação.",
            )

        return usuario

    return dependencia
