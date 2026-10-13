import { useCallback, useState } from "react";

export function notificarErro(mensagem) {
  const texto = String(
    mensagem?.message || mensagem || ""
  ).trim();

  if (!texto) return;

  window.dispatchEvent(
    new CustomEvent("cuidare:erro", {
      detail: texto,
    })
  );
}

export function mensagemEhErro(mensagem) {
  return /^(erro|falha|falhou|não foi possível|não foi possivel|ocorreu um erro)/i
    .test(String(mensagem || "").trim());
}

export function useErro(inicial = "") {
  const [erro, atualizarErro] = useState(inicial);

  const setErro = useCallback((mensagem) => {
    atualizarErro(mensagem);

    if (mensagem) {
      notificarErro(mensagem);
    }
  }, []);

  return [erro, setErro];
}

export function useMensagem(inicial = "") {
  const [mensagem, atualizarMensagem] = useState(inicial);

  const setMensagem = useCallback((valor) => {
    atualizarMensagem(valor);

    if (mensagemEhErro(valor)) {
      notificarErro(valor);
    }
  }, []);

  return [mensagem, setMensagem];
}
