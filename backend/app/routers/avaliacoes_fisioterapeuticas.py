"""Registro historico de avaliacoes: gravacoes definitivas, sem edicao/exclusao."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.avaliacao_fisioterapeutica import AvaliacaoFisioterapeutica
from app.models.prontuario import Prontuario
from app.models.usuario import Usuario
from app.schemas.avaliacao_fisioterapeutica import AvaliacaoCriar, AvaliacaoResposta
from app.security.autorizacao import exigir_permissao

router = APIRouter(prefix="/prontuarios", tags=["Avaliacoes fisioterapeuticas"])


def usuario_ativo(db: Session, usuario: dict) -> Usuario:
    try:
        usuario_id = int(usuario["id"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Usuario invalido.")

    encontrado = db.get(Usuario, usuario_id)
    if (
        not encontrado
        or not encontrado.status
        or encontrado.perfil not in {"administrador", "fisioterapeuta"}
        or encontrado.perfil != usuario["perfil"]
    ):
        raise HTTPException(status_code=403, detail="Acesso clinico nao autorizado.")
    return encontrado


def verificar_prontuario(db: Session, prontuario_id: int) -> None:
    if db.get(Prontuario, prontuario_id) is None:
        raise HTTPException(status_code=404, detail="Prontuario nao encontrado.")


@router.get(
    "/{prontuario_id}/avaliacoes",
    response_model=list[AvaliacaoResposta],
)
def listar_avaliacoes(
    prontuario_id: int,
    db: Session = Depends(get_db),
    usuario: dict = Depends(exigir_permissao("prontuarios.visualizar")),
):
    usuario_ativo(db, usuario)
    verificar_prontuario(db, prontuario_id)
    return (
        db.query(AvaliacaoFisioterapeutica)
        .filter(AvaliacaoFisioterapeutica.prontuario_id == prontuario_id)
        .order_by(
            AvaliacaoFisioterapeutica.criado_em.desc(),
            AvaliacaoFisioterapeutica.id.desc(),
        )
        .all()
    )


@router.post(
    "/{prontuario_id}/avaliacoes",
    response_model=AvaliacaoResposta,
    status_code=status.HTTP_201_CREATED,
)
def registrar_avaliacao(
    prontuario_id: int,
    dados: AvaliacaoCriar,
    db: Session = Depends(get_db),
    usuario: dict = Depends(exigir_permissao("prontuarios.criar")),
):
    profissional = usuario_ativo(db, usuario)
    verificar_prontuario(db, prontuario_id)

    formulario = dados.formulario.model_dump()
    if not any(
        v is not None
        and (len(v) > 0 if isinstance(v, (list, str)) else True)
        and (not isinstance(v, str) or bool(v.strip()))
        for v in formulario.values()
    ):
        raise HTTPException(
            status_code=422,
            detail="Preencha ao menos um campo da avaliacao antes de registrar.",
        )

    registro = AvaliacaoFisioterapeutica(
        prontuario_id=prontuario_id,
        tipo=dados.tipo,
        profissional_id=profissional.id,
        profissional_nome=profissional.nome,
        formulario=formulario,
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro
