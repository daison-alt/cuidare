import { useCallback, useEffect, useMemo, useState } from "react";
import { useErro } from "../components/avisos";
import { API_URL } from "../config";
import { Banknote, Clock3, Coins, RefreshCw, X } from "lucide-react";
import "./CaixaRecepcao.css";

const TIPOS = {
  entrada: "Entrada",
  saida: "Saída",
  sangria: "Sangria",
  suprimento: "Suprimento",
};
const FORMAS = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência",
};
const CATEGORIAS = {
  entrada: "Entrada avulsa",
  saida: "Saída avulsa",
  sangria: "Retirada de dinheiro",
  suprimento: "Reforço de caixa",
};
const FORMULARIO_VAZIO = {
  tipo: "entrada",
  categoria: "",
  descricao: "",
  valor: "",
  forma_pagamento: "dinheiro",
  observacoes: "",
};

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataHora(valor) {
  if (!valor) return "—";
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? "—"
    : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

async function api(caminho, opcoes = {}) {
  const token = localStorage.getItem("cuidare_token");
  const headers = {
    Accept: "application/json",
    ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: "Bearer " + token } : {}),
    ...opcoes.headers,
  };
  const resposta = await fetch(API_URL + caminho, { ...opcoes, headers });
  let dados = null;
  try {
    dados = await resposta.json();
  } catch {
    // Mantém a mensagem padrão para respostas sem JSON.
  }
  if (!resposta.ok) {
    const erro = new Error(
      typeof dados?.detail === "string"
        ? dados.detail
        : "Não foi possível concluir a operação."
    );
    erro.status = resposta.status;
    throw erro;
  }
  return dados;
}

function CaixaRecepcao({ onVoltar, onAbrirRecebimentos }) {
  const [caixa, setCaixa] = useState(null);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useErro();
  const [sucesso, setSucesso] = useState("");

  const [troco, setTroco] = useState(0);
  const [saldoInicial, setSaldoInicial] = useState("");
  const [usarTroco, setUsarTroco] = useState(true);
  const [consultandoTroco, setConsultandoTroco] = useState(false);
  const [trocoConsultado, setTrocoConsultado] = useState(false);

  const [tipoFormulario, setTipoFormulario] = useState("");
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const [fechamentoAberto, setFechamentoAberto] = useState(false);
  const [saldoContado, setSaldoContado] = useState("");
  const [trocoProximo, setTrocoProximo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [fechando, setFechando] = useState(false);

  const carregar = useCallback(async (silencioso = false) => {
    try {
      if (silencioso) setAtualizando(true);
      else setCarregando(true);
      setErro("");
      let dadosCaixa;
      try {
        dadosCaixa = await api("/caixa/aberto");
      } catch (falha) {
        if (falha.status === 404) {
          setCaixa(null);
          setMovimentacoes([]);
          return;
        }
        throw falha;
      }
      const [lista] = await Promise.all([
        api("/caixa/movimentacoes"),
        api("/caixa/saldo"),
      ]);
      setCaixa(dadosCaixa);
      setMovimentacoes(Array.isArray(lista) ? lista : []);
      setTrocoConsultado(false);
    } catch (falha) {
      console.error("Erro ao carregar caixa da recepção:", falha);
      setErro(falha.message || "Não foi possível carregar o caixa.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [setErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (carregando || caixa || trocoConsultado) return undefined;
    let ativo = true;
    async function consultar() {
      setConsultandoTroco(true);
      try {
        const dados = await api("/caixa/proximo-troco");
        if (!ativo) return;
        const valor = Number(dados?.troco || 0);
        setTroco(valor);
        if (valor > 0) setSaldoInicial(valor.toFixed(2));
      } catch (falha) {
        console.error("Erro ao consultar troco anterior:", falha);
      } finally {
        if (ativo) {
          setConsultandoTroco(false);
          setTrocoConsultado(true);
        }
      }
    }
    consultar();
    return () => { ativo = false; };
  }, [carregando, caixa, trocoConsultado]);

  const porForma = useMemo(() => {
    const valores = {
      dinheiro: 0,
      pix: 0,
      cartao_credito: 0,
      cartao_debito: 0,
      transferencia: 0,
    };
    movimentacoes.forEach((item) => {
      if (!Object.prototype.hasOwnProperty.call(valores, item.forma_pagamento)) return;
      const valor = Number(item.valor || 0);
      if (item.tipo === "entrada" || item.tipo === "suprimento") {
        valores[item.forma_pagamento] += valor;
      } else if (item.tipo === "saida" || item.tipo === "sangria") {
        valores[item.forma_pagamento] -= valor;
      }
    });
    return valores;
  }, [movimentacoes]);

  const dinheiroEsperado = Number(caixa?.saldo_inicial || 0) + porForma.dinheiro;
  const eletronico = porForma.pix + porForma.cartao_credito +
    porForma.cartao_debito + porForma.transferencia;
  const diferenca = saldoContado === "" ? null : Number(saldoContado) - dinheiroEsperado;

  const recentes = useMemo(
    () => [...movimentacoes]
      .sort((a, b) => new Date(b.data_movimentacao || b.criado_em || 0) -
        new Date(a.data_movimentacao || a.criado_em || 0))
      .slice(0, 8),
    [movimentacoes]
  );

  function iniciar(tipo) {
    setErro("");
    setFormulario({ ...FORMULARIO_VAZIO, tipo, categoria: CATEGORIAS[tipo] });
    setTipoFormulario(tipo);
  }

  async function abrirCaixa(event) {
    event.preventDefault();
    if (saldoInicial === "" || Number(saldoInicial) < 0) {
      setErro("Informe o dinheiro físico disponível no início do expediente.");
      return;
    }
    try {
      setErro("");
      setSucesso("");
      await api("/caixa/abrir", {
        method: "POST",
        body: JSON.stringify({
          saldo_inicial: Number(saldoInicial),
          usar_troco_anterior: usarTroco,
        }),
      });
      setSaldoInicial("");
      setSucesso("Caixa aberto. Bom expediente!");
      await carregar(true);
    } catch (falha) {
      setErro(falha.message || "Não foi possível abrir o caixa.");
    }
  }

  async function salvarMovimentacao(event) {
    event.preventDefault();
    if (!formulario.categoria.trim() || !formulario.descricao.trim()) {
      setErro("Preencha a categoria e a descrição.");
      return;
    }
    if (!formulario.valor || Number(formulario.valor) <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    try {
      setSalvando(true);
      setErro("");
      setSucesso("");
      await api("/caixa/movimentacoes", {
        method: "POST",
        body: JSON.stringify({
          ...formulario,
          categoria: formulario.categoria.trim(),
          descricao: formulario.descricao.trim(),
          valor: Number(formulario.valor),
          observacoes: formulario.observacoes.trim() || null,
        }),
      });
      setTipoFormulario("");
      setFormulario(FORMULARIO_VAZIO);
      setSucesso("Lançamento registrado.");
      await carregar(true);
    } catch (falha) {
      setErro(falha.message || "Não foi possível registrar o lançamento.");
    } finally {
      setSalvando(false);
    }
  }

  async function fecharCaixa(event) {
    event.preventDefault();
    if (saldoContado === "" || Number(saldoContado) < 0) {
      setErro("Informe o valor contado em dinheiro.");
      return;
    }
    const valorTroco = Number(trocoProximo || 0);
    if (valorTroco < 0 || valorTroco > Number(saldoContado)) {
      setErro("O troco não pode superar o dinheiro contado.");
      return;
    }
    try {
      setFechando(true);
      setErro("");
      setSucesso("");
      await api("/caixa/fechar", {
        method: "POST",
        body: JSON.stringify({
          saldo_final: Number(saldoContado),
          troco_proxima_abertura: valorTroco,
          observacoes: observacoes.trim() || null,
        }),
      });
      setSaldoContado("");
      setTrocoProximo("");
      setObservacoes("");
      setFechamentoAberto(false);
      setCaixa(null);
      setMovimentacoes([]);
      setTrocoConsultado(false);
      setSucesso("Caixa fechado e expediente encerrado.");
    } catch (falha) {
      setErro(falha.message || "Não foi possível fechar o caixa.");
    } finally {
      setFechando(false);
    }
  }

  if (carregando) {
    return <main className="caixa-recepcao"><div className="cr-loading" role="status">Carregando o caixa...</div></main>;
  }

  return (
    <main className="caixa-recepcao">
      <header className="cr-header">
        <div>
          <span className="cr-kicker">ROTINA DA RECEPÇÃO</span>
          <h1>Caixa</h1>
          <p>Abra, acompanhe e encerre o caixa do expediente.</p>
        </div>
        <div className="cr-header-actions">
          <button className="cr-button secondary" type="button" onClick={() => carregar(true)} disabled={atualizando}>
            <RefreshCw size={16} aria-hidden="true" />
            {atualizando ? "Atualizando..." : "Atualizar"}
          </button>
          {onVoltar && <button className="cr-button secondary" type="button" onClick={onVoltar}>Voltar</button>}
        </div>
      </header>

      {erro && <div className="cr-alert error" role="alert">{erro}</div>}
      {sucesso && <div className="cr-alert success" role="status">{sucesso}</div>}

      {!caixa ? (
        <section className="cr-card cr-open-card">
          <div>
            <span className="cr-kicker">INÍCIO DO EXPEDIENTE</span>
            <h2>Abrir caixa</h2>
            <p>Conte somente o dinheiro físico que ficará disponível para troco.</p>
          </div>
          {consultandoTroco ? (
            <div className="cr-notice">Consultando o troco do expediente anterior...</div>
          ) : troco > 0 ? (
            <div className="cr-notice carry">
              <div><strong>Troco anterior: {moeda(troco)}</strong><span>Confira o valor preenchido antes de abrir.</span></div>
              <label><input type="checkbox" checked={usarTroco} onChange={(e) => {
                setUsarTroco(e.target.checked);
                setSaldoInicial(e.target.checked ? troco.toFixed(2) : "");
              }} /> Usar no saldo inicial</label>
            </div>
          ) : trocoConsultado ? (
            <div className="cr-notice">Nenhum troco anterior registrado. Informe o valor inicial.</div>
          ) : null}
          <form className="cr-form open-form" onSubmit={abrirCaixa}>
            <label>Dinheiro inicial
              <span className="cr-money-input"><b>R$</b><input type="number" min="0" step="0.01" inputMode="decimal" value={saldoInicial} onChange={(e) => setSaldoInicial(e.target.value)} placeholder="0,00" required /></span>
            </label>
            <button className="cr-button primary" type="submit">Abrir caixa do dia</button>
          </form>
        </section>
      ) : (
        <>
          <section className="cr-status">
            <div><span className="cr-dot" /><div><strong>Caixa aberto</strong><small>{caixa.data_abertura ? "Desde " + dataHora(caixa.data_abertura) : "Expediente em andamento"} · Caixa #{caixa.id}</small></div></div>
            {onAbrirRecebimentos && <button className="cr-button link" type="button" onClick={onAbrirRecebimentos}>Recebimentos de pacientes →</button>}
          </section>

          <section className="cr-summary" aria-label="Resumo do caixa">
            <article className="cr-metric featured"><Banknote size={18} aria-hidden="true" /><span>Dinheiro esperado</span><strong>{moeda(dinheiroEsperado)}</strong><small>Saldo inicial e movimentos em dinheiro</small></article>
            <article className="cr-metric"><Coins size={18} aria-hidden="true" /><span>Pix, cartões e transferência</span><strong>{moeda(eletronico)}</strong><small>Movimentos eletrônicos registrados</small></article>
            <article className="cr-metric"><Clock3 size={18} aria-hidden="true" /><span>Lançamentos hoje</span><strong>{movimentacoes.length}</strong><small>Entradas, saídas, sangrias e reforços</small></article>
          </section>

          <section className="cr-card">
            <div className="cr-section-title"><div><span className="cr-kicker">AÇÕES RÁPIDAS</span><h2>O que você precisa fazer?</h2></div></div>
            <div className="cr-actions">
              <button type="button" className="cr-action entry" onClick={() => iniciar("entrada")}><strong>+ Entrada avulsa</strong><small>Outro valor recebido</small></button>
              <button type="button" className="cr-action expense" onClick={() => iniciar("saida")}><strong>− Saída avulsa</strong><small>Despesa paga pelo caixa</small></button>
              <button type="button" className="cr-action" onClick={() => iniciar("sangria")}><strong>Retirada · Sangria</strong><small>Dinheiro retirado do caixa</small></button>
              <button type="button" className="cr-action" onClick={() => iniciar("suprimento")}><strong>Reforço · Suprimento</strong><small>Dinheiro colocado no caixa</small></button>
            </div>
            <p className="cr-help">Pagamentos de consultas e planos devem ser feitos em “Recebimentos de pacientes” para manter o vínculo e gerar o recibo correto.</p>
          </section>

          {tipoFormulario && <section className="cr-card">
            <div className="cr-section-title"><div><span className="cr-kicker">NOVO LANÇAMENTO</span><h2>{TIPOS[tipoFormulario]}</h2></div><button className="cr-icon-button" type="button" aria-label="Fechar formulário" onClick={() => setTipoFormulario("")}><X size={18} /></button></div>
            <form className="cr-form" onSubmit={salvarMovimentacao}>
              <label>Categoria<input value={formulario.categoria} onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })} required /></label>
              <label>Descrição<input value={formulario.descricao} onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })} placeholder="Ex.: material de escritório" required /></label>
              <label>Valor<span className="cr-money-input"><b>R$</b><input type="number" min="0.01" step="0.01" inputMode="decimal" value={formulario.valor} onChange={(e) => setFormulario({ ...formulario, valor: e.target.value })} placeholder="0,00" required /></span></label>
              <label>Forma de pagamento<select value={formulario.forma_pagamento} onChange={(e) => setFormulario({ ...formulario, forma_pagamento: e.target.value })}>{Object.entries(FORMAS).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></label>
              <label className="cr-wide">Observação <span className="cr-optional">(opcional)</span><textarea rows="2" value={formulario.observacoes} onChange={(e) => setFormulario({ ...formulario, observacoes: e.target.value })} /></label>
              <div className="cr-form-actions cr-wide"><button className="cr-button secondary" type="button" onClick={() => setTipoFormulario("")}>Cancelar</button><button className="cr-button primary" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Registrar lançamento"}</button></div>
            </form>
          </section>}

          {fechamentoAberto && <section className="cr-card">
            <div className="cr-section-title"><div><span className="cr-kicker">ENCERRAMENTO</span><h2>Conferir e fechar caixa</h2><p>Confira o dinheiro físico antes de encerrar.</p></div><button className="cr-icon-button" type="button" aria-label="Cancelar fechamento" onClick={() => setFechamentoAberto(false)}><X size={18} /></button></div>
            <div className="cr-close-summary"><div><span>Dinheiro esperado</span><strong>{moeda(dinheiroEsperado)}</strong></div><div><span>Meios eletrônicos registrados</span><strong>{moeda(eletronico)}</strong></div></div>
            <form className="cr-form" onSubmit={fecharCaixa}>
              <label>Dinheiro contado<span className="cr-money-input"><b>R$</b><input type="number" min="0" step="0.01" inputMode="decimal" value={saldoContado} onChange={(e) => setSaldoContado(e.target.value)} placeholder="0,00" required /></span>{diferenca !== null && <small className={diferenca === 0 ? "cr-ok" : "cr-difference"}>Diferença: {moeda(diferenca)}</small>}</label>
              <label>Troco para o próximo expediente <span className="cr-optional">(opcional)</span><span className="cr-money-input"><b>R$</b><input type="number" min="0" step="0.01" inputMode="decimal" value={trocoProximo} onChange={(e) => setTrocoProximo(e.target.value)} placeholder="0,00" /></span></label>
              <label className="cr-wide">Observações <span className="cr-optional">(opcional)</span><textarea rows="2" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Registre diferenças ou ocorrências, se houver." /></label>
              <div className="cr-form-actions cr-wide"><button className="cr-button secondary" type="button" onClick={() => setFechamentoAberto(false)}>Voltar ao caixa</button><button className="cr-button danger" type="submit" disabled={fechando}>{fechando ? "Fechando..." : "Confirmar fechamento"}</button></div>
            </form>
          </section>}

          <section className="cr-card">
            <div className="cr-section-title"><div><span className="cr-kicker">ACOMPANHAMENTO</span><h2>Últimos lançamentos</h2></div><span className="cr-count">{movimentacoes.length} no expediente</span></div>
            {recentes.length ? <div className="cr-list">{recentes.map((item) => {
              const negativo = item.tipo === "saida" || item.tipo === "sangria";
              return <article className="cr-row" key={item.id}>
                <span className={"cr-type " + item.tipo}>{TIPOS[item.tipo] || item.tipo}</span>
                <div><strong>{item.descricao || item.categoria || "Lançamento"}</strong><small>{item.paciente_nome ? "Paciente: " + item.paciente_nome + " · " : ""}{FORMAS[item.forma_pagamento] || item.forma_pagamento || "Forma não informada"} · {dataHora(item.data_movimentacao || item.criado_em)}</small></div>
                <strong className={negativo ? "cr-negative" : "cr-positive"}>{negativo ? "−" : "+"}{moeda(item.valor)}</strong>
              </article>;
            })}</div> : <div className="cr-empty"><strong>Nenhum lançamento neste expediente</strong><span>Os registros aparecerão aqui.</span></div>}
          </section>

          <footer className="cr-footer"><span>Pagamentos de consultas e planos ficam vinculados ao paciente na tela de recebimentos.</span><button className="cr-button danger-outline" type="button" onClick={() => { setErro(""); setSaldoContado(""); setFechamentoAberto(true); }}>Encerrar expediente</button></footer>
        </>
      )}
    </main>
  );
}

export default CaixaRecepcao;
