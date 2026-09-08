import React, { useEffect, useState } from "react";
import { API_URL } from "./config";

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataBR(data) {
  if (!data) return "-";

  const d = new Date(data);

  return d.toLocaleDateString("pt-BR");
}

function statusStyle(status) {
  if (status === "Emitida") {
    return {
      background: "#d1e7dd",
      color: "#0f5132",
    };
  }

  if (status === "Erro") {
    return {
      background: "#f8d7da",
      color: "#842029",
    };
  }

  return {
    background: "#fff3cd",
    color: "#664d03",
  };
}

export default function NotasNFSe({ onVoltar }) {
  const [notas, setNotas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  async function carregarNotas() {
    try {
      setCarregando(true);

      const response = await fetch(`${API_URL}/recibos`);

      if (!response.ok) {
        throw new Error("Não foi possível carregar as notas.");
      }

      const data = await response.json();
      setNotas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao carregar as notas.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarNotas();
  }, []);

  async function emitirNFSe(id) {
    try {
      setMensagem(`Emitindo NFS-e do recibo #${id}...`);

      const response = await fetch(
        `${API_URL}/recibos/${id}/emitir-nfse`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Erro ao emitir NFS-e.");
      }

      setMensagem(
        `NFS-e emitida com sucesso: ${data.numero_nfse}`
      );

      await carregarNotas();
    } catch (error) {
      console.error(error);
      setMensagem(error.message || "Erro ao emitir NFS-e.");
    }
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
          marginBottom: "22px",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Notas / NFS-e</h2>
          <p
            style={{
              margin: "6px 0 0",
              color: "#6c757d",
            }}
          >
            Controle das notas fiscais de serviço eletrônico.
          </p>
        </div>

        <button
          onClick={onVoltar}
          style={{
            padding: "10px 16px",
            border: "1px solid #ddd",
            background: "#fff",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Voltar
        </button>
      </div>

      {mensagem && (
        <div
          style={{
            padding: "12px 14px",
            marginBottom: "18px",
            borderRadius: "8px",
            background: "#f1f3f5",
          }}
        >
          {mensagem}
        </div>
      )}

      <div
        style={{
          background: "#fff",
          border: "1px solid #e9ecef",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {carregando ? (
          <div style={{ padding: "30px", textAlign: "center" }}>
            Carregando notas...
          </div>
        ) : notas.length === 0 ? (
          <div
            style={{
              padding: "50px",
              textAlign: "center",
              color: "#6c757d",
            }}
          >
            Nenhuma NFS-e cadastrada.
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
                  <th style={{ padding: "14px" }}>NFS-e</th>
                  <th style={{ padding: "14px" }}>Paciente</th>
                  <th style={{ padding: "14px" }}>Serviço</th>
                  <th style={{ padding: "14px" }}>Valor</th>
                  <th style={{ padding: "14px" }}>Emissão</th>
                  <th style={{ padding: "14px" }}>Status</th>
                  <th style={{ padding: "14px" }}>Ação</th>
                </tr>
              </thead>

              <tbody>
                {notas.map((nota) => (
                  <tr
                    key={nota.id}
                    style={{
                      borderTop: "1px solid #edf0f2",
                    }}
                  >
                    <td style={{ padding: "14px", fontWeight: 700 }}>
                      {nota.numero_nfse || `Pendente #${nota.id}`}
                    </td>

                    <td style={{ padding: "14px" }}>
                      <strong>{nota.paciente_nome}</strong>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6c757d",
                        }}
                      >
                        CPF: {nota.paciente_cpf}
                      </div>
                    </td>

                    <td style={{ padding: "14px" }}>
                      {nota.servico_descricao}
                    </td>

                    <td style={{ padding: "14px", fontWeight: 700 }}>
                      {moeda(nota.valor)}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {dataBR(nota.data_emissao)}
                    </td>

                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          ...statusStyle(nota.status_nfse),
                          padding: "5px 9px",
                          borderRadius: "6px",
                          fontWeight: 600,
                        }}
                      >
                        {nota.status_nfse}
                      </span>
                    </td>

                    <td style={{ padding: "14px" }}>
                      {nota.status_nfse !== "Emitida" ? (
                        <button
                          onClick={() => emitirNFSe(nota.id)}
                          style={{
                            padding: "8px 14px",
                            border: "none",
                            borderRadius: "7px",
                            background: "#198754",
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Emitir NFS-e
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            window.open(
                              nota.url_pdf_nfse,
                              "_blank"
                            )
                          }
                          style={{
                            padding: "8px 14px",
                            border: "none",
                            borderRadius: "7px",
                            background: "#0d6efd",
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Ver PDF
                        </button>
                      )}
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
