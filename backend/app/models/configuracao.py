from sqlalchemy import Column, Integer, String
from app.database import Base

class ConfiguracaoClinica(Base):
    __tablename__ = "configuracao_clinica"

    id = Column(Integer, primary_key=True, index=True)
    razao_social = Column(String(250), nullable=False)
    nome_fantasia = Column(String(250), nullable=True)
    cnpj = Column(String(20), nullable=False)
    inscricao_municipal = Column(String(50), nullable=True)
    
    logradouro = Column(String(200), nullable=True)
    numero = Column(String(20), nullable=True)
    bairro = Column(String(100), nullable=True)
    cidade = Column(String(100), nullable=True)
    estado = Column(String(2), nullable=True)
    cep = Column(String(10), nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)

    regime_tributario = Column(String(50), nullable=True)
    codigo_servico_municipal = Column(String(50), nullable=True)
    aliquota_iss = Column(String(10), nullable=True)
    
    certificado_a1_path = Column(String(500), nullable=True)
    certificado_senha = Column(String(250), nullable=True)

    logo_path = Column(String(500), nullable=True)
    responsavel_tecnico = Column(String(150), nullable=True)
    crefito_responsavel = Column(String(50), nullable=True)
