"""Cuidare: atalhos do Dashboard para cobranças e despesas filtradas."""
from pathlib import Path
import re

raiz = Path.cwd()
app_file = raiz / "cuidare/src/App.jsx"
financeiro_file = raiz / "cuidare/src/pages/Financeiro.jsx"
css_file = raiz / "cuidare/src/App.css"
financeiro_css_file = raiz / "cuidare/src/pages/Financeiro.css"
arquivos = (app_file, financeiro_file, css_file, financeiro_css_file)
for arquivo in arquivos:
    if not arquivo.is_file():
        raise SystemExit("Arquivo não encontrado: " + str(arquivo))

dados = {arquivo: arquivo.read_text() for arquivo in arquivos}
marcador = "CUIDARE_ATALHOS_DASHBOARD_V1"
if all(marcador in dados[a] for a in arquivos):
    print("✅ Atalhos do Dashboard já instalados.")
    raise SystemExit(0)
if any(marcador in dados[a] for a in arquivos):
    raise SystemExit("Instalação parcial identificada. Nada foi alterado.")

if "CUIDARE_DASHBOARD_FINANCEIRO_V1" not in dados[app_file]:
    raise SystemExit("Painel Vencimentos e pendências não encontrado. Nada foi alterado.")
if "CUIDARE_ALUNOS_FINANCEIRO_V1" not in dados[financeiro_file]:
    raise SystemExit("Visualização por aluno não encontrada. Nada foi alterado.")
if "CUIDARE_VENCIMENTOS_DIARIOS_V1" not in dados[financeiro_file]:
    raise SystemExit("Filtro de vencimento não encontrado. Nada foi alterado.")

def trocar(arquivo, antes, depois):
    origem = dados[arquivo]
    total = origem.count(antes)
    if total != 1:
        raise SystemExit(
            f"Estrutura diferente em {arquivo.name}: "
            f"{total} ocorrências de {antes[:90]!r}. Nenhuma alteração."
        )
    dados[arquivo] = origem.replace(antes, depois, 1)


# 1) Navegação com filtro como parâmetro real para o Financeiro.
trocar(
    app_file,
    '  const [currentPage, setCurrentPage] = useState("dashboard");',
    '''  const [currentPage, setCurrentPage] = useState("dashboard");
  // CUIDARE_ATALHOS_DASHBOARD_V1
  const [atalhoFinanceiro, setAtalhoFinanceiro] = useState(null);'''
)

trocar(
    app_file,
    '  function handleLogin(usuario) {',
    '''  function abrirFinanceiroComFiltro(aba, vencimento = "todos", contaId = null) {
    setAtalhoFinanceiro({ aba, vencimento, contaId });
    setCurrentPage("financeiro");
  }

  function handleLogin(usuario) {'''
)

# Encontra o componente real pelo JSX, sem depender do formato da rota
# (a navegação pode ter sido alterada depois das últimas instalações).
origem = dados[app_file]
ocorrencias = list(re.finditer(r"<Financeiro\b", origem))
if len(ocorrencias) != 1:
    raise SystemExit(
        f"Não consegui identificar o componente Financeiro ({len(ocorrencias)} ocorrências). "
        "Nenhum arquivo alterado."
    )
inicio_financeiro = ocorrencias[0].start()
fim_financeiro = origem.find("/>", inicio_financeiro)
if fim_financeiro == -1 or fim_financeiro - inicio_financeiro > 1000:
    raise SystemExit("Tag Financeiro não localizada com segurança. Nenhum arquivo alterado.")
if "atalhoDashboard=" in origem[inicio_financeiro:fim_financeiro]:
    raise SystemExit("O atalho do Financeiro já existe. Nenhum arquivo alterado.")

dados[app_file] = (
    origem[:fim_financeiro]
    + "        atalhoDashboard={atalhoFinanceiro}\n      "
    + origem[fim_financeiro:]
)

# Menu Financeiro geral não conserva um filtro antigo.
trocar(
    app_file,
    '''onClick={() => setCurrentPage("financeiro")}
          >
            Financeiro''',
    '''onClick={() => {
              setAtalhoFinanceiro(null);
              setCurrentPage("financeiro");
            }}
          >
            Financeiro'''
)

# Acesso "Ver no Financeiro" também leva à visão geral.
trocar(
    app_file,
    '''<button type="button" onClick={() => setCurrentPage("financeiro")}>
                  Ver no Financeiro →''',
    '''<button type="button" onClick={() => {
                  setAtalhoFinanceiro(null);
                  setCurrentPage("financeiro");
                }}>
                  Ver no Financeiro →'''
)

# 2) Os quatro cartões deixam de ser apenas informativos.
cartoes = (
    ("Receber hoje", "receber", "hoje"),
    ("Pagar hoje", "pagar", "hoje"),
    ("Recebimentos em atraso", "receber", "atrasados"),
    ("Despesas em atraso", "pagar", "atrasados"),
)
for rotulo, aba, prazo in cartoes:
    app = dados[app_file]
    referencia = "<span>" + rotulo + "</span>"
    if app.count(referencia) != 1:
        raise SystemExit(f"Cartão não localizado exatamente uma vez: {rotulo}")
    indice = app.index(referencia)
    abertura = app.rfind("<div", 0, indice)
    if abertura == -1:
        raise SystemExit("Não encontrei a tag de abertura do cartão " + rotulo)
    fim_abertura = app.find(">", abertura)
    tag = app[abertura:fim_abertura + 1]
    if "className=" in tag and "dashboard-financeiro-atencao" not in tag:
        raise SystemExit("Classe do cartão desconhecida: " + rotulo)
    if app[indice:fim_abertura].count("<div") != 0:
        raise SystemExit("Cartão com estrutura inesperada: " + rotulo)
    fecho = app.find("</div>", indice)
    if fecho == -1 or fecho - indice > 500:
        raise SystemExit("Não encontrei fechamento do cartão: " + rotulo)
    css_extra = (
        ' + (receitasAtrasadas.length ? " dashboard-financeiro-atencao" : "")'
        if rotulo == "Recebimentos em atraso" else
        ' + (despesasAtrasadas.length ? " dashboard-financeiro-atencao" : "")'
        if rotulo == "Despesas em atraso" else ""
    )
    nova_tag = (
        '<button type="button"\n'
        '                      className={"dashboard-financeiro-cartao-atalho"' + css_extra + '}\n'
        '                      onClick={() => abrirFinanceiroComFiltro("' + aba + '", "' + prazo + '")}\n'
        '                      aria-label="Consultar ' + rotulo.lower() + ' no Financeiro">'
    )
    app = app[:abertura] + nova_tag + app[fim_abertura + 1:]
    # Reencontrar fechamento após alteração do tamanho da tag.
    indice = app.index(referencia)
    fecho = app.find("</div>", indice)
    app = app[:fecho] + "</button>" + app[fecho + len("</div>"):]
    dados[app_file] = app

# 3) Clicar na linha da pendência abre aquela conta específica.
trocar(
    app_file,
    '''<div className="dashboard-financeiro-item"
                          key={item.tipo + "-" + item.id}>''',
    '''<button type="button" className="dashboard-financeiro-item dashboard-financeiro-item-atalho"
                          key={item.tipo + "-" + item.id}
                          onClick={() => abrirFinanceiroComFiltro(
                            item.tipo === "Receber" ? "receber" : "pagar",
                            item.atrasado ? "atrasados" : "hoje",
                            item.id
                          )}
                          title="Abrir este lançamento no Financeiro">'''
)
trocar(
    app_file,
    '''<b>{formatarDinheiroDashboard(saldoPendenteDashboard(item))}</b>
                        </div>''',
    '''<b>{formatarDinheiroDashboard(saldoPendenteDashboard(item))}</b>
                        </button>'''
)

# 4) A página financeira recebe os parâmetros sem mudar seus filtros normais.
financeiro = dados[financeiro_file]
assinatura = re.search(r'function Financeiro\(\{\s*([^}]+)\s*\}\)', financeiro)
if not assinatura or financeiro.count("function Financeiro(") != 1:
    raise SystemExit("Assinatura do Financeiro incompatível. Nenhuma alteração.")
assinatura_nova = assinatura.group(0).replace("})", ", atalhoDashboard })")
dados[financeiro_file] = (
    financeiro[:assinatura.start()] + assinatura_nova +
    financeiro[assinatura.end():]
)

trocar(
    financeiro_file,
    '  const [aba, setAba] = useState("visao-geral");',
    '''  const [aba, setAba] = useState(() => atalhoDashboard?.aba || "visao-geral");
  // CUIDARE_ATALHOS_DASHBOARD_V1
  const [contaEmFoco, setContaEmFoco] = useState(() => atalhoDashboard?.contaId ?? null);'''
)
trocar(
    financeiro_file,
    '  const [filtroVencimento, setFiltroVencimento] = useState("todos");',
    '  const [filtroVencimento, setFiltroVencimento] = useState(() => atalhoDashboard?.vencimento || "todos");'
)
trocar(
    financeiro_file,
    '  const [visaoCobrancas, setVisaoCobrancas] = useState("alunos");',
    '''  const [visaoCobrancas, setVisaoCobrancas] = useState(
    () => atalhoDashboard?.aba === "receber" ? "todas" : "alunos"
  );'''
)
# Quando usuário alterna as abas, o foco anterior deixa de ser válido.
trocar(
    financeiro_file,
    '''  function trocarAba(novaAba) {
    setAba(novaAba);''',
    '''  function trocarAba(novaAba) {
    setAba(novaAba);
    setContaEmFoco(null);'''
)

# Limitar somente a tabela final para abrir o lançamento clicado.
financeiro = dados[financeiro_file]
ini = financeiro.find('  function renderLista() {')
fim = financeiro.find('\n  return (\n    <div className="financeiro-page">', ini)
if ini == -1 or fim == -1:
    raise SystemExit("Não localizei renderLista() completo. Nada foi alterado.")
funcao = financeiro[ini:fim]
if funcao.count("    return (") == 0 or funcao.count("listaFiltrada.map(") != 1:
    raise SystemExit("Renderização das cobranças diferente do esperado. Nada foi alterado.")
funcao = funcao.replace(
    '  function renderLista() {',
    '''  function renderLista() {
    const listaDetalhada = contaEmFoco == null
      ? listaFiltrada
      : listaFiltrada.filter((conta) => String(conta.id) === String(contaEmFoco));''',
    1
)
funcao = funcao.replace("listaFiltrada.length", "listaDetalhada.length")
funcao = funcao.replace("listaFiltrada.map(", "listaDetalhada.map(")
# Inserir aviso acima dos filtros. "Ver todas" restaura a lista por vencimento.
anchor = '        <div className="financeiro-filtros">'
if funcao.count(anchor) != 1:
    raise SystemExit("Barra de filtros não localizada. Nada foi alterado.")
funcao = funcao.replace(
    anchor,
    '''        {contaEmFoco != null && (
          <div className="financeiro-foco-lancamento">
            <strong>Visualizando lançamento #{contaEmFoco}</strong>
            <button type="button" onClick={() => setContaEmFoco(null)}>
              ← Ver todos deste período
            </button>
          </div>
        )}

''' + anchor, 1
)
dados[financeiro_file] = financeiro[:ini] + funcao + financeiro[fim:]

dados[css_file] += '''

/* CUIDARE_ATALHOS_DASHBOARD_V1 — cartões clicáveis */
.dashboard-financeiro-resumos > .dashboard-financeiro-cartao-atalho {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
  padding: 16px;
  border: 1px solid #e2eae4;
  border-radius: 12px;
  background: #f7faf8;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: border-color .15s, transform .15s, box-shadow .15s;
}
.dashboard-financeiro-resumos > .dashboard-financeiro-cartao-atalho:hover {
  border-color: #c29b47;
  box-shadow: 0 5px 14px rgba(14,67,52,.12);
  transform: translateY(-2px);
}
.dashboard-financeiro-resumos .dashboard-financeiro-cartao-atalho.dashboard-financeiro-atencao {
  border-color: #edcfb4;
  background: #fff8ee;
}
.dashboard-financeiro-cartao-atalho span { color: #536a5f; font-size: 13px; }
.dashboard-financeiro-cartao-atalho strong {
  color: #104632;
  font-size: clamp(17px,1.6vw,23px);
  overflow-wrap: anywhere;
}
.dashboard-financeiro-cartao-atalho small { color: #758279; font-size: 12px; }
.dashboard-financeiro-cartao-atalho.dashboard-financeiro-atencao strong { color: #98542a; }
.dashboard-financeiro-item-atalho {
  width: 100%;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #edf1eb;
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.dashboard-financeiro-item-atalho:hover { background: #f7faf8; }
.dashboard-financeiro-item-atalho:focus-visible,
.dashboard-financeiro-cartao-atalho:focus-visible {
  outline: 3px solid #c29b47;
  outline-offset: 2px;
}
'''
dados[financeiro_css_file] += '''

/* CUIDARE_ATALHOS_DASHBOARD_V1 — lançamento aberto a partir do Dashboard */
.financeiro-foco-lancamento {
  margin: 12px 0;
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  border-radius: 11px;
  background: #f0f6f0;
  border: 1px solid #d4e5d8;
  color: #0e4334;
}
.financeiro-foco-lancamento button {
  cursor: pointer;
  padding: 9px 12px;
  border: 1px solid #d1dfd5;
  border-radius: 8px;
  background: #fff;
  color: #0e4334;
}
'''

for p, texto in dados.items():
    if p.suffix == ".py":
        compile(texto, str(p), "exec")

# Escrita apenas após conferir todos os trechos.
for p, texto in dados.items():
    p.write_text(texto)
print("✅ Quatro cartões agora são atalhos clicáveis para os filtros do Financeiro.")
print("✅ Cada pendência prioritária abre exatamente a sua cobrança/despesa.")
print("✅ Botão para voltar à lista do período.")
print("✅ Botões de pagamento e recebimento existentes preservados.")
print("✅ Nenhum dado financeiro ou movimentação no Caixa foi alterado.")
print("Execute: cd cuidare && npm run build")
