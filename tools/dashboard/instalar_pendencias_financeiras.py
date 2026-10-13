"""Mostra vencimentos reais e atrasos no Dashboard do Cuidare (somente leitura)."""
from pathlib import Path

root = Path.cwd()
app_path = root / "cuidare/src/App.jsx"
css_path = root / "cuidare/src/App.css"
marca = "CUIDARE_DASHBOARD_FINANCEIRO_V1"

if not app_path.is_file() or not css_path.is_file():
    raise SystemExit("Execute na pasta /workspaces/cuidare.")

app = app_path.read_text()
css = css_path.read_text()
if marca in app and marca in css:
    print("✅ Painel financeiro do Dashboard já instalado.")
    raise SystemExit(0)
if marca in app or marca in css:
    raise SystemExit("Instalação parcial identificada. Não fiz novas alterações.")

def trocar(antigo, novo):
    global app
    n = app.count(antigo)
    if n != 1:
        raise SystemExit(
            f"Trecho diferente do esperado em App.jsx ({n} ocorrências): "
            + repr(antigo[:100]) + ". Nenhum arquivo foi modificado."
        )
    app = app.replace(antigo, novo, 1)

trocar(
    '''function App() {''',
    '''// CUIDARE_DASHBOARD_FINANCEIRO_V1
function saldoPendenteDashboard(conta) {
  if (!conta || conta.ativo === false || ["cancelado", "pago"].includes(conta.status)) {
    return 0;
  }
  return Math.max(0, Math.round(
    (Number(conta.valor || 0) - Number(conta.valor_pago || 0)) * 100
  ) / 100);
}

function formatarDinheiroDashboard(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function App() {'''
)

trocar(
    '''  const [logoCuidare, setLogoCuidare] = useState(null);''',
    '''  const [financeiroDashboard, setFinanceiroDashboard] = useState({
    receber: [],
    pagar: [],
    carregando: true,
    erro: "",
  });

  const [logoCuidare, setLogoCuidare] = useState(null);'''
)

trocar(
    '''  function handleLogin(usuario) {''',
    '''  // CUIDARE_DASHBOARD_FINANCEIRO_V1
  const podeVerFinanceiroDashboard = [
    "administrador", "secretaria", "recepcao", "recepção",
  ].includes(String(usuarioLogado?.perfil || "").trim().toLocaleLowerCase("pt-BR"));

  useEffect(() => {
    if (!usuarioLogado || currentPage !== "dashboard" || !podeVerFinanceiroDashboard) {
      return;
    }

    const controller = new AbortController();
    setFinanceiroDashboard((atual) => ({
      ...atual, carregando: true, erro: "",
    }));

    async function consultarFinanceiro() {
      try {
        const [receberRes, pagarRes] = await Promise.all([
          fetch(API_URL + "/contas-receber", { signal: controller.signal }),
          fetch(API_URL + "/contas-pagar", { signal: controller.signal }),
        ]);
        if (!receberRes.ok || !pagarRes.ok) {
          throw new Error("Os vencimentos não puderam ser consultados.");
        }
        const [receber, pagar] = await Promise.all([
          receberRes.json(), pagarRes.json(),
        ]);
        if (!controller.signal.aborted) {
          setFinanceiroDashboard({
            receber: Array.isArray(receber) ? receber : [],
            pagar: Array.isArray(pagar) ? pagar : [],
            carregando: false,
            erro: "",
          });
        }
      } catch (erro) {
        if (!controller.signal.aborted) {
          setFinanceiroDashboard((atual) => ({
            ...atual,
            carregando: false,
            erro: "Não foi possível consultar as pendências financeiras agora.",
          }));
        }
      }
    }

    consultarFinanceiro();
    return () => controller.abort();
  }, [usuarioLogado, currentPage, podeVerFinanceiroDashboard]);

  function handleLogin(usuario) {'''
)

# A constante hoje vem do relógio local, inclusive no Dashboard por turno.
trocar(
    '''  const pacientesAtivos = dashboardDados.pacientes.filter(''',
    '''  const receitasPendentes = financeiroDashboard.receber.filter(
    (conta) => saldoPendenteDashboard(conta) > 0
  );
  const despesasPendentes = financeiroDashboard.pagar.filter(
    (conta) => saldoPendenteDashboard(conta) > 0
  );

  const receitasHoje = receitasPendentes.filter((c) => c.vencimento === hoje);
  const despesasHoje = despesasPendentes.filter((c) => c.vencimento === hoje);
  const receitasAtrasadas = receitasPendentes.filter((c) => c.vencimento < hoje);
  const despesasAtrasadas = despesasPendentes.filter((c) => c.vencimento < hoje);

  function somaPendente(lista) {
    return lista.reduce((soma, conta) => soma + saldoPendenteDashboard(conta), 0);
  }

  const itensFinanceirosPrioritarios = [
    ...receitasAtrasadas.map((c) => ({ ...c, tipo: "Receber", atrasado: true })),
    ...despesasAtrasadas.map((c) => ({ ...c, tipo: "Pagar", atrasado: true })),
    ...receitasHoje.map((c) => ({ ...c, tipo: "Receber", atrasado: false })),
    ...despesasHoje.map((c) => ({ ...c, tipo: "Pagar", atrasado: false })),
  ].sort((a, b) =>
    String(a.vencimento).localeCompare(String(b.vencimento)) ||
    String(a.tipo).localeCompare(String(b.tipo))
  ).slice(0, 6);

  const pacientesAtivos = dashboardDados.pacientes.filter('''
)

# O cartao Contas pendentes pode ter sido alterado por outras melhorias.
# Localizar a tag <div className="stat-card"> pelo JSX real, sem exigir
# espacos, textos ou que o numero ainda seja um zero fixo.
import re

tags_div = re.finditer(r"</?div\b[^>]*>", app, re.I)
pilha_div = []
cartoes_pendentes = []

for match in tags_div:
    tag = match.group(0)
    if tag.lower().startswith("</div"):
        if not pilha_div:
            continue
        inicio_tag, abertura = pilha_div.pop()
        trecho = app[inicio_tag:match.end()]
        if (
            re.search(r'className\s*=\s*["\']stat-card["\']', abertura)
            and re.search(r"contas\s+pendentes", trecho, re.I)
        ):
            cartoes_pendentes.append((inicio_tag, match.end()))
    else:
        pilha_div.append((match.start(), tag))

if len(cartoes_pendentes) > 1:
    raise SystemExit(
        "Encontrei multiplos cartoes de contas pendentes. "
        "Nenhum arquivo foi alterado."
    )

if len(cartoes_pendentes) == 1:
    inicio_card, fim_card = cartoes_pendentes[0]
    espacos = app[app.rfind("\n", 0, inicio_card) + 1:inicio_card]
    novo_card = """{podeVerFinanceiroDashboard && (
  <div className="stat-card">
    <span>Contas pendentes</span>
    <strong>
      {financeiroDashboard.carregando
        ? "..."
        : receitasPendentes.length + despesasPendentes.length}
    </strong>
    <small>
      {financeiroDashboard.erro
        ? "Consulta indisponível"
        : "Cobranças e despesas em aberto"}
    </small>
  </div>
)}"""
    novo_card = "\n".join(
        espacos + linha if indice else linha
        for indice, linha in enumerate(novo_card.split("\n"))
    )
    app = app[:inicio_card] + novo_card + app[fim_card:]
    print("✅ Cartão Contas pendentes atualizado para dados reais.")
else:
    print(
        "ℹ️ O cartão Contas pendentes já foi removido ou renomeado; "
        "mantive os cartões atuais e acrescentei o painel de vencimentos."
    )

trocar(
    '''          <div className="content-grid">''',
    '''          {podeVerFinanceiroDashboard && (
            <section className="dashboard-financeiro-diario">
              <header className="dashboard-financeiro-topo">
                <div>
                  <span>FINANCEIRO DO DIA</span>
                  <h3>Vencimentos e pendências</h3>
                </div>
                <button type="button" onClick={() => setCurrentPage("financeiro")}>
                  Ver no Financeiro →
                </button>
              </header>

              {financeiroDashboard.carregando ? (
                <p className="dashboard-financeiro-mensagem">Consultando vencimentos...</p>
              ) : financeiroDashboard.erro ? (
                <p className="dashboard-financeiro-erro" role="status">
                  {financeiroDashboard.erro}
                </p>
              ) : (
                <>
                  <div className="dashboard-financeiro-resumos">
                    <div>
                      <span>Receber hoje</span>
                      <strong>{formatarDinheiroDashboard(somaPendente(receitasHoje))}</strong>
                      <small>{receitasHoje.length} cobrança(s)</small>
                    </div>
                    <div>
                      <span>Pagar hoje</span>
                      <strong>{formatarDinheiroDashboard(somaPendente(despesasHoje))}</strong>
                      <small>{despesasHoje.length} despesa(s)</small>
                    </div>
                    <div className={receitasAtrasadas.length ? "dashboard-financeiro-atencao" : ""}>
                      <span>Recebimentos em atraso</span>
                      <strong>{formatarDinheiroDashboard(somaPendente(receitasAtrasadas))}</strong>
                      <small>{receitasAtrasadas.length} cobrança(s)</small>
                    </div>
                    <div className={despesasAtrasadas.length ? "dashboard-financeiro-atencao" : ""}>
                      <span>Despesas em atraso</span>
                      <strong>{formatarDinheiroDashboard(somaPendente(despesasAtrasadas))}</strong>
                      <small>{despesasAtrasadas.length} despesa(s)</small>
                    </div>
                  </div>

                  {itensFinanceirosPrioritarios.length > 0 ? (
                    <div className="dashboard-financeiro-lista">
                      <strong className="dashboard-financeiro-lista-titulo">
                        Pendências prioritárias
                      </strong>
                      {itensFinanceirosPrioritarios.map((item) => (
                        <div className="dashboard-financeiro-item"
                          key={item.tipo + "-" + item.id}>
                          <span className={
                            item.atrasado
                              ? "dashboard-financeiro-tipo atrasado"
                              : "dashboard-financeiro-tipo"
                          }>
                            {item.atrasado ? "Atrasado · " : "Hoje · "}
                            {item.tipo}
                          </span>
                          <strong title={item.descricao}>{item.descricao}</strong>
                          <span>{item.vencimento?.split("-").reverse().join("/")}</span>
                          <b>{formatarDinheiroDashboard(saldoPendenteDashboard(item))}</b>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="dashboard-financeiro-mensagem">
                      Nenhuma cobrança ou despesa vencida ou vencendo hoje.
                    </p>
                  )}
                </>
              )}
            </section>
          )}

          <div className="content-grid">'''
)

css += """
/* CUIDARE_DASHBOARD_FINANCEIRO_V1 — Somente consulta financeira no Dashboard */
.dashboard-financeiro-diario {
  margin-top: 20px;
  padding: 22px;
  border: 1px solid #e4e4df;
  border-radius: 16px;
  background: #fff;
  color: #173f32;
  box-shadow: 0 3px 14px rgba(14, 67, 52, .04);
}
.dashboard-financeiro-topo {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap; margin-bottom: 18px;
}
.dashboard-financeiro-topo span {
  display: block; font-weight: 750; letter-spacing: .09em;
  color: #ba9140; font-size: 12px;
}
.dashboard-financeiro-topo h3 {
  font-size: 21px; color: #143f32; margin: 4px 0 0;
}
.dashboard-financeiro-topo button {
  padding: 10px 14px; background: #f3ebd8;
  color: #0e4334; border: 1px solid #d9c28b; border-radius: 9px;
  font-size: 14px; font-weight: 650; cursor: pointer;
}
.dashboard-financeiro-resumos {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.dashboard-financeiro-resumos > div {
  display: flex; flex-direction: column; gap: 6px;
  padding: 16px; border-radius: 12px;
  background: #f7faf8; border: 1px solid #e2eae4;
  min-width: 0;
}
.dashboard-financeiro-resumos span { color: #536a5f; font-size: 13px; }
.dashboard-financeiro-resumos strong {
  color: #104632; font-size: clamp(17px, 1.6vw, 23px);
  overflow-wrap: anywhere;
}
.dashboard-financeiro-resumos small { color: #758279; font-size: 12px; }
.dashboard-financeiro-resumos .dashboard-financeiro-atencao {
  border-color: #edcfb4; background: #fff8ee;
}
.dashboard-financeiro-resumos .dashboard-financeiro-atencao strong { color: #98542a; }
.dashboard-financeiro-lista { margin-top: 20px; }
.dashboard-financeiro-lista-titulo {
  display: block; margin-bottom: 9px; font-size: 14px; color: #214f3f;
}
.dashboard-financeiro-item {
  display: grid;
  grid-template-columns: 115px minmax(0, 1fr) 98px 110px;
  gap: 13px; padding: 11px 6px;
  align-items: center; border-bottom: 1px solid #edf1eb;
  font-size: 13px;
}
.dashboard-financeiro-item > strong { overflow-wrap: anywhere; color: #25483a; }
.dashboard-financeiro-item > span { color: #6a776c; }
.dashboard-financeiro-item > b { text-align: right; color: #173f32; }
.dashboard-financeiro-tipo {
  display: inline-block; padding: 5px 7px;
  border-radius: 7px; background: #ebf6f0;
  color: #21674b !important; font-weight: 700; text-align: center;
}
.dashboard-financeiro-tipo.atrasado {
  color: #964728 !important; background: #fff0e4;
}
.dashboard-financeiro-mensagem { padding: 18px 0 2px; color: #667b70; font-size: 14px; }
.dashboard-financeiro-erro {
  background: #fff5ee; color: #854729; border-radius: 10px;
  padding: 12px; font-size: 14px;
}
@media (max-width: 1180px) {
  .dashboard-financeiro-resumos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 700px) {
  .dashboard-financeiro-diario { padding: 15px; }
  .dashboard-financeiro-resumos { grid-template-columns: 1fr; }
  .dashboard-financeiro-item {
    grid-template-columns: 1fr auto; gap: 6px 12px;
  }
  .dashboard-financeiro-item > b { text-align: right; }
}
"""

# Os marcadores são verificados antes de escrever.
app_path.write_text(app)
css_path.write_text(css)
print("✅ Dashboard passou a mostrar cobranças e despesas com dados reais.")
print("✅ Receber hoje, Pagar hoje e atrasados com saldos pendentes.")
print("✅ Lista das prioridades e botão para abrir o Financeiro.")
print("✅ Restrito a Administrador e Recepção; demais perfis não veem dados financeiros.")
print("✅ Não altera banco, recebimentos, Caixa, Agenda ou cadastro.")
print("Próximo passo: cd cuidare && npm run build")
