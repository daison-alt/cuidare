import { useEffect, useState } from "react";
import { API_URL } from "./config";

export default function ResumoPendencias() {
  const [total, setTotal] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function carregar() {
      try {
        const respostas = await Promise.all([
          fetch(`${API_URL}/contas-pagar`, {
            signal: controller.signal,
          }),
          fetch(`${API_URL}/contas-receber`, {
            signal: controller.signal,
          }),
        ]);

        if (respostas.some((resposta) => !resposta.ok)) {
          throw new Error("Consulta financeira indisponível");
        }

        const dados = await Promise.all(
          respostas.map((resposta) => resposta.json())
        );

        if (!dados.every(Array.isArray)) {
          throw new Error("Formato financeiro inválido");
        }

        const pendentes = dados.flat().filter(
          (conta) =>
            conta.ativo !== false &&
            ["pendente", "vencido"].includes(conta.status)
        );

        if (!controller.signal.aborted) {
          setTotal(pendentes.length);
        }
      } catch (erro) {
        if (!controller.signal.aborted) {
          console.error("Erro no resumo financeiro:", erro);
          setTotal(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregar();
    return () => controller.abort();
  }, []);

  return (
    <>
      <strong aria-live="polite">
        {carregando ? "..." : total ?? "—"}
      </strong>
      <small>
        {carregando
          ? "Consultando financeiro..."
          : total === null
            ? "Informações indisponíveis"
            : "Contas a pagar e a receber"}
      </small>
    </>
  );
}
