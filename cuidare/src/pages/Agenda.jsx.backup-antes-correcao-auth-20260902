import "./Agenda.css";
import { useEffect, useMemo, useState } from "react";

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
  if (!data) return "";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function Agenda({ onVoltar, onNovoAgendamento, onEditarAgendamento, onVisualizarAgendamento }) {
  const hoje = new Date().toISOString().slice(0, 10);

  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [agendamentos, setAgendamentos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [agendamentosResponse, pacientesResponse, servicosResponse, usuariosResponse] =
        await Promise.all([
          fetch(`${API_URL}/agendamentos`),
          fetch(`${API_URL}/pacientes`),
          fetch(`${API_URL}/servicos`),
          fetch(`${API_URL}/usuarios`),
        ]);

      if (
        !agendamentosResponse.ok ||
        !pacientesResponse.ok ||
        !servicosResponse.ok ||
        !usuariosResponse.ok
      ) {
        throw new Error("Não foi possível carregar os dados da Agenda.");
      }

      const [
        agendamentosData,
        pacientesData,
        servicosData,
        usuariosData,
      ] = await Promise.all([
        agendamentosResponse.json(),
        pacientesResponse.json(),
        servicosResponse.json(),
        usuariosResponse.json(),
      ]);

      setAgendamentos(agendamentosData);
      setPacientes(pacientesData);
      setServicos(servicosData);
      setUsuarios(usuariosData);
    } catch (error) {
      console.error(error);
      setErro(
        "Não foi possível carregar a Agenda. Verifique se a API está funcionando."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const agendamentosDoDia = useMemo(() => {
    return agendamentos
      .filter(
        (agendamento) =>
          agendamento.data === dataSelecionada &&
          agendamento.ativo
      )
      .sort((a, b) =>
        a.hora_inicio.localeCompare(b.hora_inicio)
      );
  }, [agendamentos, dataSelecionada]);

  function buscarPaciente(id) {
    return pacientes.find((paciente) => paciente.id === id);
  }

  function buscarServico(id) {
    return servicos.find((servico) => servico.id === id);
  }

  function buscarProfissional(id) {
    return usuarios.find((usuario) => usuario.id === id);
  }

  return (
    <div className="agenda-page">
      <header className="agenda-header">
        <div>
          <span className="agenda-eyebrow">AGENDA</span>
          <h1>Agenda de atendimentos</h1>
          <p>
            Organize os horários, pacientes, serviços e profissionais da
            Cuidare.
          </p>
        </div>

        <div className="agenda-header-actions">
          {onVoltar && (
            <button
              type="button"
              className="agenda-secondary-button"
              onClick={onVoltar}
            >
              Voltar
            </button>
          )}

          <button
            type="button"
            className="agenda-primary-button"
            onClick={onNovoAgendamento}
          >
            + Novo agendamento
          </button>
        </div>
      </header>

      <section className="agenda-toolbar">
        <div className="agenda-date-control">
          <label htmlFor="agenda-data">Data</label>

          <input
            id="agenda-data"
            type="date"
            value={dataSelecionada}
            onChange={(event) =>
              setDataSelecionada(event.target.value)
            }
          />
        </div>

        <div className="agenda-day-info">
          <strong>{formatarData(dataSelecionada)}</strong>
          <span>
            {agendamentosDoDia.length}{" "}
            {agendamentosDoDia.length === 1
              ? "atendimento"
              : "atendimentos"}
          </span>
        </div>
      </section>

      {erro && (
        <div className="agenda-error">
          {erro}
        </div>
      )}

      <section className="agenda-content">
        {carregando ? (
          <div className="agenda-empty">
            <div className="agenda-empty-icon">◷</div>
            <strong>Carregando agenda...</strong>
            <p>Aguarde enquanto buscamos os atendimentos.</p>
          </div>
        ) : agendamentosDoDia.length === 0 ? (
          <div className="agenda-empty">
            <div className="agenda-empty-icon">◷</div>
            <strong>Nenhum atendimento neste dia</strong>
            <p>
              Não existem atendimentos ativos para a data selecionada.
            </p>

            <button
              type="button"
              className="agenda-primary-button"
              onClick={onNovoAgendamento}
            >
              + Criar agendamento
            </button>
          </div>
        ) : (
          <div className="agenda-list">
            {agendamentosDoDia.map((agendamento) => {
              const paciente = buscarPaciente(
                agendamento.paciente_id
              );

              const servico = buscarServico(
                agendamento.servico_id
              );

              const profissional = buscarProfissional(
                agendamento.profissional_id
              );

              return (
                <article
                  className="agenda-card"
                  key={agendamento.id}
                >
                  <div className="agenda-time">
                    <strong>
                      {agendamento.hora_inicio.slice(0, 5)}
                    </strong>

                    <span>
                      até {agendamento.hora_fim.slice(0, 5)}
                    </span>
                  </div>

                  <div className="agenda-card-main">
                    <div className="agenda-card-top">
                      <h2>
                        {paciente?.nome ||
                          `Paciente #${agendamento.paciente_id}`}
                      </h2>

                      <span
                        className={`agenda-status agenda-status-${agendamento.status}`}
                      >
                        {STATUS_LABELS[agendamento.status] ||
                          agendamento.status}
                      </span>
                    </div>

                    <div className="agenda-details">
                      <span>
                        <strong>Serviço:</strong>{" "}
                        {servico?.nome ||
                          `Serviço #${agendamento.servico_id}`}
                      </span>

                      <span>
                        <strong>Profissional:</strong>{" "}
                        {profissional?.nome ||
                          `Usuário #${agendamento.profissional_id}`}
                      </span>
                    </div>

                    {agendamento.observacoes && (
                      <p className="agenda-observacoes">
                        {agendamento.observacoes}
                      </p>
                    )}
                  </div>

                  <div className="agenda-card-actions">
                    <button
                      type="button"
                      onClick={() =>
                        onVisualizarAgendamento(
                          agendamento.id
                        )
                      }
                    >
                      Visualizar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onEditarAgendamento(
                          agendamento.id
                        )
                      }
                    >
                      Editar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Agenda;
