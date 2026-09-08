import { useEffect, useState } from "react";
import "./Prontuario.css";

const API_URL =
  "https://humble-waddle-97x5v4vpg7j73ppxq-8000.app.github.dev";

function Prontuario({
  pacienteId,
  onVoltar,
}) {
  const [paciente, setPaciente] = useState(null);
  const [prontuario, setProntuario] = useState(null);
  const [evolucoes, setEvolucoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [queixaPrincipal, setQueixaPrincipal] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [objetivos, setObjetivos] = useState("");
  const [condutas, setCondutas] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [novaEvolucao, setNovaEvolucao] = useState("");

  const [iaCarregando, setIaCarregando] = useState(false);
  const [iaErro, setIaErro] = useState("");
  const [iaResultado, setIaResultado] = useState(null);

  function obterToken() {
    return localStorage.getItem("cuidare_token") || "";
  }

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const token = obterToken();

      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const [pacienteResposta, prontuarioResposta] =
        await Promise.all([
          fetch(`${API_URL}/pacientes/${pacienteId}`, {
            headers,
          }),
          fetch(`${API_URL}/prontuarios/paciente/${pacienteId}`, {
            headers,
          }),
        ]);

      if (!pacienteResposta.ok) {
        throw new Error("Não foi possível carregar o paciente.");
      }

      const pacienteDados = await pacienteResposta.json();
      setPaciente(pacienteDados);

      if (prontuarioResposta.ok) {
        const prontuarioDados = await prontuarioResposta.json();

        setProntuario(prontuarioDados);

        setQueixaPrincipal(
          prontuarioDados.queixa_principal || ""
        );

        setDiagnostico(
          prontuarioDados.diagnostico || ""
        );

        setObjetivos(
          prontuarioDados.objetivos || ""
        );

        setCondutas(
          prontuarioDados.condutas || ""
        );

        setObservacoes(
          prontuarioDados.observacoes || ""
        );

        setEvolucoes(
          prontuarioDados.evolucoes || []
        );
      }
    } catch (error) {
      console.error(
        "Erro ao carregar prontuário:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível carregar o prontuário."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (pacienteId) {
      carregarDados();
    }
  }, [pacienteId]);

  async function salvarProntuario() {
    try {
      setSalvando(true);
      setErro("");

      const token = obterToken();

      const metodo = prontuario ? "PUT" : "POST";

      const url = prontuario
        ? `${API_URL}/prontuarios/${prontuario.id}`
        : `${API_URL}/prontuarios`;

      const resposta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
        body: JSON.stringify({
          paciente_id: pacienteId,
          queixa_principal: queixaPrincipal,
          diagnostico,
          objetivos,
          condutas,
          observacoes,
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          typeof resultado.detail === "string"
            ? resultado.detail
            : "Não foi possível salvar o prontuário."
        );
      }

      setProntuario(resultado);

      alert("Prontuário salvo com sucesso.");
    } catch (error) {
      console.error(
        "Erro ao salvar prontuário:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível salvar o prontuário."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function analisarComIA() {
    if (!prontuario) {
      setIaErro(
        "Salve o prontuário antes de utilizar a Cuidare IA."
      );
      return;
    }

    try {
      setIaCarregando(true);
      setIaErro("");
      setIaResultado(null);

      const token = obterToken();

      if (!token) {
        throw new Error(
          "Sessão não encontrada. Faça login novamente."
        );
      }

      const evolucoesAnteriores = evolucoes
        .slice(0, 10)
        .map((evolucao) => {
          const partes = [
            evolucao.relato_queixa,
            evolucao.avaliacao,
            evolucao.conduta,
            evolucao.evolucao,
            evolucao.observacoes,
          ].filter(Boolean);

          return partes.length > 0
            ? partes.join(" | ")
            : "";
        })
        .filter(Boolean);

      const resposta = await fetch(
        `${API_URL}/cuidare-ia/analisar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prontuario_id: prontuario.id,
            queixa_principal: queixaPrincipal,
            diagnostico,
            objetivos,
            condutas,
            observacoes,
            evolucoes_anteriores:
              evolucoesAnteriores,
          }),
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          typeof resultado.detail === "string"
            ? resultado.detail
            : "Não foi possível realizar a análise com a Cuidare IA."
        );
      }

      setIaResultado(resultado);
    } catch (error) {
      console.error(
        "Erro ao utilizar Cuidare IA:",
        error
      );

      setIaErro(
        error?.message ||
          "Não foi possível utilizar a Cuidare IA."
      );
    } finally {
      setIaCarregando(false);
    }
  }

  function usarSugestaoNaEvolucao() {
    if (!iaResultado?.sugestao_evolucao) {
      return;
    }

    setNovaEvolucao(
      iaResultado.sugestao_evolucao
    );

    setIaErro("");

    setTimeout(() => {
      document
        .getElementById("nova-evolucao")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 100);
  }

  function limparAnaliseIA() {
    setIaResultado(null);
    setIaErro("");
  }

  async function adicionarEvolucao() {
    if (!novaEvolucao.trim()) {
      return;
    }

    if (!prontuario) {
      setErro(
        "Salve o prontuário antes de registrar uma evolução."
      );
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      const token = obterToken();

      const resposta = await fetch(
        `${API_URL}/prontuarios/${prontuario.id}/evolucoes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          body: JSON.stringify({
            prontuario_id: prontuario.id,
            evolucao: novaEvolucao.trim(),
          }),
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          typeof resultado.detail === "string"
            ? resultado.detail
            : "Não foi possível registrar a evolução."
        );
      }

      setEvolucoes((atual) => [
        resultado,
        ...atual,
      ]);

      setNovaEvolucao("");
      setIaResultado(null);
      setIaErro("");
    } catch (error) {
      console.error(
        "Erro ao adicionar evolução:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível registrar a evolução."
      );
    } finally {
      setSalvando(false);
    }
  }

  function formatarData(data) {
    if (!data) {
      return "—";
    }

    return new Date(data).toLocaleDateString(
      "pt-BR"
    );
  }

  function formatarDataHora(data) {
    if (!data) {
      return "—";
    }

    return new Date(data).toLocaleString(
      "pt-BR"
    );
  }

  if (carregando) {
    return (
      <section className="prontuario-page">
        <div className="prontuario-loading">
          <strong>Carregando prontuário...</strong>
          <p>
            Aguarde enquanto buscamos os dados do paciente.
          </p>
        </div>
      </section>
    );
  }

  if (!paciente) {
    return (
      <section className="prontuario-page">
        <div className="prontuario-alert">
          Paciente não encontrado.
        </div>

        <button
          type="button"
          className="prontuario-secondary-button"
          onClick={onVoltar}
        >
          Voltar
        </button>
      </section>
    );
  }

  return (
    <section className="prontuario-page">

      <div className="prontuario-header">

        <div>
          <span className="page-label">
            PRONTUÁRIO
          </span>

          <h2>
            {paciente.nome}
          </h2>

          <p>
            Registro clínico e histórico de atendimento do paciente.
          </p>
        </div>

        <div className="prontuario-header-actions">

          <button
            type="button"
            className="prontuario-secondary-button"
            onClick={onVoltar}
          >
            Voltar
          </button>

          <button
            type="button"
            className="prontuario-primary-button"
            onClick={salvarProntuario}
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : "Salvar prontuário"}
          </button>

        </div>

      </div>

      {erro && (
        <div className="prontuario-alert">
          {erro}
        </div>
      )}

      <div className="prontuario-paciente-card">

        <div className="prontuario-paciente-avatar">
          {paciente.nome
            ?.charAt(0)
            ?.toUpperCase() || "P"}
        </div>

        <div className="prontuario-paciente-info">

          <strong>{paciente.nome}</strong>

          <span>
            CPF: {paciente.cpf || "Não informado"}
          </span>

        </div>

        <div className="prontuario-paciente-info">

          <span className="info-label">
            NASCIMENTO
          </span>

          <strong>
            {formatarData(
              paciente.data_nascimento
            )}
          </strong>

        </div>

        <div className="prontuario-paciente-info">

          <span className="info-label">
            TELEFONE
          </span>

          <strong>
            {paciente.telefone || "Não informado"}
          </strong>

        </div>

      </div>

      <div className="prontuario-grid">

        <div className="prontuario-main">

          <div className="prontuario-card">

            <div className="prontuario-card-header">
              <div>
                <span className="toolbar-label">
                  AVALIAÇÃO
                </span>

                <h3>
                  Informações clínicas
                </h3>
              </div>
            </div>

            <div className="prontuario-form-grid">

              <div className="prontuario-field full">
                <label>
                  Queixa principal
                </label>

                <textarea
                  value={queixaPrincipal}
                  onChange={(event) =>
                    setQueixaPrincipal(
                      event.target.value
                    )
                  }
                  placeholder="Descreva a queixa principal do paciente..."
                />
              </div>

              <div className="prontuario-field full">
                <label>
                  Diagnóstico / hipótese diagnóstica
                </label>

                <textarea
                  value={diagnostico}
                  onChange={(event) =>
                    setDiagnostico(
                      event.target.value
                    )
                  }
                  placeholder="Informe o diagnóstico ou hipótese diagnóstica..."
                />
              </div>

              <div className="prontuario-field">
                <label>
                  Objetivos terapêuticos
                </label>

                <textarea
                  value={objetivos}
                  onChange={(event) =>
                    setObjetivos(
                      event.target.value
                    )
                  }
                  placeholder="Objetivos do tratamento..."
                />
              </div>

              <div className="prontuario-field">
                <label>
                  Condutas
                </label>

                <textarea
                  value={condutas}
                  onChange={(event) =>
                    setCondutas(
                      event.target.value
                    )
                  }
                  placeholder="Condutas e procedimentos..."
                />
              </div>

              <div className="prontuario-field full">
                <label>
                  Observações
                </label>

                <textarea
                  value={observacoes}
                  onChange={(event) =>
                    setObservacoes(
                      event.target.value
                    )
                  }
                  placeholder="Informações complementares..."
                />
              </div>

            </div>

          </div>

          <div className="prontuario-card">

            <div className="prontuario-card-header">

              <div>
                <span className="toolbar-label">
                  HISTÓRICO
                </span>

                <h3>
                  Evoluções clínicas
                </h3>
              </div>

            </div>

            {!prontuario ? (
              <div className="prontuario-empty-small">
                Salve o prontuário para começar a registrar as evoluções.
              </div>
            ) : (
              <>
                <div
                  className="evolucao-nova"
                  id="nova-evolucao"
                >

                  <label>
                    Nova evolução
                  </label>

                  <textarea
                    value={novaEvolucao}
                    onChange={(event) =>
                      setNovaEvolucao(
                        event.target.value
                      )
                    }
                    placeholder="Registre a evolução do atendimento..."
                  />

                  <div className="evolucao-actions">

                    <button
                      type="button"
                      className="prontuario-primary-button"
                      onClick={adicionarEvolucao}
                      disabled={
                        salvando ||
                        !novaEvolucao.trim()
                      }
                    >
                      Registrar evolução
                    </button>

                  </div>

                </div>

                <div className="evolucoes-list">

                  {evolucoes.length === 0 ? (
                    <div className="prontuario-empty-small">
                      Nenhuma evolução registrada ainda.
                    </div>
                  ) : (
                    evolucoes.map((evolucao) => (
                      <article
                        className="evolucao-item"
                        key={evolucao.id}
                      >
                        <div className="evolucao-data">
                          {formatarDataHora(
                            evolucao.criado_em
                          )}
                        </div>

                        <p>
                          {evolucao.evolucao}
                        </p>
                      </article>
                    ))
                  )}

                </div>
              </>
            )}

          </div>

        </div>

        <aside className="prontuario-side">

          <div className="prontuario-card prontuario-resumo">

            <span className="toolbar-label">
              RESUMO
            </span>

            <h3>
              Dados do paciente
            </h3>

            <div className="resumo-item">
              <span>Nome</span>
              <strong>
                {paciente.nome}
              </strong>
            </div>

            <div className="resumo-item">
              <span>CPF</span>
              <strong>
                {paciente.cpf || "Não informado"}
              </strong>
            </div>

            <div className="resumo-item">
              <span>Telefone</span>
              <strong>
                {paciente.telefone || "Não informado"}
              </strong>
            </div>

            <div className="resumo-item">
              <span>E-mail</span>
              <strong>
                {paciente.email || "Não informado"}
              </strong>
            </div>

          </div>

          <div className="prontuario-card prontuario-ia">

            <span className="toolbar-label">
              CUIDARE IA
            </span>

            <h3>
              Assistência inteligente
            </h3>

            <p>
              A Cuidare IA auxilia na organização das
              informações clínicas e na preparação de
              sugestões para documentação.
            </p>

            <div className="ia-aviso">
              <strong>
                ⚠️ Revisão profissional obrigatória
              </strong>

              <span>
                A sugestão da Cuidare IA não constitui
                diagnóstico, prescrição ou decisão clínica.
                O fisioterapeuta deve revisar e validar o
                conteúdo antes do registro oficial.
              </span>
            </div>

            <button
              type="button"
              className="ia-button ia-button-ativo"
              onClick={analisarComIA}
              disabled={
                iaCarregando ||
                !prontuario
              }
            >
              {iaCarregando
                ? "Analisando..."
                : "✨ Analisar com Cuidare IA"}
            </button>

            {!prontuario && (
              <div className="ia-status">
                Salve o prontuário para utilizar a IA.
              </div>
            )}

            {iaErro && (
              <div className="ia-erro">
                {iaErro}
              </div>
            )}

            {iaResultado && (
              <div className="ia-resultado">

                <div className="ia-resultado-header">
                  <strong>
                    Análise realizada
                  </strong>

                  <span>
                    {iaResultado.modo === "teste"
                      ? "Modo Teste"
                      : iaResultado.modo}
                  </span>
                </div>

                <div className="ia-resultado-bloco">
                  <label>
                    Resumo
                  </label>

                  <p>
                    {iaResultado.resumo}
                  </p>
                </div>

                <div className="ia-resultado-bloco">
                  <label>
                    Sugestão de evolução
                  </label>

                  <textarea
                    value={
                      iaResultado.sugestao_evolucao || ""
                    }
                    onChange={(event) =>
                      setIaResultado((atual) => ({
                        ...atual,
                        sugestao_evolucao:
                          event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="ia-resultado-observacao">
                  {iaResultado.observacoes}
                </div>

                <div className="ia-custo">
                  Custo estimado desta análise:{" "}
                  <strong>
                    R$ {Number(
                      iaResultado.custo_estimado || 0
                    ).toFixed(2).replace(".", ",")}
                  </strong>
                </div>

                <div className="ia-resultado-acoes">

                  <button
                    type="button"
                    className="ia-button ia-button-confirmar"
                    onClick={usarSugestaoNaEvolucao}
                  >
                    Usar sugestão na evolução
                  </button>

                  <button
                    type="button"
                    className="ia-button ia-button-cancelar"
                    onClick={limparAnaliseIA}
                  >
                    Limpar
                  </button>

                </div>

                <div className="ia-fluxo">
                  <span>1. IA sugere</span>
                  <span>→</span>
                  <span>2. Profissional revisa</span>
                  <span>→</span>
                  <span>3. Registro manual</span>
                </div>

              </div>
            )}

          </div>

        </aside>

      </div>

    </section>
  );
}

export default Prontuario;
