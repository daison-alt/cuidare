Warning: truncated output (original token count: 21652)
Total output lines: 3135

import { useEffect, useMemo, useState } from "react";
import "./Financeiro.css";
import RecebimentoLotePilates from "../components/RecebimentoLotePilates"; // CUIDARE_RECEBIMENTO_LOTE_V1
import ConciliacaoFinanceira from "../components/ConciliacaoFinanceira";  // CUIDARE_CONCILIACAO_LEITURA_V1
import { API_URL } from "../config";
import AvisoSistema, { prepararSomAviso } from "../components/AvisoSistema";
import VisualizadorRecibo from "../components/VisualizadorRecibo";


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

function normalizarBuscaAluno(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("pt-BR");
}

// CUIDARE_VENCIMENTOS_DIARIOS_V1
function dataLocalFinanceiro() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return [ano, mes, dia].join("-");
}

function Financeiro({ onVoltar, onAbrirCaixa , atalhoDashboard }) { // CUIDARE_INTEGRIDADE_FINANCEIRA_V1
  const [aba, setAba] = useState(() => atalhoDashboard?.aba || "visao-geral");
  // CUIDARE_ATALHOS_DASHBOARD_V1
  const [contaEmFoco, setContaEmFoco] = useState(() => atalhoDashboard?.contaId ?? null);
  const [mostrarConciliacao, setMostrarConciliacao] = useState(false);

  const [contasReceber, setContasReceber] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);

  const [resumoCuidareIA, setResumoCuidareIA] = useState(null);
  const [carregandoCuidareIA, setCarregandoCuidareIA] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [pagamentoModal, setPagamentoModal] = useState(null);
  const [reciboVisualizacao, setReciboVisualizacao] = useState(null);
  const [recebimentoMultiplo, setRecebimentoMultiplo] = useState(null);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState("");
  const [valorPagamento, setValorPagamento] = useState("");

  const [pagamentosRecebimento, setPagamentosRecebimento] = useState([]);
  const [dataRecebimento, setDataRecebimento] = useState(
    new Date().toLocaleDateString("sv-SE")
  );
  const [observacoesRecebimento, setObservacoesRecebimento] = useState("");
  const [salvandoRecebimento, setSalvandoRecebimento] = useState(false);

  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroVencimento, setFiltroVencimento] = useState(() => atalhoDashboard?.vencimento || "todos");
  const [dataVencimento, setDataVencimento] = useState(dataLocalFinanceiro);
  // CUIDARE_ALUNOS_FINANCEIRO_V1
  const [pacientesFinanceiro, setPacientesFinanceiro] = useState([]);
  const [erroNomesFinanceiro, setErroNomesFinanceiro] = useState(false);
  const [visaoCobrancas, setVisaoCobrancas] = useState(
    () => atalhoDashboard?.aba === "receber" ? "todas" : "alunos"
  );
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState(null);
  const [buscaAluno, setBuscaAluno] = useState("");

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

  async function carregarResumoCuidareIA() {
    try {
      setCarregandoCuidareIA(true);

      const token = localStorage.getItem("cuidare_token");

      if (!token) {
        setResumoCuidareIA(null);
        return;
      }

      const resposta = await fetch(
        `${API_URL}/cuidare-ia/financeiro/resumo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!resposta.ok) {
        setResumoCuidareIA(null);
        return;
      }

      const dados = await resposta.json();

      setResumoCuidareIA(dados);
    } catch (error) {
      console.error(
        "Erro ao carregar resumo da Cuidare IA:",
        error
      );

      setResumoCuidareIA(null);
    } finally {
      setCarregandoCuidareIA(false);
    }
  }

  async function carregarContas() {
    try {
      setCarregando(true);
      setErro("");

      const [receberResposta, pagarResposta, pacientesResposta] = await Promise.all([
        fetch(`${API_URL}/contas-receber`),
        fetch(`${API_URL}/contas-pagar`),
        fetch(`${API_URL}/pacientes?incluir_inativos=true`).catch(() => null),
      ]);

      if (!receberResposta.ok || !pagarResposta.ok) {
        throw new Error("Não foi possível carregar os lançamentos.");
      }

      const receber = await receberResposta.json();
      const pagar = await pagarResposta.json();

      setContasReceber(Array.isArray(receber) ? receber : []);
      setContasPagar(Array.isArray(pagar) ? pagar : []);
      if (pacientesResposta?.ok) {
        const pacientes = await pacientesResposta.json();
        setPacientesFinanceiro(Array.isArray(pacientes) ? pacientes : []);
        setErroNomesFinanceiro(false);
      } else {
        // A ausência de permissão para ver pacientes não bloqueia as cobranças.
        setErroNomesFinanceiro(true);
      }
    } catch (error) {
      console.error(error);
      setErro("Não foi possível conectar ao módulo financeiro.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarContas();
    carregarResumoCuidareIA();
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
    setContaEmFoco(null);
    setFiltroStatus("todos");
    setFiltroCategoria("");
    setFiltroVencimento("todos");
    setVisaoCobrancas("alunos");
    setAlunoSelecionadoId(null);
    setBuscaAluno("");
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
    prepararSomAviso();

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

  function registrarPagamento(conta) {
    setErro("");
    setSucesso("");

    setPagamentoModal(conta);

    if (aba === "receber") {
      const total = Number(conta.valor || 0);
      const recebido = Number(conta.valor_pago || 0);
      const pendente = Math.max(0, total - recebido);

      setPagamentosRecebimento([
        {
          forma_pagamento: "",
          valor: pendente > 0 ? pendente.toFixed(2) : "",
        },
      ]);

      setDataRecebimento(
        new Date().toLocaleDateString("sv-SE")
      );

      setObservacoesRecebimento("");

      setFormaPagamentoSelecionada("");
      setValorPagamento("");
      return;
    }

    // Fluxo antigo de CONTAS A PAGAR preservado.
    setFormaPagamentoSelecionada(
      conta.forma_pagamento || ""
    );

    setValorPagamento(
      conta.valor_pago != null
        ? String(conta.valor_pago)
        : String(conta.valor || "")
    );
  }

  function adicionarFormaRecebimento() {
    setPagamentosRecebimento((atuais) => [
      ...atuais,
      {
        forma_pagamento: "",
        valor: "",
      },
    ]);
  }

  function removerFormaRecebimento(index) {
    setPagamentosRecebimento((atuais) =>
      atuais.filter((_, indice) => indice !== index)
    );
  }

  function atualizarFormaRecebimento(
    index,
    campo,
    valor
  ) {
    setPagamentosRecebimento((atuais) =>
      atuais.map((item, indice) =>
        indice === index
          ? {
              ...item,
              [campo]: valor,
            }
          : item
      )
    );
  }

  async function confirmarRecebimento() {
    if (!pagamentoModal) {
      return;
    }

    const conta = pagamentoModal;

    const totalConta = Number(conta.valor || 0);
    const jaRecebido = Number(conta.valor_pago || 0);
    const pendente = Math.max(
      0,
      totalConta - jaRecebido
    );

    if (pendente <= 0) {
      setErro(
        "Esta conta já está totalmente recebida."
      );
      return;
    }

    if (!dataRecebimento) {
      setErro(
        "Informe a data do recebimento."
      );
      return;
    }

    if (!pagamentosRecebimento.length) {
      setErro(
        "Adicione pelo menos uma forma de pagamento."
      );
      return;
    }

    const formas = pagamentosRecebimento.map(
      (item) => item.forma_pagamento.trim()
    );

    const formaInvalida = formas.some(
      (forma) => !FORMAS_PAGAMENTO[forma]
    );

    if (formaInvalida) {
      setErro(
        "Selecione uma forma de pagamento para cada linha."
      );
      return;
    }

    const formasDuplicadas =
      new Set(formas).size !== formas.length;

    if (formasDuplicadas) {
      setErro(
        "Não é permitido repetir a mesma forma de pagamento neste recebimento."
      );
      return;
    }

    const pagamentos = pagamentosRecebimento.map(
      (item) => ({
        forma_pagamento:
          item.forma_pagamento.trim(),
        valor: Number(
          String(item.valor).replace(",", ".")
        ),
      })
    );

    const valorInvalido = pagamentos.some(
      (item) =>
        !Number.isFinite(item.valor) ||
        item.valor <= 0
    );

    if (valorInvalido) {
      setErro(
        "Informe um valor válido em cada forma de pagamento."
      );
      return;
    }

    const totalRecebimento =
      pagamentos.reduce(
        (total, item) =>
          total + item.valor,
        0
      );

    const diferenca =
      Math.round(
        (totalRecebimento - pendente) *
          100
      ) / 100;

    if (diferenca > 0) {
      setErro(
        `O recebimento não pode ultrapassar o valor pendente de ${formatarMoeda(
          pendente
        )}.`
      );
      return;
    }

    if (totalRecebimento <= 0) {
      setErro(
        "O valor do recebimento deve ser maior que zero."
      );
      return;
    }

    const confirmar = window.confirm(
      `Confirmar recebimento?\\n\\n` +
      `${conta.descricao}\\n` +
      `Pendente atual: ${formatarMoeda(pendente)}\\n` +
      `Recebimento: ${formatarMoeda(totalRecebimento)}\\n` +
      `Restante: ${formatarMoeda(
        Math.max(
          0,
          pendente - totalRecebimento
        )
      )}`
    );

    if (!confirmar) {
      return;
    }

    try {
      setErro("");
      setSucesso("");
      setSalvandoRecebimento(true);

      const resposta = await fetch(
        `${API_URL}/contas-receber/${conta.id}/recebimentos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data_recebimento:
              dataRecebimento,
            pagamentos,
            observacoes:
              observacoesRecebimento.trim() ||
              null,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            "Não foi possível registrar o recebimento."
        );
      }

      // ------------------------------------------------------
      // NFS-e - CRIAR A PARTIR DO RECEBIMENTO
      // ------------------------------------------------------

      try {
        const respostaNFSe = await fetch(
          `${API_URL}/recibos/recebimento/${dados.id}`,
          {
            method: "POST",
          }
        );

        if (!respostaNFSe.ok) {
          const erroNFSe = await respostaNFSe.text();
          console.error("Erro ao criar NFS-e:", erroNFSe);
        } else {
          console.log(
            `🟢 NFS-e preparada para o recebimento #${dados.numero_recibo}`
          );
        }
      } catch (erroNFSe) {
        console.error(
          "Erro de comunicação ao preparar NFS-e:",
          erroNFSe
        );
      }

      // ------------------------------------------------------
      // Abre o recibo dentro do Cuidare para visualizar e imprimir.
      // ------------------------------------------------------

      if (!dados.id) {
        throw new Error(
          "Recebimento salvo, mas o identificador do recibo não foi retornado."
        );
      }

      setReciboVisualizacao({
        id: dados.id,
        numero: dados.numero_recibo || String(dados.id).padStart(6, "0"),
      });

      // Recarrega a conta para obter o saldo/status
      // atualizados pelo backend.
      const respostaContas = await fetch(
        `${API_URL}/contas-receber`
      );

      if (!respostaContas.ok) {
        throw new Error(
          "Recebimento salvo, mas não foi possível atualizar a lista de contas."
        );
      }

      const contasAtualizadas =
        await respostaContas.json();

      setContasReceber(
        Array.isArray(contasAtualizadas)
          ? contasAtualizadas
          : []
      );

      setPagamentoModal(null);
      setFormaPagamentoSelecionada("");
      setValorPagamento("");
      setPagamentosRecebimento([]);
      setObservacoesRecebimento("");

      setSucesso(
        `Recebimento registrado com sucesso. Recibo #${dados.numero_recibo}.`
      );

      setTimeout(() => {
        setSucesso("");
      }, 5000);
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          "Erro ao registrar recebimento."
      );
    } finally {
      setSalvandoRecebimento(false);
    }
  }

  async function confirmarPagamento() {
    if (!pagamentoModal) {
      return;
    }

    // NOVO FLUXO:
    // Contas a Receber utiliza a estrutura de
    // recebimentos parciais/múltiplos.
    if (aba === "receber") {
      await confirmarRecebimento();
      return;
    }

    // FLUXO ORIGINAL DE CONTAS A PAGAR.
    // Não alterar esta lógica.
    const tipo = "pagamento";

    const formaLimpa =
      formaPagamentoSelecionada.trim();

    if (!FORMAS_PAGAMENTO[formaLimpa]) {
      setErro(
        "Selecione a forma de pagamento."
      );
      return;
    }

    const valorPago = Number(
      String(valorPagamento).replace(",", ".")
    );

    if (
      !Number.isFinite(valorPago) ||
      valorPago <= 0
    ) {
      setErro("Informe um valor válido.");
      return;
    }

    const conta = pagamentoModal;

    const confirmar = window.confirm(
      `Confirmar ${tipo}?\\n\\n` +
      `${conta.descricao}\\n` +
      `Valor: ${formatarMoeda(valorPago)}\\n` +
      `Forma: ${FORMAS_PAGAMENTO[formaLimpa]}`
    );

    if (!confirmar) {
      return;
    }

    const dataAtual = new Date()
      .toISOString()
      .slice(0, 10);

    try {
      setErro("");
      setSucesso("");

      const endpoint =
        `${API_URL}/contas-pagar/${conta.id}`;

      const corpo = {
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
            "Não foi possível registrar o pagamento."
        );
      }

      setContasPagar((atuais) =>
        atuais.map((item) =>
          item.id === conta.id
            ? dados
            : item
        )
      );

      setPagamentoModal(null);
      setFormaPagamentoSelecionada("");
      setValorPagamento("");

      setSucesso(
        "Pagamento registrado com sucesso."
      );

      setTimeout(() => {
        setSucesso("");
      }, 3500);
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          "Erro ao registrar pagamento."
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

  const nomesAlunos = useMemo(
    () => new Map(
      pacientesFinanceiro.map((p) => [
        String(p.id),
        p.nome || "Paciente #" + p.id,
      ])
    ),
    [pacientesFinanceiro]
  );

  function nomeAlunoPorId(id) {
    if (id == null) return "Sem paciente vinculado";
    return nomesAlunos.get(String(id)) || "Paciente #" + id;
  }

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

      const passouAluno =
        aba !== "receber" ||
        visaoCobrancas !== "alunos" ||
   …9652 tokens truncated…                     />
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

                      {aba === "pagar" && (
                        <option value="pago">Pago</option>
                      )}

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
                      required={
                        formulario.status === "pago"
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

      {recebimentoMultiplo && (
        <RecebimentoLotePilates
          pacienteId={recebimentoMultiplo.pacienteId}
          nomePaciente={recebimentoMultiplo.nome}
          contas={contasReceber}
          onFechar={() => setRecebimentoMultiplo(null)}
          onConfirmado={carregarContas}
        />
      )}

      {pagamentoModal && (
        <div className="financeiro-modal-overlay">
          <div className="financeiro-modal">

            <div className="financeiro-modal-header">
              <div>
                <span className="financeiro-modal-eyebrow">
                  {aba === "receber"
                    ? "Recebimento"
                    : "Pagamento"}
                </span>

                <h2>
                  {aba === "receber"
                    ? "Receber conta"
                    : "Pagar lançamento"}
                </h2>
              </div>

              <button
                type="button"
                className="financeiro-modal-fechar"
                onClick={() => {
                  if (salvandoRecebimento) {
                    return;
                  }

                  setPagamentoModal(null);
                  setFormaPagamentoSelecionada("");
                  setValorPagamento("");
                  setPagamentosRecebimento([]);
                  setObservacoesRecebimento("");
                  setErro("");
                }}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="financeiro-modal-resumo">

              <div>
                <span>Descrição</span>
                <strong>
                  {pagamentoModal.descricao}
                </strong>
              </div>

              {pagamentoModal.fornecedor &&
                aba !== "receber" && (
                  <div>
                    <span>Fornecedor</span>
                    <strong>
                      {pagamentoModal.fornecedor}
                    </strong>
                  </div>
                )}

              <div>
                <span>Valor do lançamento</span>
                <strong>
                  {formatarMoeda(
                    pagamentoModal.valor
                  )}
                </strong>
              </div>

              {aba === "receber" && (
                <>
                  <div>
                    <span>Já recebido</span>
                    <strong>
                      {formatarMoeda(
                        Number(
                          pagamentoModal.valor_pago ||
                            0
                        )
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Valor pendente</span>
                    <strong>
                      {formatarMoeda(
                        Math.max(
                          0,
                          Number(
                            pagamentoModal.valor ||
                              0
                          ) -
                            Number(
                              pagamentoModal.valor_pago ||
                                0
                            )
                        )
                      )}
                    </strong>
                  </div>
                </>
              )}

            </div>

            {aba === "receber" ? (
              <>
                <div className="financeiro-modal-section">
                  <label>
                    Data do recebimento

                    <input
                      type="date"
                      value={dataRecebimento}
                      onChange={(event) =>
                        setDataRecebimento(
                          event.target.value
                        )
                      }
                      disabled={salvandoRecebimento}
                    />
                  </label>
                </div>

                <div className="financeiro-modal-section">
                  <label>
                    Formas de pagamento
                  </label>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {pagamentosRecebimento.map(
                      (item, index) => (
                        <div
                          key={index}
                          className="financeiro-recebimento-linha"
                        >
                          <label>
                            Forma

                            <select
                              className="financeiro-recebimento-select"
                              value={
                                item.forma_pagamento
                              }
                              onChange={(event) =>
                                atualizarFormaRecebimento(
                                  index,
                                  "forma_pagamento",
                                  event.target.value
                                )
                              }
                              disabled={
                                salvandoRecebimento
                              }
                            >
                              <option value="">
                                Selecione
                              </option>

                              {[
                                [
                                  "dinheiro",
                                  "Dinheiro",
                                ],
                                [
                                  "pix",
                                  "PIX",
                                ],
                                [
                                  "cartao_credito",
                                  "Cartão de crédito",
                                ],
                                [
                                  "cartao_debito",
                                  "Cartão de débito",
                                ],
                                [
                                  "transferencia",
                                  "Transferência",
                                ],
                                [
                                  "debito_automatico",
                                  "Débito automático",
                                ],
                                [
                                  "outro",
                                  "Outro",
                                ],
                              ].map(
                                ([
                                  valor,
                                  nome,
                                ]) => (
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

                          <label>
                            Valor

                            <input
                              className="financeiro-recebimento-valor"
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={item.valor}
                              onChange={(event) =>
                                atualizarFormaRecebimento(
                                  index,
                                  "valor",
                                  event.target.value
                                )
                              }
                              placeholder="0,00"
                              disabled={
                                salvandoRecebimento
                              }
                            />
                          </label>

                          {pagamentosRecebimento.length >
                            1 && (
                            <button
                              type="button"
                              className="financeiro-recebimento-remover"
                              onClick={() =>
                                removerFormaRecebimento(
                                  index
                                )
                              }
                              disabled={
                                salvandoRecebimento
                              }
                              title="Remover esta forma de pagamento"
                              aria-label="Remover forma de pagamento"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )
                    )}

                    <button
                      type="button"
                      className="financeiro-adicionar-forma"
                      onClick={
                        adicionarFormaRecebimento
                      }
                      disabled={
                        salvandoRecebimento
                      }
                    >
                      <span className="financeiro-adicionar-forma-icone">
                        +
                      </span>
                      <span>
                        Adicionar outra forma de pagamento
                      </span>
                    </button>
                  </div>
                </div>

                <div className="financeiro-modal-resumo">
                  <div>
                    <span>
                      Total deste recebimento
                    </span>

                    <strong>
                      {formatarMoeda(
                        pagamentosRecebimento.reduce(
                          (total, item) =>
                            total +
                            (Number(
                              String(
                                item.valor
                              ).replace(
                                ",",
                                "."
                              )
                            ) || 0),
                          0
                        )
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Restará após recebimento
                    </span>

                    <strong>
                      {formatarMoeda(
                        Math.max(
                          0,
                          Number(
                            pagamentoModal.valor ||
                              0
                          ) -
                            Number(
                              pagamentoModal.valor_pago ||
                                0
                            ) -
                            pagamentosRecebimento.reduce(
                              (
                                total,
                                item
                              ) =>
                                total +
                                (Number(
                                  String(
                                    item.valor
                                  ).replace(
                                    ",",
                                    "."
                                  )
                                ) || 0),
                              0
                            )
                        )
                      )}
                    </strong>
                  </div>
                </div>

                <div className="financeiro-modal-section financeiro-observacoes-section">
                  <label className="financeiro-observacoes-label">
                    <span className="financeiro-observacoes-titulo">
                      Observações
                    </span>

                    <span className="financeiro-observacoes-ajuda">
                      Registre alguma informação importante sobre este recebimento.
                    </span>

                    <textarea
                      className="financeiro-observacoes-textarea"
                      value={
                        observacoesRecebimento
                      }
                      onChange={(event) =>
                        setObservacoesRecebimento(
                          event.target.value
                        )
                      }
                      placeholder="Ex.: pagamento referente ao pacote, desconto, acordo ou outra observação..."
                      rows="4"
                      disabled={
                        salvandoRecebimento
                      }
                    />
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="financeiro-modal-section">
                  <label>
                    Forma de pagamento
                  </label>

                  <div className="financeiro-formas-pagamento">
                    {[
                      ["dinheiro", "Dinheiro", "💵"],
                      ["pix", "PIX", "◆"],
                      [
                        "cartao_credito",
                        "Cartão de crédito",
                        "💳",
                      ],
                      [
                        "cartao_debito",
                        "Cartão de débito",
                        "💳",
                      ],
                      [
                        "transferencia",
                        "Transferência",
                        "⇄",
                      ],
                      [
                        "debito_automatico",
                        "Débito automático",
                        "↻",
                      ],
                      ["outro", "Outro", "⋯"],
                    ].map(
                      ([
                        valor,
                        nome,
                        icone,
                      ]) => (
                        <button
                          key={valor}
                          type="button"
                          className={`financeiro-forma-pagamento-botao ${
                            formaPagamentoSelecionada ===
                            valor
                              ? "selecionado"
                              : ""
                          }`}
                          onClick={() =>
                            setFormaPagamentoSelecionada(
                              valor
                            )
                          }
                        >
                          <span className="financeiro-forma-icone">
                            {icone}
                          </span>

                          <span>{nome}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="financeiro-modal-section">
                  <label>
                    Valor pago

                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={valorPagamento}
                      onChange={(event) =>
                        setValorPagamento(
                          event.target.value
                        )
                      }
                      placeholder="0,00"
                      autoFocus
                    />
                  </label>
                </div>
              </>
            )}

            {erro && (
              <div className="financeiro-modal-erro">
                {erro}
              </div>
            )}

            <div className="financeiro-modal-acoes">

              <button
                type="button"
                className="financeiro-secondary-button"
                onClick={() => {
                  if (salvandoRecebimento) {
                    return;
                  }

                  setPagamentoModal(null);
                  setFormaPagamentoSelecionada("");
                  setValorPagamento("");
                  setPagamentosRecebimento([]);
                  setObservacoesRecebimento("");
                  setErro("");
                }}
                disabled={salvandoRecebimento}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="financeiro-primary-button"
                onClick={confirmarPagamento}
                disabled={salvandoRecebimento}
              >
                {salvandoRecebimento
                  ? "Salvando..."
                  : aba === "receber"
                  ? "Confirmar recebimento"
                  : "Confirmar pagamento"}
              </button>

            </div>

          </div>
        </div>
      )}

      {reciboVisualizacao && (
        <VisualizadorRecibo
          reciboId={reciboVisualizacao.id}
          numeroRecibo={reciboVisualizacao.numero}
          onFechar={() => setReciboVisualizacao(null)}
        />
      )}


    </div>
  );
}

export default Financeiro;
