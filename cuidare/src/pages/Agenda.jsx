import "./Agenda.css";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config";

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

function obterToken() {
  return localStorage.getItem("cuidare_token");
}

function Agenda({
  onVoltar,
  onNovoAgendamento,
  onEditarAgendamento,
  onVisualizarAgendamento,
}) {
  const hoje = new Date().toISOString().slice(0, 10);

  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [agendamentos, setAgendamentos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [registrandoPresenca, setRegistrandoPresenca] = useState(null);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const token = obterToken();

      if (!token) {
        throw new Error("Token de acesso não encontrado.");
      }

      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [
        agendamentosResponse,
        pacientesResponse,
        servicosResponse,
        usuariosResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/agendamentos`, { headers }),
        fetch(`${API_URL}/pacientes`, { headers }),
        fetch(`${API_URL}/servicos`, { headers }),
        fetch(`${API_URL}/usuarios`, { headers }),
      ]);

      if (
        !agendamentosResponse.ok ||
        !pacientesResponse.ok ||
        !servicosResponse.ok ||
        !usuariosResponse.ok
      ) {
        const respostas = [
          ["agendamentos", agendamentosResponse],
          ["pacientes", pacientesResponse],
          ["servicos", servicosResponse],
          ["usuarios", usuariosResponse],
        ];

        const respostaComErro = respostas.find(
          ([, response]) => !response.ok
        );

        if (respostaComErro) {
          const [nomeEndpoint, response] = respostaComErro;
          let detalhe = "";

          try {
            const dadosErro = await response.json();
            detalhe =
              typeof dadosErro?.detail === "string"
                ? ` ${dadosErro.detail}`
                : "";
          } catch {
            // Mantém a mensagem padrão caso a API não retorne JSON.
          }

          throw new Error(
            `Erro ao carregar ${nomeEndpoint}: HTTP ${response.status}.${detalhe}`
          );
        }

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

      setAgendamentos(
        Array.isArray(agendamentosData) ? agendamentosData : []
      );
      setPacientes(Array.isArray(pacientesData) ? pacientesData : []);
      setServicos(Array.isArray(servicosData) ? servicosData : []);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
    } catch (error) {
      console.error("Erro ao carregar Agenda:", error);

      setErro(
        error?.message ||
          "Não foi possível carregar a Agenda. Verifique se a API está funcionando."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function registrarPresenca(agendamento) {
    if (agendamento.status === "concluido") {
      return;
    }

    if (["cancelado", "faltou"].includes(agendamento.status)) {
      return;
    }

    try {
      setRegistrandoPresenca(agendamento.id);
      setErro("");

      const token = obterToken();

      if (!token) {
        throw new Error("Token de acesso não encontrado.");
      }

      const response = await fetch(
        `${API_URL}/agendamentos/${agendamento.id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "concluido",
          }),
        }
      );

      let dados = null;

      try {
        dados = await response.json();
      } catch {
        // Mantém a mensagem padrão caso a API não retorne JSON.
      }

      if (!response.ok) {
        throw new Error(
          typeof dados?.detail === "string"
            ? dados.detail
            : "Não foi possível registrar a presença."
        );
      }

      setAgendamentos((anteriores) =>
        anteriores.map((item) =>
          item.id === agendamento.id
            ? { ...item, ...dados, status: "concluido" }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao registrar presença:", error);
      setErro(
        error?.message || "Não foi possível registrar a presença."
      );
    } finally {
      setRegistrandoPresenca(null);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const agendamentosDoDia = useMemo(() => {
    return agendamentos
      .filter(
        (agendamento) =>
          agendamento.data === dataSelecionada && agendamento.ativo
      )
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
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
            Organize os horários, pacientes, serviços e profissionais da Cuidare.
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
            onChange={(event) => setDataSelecionada(event.target.value)}
          />
        </div>

        <div className="agenda-day-info">
          <strong>{formatarData(dataSelecionada)}</strong>
          <span>
            {agendamentosDoDia.length}{" "}
            {agendamentosDoDia.length === 1 ? "atendimento" : "atendimentos"}
          </span>
        </div>
      </section>

      {erro && <div className="agenda-error">{erro}</div>}

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
            <p>Não existem atendimentos ativos para a data selecionada.</p>
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
              const paciente = buscarPaciente(agendamento.paciente_id);
              const servico = buscarServico(agendamento.servico_id);
              const profissional = buscarProfissional(agendamento.profissional_id);
              const podeRegistrarPresenca = ![
                "concluido",
                "cancelado",
                "faltou",
              ].includes(agendamento.status);

              return (
                <article className="agenda-card" key={agendamento.id}>
                  <div className="agenda-time">
                    <strong>
                      {agendamento.hora_inicio
                        ? agendamento.hora_inicio.slice(0, 5)
                        : "--:--"}
                    </strong>
                    <span>
                      até {agendamento.hora_fim
                        ? agendamento.hora_fim.slice(0, 5)
                        : "--:--"}
                    </span>
                  </div>

                  <div className="agenda-card-main">
                    <div className="agenda-card-top">
                      <h2>
                        {paciente?.nome || `Paciente #${agendamento.paciente_id}`}
                      </h2>
                      <span
                        className={`agenda-status agenda-status-${agendamento.status}`}
                      >
                        {STATUS_LABELS[agendamento.status] || agendamento.status}
                      </span>
                    </div>

                    <div className="agenda-details">
                      <span>
                        <strong>Serviço:</strong>{" "}
                        {servico?.nome || `Serviço #${agendamento.servico_id}`}
                      </span>
                      <span>
                        <strong>Profissional:</strong>{" "}
                        {profissional?.nome ||
                          `Usuário #${agendamento.profissional_id}`}
                      </span>
                      {agendamento.tipo_atendimento && (
                        <span>
                          <strong>Tipo:</strong>{" "}
                          {agendamento.tipo_atendimento === "cortesia"
                            ? "Cortesia"
                            : agendamento.tipo_atendimento === "plano"
                              ? "Plano"
                              : agendamento.tipo_atendimento === "avulsa"
                                ? "Avulsa"
                                : agendamento.tipo_atendimento === "experimental"
                                  ? "Experimental"
                                  : "Normal"}
                        </span>
                      )}
                    </div>

                    {agendamento.tipo_atendimento === "cortesia" &&
                      (agendamento.motivo_cortesia ||
                        agendamento.campanha_cortesia) && (
                        <p className="agenda-observacoes">
                          {agendamento.motivo_cortesia &&
                            `Motivo: ${agendamento.motivo_cortesia}`}
                          {agendamento.motivo_cortesia &&
                            agendamento.campanha_cortesia &&
                            " • "}
                          {agendamento.campanha_cortesia &&
                            `Campanha: ${agendamento.campanha_cortesia}`}
                        </p>
                      )}

                    {agendamento.observacoes && (
                      <p className="agenda-observacoes">
                        {agendamento.observacoes}
                      </p>
                    )}
                  </div>

                  <div className="agenda-card-actions">
                    {podeRegistrarPresenca && (
                      <button
                        type="button"
                        onClick={() => registrarPresenca(agendamento)}
                        disabled={registrandoPresenca === agendamento.id}
                      >
                        {registrandoPresenca === agendamento.id
                          ? "Registrando..."
                          : "✓ Presença"}
                      </button>
                    )}

                    {agendamento.status === "concluido" && (
                      <span className="agenda-presenca-registrada">
                        ✓ Presente
                      </span>
                    )}

                    {onVisualizarAgendamento && (
                      <button
                        type="button"
                        onClick={() => onVisualizarAgendamento(agendamento.id)}
                      >
                        Visualizar
                      </button>
                    )}

                    {onEditarAgendamento && (
                      <button
                        type="button"
                        onClick={() => onEditarAgendamento(agendamento.id)}
                      >
                        Editar
                      </button>
                    )}
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
