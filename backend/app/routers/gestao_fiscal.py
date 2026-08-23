from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.gestao_fiscal import GestaoFiscal
from app.schemas.gestao_fiscal import (
    GestaoFiscalCriar,
    GestaoFiscalResposta,
)


router = APIRouter(
    prefix="/gestao-fiscal",
    tags=["Gestão Fiscal"],
)


@router.get(
    "",
    response_model=list[GestaoFiscalResposta],
)
def listar_gestao_fiscal(
    db: Session = Depends(get_db),
):
    return (
        db.query(GestaoFiscal)
        .filter(GestaoFiscal.ativo == True)
        .order_by(GestaoFiscal.vencimento)
        .all()
    )


@router.get(
    "/{registro_id}",
    response_model=GestaoFiscalResposta,
)
def buscar_gestao_fiscal(
    registro_id: int,
    db: Session = Depends(get_db),
):
    registro = (
        db.query(GestaoFiscal)
        .filter(
            GestaoFiscal.id == registro_id,
            GestaoFiscal.ativo == True,
        )
        .first()
    )

    if not registro:
        raise HTTPException(
            status_code=404,
            detail="Registro fiscal não encontrado.",
        )

    return registro


@router.post(
    "",
    response_model=GestaoFiscalResposta,
    status_code=201,
)
def criar_gestao_fiscal(
    dados: GestaoFiscalCriar,
    db: Session = Depends(get_db),
):
    registro = GestaoFiscal(
        tipo_documento=dados.tipo_documento.strip(),
        competencia=dados.competencia.strip(),
        descricao=dados.descricao.strip(),
        status=dados.status.strip().lower(),
        vencimento=dados.vencimento,
        valor=dados.valor,
        observacoes=dados.observacoes,
        arquivo=dados.arquivo,
    )

    db.add(registro)
    db.commit()
    db.refresh(registro)

    return registro
