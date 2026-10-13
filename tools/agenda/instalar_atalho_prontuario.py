"""Integra Agenda e Prontuario sem alterar dados clinicos ou financeiros."""
from pathlib import Path

ROOT = Path.cwd()
APP = ROOT / "cuidare/src/App.jsx"
AGENDA = ROOT / "cuidare/src/pages/Agenda.jsx"
PRONTUARIO = ROOT / "cuidare/src/pages/Prontuario.jsx"
AGENDA_CSS = ROOT / "cuidare/src/pages/Agenda.css"
PRONTUARIO_CSS = ROOT / "cuidare/src/pages/Prontuario.css"
ARQUIVOS = [APP, AGENDA, PRONTUARIO, AGENDA_CSS, PRONTUARIO_CSS]
MARCA = "CUIDARE_AGENDA_PRONTUARIO_V1"

for arquivo in ARQUIVOS:
    if not arquivo.is_file():
        raise SystemExit(f"Arquivo nao encontrado: {arquivo}. Nenhuma alteracao.")

codigo = {arquivo: arquivo.read_text(encoding="utf-8") for arquivo in ARQUIVOS}
if all(MARCA in texto for texto in codigo.values()):
    print("✅ Integracao Agenda-Prontuario ja instalada.")
    raise SystemExit(0)
if any(MARCA in texto for texto in codigo.values()):
    raise SystemExit("Instalacao parcial detectada. Nenhuma alteracao.")

def trocar(arquivo, antes, depois):
    quantidade = codigo[arquivo].count(antes)
    if quantidade != 1:
        raise SystemExit(
            f"Arquivo {arquivo.name} diferente do esperado: "
            f"{quantidade} ocorrencias de {antes[:100]!r}. "
            "Nenhuma alteracao."
        )
    codigo[arquivo] = codigo[arquivo].replace(antes, depois, 1)


trocar(
    APP,
    '  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);',
    '''  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  // CUIDARE_AGENDA_PRONTUARIO_V1
  const [origemProntuario, setOrigemProntuario] = useState("pacientes");
  const [atendimentoAgendaProntuario, setAtendimentoAgendaProntuario] = useState(null);''',
)
trocar(
    APP,
    '''  if (!usuarioLogado) {
    return <Login onLogin={handleLogin} />;
  }''',
    '''  function abrirProntuarioPelaAgenda(agendamento) {
    const perfil = normalizarPerfil(usuarioLogado?.perfil);
    if (!["administrador", "fisioterapeuta"].includes(perfil)) return;
    if (!agendamento?.paciente_id) return;

    setPacienteSelecionado(agendamento.paciente_id);
    setAtendimentoAgendaProntuario({
      id: agendamento.id,
      data: agendamento.data,
      hora_inicio: agendamento.hora_inicio,
      hora_fim: agendamento.hora_fim,
      status: agendamento.status,
    });
    setOrigemProntuario("agenda");
    setCurrentPage("prontuario");
  }

  if (!usuarioLogado) {
    return <Login onLogin={handleLogin} />;
  }''',
)
trocar(
    APP,
    '''      <Prontuario
        pacienteId={pacienteSelecionado}
        onVoltar={() => {
          setCurrentPage("pacientes");
        }}
      />''',
    '''      <Prontuario
        pacienteId={pacienteSelecionado}
        atendimentoAgenda={atendimentoAgendaProntuario}
        onVoltar={() => {
          setCurrentPage(origemProntuario === "agenda" ? "agenda" : "pacientes");
          setAtendimentoAgendaProntuario(null);
          setOrigemProntuario("pacientes");
        }}
      />''',
)
trocar(
    APP,
    '''      <Agenda
        onVoltar={() => setCurrentPage("dashboard")}
        onNovoAgendamento={() => setCurrentPage("novo-agendamento")}''',
    '''      <Agenda
        onVoltar={() => setCurrentPage("dashboard")}
        onNovoAgendamento={() => setCurrentPage("novo-agendamento")}
        onAbrirProntuario={
          ["administrador", "fisioterapeuta"].includes(
            normalizarPerfil(usuarioLogado?.perfil)
          ) ? abrirProntuarioPelaAgenda : undefined
        }''',
)
trocar(
    APP,
    '''        onAbrirProntuario={() => {
          setCurrentPage("prontuario");
        }}''',
    '''        onAbrirProntuario={() => {
          setOrigemProntuario("pacientes");
          setAtendimentoAgendaProntuario(null);
          setCurrentPage("prontuario");
        }}''',
)

trocar(
    AGENDA,
    '''  onEditarAgendamento,
  onVisualizarAgendamento,
}) {''',
    '''  onEditarAgendamento,
  onVisualizarAgendamento,
  onAbrirProntuario, // CUIDARE_AGENDA_PRONTUARIO_V1
}) {''',
)
trocar(
    AGENDA,
    '''                    {onEditarAgendamento && (
                      <button
                        type="button"
                        onClick={() => onEditarAgendamento(agendamento.id)}
                      >
                        Editar
                      </button>
                    )}''',
    '''                    {onEditarAgendamento && (
                      <button
                        type="button"
                        onClick={() => onEditarAgendamento(agendamento.id)}
                      >
                        Editar
                      </button>
                    )}

                    {onAbrirProntuario && agendamento.paciente_id && (
                      <button
                        type="button"
                        className="agenda-prontuario-atalho"
                        onClick={() => onAbrirProntuario(agendamento)}
                        title="Consultar prontuario do paciente deste agendamento"
                      >
                        Abrir prontuário
                      </button>
                    )}''',
)

trocar(
    PRONTUARIO,
    '''function Prontuario({
  pacienteId,
  onVoltar,
}) {''',
    '''function Prontuario({
  pacienteId,
  onVoltar,
  atendimentoAgenda = null, // CUIDARE_AGENDA_PRONTUARIO_V1
}) {''',
)
trocar(
    PRONTUARIO,
    '''      </div>

      {erro && (
        <div className="prontuario-alert">''',
    '''      </div>

      {atendimentoAgenda && (
        <div className="prontuario-atendimento-vinculado" role="note">
          <div className="prontuario-atendimento-vinculado-titulo">
            <strong>Atendimento selecionado na Agenda</strong>
            <span>#{atendimentoAgenda.id}</span>
          </div>
          <p>
            {(() => {
              const partes = String(atendimentoAgenda.data || "").split("-");
              return partes.length === 3
                ? [partes[2], partes[1], partes[0]].join("/")
                : "Data não informada";
            })()}
            {" · "}
            {String(atendimentoAgenda.hora_inicio || "--:--").slice(0, 5)}
            {" às "}
            {String(atendimentoAgenda.hora_fim || "--:--").slice(0, 5)}
            {" · "}
            {{
              agendado: "Agendado",
              confirmado: "Confirmado",
              em_atendimento: "Em atendimento",
              concluido: "Concluído",
              cancelado: "Cancelado",
              faltou: "Faltou",
            }[atendimentoAgenda.status] || atendimentoAgenda.status}
          </p>
          <small>
            Este atalho apenas identifica o atendimento. Registrar evolução
            clínica não altera automaticamente a presença na Agenda.
          </small>
        </div>
      )}

      {erro && (
        <div className="prontuario-alert">''',
)

codigo[AGENDA_CSS] += '''
/* CUIDARE_AGENDA_PRONTUARIO_V1 */
.agenda-card-actions { flex-wrap: wrap; }
.agenda-card-actions .agenda-prontuario-atalho {
  background: #0e4334;
  color: #fff;
  border-color: #0e4334;
}
.agenda-card-actions .agenda-prontuario-atalho:hover {
  background: #166149;
  color: #fff;
}
'''

codigo[PRONTUARIO_CSS] += '''
/* CUIDARE_AGENDA_PRONTUARIO_V1 */
.prontuario-atendimento-vinculado {
  margin: 0 0 20px;
  padding: 15px 19px;
  border: 1px solid #c5e0cc;
  border-left: 4px solid #0e4334;
  border-radius: 12px;
  background: #f2f8f3;
  color: #164332;
}
.prontuario-atendimento-vinculado-titulo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 14px;
}
.prontuario-atendimento-vinculado-titulo span {
  color: #61776a;
  font-size: 12px;
}
.prontuario-atendimento-vinculado p {
  margin: 7px 0 5px;
  font-size: 13px;
  font-weight: 600;
}
.prontuario-atendimento-vinculado small {
  display: block;
  color: #567363;
  font-size: 12px;
  line-height: 1.5;
}
'''

for arquivo, texto in codigo.items():
    arquivo.write_text(texto, encoding="utf-8")
print("✅ Botao Abrir prontuario adicionado aos atendimentos da Agenda.")
print("✅ Atalho visivel somente a Administrador e Fisioterapeuta.")
print("✅ Identificacao de data, horario e status do atendimento no prontuario.")
print("✅ Voltar retorna a Agenda quando o acesso for realizado pela Agenda.")
print("✅ Nao foram alterados banco de dados, presencas, evolucoes ou pagamentos.")
print("Execute: cd cuidare && npm run build")
