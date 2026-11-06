import { useEffect, useRef, useState } from "react";
import { API_URL } from "../config";
import "./VisualizadorRecibo.css";

export default function VisualizadorRecibo({ reciboId, numeroRecibo, onFechar }) {
  const [urlPdf, setUrlPdf] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!reciboId) return undefined;
    let ativo = true;
    let urlTemporaria = "";

    async function carregarPdf() {
      setCarregando(true);
      setErro("");
      setUrlPdf("");
      try {
        const resposta = await fetch(
          `${API_URL}/contas-receber/recebimentos/${reciboId}/recibo.pdf`
        );
        if (!resposta.ok) {
          const detalhe = await resposta.text();
          throw new Error(detalhe || "Não foi possível abrir o recibo.");
        }
        const pdf = await resposta.blob();
        if (!ativo) return;
        urlTemporaria = URL.createObjectURL(
          new Blob([pdf], { type: "application/pdf" })
        );
        setUrlPdf(urlTemporaria);
      } catch (e) {
        if (ativo) setErro(e.message || "Não foi possível abrir o recibo.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarPdf();
    return () => {
      ativo = false;
      if (urlTemporaria) URL.revokeObjectURL(urlTemporaria);
    };
  }, [reciboId]);

  useEffect(() => {
    function tratarTecla(evento) {
      if (evento.key === "Escape") onFechar?.();
    }
    window.addEventListener("keydown", tratarTecla);
    return () => window.removeEventListener("keydown", tratarTecla);
  }, [onFechar]);

  function imprimir() {
    const janelaPdf = frameRef.current?.contentWindow;
    if (!janelaPdf) return;
    janelaPdf.focus();
    janelaPdf.print();
  }

  return (
    <div className="cuidare-recibo-overlay" role="presentation" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onFechar?.();
    }}>
      <section className="cuidare-recibo-visualizador" role="dialog" aria-modal="true"
        aria-labelledby="cuidare-recibo-titulo">
        <header className="cuidare-recibo-cabecalho">
          <div>
            <span>RECIBO FINANCEIRO</span>
            <h2 id="cuidare-recibo-titulo">Recibo #{numeroRecibo || reciboId}</h2>
          </div>
          <div className="cuidare-recibo-acoes">
            <button type="button" onClick={imprimir} disabled={!urlPdf}>
              Imprimir recibo
            </button>
            <button type="button" className="cuidare-recibo-fechar" onClick={onFechar}
              aria-label="Fechar visualização">×</button>
          </div>
        </header>
        {carregando && <div className="cuidare-recibo-mensagem">Preparando visualização do recibo…</div>}
        {erro && <div className="cuidare-recibo-erro" role="alert">{erro}</div>}
        {urlPdf && (
          <iframe ref={frameRef} className="cuidare-recibo-pdf" src={urlPdf}
            title={`Visualização do recibo ${numeroRecibo || reciboId}`} />
        )}
      </section>
    </div>
  );
}
