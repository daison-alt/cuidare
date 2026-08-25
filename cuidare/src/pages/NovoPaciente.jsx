import { useState } from "react";
import "./NovoPaciente.css";

const API_URL =
  "https://humble-waddle-97x5v4vpg7j73ppxq-8000.app.github.dev";

const formularioInicial = {
  nome: "",
  cpf: "",
  rg: "",
  data_nascimento: "",
  telefone: "",
  email: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cep: "",
  municipio: "",
  uf: "",
  contato_emergencia_nome: "",
  contato_emergencia_telefone: "",
  contato_emergencia_parentesco: "",
  observacoes: "",
};

function obterMensagemErro(resultado) {
  if (!resultado) {
    return "Não foi possível cadastrar o paciente.";
  }

  if (typeof resultado.detail === "string") {
    return resultado.detail;
  }

  if (Array.isArray(resultado.detail)) {
    return resultado.detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item?.msg) {
          const campo = Array.isArray(item.loc)
            ? item.loc[item.loc.length - 1]
            : "";

          return campo
            ? `${campo}: ${item.msg}`
            : item.msg;
        }

        return JSON.stringify(item);
      })
      .join(" | ");
  }

  if (resultado.detail && typeof resultado.detail === "object") {
    return (
      resultado.detail.message ||
      resultado.detail.msg ||
      JSON.stringify(resultado.detail)
    );
  }

  if (typeof resultado.message === "string") {
    return resultado.message;
  }

  return "Não foi possível cadastrar o paciente.";
}

function NovoPaciente({ onVoltar, onSalvo }) {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function alterarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function salvarPaciente(event) {
    event.preventDefault();
    setErro("");

    const nome = formulario.nome.trim();

    if (!nome) {
      setErro("Informe o nome do paciente.");
      return;
    }

    try {
      setSalvando(true);

      const dados = {
        nome,
        cpf: formulario.cpf.trim() || null,
        rg: formulario.rg.trim() || null,
        data_nascimento: formulario.data_nascimento || null,
        telefone: formulario.telefone.trim() || null,
        email: formulario.email.trim() || null,
        endereco: formulario.endereco.trim() || null,
        numero: formulario.numero.trim() || null,
        complemento: formulario.complemento.trim() || null,
        bairro: formulario.bairro.trim() || null,
        cep: formulario.cep.trim() || null,
        municipio: formulario.municipio.trim() || null,
        uf: formulario.uf.trim().toUpperCase() || null,
        contato_emergencia_nome:
          formulario.contato_emergencia_nome.trim() || null,
        contato_emergencia_telefone:
          formulario.contato_emergencia_telefone.trim() || null,
        contato_emergencia_parentesco:
          formulario.contato_emergencia_parentesco.trim() || null,
        observacoes: formulario.observacoes.trim() || null,
      };

      const resposta = await fetch(`${API_URL}/pacientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      let resultado = null;

      try {
        resultado = await resposta.json();
      } catch {
        resultado = null;
      }

      if (!resposta.ok) {
        throw new Error(obterMensagemErro(resultado));
      }

      if (!resultado || !resultado.id) {
        throw new Error(
          "O paciente foi processado, mas a API não retornou os dados esperados."
        );
      }

      onSalvo(resultado);
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);

      setErro(
        error?.message ||
          "Não foi possível cadastrar o paciente. Verifique a conexão com a API."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="novo-paciente-page">
      <div className="novo-paciente-header">
        <div>
          <span className="page-label">PACIENTES</span>

          <h2>Novo paciente</h2>

          <p>
            Cadastre os dados pessoais e de contato do paciente na Cuidare.
          </p>
        </div>

        <button
          type="button"
          className="novo-paciente-back-button"
          onClick={onVoltar}
          disabled={salvando}
        >
          Voltar
        </button>
      </div>

      {erro && <div className="novo-paciente-alert">{erro}</div>}

      <form
        className="novo-paciente-form"
        onSubmit={salvarPaciente}
      >
        <section className="novo-paciente-card">
          <div className="form-section-header">
            <span className="toolbar-label">DADOS PESSOAIS</span>

            <h3>Informações do paciente</h3>

            <p>
              Informe os dados principais para identificação do paciente.
            </p>
          </div>

          <div className="form-grid">
            <div className="form-field field-wide">
              <label htmlFor="nome">
                Nome completo <span>*</span>
              </label>

              <input
                id="nome"
                name="nome"
                type="text"
                value={formulario.nome}
                onChange={alterarCampo}
                placeholder="Nome completo do paciente"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="cpf">CPF</label>

              <input
                id="cpf"
                name="cpf"
                type="text"
                value={formulario.cpf}
                onChange={alterarCampo}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="form-field">
              <label htmlFor="rg">RG</label>

              <input
                id="rg"
                name="rg"
                type="text"
                value={formulario.rg}
                onChange={alterarCampo}
                placeholder="Número do RG"
              />
            </div>

            <div className="form-field">
              <label htmlFor="data_nascimento">
                Data de nascimento
              </label>

              <input
                id="data_nascimento"
                name="data_nascimento"
                type="date"
                value={formulario.data_nascimento}
                onChange={alterarCampo}
              />
            </div>

            <div className="form-field">
              <label htmlFor="telefone">Telefone</label>

              <input
                id="telefone"
                name="telefone"
                type="text"
                value={formulario.telefone}
                onChange={alterarCampo}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="form-field field-wide">
              <label htmlFor="email">E-mail</label>

              <input
                id="email"
                name="email"
                type="email"
                value={formulario.email}
                onChange={alterarCampo}
                placeholder="paciente@email.com"
              />
            </div>
          </div>
        </section>

        <section className="novo-paciente-card">
          <div className="form-section-header">
            <span className="toolbar-label">ENDEREÇO</span>

            <h3>Endereço residencial</h3>

            <p>Dados utilizados para cadastro e identificação.</p>
          </div>

          <div className="form-grid">
            <div className="form-field field-wide">
              <label htmlFor="endereco">Endereço</label>

              <input
                id="endereco"
                name="endereco"
                type="text"
                value={formulario.endereco}
                onChange={alterarCampo}
                placeholder="Rua, avenida, travessa..."
              />
            </div>

            <div className="form-field">
              <label htmlFor="numero">Número</label>

              <input
                id="numero"
                name="numero"
                type="text"
                value={formulario.numero}
                onChange={alterarCampo}
                placeholder="Número"
              />
            </div>

            <div className="form-field">
              <label htmlFor="complemento">Complemento</label>

              <input
                id="complemento"
                name="complemento"
                type="text"
                value={formulario.complemento}
                onChange={alterarCampo}
                placeholder="Apto., casa..."
              />
            </div>

            <div className="form-field">
              <label htmlFor="bairro">Bairro</label>

              <input
                id="bairro"
                name="bairro"
                type="text"
                value={formulario.bairro}
                onChange={alterarCampo}
                placeholder="Bairro"
              />
            </div>

            <div className="form-field">
              <label htmlFor="cep">CEP</label>

              <input
                id="cep"
                name="cep"
                type="text"
                value={formulario.cep}
                onChange={alterarCampo}
                placeholder="00000-000"
              />
            </div>

            <div className="form-field">
              <label htmlFor="municipio">Município</label>

              <input
                id="municipio"
                name="municipio"
                type="text"
                value={formulario.municipio}
                onChange={alterarCampo}
                placeholder="Município"
              />
            </div>

            <div className="form-field">
              <label htmlFor="uf">UF</label>

              <input
                id="uf"
                name="uf"
                type="text"
                maxLength="2"
                value={formulario.uf}
                onChange={alterarCampo}
                placeholder="UF"
              />
            </div>
          </div>
        </section>

        <section className="novo-paciente-card">
          <div className="form-section-header">
            <span className="toolbar-label">CONTATO DE EMERGÊNCIA</span>

            <h3>Contato de emergência</h3>

            <p>
              Informe uma pessoa que possa ser contatada em uma situação de
              emergência.
            </p>
          </div>

          <div className="form-grid">
            <div className="form-field field-wide">
              <label htmlFor="contato_emergencia_nome">
                Nome do contato
              </label>

              <input
                id="contato_emergencia_nome"
                name="contato_emergencia_nome"
                type="text"
                value={formulario.contato_emergencia_nome}
                onChange={alterarCampo}
                placeholder="Nome completo"
              />
            </div>

            <div className="form-field">
              <label htmlFor="contato_emergencia_telefone">
                Telefone
              </label>

              <input
                id="contato_emergencia_telefone"
                name="contato_emergencia_telefone"
                type="text"
                value={formulario.contato_emergencia_telefone}
                onChange={alterarCampo}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="form-field">
              <label htmlFor="contato_emergencia_parentesco">
                Parentesco
              </label>

              <input
                id="contato_emergencia_parentesco"
                name="contato_emergencia_parentesco"
                type="text"
                value={formulario.contato_emergencia_parentesco}
                onChange={alterarCampo}
                placeholder="Ex.: mãe, pai, cônjuge..."
              />
            </div>
          </div>
        </section>

        <section className="novo-paciente-card">
          <div className="form-section-header">
            <span className="toolbar-label">OBSERVAÇÕES</span>

            <h3>Informações adicionais</h3>

            <p>
              Registre informações administrativas relevantes para o cadastro.
            </p>
          </div>

          <div className="form-grid">
            <div className="form-field field-wide">
              <label htmlFor="observacoes">Observações</label>

              <textarea
                id="observacoes"
                name="observacoes"
                value={formulario.observacoes}
                onChange={alterarCampo}
                placeholder="Digite observações sobre o cadastro..."
              />
            </div>
          </div>
        </section>

        <div className="novo-paciente-actions">
          <button
            type="button"
            className="novo-paciente-cancel-button"
            onClick={onVoltar}
            disabled={salvando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="novo-paciente-save-button"
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Salvar paciente"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default NovoPaciente;
