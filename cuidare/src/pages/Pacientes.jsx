import { useEffect, useState } from "react";
import "./Pacientes.css";

const API_URL =
  "https://humble-waddle-97x5v4vpg7j73ppxq-8000.app.github.dev";

function Pacientes({
  onNovoPaciente,
  onVoltar,
  onVisualizarPaciente,
  onEditarPaciente,
}) {
  const [pacientes, setPacientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  async function carregarPacientes() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        `${API_URL}/pacientes?incluir_inativos=true`
      );

      if (!resposta.ok) {
        throw new Error(
          "Não foi possível carregar os pacientes."
        );
      }

      const dados = await resposta.json();

      setPacientes(dados);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);

      setErro(
        error?.message ||
          "Não foi possível carregar os pacientes."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPacientes();
  }, []);

  const pacientesFiltrados = pacientes.filter((paciente) => {
    const termo = busca.toLowerCase().trim();

    // Sem pesquisa:
    // mostrar somente pacientes ativos.
    if (!termo) {
      return paciente.ativo;
    }

    // Com pesquisa:
    // permitir encontrar ativos e inativos.
    return (
      paciente.nome?.toLowerCase().includes(termo) ||
      paciente.cpf?.toLowerCase().includes(termo) ||
      paciente.telefone?.toLowerCase().includes(termo)
    );
  });

  function formatarData(data) {
    if (!data) {
      return "—";
    }

    return new Date(
      `${data}T00:00:00`
    ).toLocaleDateString("pt-BR");
  }

  async function alterarStatusPaciente(paciente) {
    const estaAtivo = paciente.ativo;

    const confirmacao = window.confirm(
      estaAtivo
        ? `Deseja realmente desativar o paciente "${paciente.nome}"?`
        : `Deseja realmente ativar o paciente "${paciente.nome}"?`
    );

    if (!confirmacao) {
      return;
    }

    try {
      setErro("");

      const resposta = await fetch(
        estaAtivo
          ? `${API_URL}/pacientes/${paciente.id}`
          : `${API_URL}/pacientes/${paciente.id}/reativar`,
        {
          method: estaAtivo ? "DELETE" : "PUT",
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        const mensagem =
          typeof resultado.detail === "string"
            ? resultado.detail
            : estaAtivo
              ? "Não foi possível desativar o paciente."
              : "Não foi possível ativar o paciente.";

        throw new Error(mensagem);
      }

      await carregarPacientes();
    } catch (error) {
      console.error(
        "Erro ao alterar status do paciente:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível alterar o status do paciente."
      );
    }
  }

  return (
    <section className="pacientes-page">
      <div className="pacientes-header">
        <div>
          <span className="page-label">PACIENTES</span>

          <h2>Pacientes</h2>

          <p>
            Consulte, pesquise e gerencie os pacientes cadastrados
            na Cuidare.
          </p>
        </div>

        <div className="pacientes-header-actions">
          <button
            type="button"
            className="pacientes-back-button"
            onClick={onVoltar}
          >
            Voltar
          </button>

          <button
            type="button"
            className="pacientes-new-button"
            onClick={onNovoPaciente}
          >
            + Novo paciente
          </button>
        </div>
      </div>

      {erro && (
        <div className="pacientes-alert">
          {erro}
        </div>
      )}

      <div className="pacientes-panel">
        <div className="pacientes-toolbar">
          <div>
            <span className="toolbar-label">
              CADASTRO
            </span>

            <h3>Lista de pacientes</h3>
          </div>

          <div className="pacientes-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Buscar por nome, CPF ou telefone..."
              value={busca}
              onChange={(event) =>
                setBusca(event.target.value)
              }
            />
          </div>
        </div>

        {carregando ? (
          <div className="pacientes-empty">
            <strong>
              Carregando pacientes...
            </strong>
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="pacientes-empty">
            <div className="empty-icon">+</div>

            <strong>
              {busca
                ? "Nenhum paciente encontrado"
                : "Nenhum paciente cadastrado"}
            </strong>

            <p>
              {busca
                ? "Tente buscar por outro nome, CPF ou telefone."
                : "Os pacientes cadastrados aparecerão aqui."}
            </p>
          </div>
        ) : (
          <div className="pacientes-list">
            <div className="pacientes-list-header">
              <span>Paciente</span>
              <span>Contato</span>
              <span>Nascimento</span>
              <span>Status</span>
              <span>Ações</span>
            </div>

            {pacientesFiltrados.map((paciente) => (
              <article
                className={`paciente-row ${
                  paciente.ativo
                    ? ""
                    : "paciente-row-inativo"
                }`}
                key={paciente.id}
              >
                <div className="paciente-info">
                  <div className="paciente-avatar">
                    {paciente.nome
                      ?.charAt(0)
                      ?.toUpperCase() || "P"}
                  </div>

                  <div>
                    <strong>{paciente.nome}</strong>

                    <span>
                      {paciente.cpf ||
                        "CPF não informado"}
                    </span>
                  </div>
                </div>

                <div className="paciente-contact">
                  <strong>
                    {paciente.telefone || "—"}
                  </strong>

                  <span>
                    {paciente.email ||
                      "E-mail não informado"}
                  </span>
                </div>

                <div className="paciente-birth">
                  {formatarData(
                    paciente.data_nascimento
                  )}
                </div>

                <div>
                  <span
                    className={`paciente-status ${
                      paciente.ativo
                        ? "paciente-status-ativo"
                        : "paciente-status-inativo"
                    }`}
                  >
                    {paciente.ativo
                      ? "Ativo"
                      : "Inativo"}
                  </span>
                </div>

                <div className="paciente-actions">
                  <button
                    type="button"
                    onClick={() =>
                      onVisualizarPaciente(
                        paciente.id
                      )
                    }
                  >
                    Visualizar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onEditarPaciente(
                        paciente.id
                      )
                    }
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className={
                      paciente.ativo
                        ? "paciente-status-action paciente-desativar"
                        : "paciente-status-action paciente-ativar"
                    }
                    onClick={() =>
                      alterarStatusPaciente(
                        paciente
                      )
                    }
                  >
                    {paciente.ativo
                      ? "Desativar"
                      : "Ativar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Pacientes;
