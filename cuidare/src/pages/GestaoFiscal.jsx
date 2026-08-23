import { useEffect, useState } from "react";
import "./GestaoFiscal.css";

const API_URL = "https://humble-waddle-97x5v4vpg7j73ppxq-8000.app.github.dev";

function GestaoFiscal() {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [formulario, setFormulario] = useState({
    tipo_documento: "DAS",
    competencia: "",
    descricao: "",
    status: "pendente",
    vencimento: "",
    valor: "",
    observacoes: "",
  });

  async function carregarRegistros() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(`${API_URL}/gestao-fiscal`);

      if (!resposta.ok) {
        throw new Error("Não foi possível carregar os registros fiscais.");
      }

      const dados = await resposta.json();
      setRegistros(dados);
    } catch (error) {
      setErro(error.message);
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
      const somenteNumeros = value.replace(/\D/g, "").slice(0, 6);

      let competenciaFormatada = somenteNumeros;

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

  async function salvarRegistro(event) {
    event.preventDefault();

    try {
      setErro("");

      const dados = {
        ...formulario,
        vencimento: formulario.vencimento
          ? new Date(formulario.vencimento).toISOString()
          : null,
        valor: formulario.valor || null,
        observacoes: formulario.observacoes || null,
        arquivo: null,
      };

      const resposta = await fetch(`${API_URL}/gestao-fiscal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      if (!resposta.ok) {
        const detalhe = await resposta.text();
        throw new Error(
          detalhe || "Não foi possível salvar o registro fiscal."
        );
      }

      setFormulario({
        tipo_documento: "DAS",
        competencia: "",
        descricao: "",
        status: "pendente",
        vencimento: "",
        valor: "",
        observacoes: "",
      });

      await carregarRegistros();
    } catch (error) {
      setErro(error.message);
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

    return new Date(data).toLocaleDateString("pt-BR");
  }

  return (
    <section className="gestao-fiscal-page">
      <div className="page-header">
        <div>
          <span className="page-label">GESTÃO FISCAL</span>
          <h2>Documentos e obrigações fiscais</h2>
          <p>
            Controle os documentos, competências, vencimentos e valores
            relacionados à gestão fiscal da Cuidare.
          </p>
        </div>
      </div>

      {erro && (
        <div className="fiscal-alert">
          {erro}
        </div>
      )}

      <div className="fiscal-grid">
        <section className="fiscal-panel">
          <div className="panel-title">
            <span>NOVO REGISTRO</span>
            <h3>Cadastrar obrigação fiscal</h3>
          </div>

          <form onSubmit={salvarRegistro} className="fiscal-form">
            <div className="form-row">
              <label>
                Tipo de documento
                <select
                  name="tipo_documento"
                  value={formulario.tipo_documento}
                  onChange={alterarCampo}
                >
                  <option value="DAS">DAS</option>
                  <option value="DARF">DARF</option>
                  <option value="GPS">GPS</option>
                  <option value="ISS">ISS</option>
                  <option value="IR">IR</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </label>

              <label>
                Competência
                <input
                  type="text"
                  name="competencia"
                  placeholder="08/2026"
                  maxLength={7}
                  value={formulario.competencia}
                  onChange={alterarCampo}
                  required
                />
              </label>
            </div>

            <label>
              Descrição
              <input
                type="text"
                name="descricao"
                placeholder="Ex.: Simples Nacional - Agosto/2026"
                value={formulario.descricao}
                onChange={alterarCampo}
                required
              />
            </label>

            <div className="form-row">
              <label>
                Status
                <select
                  name="status"
                  value={formulario.status}
                  onChange={alterarCampo}
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="vencido">Vencido</option>
                  <option value="cancelado">Cancelado</option>
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
                  value={formulario.valor}
                  onChange={alterarCampo}
                />
              </label>
            </div>

            <label>
              Vencimento
              <input
                type="date"
                name="vencimento"
                value={formulario.vencimento}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Observações
              <textarea
                name="observacoes"
                rows="4"
                placeholder="Informações adicionais..."
                value={formulario.observacoes}
                onChange={alterarCampo}
              />
            </label>

            <button type="submit" className="fiscal-save-button">
              Salvar obrigação fiscal
            </button>
          </form>
        </section>

        <section className="fiscal-panel">
          <div className="panel-title">
            <span>CONTROLE FISCAL</span>
            <h3>Registros cadastrados</h3>
          </div>

          {carregando ? (
            <div className="fiscal-empty">
              Carregando registros...
            </div>
          ) : registros.length === 0 ? (
            <div className="fiscal-empty">
              <strong>Nenhum registro fiscal</strong>
              <p>
                As obrigações cadastradas aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="fiscal-list">
              {registros.map((registro) => (
                <article className="fiscal-item" key={registro.id}>
                  <div className="fiscal-item-main">
                    <div>
                      <span className="fiscal-type">
                        {registro.tipo_documento}
                      </span>

                      <h4>{registro.descricao}</h4>

                      <p>
                        Competência: {registro.competencia}
                      </p>
                    </div>

                    <span
                      className={`fiscal-status status-${registro.status}`}
                    >
                      {registro.status}
                    </span>
                  </div>

                  <div className="fiscal-item-details">
                    <span>
                      Vencimento:{" "}
                      <strong>
                        {formatarData(registro.vencimento)}
                      </strong>
                    </span>

                    <span>
                      Valor:{" "}
                      <strong>
                        {formatarValor(registro.valor)}
                      </strong>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

export default GestaoFiscal;
