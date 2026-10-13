"""Filtro de vencimentos por dia no Financeiro do Cuidare; nenhuma alteração no backend."""
from pathlib import Path

raiz = Path.cwd()
jsx_file = raiz / "cuidare/src/pages/Financeiro.jsx"
css_file = raiz / "cuidare/src/pages/Financeiro.css"
if not jsx_file.is_file() or not css_file.is_file():
    raise SystemExit("Execute em /workspaces/cuidare.")

jsx = jsx_file.read_text()
css = css_file.read_text()
marker = "CUIDARE_VENCIMENTOS_DIARIOS_V1"

if marker in jsx and marker in css:
    print("✅ Filtros de vencimento já instalados.")
    raise SystemExit(0)
if marker in jsx or marker in css:
    raise SystemExit("⚠️ Instalação parcial detectada. Nada foi alterado.")

def trocar(antigo, novo):
    global jsx
    n = jsx.count(antigo)
    if n != 1:
        raise SystemExit(
            f"⚠️ Estrutura diferente no Financeiro ({n} trechos encontrados). "
            "Nenhum arquivo foi alterado. Envie o erro para ajuste.\n"
            f"Trecho: {antigo[:90]!r}"
        )
    jsx = jsx.replace(antigo, novo, 1)


trocar(
    "function Financeiro({ onVoltar }) {",
    '''// CUIDARE_VENCIMENTOS_DIARIOS_V1
function dataLocalFinanceiro() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return [ano, mes, dia].join("-");
}

function Financeiro({ onVoltar }) {'''
)

trocar(
    '  const [filtroCategoria, setFiltroCategoria] = useState("");',
    '''  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroVencimento, setFiltroVencimento] = useState("todos");
  const [dataVencimento, setDataVencimento] = useState(dataLocalFinanceiro);'''
)

trocar(
    '''  function trocarAba(novaAba) {
    setAba(novaAba);
    setFiltroStatus("todos");
    setFiltroCategoria("");''',
    '''  function trocarAba(novaAba) {
    setAba(novaAba);
    setFiltroStatus("todos");
    setFiltroCategoria("");
    setFiltroVencimento("todos");'''
)

trocar(
    '''      return passouStatus && passouCategoria;''',
    '''      const hoje = dataLocalFinanceiro();
      const passouVencimento =
        filtroVencimento === "todos" ||
        (filtroVencimento === "hoje" && conta.vencimento === hoje) ||
        (filtroVencimento === "data" &&
          Boolean(dataVencimento) &&
          conta.vencimento === dataVencimento) ||
        (filtroVencimento === "atrasados" &&
          Boolean(conta.vencimento) &&
          conta.vencimento < hoje &&
          status !== "pago" &&
          status !== "cancelado");

      return passouStatus && passouCategoria && passouVencimento;'''
)

trocar(
    '''    listaAtual,
    filtroStatus,
    filtroCategoria,
''',
    '''    listaAtual,
    filtroStatus,
    filtroCategoria,
    filtroVencimento,
    dataVencimento,
'''
)

trocar(
    '''              setFiltroStatus("todos");
              setFiltroCategoria("");
            }}
          >
            Limpar filtros''',
    '''              setFiltroStatus("todos");
              setFiltroCategoria("");
              setFiltroVencimento("todos");
            }}
          >
            Limpar filtros'''
)

trocar(
    '''        <div className="financeiro-filtros">''',
    '''        <div className="financeiro-vencimento-bar">
          <div className="financeiro-vencimento-titulo">
            <strong>
              {aba === "receber" ? "Cobranças por vencimento" : "Despesas por vencimento"}
            </strong>
            <span>Encontre rapidamente o que vence em cada dia.</span>
          </div>

          <div className="financeiro-vencimento-opcoes">
            <button
              type="button"
              className={filtroVencimento === "todos" ? "ativo" : ""}
              aria-pressed={filtroVencimento === "todos"}
              onClick={() => setFiltroVencimento("todos")}
            >
              Todas as datas
            </button>
            <button
              type="button"
              className={filtroVencimento === "hoje" ? "ativo" : ""}
              aria-pressed={filtroVencimento === "hoje"}
              onClick={() => setFiltroVencimento("hoje")}
            >
              Vencem hoje
            </button>
            <button
              type="button"
              className={filtroVencimento === "atrasados" ? "ativo" : ""}
              aria-pressed={filtroVencimento === "atrasados"}
              onClick={() => setFiltroVencimento("atrasados")}
            >
              Em atraso
            </button>
            <label className="financeiro-vencimento-data">
              Escolher data
              <input
                type="date"
                value={dataVencimento}
                onChange={(event) => {
                  setDataVencimento(event.target.value);
                  setFiltroVencimento(event.target.value ? "data" : "todos");
                }}
                onClick={() => {
                  if (dataVencimento) setFiltroVencimento("data");
                }}
              />
            </label>
          </div>

          {filtroVencimento !== "todos" && (
            <div className="financeiro-vencimento-resumo" aria-live="polite">
              <span>{listaFiltrada.length} lançamento(s) no filtro</span>
              <strong>
                Saldo em aberto: {formatarMoeda(
                  listaFiltrada.reduce((total, conta) => {
                    const status = calcularStatus(conta);
                    if (status === "pago" || status === "cancelado") return total;
                    return total + Math.max(
                      0,
                      Number(conta.valor || 0) - Number(conta.valor_pago || 0)
                    );
                  }, 0)
                )}
              </strong>
            </div>
          )}
        </div>

        <div className="financeiro-filtros">'''
)

css += """

/* CUIDARE_VENCIMENTOS_DIARIOS_V1 */
.financeiro-vencimento-bar {
  padding: 17px 18px;
  margin: 0 0 18px;
  border: 1px solid #dce7df;
  border-radius: 13px;
  background: #f6faf7;
}
.financeiro-vencimento-titulo {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 5px 13px;
  margin-bottom: 13px;
}
.financeiro-vencimento-titulo strong {
  color: #0e4334;
  font-size: 16px;
}
.financeiro-vencimento-titulo span {
  color: #64776c;
  font-size: 13px;
}
.financeiro-vencimento-opcoes {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 9px;
}
.financeiro-vencimento-opcoes > button {
  border: 1px solid #cadbd0;
  border-radius: 9px;
  background: #fff;
  padding: 11px 14px;
  color: #194c3a;
  font-weight: 650;
  min-height: 43px;
  cursor: pointer;
}
.financeiro-vencimento-opcoes > button.ativo {
  background: #0e4334;
  color: #fff;
  border-color: #0e4334;
}
.financeiro-vencimento-opcoes button:focus-visible,
.financeiro-vencimento-data input:focus-visible {
  outline: 2px solid #c29b47;
  outline-offset: 2px;
}
.financeiro-vencimento-data {
  display: flex;
  flex-direction: column;
  min-width: 170px;
  gap: 5px;
  color: #194c3a;
  font-size: 12px;
  font-weight: 650;
}
.financeiro-vencimento-data input {
  height: 43px;
  min-width: 0;
  padding: 8px 11px;
  border: 1px solid #cadbd0;
  border-radius: 9px;
  color: #194c3a;
  background: #fff;
  font-size: 14px;
}
.financeiro-vencimento-resumo {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 16px;
  margin-top: 13px;
  padding-top: 12px;
  border-top: 1px solid #e0e9e2;
  color: #556c5e;
  font-size: 13px;
}
.financeiro-vencimento-resumo strong {
  color: #0e4334;
  font-size: 14px;
}
@media (max-width: 560px) {
  .financeiro-vencimento-opcoes > button { flex: 1; }
  .financeiro-vencimento-data { width: 100%; }
}
"""

# Todos os anchors foram verificados acima. Escrever somente agora.
jsx_file.write_text(jsx)
css_file.write_text(css)

print("✅ Filtros de vencimento adicionados em Cobranças e Despesas.")
print("✅ Botões: Todas as datas, Vencem hoje, Em atraso, Escolher data.")
print("✅ Mostra quantidade e saldo ainda não recebido/pago no período.")
print("✅ Continua compatível com busca e agrupamento por aluno.")
print("✅ Não altera pagamentos, saldos gravados, banco nem Caixa.")
print("Execute: cd cuidare && npm run build")
