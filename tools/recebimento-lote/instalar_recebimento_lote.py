"""Instala recebimento transacional de varias parcelas de Pilates no Cuidare."""
from pathlib import Path
from urllib.request import urlopen

root = Path.cwd()
main = root / "backend/app/main.py"
financeiro = root / "cuidare/src/pages/Financeiro.jsx"
api = root / "backend/app/routers/recebimento_lote.py"
comp = root / "cuidare/src/components/RecebimentoLotePilates.jsx"
css = root / "cuidare/src/components/RecebimentoLotePilates.css"

marca = "CUIDARE_RECEBIMENTO_LOTE_V1"
for path in (main, financeiro):
    if not path.is_file():
        raise SystemExit("Arquivo obrigatorio nao encontrado: " + str(path))
for path in (api, comp, css):
    if path.exists():
        raise SystemExit("Arquivo ja existe: " + str(path) + ". Nada foi sobrescrito.")

arquivos = {main: main.read_text(), financeiro: financeiro.read_text()}
if any(marca in texto for texto in arquivos.values()):
    raise SystemExit("Integracao de recebimento em lote ja detectada. Nada alterado.")

if "CUIDARE_ALUNOS_FINANCEIRO_V1" not in arquivos[financeiro]:
    raise SystemExit("Visualizacao Financeiro por aluno nao encontrada. Nada alterado.")
if "CUIDARE_INTEGRIDADE_FINANCEIRA_V1" not in arquivos[financeiro]:
    raise SystemExit("Protecao financeira anterior nao encontrada. Nada alterado.")
if not (root / "backend/app/models/parcela_plano_pilates.py").is_file():
    raise SystemExit("Tabela vinculadora de parcelas de Pilates nao encontrada. Nada alterado.")

base = (
    "https://raw.githubusercontent.com/daison-alt/cuidare/"
    "2b5bdbfb2aa64254a245da35ccfc0de5e597bc62/tools/recebimento-lote/"
)

try:
    api_text = urlopen(base + "recebimento_lote.py", timeout=30).read().decode("utf-8")
    comp_text = urlopen(base + "RecebimentoLotePilates.jsx", timeout=30).read().decode("utf-8")
    css_text = urlopen(base + "RecebimentoLotePilates.css", timeout=30).read().decode("utf-8")
except Exception as e:
    raise SystemExit("Falha ao obter os arquivos da integracao. Nenhum arquivo alterado: " + str(e))

compile(api_text, str(api), "exec")


def trocar(arquivo, antes, depois):
    texto = arquivos[arquivo]
    n = texto.count(antes)
    if n != 1:
        raise SystemExit(
            f"Estrutura diferente em {arquivo.name} ({n} ocorrencias) para "
            + repr(antes[:90]) + ". Nenhum arquivo alterado."
        )
    arquivos[arquivo] = texto.replace(antes, depois, 1)


trocar(
    main,
    "from app.routers.recebimentos_conta import router as recebimentos_conta_router",
    "from app.routers.recebimentos_conta import router as recebimentos_conta_router\n"
    "from app.routers.recebimento_lote import router as recebimento_lote_router  # " + marca,
)
trocar(
    main,
    "app.include_router(recebimentos_conta_router)\n",
    "app.include_router(recebimentos_conta_router)\n"
    "app.include_router(recebimento_lote_router)\n",
)

trocar(
    financeiro,
    'import "./Financeiro.css";',
    'import "./Financeiro.css";\n'
    'import RecebimentoLotePilates from "../components/RecebimentoLotePilates"; // ' + marca,
)
trocar(
    financeiro,
    '  const [pagamentoModal, setPagamentoModal] = useState(null);',
    '''  const [pagamentoModal, setPagamentoModal] = useState(null);
  const [recebimentoMultiplo, setRecebimentoMultiplo] = useState(null);'''
)

# O botao aparece apenas quando um aluno com duas ou mais parcelas em aberto esta selecionado.
inicio_render = arquivos[financeiro].find('  function renderLista() {')
fim_render = arquivos[financeiro].find('\n  return (\n    <div className="financeiro-page">', inicio_render)
if inicio_render < 0 or fim_render < 0:
    raise SystemExit("Funcao renderLista() nao localizada. Nenhuma alteracao.")
trecho_render = arquivos[financeiro][inicio_render:fim_render]
ancora = '          <div className="financeiro-por-aluno-controles">'
if trecho_render.count(ancora) != 1:
    raise SystemExit("Barra Por aluno nao localizada. Nenhuma alteracao.")

botao = '''          {aba === "receber" && visaoCobrancas === "alunos" &&
            alunoSelecionadoId !== null && alunoSelecionadoId !== "sem-aluno" &&
            contasReceber.filter((conta) =>
              String(conta.paciente_id) === String(alunoSelecionadoId) &&
              conta.categoria === "Pilates" &&
              /Parcela\\s+\\d+\\/\\d+/i.test(conta.descricao || "") &&
              conta.ativo !== false &&
              !["pago", "cancelado"].includes(conta.status) &&
              Number(conta.valor || 0) - Number(conta.valor_pago || 0) > 0
            ).length >= 2 && (
              <div className="financeiro-lote-acesso">
                <button type="button" onClick={() =>
                  setRecebimentoMultiplo({
                    pacienteId: Number(alunoSelecionadoId),
                    nome: nomeAlunoPorId(alunoSelecionadoId),
                  })
                }>
                  Receber várias parcelas
                </button>
                <small>Selecione parcelas e registre um único pagamento.</small>
              </div>
            )}

'''
trecho_render = trecho_render.replace(ancora, botao + ancora, 1)
arquivos[financeiro] = (
    arquivos[financeiro][:inicio_render] + trecho_render + arquivos[financeiro][fim_render:]
)

trocar(
    financeiro,
    '      {pagamentoModal && (',
    '''      {recebimentoMultiplo && (
        <RecebimentoLotePilates
          pacienteId={recebimentoMultiplo.pacienteId}
          nomePaciente={recebimentoMultiplo.nome}
          contas={contasReceber}
          onFechar={() => setRecebimentoMultiplo(null)}
          onConfirmado={carregarContas}
        />
      )}

      {pagamentoModal && (''',
)

# Todos os trechos foram validados. Inserir estilos sem modificar o resto.
fin_css = root / "cuidare/src/pages/Financeiro.css"
if not fin_css.is_file():
    raise SystemExit("Financeiro.css nao encontrado. Nenhum arquivo alterado.")
css_fin_atual = fin_css.read_text()
if marca in css_fin_atual:
    raise SystemExit("Estilos ja instalados. Nenhum arquivo alterado.")

css_fin_extra = """
/* CUIDARE_RECEBIMENTO_LOTE_V1 */
.financeiro-lote-acesso {
  display: flex; flex-direction: column; gap: 6px; align-items: flex-start;
  margin: 10px 0 18px; padding: 15px;
  background: #f1f7f2; border: 1px solid #d7e6da; border-radius: 11px;
}
.financeiro-lote-acesso button {
  padding: 12px 18px; background: #0e4334; color: white;
  border: 1px solid #0e4334; border-radius: 9px;
  font-weight: 700; font-size: 14px; cursor: pointer;
}
.financeiro-lote-acesso button:hover { background: #135d48; }
.financeiro-lote-acesso small { color: #607369; font-size: 12px; }
"""

for arquivo, texto in arquivos.items():
    if arquivo.suffix == ".py":
        compile(texto, str(arquivo), "exec")

api.parent.mkdir(parents=True, exist_ok=True)
comp.parent.mkdir(parents=True, exist_ok=True)
api.write_text(api_text)
comp.write_text(comp_text)
css.write_text(css_text)
for arquivo, texto in arquivos.items():
    arquivo.write_text(texto)
fin_css.write_text(css_fin_atual + css_fin_extra)

print("✅ Recebimento multiplo de parcelas de Pilates instalado.")
print("✅ Cada parcela gera seu recibo e movimentacao no Caixa.")
print("✅ Todas as parcelas sao gravadas em uma unica transacao.")
print("✅ Pagamentos mistos e saldos parciais suportados.")
print("✅ O botao fica na consulta Cobranças > Por aluno.")
print("✅ Nenhuma alteracao nos dados ou nas cobrancas ja existentes.")
print("Reinicie a API e depois execute: cd cuidare && npm run build")
