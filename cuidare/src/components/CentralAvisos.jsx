import { useEffect, useRef, useState } from "react";
import AvisoSistema, {
  prepararSomAviso
} from "./AvisoSistema";
import { notificarErro } from "./avisos";
import "./CentralAvisos.css";

export default function CentralAvisos() {
  const [fila, setFila] = useState([]);
  const contador = useRef(0);
  const ultimo = useRef({ texto: "", instante: 0 });

  useEffect(() => {
    function receber(event) {
      const texto = String(event.detail || "").trim();
      if (!texto) return;

      const agora = Date.now();

      if (
        ultimo.current.texto === texto &&
        agora - ultimo.current.instante < 900
      ) {
        return;
      }

      ultimo.current = { texto, instante: agora };

      const id = ++contador.current;

      setFila((atual) => {
        if (atual.some((item) => item.texto === texto)) {
          return atual;
        }

        return [...atual, { id, texto }];
      });
    }

    let ultimaValidacao = 0;

    function campoInvalido(event) {
      const agora = Date.now();
      event.preventDefault();

      if (agora - ultimaValidacao < 700) return;
      ultimaValidacao = agora;

      const campo = event.target;
      const nome =
        campo.labels?.[0]?.textContent?.trim() ||
        campo.getAttribute("aria-label") ||
        campo.name ||
        "obrigatório";

      notificarErro(
        `Verifique o campo "${nome}". Ele precisa ser preenchido corretamente.`
      );
    }

    function erroInesperado() {
      notificarErro(
        "Ocorreu um erro inesperado. Verifique a operação e tente novamente."
      );
    }

    window.addEventListener("cuidare:erro", receber);
    document.addEventListener(
      "pointerdown", prepararSomAviso, true
    );
    document.addEventListener(
      "keydown", prepararSomAviso, true
    );
    document.addEventListener(
      "invalid", campoInvalido, true
    );
    window.addEventListener("error", erroInesperado);
    window.addEventListener(
      "unhandledrejection", erroInesperado
    );

    return () => {
      window.removeEventListener("cuidare:erro", receber);
      document.removeEventListener(
        "pointerdown", prepararSomAviso, true
      );
      document.removeEventListener(
        "keydown", prepararSomAviso, true
      );
      document.removeEventListener(
        "invalid", campoInvalido, true
      );
      window.removeEventListener("error", erroInesperado);
      window.removeEventListener(
        "unhandledrejection", erroInesperado
      );
    };
  }, []);

  const aviso = fila[0];

  if (!aviso) return null;

  return (
    <AvisoSistema
      key={aviso.id}
      titulo={
        aviso.texto.includes("Já existe um agendamento")
          ? "Horário indisponível"
          : "Atenção necessária"
      }
      mensagem={aviso.texto}
      instrucao="Verifique as informações antes de continuar."
      botao="Entendi"
      aoFechar={() => setFila((atual) => atual.slice(1))}
    />
  );
}
