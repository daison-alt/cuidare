"""Instala a Agenda Inteligente sobre o código local sem apagar dados do Cuidare."""
from pathlib import Path
import re

raiz = Path.cwd()
frontend = raiz / "cuidare/src/pages/AlunosPilates.jsx"
main = raiz / "backend/app/main.py"
backend = raiz / "backend/app/routers/matriculas_inteligentes.py"
componente = raiz / "cuidare/src/components/HorariosInteligentes.jsx"
css = raiz / "cuidare/src/components/HorariosInteligentes.css"

for p in (frontend, main, backend, componente, css):
    if not p.is_file():
        raise SystemExit(f"Arquivo não encontrado: {p}")

if "modalidade" not in (raiz / "backend/app/models/plano_pilates.py").read_text():
    raise SystemExit("O modelo PlanoPilates não contém modalidade.")
if "modalidade_pilates" not in (raiz / "backend/app/models/servico.py").read_text():
    raise SystemExit("O modelo Servico não contém modalidade_pilates.")

textos = {frontend: frontend.read_text(), main: main.read_text()}
if 'import HorariosInteligentes from "../components/HorariosInteligentes";' in textos[frontend]:
    raise SystemExit("Agenda Inteligente já instalada no formulário. Nenhuma alteração feita.")
if "matriculas_inteligentes_router" in textos[main]:
    raise SystemExit("Rota inteligente já registrada no servidor. Nenhuma alteração feita.")


def trocar(p, velho, novo, quantidade=1):
    s = textos[p]
    if s.count(velho) != quantidade:
        raise SystemExit(
            f"Estrutura inesperada em {p.name} para {velho[:65]!r}. "
            "Nenhuma alteração foi aplicada."
        )
    textos[p] = s.replace(velho, novo, quantidade)


# Registrar a nova rota, sem mexer nas rotas antigas de agenda e matrículas.
trocar(
    main,
    "from app.routers.alunos_planos_pilates import router as alunos_planos_pilates_router",
    "from app.routers.alunos_planos_pilates import router as alunos_planos_pilates_router\n"
    "from app.routers.matriculas_inteligentes import router as matriculas_inteligentes_router",
)
trocar(
    main,
    "app.include_router(alunos_planos_pilates_router)",
    "app.include_router(alunos_planos_pilates_router)\n"
    "app.include_router(matriculas_inteligentes_router)",
)

# Conectar a interface ao novo serviço de horários.
trocar(
    frontend,
    'import { API_URL } from "../config";',
    'import { API_URL } from "../config";\n'
    'import HorariosInteligentes from "../components/HorariosInteligentes";',
)
trocar(
    frontend,
    '  const [planos, setPlanos] = useState([]);',
    '  const [planos, setPlanos] = useState([]);\n'
    '  const [profissionais, setProfissionais] = useState([]);\n'
    '  const [horarios, setHorarios] = useState([]);\n'
    '  const [resultadoMatricula, setResultadoMatricula] = useState(null);',
)

s, n = re.subn(
    r'(?m)^(\s*)plano_id: "",$',
    lambda m: m.group(0) + '\n' + m.group(1) + 'profissional_id: "",',
    textos[frontend],
)
if n != 2:
    raise SystemExit(
        f"Esperados dois estados para plano_id no formulário; encontrados {n}. "
        "Nenhuma alteração feita."
    )
textos[frontend] = s

trocar(
    frontend,
    '''        pacientesData,
        planosData,
      ] = await Promise.all([''',
    '''        pacientesData,
        planosData,
        profissionaisData,
      ] = await Promise.all([''',
)
trocar(
    frontend,
    '''        requisicao("/planos-pilates?ativo=true"),
      ]);''',
    '''        requisicao("/planos-pilates?ativo=true"),
        requisicao("/usuarios/profissionais"),
      ]);''',
)
trocar(
    frontend,
    '''      setPlanos(
        Array.isArray(planosData)
          ? planosData
          : []
      );''',
    '''      setPlanos(
        Array.isArray(planosData)
          ? planosData
          : []
      );
      setProfissionais(Array.isArray(profissionaisData) ? profissionaisData : []);''',
)
trocar(
    frontend,
    '''  function alterarCampo(event) {
    const { name, value } = event.target;''',
    '''  function alterarCampo(event) {
    const { name, value } = event.target;
    if (["paciente_id", "plano_id", "profissional_id", "data_inicio", "data_fim"].includes(name)) {
      setHorarios([]);
    }
    setResultadoMatricula(null);''',
)

# Alterar apenas a matrícula nova, não o gerenciamento de alunos já cadastrados.
s = textos[frontend]
i = s.find("  async function matricularAluno(event) {")
j = s.find("\n  function abrirEdicao(", i)
if i < 0 or j <= i:
    raise SystemExit("Não encontrei o fluxo de matrícula esperado. Nenhuma alteração feita.")
trecho = s[i:j]


def alterar_matricula(velho, novo):
    global trecho
    if trecho.count(velho) != 1:
        raise SystemExit(
            f"Formulário de matrícula diferente do esperado em {velho[:65]!r}. "
            "Nenhuma alteração feita."
        )
    trecho = trecho.replace(velho, novo, 1)


alterar_matricula(
    '''    try {
      setSalvando(true);''',
    '''    const plano = obterPlanoSelecionado();
    if (!formulario.profissional_id || horarios.length !== Number(plano?.frequencia_semanal || 0)) {
      setErro("Selecione o fisioterapeuta e os horários fixos antes de matricular.");
      return;
    }

    try {
      setSalvando(true);''',
)
alterar_matricula(
    '''      await requisicao(
        "/alunos-planos-pilates",''',
    '''      const novaMatricula = await requisicao(
        "/matriculas-inteligentes",''',
)
alterar_matricula(
    '''            data_inicio:
              formulario.data_inicio,''',
    '''            profissional_id: Number(formulario.profissional_id),
            horarios_semanais: horarios,
            data_inicio:
              formulario.data_inicio,''',
)
alterar_matricula(
    '''      await carregarDados();''',
    '''      setHorarios([]);
      setResultadoMatricula(novaMatricula);
      await carregarDados();''',
)
textos[frontend] = s[:i] + trecho + s[j:]

trocar(
    frontend,
    '''          <div className="form-group">
            <label>
              Data de início
            </label>''',
    '''          <div className="form-group">
            <label>Fisioterapeuta</label>
            <select name="profissional_id" value={formulario.profissional_id}
              onChange={alterarCampo} required>
              <option value="">Selecione o fisioterapeuta</option>
              {profissionais.filter((p) => p.status).map((p) => (
                <option value={p.id} key={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              Data de início
            </label>''',
)
trocar(
    frontend,
    '''          <div className="form-group">
            <label>
              Valor contratado
            </label>''',
    '''          <HorariosInteligentes
            pacienteId={formulario.paciente_id}
            planoId={formulario.plano_id}
            profissionalId={formulario.profissional_id}
            inicio={formulario.data_inicio}
            fim={formulario.data_fim}
            selecionados={horarios}
            onChange={setHorarios}
          />

          <div className="form-group">
            <label>
              Valor contratado
            </label>''',
)
trocar(
    frontend,
    '''      <div
        id="matricula-pilates"
        className="content-card"
      >''',
    '''      {resultadoMatricula && (
        <div className="content-card" role="status" style={{ color: "#0e4334" }}>
          Matrícula #{resultadoMatricula.matricula_id} criada com sucesso.
          {" "}{resultadoMatricula.aulas_agendadas} aulas já reservadas na Agenda.
        </div>
      )}

      <div
        id="matricula-pilates"
        className="content-card"
      >''',
)

for p, codigo in textos.items():
    if p.suffix == ".py":
        compile(codigo, str(p), "exec")

for p, codigo in textos.items():
    p.write_text(codigo)

print("✅ Agenda Inteligente instalada nos arquivos locais.")
print("✅ Matrícula e agendamentos antigos preservados.")
print("Agora execute a compilação do backend e o build do frontend.")
