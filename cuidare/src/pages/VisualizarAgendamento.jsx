import { useEffect, useState } from "react";
import "./VisualizarAgendamento.css";

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : `https://${window.location.hostname.replace(
        /-5173\.app\.github\.dev$/,
        "-8000.app.github.dev"
      )}`;

const STATUS_LABELS = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

function formatarData(data) {
  if (!data) return "Não informado";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarHora(hora) {
  if (!hora) return "Não informado";
  return hora.slice(0, 5);
}

function VisualizarAgendamento({
  agendamentoId,
  onVoltar,
  onEditar,
  onAbrirPaciente,
}) {
  const [agendamento, setAgendamento] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [servico, setServico] = useState(null);
  const [profissional, setProfissional] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        setErro("");

        const agendamentoResponse = await fetch(
          `${API_URL}/agendamentos/${agendamentoId}`
        );

        const agendamentoData = await agendamentoResponse.json();

        if (!agendamentoResponse.ok) {
          throw new Error(
            typeof agendamentoData.detail === "string"
              ? agendamentoData.detail
              : "Não foi possível carregar o agendamento."
          );
        }

        setAgendamento(agendamentoData);

        const [
          pacienteResponse,
          servicoResponse,
          profissionalResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/pacientes/${agendamentoData.paciente_id}`
          ),
          fetch(
            `${API_URL}/servicos/${agendamentoData.servico_id}`
          ),
          fetch(
            `${API_URL}/usuarios/${agendamentoData.profissional_id}`
          ),
        ]);

        const [
          pacienteData,
          servicoData,
          profissionalData,
        ] = await Promise.all([
          pacienteResponse.json(),
          servicoResponse.json(),
          profissionalResponse.json(),
        ]);

        if (pacienteResponse.ok) {
          setPaciente(pacienteData);
        }

        if (servicoResponse.ok) {
          setServico(servicoData);
        }

        if (profissionalResponse.ok) {
          setProfissional(profissionalData);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar agendamento:",
          error
        );

        setErro(
          error?.message ||
            "Não foi possível carregar os dados do agendamento."
        );
      } finally {
        setCarregando(false);
      }
    }

    if (agendamentoId) {
      carregarDados();
    } else {
      setErro("Agendamento não informado.");
      setCarregando(false);
    }
  }, [agendamentoId]);

  if (carregando) {
    return (
      <section className="visualizar-agendamento-page">
        <div className="visualizar-agendamento-loading">
          <strong>Carregando agendamento...</strong>
          <p>
            Aguarde enquanto buscamos os dados do atendimento.
          </p>
        </div>
      </section>
    );
  }

  if (erro) {
    return (
      <section className="visualizar-agendamento-page">
        <div className="visualizar-agendamento-header">
          <div>
            <span className="visualizar-agendamento-label">
              AGENDA
            </span>

            <h1>Visualizar agendamento</h1>
          </div>

          <button
            type="button"
            className="visualizar-agendamento-secondary-button"
            onClick={onVoltar}
          >
            Voltar
          </button>
        </div>

        <div className="visualizar-agendamento-alert">
          {erro}
        </div>
      </section>
    );
  }

  return (
    <section className="visualizar-agendamento-page">
      <header className="visualizar-agendamento-header">
        <div>
          <span className="visualizar-agendamento-label">
            AGENDA
          </span>

          <h1>Detalhes do agendamento</h1>

          <p>
            Consulte as informações do atendimento antes de
            realizar alterações.
          </p>
        </div>

        <div className="visualizar-agendamento-header-actions">
          <button
            type="button"
            className="visualizar-agendamento-secondary-button"
            onClick={onVoltar}
          >
            Voltar
          </button>

          <button
            type="button"
            className="visualizar-agendamento-primary-button"
            onClick={() => onEditar(agendamento.id)}
          >
            Editar agendamento
          </button>
        </div>
      </header>

      <div className="visualizar-agendamento-status-card">
        <div className="visualizar-agendamento-status-icon">
          ◷
        </div>

        <div>
          <span>ATENDIMENTO</span>

          <h2>
            {paciente?.nome ||
              `Paciente #${agendamento.paciente_id}`}
          </h2>

          <p>
            {formatarData(agendamento.data)} •{" "}
            {formatarHora(agendamento.hora_inicio)} às{" "}
            {formatarHora(agendamento.hora_fim)}
          </p>
        </div>

        <span
          className={`visualizar-agendamento-status visualizar-agendamento-status-${agendamento.status}`}
        >
          {STATUS_LABELS[agendamento.status] ||
            agendamento.status}
        </span>
      </div>

      <div className="visualizar-agendamento-grid">
        <section className="visualizar-agendamento-card">
          <div className="visualizar-agendamento-card-header">
            <span>ATENDIMENTO</span>
            <h3>Informações do atendimento</h3>
          </div>

          <div className="visualizar-agendamento-info-grid">
            <div className="visualizar-agendamento-info-item">
              <span>Data</span>
              <strong>
                {formatarData(agendamento.data)}
              </strong>
            </div>

            <div className="visualizar-agendamento-info-item">
              <span>Horário</span>
              <strong>
                {formatarHora(agendamento.hora_inicio)} às{" "}
                {formatarHora(agendamento.hora_fim)}
              </strong>
            </div>

            <div className="visualizar-agendamento-info-item">
              <span>Serviço</span>
              <strong>
                {servico?.nome ||
                  `Serviço #${agendamento.servico_id}`}
              </strong>
            </div>

            <div className="visualizar-agendamento-info-item">
              <span>Fisioterapeuta</span>
              <strong>
                {profissional?.nome ||
                  `Usuário #${agendamento.profissional_id}`}
              </strong>
            </div>
          </div>
        </section>

        <section className="visualizar-agendamento-card">
          <div className="visualizar-agendamento-card-header">
            <span>PACIENTE</span>
            <h3>Dados do paciente</h3>
          </div>

          <div className="visualizar-agendamento-paciente">
            <div className="visualizar-agendamento-avatar">
              {paciente?.nome?.charAt(0)?.toUpperCase() ||
                "P"}
            </div>

            <div>
              <strong>
                {paciente?.nome ||
                  `Paciente #${agendamento.paciente_id}`}
              </strong>

              <span>
                {paciente?.telefone || "Telefone não informado"}
              </span>

              <span>
                {paciente?.email || "E-mail não informado"}
              </span>
            </div>
          </div>

          {onAbrirPaciente && (
            <button
              type="button"
              className="visualizar-agendamento-link-button"
              onClick={() =>
                onAbrirPaciente(agendamento.paciente_id)
              }
            >
              Abrir cadastro do paciente
            </button>
          )}
        </section>

        <section className="visualizar-agendamento-card visualizar-agendamento-card-full">
          <div className="visualizar-agendamento-card-header">
            <span>OBSERVAÇÕES</span>
            <h3>Observações do atendimento</h3>
          </div>

          <div className="visualizar-agendamento-observacoes">
            {agendamento.observacoes ? (
              <p>{agendamento.observacoes}</p>
            ) : (
              <p className="visualizar-agendamento-sem-observacao">
                Nenhuma observação registrada para este
                agendamento.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="visualizar-agendamento-footer">
        <button
          type="button"
          className="visualizar-agendamento-secondary-button"
          onClick={onVoltar}
        >
          Voltar para a agenda
        </button>

        <button
          type="button"
          className="visualizar-agendamento-primary-button"
          onClick={() => onEditar(agendamento.id)}
        >
          Editar agendamento
        </button>
      </div>
    </section>
  );
}

export default VisualizarAgendamento;
