import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext


SECRET_KEY = os.getenv("CUIDARE_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "CUIDARE_SECRET_KEY não configurada. "
        "Defina a variável de ambiente antes de iniciar a API."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def criar_token_acesso(
    usuario_id: int,
    perfil: str,
) -> str:
    agora = datetime.now(timezone.utc)

    expiracao = agora + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(usuario_id),
        "perfil": perfil,
        "iat": agora,
        "exp": expiracao,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def verificar_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        return payload

    except JWTError:
        raise ValueError("Token inválido ou expirado.")
