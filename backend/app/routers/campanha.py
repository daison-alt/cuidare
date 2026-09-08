from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.campanha import Campanha
from app.schemas.campanha import CampanhaCreate, CampanhaResponse

router = APIRouter(prefix="/campanhas", tags=["Gestão de Campanhas & Marketing"])

@router.get("", response_model=List[CampanhaResponse])
def listar_campanhas(db: Session = Depends(get_db)):
    return db.query(Campanha).order_by(Campanha.data_criacao.desc()).all()

@router.post("", response_model=CampanhaResponse)
def criar_campanha(dados: CampanhaCreate, db: Session = Depends(get_db)):
    nova_campanha = Campanha(**dados.dict())
    # Simulação da estimativa do número de destinatários conforme o segmento selecionado
    nova_campanha.total_destinatarios = 15
    db.add(nova_campanha)
    db.commit()
    db.refresh(nova_campanha)
    return nova_campanha

@router.post("/{campanha_id}/disparar")
def disparar_campanha(campanha_id: int, db: Session = Depends(get_db)):
    campanha = db.query(Campanha).filter(Campanha.id == campanha_id).first()
    if not campanha:
        raise HTTPException(status_code=404, detail="Campanha não encontrada.")
    
    campanha.status = "Concluída"
    campanha.data_envio = datetime.utcnow()
    db.commit()
    db.refresh(campanha)
    return {"status": "sucesso", "mensagem": f"Campanha disparada com sucesso para {campanha.total_destinatarios} pacientes!"}
