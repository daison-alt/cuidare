import { useMemo, useState } from "react";
import { API_URL } from "../config";
import "./RecebimentoLotePilates.css";

const FORMAS = [
  ["pix", "Pix"],
  ["dinheiro", "Dinheiro"],
  ["cartao_debito", "Cartão de débito"],
  ["cartao_credito", "Cartão de crédito"],
  ["transferencia", "Transferência"],
];

function reais(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function centavos(valor) {
  return Math.round(Number(valor || 0) * 100);
}

function dataLocal() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function RecebimentoLotePilates({
  pacienteId,
  nomePaciente,
  contas,
  onFechar,
  onConfirmado,
}) {
  const [selecionadas, setSelecionadas] = useState([]);
  const [pagamentos, setPagamentos] = useState([
    { forma_pagamento: "pix", valor: "" },
  ]);
  const [dataRecebimento, setDataRecebimento] = useState(dataLocal);
  const [observacoes, setObservacoes] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState(null);

  const elegiveis = useMemo(() => contas.filter((c) =>
    String(c.paciente_id) === String(pacienteId) &&
    c.categoria === "Pilates" &&
    /Parcela\s+\d+\/\d+/i.test(c.descricao || "") &&
    c.ativo !== false &&
    !["pago", "cancelado"].includes(c.status) &&
    centavos(c.valor) - centavos(c.valor_pago) > 0
  ).sort((a, b) =>
    String(a.vencimento).localeCompare(String(b.vencimento)) || a.id - b.id
  ), [contas, pacienteId]);

  const contasSelecionadas = elegiveis.filter((c) => selecionadas.includes(c.id));
  const totalCentavos = contasSelecionadas.reduce(
    (s, c) => s + centavos(c.valor) - centavos(c.valor_pago), 0
  );
  const pagamentosCentavos = pagamentos.reduce(
    (s, p) => s + (Number.isFinite(Number(p.valor)) ? centavos(p.valor) : 0), 0
  );
  const corresponde = totalCentavos > 0 && totalCentavos === pagamentosCentavos;

  function alternar(id, checked) {
    setSelecionadas((atual) =>
      checked ? [...atual.filter((v) => v !== id), id] : atual.filter((v) => v !== id)
    );
    setErro("");
  }

  function atualizarPagamento(index, campo, valor) {
    setPagamentos((atual) => atual.map((p, i) =>
      i === index ? { ...p, [campo]: valor } : p
    ));
  }

  function preencherTotal() {
    const anteriores = pagamentos.slice(0, -1).reduce((s, p) =>
      s + centavos(p.valor), 0
    );
    setPagamentos((atual) =>
      atual.map((p, i) =>
        i === atual.length - 1
          ? { ...p, valor: String(Math.max(0, totalCentavos - anteriores) / 100) }
          : p
      )
    );
  }

  async function confirmar() {
    if (processando || resultado) return;
    if (selecionadas.length < 2) {
      setErro("Selecione pelo menos duas parcelas.");
      return;
    }
    if (!dataRecebimento) {
      setErro("Selecione a data do recebimento.");
      return;
    }
    if (!corresponde || pagamentos.some((p) => !p.forma_pagamento ||
      !Number.isFinite(Number(p.valor)) || centavos(p.valor) <= 0
    )) {
      setErro("As formas de pagamento precisam somar exatamente o saldo selecionado.");
      return;
    }
    if (new Set(pagamentos.map((p) => p.forma_pagamento)).size !== pagamentos.length) {
      setErro("Não repita a mesma forma de pagamento.");
      return;
    }

    const confirmado = window.confirm(
      "Confirmar recebimento de " + selecionadas.length + " parcelas para " +
      nomePaciente + "?\n\nTotal: " + reais(totalCentavos / 100) +
      "\nSerão gerados recibos e lançamentos no Caixa."
    );
    if (!confirmado) return;

    setErro("");
    setProcessando(true);
    try {
      const resposta = await fetch(API_URL + "/contas-receber/recebimentos-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: Number(pacienteId),
          conta_ids: selecionadas,
          data_recebimento: dataRecebimento,
          pagamentos: pagamentos.map((p) => ({
            forma_pagamento: p.forma_pagamento,
            valor: Math.round(Number(p.valor) * 100) / 100,
          })),
          observacoes: observacoes.trim() || null,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dados.detail || "Não foi possível concluir o recebimento.");
      }

      // Nunca converta uma falha ao atualizar a interface em erro de recebimento.
      setResultado(dados);
      if (onConfirmado) {
        try { await onConfirmado(); } catch (error) {
          console.warn("Recebimento salvo. Atualize o Financeiro para conferir.", error);
        }
      }
    } catch (error) {
      setErro(error.message || "Não foi possível concluir. Confira os recibos antes de tentar novamente.");
    } finally {
      setProcessando(false);
    }
  }

  async function baixarRecibo(recibo) {
    try {
      const resposta = await fetch(
        API_URL + "/contas-receber/recebimentos/" + recibo.id + "/recibo.pdf"
      );
      if (!resposta.ok) throw new Error("Não foi possível gerar o PDF deste recibo.");
      const blob = await resposta.blob();
      const endereco = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = endereco;
      link.download = "recibo_cuidare_" + recibo.numero_recibo + ".pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(endereco), 30000);
    } catch (e) {
      setErro(e.message || "Falha ao baixar recibo.");
    }
  }

  return (
    <div className="cuidare-lote-overlay" role="presentation">
      <section className="cuidare-lote-modal" role="dialog" aria-modal="true"
        aria-label="Receber várias parcelas de Pilates">
        <header className="cuidare-lote-header">
          <div>
            <small>FINANCEIRO · PILATES</small>
            <h2>Receber várias parcelas</h2>
            <p>Aluno: <strong>{nomePaciente}</strong></p>
          </div>
          <button type="button" onClick={onFechar} disabled={processando}
            className="cuidare-lote-fechar" aria-label="Fechar">×</button>
        </header>

        {resultado ? (
          <div className="cuidare-lote-sucesso">
            <h3>Recebimento concluído!</h3>
            <p>{resultado.quantidade_parcelas} parcelas quitadas · Total: <strong>{reais(resultado.total)}</strong></p>
            <p>Cada parcela possui seu próprio recibo. Baixe os comprovantes abaixo:</p>
            <div className="cuidare-lote-recibos">
              {resultado.recibos.map((recibo) => (
                <button type="button" key={recibo.id}
                  onClick={() => baixarRecibo(recibo)}>
                  <span>Parcela #{recibo.conta_receber_id}</span>
                  <strong>Recibo #{recibo.numero_recibo}</strong>
                  <span>{reais(recibo.valor)} · Baixar PDF ↗</span>
                </button>
              ))}
            </div>
            <p className="cuidare-lote-observacao">
              Os pagamentos e o Caixa já estão registrados. A preparação fiscal/NFS-e deve ser
              conferida separadamente, sem repetir o recebimento.
            </p>
            {erro && <div className="cuidare-lote-erro" role="alert">{erro}</div>}
            <button type="button" className="cuidare-lote-confirmar" onClick={onFechar}>
              Concluir
            </button>
          </div>
        ) : (
          <>
            <div className="cuidare-lote-corpo">
              <h3>1. Selecione as parcelas para quitar</h3>
              <p className="cuidare-lote-instrucao">
                Marque duas ou mais. O sistema considera somente o saldo ainda não pago.
              </p>
              <div className="cuidare-lote-lista">
                {elegiveis.map((conta) => {
                  const saldo = Math.max(0, centavos(conta.valor) - centavos(conta.valor_pago));
                  return (
                    <label key={conta.id} className="cuidare-lote-parcela">
                      <input type="checkbox" checked={selecionadas.includes(conta.id)}
                        disabled={processando}
                        onChange={(e) => alternar(conta.id, e.target.checked)} />
                      <span>
                        <strong>{conta.descricao}</strong>
                        <small>Vence {String(conta.vencimento || "").split("-").reverse().join("/")}</small>
                      </span>
                      <strong>{reais(saldo / 100)}</strong>
                    </label>
                  );
                })}
              </div>
              <div className="cuidare-lote-total">
                <span>{selecionadas.length} parcela(s) selecionada(s)</span>
                <strong>{reais(totalCentavos / 100)}</strong>
              </div>

              <h3>2. Informe o pagamento</h3>
              <label className="cuidare-lote-data">
                Data do recebimento
                <input type="date" value={dataRecebimento}
                  disabled={processando}
                  onChange={(e) => setDataRecebimento(e.target.value)} />
              </label>
              {pagamentos.map((p, i) => (
                <div key={i} className="cuidare-lote-forma">
                  <label>
                    Forma
                    <select value={p.forma_pagamento} disabled={processando}
                      onChange={(e) => atualizarPagamento(i, "forma_pagamento", e.target.value)}>
                      {FORMAS.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                    </select>
                  </label>
                  <label>
                    Valor (R$)
                    <input type="number" min="0.01" step="0.01"
                      value={p.valor} disabled={processando}
                      onChange={(e) => atualizarPagamento(i, "valor", e.target.value)}
                      placeholder="0,00" />
                  </label>
                  {pagamentos.length > 1 && (
                    <button type="button" disabled={processando}
                      className="cuidare-lote-remover"
                      onClick={() => setPagamentos((atual) => atual.filter((_, j) => i !== j))}
                      aria-label="Remover forma">×</button>
                  )}
                </div>
              ))}
              <div className="cuidare-lote-acoes-formas">
                {pagamentos.length < FORMAS.length && (
                  <button type="button" disabled={processando} onClick={() =>
                    setPagamentos((atual) => [
                      ...atual,
                      { forma_pagamento: FORMAS.find(([id]) =>
                        !atual.some((p) => p.forma_pagamento === id)
                      )?.[0] || "pix", valor: "" },
                    ])
                  }>+ Outra forma</button>
                )}
                <button type="button" disabled={processando || !totalCentavos}
                  onClick={preencherTotal}>Preencher valor restante</button>
              </div>
              <div className="cuidare-lote-soma">
                <span>Total informado: {reais(pagamentosCentavos / 100)}</span>
                <strong className={corresponde ? "ok" : "pendente"}>
                  {corresponde ? "Valores conferidos ✓" :
                    "Falta conferir: " + reais((totalCentavos - pagamentosCentavos) / 100)}
                </strong>
              </div>
              <label className="cuidare-lote-obs">
                Observações (opcional)
                <textarea value={observacoes} maxLength={500} disabled={processando}
                  onChange={(e) => setObservacoes(e.target.value)} rows={2}
                  placeholder="Observações do recebimento..." />
              </label>
              {erro && <div className="cuidare-lote-erro" role="alert">{erro}</div>}
            </div>
            <footer className="cuidare-lote-footer">
              <button type="button" onClick={onFechar} disabled={processando}>Cancelar</button>
              <button type="button" className="cuidare-lote-confirmar"
                disabled={processando || selecionadas.length < 2 || !corresponde}
                onClick={confirmar}>
                {processando ? "Registrando..." : "Confirmar recebimento · " + reais(totalCentavos / 100)}
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
