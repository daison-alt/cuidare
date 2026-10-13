"""Organiza as cobranças do Cuidare por aluno. Não altera dados ou pagamentos."""
from pathlib import Path

root = Path.cwd()
jsx_path = root / "cuidare/src/pages/Financeiro.jsx"
css_path = root / "cuidare/src/pages/Financeiro.css"
if not jsx_path.is_file() or not css_path.is_file():
    raise SystemExit("Execute em /workspaces/cuidare.")

jsx = jsx_path.read_text()
css = css_path.read_text()
marker = "CUIDARE_ALUNOS_FINANCEIRO_V1"
if marker in jsx and marker in css:
    print("✅ Organização financeira por aluno já instalada.")
    raise SystemExit(0)
if marker in jsx or marker in css:
    raise SystemExit("Instalação parcial detectada. Nenhuma alteração.")

def trocar(antigo, novo):
    global jsx
    n = jsx.count(antigo)
    if n != 1:
        raise SystemExit(
            "Trecho incompatível (%s ocorrência(s)): %r. Nenhum arquivo foi alterado."
            % (n, antigo[:95])
        )
    jsx = jsx.replace(antigo, novo, 1)


trocar(
    'function Financeiro({ onVoltar }) {',
    '''function normalizarBuscaAluno(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function Financeiro({ onVoltar }) {'''
)

trocar(
    '  const [filtroCategoria, setFiltroCategoria] = useState("");',
    '''  const [filtroCategoria, setFiltroCategoria] = useState("");
  // CUIDARE_ALUNOS_FINANCEIRO_V1
  const [pacientesFinanceiro, setPacientesFinanceiro] = useState([]);
  const [erroNomesFinanceiro, setErroNomesFinanceiro] = useState(false);
  const [visaoCobrancas, setVisaoCobrancas] = useState("alunos");
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState(null);
  const [buscaAluno, setBuscaAluno] = useState("");'''
)

crase = chr(96)
anchor = "        fetch(" + crase + "$" + "{API_URL}/contas-pagar" + crase + "),"
trocar(
    anchor,
    anchor + "\n        fetch(" + crase +
    "$" + "{API_URL}/pacientes?incluir_inativos=true" +
    crase + ").catch(() => null),"
)
trocar(
    '      const [receberResposta, pagarResposta] = await Promise.all([',
    '      const [receberResposta, pagarResposta, pacientesResposta] = await Promise.all(['
)
trocar(
    '      setContasPagar(Array.isArray(pagar) ? pagar : []);',
    '''      setContasPagar(Array.isArray(pagar) ? pagar : []);
      if (pacientesResposta?.ok) {
        const pacientes = await pacientesResposta.json();
        setPacientesFinanceiro(Array.isArray(pacientes) ? pacientes : []);
        setErroNomesFinanceiro(false);
      } else {
        // A ausência de permissão para ver pacientes não bloqueia as cobranças.
        setErroNomesFinanceiro(true);
      }'''
)

trocar(
    '''    setFiltroCategoria("");
    setMostrarFormulario(false);
    limparFormulario();''',
    '''    setFiltroCategoria("");
    setVisaoCobrancas("alunos");
    setAlunoSelecionadoId(null);
    setBuscaAluno("");
    setMostrarFormulario(false);
    limparFormulario();'''
)

trocar(
    '  const categorias = useMemo(() => {',
    '''  const nomesAlunos = useMemo(
    () => new Map(
      pacientesFinanceiro.map((p) => [
        String(p.id),
        p.nome || "Paciente #" + p.id,
      ])
    ),
    [pacientesFinanceiro]
  );

  function nomeAlunoPorId(id) {
    if (id == null) return "Sem paciente vinculado";
    return nomesAlunos.get(String(id)) || "Paciente #" + id;
  }

  const categorias = useMemo(() => {'''
)

trocar(
    '      return passouStatus && passouCategoria;',
    '''      const passouAluno =
        aba !== "receber" ||
        visaoCobrancas !== "alunos" ||
        alunoSelecionadoId === null ||
        String(conta.paciente_id ?? "sem-aluno") === alunoSelecionadoId;

      return passouStatus && passouCategoria && passouAluno;'''
)
trocar(
    '''    listaAtual,
    filtroStatus,
    filtroCategoria,
  ]);

  const resumoReceber = useMemo(() => {''',
    '''    listaAtual,
    filtroStatus,
    filtroCategoria,
    aba,
    visaoCobrancas,
    alunoSelecionadoId,
  ]);

  const gruposAlunos = useMemo(() => {
    const grupos = new Map();
    if (aba !== "receber") return [];

    for (const conta of listaFiltrada) {
      const id = String(conta.paciente_id ?? "sem-aluno");
      if (!grupos.has(id)) {
        grupos.set(id, {
          id,
          nome: conta.paciente_id == null
            ? "Sem paciente vinculado"
            : nomesAlunos.get(id) || "Paciente #" + id,
          quantidade: 0,
          pendentes: 0,
          valorPendente: 0,
        });
      }

      const grupo = grupos.get(id);
      grupo.quantidade += 1;
      const status = calcularStatus(conta);
      const saldo = Math.max(
        0,
        Number(conta.valor || 0) - Number(conta.valor_pago || 0)
      );

      if (status !== "pago" && status !== "cancelado" && saldo > 0) {
        grupo.pendentes += 1;
        grupo.valorPendente += saldo;
      }
    }

    return [...grupos.values()].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
    );
  }, [listaFiltrada, nomesAlunos, aba]);

  const resumoReceber = useMemo(() => {'''
)

trocar(
    '''  function renderLista() {
    return (''',
    '''  function renderLista() {
    const gruposVisiveis = gruposAlunos.filter((grupo) =>
      normalizarBuscaAluno(grupo.nome).includes(normalizarBuscaAluno(buscaAluno))
    );

    return ('''
)

trocar(
    '''        {carregando ? (
          <div className="financeiro-empty">''',
    '''        {aba === "receber" && (
          <div className="financeiro-por-aluno-controles">
            <div className="financeiro-modos-cobranca">
              <button type="button"
                className={visaoCobrancas === "alunos" ? "selecionado" : ""}
                aria-pressed={visaoCobrancas === "alunos"}
                onClick={() => { setVisaoCobrancas("alunos"); setAlunoSelecionadoId(null); }}>
                Por aluno
              </button>
              <button type="button"
                className={visaoCobrancas === "todas" ? "selecionado" : ""}
                aria-pressed={visaoCobrancas === "todas"}
                onClick={() => { setVisaoCobrancas("todas"); setAlunoSelecionadoId(null); }}>
                Todas as cobranças
              </button>
            </div>

            {visaoCobrancas === "alunos" && alunoSelecionadoId === null && (
              <label className="financeiro-busca-aluno">
                Buscar aluno
                <input type="search"
                  value={buscaAluno}
                  placeholder="Digite o nome do aluno..."
                  onChange={(event) => setBuscaAluno(event.target.value)}
                />
              </label>
            )}

            {visaoCobrancas === "alunos" && alunoSelecionadoId !== null && (
              <div className="financeiro-aluno-selecionado">
                <button type="button" onClick={() => setAlunoSelecionadoId(null)}>
                  ← Voltar aos alunos
                </button>
                <strong>
                  {alunoSelecionadoId === "sem-aluno"
                    ? "Sem paciente vinculado"
                    : nomeAlunoPorId(alunoSelecionadoId)}
                </strong>
              </div>
            )}

            {erroNomesFinanceiro && (
              <p className="financeiro-aviso-alunos">
                Não foi possível consultar os nomes dos pacientes.
                As cobranças continuam disponíveis pelo número do cadastro.
              </p>
            )}
          </div>
        )}

        {carregando ? (
          <div className="financeiro-empty">'''
)
trocar(
    '''        ) : listaFiltrada.length === 0 ? (
          <div className="financeiro-empty">''',
    '''        ) : aba === "receber" &&
          visaoCobrancas === "alunos" &&
          alunoSelecionadoId === null ? (
          gruposVisiveis.length === 0 ? (
            <div className="financeiro-empty">
              <strong>Nenhum aluno encontrado</strong>
              <p>Procure outro nome ou ajuste os filtros.</p>
            </div>
          ) : (
            <div className="financeiro-alunos-grid">
              {gruposVisiveis.map((grupo) => (
                <button key={grupo.id} type="button"
                  className="financeiro-aluno-card"
                  onClick={() => setAlunoSelecionadoId(grupo.id)}>
                  <div className="financeiro-aluno-card-topo">
                    <strong>{grupo.nome}</strong>
                    <span aria-hidden="true">→</span>
                  </div>
                  <span className="financeiro-aluno-detalhe">
                    {grupo.quantidade} {grupo.quantidade === 1 ? "cobrança" : "cobranças"}
                    {" · "}
                    {grupo.pendentes} pendente(s)
                  </span>
                  <span className="financeiro-aluno-pendente">
                    <small>Total em aberto</small>
                    <strong>{formatarMoeda(grupo.valorPendente)}</strong>
                  </span>
                </button>
              ))}
            </div>
          )
        ) : listaFiltrada.length === 0 ? (
          <div className="financeiro-empty">'''
)

trocar(
    '''                        <td>
                          <strong>
                            {conta.descricao}
                          </strong>

                          {conta.observacoes && (
                            <small>
                              {conta.observacoes}
                            </small>
                          )}
                        </td>''',
    '''                        <td>
                          {aba === "receber" && (
                            <strong className="financeiro-nome-aluno-linha">
                              {nomeAlunoPorId(conta.paciente_id)}
                            </strong>
                          )}
                          <strong>{conta.descricao}</strong>
                          {conta.observacoes && conta.categoria !== "Pilates" && (
                            <small>{conta.observacoes}</small>
                          )}
                        </td>'''
)

css += """

/* CUIDARE_ALUNOS_FINANCEIRO_V1 */
.financeiro-por-aluno-controles {
  margin: 12px 0 22px; padding: 15px 16px;
  background: #f7faf8; border: 1px solid #e0ebe5; border-radius: 12px;
}
.financeiro-modos-cobranca { display: flex; gap: 8px; flex-wrap: wrap; }
.financeiro-modos-cobranca button {
  border: 1px solid #d4e2d9; background: white; color: #18523f;
  padding: 10px 16px; border-radius: 9px; cursor: pointer; font-weight: 650;
}
.financeiro-modos-cobranca button.selecionado {
  background: #0e4334; color: white; border-color: #0e4334;
}
.financeiro-busca-aluno {
  display: flex; flex-direction: column; gap: 7px;
  margin-top: 14px; color: #134c3a; font-weight: 650; max-width: 450px;
}
.financeiro-busca-aluno input {
  width: 100%; min-height: 44px; padding: 10px 13px;
  border: 1px solid #ccd9d1; background: white; border-radius: 9px;
  color: #1a2b24; font-size: 15px;
}
.financeiro-busca-aluno input:focus-visible,
.financeiro-modos-cobranca button:focus-visible,
.financeiro-aluno-card:focus-visible {
  outline: 3px solid #c29b47; outline-offset: 2px;
}
.financeiro-alunos-grid {
  display: grid; grid-template-columns: repeat(auto-fill,minmax(min(100%,295px),1fr));
  gap: 14px;
}
.financeiro-aluno-card {
  width: 100%; min-width: 0; text-align: left; cursor: pointer;
  display: flex; flex-direction: column; gap: 12px;
  background: white; border: 1px solid #dce7e0; border-radius: 13px;
  padding: 20px; color: #173e31;
  box-shadow: 0 3px 12px rgba(17,62,46,.035);
}
.financeiro-aluno-card:hover {
  border-color: #c29b47; box-shadow: 0 6px 19px rgba(17,62,46,.09);
}
.financeiro-aluno-card-topo {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;
}
.financeiro-aluno-card-topo strong { font-size: 17px; overflow-wrap: anywhere; }
.financeiro-aluno-card-topo span { font-size: 24px; color: #ae8a45; }
.financeiro-aluno-detalhe { color: #65766e; font-size: 13px; }
.financeiro-aluno-pendente {
  border-top: 1px solid #edf1ed; padding-top: 12px;
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
}
.financeiro-aluno-pendente small { color: #687a6f; }
.financeiro-aluno-pendente strong { color: #0e4334; font-size: 18px; }
.financeiro-aluno-selecionado {
  display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 14px;
}
.financeiro-aluno-selecionado button {
  cursor: pointer; padding: 9px 13px; color: #0e4334;
  background: white; border: 1px solid #d4e2d9; border-radius: 8px;
}
.financeiro-aluno-selecionado strong { color: #0e4334; font-size: 17px; }
.financeiro-nome-aluno-linha {
  display: block; color: #126047; font-size: 15px; margin-bottom: 7px;
}
.financeiro-aviso-alunos { margin: 12px 0 0; color: #935b1b; font-size: 13px; }
@media (max-width: 620px) {
  .financeiro-alunos-grid { grid-template-columns: 1fr; }
}
"""

jsx_path.write_text(jsx)
css_path.write_text(css)
print("✅ Cobranças organizadas por aluno, em ordem alfabética.")
print("✅ Pesquisa por nome, total em aberto e acesso às parcelas.")
print("✅ Alternância: Por aluno / Todas as cobranças.")
print("✅ Nomes também aparecem nas linhas da tabela.")
print("✅ Banco de dados, Caixa e recebimentos não foram alterados.")
print("Agora execute: cd cuidare && npm run build")
