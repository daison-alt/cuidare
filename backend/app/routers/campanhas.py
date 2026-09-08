from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.campanha import Campanha
from app.schemas.campanha import CampanhaCreate, CampanhaResponse
from app.models.paciente import Paciente
from datetime import date

router = APIRouter(prefix="/campanhas", tags=["Campanhas"])

@router.get("", response_model=list[CampanhaResponse])
def listar_campanhas(db: Session = Depends(get_db)):
    return db.query(Campanha).order_by(Campanha.id.desc()).all()

@router.post("", response_model=CampanhaResponse)
def criar_campanha(dados: CampanhaCreate, db: Session = Depends(get_db)):
    campanha = Campanha(**dados.model_dump())
    db.add(campanha)
    db.commit()
    db.refresh(campanha)
    return campanha


@router.get("/aniversariantes")
def listar_aniversariantes(db: Session = Depends(get_db)):
    mes = date.today().month

    pacientes = (
        db.query(Paciente)
        .filter(Paciente.data_nascimento.isnot(None))
        .all()
    )

    return [
        {
            "id": paciente.id,
            "nome": paciente.nome,
            "data_nascimento": paciente.data_nascimento,
        }
        for paciente in pacientes
        if paciente.data_nascimento.month == mes
    ]
