"""Cuidare - Agenda -> Financeiro -> Caixa (primeira integração).

Instala a API de consulta/cobrança e os atalhos financeiros na Agenda V4.
Não toca no banco diretamente, nem cria cobranças automaticamente.
Exige Agenda Inteligente V4 previamente instalada.
"""
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path("/workspaces/cuidare")
PIN = "2d8c5b655e7ba949a9a240b1028add9f50807a4c"
MARCA_V4 = "CUIDARE_AGENDA_FILTRO_FAIXAS_V4"
MARCA = "CUIDARE_AGENDA_FINANCEIRO_V1"
API = ROOT / "backend/app/main.py"
APP = ROOT / "cuidare/src/App.jsx"
AGENDA = ROOT / "cuidare/src/pages/Agenda.jsx"
NOVOS = (
    "backend/app/routers/agenda_financeiro.py",
    "cuidare/src/components/AtendimentoFinanceiro.jsx",
    "cuidare/src/components/AtendimentoFinanceiro.css",
)

for p in (API, APP, AGENDA):
    if not p.is_file():
        raise SystemExit(f"Arquivo principal não encontrado: {p}")

api = API.read_text(encoding="utf-8")
app = APP.read_text(encoding="utf-8")
agenda = AGENDA.read_text(encoding="utf-8")

if MARCA_V4 not in agenda:
    raise SystemExit("Instale a Agenda Inteligente V4 primeiro. Nenhuma alteração feita.")
if all(MARCA in text for text in (api, app, agenda)):
    print("✅ Integração Agenda-Financeiro V1 já instalada.")
    raise SystemExit(0)
if any(MARCA in text for text in (api, app, agenda)):
    raise SystemExit("Instalação parcialmente identificada. Nenhum arquivo alterado.")

def trocar(texto, anterior, proximo, nome):
    ocorrencias = texto.count(anterior)
    if ocorrencias != 1:
        raise SystemExit(
            f"{nome}: esperado 1 trecho compatível, encontrados {ocorrencias}. "
            f"Nenhum arquivo alterado. Trecho: {anterior[:90]!r}"
        )
    return texto.replace(anterior, proximo, 1)

api = trocar(
    api,
    "from app.routers.agendamentos import router as agendamentos_router",
    "from app.routers.agendamentos import router as agendamentos_router\n"
    "from app.routers.agenda_financeiro import router as agenda_financeiro_router # " + MARCA,
    "backend/app/main.py",
)
api = trocar(
    api,
    "app.include_router(agendamentos_router)",
    "app.include_router(agendamentos_router)\n"
    "app.include_router(agenda_financeiro_router)",
    "backend/app/main.py",
)

app = trocar(
    app,
    '  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);',
    '  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);\n'
    '  const [dataAgendaRetorno, setDataAgendaRetorno] = useState(null); // ' + MARCA,
    "cuidare/src/App.jsx",
)
app = trocar(
    app,
    '''      <Agenda
        onVoltar={() => setCurrentPage("dashboard")}''',
    '''      <Agenda
        dataInicial={dataAgendaRetorno}
        onVoltar={() => setCurrentPage("dashboard")}
        onAbrirFinanceiro={
          ["administrador", "secretaria"].includes(
            normalizarPerfil(usuarioLogado?.perfil)
          )
            ? (contaId, dataAgenda) => {
                setDataAgendaRetorno(dataAgenda);
                setAtalhoFinanceiro({
                  aba: "receber",
                  vencimento: "todos",
                  contaId,
                  origem: "agenda",
                });
                setCurrentPage("financeiro");
              }
            : undefined
        }''',
    "cuidare/src/App.jsx",
)
app = trocar(
    app,
    '''      <Financeiro
        onVoltar={() => setCurrentPage("dashboard")}''',
    '''      <Financeiro
        onVoltar={() => setCurrentPage(
          atalhoFinanceiro?.origem === "agenda" ? "agenda" : "dashboard"
        )}''',
    "cuidare/src/App.jsx",
)

agenda = trocar(
    agenda,
    'import { API_URL } from "../config";',
    'import { API_URL } from "../config";\n'
    'import AtendimentoFinanceiro from "../components/AtendimentoFinanceiro"; // ' + MARCA,
    "cuidare/src/pages/Agenda.jsx",
)
agenda = trocar(
    agenda,
    '''function Agenda({
  onVoltar,''',
    '''function Agenda({
  dataInicial,
  onAbrirFinanceiro,
  onVoltar,''',
    "cuidare/src/pages/Agenda.jsx",
)
agenda = trocar(
    agenda,
    '  const [dataSelecionada, setDataSelecionada] = useState(hoje);',
    '  const [dataSelecionada, setDataSelecionada] = useState(() => dataInicial || hoje);',
    "cuidare/src/pages/Agenda.jsx",
)
agenda = trocar(
    agenda,
    '  const [registrandoPresenca, setRegistrandoPresenca] = useState(null);',
    '''  const [registrandoPresenca, setRegistrandoPresenca] = useState(null);
  const [resumoFinanceiro, setResumoFinanceiro] = useState(null);
  const [erroFinanceiro, setErroFinanceiro] = useErro();
  const [carregandoFinanceiro, setCarregandoFinanceiro] = useState(false);
  const [gerandoCobranca, setGerandoCobranca] = useState(null);

  async function atualizarResumoFinanceiro(data = dataSelecionada) {
    if (!onAbrirFinanceiro) return;
    setCarregandoFinanceiro(true);
    setErroFinanceiro("");
    try {
      const token = obterToken();
      if (!token) throw new Error("Acesso expirado. Entre novamente no Cuidare.");
      const resposta = await fetch(
        `${API_URL}/agenda-financeiro/resumo?data=${encodeURIComponent(data)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const corpo = await resposta.json();
      if (!resposta.ok) {
        throw new Error(
          typeof corpo.detail === "string" ? corpo.detail
          : "Não foi possível consultar as cobranças da Agenda."
        );
      }
      setResumoFinanceiro(corpo);
    } catch (error) {
      setResumoFinanceiro(null);
      setErroFinanceiro(error.message || "Falha ao consultar o Financeiro.");
    } finally {
      setCarregandoFinanceiro(false);
    }
  }

  async function gerarCobrancaAgenda(agendamento) {
    if (!onAbrirFinanceiro || gerandoCobranca !== null) return;
    const valor = resumoFinanceiro?.atendimentos?.[String(agendamento.id)]?.valor_proposto;
    if (!Number.isFinite(Number(valor)) || Number(valor) <= 0) return;
    const preco = Number(valor).toLocaleString("pt-BR", {
      style: "currency", currency: "BRL"
    });
    const confirmou = window.confirm(
      `Gerar cobrança de ${preco} para o atendimento #${agendamento.id}?\\n\\n` +
      "Confirme antes que não existe cobrança manual deste atendimento. " +
      "Esta ação registra somente a conta a receber, não o pagamento."
    );
    if (!confirmou) return;

    setGerandoCobranca(agendamento.id);
    setErroFinanceiro("");
    try {
      const resposta = await fetch(
        `${API_URL}/agenda-financeiro/agendamentos/${agendamento.id}/cobranca`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${obterToken()}` },
        }
      );
      const corpo = await resposta.json();
      if (!resposta.ok) {
        throw new Error(
          typeof corpo.detail === "string" ? corpo.detail : "Não foi possível gerar a cobrança."
        );
      }
      if (!corpo.conta?.id) throw new Error("A cobrança não retornou identificação.");
      onAbrirFinanceiro(corpo.conta.id, dataSelecionada);
    } catch (error) {
      setErroFinanceiro(error.message || "Falha ao gerar cobrança.");
      await atualizarResumoFinanceiro(dataSelecionada);
    } finally {
      setGerandoCobranca(null);
    }
  }

  useEffect(() => {
    if (onAbrirFinanceiro) atualizarResumoFinanceiro(dataSelecionada);
  }, [dataSelecionada]);''',
    "cuidare/src/pages/Agenda.jsx",
)
agenda = trocar(
    agenda,
    '''      setAgendamentos((anteriores) =>
        anteriores.map((item) =>
          item.id === agendamento.id
            ? { ...item, ...dados, status: "concluido" }
            : item
        )
      );''',
    '''      setAgendamentos((anteriores) =>
        anteriores.map((item) =>
          item.id === agendamento.id
            ? { ...item, ...dados, status: "concluido" }
            : item
        )
      );
      if (onAbrirFinanceiro) await atualizarResumoFinanceiro(dataSelecionada);''',
    "cuidare/src/pages/Agenda.jsx",
)
agenda = trocar(
    agenda,
    '''      {erro && <div className="agenda-error">{erro}</div>}''',
    '''      {erro && <div className="agenda-error">{erro}</div>}
      {onAbrirFinanceiro && carregandoFinanceiro && (
        <p className="agenda-financeiro-estado">Atualizando situação financeira dos atendimentos...</p>
      )}
      {onAbrirFinanceiro && erroFinanceiro && (
        <div className="agenda-error" role="alert">
          Financeiro indisponível nesta consulta. {erroFinanceiro}
        </div>
      )}''',
    "cuidare/src/pages/Agenda.jsx",
)
agenda = trocar(
    agenda,
    '''                  <div className="agenda-card-actions">''',
    '''                  {onAbrirFinanceiro &&
                      resumoFinanceiro?.data === dataSelecionada &&
                      resumoFinanceiro?.atendimentos?.[String(agendamento.id)] && (
                        <AtendimentoFinanceiro
                          agendamento={agendamento}
                          dados={resumoFinanceiro.atendimentos[String(agendamento.id)]}
                          carregando={carregandoFinanceiro}
                          gerando={gerandoCobranca === agendamento.id}
                          onGerar={() => gerarCobrancaAgenda(agendamento)}
                          onAbrirConta={(contaId) => onAbrirFinanceiro(contaId, dataSelecionada)}
                        />
                      )}
                  <div className="agenda-card-actions">''',
    "cuidare/src/pages/Agenda.jsx",
)

# Evita sobrescrever componentes personalizados.
downloads = {}
for relativo in NOVOS:
    destino = ROOT / relativo
    req = Request(
        f"https://raw.githubusercontent.com/daison-alt/cuidare/{PIN}/{relativo}",
        headers={"User-Agent": "cuidare-installer"},
    )
    try:
        with urlopen(req, timeout=30) as resposta:
            novo = resposta.read().decode("utf-8")
    except Exception as exc:
        raise SystemExit(f"Não foi possível baixar {relativo}: {exc}. Nenhuma alteração feita.")
    if len(novo) < 300:
        raise SystemExit(f"Arquivo incompleto: {relativo}. Nenhuma alteração feita.")
    if destino.exists() and destino.read_text(encoding="utf-8") != novo:
        raise SystemExit(f"Arquivo personalizado: {relativo}. Nenhuma alteração feita.")
    if relativo.endswith(".py"):
        compile(novo, str(destino), "exec")
    downloads[destino] = novo

compile(api, str(API), "exec")
for destino, conteudo in downloads.items():
    destino.parent.mkdir(parents=True, exist_ok=True)
    if not destino.exists():
        destino.write_text(conteudo, encoding="utf-8")

API.write_text(api, encoding="utf-8")
APP.write_text(app, encoding="utf-8")
AGENDA.write_text(agenda, encoding="utf-8")

print("✅ Integração Agenda → Financeiro → Caixa instalada.")
print("✅ A Agenda consulta cobranças por vínculo exato da sessão ou matrícula.")
print("✅ Atendimento normal concluído pode gerar cobrança única mediante confirmação.")
print("✅ Recebimento permanece no Financeiro e gera o movimento de Caixa e recibo.")
print("✅ Ao voltar do Financeiro, a Agenda recupera a data selecionada.")
print("✅ Pilates, presenças e tabelas existentes preservados.")
print("Agora reinicie o backend para carregar a nova rota; rode o build do frontend.")
