"""Integra Financeiro e Caixa preservando historico de contas e recibos."""
from pathlib import Path

root = Path.cwd()
receber = root / "backend/app/routers/contas_receber.py"
pagar = root / "backend/app/routers/contas_pagar.py"
pagina = root / "cuidare/src/pages/Financeiro.jsx"
app = root / "cuidare/src/App.jsx"

for arquivo in (receber, pagar, pagina, app):
    if not arquivo.is_file():
        raise SystemExit(f"Arquivo nao encontrado: {arquivo}")
for nome in ("cobranca_plano_pilates.py", "parcela_plano_pilates.py"):
    if not (root / "backend/app/models" / nome).is_file():
        raise SystemExit(
            f"Integracao de Pilates nao encontrada ({nome}). "
            "Nenhuma alteracao realizada."
        )

textos = {arquivo: arquivo.read_text() for arquivo in (receber, pagar, pagina, app)}
marcador = "CUIDARE_INTEGRIDADE_FINANCEIRA_V1"
if all(marcador in texto for texto in textos.values()):
    print("✅ Integracao ja instalada.")
    raise SystemExit(0)
if any(marcador in texto for texto in textos.values()):
    raise SystemExit("Instalacao parcial identificada. Nenhum arquivo alterado.")


def trocar(arquivo, antigo, novo):
    original = textos[arquivo]
    quantidade = original.count(antigo)
    if quantidade != 1:
        raise SystemExit(
            f"Arquivo {arquivo.name}: esperado 1 trecho, encontrado {quantidade}.\n"
            f"Trecho: {antigo[:105]!r}\n"
            "Nenhuma alteracao realizada. Envie o erro para ajuste."
        )
    textos[arquivo] = original.replace(antigo, novo, 1)


# Protecao no backend, independente de qual tela ou cliente invoque a API.
trocar(
    receber,
    "from datetime import date\n",
    "from datetime import date\nfrom decimal import Decimal\n",
)
trocar(
    receber,
    "from app.models.conta_receber import ContaReceber\n",
    "from app.models.conta_receber import ContaReceber\n"
    "from app.models.recebimento_conta import RecebimentoConta\n"
    "from app.models.cobranca_plano_pilates import CobrancaPlanoPilates\n"
    "from app.models.parcela_plano_pilates import ParcelaPlanoPilates\n",
)

# Helper verifica o banco: nao depende de textos da descricao.
trocar(
    receber,
    '\n\n@router.post(\n    "",\n    response_model=ContaReceberResposta,\n',
    '''

# CUIDARE_INTEGRIDADE_FINANCEIRA_V1
def bloquear_alteracao_conta_protegida(db: Session, conta: ContaReceber):
    """Recibos e matriculas nunca podem ser alterados por edicao livre."""
    if conta.status == "pago" or Decimal(str(conta.valor_pago or 0)) > 0:
        raise HTTPException(
            status_code=409,
            detail="Conta com pagamento registrado. Utilize o estorno autorizado para corrigir."
        )
    if db.query(RecebimentoConta.id).filter(
        RecebimentoConta.conta_receber_id == conta.id
    ).first():
        raise HTTPException(
            status_code=409,
            detail="Esta conta possui historico de recebimentos ou estornos e nao pode ser editada/excluida."
        )
    if db.query(CobrancaPlanoPilates.id).filter(
        CobrancaPlanoPilates.conta_receber_id == conta.id
    ).first() or db.query(ParcelaPlanoPilates.id).filter(
        ParcelaPlanoPilates.conta_receber_id == conta.id
    ).first():
        raise HTTPException(
            status_code=409,
            detail="Cobrança vinculada ao Pilates. Alterações exigem uma rotina de cancelamento ou renegociação."
        )


@router.post(
    "",
    response_model=ContaReceberResposta,
'''
)
# Eliminamos a via que marcava como pago sem criar Recibo.
trocar(
    receber,
    '''    status = validar_status(dados.status)

    forma_pagamento = validar_forma_pagamento(''',
    '''    status = validar_status(dados.status)
    if status == "pago":
        raise HTTPException(
            status_code=409,
            detail="Cadastre a cobrança como pendente e utilize Receber para registrar o pagamento e gerar recibo."
        )
    if (
        (dados.valor_pago is not None and Decimal(str(dados.valor_pago)) != 0)
        or dados.data_pagamento is not None
        or dados.forma_pagamento is not None
    ):
        raise HTTPException(
            status_code=400,
            detail="Dados de pagamento devem ser registrados pela ação Receber."
        )

    forma_pagamento = validar_forma_pagamento('''
)
# Ponto unico na rota de edicao.
trocar(
    receber,
    '''    status_anterior = conta.status

    campos = dados.model_dump(''',
    '''    bloquear_alteracao_conta_protegida(db, conta)

    status_anterior = conta.status

    campos = dados.model_dump('''
)
trocar(
    receber,
    '''    novo_status = campos.get(
        "status",
        conta.status,
    )

    if status_anterior == "pago":''',
    '''    novo_status = campos.get(
        "status",
        conta.status,
    )

    if novo_status == "pago" or any(
        campos.get(campo) is not None
        for campo in ("valor_pago", "forma_pagamento", "data_pagamento")
    ):
        raise HTTPException(
            status_code=409,
            detail="Para receber pagamentos, utilize Receber; nao altere os valores manualmente."
        )

    if status_anterior == "pago":'''
)
# Exclusao: aplica no trecho unico da rota DELETE, nao na edicao.
trocar(
    receber,
    '''    conta.ativo = False

    db.commit()

    return {
        "status": "ok",
        "message": "Conta a receber desativada com sucesso.",''',
    '''    bloquear_alteracao_conta_protegida(db, conta)
    conta.ativo = False

    db.commit()

    return {
        "status": "ok",
        "message": "Conta a receber desativada com sucesso.",'''
)

# Despesas pagas ja passaram pelo Caixa. Nao ocultar ou editar seu historico.
trocar(
    pagar,
    '''    status_anterior = conta.status

    campos = dados.model_dump(''',
    '''    # CUIDARE_INTEGRIDADE_FINANCEIRA_V1
    if conta.status == "pago" or Decimal(str(conta.valor_pago or 0)) > 0:
        raise HTTPException(
            status_code=409,
            detail="Despesa com pagamento registrado nao pode ser editada. Corrija por rotina de estorno."
        )

    status_anterior = conta.status

    campos = dados.model_dump('''
)
trocar(
    pagar,
    '''    conta.ativo = False

    db.commit()

    return {
        "status": "ok",
        "message": "Conta a pagar desativada com sucesso.",''',
    '''    # CUIDARE_INTEGRIDADE_FINANCEIRA_V1
    if conta.status == "pago" or Decimal(str(conta.valor_pago or 0)) > 0:
        raise HTTPException(
            status_code=409,
            detail="Despesa paga nao pode ser excluida: o movimento integra o Caixa."
        )

    conta.ativo = False

    db.commit()

    return {
        "status": "ok",
        "message": "Conta a pagar desativada com sucesso.",'''
)

# Um botao real e funcional entre Financeiro e Caixa.
trocar(
    app,
    '''      <Financeiro
        onVoltar={() => setCurrentPage("dashboard")}
      />''',
    '''      <Financeiro
        onVoltar={() => setCurrentPage("dashboard")}
        onAbrirCaixa={() => setCurrentPage("caixa")} // CUIDARE_INTEGRIDADE_FINANCEIRA_V1
      />'''
)
trocar(
    pagina,
    "function Financeiro({ onVoltar }) {",
    "function Financeiro({ onVoltar, onAbrirCaixa }) { // CUIDARE_INTEGRIDADE_FINANCEIRA_V1"
)
trocar(
    pagina,
    '''          <button
            type="button"
            className="financeiro-secondary-button"
            onClick={onVoltar}
          >
            Voltar
          </button>''',
    '''          <button
            type="button"
            className="financeiro-secondary-button"
            onClick={onVoltar}
          >
            Voltar
          </button>

          <button
            type="button"
            className="financeiro-secondary-button"
            onClick={onAbrirCaixa}
          >
            Ir ao Caixa →
          </button>'''
)
trocar(
    pagina,
    '''                      <option value="pago">
                        Pago
                      </option>''',
    '''                      {aba === "pagar" && (
                        <option value="pago">Pago</option>
                      )}'''
)
# Evita exibir operacoes que a API recusara sobre contas recebidas
# ou parcelas vinculadas a contratos Pilates.
trocar(
    pagina,
    '''                    const status =
                      calcularStatus(
                        conta
                      );

                    return (''',
    '''                    const status =
                      calcularStatus(
                        conta
                      );

                    const protegido =
                      (aba === "receber" && (
                        conta.status === "pago" ||
                        Number(conta.valor_pago || 0) > 0 ||
                        (
                          conta.categoria === "Pilates" &&
                          /Matrícula\\s*#\\d+/i.test(conta.descricao || "")
                        )
                      )) ||
                      (aba === "pagar" && (
                        conta.status === "pago" ||
                        Number(conta.valor_pago || 0) > 0
                      ));

                    return ('''
)
trocar(
    pagina,
    '''                            <button
                              type="button"
                              className="financeiro-acao-editar"
                              onClick={() =>
                                editarLancamento(
                                  conta
                                )
                              }
                            >
                              Editar
                            </button>''',
    '''                            {!protegido && (
                              <button
                                type="button"
                                className="financeiro-acao-editar"
                                onClick={() => editarLancamento(conta)}
                              >
                                Editar
                              </button>
                            )}'''
)
trocar(
    pagina,
    '''                            <button
                              type="button"
                              className="financeiro-acao-excluir"
                              onClick={() =>
                                excluirLancamento(
                                  conta
                                )
                              }
                            >
                              Excluir
                            </button>''',
    '''                            {!protegido && (
                              <button
                                type="button"
                                className="financeiro-acao-excluir"
                                onClick={() => excluirLancamento(conta)}
                              >
                                Excluir
                              </button>
                            )}'''
)

for arquivo, codigo in textos.items():
    if arquivo.suffix == ".py":
        compile(codigo, str(arquivo), "exec")

# Todos os pontos foram localizados: a escrita so comeca agora.
for arquivo, codigo in textos.items():
    arquivo.write_text(codigo)

print("✅ Protegidas cobranças de Pilates, receitas recebidas e despesas pagas.")
print("✅ Contas recebidas nao podem ser editadas ou desativadas pela API.")
print("✅ Receita manual deve ser recebida pela acao Receber, com recibo e Caixa.")
print("✅ Botao Ir ao Caixa incluido no Financeiro.")
print("✅ Nao alteramos nenhum registro do banco nem o calculo de saldos.")
print("Reinicie o backend e execute: cd cuidare && npm run build")
