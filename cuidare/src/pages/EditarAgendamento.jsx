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

const TIPOS_ATENDIMENTO = [
  { value: "normal", label: "Normal" },
  { value: "plano", label: "Plano de Pilates" },
  { value: "avulsa", label: "Aula avulsa" },
  { value: "experimental", label: "Aula experimental" },
  { value: "cortesia", label: "Cortesia / Brinde" },
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
  const [planosAluno, setPlanosAluno] = useState([]);

  const [formulario, setFormulario] = useState({
    paciente_id: "",
    profissional_id: "",
    servico_id: "",
    data: "",
    hora_inicio: "",
    hora_fim: "",
    status: "agendado",
    tipo_atendimento: "normal",
    aluno_plano_id: "",
    motivo_cortesia: "",
    campanha_cortesia: "",
    observacoes: "",
  });

  const [carregando, setCarregando] = useState(true);
  const [carregandoPlanos, setCarregandoPlanos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        setErro("");

        const token = localStorage.getItem("cuidare_token");

        const headers = token
          ? {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            }
          : {
              Accept: "application/json",
            };

        const [
          agendamentoResponse,
          pacientesResponse,
          servicosResponse,
          usuariosResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/agendamentos/${agendamentoId}`, {
            headers,
          }),
          fetch(`${API_URL}/pacientes`, { headers }),
          fetch(`${API_URL}/servicos`, { headers }),
          fetch(`${API_URL}/usuarios`, { headers }),
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
          Array.isArray(pacientesData)
            ? pacientesData.filter((paciente) => paciente.ativo)
            : []
        );

        setServicos(
          Array.isArray(servicosData)
            ? servicosData.filter((servico) => servico.ativo)
            : []
        );

        setProfissionais(
          Array.isArray(usuariosData)
            ? usuariosData.filter(
                (usuario) =>
                  usuario.status &&
                  usuario.perfil === "fisioterapeuta"
              )
            : []
        );

        setFormulario({
          paciente_id: String(agendamento.paciente_id),
          profissional_id: String(agendamento.profissional_id),
          servico_id: String(agendamento.servico_id),
          data: formatarData(agendamento.data),
          hora_inicio: String(agendamento.hora_inicio).slice(0, 5),
          hora_fim: String(agendamento.hora_fim).slice(0, 5),
          status: agendamento.status || "agendado",
          tipo_atendimento:
            agendamento.tipo_atendimento || "normal",
          aluno_plano_id: agendamento.aluno_plano_id
            ? String(agendamento.aluno_plano_id)
            : "",
          motivo_cortesia:
            agendamento.motivo_cortesia || "",
          campanha_cortesia:
            agendamento.campanha_cortesia || "",
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

  useEffect(() => {
    async function carregarPlanosDoPaciente() {
      if (!formulario.paciente_id) {
        setPlanosAluno([]);
        return;
      }

      try {
        setCarregandoPlanos(true);

        const token = localStorage.getItem("cuidare_token");

        const response = await fetch(
          `${API_URL}/alunos-planos-pilates?paciente_id=${formulario.paciente_id}`,
          {
            headers: token
              ? {
                  Accept: "application/json",
                  Authorization: `Bearer ${token}`,
                }
              : {
                  Accept: "application/json",
                },
          }
        );

        if (!response.ok) {
          throw new Error("Não foi possível carregar os planos do paciente.");
        }

        const dados = await response.json();

        const planos = Array.isArray(dados)
          ? dados.filter(
              (plano) =>
                plano.ativo &&
                plano.status === "ativo" &&
                (
                  Number(plano.aulas_restantes ?? 0) > 0 ||
                  String(plano.id) ===
                    String(formulario.aluno_plano_id)
                )
            )
          : [];

        setPlanosAluno(planos);
      } catch (error) {
        console.error(error);
        setPlanosAluno([]);
      } finally {
        setCarregandoPlanos(false);
      }
    }

    carregarPlanosDoPaciente();
  }, [
    formulario.paciente_id,
    formulario.aluno_plano_id,
  ]);

  const servicoSelecionado = useMemo(() => {
    return servicos.find(
      (servico) =>
        String(servico.id) === String(formulario.servico_id)
    );
  }, [servicos, formulario.servico_id]);

  const planoSelecionado = useMemo(() => {
    return planosAluno.find(
      (plano) =>
        String(plano.id) === String(formulario.aluno_plano_id)
    );
  }, [planosAluno, formulario.aluno_plano_id]);

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

    setFormulario((atual) => {
      const novoFormulario = {
        ...atual,
        [name]: value,
      };

      if (name === "paciente_id") {
        novoFormulario.aluno_plano_id = "";
      }

      if (name === "tipo_atendimento") {
        if (value !== "plano") {
          novoFormulario.aluno_plano_id = "";
        }

        if (value !== "cortesia") {
          novoFormulario.motivo_cortesia = "";
          novoFormulario.campanha_cortesia = "";
        }
      }

      return novoFormulario;
    });
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

      if (
        formulario.tipo_atendimento === "plano" &&
        !formulario.aluno_plano_id
      ) {
        setErro("Selecione o plano de Pilates do paciente.");
        return;
      }

      if (
        formulario.tipo_atendimento === "cortesia" &&
        !formulario.motivo_cortesia.trim()
      ) {
        setErro("Informe o motivo da cortesia.");
        return;
      }

      setSalvando(true);

      const token = localStorage.getItem("cuidare_token");

      const response = await fetch(
        `${API_URL}/agendamentos/${agendamentoId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          body: JSON.stringify({
            paciente_id: Number(formulario.paciente_id),
            profissional_id: Number(formulario.profissional_id),
            servico_id: Number(formulario.servico_id),
            data: formulario.data,
            hora_inicio: formulario.hora_inicio,
            hora_fim: formulario.hora_fim,
            status: formulario.status,
            tipo_atendimento:
              formulario.tipo_atendimento,
            aluno_plano_id:
              formulario.tipo_atendimento === "plano"
                ? Number(formulario.aluno_plano_id)
                : null,
            motivo_cortesia:
              formulario.tipo_atendimento === "cortesia"
                ? formulario.motivo_cortesia.trim() || null
                : null,
            campanha_cortesia:
              formulario.tipo_atendimento === "cortesia"
                ? formulario.campanha_cortesia.trim() || null
                : null,
            observacoes:
              formulario.observacoes || null,
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

  const ehCortesia =
    formulario.tipo_atendimento === "cortesia";

  const ehPlano =
    formulario.tipo_atendimento === "plano";

  const ehAvulsa =
    formulario.tipo_atendimento === "avulsa";

  const ehExperimental =
    formulario.tipo_atendimento === "experimental";

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
                  {ehAvulsa &&
                    ` • Valor: R$ ${Number(
                      servicoSelecionado.valor || 0
                    ).toFixed(2).replace(".", ",")}`}
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

            <div className="novo-agendamento-field">
              <label htmlFor="tipo_atendimento">
                Tipo de atendimento
              </label>

              <select
                id="tipo_atendimento"
                name="tipo_atendimento"
                value={formulario.tipo_atendimento}
                onChange={alterarCampo}
              >
                {TIPOS_ATENDIMENTO.map((tipo) => (
                  <option
                    key={tipo.value}
                    value={tipo.value}
                  >
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {ehPlano && (
              <div className="novo-agendamento-field novo-agendamento-field-full">
                <label htmlFor="aluno_plano_id">
                  Plano de Pilates
                </label>

                <select
                  id="aluno_plano_id"
                  name="aluno_plano_id"
                  value={formulario.aluno_plano_id}
                  onChange={alterarCampo}
                  required
                  disabled={
                    !formulario.paciente_id ||
                    carregandoPlanos
                  }
                >
                  <option value="">
                    {carregandoPlanos
                      ? "Carregando planos..."
                      : planosAluno.length === 0
                      ? "Nenhum plano disponível"
                      : "Selecione o plano"}
                  </option>

                  {planosAluno.map((plano) => (
                    <option
                      key={plano.id}
                      value={plano.id}
                    >
                      {plano.nome ||
                        `Plano #${plano.plano_id}`}{" "}
                      • {plano.aulas_restantes} aula(s) restante(s)
                    </option>
                  ))}
                </select>

                {planoSelecionado && (
                  <small>
                    {planoSelecionado.aulas_utilizadas} de{" "}
                    {planoSelecionado.aulas_previstas} aulas utilizadas
                    {" • "}
                    {planoSelecionado.aulas_restantes} restantes
                  </small>
                )}
              </div>
            )}

            {ehAvulsa && (
              <div className="novo-agendamento-field novo-agendamento-field-full">
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#f5f8f7",
                    border: "1px solid #dce7e3",
                    fontSize: "14px",
                  }}
                >
                  <strong>Aula avulsa</strong>
                  <br />
                  Ao concluir o atendimento, o sistema criará
                  automaticamente a Conta a Receber com o valor
                  do serviço.
                </div>
              </div>
            )}

            {ehExperimental && (
              <div className="novo-agendamento-field novo-agendamento-field-full">
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#f5f8f7",
                    border: "1px solid #dce7e3",
                    fontSize: "14px",
                  }}
                >
                  <strong>Aula experimental</strong>
                  <br />
                  Não consome aulas de plano e não gera cobrança
                  automática.
                </div>
              </div>
            )}

            {ehCortesia && (
              <>
                <div className="novo-agendamento-field">
                  <label htmlFor="motivo_cortesia">
                    Motivo da cortesia
                  </label>

                  <input
                    id="motivo_cortesia"
                    name="motivo_cortesia"
                    type="text"
                    value={formulario.motivo_cortesia}
                    onChange={alterarCampo}
                    placeholder="Ex.: Sorteio, parceria, ação promocional..."
                    maxLength="255"
                    required
                  />
                </div>

                <div className="novo-agendamento-field">
                  <label htmlFor="campanha_cortesia">
                    Campanha / origem
                  </label>

                  <input
                    id="campanha_cortesia"
                    name="campanha_cortesia"
                    type="text"
                    value={formulario.campanha_cortesia}
                    onChange={alterarCampo}
                    placeholder="Ex.: Dia das Mães 2027"
                    maxLength="150"
                  />
                </div>

                <div className="novo-agendamento-field novo-agendamento-field-full">
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "#f5f8f7",
                      border: "1px solid #dce7e3",
                      fontSize: "14px",
                    }}
                  >
                    <strong>Atendimento de cortesia</strong>
                    <br />
                    Este atendimento ocupa a Agenda, mas não
                    gera receita ou lançamento no Caixa.
                  </div>
                </div>
              </>
            )}

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
