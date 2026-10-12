"""Instala melhorias visuais no Dashboard e na Agenda, sem alterar o backend."""
from pathlib import Path
import re

raiz = Path.cwd()
app = raiz / "cuidare/src/App.jsx"
agenda = raiz / "cuidare/src/pages/Agenda.jsx"
app_css = raiz / "cuidare/src/App.css"
agenda_css = raiz / "cuidare/src/pages/Agenda.css"
arquivos = [app, agenda, app_css, agenda_css]

for arquivo in arquivos:
    if not arquivo.is_file():
        raise SystemExit(f"Arquivo não encontrado: {arquivo}")

originais = {arquivo: arquivo.read_text() for arquivo in arquivos}
textos = dict(originais)
marcador = "CUIDARE_TURNO_GRADE_V1"

if all(marcador in textos[p] for p in (app, agenda, app_css, agenda_css)):
    print("✅ Dashboard por turno e grade de horários já instalados.")
    raise SystemExit(0)
if any(marcador in textos[p] for p in (app, agenda, app_css, agenda_css)):
    raise SystemExit("Instalação parcial detectada. Nenhum arquivo alterado.")


def substituir(arquivo, antes, depois):
    atual = textos[arquivo]
    if atual.count(antes) != 1:
        raise SystemExit(f"Estrutura diferente da esperada em {arquivo.name}: {antes[:68]!r}. Nenhuma alteração feita.")
    textos[arquivo] = atual.replace(antes, depois, 1)


# DASHBOARD: turno calculado no navegador, com data local, e atualizado ao longo do dia.
substituir(
    app,
    '  const [currentPage, setCurrentPage] = useState("dashboard");',
    '''  const [currentPage, setCurrentPage] = useState("dashboard");
  // CUIDARE_TURNO_GRADE_V1
  const [relogioDashboard, setRelogioDashboard] = useState(() => new Date());

  useEffect(() => {
    if (currentPage !== "dashboard") return;
    setRelogioDashboard(new Date());
    const timer = setInterval(() => setRelogioDashboard(new Date()), 60000);
    return () => clearInterval(timer);
  }, [currentPage]);''',
)

substituir(
    app,
    '  const hoje = new Date().toISOString().slice(0, 10);',
    '''  const hoje = [
    relogioDashboard.getFullYear(),
    String(relogioDashboard.getMonth() + 1).padStart(2, "0"),
    String(relogioDashboard.getDate()).padStart(2, "0"),
  ].join("-");''',
)

inicio = textos[app].find("  const proximosAtendimentos = dashboardDados.agendamentos")
fim = textos[app].find("\n  function buscarPaciente(id) {", inicio)
if inicio == -1 or fim == -1:
    raise SystemExit("Não encontrei o filtro de atendimentos do Dashboard. Nada alterado.")
textos[app] = (
    textos[app][:inicio]
    + '''  const turnoAtual = relogioDashboard.getHours() < 12
    ? { nome: "Manhã", inicio: "00:00", fim: "12:00" }
    : { nome: "Tarde e noite", inicio: "12:00", fim: "24:00" };

  const proximosAtendimentos = dashboardDados.agendamentos
    .filter((agendamento) => (
      agendamento.ativo &&
      agendamento.data === hoje &&
      !["cancelado", "faltou"].includes(agendamento.status) &&
      String(agendamento.hora_inicio || "") >= turnoAtual.inicio &&
      String(agendamento.hora_inicio || "") < turnoAtual.fim
    ))
    .sort((a, b) =>
      String(a.hora_inicio || "").localeCompare(String(b.hora_inicio || ""))
    );
'''
    + textos[app][fim:]
)

substituir(
    app,
    "<h3>Próximos atendimentos</h3>",
    '''<h3>Agenda do turno · {turnoAtual.nome}</h3>
                  <small className="dashboard-turno-contador">
                    {proximosAtendimentos.length} atendimento(s) hoje neste turno
                  </small>''',
)
substituir(app, "Nenhum atendimento agendado", "Nenhum atendimento neste turno")
substituir(app, "Os próximos atendimentos aparecerão", "Os atendimentos deste turno aparecerão")

textos[app_css] += '''
/* CUIDARE_TURNO_GRADE_V1 — Lista de atendimentos do turno no Dashboard */
.dashboard-turno-contador {
  display: block; margin-top: 6px; color: #677e74; font-size: 12px;
}
.dashboard-appointments {
  margin-top: 18px; display: grid; gap: 8px;
  max-height: 520px; overflow-y: auto; padding-right: 4px;
}
.dashboard-appointment {
  display: grid; grid-template-columns: 93px minmax(0, 1fr);
  align-items: center; column-gap: 14px; padding: 12px;
  border: 1px solid #e2eae6; border-radius: 12px;
  background: #f9fbfa; min-width: 0;
}
.dashboard-appointment > div { min-width: 0; }
.dashboard-appointment > div:first-child {
  display: flex; flex-direction: column; gap: 4px;
  padding-right: 12px; border-right: 1px solid #dbe6e1;
}
.dashboard-appointment > div:last-child {
  display: flex; flex-direction: column; gap: 5px;
}
.dashboard-appointment strong {
  display: block; color: #163f32; font-size: 14px;
  overflow-wrap: anywhere; line-height: 1.4;
}
.dashboard-appointment > div:first-child strong { font-size: 20px; }
.dashboard-appointment span { display: block; color: #697c74; font-size: 12px; }
@media (max-width: 650px) {
  .dashboard-appointment { grid-template-columns: 76px minmax(0, 1fr); gap: 10px; }
}
'''

# AGENDA: horários agrupados na faixa de início, preservando os cartões e botões.
substituir(
    agenda,
    '''  function buscarPaciente(id) {
''',
    '''  // CUIDARE_TURNO_GRADE_V1 — grade das 06h às 21h, incluindo eventuais horários extras.
  const faixasAgenda = useMemo(() => {
    const todas = new Set(
      Array.from({ length: 16 }, (_, i) => String(i + 6).padStart(2, "0"))
    );
    agendamentosDoDia.forEach((item) => {
      const h = String(item.hora_inicio || "").slice(0, 2);
      if (/^\\d{2}$/.test(h) && Number(h) < 24) todas.add(h);
    });
    return [...todas].sort((a, b) => Number(a) - Number(b));
  }, [agendamentosDoDia]);

  function buscarPaciente(id) {
''',
)

# Trocar apenas o contêiner de lista pelo contêiner de grade.
texto = textos[agenda]
expressao_inicio = (
    r'\) : agendamentosDoDia\.length === 0 \? \(\s*'
    r'<div className="agenda-empty">.*?'
    r'\) : \(\s*'
    r'<div className="agenda-list">\s*'
    r'\{agendamentosDoDia\.map\(\(agendamento\) => \{'
)
nova_abertura = ''' ) : (
          <div className="agenda-grade">
            {faixasAgenda.map((faixa) => {
              const itens = agendamentosDoDia.filter(
                (a) => String(a.hora_inicio || "").slice(0, 2) === faixa
              );
              const ativos = itens.filter(
                (a) => !["cancelado", "faltou"].includes(a.status)
              ).length;
              return (
                <section className="agenda-faixa" key={faixa}>
                  <div className="agenda-faixa-horario">
                    <strong>{faixa}:00</strong>
                    <span>{ativos > 0 ? (
                      ativos + (ativos === 1 ? " atendimento" : " atendimentos")
                    ) : "Livre"}</span>
                  </div>
                  <div className="agenda-faixa-conteudo">
                    {itens.length === 0 ? (
                      <button type="button" className="agenda-faixa-livre"
                        onClick={onNovoAgendamento}>
                        + Horário livre
                      </button>
                    ) : (
                      <div className="agenda-list">
                        {itens.map((agendamento) => {'''

texto, quantidade = re.subn(
    expressao_inicio, lambda _: nova_abertura, texto, count=1, flags=re.S
)
if quantidade != 1:
    raise SystemExit("Não consegui localizar a lista de atendimentos da Agenda. Nenhuma alteração feita.")

fecho_antigo = '''              );
            })}
          </div>
        )}
      </section>'''
fecho_novo = '''                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>'''

if texto.count(fecho_antigo) != 1:
    raise SystemExit("Não consegui localizar o fechamento da lista de Agenda. Nenhuma alteração feita.")
texto = texto.replace(fecho_antigo, fecho_novo, 1)
textos[agenda] = texto

textos[agenda_css] += '''
/* CUIDARE_TURNO_GRADE_V1 — Grade de horários da Agenda */
.agenda-grade {
  display: grid; gap: 0; border: 1px solid #dee9e3;
  border-radius: 15px; background: #fff; overflow: hidden;
}
.agenda-faixa {
  display: grid; grid-template-columns: 100px minmax(0, 1fr);
  min-width: 0; border-bottom: 1px solid #e6efea;
}
.agenda-faixa:last-child { border-bottom: none; }
.agenda-faixa-horario {
  background: #f1f6f3; border-right: 1px solid #e1eae4;
  padding: 18px 10px; display: flex; flex-direction: column;
  gap: 7px; text-align: center;
}
.agenda-faixa-horario strong { font-size: 18px; color: #0e4334; }
.agenda-faixa-horario span { font-size: 11px; color: #607a6c; }
.agenda-faixa-conteudo {
  min-height: 74px; padding: 10px 12px; min-width: 0;
}
.agenda-faixa .agenda-list { display: grid; gap: 9px; }
.agenda-faixa .agenda-card {
  border: 1px solid #e3ebe7; border-radius: 10px;
  padding: 12px; box-shadow: none; background: #fff;
  grid-template-columns: 85px minmax(0,1fr) auto; gap: 14px;
}
.agenda-faixa .agenda-time strong { font-size: 16px; color: #0e4334; }
.agenda-faixa .agenda-card-top h2 { font-size: 15px; }
.agenda-faixa .agenda-details { gap: 7px 15px; margin-top: 6px; }
.agenda-faixa-livre {
  border: 1px dashed #d8e7df; border-radius: 10px; width: 100%;
  min-height: 52px; text-align: left; padding: 10px 14px;
  background: #fbfdfb; color: #688577; font-size: 13px;
  cursor: pointer;
}
.agenda-faixa-livre:hover { background: #ecf6ef; color: #0e4334; }
@media (max-width: 950px) {
  .agenda-faixa .agenda-card {
    grid-template-columns: 78px minmax(0, 1fr);
  }
  .agenda-faixa .agenda-card-actions { grid-column: 1 / -1; justify-content: flex-end; }
}
@media (max-width: 560px) {
  .agenda-faixa { grid-template-columns: 66px minmax(0,1fr); }
  .agenda-faixa-horario { padding: 14px 5px; }
  .agenda-faixa-horario strong { font-size: 14px; }
  .agenda-faixa .agenda-card { grid-template-columns: minmax(0,1fr); }
  .agenda-faixa .agenda-time { border: 0; padding: 0; }
  .agenda-faixa .agenda-card-actions { grid-column: 1; flex-wrap: wrap; }
}
'''

# Escrita somente depois de TODAS as verificações.
for p, novo in textos.items():
    if novo == originais[p]:
        raise SystemExit(f"Nenhuma alteração preparada em {p.name}. Instalação cancelada.")

for p, novo in textos.items():
    p.write_text(novo)

print("✅ Dashboard filtrado pelo turno atual.")
print("✅ Agenda organizada por faixas de hora, incluindo horários livres.")
print("✅ CSS ajustado para agrupar os atendimentos e evitar texto sobreposto.")
print("✅ Nenhuma alteração no backend ou no banco de dados.")
