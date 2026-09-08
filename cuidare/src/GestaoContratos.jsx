import React, { useState, useEffect } from "react";
import API_URL from "./config";

export default function GestaoContratos() {
  const [contratos, setContratos] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    titulo: "Contrato de Prestação de Serviços - Pilates",
    paciente_id: 1,
    paciente_nome: "",
    paciente_cpf: "",
    conteudo_html: ""
  });

  const carregarContratos = () => {
    fetch(`${API_URL}/contratos`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setContratos(data))
      .catch(err => console.error("Erro ao carregar contratos:", err));
  };

  useEffect(() => {
    carregarContratos();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const gerarContratoModelo = () => {
    const texto = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PILATES/FISIOTERAPIA\n\n` +
      `CONTRATANTE: ${form.paciente_nome || "[NOME DO PACIENTE]"}, CPF: ${form.paciente_cpf || "[CPF]"}.\n` +
      `CONTRATADA: CUIDARE CLINICA DE FISIOTERAPIA E PILATES.\n\n` +
      `CLÁUSULA 1ª: O presente contrato tem como objeto a prestação de serviços de sessões de Pilates/Fisioterapia.\n` +
      `CLÁUSULA 2ª: As desmarcações devem ser feitas com antecedência mínima de 24 horas para direito à reposição.\n\n` +
      `Data: ${new Date().toLocaleDateString("pt-BR")}`;
    setForm({ ...form, conteudo_html: texto });
  };

  const salvarContrato = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/contratos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMensagem("Contrato gerado com sucesso!");
        setModal(false);
        carregarContratos();
      }
    } catch (err) {
      setMensagem("Erro ao salvar contrato.");
    }
  };

  const assinarContrato = async (id) => {
    try {
      const res = await fetch(`${API_URL}/contratos/${id}/assinar`, { method: "POST" });
      if (res.ok) {
        setMensagem(`Contrato #${id} assinado com sucesso!`);
        carregarContratos();
      }
    } catch (err) {
      setMensagem("Erro ao assinar contrato.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1100px", margin: "0 auto" }}>
      <h2>Gestão de Contratos e Termos</h2>
      {mensagem && <div style={{ padding: "10px", background: "#d4edda", color: "#155724", marginBottom: "15px" }}>{mensagem}</div>}

      <button onClick={() => setModal(true)} style={{ padding: "10px 15px", background: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", marginBottom: "20px" }}>
        + Novo Contrato / Termo
      </button>

      {modal && (
        <div style={{ background: "#f8f9fa", padding: "20px", border: "1px solid #ccc", marginBottom: "20px", borderRadius: "4px" }}>
          <h3>Gerar Novo Contrato</h3>
          <form onSubmit={salvarContrato} style={{ display: "grid", gap: "10px" }}>
            <input name="titulo" placeholder="Título do Contrato" value={form.titulo} onChange={handleChange} required />
            <input name="paciente_nome" placeholder="Nome do Paciente" value={form.paciente_nome} onChange={handleChange} required />
            <input name="paciente_cpf" placeholder="CPF do Paciente" value={form.paciente_cpf} onChange={handleChange} required />
            
            <button type="button" onClick={gerarContratoModelo} style={{ padding: "6px", background: "#6c757d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Carregar Modelo Padrão de Pilates
            </button>

            <textarea name="conteudo_html" rows="6" placeholder="Texto do Contrato" value={form.conteudo_html} onChange={handleChange} required />

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" style={{ padding: "8px 15px", background: "#28a745", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Salvar e Gerar</button>
              <button type="button" onClick={() => setModal(false)} style={{ padding: "8px 15px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #dee2e6", textAlign: "left" }}>
            <th style={{ padding: "12px" }}># ID</th>
            <th style={{ padding: "12px" }}>Título</th>
            <th style={{ padding: "12px" }}>Paciente</th>
            <th style={{ padding: "12px" }}>Status</th>
            <th style={{ padding: "12px" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {contratos.length === 0 ? (
            <tr><td colSpan="5" style={{ padding: "15px", textAlign: "center" }}>Nenhum contrato cadastrado.</td></tr>
          ) : (
            contratos.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                <td style={{ padding: "12px" }}>#{c.id}</td>
                <td style={{ padding: "12px" }}>{c.titulo}</td>
                <td style={{ padding: "12px" }}>{c.paciente_nome}<br/><small style={{ color: "#6c757d" }}>{c.paciente_cpf}</small></td>
                <td style={{ padding: "12px" }}>
                  <span style={{ padding: "4px 8px", borderRadius: "4px", background: c.status === "Assinado" ? "#d4edda" : "#fff3cd", color: c.status === "Assinado" ? "#155724" : "#856404" }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  {c.status !== "Assinado" && (
                    <button onClick={() => assinarContrato(c.id)} style={{ padding: "6px 12px", background: "#28a745", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                      Marcar como Assinado
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
