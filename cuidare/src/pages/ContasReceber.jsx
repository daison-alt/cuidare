import "./ContasReceber.css";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config";


const STATUS_LABELS = {
  pendente: "Pendente",
  pago: "Pago",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

const STATUS_CLASSES = {
  pendente: "pendente",
  pago: "pago",
  vencido: "vencido",
  cancelado: "cancelado",
};

const FORMAS_PAGAMENTO = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência",
};

function formatarMoeda(valor) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) {
    return "-";
  }

  const texto = String(data).slice(0, 10);
  const partes = texto.split("-");

  if (partes.length !== 3) {
    return data;
  }

  const [ano, mes, dia] = partes;

  return `${dia}/${mes}/${ano}`;
}

function obterHoje() {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function statusAutomatico(conta) {
  if (
    conta.status === "pendente" &&
    conta.vencimento &&
    String(conta.vencimento).slice(0, 10) < obterHoje()
  ) {
    return "vencido";
  }

  return conta.status;
}

function ContasReceber({ onVoltar }) {
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [salvando, setSalvando] = useState(false);
  const [recebendoId, setRecebendoId] = useState(null);

  const [formulario, setFormulario] = useState({
    descricao: "",
    categoria: "",
    valor: "",
    vencimento: "",
    status: "pendente",
    forma_pagamento: "",
    observacoes: "",
  });

  async function carregarContas() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        `${API_URL}/contas-receber`
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.detail ||
            "Não foi possível carregar as contas."
        );
      }

      setContas(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error(
        "Erro ao carregar contas a receber:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível carregar as contas a receber. Verifique se a API está funcionando."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarContas();
  }, []);

  function alterarCampo(event) {
    const { name, value } = event.target;

    setFormulario((atual) => ({
      ...atual,
      [name]: value,
    }));
  }

  function abrirNovoLancamento() {
    setErro("");

    setFormulario({
      descricao: "",
      categoria: "",
      valor: "",
      vencimento: "",
      status: "pendente",
      forma_pagamento: "",
      observacoes: "",
    });

    setMostrarFormulario(true);
  }

  function fecharFormulario() {
    if (salvando) {
      return;
    }

    setMostrarFormulario(false);
    setErro("");
  }

  async function salvarConta(event) {
    event.preventDefault();

    setErro("");

    if (!formulario.descricao.trim()) {
      setErro("Informe a descrição da conta.");
      return;
    }

    if (!formulario.valor) {
      setErro("Informe o valor da conta.");
      return;
    }

    if (Number(formulario.valor) <= 0) {
      setErro("O valor da conta deve ser maior que zero.");
      return;
    }

    if (!formulario.vencimento) {
      setErro("Informe o vencimento.");
      return;
    }

    if (
      formulario.status === "pago" &&
      !formulario.forma_pagamento
    ) {
      setErro(
        "Informe a forma de pagamento para uma conta paga."
      );
      return;
    }

    try {
      setSalvando(true);

      const resposta = await fetch(
        `${API_URL}/contas-receber`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            descricao: formulario.descricao.trim(),
            categoria:
              formulario.categoria.trim() || null,
            valor: Number(formulario.valor),
            vencimento: formulario.vencimento,
            status: formulario.status,
            forma_pagamento:
              formulario.forma_pagamento || null,
            data_pagamento:
              formulario.status === "pago"
                ? obterHoje()
                : null,
            valor_pago:
              formulario.status === "pago"
                ? Number(formulario.valor)
                : null,
            observacoes:
              formulario.observacoes.trim() || null,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.detail ||
            "Não foi possível cadastrar a conta."
        );
      }

      setFormulario({
        descricao: "",
        categoria: "",
        valor: "",
        vencimento: "",
        status: "pendente",
        forma_pagamento: "",
        observacoes: "",
      });

      setMostrarFormulario(false);

      await carregarContas();
    } catch (error) {
      console.error(
        "Erro ao salvar conta:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível salvar a conta."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function marcarComoPaga(conta) {
    const hoje = obterHoje();

    const valorReceber = Number(
      conta.valor || 0
    );

    const confirmar = window.confirm(
      `Confirmar recebimento de ${formatarMoeda(
        valorReceber
      )} referente a "${conta.descricao}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      setErro("");
      setRecebendoId(conta.id);

      const resposta = await fetch(
        `${API_URL}/contas-receber/${conta.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "pago",
            forma_pagamento:
              conta.forma_pagamento || "pix",
            data_pagamento: hoje,
            valor_pago: valorReceber,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.detail ||
            "Não foi possível registrar o recebimento."
        );
      }

      await carregarContas();
    } catch (error) {
      console.error(
        "Erro ao registrar recebimento:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível registrar o recebimento."
      );
    } finally {
      setRecebendoId(null);
    }
  }

  const contasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return contas.filter((conta) => {
      const status = statusAutomatico(conta);

      const correspondeStatus =
        filtroStatus === "todos" ||
        status === filtroStatus;

      if (!correspondeStatus) {
        return false;
      }

      if (!termo) {
        return true;
      }

      return (
        conta.descricao
          ?.toLowerCase()
          .includes(termo) ||
        conta.categoria
          ?.toLowerCase()
          .includes(termo) ||
        conta.observacoes
          ?.toLowerCase()
          .includes(termo)
      );
    });
  }, [contas, filtroStatus, busca]);

  const resumo = useMemo(() => {
    let total = 0;
    let pendente = 0;
    let vencido = 0;
    let recebido = 0;

    contas.forEach((conta) => {
      const valor = Number(conta.valor || 0);
      const status = statusAutomatico(conta);

      total += valor;

      if (status === "pendente") {
        pendente += valor;
      }

      if (status === "vencido") {
        vencido += valor;
      }

      if (status === "pago") {
        recebido += Number(
          conta.valor_pago ??
            conta.valor ??
            0
        );
      }
    });

    return {
      total,
      pendente,
      vencido,
      recebido,
    };
  }, [contas]);

  return (
    <div className="finance-page">
      <header className="finance-header">
        <div>
          <span className="finance-eyebrow">
            FINANCEIRO
          </span>

          <h1>Contas a Receber</h1>

          <p>
            Controle os valores que a clínica tem a
            receber.
          </p>
        </div>

        <div className="finance-header-actions">
          <button
            type="button"
            className="finance-button secondary"
            onClick={onVoltar}
          >
            Voltar
          </button>

          <button
            type="button"
            className="finance-button primary"
            onClick={abrirNovoLancamento}
          >
            + Nova conta
          </button>
        </div>
      </header>

      <section className="finance-summary">
        <article className="finance-summary-card">
          <span>Total lançado</span>

          <strong>
            {formatarMoeda(resumo.total)}
          </strong>
        </article>

        <article className="finance-summary-card">
          <span>A receber</span>

          <strong>
            {formatarMoeda(resumo.pendente)}
          </strong>
        </article>

        <article className="finance-summary-card">
          <span>Vencido</span>

          <strong>
            {formatarMoeda(resumo.vencido)}
          </strong>
        </article>

        <article className="finance-summary-card">
          <span>Recebido</span>

          <strong>
            {formatarMoeda(resumo.recebido)}
          </strong>
        </article>
      </section>

      {mostrarFormulario && (
        <section className="finance-form-card">
          <div className="finance-form-header">
            <div>
              <span className="finance-eyebrow">
                NOVO LANÇAMENTO
              </span>

              <h2>
                Adicionar conta a receber
              </h2>
            </div>

            <button
              type="button"
              className="finance-close-button"
              onClick={fecharFormulario}
              disabled={salvando}
            >
              ×
            </button>
          </div>

          <form onSubmit={salvarConta}>
            <div className="finance-form-grid">
              <label>
                Descrição

                <input
                  name="descricao"
                  value={formulario.descricao}
                  onChange={alterarCampo}
                  placeholder="Ex.: Mensalidade Pilates"
                  disabled={salvando}
                />
              </label>

              <label>
                Categoria

                <input
                  name="categoria"
                  value={formulario.categoria}
                  onChange={alterarCampo}
                  placeholder="Ex.: Pilates"
                  disabled={salvando}
                />
              </label>

              <label>
                Valor

                <input
                  name="valor"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formulario.valor}
                  onChange={alterarCampo}
                  placeholder="0,00"
                  disabled={salvando}
                />
              </label>

              <label>
                Vencimento

                <input
                  name="vencimento"
                  type="date"
                  value={formulario.vencimento}
                  onChange={alterarCampo}
                  disabled={salvando}
                />
              </label>

              <label>
                Status

                <select
                  name="status"
                  value={formulario.status}
                  onChange={alterarCampo}
                  disabled={salvando}
                >
                  <option value="pendente">
                    Pendente
                  </option>

                  <option value="pago">
                    Pago
                  </option>
                </select>
              </label>

              <label>
                Forma de pagamento

                <select
                  name="forma_pagamento"
                  value={
                    formulario.forma_pagamento
                  }
                  onChange={alterarCampo}
                  required={
                    formulario.status === "pago"
                  }
                  disabled={salvando}
                >
                  <option value="">
                    Não definida
                  </option>

                  <option value="dinheiro">
                    Dinheiro
                  </option>

                  <option value="pix">
                    Pix
                  </option>

                  <option value="cartao_credito">
                    Cartão de crédito
                  </option>

                  <option value="cartao_debito">
                    Cartão de débito
                  </option>

                  <option value="transferencia">
                    Transferência
                  </option>
                </select>
              </label>

              <label className="finance-form-full">
                Observações

                <textarea
                  name="observacoes"
                  value={formulario.observacoes}
                  onChange={alterarCampo}
                  rows="3"
                  placeholder="Observações da conta..."
                  disabled={salvando}
                />
              </label>
            </div>

            <div className="finance-form-actions">
              <button
                type="button"
                className="finance-button secondary"
                onClick={fecharFormulario}
                disabled={salvando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="finance-button primary"
                disabled={salvando}
              >
                {salvando
                  ? "Salvando..."
                  : "Salvar conta"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="finance-list-card">
        <div className="finance-list-header">
          <div>
            <span className="finance-eyebrow">
              MOVIMENTAÇÕES
            </span>

            <h2>Contas cadastradas</h2>
          </div>

          <div className="finance-filters">
            <input
              type="search"
              placeholder="Buscar..."
              value={busca}
              onChange={(event) =>
                setBusca(event.target.value)
              }
            />

            <select
              value={filtroStatus}
              onChange={(event) =>
                setFiltroStatus(
                  event.target.value
                )
              }
            >
              <option value="todos">
                Todos
              </option>

              <option value="pendente">
                Pendentes
              </option>

              <option value="vencido">
                Vencidas
              </option>

              <option value="pago">
                Pagas
              </option>

              <option value="cancelado">
                Canceladas
              </option>
            </select>
          </div>
        </div>

        {erro && (
          <div className="finance-error">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="finance-empty">
            Carregando contas...
          </div>
        ) : contasFiltradas.length === 0 ? (
          <div className="finance-empty">
            <div className="finance-empty-icon">
              R$
            </div>

            <strong>
              Nenhuma conta encontrada
            </strong>

            <p>
              Cadastre uma nova conta para começar
              a controlar os recebimentos da clínica.
            </p>
          </div>
        ) : (
          <div className="finance-table-wrapper">
            <table className="finance-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Pagamento</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {contasFiltradas.map((conta) => {
                  const status =
                    statusAutomatico(conta);

                  const recebendo =
                    recebendoId === conta.id;

                  return (
                    <tr key={conta.id}>
                      <td>
                        <strong>
                          {conta.descricao}
                        </strong>

                        {conta.observacoes && (
                          <small>
                            {conta.observacoes}
                          </small>
                        )}
                      </td>

                      <td>
                        {conta.categoria || "-"}
                      </td>

                      <td>
                        {formatarData(
                          conta.vencimento
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatarMoeda(
                            conta.valor
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`finance-status ${
                            STATUS_CLASSES[
                              status
                            ] || ""
                          }`}
                        >
                          {STATUS_LABELS[
                            status
                          ] || status}
                        </span>
                      </td>

                      <td>
                        {conta.forma_pagamento
                          ? FORMAS_PAGAMENTO[
                              conta.forma_pagamento
                            ] ||
                            conta.forma_pagamento
                          : "-"}
                      </td>

                      <td>
                        <div className="finance-actions">
                          {status !== "pago" &&
                            status !==
                              "cancelado" && (
                              <button
                                type="button"
                                onClick={() =>
                                  marcarComoPaga(
                                    conta
                                  )
                                }
                                disabled={
                                  recebendo
                                }
                              >
                                {recebendo
                                  ? "Recebendo..."
                                  : "Receber"}
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default ContasReceber;
