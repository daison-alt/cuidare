import { useEffect, useState } from "react";
import "./EditarPaciente.css";

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

function EditarPaciente({ pacienteId, onVoltar, onSalvo }) {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarPaciente() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await fetch(
          `${API_URL}/pacientes/${pacienteId}`
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
          const detalhe =
            typeof resultado.detail === "string"
              ? resultado.detail
              : "Não foi possível carregar o paciente.";

          throw new Error(detalhe);
        }

        setFormulario({
          nome: resultado.nome || "",
          cpf: resultado.cpf || "",
          rg: resultado.rg || "",
          data_nascimento: resultado.data_nascimento || "",
          telefone: resultado.telefone || "",
          email: resultado.email || "",
          endereco: resultado.endereco || "",
          numero: resultado.numero || "",
          complemento: resultado.complemento || "",
          bairro: resultado.bairro || "",
          cep: resultado.cep || "",
          municipio: resultado.municipio || "",
          uf: resultado.uf || "",
          contato_emergencia_nome:
            resultado.contato_emergencia_nome || "",
          contato_emergencia_telefone:
            resultado.contato_emergencia_telefone || "",
          contato_emergencia_parentesco:
            resultado.contato_emergencia_parentesco || "",
          observacoes: resultado.observacoes || "",
        });
      } catch (error) {
        console.error("Erro ao carregar paciente:", error);

        setErro(
          error?.message ||
            "Não foi possível carregar os dados do paciente."
        );
      } finally {
        setCarregando(false);
      }
    }

    if (pacienteId) {
      carregarPaciente();
    } else {
      setErro("Paciente não informado.");
      setCarregando(false);
    }
  }, [pacienteId]);

  function alterarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function salvarAlteracoes(event) {
    event.preventDefault();
    setErro("");

    if (!formulario.nome.trim()) {
      setErro("Informe o nome do paciente.");
      return;
    }

    try {
      setSalvando(true);

      const dados = {
        ...formulario,
        nome: formulario.nome.trim(),
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

      const resposta = await fetch(
        `${API_URL}/pacientes/${pacienteId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dados),
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        let mensagem = "Não foi possível atualizar o paciente.";

        if (typeof resultado.detail === "string") {
          mensagem = resultado.detail;
        } else if (Array.isArray(resultado.detail)) {
          mensagem = resultado.detail
            .map((item) => {
              if (typeof item === "string") {
                return item;
              }

              if (item?.msg) {
                return item.msg;
              }

              return JSON.stringify(item);
            })
            .join(" | ");
        }

        throw new Error(mensagem);
      }

      onSalvo(resultado);
    } catch (error) {
      console.error("Erro ao atualizar paciente:", error);

      setErro(
        error?.message ||
          "Não foi possível atualizar o paciente."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <section className="editar-paciente-page">
        <div className="editar-paciente-loading">
          <strong>Carregando paciente...</strong>
          <p>
            Aguarde enquanto buscamos os dados cadastrados.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="editar-paciente-page">
      <div className="editar-paciente-header">
        <div>
          <span className="page-label">PACIENTES</span>

          <h2>Editar paciente</h2>

          <p>
            Atualize os dados cadastrais e de contato do paciente.
          </p>
        </div>

        <button
          type="button"
          className="editar-paciente-back-button"
          onClick={onVoltar}
          disabled={salvando}
        >
          Voltar
        </button>
      </div>

      {erro && (
        <div className="editar-paciente-alert">
          {erro}
        </div>
      )}

      <form
        className="editar-paciente-form"
        onSubmit={salvarAlteracoes}
      >
        <section className="editar-paciente-card">
          <div className="form-section-header">
            <span className="toolbar-label">DADOS PESSOAIS</span>

            <h3>Informações do paciente</h3>

            <p>
              Atualize os dados principais para identificação.
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

        <section className="editar-paciente-card">
          <div className="form-section-header">
            <span className="toolbar-label">ENDEREÇO</span>

            <h3>Endereço residencial</h3>

            <p>
              Atualize os dados utilizados para cadastro e identificação.
            </p>
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

        <section className="editar-paciente-card">
          <div className="form-section-header">
            <span className="toolbar-label">
              CONTATO DE EMERGÊNCIA
            </span>

            <h3>Contato de emergência</h3>

            <p>
              Mantenha atualizado o contato para situações de emergência.
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

        <section className="editar-paciente-card">
          <div className="form-section-header">
            <span className="toolbar-label">OBSERVAÇÕES</span>

            <h3>Informações adicionais</h3>

            <p>
              Registre informações administrativas relevantes.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="observacoes">Observações</label>

            <textarea
              id="observacoes"
              name="observacoes"
              value={formulario.observacoes}
              onChange={alterarCampo}
              placeholder="Digite alguma observação..."
            />
          </div>
        </section>

        <div className="editar-paciente-actions">
          <button
            type="button"
            className="editar-paciente-cancel-button"
            onClick={onVoltar}
            disabled={salvando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="editar-paciente-save-button"
            disabled={salvando}
          >
            {salvando
              ? "Salvando alterações..."
              : "Salvar alterações"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default EditarPaciente;
