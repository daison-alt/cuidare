from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.configuracao_fiscal import ConfiguracaoFiscal
from app.schemas.configuracao_fiscal import (
    ConfiguracaoFiscalAtualizar,
    ConfiguracaoFiscalCriar,
    ConfiguracaoFiscalResposta,
)


router = APIRouter(
    prefix="/configuracao-fiscal",
    tags=["Configuração Fiscal"],
)


@router.get(
    "",
    response_model=list[ConfiguracaoFiscalResposta],
)
def listar_configuracoes_fiscais(
    db: Session = Depends(get_db),
):
    return (
        db.query(ConfiguracaoFiscal)
        .filter(ConfiguracaoFiscal.ativo == True)
        .order_by(ConfiguracaoFiscal.id)
        .all()
    )


@router.get(
    "/{configuracao_id}",
    response_model=ConfiguracaoFiscalResposta,
)
def buscar_configuracao_fiscal(
    configuracao_id: int,
    db: Session = Depends(get_db),
):
    configuracao = (
        db.query(ConfiguracaoFiscal)
        .filter(
            ConfiguracaoFiscal.id == configuracao_id,
            ConfiguracaoFiscal.ativo == True,
        )
        .first()
    )

    if not configuracao:
        raise HTTPException(
            status_code=404,
            detail="Configuração fiscal não encontrada.",
        )

    return configuracao


@router.post(
    "",
    response_model=ConfiguracaoFiscalResposta,
    status_code=201,
)
def criar_configuracao_fiscal(
    dados: ConfiguracaoFiscalCriar,
    db: Session = Depends(get_db),
):
    existente = (
        db.query(ConfiguracaoFiscal)
        .filter(
            ConfiguracaoFiscal.cnpj == dados.cnpj.strip(),
            ConfiguracaoFiscal.ativo == True,
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=409,
            detail="Já existe uma configuração fiscal ativa para este CNPJ.",
        )

    configuracao = ConfiguracaoFiscal(
        razao_social=dados.razao_social.strip(),
        nome_fantasia=(
            dados.nome_fantasia.strip()
            if dados.nome_fantasia
            else None
        ),
        cnpj=dados.cnpj.strip(),
        inscricao_municipal=(
            dados.inscricao_municipal.strip()
            if dados.inscricao_municipal
            else None
        ),
        inscricao_estadual=(
            dados.inscricao_estadual.strip()
            if dados.inscricao_estadual
            else None
        ),
        endereco=dados.endereco.strip() if dados.endereco else None,
        numero=dados.numero.strip() if dados.numero else None,
        complemento=(
            dados.complemento.strip()
            if dados.complemento
            else None
        ),
        bairro=dados.bairro.strip() if dados.bairro else None,
        cep=dados.cep.strip() if dados.cep else None,
        municipio=dados.municipio.strip(),
        uf=dados.uf.strip().upper(),
        codigo_municipio=(
            dados.codigo_municipio.strip()
            if dados.codigo_municipio
            else None
        ),
        regime_tributario=(
            dados.regime_tributario.strip()
            if dados.regime_tributario
            else None
        ),
        codigo_servico=(
            dados.codigo_servico.strip()
            if dados.codigo_servico
            else None
        ),
        descricao_servico=(
            dados.descricao_servico.strip()
            if dados.descricao_servico
            else None
        ),
        aliquota_iss=(
            dados.aliquota_iss.strip()
            if dados.aliquota_iss
            else None
        ),
        emissao_nfse_ativa=dados.emissao_nfse_ativa,
        ambiente_nfse=dados.ambiente_nfse.strip().lower(),
        provedor_nfse=(
            dados.provedor_nfse.strip()
            if dados.provedor_nfse
            else None
        ),
        observacoes=(
            dados.observacoes.strip()
            if dados.observacoes
            else None
        ),
    )

    db.add(configuracao)
    db.commit()
    db.refresh(configuracao)

    return configuracao


@router.put(
    "/{configuracao_id}",
    response_model=ConfiguracaoFiscalResposta,
)
def atualizar_configuracao_fiscal(
    configuracao_id: int,
    dados: ConfiguracaoFiscalAtualizar,
    db: Session = Depends(get_db),
):
    configuracao = (
        db.query(ConfiguracaoFiscal)
        .filter(
            ConfiguracaoFiscal.id == configuracao_id,
            ConfiguracaoFiscal.ativo == True,
        )
        .first()
    )

    if not configuracao:
        raise HTTPException(
            status_code=404,
            detail="Configuração fiscal não encontrada.",
        )

    dados_atualizados = dados.model_dump(exclude_unset=True)

    if "cnpj" in dados_atualizados:
        novo_cnpj = dados_atualizados["cnpj"].strip()

        existente = (
            db.query(ConfiguracaoFiscal)
            .filter(
                ConfiguracaoFiscal.cnpj == novo_cnpj,
                ConfiguracaoFiscal.id != configuracao_id,
                ConfiguracaoFiscal.ativo == True,
            )
            .first()
        )

        if existente:
            raise HTTPException(
                status_code=409,
                detail="Já existe uma configuração fiscal ativa para este CNPJ.",
            )

        dados_atualizados["cnpj"] = novo_cnpj

    campos_texto = [
        "razao_social",
        "nome_fantasia",
        "inscricao_municipal",
        "inscricao_estadual",
        "endereco",
        "numero",
        "complemento",
        "bairro",
        "cep",
        "municipio",
        "codigo_municipio",
        "regime_tributario",
        "codigo_servico",
        "descricao_servico",
        "aliquota_iss",
        "provedor_nfse",
        "observacoes",
    ]

    for campo in campos_texto:
        if campo in dados_atualizados:
            valor = dados_atualizados[campo]

            if isinstance(valor, str):
                dados_atualizados[campo] = valor.strip()

    if "uf" in dados_atualizados and dados_atualizados["uf"]:
        dados_atualizados["uf"] = dados_atualizados["uf"].strip().upper()

    if "ambiente_nfse" in dados_atualizados:
        dados_atualizados["ambiente_nfse"] = (
            dados_atualizados["ambiente_nfse"].strip().lower()
        )

    for campo, valor in dados_atualizados.items():
        setattr(configuracao, campo, valor)

    db.commit()
    db.refresh(configuracao)

    return configuracao


@router.delete(
    "/{configuracao_id}",
)
def excluir_configuracao_fiscal(
    configuracao_id: int,
    db: Session = Depends(get_db),
):
    configuracao = (
        db.query(ConfiguracaoFiscal)
        .filter(
            ConfiguracaoFiscal.id == configuracao_id,
            ConfiguracaoFiscal.ativo == True,
        )
        .first()
    )

    if not configuracao:
        raise HTTPException(
            status_code=404,
            detail="Configuração fiscal não encontrada.",
        )

    configuracao.ativo = False

    db.commit()

    return {
        "status": "ok",
        "message": "Configuração fiscal desativada com sucesso.",
    }
