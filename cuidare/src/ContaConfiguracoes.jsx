import React, { useState, useEffect } from "react";
import API_URL from "./config";

export default function ContaConfiguracoes() {
  const [aba, setAba] = useState("empresa");
  const [form, setForm] = useState({
    razao_social: "", nome_fantasia: "", cnpj: "", inscricao_municipal: "",
    logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "",
    telefone: "", email: "", regime_tributario: "Simples Nacional",
    codigo_servico_municipal: "", aliquota_iss: "", responsavel_tecnico: "", crefito_responsavel: ""
  });
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/configuracao`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setForm(data); })
      .catch(err => console.error("Erro ao carregar dados da clínica:", err));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const salvarDados = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/configuracao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) setMensagem("Configurações salvas com sucesso!");
    } catch (err) {
      setMensagem("Erro ao salvar configurações.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <h2>Configurações da Conta & Clínica</h2>
      {mensagem && <div style={{ padding: "10px", background: "#d4edda", color: "#155724", marginBottom: "15px" }}>{mensagem}</div>}
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #ccc" }}>
        <button type="button" onClick={() => setAba("empresa")} style={{ padding: "10px", background: aba === "empresa" ? "#ddd" : "transparent", border: "none", cursor: "pointer" }}>Empresa & Endereço</button>
        <button type="button" onClick={() => setAba("profissional")} style={{ padding: "10px", background: aba === "profissional" ? "#ddd" : "transparent", border: "none", cursor: "pointer" }}>Identidade & Profissional</button>
        <button type="button" onClick={() => setAba("fiscal")} style={{ padding: "10px", background: aba === "fiscal" ? "#ddd" : "transparent", border: "none", cursor: "pointer" }}>NFS-e & Certificado A1</button>
      </div>

      <form onSubmit={salvarDados}>
        {aba === "empresa" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <input name="razao_social" placeholder="Razão Social" value={form.razao_social || ""} onChange={handleChange} required />
            <input name="nome_fantasia" placeholder="Nome Fantasia" value={form.nome_fantasia || ""} onChange={handleChange} />
            <input name="cnpj" placeholder="CNPJ" value={form.cnpj || ""} onChange={handleChange} required />
            <input name="inscricao_municipal" placeholder="Inscrição Municipal" value={form.inscricao_municipal || ""} onChange={handleChange} />
            <input name="logradouro" placeholder="Logradouro" value={form.logradouro || ""} onChange={handleChange} />
            <input name="numero" placeholder="Número" value={form.numero || ""} onChange={handleChange} />
            <input name="cidade" placeholder="Cidade" value={form.cidade || ""} onChange={handleChange} />
            <input name="estado" placeholder="UF (ex: RS)" value={form.estado || ""} onChange={handleChange} maxLength="2" />
          </div>
        )}

        {aba === "profissional" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <input name="responsavel_tecnico" placeholder="Responsável Técnico" value={form.responsavel_tecnico || ""} onChange={handleChange} />
            <input name="crefito_responsavel" placeholder="CREFITO (ex: CREFITO-5/12345-F)" value={form.crefito_responsavel || ""} onChange={handleChange} />
          </div>
        )}

        {aba === "fiscal" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <input name="regime_tributario" placeholder="Regime Tributário" value={form.regime_tributario || ""} onChange={handleChange} />
            <input name="codigo_servico_municipal" placeholder="Código de Serviço NFS-e" value={form.codigo_servico_municipal || ""} onChange={handleChange} />
          </div>
        )}

        <button type="submit" style={{ marginTop: "20px", padding: "10px 20px", background: "#007bff", color: "#fff", border: "none", cursor: "pointer" }}>Salvar Configurações</button>
      </form>
    </div>
  );
}
