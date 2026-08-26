import "./NovoAgendamento.css";
import { useEffect, useMemo, useState } from "react";

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : `https://${window.location.hostname.replace(
        /-5173\.app\.github\.dev$/,
        "-8000.app.github.dev"
      )}`;

const STATUS_OPTIONS = [
  { value: "agendado", label: "Agendado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "em_atendimento", label: "Em atendimento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
  { value: "faltou", label: "Faltou" },
];

function calcularHoraFim(horaInicio, duracaoMinutos) {
  if (!horaInicio || !duracaoMinutos) return "";

  const [horas, minutos] = horaInicio.split(":").map(Number);

  const inicio = horas * 60 + minutos;
  const fim = inicio + Number(duracaoMinutos);

  if (fim >= 24 * 60) return "";

  const horaFim = Math.floor(fim / 60);
  const minutoFim = fim % 60;

  return `${String(horaFim).padStart(2, "0")}:${String(
    minutoFim
  ).padStart(2, "0")}`;
}

function formatarData(data) {
  if (!data) return "";

  if (data instanceof Date) {
    return data.toISOString().slice(0, 10);
  }

  return String(data).slice(0, 10);
}

function EditarAgendamento({ agendamentoId, onVoltar, onSalvo }) {
  const [pacientes, setPacientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);

  const [formulario, setFormulario] = useState({
    paciente_id: "",
    profissional_id: "",
    servico_id: "",
    data: "",
    hora_inicio: "",
    hora_fim: "",
    status: "agendado",
    observacoes: "",
  });

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        setErro("");

        const [
          agendamentoResponse,
          pacientesResponse,
          servicosResponse,
          usuariosResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/agendamentos/${agendamentoId}`),
          fetch(`${API_URL}/pacientes`),
          fetch(`${API_URL}/servicos`),
          fetch(`${API_URL}/usuarios`),
        ]);

        if (
          !agendamentoResponse.ok ||
          !pacientesResponse.ok ||
          !servicosResponse.ok ||
          !usuariosResponse.ok
        ) {
          throw new Error(
            "Não foi possível carregar os dados do agendamento."
          );
        }

        const [
          agendamento,
          pacientesData,
          servicosData,
          usuariosData,
        ] = await Promise.all([
          agendamentoResponse.json(),
          pacientesResponse.json(),
          servicosResponse.json(),
          usuariosResponse.json(),
        ]);

        setPacientes(
          pacientesData.filter((paciente) => paciente.ativo)
        );

        setServicos(
          servicosData.filter((servico) => servico.ativo)
        );

        setProfissionais(
          usuariosData.filter(
            (usuario) =>
              usuario.status &&
              usuario.perfil === "fisioterapeuta"
          )
        );

        setFormulario({
          paciente_id: String(agendamento.paciente_id),
          profissional_id: String(agendamento.profissional_id),
          servico_id: String(agendamento.servico_id),
          data: formatarData(agendamento.data),
          hora_inicio: String(agendamento.hora_inicio).slice(0, 5),
          hora_fim: String(agendamento.hora_fim).slice(0, 5),
          status: agendamento.status || "agendado",
          observacoes: agendamento.observacoes || "",
        });
      } catch (error) {
        console.error(error);
        setErro(error.message);
      } finally {
        setCarregando(false);
      }
    }

    if (agendamentoId) {
      carregarDados();
    }
  }, [agendamentoId]);

  const servicoSelecionado = useMemo(() => {
    return servicos.find(
      (servico) =>
        String(servico.id) === String(formulario.servico_id)
    );
  }, [servicos, formulario.servico_id]);

  useEffect(() => {
    if (!formulario.hora_inicio || !servicoSelecionado) {
      return;
    }

    const horaFim = calcularHoraFim(
      formulario.hora_inicio,
      servicoSelecionado.duracao_minutos
    );

    if (horaFim) {
      setFormulario((atual) => ({
        ...atual,
        hora_fim: horaFim,
      }));
    }
  }, [formulario.hora_inicio, servicoSelecionado]);

  function alterarCampo(event) {
    const { name, value } = event.target;

    setFormulario((atual) => ({
      ...atual,
      [name]: value,
    }));
  }

  async function salvar(event) {
    event.preventDefault();

    try {
      setErro("");

      if (!formulario.paciente_id) {
        setErro("Selecione um paciente.");
        return;
      }

      if (!formulario.profissional_id) {
        setErro("Selecione um fisioterapeuta.");
        return;
      }

      if (!formulario.servico_id) {
        setErro("Selecione um serviço.");
        return;
      }

      if (!formulario.data) {
        setErro("Informe a data do agendamento.");
        return;
      }

      if (!formulario.hora_inicio) {
        setErro("Informe o horário inicial.");
        return;
      }

      if (!formulario.hora_fim) {
        setErro(
          "Não foi possível calcular o horário final."
        );
        return;
      }

      setSalvando(true);

      const response = await fetch(
        `${API_URL}/agendamentos/${agendamentoId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paciente_id: Number(formulario.paciente_id),
            profissional_id: Number(formulario.profissional_id),
            servico_id: Number(formulario.servico_id),
            data: formulario.data,
            hora_inicio: formulario.hora_inicio,
            hora_fim: formulario.hora_fim,
            status: formulario.status,
            observacoes: formulario.observacoes || null,
          }),
        }
      );

      const dados = await response.json();

      if (!response.ok) {
        throw new Error(
          dados.detail ||
            "Não foi possível atualizar o agendamento."
        );
      }

      if (onSalvo) {
        onSalvo(dados);
      } else if (onVoltar) {
        onVoltar();
      }
    } catch (error) {
      console.error(error);
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="novo-agendamento-page">
        <div className="novo-agendamento-loading">
          <strong>Carregando agendamento...</strong>
          <p>
            Buscando informações do atendimento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="novo-agendamento-page">
      <header className="novo-agendamento-header">
        <div>
          <span className="novo-agendamento-eyebrow">
            AGENDA
          </span>

          <h1>Editar agendamento</h1>

          <p>
            Atualize as informações do atendimento.
          </p>
        </div>

        <button
          type="button"
          className="novo-agendamento-secondary"
          onClick={onVoltar}
          disabled={salvando}
        >
          Voltar
        </button>
      </header>

      <form
        className="novo-agendamento-form"
        onSubmit={salvar}
      >
        {erro && (
          <div className="novo-agendamento-error">
            {erro}
          </div>
        )}

        <section className="novo-agendamento-card">
          <div className="novo-agendamento-card-header">
            <span>ATENDIMENTO</span>
            <h2>Informações do agendamento</h2>
          </div>

          <div className="novo-agendamento-grid">
            <div className="novo-agendamento-field">
              <label htmlFor="paciente_id">
                Paciente
              </label>

              <select
                id="paciente_id"
                name="paciente_id"
                value={formulario.paciente_id}
                onChange={alterarCampo}
                required
              >
                <option value="">
                  Selecione o paciente
                </option>

                {pacientes.map((paciente) => (
                  <option
                    key={paciente.id}
                    value={paciente.id}
                  >
                    {paciente.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="novo-agendamento-field">
              <label htmlFor="servico_id">
                Serviço
              </label>

              <select
                id="servico_id"
                name="servico_id"
                value={formulario.servico_id}
                onChange={alterarCampo}
                required
              >
                <option value="">
                  Selecione o serviço
                </option>

                {servicos.map((servico) => (
                  <option
                    key={servico.id}
                    value={servico.id}
                  >
                    {servico.nome}
                  </option>
                ))}
              </select>

              {servicoSelecionado && (
                <small>
                  Duração:{" "}
                  {servicoSelecionado.duracao_minutos} minutos
                </small>
              )}
            </div>

            <div className="novo-agendamento-field">
              <label htmlFor="profissional_id">
                Fisioterapeuta
              </label>

              <select
                id="profissional_id"
                name="profissional_id"
                value={formulario.profissional_id}
                onChange={alterarCampo}
                required
              >
                <option value="">
                  Selecione o fisioterapeuta
                </option>

                {profissionais.map((profissional) => (
                  <option
                    key={profissional.id}
                    value={profissional.id}
                  >
                    {profissional.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="novo-agendamento-field">
              <label htmlFor="data">
                Data
              </label>

              <input
                id="data"
                name="data"
                type="date"
                value={formulario.data}
                onChange={alterarCampo}
                required
              />
            </div>

            <div className="novo-agendamento-field">
              <label htmlFor="hora_inicio">
                Horário inicial
              </label>

              <input
                id="hora_inicio"
                name="hora_inicio"
                type="time"
                value={formulario.hora_inicio}
                onChange={alterarCampo}
                required
              />
            </div>

            <div className="novo-agendamento-field">
              <label htmlFor="hora_fim">
                Horário final
              </label>

              <input
                id="hora_fim"
                name="hora_fim"
                type="time"
                value={formulario.hora_fim}
                readOnly
              />
            </div>

            <div className="novo-agendamento-field">
              <label htmlFor="status">
                Status
              </label>

              <select
                id="status"
                name="status"
                value={formulario.status}
                onChange={alterarCampo}
                required
              >
                {STATUS_OPTIONS.map((status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="novo-agendamento-field novo-agendamento-field-full">
              <label htmlFor="observacoes">
                Observações
              </label>

              <textarea
                id="observacoes"
                name="observacoes"
                value={formulario.observacoes}
                onChange={alterarCampo}
                rows="4"
                placeholder="Observações sobre o atendimento..."
              />
            </div>
          </div>
        </section>

        <div className="novo-agendamento-actions">
          <button
            type="button"
            className="novo-agendamento-secondary"
            onClick={onVoltar}
            disabled={salvando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="novo-agendamento-primary"
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarAgendamento;
