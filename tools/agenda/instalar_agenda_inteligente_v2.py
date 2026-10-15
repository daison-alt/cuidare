"""Cuidare: instalar painel da Agenda Inteligente sem alterar o backend.

Nao reescreve arquivos personalizados; verifica ancoras antes das alteracoes.
Para nao causar alteracoes clinicas, este release e somente de visualizacao.
"""
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path("/workspaces/cuidare")
PIN = "08be8786cde3abc6584c2ac23f570596073aa443"
BASE = f"https://raw.githubusercontent.com/daison-alt/cuidare/{PIN}/"
AGENDA = ROOT / "cuidare/src/pages/Agenda.jsx"
ESTILO = ROOT / "cuidare/src/pages/Agenda.css"
NOVOS = [
    "cuidare/src/components/PainelAgendaInteligente.jsx",
    "cuidare/src/components/PainelAgendaInteligente.css",
]
MARCA = "CUIDARE_AGENDA_INTELIGENTE_V2"

if not AGENDA.is_file() or not ESTILO.is_file():
    raise SystemExit("Arquivos da Agenda nao encontrados. Rode no Codespaces do Cuidare.")

agenda = AGENDA.read_text(encoding="utf-8")
estilo = ESTILO.read_text(encoding="utf-8")
if MARCA in agenda and MARCA in estilo:
    print("✅ Agenda Inteligente V2 ja instalada.")
    raise SystemExit(0)
if MARCA in agenda or MARCA in estilo:
    raise SystemExit("Instalacao anterior incompleta. Nenhum arquivo alterado.")

def substituir(antes, depois):
    global agenda
    if agenda.count(antes) != 1:
        raise SystemExit(f"Estrutura da Agenda diferente do esperado: {antes[:95]!r}. Nenhum arquivo alterado.")
    agenda = agenda.replace(antes, depois, 1)

substituir(
    'import { API_URL } from "../config";',
    'import { API_URL } from "../config";\n'
    'import PainelAgendaInteligente, { dataLocal, limparTexto } from "../components/PainelAgendaInteligente"; // ' + MARCA,
)

substituir(
    '  const hoje = new Date().toISOString().slice(0, 10);',
    '  const hoje = dataLocal(); // Data local do navegador; evita virada antecipada em UTC.',
)

substituir(
    '  const [registrandoPresenca, setRegistrandoPresenca] = useState(null);',
    '''  const [registrandoPresenca, setRegistrandoPresenca] = useState(null);
  const [buscaPaciente, setBuscaPaciente] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroModalidade, setFiltroModalidade] = useState("todos");''',
)

substituir(
    '''  }, [agendamentos, dataSelecionada]);

  // CUIDARE_TURNO_GRADE_V1''',
    '''  }, [agendamentos, dataSelecionada]);

  const agendamentosVisiveis = useMemo(() => {
    const busca = limparTexto(buscaPaciente.trim());
    const nomes = new Map(pacientes.map((p) => [String(p.id), p.nome]));
    const modalidades = new Map(
      servicos.map((s) => [String(s.id), s.modalidade_pilates])
    );
    return agendamentosDoDia.filter((item) => {
      const nome = limparTexto(nomes.get(String(item.paciente_id)) || "");
      if (busca && !nome.includes(busca)) return false;
      if (filtroStatus !== "todos" && item.status !== filtroStatus) return false;
      if (filtroModalidade !== "todos") {
        const atual = modalidades.get(String(item.servico_id));
        if (filtroModalidade === "outros") {
          if (atual === "grupo" || atual === "individual") return false;
        } else if (atual !== filtroModalidade) return false;
      }
      return true;
    });
  }, [agendamentosDoDia, pacientes, servicos, buscaPaciente, filtroStatus, filtroModalidade]);

  const filtrosAtivos =
    Boolean(buscaPaciente.trim()) ||
    filtroStatus !== "todos" ||
    filtroModalidade !== "todos";

  // CUIDARE_TURNO_GRADE_V1''',
)

substituir(
    '      {erro && <div className="agenda-error">{erro}</div>}',
    '''      <PainelAgendaInteligente
        dia={dataSelecionada}
        onDiaMudar={setDataSelecionada}
        agendamentos={agendamentosDoDia}
        servicos={servicos}
        profissionais={usuarios}
        busca={buscaPaciente}
        onBuscaMudar={setBuscaPaciente}
        status={filtroStatus}
        onStatusMudar={setFiltroStatus}
        modalidade={filtroModalidade}
        onModalidadeMudar={setFiltroModalidade}
        quantidadeExibida={agendamentosVisiveis.length}
        onAtualizar={carregarDados}
        carregando={carregando}
      />

      {erro && <div className="agenda-error">{erro}</div>}''',
)

substituir(
    '''              const itens = agendamentosDoDia.filter(
                (a) => String(a.hora_inicio || "").slice(0, 2) === faixa
              );
              const ativos = itens.filter(''',
    '''              const agendamentosNaFaixa = agendamentosDoDia.filter(
                (a) => String(a.hora_inicio || "").slice(0, 2) === faixa
              );
              const itens = agendamentosVisiveis.filter(
                (a) => String(a.hora_inicio || "").slice(0, 2) === faixa
              );
              const ativos = agendamentosNaFaixa.filter(''',
)

substituir(
    '                    ) : "Livre"}</span>',
    '                    ) : "Sem atendimentos ativos"}</span>',
)

substituir(
    '''                    {itens.length === 0 ? (
                      <button type="button" className="agenda-faixa-livre"
                        onClick={onNovoAgendamento}>
                        + Horário livre
                      </button>
                    ) : (''',
    '''                    {itens.length === 0 ? (
                      filtrosAtivos ? (
                        <div className="agenda-faixa-sem-resultado">
                          Nenhum atendimento corresponde aos filtros neste horário.
                        </div>
                      ) : (
                        <button type="button" className="agenda-faixa-livre"
                          onClick={onNovoAgendamento}>
                          + Consultar horário para agendar
                        </button>
                      )
                    ) : (''',
)

estilo += '''
/* CUIDARE_AGENDA_INTELIGENTE_V2 */
.agenda-faixa-sem-resultado {
  padding: 14px;
  font-size: 12px;
  color: #718579;
  border: 1px dashed #e1e8e2;
  border-radius: 9px;
  background: #fcfdfb;
}
'''

# Busca todos os componentes antes de alterar arquivos.
downloads = {}
for relativo in NOVOS:
    destino = ROOT / relativo
    requisicao = Request(BASE + relativo, headers={"User-Agent": "cuidare-installer"})
    try:
        with urlopen(requisicao, timeout=25) as resposta:
            conteudo = resposta.read().decode("utf-8")
    except Exception as exc:
        raise SystemExit(f"Nao foi possivel baixar {relativo}: {exc}. Nenhum arquivo alterado.")
    if len(conteudo) < 200:
        raise SystemExit(f"Arquivo inesperado {relativo}. Nenhum arquivo alterado.")
    if destino.exists() and destino.read_text(encoding="utf-8") != conteudo:
        raise SystemExit(f"Arquivo {relativo} ja existe com alteracoes. Nenhum arquivo alterado.")
    downloads[destino] = conteudo

for destino, conteudo in downloads.items():
    destino.parent.mkdir(parents=True, exist_ok=True)
    if not destino.exists():
        destino.write_text(conteudo, encoding="utf-8")

AGENDA.write_text(agenda, encoding="utf-8")
ESTILO.write_text(estilo, encoding="utf-8")

print("✅ Visao diaria da Agenda Inteligente instalada.")
print("✅ Data local corrigida, navegacao por dias e botao atualizar.")
print("✅ Busca por paciente, filtros de situacao e modalidade.")
print("✅ Painel de contagens e ocupacao das turmas de Pilates.")
print("✅ Sem alteracoes no banco, financeiro, prontuarios ou status.")
print("Execute: cd cuidare && npm run build")
