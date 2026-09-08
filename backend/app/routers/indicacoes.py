from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.indicacao import Indicacao
from app.models.paciente import Paciente
from app.schemas.indicacao import IndicacaoCriar, IndicacaoResposta

router = APIRouter(prefix="/indicacoes", tags=["Indicações"])

@router.get("", response_model=list[IndicacaoResposta])
def listar_indicacoes(db: Session = Depends(get_db)):
    return db.query(Indicacao).order_by(Indicacao.id.desc()).all()

@router.post("", response_model=IndicacaoResposta)
def criar_indicacao(dados: IndicacaoCriar, db: Session = Depends(get_db)):
    if dados.indicador_id == dados.indicado_id:
        raise HTTPException(400, "O paciente não pode indicar a si mesmo.")

    if not db.get(Paciente, dados.indicador_id):
        raise HTTPException(404, "Paciente indicador não encontrado.")

    if not db.get(Paciente, dados.indicado_id):
        raise HTTPException(404, "Paciente indicado não encontrado.")

    indicacao = Indicacao(
        indicador_id=dados.indicador_id,
        indicado_id=dados.indicado_id,
    )

    db.add(indicacao)
    db.commit()
    db.refresh(indicacao)

    return indicacao

@router.delete("/{indicacao_id}")
def remover_indicacao(indicacao_id: int, db: Session = Depends(get_db)):
    indicacao = db.get(Indicacao, indicacao_id)

    if not indicacao:
        raise HTTPException(404, "Indicação não encontrada.")

    db.delete(indicacao)
    db.commit()

    return {"mensagem": "Indicação removida com sucesso."}
