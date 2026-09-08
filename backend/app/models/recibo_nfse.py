from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ReciboNFSe(Base):
    __tablename__ = "recibos_nfse"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, nullable=False)
    paciente_nome = Column(String(200), nullable=False)
    paciente_cpf = Column(String(20), nullable=False)
    paciente_email = Column(String(100), nullable=True)
    
    valor = Column(Float, nullable=False)
    servico_descricao = Column(Text, nullable=False)
    data_emissao = Column(DateTime, default=datetime.utcnow)
    
    # Status do Recibo
    status_recibo = Column(String(50), default="Emitido") # Emitido, Cancelado
    pdf_path = Column(String(500), nullable=True)

    # Status e Dados da NFS-e
    status_nfse = Column(String(50), default="Pendente") # Pendente, Processando, Emitida, Erro, Cancelada
    chave_nfse = Column(String(100), nullable=True)
    numero_nfse = Column(String(50), nullable=True)
    url_pdf_nfse = Column(String(500), nullable=True)
    mensagem_erro_nfse = Column(Text, nullable=True)
