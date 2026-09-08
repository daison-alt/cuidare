from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.recibo_nfse import ReciboNFSe
from app.models.recebimento_conta import RecebimentoConta
from app.models.conta_receber import ContaReceber
from app.models.paciente import Paciente
from app.schemas.recibo_nfse import ReciboNFSeCreate, ReciboNFSeResponse

router = APIRouter(prefix="/recibos", tags=["Central de Recibos e NFS-e"])

@router.get("", response_model=List[ReciboNFSeResponse])
def listar_recibos(db: Session = Depends(get_db)):
    return db.query(ReciboNFSe).order_by(ReciboNFSe.data_emissao.desc()).all()

@router.post("", response_model=ReciboNFSeResponse)
def criar_recibo(dados: ReciboNFSeCreate, db: Session = Depends(get_db)):
    novo_recibo = ReciboNFSe(**dados.dict())
    db.add(novo_recibo)
    db.commit()
    db.refresh(novo_recibo)
    return novo_recibo

@router.post("/recebimento/{recebimento_id}")
def criar_nfse_do_recebimento(
    recebimento_id: int,
    db: Session = Depends(get_db),
):
    recebimento = (
        db.query(RecebimentoConta)
        .filter(
            RecebimentoConta.id == recebimento_id,
            RecebimentoConta.ativo.is_(True),
        )
        .first()
    )

    if not recebimento:
        raise HTTPException(
            status_code=404,
            detail="Recebimento não encontrado.",
        )

    conta = (
        db.query(ContaReceber)
        .filter(
            ContaReceber.id == recebimento.conta_receber_id,
            ContaReceber.ativo.is_(True),
        )
        .first()
    )

    if not conta:
        raise HTTPException(
            status_code=404,
            detail="Conta a receber não encontrada.",
        )

    paciente = None

    if conta.paciente_id:
        paciente = (
            db.query(Paciente)
            .filter(
                Paciente.id == conta.paciente_id,
                Paciente.ativo.is_(True),
            )
            .first()
        )

    if not paciente:
        raise HTTPException(
            status_code=400,
            detail="Não é possível emitir a NFS-e porque o recebimento não possui paciente vinculado.",
        )

    existente = (
        db.query(ReciboNFSe)
        .filter(
            ReciboNFSe.paciente_id == paciente.id,
            ReciboNFSe.valor == float(recebimento.valor_total or 0),
            ReciboNFSe.servico_descricao == conta.descricao,
        )
        .order_by(ReciboNFSe.id.desc())
        .first()
    )

    if existente:
        return existente

    nova_nfse = ReciboNFSe(
        paciente_id=paciente.id,
        paciente_nome=paciente.nome,
        paciente_cpf=paciente.cpf or "",
        paciente_email=paciente.email,
        valor=float(recebimento.valor_total or 0),
        servico_descricao=conta.descricao,
        status_recibo="Emitido",
        status_nfse="Pendente",
    )

    db.add(nova_nfse)
    db.commit()
    db.refresh(nova_nfse)

    return nova_nfse


@router.post("/{recibo_id}/emitir-nfse")
def emitir_nfse(recibo_id: int, db: Session = Depends(get_db)):
    recibo = db.query(ReciboNFSe).filter(ReciboNFSe.id == recibo_id).first()
    if not recibo:
        raise HTTPException(status_code=404, detail="Recibo não encontrado.")
    
    # Simulação da integração de chamada com a API de NFe (Focus NFe / PlugNotas / e-Notas)
    # Na integração final, os dados do Certificado A1 salvos na ConfiguracaoClinica são usados aqui.
    recibo.status_nfse = "Emitida"
    recibo.numero_nfse = f"NFE-{recibo.id}0092"
    recibo.url_pdf_nfse = f"https://api.cuidareclinic.com.br/notas/pdf/{recibo.id}"
    
    db.commit()
    db.refresh(recibo)
    return {"status": "sucesso", "mensagem": "NFS-e emitida com sucesso!", "numero_nfse": recibo.numero_nfse}
