import { useEffect, useState } from "react";
import { API_URL } from "../config";


const STATUS_LABELS = {
  ativo: "Ativo",
  suspenso: "Suspenso",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

const STATUS_CLASSES = {
  ativo: "status-active",
  suspenso: "status-suspended",
  encerrado: "status-inactive",
  cancelado: "status-inactive",
};

export default function AlunosPilates({ onVoltar }) {
  const [alunos, setAlunos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState(null);

  const [formulario, setFormulario] = useState({
    paciente_id: "",
    plano_id: "",
    data_inicio: "",
    data_fim: "",
    valor_contratado: "",
    desconto_percentual: 0,
    observacoes: "",
  });

  const [formularioEdicao, setFormularioEdicao] = useState({
    data_inicio: "",
    data_fim: "",
    valor_contratado: "",
    status: "ativo",
    observacoes: "",
    dias_carencia: 0,
  });

  async function requisicao(url, options = {}) {
    const token = localStorage.getItem("cuidare_token");

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      let mensagem = "Não foi possível concluir a operação.";

      try {
        const data = await response.json();
        mensagem =
          data?.detail ||
          data?.message ||
          mensagem;
      } catch {
        // Mantém mensagem padrão.
      }

      throw new Error(mensagem);
    }

    return response.json();
  }

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [
        alunosData,
        pacientesData,
        planosData,
      ] = await Promise.all([
        requisicao("/alunos-planos-pilates"),
        requisicao("/pacientes?ativo=true"),
        requisicao("/planos-pilates?ativo=true"),
      ]);

      setAlunos(
        Array.isArray(alunosData)
          ? alunosData
          : []
      );

      setPacientes(
        Array.isArray(pacientesData)
          ? pacientesData
          : []
      );

      setPlanos(
        Array.isArray(planosData)
          ? planosData
          : []
      );
    } catch (error) {
      console.error(error);
      setErro(
        error.message ||
          "Não foi possível carregar os dados."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function adicionarMeses(data, meses) {
    if (!data) return "";

    const partes = data.split("-");
    if (partes.length !== 3) return "";

    const ano = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const dia = Number(partes[2]);

    const dataFinal = new Date(
      ano,
      mes,
      dia
    );

    dataFinal.setMonth(
      dataFinal.getMonth() + meses
    );

    if (dataFinal.getDate() !== dia) {
      dataFinal.setDate(0);
    }

    return [
      dataFinal.getFullYear(),
      String(
        dataFinal.getMonth() + 1
      ).padStart(2, "0"),
      String(
        dataFinal.getDate()
      ).padStart(2, "0"),
    ].join("-");
  }

  function adicionarDias(data, dias) {
    if (!data) return "";

    const partes = data.split("-");
    if (partes.length !== 3) return "";

    const ano = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const dia = Number(partes[2]);

    const dataFinal = new Date(
      ano,
      mes,
      dia
    );

    dataFinal.setDate(
      dataFinal.getDate() +
        Number(dias || 0)
    );

    return [
      dataFinal.getFullYear(),
      String(
        dataFinal.getMonth() + 1
      ).padStart(2, "0"),
      String(
        dataFinal.getDate()
      ).padStart(2, "0"),
    ].join("-");
  }

  function obterQuantidadeMeses(plano) {
    if (!plano) return 1;

    if (plano.periodo === "mensal") return 1;
    if (plano.periodo === "trimestral") return 3;
    if (plano.periodo === "semestral") return 6;

    return 1;
  }

  function obterPlanoSelecionado() {
    return planos.find(
      (item) =>
        String(item.id) ===
        String(formulario.plano_id)
    );
  }

  function calcularValores() {
    const plano = obterPlanoSelecionado();
    const valorPlano = Number(plano?.valor || 0);
    const meses = obterQuantidadeMeses(plano);

    const desconto = Math.min(
      Math.max(
        Number(
          formulario.desconto_percentual || 0
        ),
        0
      ),
      100
    );

    const valorMensal =
      meses > 0
        ? valorPlano / meses
        : valorPlano;

    const valorDesconto =
      valorPlano * (desconto / 100);

    const valorFinal =
      valorPlano - valorDesconto;

    return {
      valorPlano,
      meses,
      desconto,
      valorMensal,
      valorDesconto,
      valorFinal,
    };
  }

  function alterarCampo(event) {
    const { name, value } = event.target;

    if (name === "plano_id") {
      const plano = planos.find(
        (item) =>
          String(item.id) === String(value)
      );

      setFormulario((atual) => ({
        ...atual,
        plano_id: value,
        valor_contratado:
          plano?.valor ?? "",
        desconto_percentual: 0,
        data_fim: atual.data_inicio
          ? adicionarMeses(
              atual.data_inicio,
              obterQuantidadeMeses(plano)
            )
          : "",
      }));

      return;
    }

    if (name === "data_inicio") {
      const plano = obterPlanoSelecionado();

      setFormulario((atual) => ({
        ...atual,
        data_inicio: value,
        data_fim: value
          ? adicionarMeses(
              value,
              obterQuantidadeMeses(plano)
            )
          : "",
      }));

      return;
    }

    if (name === "desconto_percentual") {
      const desconto = Math.min(
        Math.max(Number(value || 0), 0),
        100
      );

      const plano = obterPlanoSelecionado();
      const valorPlano = Number(
        plano?.valor || 0
      );

      const valorFinal =
        valorPlano -
        valorPlano * (desconto / 100);

      setFormulario((atual) => ({
        ...atual,
        desconto_percentual: desconto,
        valor_contratado:
          valorFinal.toFixed(2),
      }));

      return;
    }

    setFormulario((atual) => ({
      ...atual,
      [name]: value,
    }));
  }

  async function matricularAluno(event) {
    event.preventDefault();

    if (
      !formulario.paciente_id ||
      !formulario.plano_id ||
      !formulario.data_inicio ||
      !formulario.data_fim
    ) {
      setErro(
        "Preencha aluno, plano, data de início e data de término."
      );
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      await requisicao(
        "/alunos-planos-pilates",
        {
          method: "POST",
          body: JSON.stringify({
            paciente_id: Number(
              formulario.paciente_id
            ),
            plano_id: Number(
              formulario.plano_id
            ),
            data_inicio:
              formulario.data_inicio,
            data_fim:
              formulario.data_fim,
            valor_contratado: Number(
              formulario.valor_contratado || 0
            ),
            observacoes:
              formulario.observacoes ||
              null,
          }),
        }
      );

      setFormulario({
        paciente_id: "",
        plano_id: "",
        data_inicio: "",
        data_fim: "",
        valor_contratado: "",
        desconto_percentual: 0,
        observacoes: "",
      });

      await carregarDados();
    } catch (error) {
      console.error(error);
      setErro(
        error.message ||
          "Não foi possível matricular o aluno."
      );
    } finally {
      setSalvando(false);
    }
  }

  function abrirEdicao(aluno) {
    setAlunoEditando(aluno);

    setFormularioEdicao({
      data_inicio:
        aluno.data_inicio || "",
      data_fim:
        aluno.data_fim || "",
      valor_contratado:
        aluno.valor_contratado ?? "",
      status:
        aluno.status || "ativo",
      observacoes:
        aluno.observacoes || "",
      dias_carencia: 0,
    });

    setErro("");
    setModalEdicaoAberto(true);
  }

  function fecharEdicao() {
    if (salvando) return;

    setModalEdicaoAberto(false);
    setAlunoEditando(null);
  }

  function alterarEdicao(event) {
    const { name, value } = event.target;

    setFormularioEdicao((atual) => ({
      ...atual,
      [name]: value,
    }));
  }

  function aplicarCarencia() {
    const dias = Math.max(
      Number(
        formularioEdicao.dias_carencia || 0
      ),
      0
    );

    if (!dias) return;

    setFormularioEdicao((atual) => ({
      ...atual,
      data_fim: adicionarDias(
        atual.data_fim,
        dias
      ),
      dias_carencia: 0,
    }));
  }

  function suspenderPlano() {
    setFormularioEdicao((atual) => ({
      ...atual,
      status: "suspenso",
    }));
  }

  function reativarPlano() {
    setFormularioEdicao((atual) => ({
      ...atual,
      status: "ativo",
    }));
  }

  async function salvarEdicao(event) {
    event.preventDefault();

    if (!alunoEditando) return;

    if (
      formularioEdicao.data_inicio &&
      formularioEdicao.data_fim &&
      formularioEdicao.data_fim <
        formularioEdicao.data_inicio
    ) {
      setErro(
        "A data de término não pode ser anterior à data de início."
      );
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      await requisicao(
        `/alunos-planos-pilates/${alunoEditando.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            data_inicio:
              formularioEdicao.data_inicio,
            data_fim:
              formularioEdicao.data_fim,
            valor_contratado: Number(
              formularioEdicao.valor_contratado ||
                0
            ),
            status:
              formularioEdicao.status,
            observacoes:
              formularioEdicao.observacoes ||
              null,
            ativo:
              formularioEdicao.status ===
              "ativo",
          }),
        }
      );

      fecharEdicao();
      await carregarDados();
    } catch (error) {
      console.error(error);
      setErro(
        error.message ||
          "Não foi possível atualizar a matrícula."
      );
    } finally {
      setSalvando(false);
    }
  }

  function obterNomeAluno(aluno) {
    return (
      aluno.paciente_nome ||
      aluno.paciente?.nome ||
      `Paciente #${aluno.paciente_id}`
    );
  }

  function obterNomePlano(aluno) {
    return (
      aluno.plano_nome ||
      aluno.plano?.nome ||
      `Plano #${aluno.plano_id}`
    );
  }

  function formatarData(data) {
    if (!data) return "-";

    const partes = String(data).split("-");

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function formatarValor(valor) {
    return Number(valor || 0).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  function obterStatusClasse(status) {
    return (
      STATUS_CLASSES[status] ||
      "status-inactive"
    );
  }

  function obterStatusLabel(status) {
    return (
      STATUS_LABELS[status] ||
      status ||
      "Ativo"
    );
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">
            PILATES • ALUNOS
          </span>

          <h2>Alunos de Pilates</h2>

          <p>
            Gerencie as matrículas, planos
            contratados e aulas disponíveis.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onVoltar}
          >
            ← Voltar para Serviços
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              document
                .getElementById(
                  "matricula-pilates"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            + Matricular aluno
          </button>
        </div>
      </div>

      {erro && (
        <div className="error-message">
          {erro}
        </div>
      )}

      <div
        id="matricula-pilates"
        className="content-card"
      >
        <div className="content-card-header">
          <div>
            <strong>Nova matrícula</strong>

            <span>
              Vincule um paciente a um plano
              de Pilates ativo.
            </span>
          </div>
        </div>

        <form
          className="form-grid"
          onSubmit={matricularAluno}
        >
          <div className="form-group">
            <label>Aluno</label>

            <select
              name="paciente_id"
              value={formulario.paciente_id}
              onChange={alterarCampo}
              required
            >
              <option value="">
                Selecione o aluno
              </option>

              {pacientes.map(
                (paciente) => (
                  <option
                    key={paciente.id}
                    value={paciente.id}
                  >
                    {paciente.nome}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-group">
            <label>
              Plano de Pilates
            </label>

            <select
              name="plano_id"
              value={formulario.plano_id}
              onChange={alterarCampo}
              required
            >
              <option value="">
                Selecione o plano
              </option>

              {planos.map((plano) => (
                <option
                  key={plano.id}
                  value={plano.id}
                >
                  {plano.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              Data de início
            </label>

            <input
              type="date"
              name="data_inicio"
              value={formulario.data_inicio}
              onChange={alterarCampo}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Data de término
            </label>

            <input
              type="date"
              name="data_fim"
              value={formulario.data_fim}
              onChange={alterarCampo}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Valor contratado
            </label>

            <input
              type="number"
              name="valor_contratado"
              value={
                formulario.valor_contratado
              }
              onChange={alterarCampo}
              min="0"
              step="0.01"
              placeholder="0,00"
            />
          </div>

          {formulario.plano_id && (
            <div className="pilates-financeiro-card">
              <div className="pilates-financeiro-header">
                <div>
                  <span className="card-label">
                    CONDIÇÃO DO PLANO
                  </span>

                  <strong>
                    {obterPlanoSelecionado()
                      ?.nome ||
                      "Plano de Pilates"}
                  </strong>
                </div>
              </div>

              <div className="pilates-financeiro-grid">
                <div className="pilates-financeiro-item">
                  <span>
                    Valor mensal
                  </span>

                  <strong>
                    {formatarValor(
                      calcularValores()
                        .valorMensal
                    )}
                  </strong>

                  <small>
                    Valor mensal equivalente
                  </small>
                </div>

                <div className="pilates-financeiro-item">
                  <span>
                    Valor do plano
                  </span>

                  <strong>
                    {formatarValor(
                      calcularValores()
                        .valorPlano
                    )}
                  </strong>

                  <small>
                    {calcularValores().meses}{" "}
                    {calcularValores()
                      .meses === 1
                      ? "mês"
                      : "meses"}
                  </small>
                </div>

                <div className="pilates-financeiro-item destaque-desconto">
                  <label htmlFor="desconto_percentual">
                    Desconto do plano
                  </label>

                  <div className="desconto-input">
                    <input
                      id="desconto_percentual"
                      type="number"
                      name="desconto_percentual"
                      value={
                        formulario.desconto_percentual
                      }
                      onChange={alterarCampo}
                      min="0"
                      max="100"
                      step="1"
                    />

                    <span>%</span>
                  </div>

                  <small>
                    Economia de{" "}
                    {formatarValor(
                      calcularValores()
                        .valorDesconto
                    )}
                  </small>
                </div>

                <div className="pilates-financeiro-total">
                  <span>
                    Total com desconto
                  </span>

                  <strong>
                    {formatarValor(
                      calcularValores()
                        .valorFinal
                    )}
                  </strong>

                  {calcularValores()
                    .desconto > 0 && (
                    <small>
                      Cliente economiza{" "}
                      {formatarValor(
                        calcularValores()
                          .valorDesconto
                      )}
                    </small>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>
              Observações
            </label>

            <input
              type="text"
              name="observacoes"
              value={
                formulario.observacoes
              }
              onChange={alterarCampo}
              placeholder="Observações da matrícula"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={salvando}
            >
              {salvando
                ? "Salvando..."
                : "Matricular aluno"}
            </button>
          </div>
        </form>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <div>
            <strong>
              Alunos matriculados
            </strong>

            <span>
              Acompanhe e gerencie os planos
              atuais dos alunos.
            </span>
          </div>

          <span className="card-label">
            {alunos.length}{" "}
            {alunos.length === 1
              ? "aluno"
              : "alunos"}
          </span>
        </div>

        {carregando ? (
          <div className="empty-state">
            Carregando alunos...
          </div>
        ) : alunos.length === 0 ? (
          <div className="empty-state">
            <strong>
              Nenhum aluno de Pilates
              matriculado.
            </strong>

            <span>
              Utilize o formulário acima
              para criar a primeira matrícula.
            </span>
          </div>
        ) : (
          <div className="alunos-pilates-lista">
            {alunos.map((aluno) => {
              const status =
                aluno.status || "ativo";

              return (
                <article
                  key={aluno.id}
                  className={`aluno-pilates-card ${
                    status !== "ativo"
                      ? "aluno-pilates-card-inativo"
                      : ""
                  }`}
                >
                  <div className="aluno-pilates-identificacao">
                    <strong>
                      {obterNomeAluno(aluno)}
                    </strong>

                    <small>
                      Matrícula #{aluno.id}
                    </small>
                  </div>

                  <div className="aluno-pilates-dado">
                    <span>Plano</span>

                    <strong>
                      {obterNomePlano(aluno)}
                    </strong>
                  </div>

                  <div className="aluno-pilates-dado">
                    <span>
                      Frequência
                    </span>

                    <strong>
                      {aluno.frequencia_semanal
                        ? `${aluno.frequencia_semanal}x/semana`
                        : "-"}
                    </strong>
                  </div>

                  <div className="aluno-pilates-dado periodo">
                    <span>Período</span>

                    <strong>
                      {formatarData(
                        aluno.data_inicio
                      )}
                      {" → "}
                      {formatarData(
                        aluno.data_fim
                      )}
                    </strong>
                  </div>

                  <div className="aluno-pilates-dado aulas">
                    <span>Aulas</span>

                    <strong>
                      {aluno.aulas_utilizadas ||
                        0}
                      /
                      {aluno.aulas_previstas ||
                        0}
                    </strong>

                    <small>
                      {aluno.aulas_restantes ??
                        0}{" "}
                      restantes
                    </small>
                  </div>

                  <div className="aluno-pilates-dado valor">
                    <span>Valor</span>

                    <strong>
                      {formatarValor(
                        aluno.valor_contratado
                      )}
                    </strong>
                  </div>

                  <div className="aluno-pilates-status">
                    <span
                      className={`status-badge ${obterStatusClasse(
                        status
                      )}`}
                    >
                      {obterStatusLabel(
                        status
                      )}
                    </span>
                  </div>

                  <div className="aluno-pilates-acoes">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        abrirEdicao(aluno)
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
      </div>

      {modalEdicaoAberto &&
        alunoEditando && (
          <div
            className="modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                fecharEdicao();
              }
            }}
          >
            <div className="modal-card modal-card-pilates">
              <div className="modal-header">
                <div>
                  <span className="card-label">
                    PILATES • MATRÍCULA
                  </span>

                  <h3>
                    Editar aluno
                  </h3>

                  <p>
                    {obterNomeAluno(
                      alunoEditando
                    )}{" "}
                    •{" "}
                    {obterNomePlano(
                      alunoEditando
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={fecharEdicao}
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={salvarEdicao}
              >
                <div className="pilates-edicao-resumo">
                  <div>
                    <span>
                      Aulas previstas
                    </span>

                    <strong>
                      {alunoEditando.aulas_previstas ??
                        0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Aulas utilizadas
                    </span>

                    <strong>
                      {alunoEditando.aulas_utilizadas ??
                        0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Aulas restantes
                    </span>

                    <strong>
                      {alunoEditando.aulas_restantes ??
                        0}
                    </strong>
                  </div>
                </div>

                <div className="pilates-edicao-bloco">
                  <div className="pilates-edicao-bloco-header">
                    <div>
                      <span className="card-label">
                        PERÍODO
                      </span>

                      <strong>
                        Período da matrícula
                      </strong>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>
                        Data de início
                      </label>

                      <input
                        type="date"
                        name="data_inicio"
                        value={
                          formularioEdicao.data_inicio
                        }
                        onChange={
                          alterarEdicao
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Data de término
                      </label>

                      <input
                        type="date"
                        name="data_fim"
                        value={
                          formularioEdicao.data_fim
                        }
                        onChange={
                          alterarEdicao
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Dias de carência /
                        prorrogação
                      </label>

                      <div className="pilates-carencia-controle">
                        <input
                          type="number"
                          name="dias_carencia"
                          value={
                            formularioEdicao.dias_carencia
                          }
                          onChange={
                            alterarEdicao
                          }
                          min="0"
                          step="1"
                          placeholder="Ex.: 15"
                        />

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={
                            aplicarCarencia
                          }
                        >
                          + Aplicar dias
                        </button>
                      </div>

                      <small>
                        Os dias serão
                        acrescentados
                        automaticamente à
                        data de término.
                      </small>
                    </div>
                  </div>
                </div>

                <div className="pilates-edicao-bloco">
                  <div className="pilates-edicao-bloco-header">
                    <div>
                      <span className="card-label">
                        SITUAÇÃO
                      </span>

                      <strong>
                        Situação do plano
                      </strong>
                    </div>
                  </div>

                  <div className="pilates-status-acoes">
                    <button
                      type="button"
                      className={
                        formularioEdicao.status ===
                        "ativo"
                          ? "primary-button"
                          : "secondary-button"
                      }
                      onClick={
                        reativarPlano
                      }
                    >
                      🟢 Ativo
                    </button>

                    <button
                      type="button"
                      className={
                        formularioEdicao.status ===
                        "suspenso"
                          ? "primary-button"
                          : "secondary-button"
                      }
                      onClick={
                        suspenderPlano
                      }
                    >
                      🟡 Suspender
                    </button>

                    <button
                      type="button"
                      className={
                        formularioEdicao.status ===
                        "encerrado"
                          ? "primary-button"
                          : "secondary-button"
                      }
                      onClick={() =>
                        setFormularioEdicao(
                          (atual) => ({
                            ...atual,
                            status:
                              "encerrado",
                          })
                        )
                      }
                    >
                      ⚫ Encerrar
                    </button>

                    <button
                      type="button"
                      className={
                        formularioEdicao.status ===
                        "cancelado"
                          ? "primary-button"
                          : "secondary-button"
                      }
                      onClick={() =>
                        setFormularioEdicao(
                          (atual) => ({
                            ...atual,
                            status:
                              "cancelado",
                          })
                        )
                      }
                    >
                      🔴 Cancelar
                    </button>
                  </div>
                </div>

                <div className="pilates-edicao-bloco">
                  <div className="pilates-edicao-bloco-header">
                    <div>
                      <span className="card-label">
                        FINANCEIRO
                      </span>

                      <strong>
                        Condição da matrícula
                      </strong>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>
                        Valor contratado
                      </label>

                      <input
                        type="number"
                        name="valor_contratado"
                        value={
                          formularioEdicao.valor_contratado
                        }
                        onChange={
                          alterarEdicao
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="pilates-edicao-bloco">
                  <div className="form-group">
                    <label>
                      Observações
                    </label>

                    <textarea
                      name="observacoes"
                      value={
                        formularioEdicao.observacoes
                      }
                      onChange={
                        alterarEdicao
                      }
                      rows="3"
                      placeholder="Registre o motivo da alteração, suspensão, prorrogação ou outras informações importantes."
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      fecharEdicao
                    }
                    disabled={salvando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={salvando}
                  >
                    {salvando
                      ? "Salvando..."
                      : "Salvar alterações"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </section>
  );
}
