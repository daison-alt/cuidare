import { useEffect, useState } from "react";
import "./GestaoFiscal.css";

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : `https://${window.location.hostname.replace(
        /-5173\.app\.github\.dev$/,
        "-8000.app.github.dev"
      )}`;

const STATUS_LABELS = {
  pendente: "Pendente",
  pago: "Pago",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

function obterFormularioInicial() {
  return {
    tipo_documento: "DAS",
    competencia: "",
    descricao: "",
    status: "pendente",
    vencimento: "",
    valor: "",
    observacoes: "",
  };
}

function formatarDataParaInput(data) {
  if (!data) {
    return "";
  }

  return String(data).slice(0, 10);
}

function obterStatusExibicao(registro) {
  /*
   * O status Pago e Cancelado nunca são alterados automaticamente.
   *
   * Apenas registros que continuam como Pendente podem aparecer
   * visualmente como Vencido quando a data de vencimento já passou.
   *
   * Essa função NÃO altera o banco de dados.
   */

  if (registro.status !== "pendente") {
    return registro.status;
  }

  if (!registro.vencimento) {
    return "pendente";
  }

  const hoje = new Date();

  const hojeSemHora = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );

  const vencimentoTexto = String(
    registro.vencimento
  ).slice(0, 10);

  const partes = vencimentoTexto.split("-");

  if (partes.length !== 3) {
    return "pendente";
  }

  const [ano, mes, dia] = partes.map(Number);

  const dataVencimento = new Date(
    ano,
    mes - 1,
    dia
  );

  if (hojeSemHora > dataVencimento) {
    return "vencido";
  }

  return "pendente";
}

function GestaoFiscal({ onVoltar }) {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [formulario, setFormulario] = useState(
    obterFormularioInicial()
  );

  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);

  async function carregarRegistros() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        `${API_URL}/gestao-fiscal`
      );

      if (!resposta.ok) {
        throw new Error(
          "Não foi possível carregar os registros fiscais."
        );
      }

      const dados = await resposta.json();

      setRegistros(
        Array.isArray(dados) ? dados : []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar Gestão Fiscal:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível carregar os registros fiscais."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarRegistros();
  }, []);

  function alterarCampo(event) {
    const { name, value } = event.target;

    if (name === "competencia") {
      const somenteNumeros = value
        .replace(/\D/g, "")
        .slice(0, 6);

      let competenciaFormatada =
        somenteNumeros;

      if (somenteNumeros.length > 2) {
        competenciaFormatada =
          somenteNumeros.slice(0, 2) +
          "/" +
          somenteNumeros.slice(2);
      }

      setFormulario((atual) => ({
        ...atual,
        competencia: competenciaFormatada,
      }));

      return;
    }

    setFormulario((atual) => ({
      ...atual,
      [name]: value,
    }));
  }

  function iniciarEdicao(registro) {
    setErro("");
    setSucesso("");

    setEditandoId(registro.id);

    setFormulario({
      tipo_documento:
        registro.tipo_documento || "DAS",

      competencia:
        registro.competencia || "",

      descricao:
        registro.descricao || "",

      status:
        registro.status || "pendente",

      vencimento:
        formatarDataParaInput(
          registro.vencimento
        ),

      valor:
        registro.valor || "",

      observacoes:
        registro.observacoes || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelarEdicao() {
    if (salvando) {
      return;
    }

    setEditandoId(null);
    setFormulario(obterFormularioInicial());
    setErro("");
    setSucesso("");
  }

  async function salvarRegistro(event) {
    event.preventDefault();

    try {
      setErro("");
      setSucesso("");

      if (!formulario.competencia) {
        setErro(
          "Informe a competência no formato MM/AAAA."
        );
        return;
      }

      if (
        !/^\d{2}\/\d{4}$/.test(
          formulario.competencia
        )
      ) {
        setErro(
          "A competência deve estar no formato MM/AAAA."
        );
        return;
      }

      const [mes, ano] =
        formulario.competencia
          .split("/")
          .map(Number);

      if (
        mes < 1 ||
        mes > 12 ||
        ano < 2000
      ) {
        setErro(
          "Informe uma competência válida no formato MM/AAAA."
        );
        return;
      }

      if (!formulario.descricao.trim()) {
        setErro(
          "Informe a descrição da obrigação fiscal."
        );
        return;
      }

      setSalvando(true);

      const dados = {
        ...formulario,

        vencimento: formulario.vencimento
          ? new Date(
              `${formulario.vencimento}T12:00:00`
            ).toISOString()
          : null,

        valor:
          formulario.valor.trim() || null,

        observacoes:
          formulario.observacoes.trim() || null,

        arquivo: null,
      };

      const url = editandoId
        ? `${API_URL}/gestao-fiscal/${editandoId}`
        : `${API_URL}/gestao-fiscal`;

      const resposta = await fetch(url, {
        method: editandoId ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(dados),
      });

      const respostaTexto =
        await resposta.text();

      let resultado = null;

      try {
        resultado = respostaTexto
          ? JSON.parse(respostaTexto)
          : null;
      } catch {
        resultado = null;
      }

      if (!resposta.ok) {
        throw new Error(
          resultado?.detail ||
            respostaTexto ||
            "Não foi possível salvar o registro fiscal."
        );
      }

      if (editandoId) {
        setSucesso(
          "Obrigação fiscal atualizada com sucesso."
        );
      } else {
        setSucesso(
          "Obrigação fiscal cadastrada com sucesso."
        );
      }

      setEditandoId(null);
      setFormulario(obterFormularioInicial());

      await carregarRegistros();
    } catch (error) {
      console.error(
        "Erro ao salvar registro fiscal:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível salvar o registro fiscal."
      );
    } finally {
      setSalvando(false);
    }
  }

  function formatarValor(valor) {
    if (!valor) {
      return "—";
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return valor;
    }

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data) {
    if (!data) {
      return "—";
    }

    const texto = String(data).slice(0, 10);
    const partes = texto.split("-");

    if (partes.length !== 3) {
      return "—";
    }

    const [ano, mes, dia] = partes;

    return `${dia}/${mes}/${ano}`;
  }

  return (
    <section className="gestao-fiscal-page">
      <div className="page-header">
        <button
          type="button"
          className="fiscal-back-button"
          onClick={onVoltar}
        >
          ← Voltar
        </button>

        <div>
          <span className="page-label">
            GESTÃO FISCAL
          </span>

          <h2>
            Documentos e obrigações fiscais
          </h2>

          <p>
            Controle os documentos, competências,
            vencimentos e valores relacionados à
            gestão fiscal da Cuidare.
          </p>
        </div>
      </div>

      {erro && (
        <div className="fiscal-alert">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="fiscal-success">
          {sucesso}
        </div>
      )}

      <div className="fiscal-grid">
        <section className="fiscal-panel">
          <div className="panel-title">
            <span>
              {editandoId
                ? "EDITANDO OBRIGAÇÃO"
                : "NOVO REGISTRO"}
            </span>

            <h3>
              {editandoId
                ? "Editar obrigação fiscal"
                : "Cadastrar obrigação fiscal"}
            </h3>
          </div>

          <form
            onSubmit={salvarRegistro}
            className="fiscal-form"
          >
            <div className="form-row">
              <label>
                Tipo de documento

                <select
                  name="tipo_documento"
                  value={
                    formulario.tipo_documento
                  }
                  onChange={alterarCampo}
                  disabled={salvando}
                >
                  <option value="DAS">
                    DAS
                  </option>

                  <option value="DARF">
                    DARF
                  </option>

                  <option value="GPS">
                    GPS
                  </option>

                  <option value="ISS">
                    ISS
                  </option>

                  <option value="IR">
                    IR
                  </option>

                  <option value="OUTRO">
                    Outro
                  </option>
                </select>
              </label>

              <label>
                Competência

                <input
                  type="text"
                  name="competencia"
                  placeholder="08/2026"
                  maxLength={7}
                  value={
                    formulario.competencia
                  }
                  onChange={alterarCampo}
                  required
                  disabled={salvando}
                />
              </label>
            </div>

            <label>
              Descrição

              <input
                type="text"
                name="descricao"
                placeholder="Ex.: Simples Nacional - Agosto/2026"
                value={
                  formulario.descricao
                }
                onChange={alterarCampo}
                required
                disabled={salvando}
              />
            </label>

            <div className="form-row">
              <label>
                Status

                <select
                  name="status"
                  value={
                    formulario.status
                  }
                  onChange={alterarCampo}
                  disabled={salvando}
                >
                  <option value="pendente">
                    Pendente
                  </option>

                  <option value="pago">
                    Pago
                  </option>

                  <option value="vencido">
                    Vencido
                  </option>

                  <option value="cancelado">
                    Cancelado
                  </option>
                </select>
              </label>

              <label>
                Valor

                <input
                  type="number"
                  name="valor"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={
                    formulario.valor
                  }
                  onChange={alterarCampo}
                  disabled={salvando}
                />
              </label>
            </div>

            <label>
              Vencimento

              <input
                type="date"
                name="vencimento"
                value={
                  formulario.vencimento
                }
                onChange={alterarCampo}
                disabled={salvando}
              />
            </label>

            <label>
              Observações

              <textarea
                name="observacoes"
                rows="4"
                placeholder="Informações adicionais..."
                value={
                  formulario.observacoes
                }
                onChange={alterarCampo}
                disabled={salvando}
              />
            </label>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                className="fiscal-save-button"
                disabled={salvando}
              >
                {salvando
                  ? "Salvando..."
                  : editandoId
                  ? "Salvar alterações"
                  : "Salvar obrigação fiscal"}
              </button>

              {editandoId && (
                <button
                  type="button"
                  className="fiscal-back-button"
                  onClick={cancelarEdicao}
                  disabled={salvando}
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="fiscal-panel">
          <div className="panel-title">
            <span>
              CONTROLE FISCAL
            </span>

            <h3>
              Registros cadastrados
            </h3>
          </div>

          {carregando ? (
            <div className="fiscal-empty">
              Carregando registros...
            </div>
          ) : registros.length === 0 ? (
            <div className="fiscal-empty">
              <strong>
                Nenhum registro fiscal
              </strong>

              <p>
                As obrigações cadastradas
                aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="fiscal-list">
              {registros.map((registro) => {
                const statusExibicao =
                  obterStatusExibicao(
                    registro
                  );

                return (
                  <article
                    className="fiscal-item"
                    key={registro.id}
                  >
                    <div className="fiscal-item-main">
                      <div>
                        <span className="fiscal-type">
                          {registro.tipo_documento}
                        </span>

                        <h4>
                          {registro.descricao}
                        </h4>

                        <p>
                          Competência:{" "}
                          {registro.competencia}
                        </p>
                      </div>

                      <span
                        className={`fiscal-status status-${statusExibicao}`}
                      >
                        {STATUS_LABELS[
                          statusExibicao
                        ] ||
                          statusExibicao}
                      </span>
                    </div>

                    <div className="fiscal-item-details">
                      <span>
                        Vencimento:{" "}
                        <strong>
                          {formatarData(
                            registro.vencimento
                          )}
                        </strong>
                      </span>

                      <span>
                        Valor:{" "}
                        <strong>
                          {formatarValor(
                            registro.valor
                          )}
                        </strong>
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "flex-end",
                        marginTop: "14px",
                      }}
                    >
                      <button
                        type="button"
                        className="fiscal-save-button"
                        onClick={() =>
                          iniciarEdicao(
                            registro
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
    </section>
  );
}

export default GestaoFiscal;
