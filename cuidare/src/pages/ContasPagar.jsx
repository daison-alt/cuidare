import "./ContasPagar.css";
import { useEffect, useMemo, useState } from "react";

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

function calcularStatus(conta) {
  if (
    conta.status === "pendente" &&
    conta.vencimento &&
    String(conta.vencimento).slice(0, 10) < obterHoje()
  ) {
    return "vencido";
  }

  return conta.status;
}

function ContasPagar({ onVoltar }) {
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [salvando, setSalvando] = useState(false);
  const [pagandoId, setPagandoId] = useState(null);

  const [formulario, setFormulario] = useState({
    fornecedor: "",
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
        `${API_URL}/contas-pagar`
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.detail ||
            "Não foi possível carregar as contas a pagar."
        );
      }

      setContas(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error(
        "Erro ao carregar contas a pagar:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível carregar as contas a pagar. Verifique se a API está funcionando."
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
      fornecedor: "",
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

    if (!formulario.fornecedor.trim()) {
      setErro("Informe o fornecedor da conta a pagar.");
      return;
    }

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

    const formasPagamentoValidas = [
      "pix",
      "dinheiro",
      "cartao_credito",
      "cartao_debito",
      "transferencia",
    ];

    if (
      !formulario.forma_pagamento ||
      !formasPagamentoValidas.includes(
        formulario.forma_pagamento
      )
    ) {
      setErro(
        "Informe a forma de pagamento. Selecione Pix, Dinheiro, Cartão de crédito, Cartão de débito ou Transferência."
      );
      return;
    }

    try {
      setSalvando(true);

      const resposta = await fetch(
        `${API_URL}/contas-pagar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fornecedor: formulario.fornecedor.trim(),
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
            "Não foi possível cadastrar a conta a pagar."
        );
      }

      setFormulario({
        fornecedor: "",
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
        "Erro ao salvar conta a pagar:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível salvar a conta a pagar."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function registrarPagamento(conta) {
    const valorPagamento = Number(
      conta.valor || 0
    );

    const confirmar = window.confirm(
      `Confirmar pagamento de ${formatarMoeda(
        valorPagamento
      )} referente a "${conta.descricao}"?\n\nFornecedor: ${
        conta.fornecedor || "-"
      }`
    );

    if (!confirmar) {
      return;
    }

    let formaPagamento =
      conta.forma_pagamento || "";

    if (!formaPagamento) {
      const escolha = window.prompt(
        "Informe a forma de pagamento:\n\n1 - Dinheiro\n2 - Pix\n3 - Cartão de crédito\n4 - Cartão de débito\n5 - Transferência\n\nDigite o número:"
      );

      const mapa = {
        "1": "dinheiro",
        "2": "pix",
        "3": "cartao_credito",
        "4": "cartao_debito",
        "5": "transferencia",
      };

      formaPagamento = mapa[escolha];

      if (!formaPagamento) {
        setErro(
          "Pagamento cancelado: informe uma forma de pagamento válida."
        );
        return;
      }
    }

    try {
      setErro("");
      setPagandoId(conta.id);

      const resposta = await fetch(
        `${API_URL}/contas-pagar/${conta.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fornecedor:
              conta.fornecedor || "",
            descricao: conta.descricao,
            categoria:
              conta.categoria || null,
            valor: valorPagamento,
            vencimento: conta.vencimento,
            status: "pago",
            forma_pagamento: formaPagamento,
            data_pagamento: obterHoje(),
            valor_pago: valorPagamento,
            observacoes:
              conta.observacoes || null,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.detail ||
            "Não foi possível registrar o pagamento."
        );
      }

      await carregarContas();
    } catch (error) {
      console.error(
        "Erro ao registrar pagamento:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível registrar o pagamento."
      );
    } finally {
      setPagandoId(null);
    }
  }

  const contasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return contas.filter((conta) => {
      const status = calcularStatus(conta);

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
        conta.fornecedor
          ?.toLowerCase()
          .includes(termo) ||
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
    let pago = 0;

    contas.forEach((conta) => {
      const valor = Number(conta.valor || 0);
      const status = calcularStatus(conta);

      total += valor;

      if (status === "pendente") {
        pendente += valor;
      }

      if (status === "vencido") {
        vencido += valor;
      }

      if (status === "pago") {
        pago += Number(
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
      pago,
    };
  }, [contas]);

  return (
    <div className="contas-pagar-page">
      <header className="contas-pagar-header">
        <div>
          <span className="contas-pagar-eyebrow">
            FINANCEIRO
          </span>

          <h1>Contas a Pagar</h1>

          <p>
            Controle as obrigações e pagamentos da
            clínica.
          </p>
        </div>

        <div className="contas-pagar-header-actions">
          <button
            type="button"
            className="contas-pagar-button secondary"
            onClick={onVoltar}
          >
            Voltar
          </button>

          <button
            type="button"
            className="contas-pagar-button primary"
            onClick={abrirNovoLancamento}
          >
            + Nova conta
          </button>
        </div>
      </header>

      <section className="contas-pagar-summary">
        <article className="contas-pagar-summary-card">
          <span>Total lançado</span>

          <strong>
            {formatarMoeda(resumo.total)}
          </strong>
        </article>

        <article className="contas-pagar-summary-card">
          <span>A pagar</span>

          <strong>
            {formatarMoeda(resumo.pendente)}
          </strong>
        </article>

        <article className="contas-pagar-summary-card">
          <span>Vencido</span>

          <strong>
            {formatarMoeda(resumo.vencido)}
          </strong>
        </article>

        <article className="contas-pagar-summary-card">
          <span>Pago</span>

          <strong>
            {formatarMoeda(resumo.pago)}
          </strong>
        </article>
      </section>

      {mostrarFormulario && (
        <section className="contas-pagar-form-card">
          <div className="contas-pagar-form-header">
            <div>
              <span className="contas-pagar-eyebrow">
                NOVO LANÇAMENTO
              </span>

              <h2>
                Adicionar conta a pagar
              </h2>
            </div>

            <button
              type="button"
              className="contas-pagar-close-button"
              onClick={fecharFormulario}
              disabled={salvando}
            >
              ×
            </button>
          </div>

          <form onSubmit={salvarConta}>
            <div className="contas-pagar-form-grid">
              <label>
                Fornecedor

                <input
                  name="fornecedor"
                  value={formulario.fornecedor}
                  onChange={alterarCampo}
                  placeholder="Ex.: Fornecedor de materiais"
                  disabled={salvando}
                />
              </label>

              <label>
                Descrição

                <input
                  name="descricao"
                  value={formulario.descricao}
                  onChange={alterarCampo}
                  placeholder="Ex.: Compra de materiais"
                  disabled={salvando}
                />
              </label>

              <label>
                Categoria

                <input
                  name="categoria"
                  value={formulario.categoria}
                  onChange={alterarCampo}
                  placeholder="Ex.: Materiais"
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
                  required
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

              <label className="contas-pagar-form-full">
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

            <div className="contas-pagar-form-actions">
              <button
                type="button"
                className="contas-pagar-button secondary"
                onClick={fecharFormulario}
                disabled={salvando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="contas-pagar-button primary"
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

      <section className="contas-pagar-list-card">
        <div className="contas-pagar-list-header">
          <div>
            <span className="contas-pagar-eyebrow">
              MOVIMENTAÇÕES
            </span>

            <h2>Contas cadastradas</h2>
          </div>

          <div className="contas-pagar-filters">
            <input
              type="search"
              placeholder="Buscar fornecedor, descrição..."
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
          <div className="contas-pagar-error">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="contas-pagar-empty">
            Carregando contas...
          </div>
        ) : contasFiltradas.length === 0 ? (
          <div className="contas-pagar-empty">
            <div className="contas-pagar-empty-icon">
              R$
            </div>

            <strong>
              Nenhuma conta encontrada
            </strong>

            <p>
              Cadastre uma nova conta para começar
              a controlar os pagamentos da clínica.
            </p>
          </div>
        ) : (
          <div className="contas-pagar-table-wrapper">
            <table className="contas-pagar-table">
              <thead>
                <tr>
                  <th>Fornecedor</th>
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
                    calcularStatus(conta);

                  const pagando =
                    pagandoId === conta.id;

                  return (
                    <tr key={conta.id}>
                      <td>
                        <strong>
                          {conta.fornecedor ||
                            "-"}
                        </strong>
                      </td>

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
                          className={`contas-pagar-status ${
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
                        <div className="contas-pagar-actions">
                          {status !== "pago" &&
                            status !==
                              "cancelado" && (
                              <button
                                type="button"
                                className="contas-pagar-pay-button"
                                onClick={() =>
                                  registrarPagamento(
                                    conta
                                  )
                                }
                                disabled={pagando}
                              >
                                {pagando
                                  ? "Pagando..."
                                  : "Pagar"}
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

export default ContasPagar;
