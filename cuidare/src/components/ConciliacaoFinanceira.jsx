import { useEffect, useState } from "react";
import { API_URL } from "../config";
import "./ConciliacaoFinanceira.css";

const MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatar(valor) {
  return MOEDA.format(Number(valor || 0));
}

function ListaItens({ itens, titulo, tipo }) {
  return (
    <section className="conciliacao-grupo">
      <h3>{titulo} ({itens.length})</h3>
      {itens.length === 0 ? (
        <p className="conciliacao-vazio">
          {tipo === "alerta" ? "Nenhuma divergência identificada." : "Nenhuma observação adicional."}
        </p>
      ) : (
        <ul>
          {itens.map((item, i) => (
            <li key={item.codigo + "-" + i}>
              <strong>{item.codigo.replace(/_/g, " ")}</strong>
              <span>{item.mensagem}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ConciliacaoFinanceira({ onFechar }) {
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function conferir() {
    try {
      setCarregando(true);
      setErro("");
      const resposta = await fetch(API_URL + "/financeiro/conciliacao");
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        throw new Error(dados.detail || "Não foi possível conferir os registros.");
      }
      setResultado(await resposta.json());
    } catch (e) {
      setErro(e.message || "Erro ao consultar a conferência.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { conferir(); }, []);

  return (
    <section className="conciliacao-card" aria-label="Conferência de recibos e Caixa">
      <header className="conciliacao-cabecalho">
        <div>
          <span className="conciliacao-marca">CONFERÊNCIA · SOMENTE LEITURA</span>
          <h2>Recibos e Caixa</h2>
          <p>Compare recebimentos, formas de pagamento e entradas registradas no Caixa.</p>
        </div>
        <div className="conciliacao-botoes">
          <button type="button" onClick={conferir} disabled={carregando}>
            {carregando ? "Conferindo..." : "Conferir novamente"}
          </button>
          <button type="button" onClick={onFechar}>Fechar</button>
        </div>
      </header>
      {erro && <p className="conciliacao-erro" role="alert">{erro}</p>}
      {resultado && (
        <>
          <div className="conciliacao-indicadores">
            <div><span>Recibos ativos</span><strong>{resultado.resumo.recibos_ativos}</strong></div>
            <div><span>Total recebido</span><strong>{formatar(resultado.resumo.total_recibos_ativos)}</strong></div>
            <div><span>Entradas conferidas</span><strong>{formatar(resultado.resumo.total_entradas_vinculadas)}</strong></div>
            <div><span>Divergências</span><strong className={resultado.resumo.divergencias ? "conciliacao-vermelho" : "conciliacao-verde"}>{resultado.resumo.divergencias}</strong></div>
          </div>
          <ListaItens itens={resultado.divergencias} titulo="Divergências a verificar" tipo="alerta" />
          <ListaItens itens={resultado.observacoes} titulo="Registros antigos ou observações" tipo="observacao" />
          <p className="conciliacao-nota">{resultado.nota}</p>
        </>
      )}
    </section>
  );
}
