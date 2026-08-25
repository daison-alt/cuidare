import { useEffect, useState } from "react";
import "./VisualizarPaciente.css";

const API_URL =
  "https://humble-waddle-97x5v4vpg7j73ppxq-8000.app.github.dev";

function VisualizarPaciente({ pacienteId, onVoltar, onAbrirProntuario }) {
  const [paciente, setPaciente] = useState(null);
  const [carregando, setCarregando] = useState(true);
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
          throw new Error(
            typeof resultado.detail === "string"
              ? resultado.detail
              : "Não foi possível carregar o paciente."
          );
        }

        setPaciente(resultado);
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

  function formatarData(data) {
    if (!data) {
      return "Não informado";
    }

    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  }

  function valorOuNaoInformado(valor) {
    return valor || "Não informado";
  }

  if (carregando) {
    return (
      <section className="visualizar-paciente-page">
        <div className="visualizar-paciente-loading">
          <strong>Carregando paciente...</strong>
          <p>Aguarde enquanto buscamos os dados cadastrados.</p>
        </div>
      </section>
    );
  }

  if (erro) {
    return (
      <section className="visualizar-paciente-page">
        <div className="visualizar-paciente-header">
          <div>
            <span className="page-label">PACIENTES</span>
            <h2>Visualizar paciente</h2>
          </div>

          <button
            type="button"
            className="visualizar-paciente-back-button"
            onClick={onVoltar}
          >
            Voltar
          </button>
        </div>

        <div className="visualizar-paciente-alert">
          {erro}
        </div>
      </section>
    );
  }

  return (
    <section className="visualizar-paciente-page">
      <div className="visualizar-paciente-header">
        <div>
          <span className="page-label">PACIENTES</span>

          <h2>{paciente.nome}</h2>

          <p>
            Consulte os dados cadastrais e informações de contato do paciente.
          </p>
        </div>

        <div className="visualizar-paciente-header-actions">
          <button
            type="button"
            className="visualizar-paciente-prontuario-button"
            onClick={onAbrirProntuario}
          >
            Prontuário
          </button>

          <button
            type="button"
            className="visualizar-paciente-back-button"
            onClick={onVoltar}
          >
            Voltar
          </button>
        </div>
      </div>

      <div className="visualizar-paciente-status-row">
        <div className="visualizar-paciente-avatar">
          {paciente.nome?.charAt(0)?.toUpperCase() || "P"}
        </div>

        <div>
          <strong>{paciente.nome}</strong>

          <span>
            {paciente.ativo ? "Paciente ativo" : "Paciente inativo"}
          </span>
        </div>

        <span
          className={`visualizar-paciente-status ${
            paciente.ativo ? "ativo" : "inativo"
          }`}
        >
          {paciente.ativo ? "Ativo" : "Inativo"}
        </span>
      </div>

      <div className="visualizar-paciente-grid">
        <section className="visualizar-paciente-card">
          <div className="visualizar-card-header">
            <span className="toolbar-label">DADOS PESSOAIS</span>
            <h3>Informações pessoais</h3>
          </div>

          <div className="visualizar-info-grid">
            <div className="visualizar-info-item">
              <span>Nome completo</span>
              <strong>{valorOuNaoInformado(paciente.nome)}</strong>
            </div>

            <div className="visualizar-info-item">
              <span>CPF</span>
              <strong>{valorOuNaoInformado(paciente.cpf)}</strong>
            </div>

            <div className="visualizar-info-item">
              <span>RG</span>
              <strong>{valorOuNaoInformado(paciente.rg)}</strong>
            </div>

            <div className="visualizar-info-item">
              <span>Data de nascimento</span>
              <strong>
                {formatarData(paciente.data_nascimento)}
              </strong>
            </div>

            <div className="visualizar-info-item">
              <span>Telefone</span>
              <strong>{valorOuNaoInformado(paciente.telefone)}</strong>
            </div>

            <div className="visualizar-info-item">
              <span>E-mail</span>
              <strong>{valorOuNaoInformado(paciente.email)}</strong>
            </div>
          </div>
        </section>

        <section className="visualizar-paciente-card">
          <div className="visualizar-card-header">
            <span className="toolbar-label">ENDEREÇO</span>
            <h3>Endereço residencial</h3>
          </div>

          <div className="visualizar-info-grid">
            <div className="visualizar-info-item">
              <span>Endereço</span>
              <strong>{valorOuNaoInformado(paciente.endereco)}</strong>
            </div>

            <div className="visualizar-info-item">
              <span>Número</span>
              <strong>{valorOuNaoInformado(paciente.numero)}</strong>
            </div>

            <div className="visualizar-info-item">
              <span>Complemento</span>
              <strong>
                {valorOuNaoInformado(paciente.complemento)}
              </strong>
            </div>

            <div className="visualizar-info-item">
              <span>Bairro</span>
              <strong>{valorOuNaoInformado(paciente.bairro)}</strong>
            </div>

            <div className="visualizar-info-item">
              <span>CEP</span>
              <strong>{valorOuNaoInformado(paciente.cep)}</strong>
            </div>

            <div className="visualizar-info-item">
              <span>Município / UF</span>
              <strong>
                {paciente.municipio || paciente.uf
                  ? `${paciente.municipio || "—"} / ${paciente.uf || "—"}`
                  : "Não informado"}
              </strong>
            </div>
          </div>
        </section>

        <section className="visualizar-paciente-card">
          <div className="visualizar-card-header">
            <span className="toolbar-label">
              CONTATO DE EMERGÊNCIA
            </span>

            <h3>Contato de emergência</h3>
          </div>

          <div className="visualizar-info-grid">
            <div className="visualizar-info-item">
              <span>Nome</span>
              <strong>
                {valorOuNaoInformado(
                  paciente.contato_emergencia_nome
                )}
              </strong>
            </div>

            <div className="visualizar-info-item">
              <span>Telefone</span>
              <strong>
                {valorOuNaoInformado(
                  paciente.contato_emergencia_telefone
                )}
              </strong>
            </div>

            <div className="visualizar-info-item">
              <span>Parentesco</span>
              <strong>
                {valorOuNaoInformado(
                  paciente.contato_emergencia_parentesco
                )}
              </strong>
            </div>
          </div>
        </section>

        <section className="visualizar-paciente-card">
          <div className="visualizar-card-header">
            <span className="toolbar-label">OBSERVAÇÕES</span>
            <h3>Informações adicionais</h3>
          </div>

          <div className="visualizar-observacoes">
            {paciente.observacoes || "Nenhuma observação registrada."}
          </div>
        </section>

        <section className="visualizar-paciente-card">
          <div className="visualizar-card-header">
            <span className="toolbar-label">CADASTRO</span>
            <h3>Informações do cadastro</h3>
          </div>

          <div className="visualizar-info-grid">
            <div className="visualizar-info-item">
              <span>ID do paciente</span>
              <strong>#{paciente.id}</strong>
            </div>

            <div className="visualizar-info-item">
              <span>Status</span>
              <strong>
                {paciente.ativo ? "Ativo" : "Inativo"}
              </strong>
            </div>

            <div className="visualizar-info-item">
              <span>Cadastrado em</span>
              <strong>
                {paciente.criado_em
                  ? new Date(
                      paciente.criado_em
                    ).toLocaleString("pt-BR")
                  : "Não informado"}
              </strong>
            </div>

            <div className="visualizar-info-item">
              <span>Última atualização</span>
              <strong>
                {paciente.atualizado_em
                  ? new Date(
                      paciente.atualizado_em
                    ).toLocaleString("pt-BR")
                  : "Não informado"}
              </strong>
            </div>
          </div>
        </section>
      </div>

      <div className="visualizar-paciente-footer">
        <button
          type="button"
          className="visualizar-paciente-footer-button"
          onClick={onVoltar}
        >
          Voltar para pacientes
        </button>
      </div>
    </section>
  );
}

export default VisualizarPaciente;
