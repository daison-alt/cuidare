import React, { useState, useEffect } from "react";
import API_URL from "./config";

export default function GestaoCampanhas() {
  const [campanhas, setCampanhas] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    segmento_alvo: "Inativos (+60 dias)",
    canal_envio: "WhatsApp",
    mensagem_template: ""
  });

  const carregarCampanhas = () => {
    fetch(`${API_URL}/campanhas`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setCampanhas(data))
      .catch(err => console.error("Erro ao carregar campanhas:", err));
  };

  useEffect(() => {
    carregarCampanhas();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const salvarCampanha = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/campanhas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMensagem("Campanha criada com sucesso!");
        setModal(false);
        carregarCampanhas();
      }
    } catch (err) {
      setMensagem("Erro ao salvar campanha.");
    }
  };

  const dispararCampanha = async (id) => {
    try {
      const res = await fetch(`${API_URL}/campanhas/${id}/disparar`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setMensagem(data.mensagem);
        carregarCampanhas();
      }
    } catch (err) {
      setMensagem("Erro ao disparar campanha.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1100px", margin: "0 auto" }}>
      <h2>Campanhas & Retenção de Pacientes</h2>
      {mensagem && <div style={{ padding: "10px", background: "#d4edda", color: "#155724", marginBottom: "15px" }}>{mensagem}</div>}

      <button onClick={() => setModal(true)} style={{ padding: "10px 15px", background: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", marginBottom: "20px" }}>
        + Criar Nova Campanha
      </button>

      {modal && (
        <div style={{ background: "#f8f9fa", padding: "20px", border: "1px solid #ccc", marginBottom: "20px", borderRadius: "4px" }}>
          <h3>Nova Campanha de Comunicação</h3>
          <form onSubmit={salvarCampanha} style={{ display: "grid", gap: "10px" }}>
            <input name="nome" placeholder="Nome da Campanha (Ex: Reativação de Primavera)" value={form.nome} onChange={handleChange} required />
            
            <label>Segmento Alvo:</label>
            <select name="segmento_alvo" value={form.segmento_alvo} onChange={handleChange} style={{ padding: "8px" }}>
              <option value="Inativos (+60 dias)">Pacientes Inativos (+60 dias)</option>
              <option value="Aniversariantes do Mês">Aniversariantes do Mês</option>
              <option value="Alunos Pilates">Alunos de Pilates Ativos</option>
              <option value="Pacientes Fisioterapia">Pacientes em Tratamento de Fisioterapia</option>
            </select>

            <label>Canal de Envio:</label>
            <select name="canal_envio" value={form.canal_envio} onChange={handleChange} style={{ padding: "8px" }}>
              <option value="WhatsApp">WhatsApp</option>
              <option value="E-mail">E-mail</option>
              <option value="Ambos">Ambos (WhatsApp + E-mail)</option>
            </select>

            <textarea name="mensagem_template" rows="4" placeholder="Mensagem (use {NOME} para personalizar)" value={form.mensagem_template} onChange={handleChange} required />

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" style={{ padding: "8px 15px", background: "#28a745", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Salvar Rascunho</button>
              <button type="button" onClick={() => setModal(false)} style={{ padding: "8px 15px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #dee2e6", textAlign: "left" }}>
            <th style={{ padding: "12px" }}># ID</th>
            <th style={{ padding: "12px" }}>Campanha</th>
            <th style={{ padding: "12px" }}>Segmento Alvo</th>
            <th style={{ padding: "12px" }}>Canal</th>
            <th style={{ padding: "12px" }}>Status</th>
            <th style={{ padding: "12px" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {campanhas.length === 0 ? (
            <tr><td colSpan="6" style={{ padding: "15px", textAlign: "center" }}>Nenhuma campanha criada.</td></tr>
          ) : (
            campanhas.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                <td style={{ padding: "12px" }}>#{c.id}</td>
                <td style={{ padding: "12px" }}>{c.nome}</td>
                <td style={{ padding: "12px" }}>{c.segmento_alvo}</td>
                <td style={{ padding: "12px" }}>{c.canal_envio}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{ padding: "4px 8px", borderRadius: "4px", background: c.status === "Concluída" ? "#d4edda" : "#fff3cd", color: c.status === "Concluída" ? "#155724" : "#856404" }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  {c.status !== "Concluída" && (
                    <button onClick={() => dispararCampanha(c.id)} style={{ padding: "6px 12px", background: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                      Disparar Agora ({c.total_destinatarios} alvos)
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
