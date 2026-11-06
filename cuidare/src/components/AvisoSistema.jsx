import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { tocarSomAviso } from "./avisoAudio";
import "./AvisoSistema.css";

export default function AvisoSistema({
  titulo = "Atenção",
  mensagem,
  instrucao = "Verifique os dados e tente novamente.",
  botao = "Entendi",
  aoFechar,
}) {
  const botaoRef = useRef(null);
  const somTocadoRef = useRef(false);

  useEffect(() => {
    const elementoAnterior = document.activeElement;

    botaoRef.current?.focus();

    if (!somTocadoRef.current) {
      somTocadoRef.current = true;
      tocarSomAviso();
    }

    function controlarTeclado(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        aoFechar?.();
      }

      if (event.key === "Tab") {
        event.preventDefault();
        botaoRef.current?.focus();
      }
    }

    document.addEventListener("keydown", controlarTeclado);

    return () => {
      document.removeEventListener("keydown", controlarTeclado);
      if (elementoAnterior?.isConnected) {
        elementoAnterior.focus?.();
      }
    };
  }, [aoFechar]);

  return createPortal(
    <div className="cuidare-aviso-overlay">
      <div
        className="cuidare-aviso-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cuidare-aviso-titulo"
        aria-describedby="cuidare-aviso-mensagem"
      >
        <div className="cuidare-aviso-icone" aria-hidden="true">
          !
        </div>

        <span className="cuidare-aviso-etiqueta">
          ATENÇÃO NECESSÁRIA
        </span>

        <h2 id="cuidare-aviso-titulo">{titulo}</h2>

        <p id="cuidare-aviso-mensagem">{mensagem}</p>

        <div className="cuidare-aviso-instrucao">
          {instrucao}
        </div>

        <button
          type="button"
          ref={botaoRef}
          onClick={aoFechar}
          className="cuidare-aviso-botao"
        >
          {botao}
        </button>
      </div>
    </div>,
    document.body
  );
}
