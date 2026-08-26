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

function NovoAgendamento({ onVoltar, onSalvo }) {
  const hoje = new Date().toISOString().slice(0, 10);

  const [pacientes, setPacientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);

  const [formulario, setFormulario] = useState({
    paciente_id: "",
    profissional_id: "",
    servico_id: "",
    data: hoje,
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
          pacientesResponse,
          servicosResponse,
          usuariosResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/pacientes`),
          fetch(`${API_URL}/servicos`),
          fetch(`${API_URL}/usuarios`),
        ]);

        if (
          !pacientesResponse.ok ||
          !servicosResponse.ok ||
          !usuariosResponse.ok
        ) {
          throw new Error("Falha ao carregar dados.");
        }

        const [
          pacientesData,
          servicosData,
          usuariosData,
        ] = await Promise.all([
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
      } catch (error) {
        console.error(error);
        setErro(
          "Não foi possível carregar os dados necessários para o agendamento."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  const servicoSelecionado = useMemo(() => {
    return servicos.find(
      (servico) =>
        String(servico.id) === String(formulario.servico_id)
    );
  }, [servicos, formulario.servico_id]);

  useEffect(() => {
    if (!formulario.hora_inicio || !servicoSelecionado) {
      setFormulario((atual) => ({
        ...atual,
        hora_fim: "",
      }));
      return;
    }

    const horaFim = calcularHoraFim(
      formulario.hora_inicio,
      servicoSelecionado.duracao_minutos
    );

    setFormulario((atual) => ({
      ...atual,
      hora_fim: horaFim,
    }));
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

      const response = await fetch(`${API_URL}/agendamentos`, {
        method: "POST",
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
          ativo: true,
        }),
      });

      const dados = await response.json();

      if (!response.ok) {
        throw new Error(
          dados.detail || "Não foi possível criar o agendamento."
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
          <strong>Carregando formulário...</strong>
          <p>Buscando pacientes, serviços e fisioterapeutas.</p>
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

          <h1>Novo agendamento</h1>

          <p>
            Cadastre um novo atendimento na Agenda Cuidare.
          </p>
        </div>

        <button
          type="button"
          className="novo-agendamento-secondary"
          onClick={onVoltar}
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

              <small>
                Calculado automaticamente pela duração do serviço.
              </small>
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
          </div>
        </section>

        <section className="novo-agendamento-card">
          <div className="novo-agendamento-card-header">
            <span>OBSERVAÇÕES</span>
            <h2>Informações adicionais</h2>
          </div>

          <div className="novo-agendamento-field">
            <label htmlFor="observacoes">
              Observações
            </label>

            <textarea
              id="observacoes"
              name="observacoes"
              value={formulario.observacoes}
              onChange={alterarCampo}
              rows="5"
              placeholder="Digite alguma observação sobre o atendimento..."
            />
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
              : "Salvar agendamento"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NovoAgendamento;
