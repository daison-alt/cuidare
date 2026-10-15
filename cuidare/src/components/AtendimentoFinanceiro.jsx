import "./AtendimentoFinanceiro.css";

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function AtendimentoFinanceiro({
  agendamento, dados, carregando, gerando, onGerar, onAbrirConta,
}) {
  if (!dados || ["cancelado", "faltou"].includes(agendamento.status)) return null;

  const tipo = agendamento.tipo_atendimento || "normal";
  if (tipo === "experimental" || tipo === "cortesia") {
    return (
      <div className="atendimento-financeiro informativo">
        <span>Sem cobrança · {tipo === "cortesia" ? "Cortesia" : "Aula experimental"}</span>
      </div>
    );
  }

  const contas = Array.isArray(dados.contas) ? dados.contas : [];
  const pendentes = contas.filter(
    (item) => item.status !== "cancelado" && Number(item.saldo_pendente) > 0
  );
  const saldo = pendentes.reduce(
    (total, item) => total + Number(item.saldo_pendente || 0), 0
  );
  const primeira = pendentes[0] || contas[0];

  if (contas.length) {
    return (
      <div className="atendimento-financeiro">
        <span className={pendentes.length ? "atendimento-financeiro-pendente" : "atendimento-financeiro-quitado"}>
          {pendentes.length
            ? `${tipo === "plano" ? "Plano · " : ""}Em aberto: ${moeda(saldo)}`
            : "✓ Cobrança quitada"}
        </span>
        {pendentes.length > 1 && (
          <small>{pendentes.length} cobranças/parcelas em aberto</small>
        )}
        {primeira && onAbrirConta && (
          <button type="button"
            onClick={() => onAbrirConta(primeira.id)}
            className="atendimento-financeiro-acao">
            {pendentes.length ? "Receber no Financeiro →" : "Ver no Financeiro →"}
          </button>
        )}
      </div>
    );
  }

  if (tipo === "plano") {
    return <div className="atendimento-financeiro informativo">
      <span>Plano sem cobrança vinculada (confira a matrícula)</span>
    </div>;
  }
  if (tipo === "avulsa") {
    return <div className="atendimento-financeiro informativo">
      <span>
        {agendamento.status === "concluido"
          ? "Cobrança avulsa não encontrada. Atualize para conferir."
          : "Cobrança será gerada ao concluir a aula avulsa."}
      </span>
    </div>;
  }
  if (tipo === "normal" && agendamento.status === "concluido") {
    const valor = Number(dados.valor_proposto || 0);
    return (
      <div className="atendimento-financeiro">
        <span className="atendimento-financeiro-sem-conta">
          {valor > 0
            ? `Sem cobrança vinculada · ${moeda(valor)}`
            : "Sem preço positivo definido"}
        </span>
        {valor > 0 && onGerar && (
          <button
            type="button"
            className="atendimento-financeiro-acao"
            disabled={carregando || gerando}
            onClick={onGerar}
          >
            {gerando ? "Gerando..." : "Gerar cobrança"}
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="atendimento-financeiro informativo">
      <span>Cobrança após concluir o atendimento</span>
    </div>
  );
}
