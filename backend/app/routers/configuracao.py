from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import shutil
from app.database import get_db
from app.models.configuracao import ConfiguracaoClinica
from app.schemas.configuracao import ConfiguracaoCreateUpdate, ConfiguracaoResponse

router = APIRouter(prefix="/configuracao", tags=["Configuração da Clínica"])

UPLOAD_DIR = "uploads_config"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("", response_model=ConfiguracaoResponse)
def obter_configuracao(db: Session = Depends(get_db)):
    config = db.query(ConfiguracaoClinica).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configurações da clínica ainda não cadastradas.")
    return config

@router.post("", response_model=ConfiguracaoResponse)
def salvar_configuracao(dados: ConfiguracaoCreateUpdate, db: Session = Depends(get_db)):
    config = db.query(ConfiguracaoClinica).first()
    if config:
        for key, value in dados.dict().items():
            setattr(config, key, value)
    else:
        config = ConfiguracaoClinica(**dados.dict())
        db.add(config)
    
    db.commit()
    db.refresh(config)
    return config

@router.post("/upload-logo")
def upload_logo(file: UploadFile = File(...), db: Session = Depends(get_db)):
    config = db.query(ConfiguracaoClinica).first()
    if not config:
        raise HTTPException(status_code=400, detail="Cadastre os dados da clínica antes de enviar a logo.")
    
    file_path = os.path.join(UPLOAD_DIR, f"logo_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    config.logo_path = file_path
    db.commit()
    return {"status": "sucesso", "logo_path": file_path}

@router.post("/upload-certificado")
def upload_certificado(senha: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    config = db.query(ConfiguracaoClinica).first()
    if not config:
        raise HTTPException(status_code=400, detail="Cadastre os dados da clínica antes de enviar o certificado.")
    
    file_path = os.path.join(UPLOAD_DIR, f"cert_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    config.certificado_a1_path = file_path
    config.certificado_senha = senha
    db.commit()
    return {"status": "sucesso", "mensagem": "Certificado A1 configurado com sucesso."}
