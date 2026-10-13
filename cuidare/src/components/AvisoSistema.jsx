import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./AvisoSistema.css";

let contextoAudio = null;

export function prepararSomAviso() {
  try {
    const AudioContexto =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContexto) return;

    if (!contextoAudio) {
      contextoAudio = new AudioContexto();
    }

    if (contextoAudio.state === "suspended") {
      contextoAudio.resume().catch(() => {});
    }
  } catch {
    // O aviso visual funciona mesmo sem áudio.
  }
}

function tocarSomAviso() {
  if (!contextoAudio || contextoAudio.state !== "running") {
    return;
  }

  try {
    const inicio = contextoAudio.currentTime + 0.02;

    [587.33, 440].forEach((frequencia, indice) => {
      const tempo = inicio + indice * 0.16;
      const oscilador = contextoAudio.createOscillator();
      const volume = contextoAudio.createGain();

      oscilador.type = "sine";
      oscilador.frequency.value = frequencia;

      volume.gain.setValueAtTime(0.0001, tempo);
      volume.gain.exponentialRampToValueAtTime(
        0.20, tempo + 0.025
      );
      volume.gain.exponentialRampToValueAtTime(
        0.0001, tempo + 0.19
      );

      oscilador.connect(volume);
      volume.connect(contextoAudio.destination);

      oscilador.start(tempo);
      oscilador.stop(tempo + 0.2);
    });
  } catch {
    // Não impede a exibição do aviso.
  }
}

export default function AvisoSistema({
  titulo = "Atenção",
  mensagem,
  instrucao = "Verifique os dados e tente novamente.",
  botao = "Entendi",
  aoFechar,
}) {
  const botaoRef = useRef(null);
  const fecharRef = useRef(aoFechar);
  const somTocadoRef = useRef(false);

  fecharRef.current = aoFechar;

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
        fecharRef.current();
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
  }, []);

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
