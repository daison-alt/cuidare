import { useEffect, useMemo, useState } from "react";
import "./Financeiro.css";

const API_URL =
  window.location.hostname.includes("app.github.dev")
    ? `https://${window.location.hostname.replace(
        "-5173.app.github.dev",
        "-8000.app.github.dev"
      )}`
    : "http://localhost:8000";

const STATUS_LABELS = {
  pendente: "Pendente",
  pago: "Pago",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

const FORMAS_PAGAMENTO = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência",
  outro: "Outro",
};

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");

  if (!ano || !mes || !dia) return data;

  return `${dia}/${mes}/${ano}`;
}

function calcularStatus(lancamento) {
  if (lancamento.status === "pago") {
    return "pago";
  }

  if (lancamento.status === "cancelado") {
    return "cancelado";
  }

  if (
    lancamento.vencimento &&
    new Date(`${lancamento.vencimento}T23:59:59`) < new Date()
  ) {
    return "vencido";
  }

  return "pendente";
}

function Financeiro({ onVoltar }) {
  const [aba, setAba] = useState("visao-geral");

  const [contasReceber, setContasReceber] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const formularioInicial = {
    fornecedor: "",
    descricao: "",
    categoria: "",
    valor: "",
    vencimento: "",
    status: "pendente",
    forma_pagamento: "",
    data_pagamento: "",
    valor_pago: "",
    observacoes: "",
  };

  const [formulario, setFormulario] = useState(formularioInicial);

  async function carregarContas() {
    try {
      setCarregando(true);
      setErro("");

      const [receberResposta, pagarResposta] = await Promise.all([
        fetch(`${API_URL}/contas-receber`),
        fetch(`${API_URL}/contas-pagar`),
      ]);

      if (!receberResposta.ok || !pagarResposta.ok) {
        throw new Error("Não foi possível carregar os lançamentos.");
      }

      const receber = await receberResposta.json();
      const pagar = await pagarResposta.json();

      setContasReceber(Array.isArray(receber) ? receber : []);
      setContasPagar(Array.isArray(pagar) ? pagar : []);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível conectar ao módulo financeiro.");
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

  function limparFormulario() {
    setFormulario(formularioInicial);
    setEditandoId(null);
  }

  function abrirNovoLancamento() {
    if (aba === "visao-geral") {
      setAba("receber");
    }

    limparFormulario();
    setErro("");
    setSucesso("");
    setMostrarFormulario(true);
  }

  function trocarAba(novaAba) {
    setAba(novaAba);
    setFiltroStatus("todos");
    setFiltroCategoria("");
    setMostrarFormulario(false);
    limparFormulario();
    setErro("");
    setSucesso("");
  }

  function editarLancamento(conta) {
    setEditandoId(conta.id);

    setFormulario({
      fornecedor: conta.fornecedor || "",
      descricao: conta.descricao || "",
      categoria: conta.categoria || "",
      valor: conta.valor || "",
      vencimento: conta.vencimento || "",
      status: conta.status || "pendente",
      forma_pagamento: conta.forma_pagamento || "",
      data_pagamento: conta.data_pagamento || "",
      valor_pago: conta.valor_pago || "",
      observacoes: conta.observacoes || "",
    });

    setErro("");
    setSucesso("");
    setMostrarFormulario(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function salvarConta(event) {
    event.preventDefault();

    if (
      !formulario.descricao.trim() ||
      !formulario.valor ||
      !formulario.vencimento
    ) {
      setErro("Preencha a descrição, o valor e o vencimento.");
      return;
    }

    if (aba === "pagar" && !formulario.fornecedor.trim()) {
      setErro("Informe o fornecedor da conta a pagar.");
      return;
    }

    if (
      formulario.status === "pago" &&
      (!formulario.data_pagamento || !formulario.valor_pago)
    ) {
      setErro(
        "Para um lançamento pago, informe a data e o valor do pagamento."
      );
      return;
    }

    try {
      setErro("");
      setSucesso("");

      const ehReceber = aba === "receber";

      const endpointBase = ehReceber
        ? `${API_URL}/contas-receber`
        : `${API_URL}/contas-pagar`;

      const corpo = ehReceber
        ? {
            descricao: formulario.descricao.trim(),
            categoria: formulario.categoria.trim() || null,
            valor: Number(formulario.valor),
            vencimento: formulario.vencimento,
            status: formulario.status,
            forma_pagamento: formulario.forma_pagamento || null,
            data_pagamento: formulario.data_pagamento || null,
            valor_pago: formulario.valor_pago
              ? Number(formulario.valor_pago)
              : null,
            observacoes: formulario.observacoes.trim() || null,
          }
        : {
            fornecedor: formulario.fornecedor.trim(),
            descricao: formulario.descricao.trim(),
            categoria: formulario.categoria.trim() || null,
            valor: Number(formulario.valor),
            vencimento: formulario.vencimento,
            status: formulario.status,
            forma_pagamento: formulario.forma_pagamento || null,
            data_pagamento: formulario.data_pagamento || null,
            valor_pago: formulario.valor_pago
              ? Number(formulario.valor_pago)
              : null,
            observacoes: formulario.observacoes.trim() || null,
          };

      const resposta = await fetch(
        editandoId
          ? `${endpointBase}/${editandoId}`
          : endpointBase,
        {
          method: editandoId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(corpo),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            "Não foi possível salvar o lançamento."
        );
      }

      if (ehReceber) {
        setContasReceber((atuais) => {
          if (editandoId) {
            return atuais.map((item) =>
              item.id === editandoId ? dados : item
            );
          }

          return [...atuais, dados];
        });
      } else {
        setContasPagar((atuais) => {
          if (editandoId) {
            return atuais.map((item) =>
              item.id === editandoId ? dados : item
            );
          }

          return [...atuais, dados];
        });
      }

      limparFormulario();
      setMostrarFormulario(false);

      setSucesso(
        editandoId
          ? "Lançamento atualizado com sucesso."
          : "Lançamento cadastrado com sucesso."
      );

      setTimeout(() => {
        setSucesso("");
      }, 3500);
    } catch (error) {
      console.error(error);
      setErro(error.message || "Erro ao salvar lançamento.");
    }
  }

  async function registrarPagamento(conta) {
    const ehReceber = aba === "receber";

    const tipo = ehReceber
      ? "recebimento"
      : "pagamento";

    const confirmar = window.confirm(
      `Registrar ${tipo}?\\n\\n` +
      `${conta.descricao}\\n` +
      `Valor: ${formatarMoeda(conta.valor)}`
    );

    if (!confirmar) {
      return;
    }

    const dataAtual = new Date()
      .toISOString()
      .slice(0, 10);

    const forma = window.prompt(
      "Informe a forma de pagamento:\\n\\n" +
      "dinheiro\\n" +
      "pix\\n" +
      "cartao_credito\\n" +
      "cartao_debito\\n" +
      "transferencia\\n" +
      "outro",
      conta.forma_pagamento || "pix"
    );

    if (forma === null) {
      return;
    }

    const formaLimpa = forma.trim();

    if (!FORMAS_PAGAMENTO[formaLimpa]) {
      setErro("Forma de pagamento inválida.");
      return;
    }

    const valorInformado = window.prompt(
      `Informe o valor do ${tipo}:`,
      String(conta.valor || "")
    );

    if (valorInformado === null) {
      return;
    }

    const valorPago = Number(
      valorInformado.replace(",", ".")
    );

    if (!Number.isFinite(valorPago) || valorPago <= 0) {
      setErro("Informe um valor válido.");
      return;
    }

    try {
      setErro("");
      setSucesso("");

      const endpoint = ehReceber
        ? `${API_URL}/contas-receber/${conta.id}`
        : `${API_URL}/contas-pagar/${conta.id}`;

      const corpo = ehReceber
        ? {
            descricao: conta.descricao,
            categoria: conta.categoria || null,
            valor: Number(conta.valor),
            vencimento: conta.vencimento,
            status: "pago",
            forma_pagamento: formaLimpa,
            data_pagamento: dataAtual,
            valor_pago: valorPago,
            observacoes: conta.observacoes || null,
          }
        : {
            fornecedor: conta.fornecedor || "",
            descricao: conta.descricao,
            categoria: conta.categoria || null,
            valor: Number(conta.valor),
            vencimento: conta.vencimento,
            status: "pago",
            forma_pagamento: formaLimpa,
            data_pagamento: dataAtual,
            valor_pago: valorPago,
            observacoes: conta.observacoes || null,
          };

      const resposta = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(corpo),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
          `Não foi possível registrar o ${tipo}.`
        );
      }

      if (ehReceber) {
        setContasReceber((atuais) =>
          atuais.map((item) =>
            item.id === conta.id ? dados : item
          )
        );
      } else {
        setContasPagar((atuais) =>
          atuais.map((item) =>
            item.id === conta.id ? dados : item
          )
        );
      }

      setSucesso(
        ehReceber
          ? "Recebimento registrado com sucesso."
          : "Pagamento registrado com sucesso."
      );

      setTimeout(() => {
        setSucesso("");
      }, 3500);
    } catch (error) {
      console.error(error);
      setErro(
        error.message ||
        `Erro ao registrar ${tipo}.`
      );
    }
  }

  async function excluirLancamento(conta) {
    const tipo =
      aba === "receber"
        ? "conta a receber"
        : "conta a pagar";

    const confirmar = window.confirm(
      `Deseja realmente desativar esta ${tipo}?\n\n${conta.descricao}`
    );

    if (!confirmar) {
      return;
    }

    try {
      setErro("");
      setSucesso("");

      const endpoint =
        aba === "receber"
          ? `${API_URL}/contas-receber/${conta.id}`
          : `${API_URL}/contas-pagar/${conta.id}`;

      const resposta = await fetch(endpoint, {
        method: "DELETE",
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            "Não foi possível desativar o lançamento."
        );
      }

      if (aba === "receber") {
        setContasReceber((atuais) =>
          atuais.filter((item) => item.id !== conta.id)
        );
      } else {
        setContasPagar((atuais) =>
          atuais.filter((item) => item.id !== conta.id)
        );
      }

      setSucesso("Lançamento desativado com sucesso.");

      setTimeout(() => {
        setSucesso("");
      }, 3500);
    } catch (error) {
      console.error(error);
      setErro(
        error.message ||
          "Erro ao desativar lançamento."
      );
    }
  }

  const listaAtual =
    aba === "receber"
      ? contasReceber
      : contasPagar;

  const categorias = useMemo(() => {
    const valores = listaAtual
      .map((conta) => conta.categoria)
      .filter(Boolean);

    return [...new Set(valores)].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [listaAtual]);

  const listaFiltrada = useMemo(() => {
    return listaAtual.filter((conta) => {
      const status = calcularStatus(conta);

      const passouStatus =
        filtroStatus === "todos" ||
        status === filtroStatus;

      const passouCategoria =
        !filtroCategoria ||
        conta.categoria === filtroCategoria;

      return passouStatus && passouCategoria;
    });
  }, [
    listaAtual,
    filtroStatus,
    filtroCategoria,
  ]);

  const resumoReceber = useMemo(() => {
    let pendente = 0;
    let recebido = 0;
    let vencido = 0;
    let cancelado = 0;

    contasReceber.forEach((conta) => {
      const valor = Number(conta.valor || 0);
      const status = calcularStatus(conta);

      if (status === "pago") {
        recebido += Number(
          conta.valor_pago ||
            conta.valor ||
            0
        );
      }

      if (status === "pendente") {
        pendente += valor;
      }

      if (status === "vencido") {
        vencido += valor;
      }

      if (status === "cancelado") {
        cancelado += valor;
      }
    });

    return {
      pendente,
      recebido,
      vencido,
      cancelado,
    };
  }, [contasReceber]);

  const resumoPagar = useMemo(() => {
    let pendente = 0;
    let pago = 0;
    let vencido = 0;
    let cancelado = 0;

    contasPagar.forEach((conta) => {
      const valor = Number(conta.valor || 0);
      const status = calcularStatus(conta);

      if (status === "pago") {
        pago += Number(
          conta.valor_pago ||
            conta.valor ||
            0
        );
      }

      if (status === "pendente") {
        pendente += valor;
      }

      if (status === "vencido") {
        vencido += valor;
      }

      if (status === "cancelado") {
        cancelado += valor;
      }
    });

    return {
      pendente,
      pago,
      vencido,
      cancelado,
    };
  }, [contasPagar]);

  const saldoPrevisto =
    resumoReceber.pendente -
    resumoPagar.pendente;

  const saldoRealizado =
    resumoReceber.recebido -
    resumoPagar.pago;

  const totalVencido =
    resumoReceber.vencido +
    resumoPagar.vencido;

  const totalCancelado =
    resumoReceber.cancelado +
    resumoPagar.cancelado;

  function renderResumoAba() {
    if (aba === "receber") {
      return (
        <>
          <div className="financeiro-resumo-card">
            <span>A RECEBER</span>

            <strong>
              {formatarMoeda(
                resumoReceber.pendente
              )}
            </strong>

            <small>
              Contas pendentes
            </small>
          </div>

          <div className="financeiro-resumo-card">
            <span>RECEBIDO</span>

            <strong>
              {formatarMoeda(
                resumoReceber.recebido
              )}
            </strong>

            <small>
              Contas pagas
            </small>
          </div>

          <div className="financeiro-resumo-card">
            <span>VENCIDO</span>

            <strong>
              {formatarMoeda(
                resumoReceber.vencido
              )}
            </strong>

            <small>
              Valores em atraso
            </small>
          </div>

          <div className="financeiro-resumo-card">
            <span>CANCELADO</span>

            <strong>
              {formatarMoeda(
                resumoReceber.cancelado
              )}
            </strong>

            <small>
              Lançamentos cancelados
            </small>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="financeiro-resumo-card">
          <span>A PAGAR</span>

          <strong>
            {formatarMoeda(
              resumoPagar.pendente
            )}
          </strong>

          <small>
            Contas pendentes
          </small>
        </div>

        <div className="financeiro-resumo-card">
          <span>PAGO</span>

          <strong>
            {formatarMoeda(
              resumoPagar.pago
            )}
          </strong>

          <small>
            Contas pagas
          </small>
        </div>

        <div className="financeiro-resumo-card">
          <span>VENCIDO</span>

          <strong>
            {formatarMoeda(
              resumoPagar.vencido
            )}
          </strong>

          <small>
            Valores em atraso
          </small>
        </div>

        <div className="financeiro-resumo-card">
          <span>CANCELADO</span>

          <strong>
            {formatarMoeda(
              resumoPagar.cancelado
            )}
          </strong>

          <small>
            Lançamentos cancelados
          </small>
        </div>
      </>
    );
  }

  function renderVisaoGeral() {
    return (
      <>
        <section className="financeiro-overview-grid">

          <div className="financeiro-overview-card">
            <span>RECEITAS RECEBIDAS</span>

            <strong>
              {formatarMoeda(
                resumoReceber.recebido
              )}
            </strong>

            <small>
              Valores efetivamente recebidos
            </small>
          </div>

          <div className="financeiro-overview-card">
            <span>DESPESAS PAGAS</span>

            <strong>
              {formatarMoeda(
                resumoPagar.pago
              )}
            </strong>

            <small>
              Valores efetivamente pagos
            </small>
          </div>

          <div className="financeiro-overview-card destaque">
            <span>SALDO REALIZADO</span>

            <strong>
              {formatarMoeda(
                saldoRealizado
              )}
            </strong>

            <small>
              Recebimentos menos pagamentos
            </small>
          </div>

          <div className="financeiro-overview-card">
            <span>SALDO PREVISTO</span>

            <strong>
              {formatarMoeda(
                saldoPrevisto
              )}
            </strong>

            <small>
              Valores pendentes a receber menos a pagar
            </small>
          </div>

        </section>

        <section className="financeiro-overview-section">

          <div className="financeiro-section-title">
            <div>
              <span>
                RESUMO FINANCEIRO
              </span>

              <h2>
                Situação atual
              </h2>
            </div>
          </div>

          <div className="financeiro-overview-lines">

            <div>
              <span>
                Contas a receber pendentes
              </span>

              <strong>
                {formatarMoeda(
                  resumoReceber.pendente
                )}
              </strong>
            </div>

            <div>
              <span>
                Contas a pagar pendentes
              </span>

              <strong>
                {formatarMoeda(
                  resumoPagar.pendente
                )}
              </strong>
            </div>

            <div>
              <span>
                Total vencido
              </span>

              <strong>
                {formatarMoeda(
                  totalVencido
                )}
              </strong>
            </div>

            <div>
              <span>
                Total cancelado
              </span>

              <strong>
                {formatarMoeda(
                  totalCancelado
                )}
              </strong>
            </div>

          </div>

        </section>

        <section className="financeiro-acoes-card">

          <div>
            <span>
              ATALHOS
            </span>

            <h2>
              Gestão financeira
            </h2>

            <p>
              Acesse rapidamente os lançamentos
              financeiros da clínica.
            </p>
          </div>

          <div className="financeiro-acoes">

            <button
              type="button"
              className="financeiro-secondary-button"
              onClick={() =>
                trocarAba("receber")
              }
            >
              Ver contas a receber
            </button>

            <button
              type="button"
              className="financeiro-primary-button"
              onClick={() => {
                trocarAba("pagar");
                setTimeout(() => {
                  setMostrarFormulario(true);
                }, 0);
              }}
            >
              Nova conta a pagar
            </button>

          </div>

        </section>
      </>
    );
  }

  function renderLista() {
    return (
      <section className="financeiro-lista">

        <div className="financeiro-section-title">

          <div>
            <span>
              {aba === "receber"
                ? "CONTAS A RECEBER"
                : "CONTAS A PAGAR"}
            </span>

            <h2>
              Lançamentos
            </h2>
          </div>

          <span>
            {listaFiltrada.length}{" "}
            {listaFiltrada.length === 1
              ? "lançamento"
              : "lançamentos"}
          </span>

        </div>

        <div className="financeiro-filtros">

          <label>
            Status

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

              <option value="pago">
                Pagos
              </option>

              <option value="vencido">
                Vencidos
              </option>

              <option value="cancelado">
                Cancelados
              </option>
            </select>
          </label>

          <label>
            Categoria

            <select
              value={filtroCategoria}
              onChange={(event) =>
                setFiltroCategoria(
                  event.target.value
                )
              }
            >
              <option value="">
                Todas
              </option>

              {categorias.map(
                (categoria) => (
                  <option
                    key={categoria}
                    value={categoria}
                  >
                    {categoria}
                  </option>
                )
              )}
            </select>
          </label>

          <button
            type="button"
            className="financeiro-limpar-filtros"
            onClick={() => {
              setFiltroStatus("todos");
              setFiltroCategoria("");
            }}
          >
            Limpar filtros
          </button>

        </div>

        {carregando ? (
          <div className="financeiro-empty">
            <div className="financeiro-empty-icon">
              ...
            </div>

            <strong>
              Carregando lançamentos
            </strong>

            <p>
              Aguarde enquanto buscamos os dados financeiros.
            </p>
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="financeiro-empty">
            <div className="financeiro-empty-icon">
              $
            </div>

            <strong>
              Nenhum lançamento encontrado
            </strong>

            <p>
              Ajuste os filtros ou cadastre
              um novo lançamento.
            </p>
          </div>
        ) : (
          <div className="financeiro-table-wrapper">

            <table className="financeiro-table">

              <thead>
                <tr>

                  {aba === "pagar" && (
                    <th>
                      Fornecedor
                    </th>
                  )}

                  <th>
                    Descrição
                  </th>

                  <th>
                    Categoria
                  </th>

                  <th>
                    Vencimento
                  </th>

                  <th>
                    Valor
                  </th>

                  <th>
                    Pagamento
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Ações
                  </th>

                </tr>
              </thead>

              <tbody>

                {listaFiltrada.map(
                  (conta) => {
                    const status =
                      calcularStatus(
                        conta
                      );

                    return (
                      <tr key={conta.id}>

                        {aba === "pagar" && (
                          <td>
                            <strong>
                              {conta.fornecedor ||
                                "-"}
                            </strong>
                          </td>
                        )}

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
                          {conta.categoria ||
                            "-"}
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

                          {conta.valor_pago && (
                            <small>
                              Pago:{" "}
                              {formatarMoeda(
                                conta.valor_pago
                              )}
                            </small>
                          )}
                        </td>

                        <td>
                          {conta.forma_pagamento ? (
                            <>
                              <strong>
                                {FORMAS_PAGAMENTO[
                                  conta.forma_pagamento
                                ] ||
                                  conta.forma_pagamento}
                              </strong>

                              {conta.data_pagamento && (
                                <small>
                                  {formatarData(
                                    conta.data_pagamento
                                  )}
                                </small>
                              )}
                            </>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td>
                          <span
                            className={`financeiro-status financeiro-status-${status}`}
                          >
                            {STATUS_LABELS[
                              status
                            ] || status}
                          </span>
                        </td>

                        <td>
                          <div className="financeiro-acoes-tabela">

                            <button
                              type="button"
                              className="financeiro-acao-editar"
                              onClick={() =>
                                editarLancamento(
                                  conta
                                )
                              }
                            >
                              Editar
                            </button>

                            {status !== "pago" &&
                              status !== "cancelado" && (
                                <button
                                  type="button"
                                  className="financeiro-acao-pagamento"
                                  onClick={() =>
                                    registrarPagamento(conta)
                                  }
                                >
                                  {aba === "receber"
                                    ? "Receber"
                                    : "Pagar"}
                                </button>
                              )}

                            <button
                              type="button"
                              className="financeiro-acao-excluir"
                              onClick={() =>
                                excluirLancamento(
                                  conta
                                )
                              }
                            >
                              Excluir
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>
    );
  }

  return (
    <div className="financeiro-page">

      <header className="financeiro-header">

        <div>
          <span className="financeiro-kicker">
            FINANCEIRO
          </span>

          <h1>
            Gestão Financeira
          </h1>

          <p>
            Controle de receitas, despesas e
            acompanhe a movimentação financeira
            da clínica.
          </p>
        </div>

        <div className="financeiro-header-actions">

          <button
            type="button"
            className="financeiro-secondary-button"
            onClick={onVoltar}
          >
            Voltar
          </button>

          <button
            type="button"
            className="financeiro-refresh-button"
            onClick={carregarContas}
          >
            Atualizar
          </button>

          <button
            type="button"
            className="financeiro-primary-button"
            onClick={abrirNovoLancamento}
          >
            + Novo lançamento
          </button>

        </div>

      </header>

      {erro && (
        <div className="financeiro-alert financeiro-alert-erro">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="financeiro-alert financeiro-alert-sucesso">
          {sucesso}
        </div>
      )}

      <section className="financeiro-saldo-card">

        <div>
          <span>
            SALDO PREVISTO
          </span>

          <strong>
            {formatarMoeda(
              saldoPrevisto
            )}
          </strong>

          <small>
            A receber menos contas a pagar pendentes
          </small>
        </div>

        <div className="financeiro-saldo-detalhes">

          <div>
            <span>
              Receitas pendentes
            </span>

            <strong>
              {formatarMoeda(
                resumoReceber.pendente
              )}
            </strong>
          </div>

          <div>
            <span>
              Despesas pendentes
            </span>

            <strong>
              {formatarMoeda(
                resumoPagar.pendente
              )}
            </strong>
          </div>

        </div>

      </section>

      <div className="financeiro-tabs">

        <button
          type="button"
          className={
            aba === "visao-geral"
              ? "financeiro-tab ativo"
              : "financeiro-tab"
          }
          onClick={() =>
            trocarAba("visao-geral")
          }
        >
          <span>
            Visão Geral
          </span>

          <small>
            Resumo financeiro
          </small>
        </button>

        <button
          type="button"
          className={
            aba === "receber"
              ? "financeiro-tab ativo"
              : "financeiro-tab"
          }
          onClick={() =>
            trocarAba("receber")
          }
        >
          <span>
            Contas a Receber
          </span>

          <small>
            {contasReceber.length}{" "}
            {contasReceber.length === 1
              ? "lançamento"
              : "lançamentos"}
          </small>
        </button>

        <button
          type="button"
          className={
            aba === "pagar"
              ? "financeiro-tab ativo"
              : "financeiro-tab"
          }
          onClick={() =>
            trocarAba("pagar")
          }
        >
          <span>
            Contas a Pagar
          </span>

          <small>
            {contasPagar.length}{" "}
            {contasPagar.length === 1
              ? "lançamento"
              : "lançamentos"}
          </small>
        </button>

      </div>

      {aba === "visao-geral" ? (
        renderVisaoGeral()
      ) : (
        <>
          <section className="financeiro-resumo">
            {renderResumoAba()}
          </section>

          {mostrarFormulario && (
            <section className="financeiro-form-card">

              <div className="financeiro-section-title">

                <div>
                  <span>
                    {editandoId
                      ? "EDITAR LANÇAMENTO"
                      : "NOVO LANÇAMENTO"}
                  </span>

                  <h2>
                    {aba === "receber"
                      ? "Conta a receber"
                      : "Conta a pagar"}
                  </h2>
                </div>

              </div>

              <form onSubmit={salvarConta}>

                <div className="financeiro-form-grid">

                  {aba === "pagar" && (
                    <label>
                      Fornecedor

                      <input
                        name="fornecedor"
                        value={
                          formulario.fornecedor
                        }
                        onChange={
                          alterarCampo
                        }
                        placeholder="Ex.: Empresa de materiais"
                      />
                    </label>
                  )}

                  <label>
                    Descrição

                    <input
                      name="descricao"
                      value={
                        formulario.descricao
                      }
                      onChange={
                        alterarCampo
                      }
                      placeholder={
                        aba === "receber"
                          ? "Ex.: Mensalidade Pilates"
                          : "Ex.: Compra de materiais"
                      }
                    />
                  </label>

                  <label>
                    Categoria

                    <input
                      name="categoria"
                      value={
                        formulario.categoria
                      }
                      onChange={
                        alterarCampo
                      }
                      placeholder="Ex.: Pilates"
                    />
                  </label>

                  <label>
                    Valor

                    <input
                      name="valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        formulario.valor
                      }
                      onChange={
                        alterarCampo
                      }
                      placeholder="0,00"
                    />
                  </label>

                  <label>
                    Vencimento

                    <input
                      name="vencimento"
                      type="date"
                      value={
                        formulario.vencimento
                      }
                      onChange={
                        alterarCampo
                      }
                    />
                  </label>

                  <label>
                    Status

                    <select
                      name="status"
                      value={
                        formulario.status
                      }
                      onChange={
                        alterarCampo
                      }
                    >
                      <option value="pendente">
                        Pendente
                      </option>

                      <option value="pago">
                        Pago
                      </option>

                      <option value="cancelado">
                        Cancelado
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
                      onChange={
                        alterarCampo
                      }
                    >
                      <option value="">
                        Não informado
                      </option>

                      {Object.entries(
                        FORMAS_PAGAMENTO
                      ).map(
                        ([valor, nome]) => (
                          <option
                            key={valor}
                            value={valor}
                          >
                            {nome}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  {formulario.status ===
                    "pago" && (
                    <>
                      <label>
                        Data do pagamento

                        <input
                          name="data_pagamento"
                          type="date"
                          value={
                            formulario.data_pagamento
                          }
                          onChange={
                            alterarCampo
                          }
                        />
                      </label>

                      <label>
                        Valor pago

                        <input
                          name="valor_pago"
                          type="number"
                          step="0.01"
                          min="0"
                          value={
                            formulario.valor_pago
                          }
                          onChange={
                            alterarCampo
                          }
                          placeholder="0,00"
                        />
                      </label>
                    </>
                  )}

                  <label className="financeiro-form-full">
                    Observações

                    <textarea
                      name="observacoes"
                      value={
                        formulario.observacoes
                      }
                      onChange={
                        alterarCampo
                      }
                      placeholder="Observações do lançamento..."
                      rows="3"
                    />
                  </label>

                </div>

                <div className="financeiro-form-actions">

                  <button
                    type="button"
                    className="financeiro-secondary-button"
                    onClick={() => {
                      limparFormulario();
                      setMostrarFormulario(
                        false
                      );
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="financeiro-primary-button"
                  >
                    {editandoId
                      ? "Salvar alterações"
                      : "Salvar lançamento"}
                  </button>

                </div>

              </form>

            </section>
          )}

          {renderLista()}
        </>
      )}

    </div>
  );
}

export default Financeiro;
