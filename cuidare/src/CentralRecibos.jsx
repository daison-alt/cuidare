import React, { useEffect, useState } from "react";
import { API_URL } from "./config";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "-";

  const [ano, mes, dia] = String(data).split("-");
  return `${dia}/${mes}/${ano}`;
}

function nomeFormaPagamento(forma) {
  const nomes = {
    dinheiro: "Dinheiro",
    pix: "PIX",
    cartao_credito: "Cartão de crédito",
    cartao_debito: "Cartão de débito",
    transferencia: "Transferência",
    debito_automatico: "Débito automático",
    outro: "Outro",
  };

  return nomes[forma] || forma;
}

export default function CentralRecibos({ onVoltar }) {
  const [recibos, setRecibos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarRecibos() {
    try {
      setCarregando(true);
      setErro("");

      const response = await fetch(
        `${API_URL}/contas-receber/recibos`
      );

      if (!response.ok) {
        throw new Error("Não foi possível carregar os recibos.");
      }

      const data = await response.json();
      setRecibos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar recibos:", error);
      setErro(error.message || "Erro ao carregar recibos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarRecibos();
  }, []);

  function abrirPdf(id) {
    window.open(
      `${API_URL}/contas-receber/recebimentos/${id}/recibo.pdf`,
      "_blank"
    );
  }

  return (
    <div
      style={{
        padding: "28px",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          gap: "16px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#243447" }}>
            Central de Recibos
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#6c757d",
            }}
          >
            Consulte e reimprima os recibos financeiros emitidos.
          </p>
        </div>

        <button
          onClick={onVoltar}
          style={{
            padding: "10px 18px",
            border: "1px solid #d6dce2",
            background: "#fff",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Voltar
        </button>
      </div>

      {erro && (
        <div
          style={{
            padding: "14px",
            marginBottom: "18px",
            borderRadius: "8px",
            background: "#fdecea",
            color: "#b42318",
          }}
        >
          {erro}
        </div>
      )}

      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: "1px solid #e9ecef",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #e9ecef",
            fontWeight: 700,
          }}
        >
          Recibos emitidos: {recibos.length}
        </div>

        {carregando ? (
          <div style={{ padding: "30px", textAlign: "center" }}>
            Carregando recibos...
          </div>
        ) : recibos.length === 0 ? (
          <div
            style={{
              padding: "50px 20px",
              textAlign: "center",
              color: "#6c757d",
            }}
          >
            Nenhum recibo financeiro foi gerado ainda.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1000px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8f9fa",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "14px" }}>Recibo</th>
                  <th style={{ padding: "14px" }}>Data</th>
                  <th style={{ padding: "14px" }}>Paciente</th>
                  <th style={{ padding: "14px" }}>Descrição</th>
                  <th style={{ padding: "14px" }}>Valor recebido</th>
                  <th style={{ padding: "14px" }}>Pagamento</th>
                  <th style={{ padding: "14px" }}>Pendente</th>
                  <th style={{ padding: "14px" }}>Ações</th>
                </tr>
              </thead>

              <tbody>
                {recibos.map((recibo) => (
                  <tr
                    key={recibo.id}
                    style={{
                      borderTop: "1px solid #edf0f2",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px",
                        fontWeight: 700,
                      }}
                    >
                      #{recibo.numero_recibo}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {formatarData(recibo.data_recebimento)}
                    </td>

                    <td style={{ padding: "14px" }}>
                      <strong>{recibo.paciente_nome}</strong>

                      {recibo.paciente_cpf && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6c757d",
                            marginTop: "3px",
                          }}
                        >
                          CPF: {recibo.paciente_cpf}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {recibo.descricao}
                    </td>

                    <td style={{ padding: "14px", fontWeight: 700 }}>
                      {formatarMoeda(recibo.valor_recebimento)}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {recibo.pagamentos?.length
                        ? recibo.pagamentos.map((pagamento) => (
                            <div
                              key={`${recibo.id}-${pagamento.forma_pagamento}`}
                              style={{ marginBottom: "4px" }}
                            >
                              {nomeFormaPagamento(
                                pagamento.forma_pagamento
                              )}
                              : {formatarMoeda(pagamento.valor)}
                            </div>
                          ))
                        : "-"}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {formatarMoeda(recibo.valor_pendente)}
                    </td>

                    <td style={{ padding: "14px" }}>
                      <button
                        onClick={() => abrirPdf(recibo.id)}
                        style={{
                          padding: "8px 14px",
                          border: "none",
                          borderRadius: "7px",
                          background: "#1976d2",
                          color: "#fff",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Ver / Imprimir PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
