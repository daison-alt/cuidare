from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.contrato import Contrato
from app.schemas.contrato import ContratoCreate, ContratoResponse

router = APIRouter(prefix="/contratos", tags=["Gestão de Contratos"])

@router.get("", response_model=List[ContratoResponse])
def listar_contratos(db: Session = Depends(get_db)):
    return db.query(Contrato).order_by(Contrato.data_criacao.desc()).all()

@router.post("", response_model=ContratoResponse)
def criar_contrato(dados: ContratoCreate, db: Session = Depends(get_db)):
    novo_contrato = Contrato(**dados.dict())
    db.add(novo_contrato)
    db.commit()
    db.refresh(novo_contrato)
    return novo_contrato

@router.post("/{contrato_id}/assinar")
def assinar_contrato(contrato_id: int, db: Session = Depends(get_db)):
    contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado.")
    
    contrato.status = "Assinado"
    contrato.data_assinatura = datetime.utcnow()
    db.commit()
    db.refresh(contrato)
    return {"status": "sucesso", "mensagem": "Contrato marcado como assinado!"}
