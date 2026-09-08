import { useEffect, useState } from "react";

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : `https://${window.location.hostname.replace(
        /-5173\.app\.github\.dev$/,
        "-8000.app.github.dev"
      )}`;

const PERIODOS = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
};

export default function PlanosPilates({ onVoltar }) {
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [planoEditando, setPlanoEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const [formulario, setFormulario] = useState({
    nome: "",
    periodo: "mensal",
    frequencia_semanal: 1,
    quantidade_aulas: "",
    valor: "",
    descricao: "",
    ativo: true,
  });

  async function carregarPlanos() {
    try {
      setCarregando(true);
      setErro("");

      const token = localStorage.getItem("cuidare_token");

      const response = await fetch(`${API_URL}/planos-pilates`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (!response.ok) {
        throw new Error("Não foi possível carregar os planos.");
      }

      const data = await response.json();
      setPlanos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar os planos de Pilates.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPlanos();
  }, []);

  function formatarValor(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function abrirEdicao(plano) {
    setPlanoEditando(plano);

    setFormulario({
      nome: plano.nome || "",
      periodo: plano.periodo || "mensal",
      frequencia_semanal: plano.frequencia_semanal || 1,
      quantidade_aulas: plano.quantidade_aulas || "",
      valor: plano.valor || "",
      descricao: plano.descricao || "",
      ativo: plano.ativo ?? true,
    });

    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    setPlanoEditando(null);
  }

  function alterarFormulario(event) {
    const { name, value, type, checked } = event.target;

    setFormulario((atual) => ({
      ...atual,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function salvarEdicao(event) {
    event.preventDefault();

    if (!planoEditando) return;

    try {
      setSalvando(true);
      setErro("");

      const token = localStorage.getItem("cuidare_token");

      const response = await fetch(
        `${API_URL}/planos-pilates/${planoEditando.id}`,
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
            nome: formulario.nome.trim(),
            periodo: formulario.periodo,
            frequencia_semanal: Number(formulario.frequencia_semanal),
            quantidade_aulas: Number(formulario.quantidade_aulas),
            valor: Number(formulario.valor || 0),
            descricao: formulario.descricao.trim() || null,
            ativo: formulario.ativo,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Não foi possível atualizar o plano."
        );
      }

      setModalAberto(false);
      setPlanoEditando(null);

      await carregarPlanos();
    } catch (error) {
      console.error(error);
      setErro(
        error.message || "Não foi possível atualizar o plano."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <span className="card-label">PILATES • PLANOS</span>

          <h2>Planos de Pilates</h2>

          <p>
            Configure os pacotes de Pilates oferecidos pela clínica.
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

          <button type="button" className="primary-button">
            + Novo plano
          </button>
        </div>
      </div>

      {erro && <div className="error-message">{erro}</div>}

      <div className="planos-pilates-container">
        {carregando ? (
          <div className="content-card">
            <div className="empty-state">
              Carregando planos...
            </div>
          </div>
        ) : planos.length === 0 ? (
          <div className="content-card">
            <div className="empty-state">
              <strong>Nenhum plano cadastrado.</strong>

              <span>
                Cadastre os planos de Pilates para disponibilizá-los
                nas matrículas dos alunos.
              </span>
            </div>
          </div>
        ) : (
          <div className="planos-pilates-organizado">
            {[1, 2].map((frequencia) => (
              <section
                key={frequencia}
                className="planos-pilates-grupo"
              >
                <div className="planos-pilates-grupo-header">
                  <div>
                    <span className="card-label">PILATES</span>

                    <h3>
                      {frequencia === 1
                        ? "1 vez por semana"
                        : "2 vezes por semana"}
                    </h3>
                  </div>
                </div>

                <div className="planos-pilates-grid">
                  {["mensal", "trimestral", "semestral"].map(
                    (periodo) => {
                      const plano = planos.find(
                        (item) =>
                          Number(item.frequencia_semanal) ===
                            frequencia &&
                          item.periodo === periodo
                      );

                      if (!plano) {
                        return (
                          <article
                            key={`${frequencia}-${periodo}`}
                            className="plano-pilates-card plano-pilates-vazio"
                          >
                            <span className="card-label">
                              {PERIODOS[periodo]}
                            </span>

                            <h3>{PERIODOS[periodo]}</h3>

                            <p>
                              Plano ainda não cadastrado.
                            </p>
                          </article>
                        );
                      }

                      return (
                        <article
                          key={plano.id}
                          className={`plano-pilates-card ${
                            plano.ativo
                              ? ""
                              : "plano-inativo"
                          }`}
                        >
                          <div className="plano-pilates-card-topo">
                            <div>
                              <span className="card-label">
                                {PERIODOS[plano.periodo]}
                              </span>

                              <h3>{plano.nome}</h3>
                            </div>

                            <span
                              className={`status-badge ${
                                plano.ativo
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              {plano.ativo
                                ? "Ativo"
                                : "Inativo"}
                            </span>
                          </div>

                          <div className="plano-pilates-info">
                            <div className="plano-pilates-info-item">
                              <span>Período</span>

                              <strong>
                                {PERIODOS[plano.periodo] ||
                                  plano.periodo}
                              </strong>
                            </div>

                            <div className="plano-pilates-info-item">
                              <span>Frequência</span>

                              <strong>
                                {plano.frequencia_semanal}x por semana
                              </strong>
                            </div>

                            <div className="plano-pilates-info-item">
                              <span>Aulas</span>

                              <strong>
                                {plano.quantidade_aulas}
                              </strong>
                            </div>
                          </div>

                          <div className="plano-pilates-valor">
                            <span>Valor do plano</span>

                            <strong>
                              {formatarValor(plano.valor)}
                            </strong>
                          </div>

                          {plano.descricao && (
                            <p className="plano-pilates-descricao">
                              {plano.descricao}
                            </p>
                          )}

                          <div className="plano-pilates-card-acoes">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                abrirEdicao(plano)
                              }
                            >
                              Editar
                            </button>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharModal();
            }
          }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="card-label">
                  PILATES • PLANO
                </span>

                <h3>Editar plano</h3>

                <p>
                  Atualize as informações do pacote de Pilates.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={fecharModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={salvarEdicao}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome do plano</label>

                  <input
                    type="text"
                    name="nome"
                    value={formulario.nome}
                    onChange={alterarFormulario}
                    required
                    minLength={3}
                  />
                </div>

                <div className="form-group">
                  <label>Período</label>

                  <select
                    name="periodo"
                    value={formulario.periodo}
                    onChange={alterarFormulario}
                    required
                  >
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">
                      Trimestral
                    </option>
                    <option value="semestral">
                      Semestral
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Frequência semanal</label>

                  <select
                    name="frequencia_semanal"
                    value={formulario.frequencia_semanal}
                    onChange={alterarFormulario}
                    required
                  >
                    <option value="1">
                      1x por semana
                    </option>

                    <option value="2">
                      2x por semana
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantidade de aulas</label>

                  <input
                    type="number"
                    name="quantidade_aulas"
                    value={formulario.quantidade_aulas}
                    onChange={alterarFormulario}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Valor do plano</label>

                  <input
                    type="number"
                    name="valor"
                    value={formulario.valor}
                    onChange={alterarFormulario}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descrição</label>

                  <input
                    type="text"
                    name="descricao"
                    value={formulario.descricao}
                    onChange={alterarFormulario}
                    placeholder="Descrição do plano"
                  />
                </div>
              </div>

              <label className="pilates-editar-status">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={formulario.ativo}
                  onChange={alterarFormulario}
                />

                <span>Plano ativo</span>
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={fecharModal}
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
