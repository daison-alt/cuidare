import { useEffect, useMemo, useState } from "react";
import "./Caixa.css";

const API_URL =
  window.location.hostname.includes("app.github.dev")
    ? `https://${window.location.hostname.replace(
        "-5173.app.github.dev",
        "-8000.app.github.dev"
      )}`
    : "http://localhost:8000";

const TIPOS = {
  entrada: "Entrada",
  saida: "Saída",
  sangria: "Sangria",
  suprimento: "Suprimento",
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

  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function Caixa({ onVoltar }) {
  const [caixa, setCaixa] = useState(null);
  const [saldo, setSaldo] = useState(null);
  const [movimentacoes, setMovimentacoes] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [mostrarAbertura, setMostrarAbertura] = useState(false);
  const [mostrarMovimentacao, setMostrarMovimentacao] = useState(false);
  const [mostrarFechamento, setMostrarFechamento] = useState(false);

  const [saldoInicial, setSaldoInicial] = useState("");
  const [saldoFinal, setSaldoFinal] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [movimentacao, setMovimentacao] = useState({
    tipo: "entrada",
    categoria: "",
    descricao: "",
    valor: "",
    forma_pagamento: "",
    observacoes: "",
  });

  async function carregarCaixa() {
    try {
      setCarregando(true);
      setErro("");

      const respostaCaixa = await fetch(`${API_URL}/caixa/aberto`);

      if (respostaCaixa.status === 404) {
        setCaixa(null);
        setSaldo(null);
        setMovimentacoes([]);
        return;
      }

      if (!respostaCaixa.ok) {
        throw new Error("Não foi possível consultar o caixa.");
      }

      const dadosCaixa = await respostaCaixa.json();

      const [respostaSaldo, respostaMovimentacoes] =
        await Promise.all([
          fetch(`${API_URL}/caixa/saldo`),
          fetch(`${API_URL}/caixa/movimentacoes`),
        ]);

      if (!respostaSaldo.ok || !respostaMovimentacoes.ok) {
        throw new Error(
          "Não foi possível carregar os dados do caixa."
        );
      }

      const dadosSaldo = await respostaSaldo.json();
      const dadosMovimentacoes =
        await respostaMovimentacoes.json();

      setCaixa(dadosCaixa);
      setSaldo(dadosSaldo);
      setMovimentacoes(
        Array.isArray(dadosMovimentacoes)
          ? dadosMovimentacoes
          : []
      );
    } catch (error) {
      console.error(error);
      setErro(error.message || "Erro ao carregar o caixa.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarCaixa();
  }, []);

  function alterarMovimentacao(event) {
    const { name, value } = event.target;

    setMovimentacao((atual) => ({
      ...atual,
      [name]: value,
    }));
  }

  async function abrirCaixa(event) {
    event.preventDefault();

    if (!saldoInicial) {
      setErro("Informe o saldo inicial do caixa.");
      return;
    }

    try {
      setErro("");

      const resposta = await fetch(`${API_URL}/caixa/abrir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saldo_inicial: Number(saldoInicial),
          observacoes: observacoes.trim() || null,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail || "Não foi possível abrir o caixa."
        );
      }

      setSaldoInicial("");
      setObservacoes("");
      setMostrarAbertura(false);
      setSucesso("Caixa aberto com sucesso.");

      await carregarCaixa();
    } catch (error) {
      console.error(error);
      setErro(error.message || "Erro ao abrir o caixa.");
    }
  }

  async function registrarMovimentacao(event) {
    event.preventDefault();

    if (
      !movimentacao.categoria.trim() ||
      !movimentacao.descricao.trim() ||
      !movimentacao.valor
    ) {
      setErro(
        "Preencha categoria, descrição e valor da movimentação."
      );
      return;
    }

    try {
      setErro("");

      const resposta = await fetch(
        `${API_URL}/caixa/movimentacoes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...movimentacao,
            categoria: movimentacao.categoria.trim(),
            descricao: movimentacao.descricao.trim(),
            valor: Number(movimentacao.valor),
            forma_pagamento:
              movimentacao.forma_pagamento || null,
            observacoes:
              movimentacao.observacoes.trim() || null,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            "Não foi possível registrar a movimentação."
        );
      }

      setMovimentacao({
        tipo: "entrada",
        categoria: "",
        descricao: "",
        valor: "",
        forma_pagamento: "",
        observacoes: "",
      });

      setMostrarMovimentacao(false);
      setSucesso("Movimentação registrada com sucesso.");

      await carregarCaixa();
    } catch (error) {
      console.error(error);
      setErro(
        error.message || "Erro ao registrar movimentação."
      );
    }
  }

  async function fecharCaixa(event) {
    event.preventDefault();

    if (!saldoFinal) {
      setErro("Informe o saldo final do caixa.");
      return;
    }

    try {
      setErro("");

      const resposta = await fetch(`${API_URL}/caixa/fechar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saldo_final: Number(saldoFinal),
          observacoes: observacoes.trim() || null,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail || "Não foi possível fechar o caixa."
        );
      }

      setSaldoFinal("");
      setObservacoes("");
      setMostrarFechamento(false);

      setCaixa(null);
      setSaldo(null);
      setMovimentacoes([]);

      setSucesso("Caixa fechado com sucesso.");
    } catch (error) {
      console.error(error);
      setErro(error.message || "Erro ao fechar o caixa.");
    }
  }

  const totais = useMemo(() => {
    return movimentacoes.reduce(
      (resultado, item) => {
        const valor = Number(item.valor || 0);

        if (
          item.tipo === "entrada" ||
          item.tipo === "suprimento"
        ) {
          resultado.entradas += valor;
        }

        if (
          item.tipo === "saida" ||
          item.tipo === "sangria"
        ) {
          resultado.saidas += valor;
        }

        if (item.tipo === "sangria") {
          resultado.sangrias += valor;
        }

        if (item.tipo === "suprimento") {
          resultado.suprimentos += valor;
        }

        return resultado;
      },
      {
        entradas: 0,
        saidas: 0,
        sangrias: 0,
        suprimentos: 0,
      }
    );
  }, [movimentacoes]);

  return (
    <div className="caixa-page">
      <header className="caixa-header">
        <div>
          <span className="caixa-kicker">CAIXA</span>

          <h1>Controle de Caixa</h1>

          <p>
            Acompanhe abertura, movimentações e fechamento
            do caixa da clínica.
          </p>
        </div>

        <div className="caixa-header-actions">
          <button
            type="button"
            className="caixa-secondary-button"
            onClick={onVoltar}
          >
            Voltar
          </button>

          <button
            type="button"
            className="caixa-refresh-button"
            onClick={carregarCaixa}
          >
            Atualizar
          </button>

          {caixa && (
            <button
              type="button"
              className="caixa-danger-button"
              onClick={() => {
                setErro("");
                setSucesso("");
                setMostrarFechamento(true);
              }}
            >
              Fechar caixa
            </button>
          )}
        </div>
      </header>

      {erro && (
        <div className="caixa-alert caixa-alert-erro">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="caixa-alert caixa-alert-sucesso">
          {sucesso}
        </div>
      )}

      {carregando ? (
        <section className="caixa-empty">
          <strong>Carregando caixa...</strong>
          <p>Aguarde enquanto consultamos os dados.</p>
        </section>
      ) : !caixa ? (
        <section className="caixa-card caixa-card-abertura">
          <span className="caixa-kicker">CAIXA FECHADO</span>

          <h2>Nenhum caixa está aberto</h2>

          <p>
            Abra o caixa para começar a registrar
            recebimentos, pagamentos, sangrias e suprimentos.
          </p>

          {!mostrarAbertura ? (
            <button
              type="button"
              className="caixa-primary-button"
              onClick={() => {
                setErro("");
                setSucesso("");
                setMostrarAbertura(true);
              }}
            >
              Abrir caixa
            </button>
          ) : (
            <form onSubmit={abrirCaixa} className="caixa-form">
              <label>
                Saldo inicial
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={saldoInicial}
                  onChange={(event) =>
                    setSaldoInicial(event.target.value)
                  }
                  placeholder="0,00"
                />
              </label>

              <label>
                Observações
                <textarea
                  rows="3"
                  value={observacoes}
                  onChange={(event) =>
                    setObservacoes(event.target.value)
                  }
                  placeholder="Observações da abertura..."
                />
              </label>

              <div className="caixa-form-actions">
                <button
                  type="button"
                  className="caixa-secondary-button"
                  onClick={() => setMostrarAbertura(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="caixa-primary-button"
                >
                  Confirmar abertura
                </button>
              </div>
            </form>
          )}
        </section>
      ) : (
        <>
          <section className="caixa-status-card">
            <div>
              <span>STATUS</span>
              <strong>Caixa aberto</strong>
              <small>
                Aberto em {formatarData(caixa.data_abertura)}
              </small>
            </div>

            <div className="caixa-status-saldo">
              <span>SALDO ATUAL</span>
              <strong>
                {formatarMoeda(saldo?.saldo_atual)}
              </strong>
            </div>
          </section>

          <section className="caixa-resumo-grid">
            <div className="caixa-resumo-card">
              <span>ENTRADAS</span>
              <strong>
                {formatarMoeda(totais.entradas)}
              </strong>
            </div>

            <div className="caixa-resumo-card">
              <span>SAÍDAS</span>
              <strong>
                {formatarMoeda(totais.saidas)}
              </strong>
            </div>

            <div className="caixa-resumo-card">
              <span>SANGRIAS</span>
              <strong>
                {formatarMoeda(totais.sangrias)}
              </strong>
            </div>

            <div className="caixa-resumo-card">
              <span>SUPRIMENTOS</span>
              <strong>
                {formatarMoeda(totais.suprimentos)}
              </strong>
            </div>
          </section>

          <section className="caixa-card">
            <div className="caixa-section-header">
              <div>
                <span className="caixa-kicker">
                  MOVIMENTAÇÕES
                </span>

                <h2>Movimentações do caixa</h2>
              </div>

              <button
                type="button"
                className="caixa-primary-button"
                onClick={() => {
                  setErro("");
                  setSucesso("");
                  setMostrarMovimentacao(
                    !mostrarMovimentacao
                  );
                }}
              >
                + Nova movimentação
              </button>
            </div>

            {mostrarMovimentacao && (
              <form
                onSubmit={registrarMovimentacao}
                className="caixa-form caixa-form-movimentacao"
              >
                <label>
                  Tipo
                  <select
                    name="tipo"
                    value={movimentacao.tipo}
                    onChange={alterarMovimentacao}
                  >
                    {Object.entries(TIPOS).map(
                      ([valor, nome]) => (
                        <option key={valor} value={valor}>
                          {nome}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Categoria
                  <input
                    name="categoria"
                    value={movimentacao.categoria}
                    onChange={alterarMovimentacao}
                    placeholder="Ex.: Recebimento"
                  />
                </label>

                <label>
                  Descrição
                  <input
                    name="descricao"
                    value={movimentacao.descricao}
                    onChange={alterarMovimentacao}
                    placeholder="Descrição da movimentação"
                  />
                </label>

                <label>
                  Valor
                  <input
                    name="valor"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={movimentacao.valor}
                    onChange={alterarMovimentacao}
                    placeholder="0,00"
                  />
                </label>

                <label>
                  Forma de pagamento
                  <select
                    name="forma_pagamento"
                    value={movimentacao.forma_pagamento}
                    onChange={alterarMovimentacao}
                  >
                    <option value="">
                      Não informado
                    </option>

                    {Object.entries(
                      FORMAS_PAGAMENTO
                    ).map(([valor, nome]) => (
                      <option key={valor} value={valor}>
                        {nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="caixa-form-full">
                  Observações
                  <textarea
                    name="observacoes"
                    rows="3"
                    value={movimentacao.observacoes}
                    onChange={alterarMovimentacao}
                    placeholder="Observações..."
                  />
                </label>

                <div className="caixa-form-actions caixa-form-full">
                  <button
                    type="button"
                    className="caixa-secondary-button"
                    onClick={() =>
                      setMostrarMovimentacao(false)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="caixa-primary-button"
                  >
                    Registrar movimentação
                  </button>
                </div>
              </form>
            )}

            {movimentacoes.length === 0 ? (
              <div className="caixa-empty">
                <strong>Nenhuma movimentação</strong>
                <p>
                  Ainda não existem movimentações neste caixa.
                </p>
              </div>
            ) : (
              <div className="caixa-table-wrapper">
                <table className="caixa-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Forma</th>
                      <th>Valor</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movimentacoes.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {formatarData(
                            item.data_movimentacao
                          )}
                        </td>

                        <td>
                          <span
                            className={`caixa-tipo caixa-tipo-${item.tipo}`}
                          >
                            {TIPOS[item.tipo] || item.tipo}
                          </span>
                        </td>

                        <td>
                          <strong>{item.descricao}</strong>
                        </td>

                        <td>{item.categoria || "-"}</td>

                        <td>
                          {FORMAS_PAGAMENTO[
                            item.forma_pagamento
                          ] ||
                            item.forma_pagamento ||
                            "-"}
                        </td>

                        <td>
                          <strong>
                            {formatarMoeda(item.valor)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {mostrarFechamento && (
            <section className="caixa-card caixa-card-fechamento">
              <div className="caixa-section-header">
                <div>
                  <span className="caixa-kicker">
                    FECHAMENTO
                  </span>

                  <h2>Fechar caixa</h2>
                </div>
              </div>

              <form onSubmit={fecharCaixa} className="caixa-form">
                <label>
                  Saldo final
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={saldoFinal}
                    onChange={(event) =>
                      setSaldoFinal(event.target.value)
                    }
                    placeholder="0,00"
                  />
                </label>

                <label>
                  Observações
                  <textarea
                    rows="3"
                    value={observacoes}
                    onChange={(event) =>
                      setObservacoes(event.target.value)
                    }
                    placeholder="Observações do fechamento..."
                  />
                </label>

                <div className="caixa-form-actions">
                  <button
                    type="button"
                    className="caixa-secondary-button"
                    onClick={() =>
                      setMostrarFechamento(false)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="caixa-danger-button"
                  >
                    Confirmar fechamento
                  </button>
                </div>
              </form>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default Caixa;
