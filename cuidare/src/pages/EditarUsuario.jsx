import { useState } from "react";
import "./NovoUsuario.css";

function EditarUsuario({ usuario, onVoltar, onSalvar }) {
  const [nome, setNome] = useState(usuario?.nome || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [telefone, setTelefone] = useState(usuario?.telefone || "");

  const perfilInicial =
    usuario?.perfil === "Administrador"
      ? "administrador"
      : usuario?.perfil === "Fisioterapeuta"
      ? "fisioterapeuta"
      : usuario?.perfil === "Secretária"
      ? "secretaria"
      : "estagiario";

  const [perfil, setPerfil] = useState(perfilInicial);
  const [status, setStatus] = useState(usuario?.status || "Ativo");

  const permissoes = {
    administrador: [
      ["Pacientes", true],
      ["Agenda", true],
      ["Prontuários", true],
      ["Financeiro", true],
      ["Estoque", true],
      ["Relatórios", true],
      ["Configurações", true],
      ["Auditoria", true],
    ],

    fisioterapeuta: [
      ["Pacientes", true],
      ["Agenda", true],
      ["Prontuários", true],
      ["Financeiro", false],
      ["Estoque", true],
      ["Relatórios", false],
      ["Configurações", false],
      ["Auditoria", false],
    ],

    secretaria: [
      ["Pacientes", true],
      ["Agenda", true],
      ["Prontuários", false],
      ["Financeiro", true],
      ["Estoque", true],
      ["Relatórios", false],
      ["Configurações", false],
      ["Auditoria", false],
    ],

    estagiario: [
      ["Pacientes", true],
      ["Agenda", true],
      ["Prontuários", false],
      ["Financeiro", false],
      ["Estoque", false],
      ["Relatórios", false],
      ["Configurações", false],
      ["Auditoria", false],
    ],
  };

  const nomePerfil = {
    administrador: "Administrador",
    fisioterapeuta: "Fisioterapeuta",
    secretaria: "Secretária",
    estagiario: "Estagiário",
  };

  function handleSalvar() {
    if (!nome.trim()) {
      alert("Digite o nome completo.");
      return;
    }

    if (!email.trim()) {
      alert("Digite o usuário ou e-mail.");
      return;
    }

    const usuarioAtualizado = {
      ...usuario,
      nome,
      email,
      telefone,
      perfil: nomePerfil[perfil],
      status,
    };

    onSalvar(usuarioAtualizado);
  }

  return (
    <div className="novo-usuario-page">

      <div className="novo-usuario-header">

        <div>

          <button
            className="back-button"
            type="button"
            onClick={onVoltar}
          >
            ← Voltar para usuários
          </button>

          <span className="page-label">
            ADMINISTRAÇÃO
          </span>

          <h1>
            Editar usuário
          </h1>

          <p>
            Atualize os dados e as permissões de acesso deste usuário.
          </p>

        </div>

      </div>

      <div className="novo-usuario-layout">

        <section className="form-panel">

          <div className="form-panel-header">

            <span>
              DADOS DO USUÁRIO
            </span>

            <h2>
              Informações pessoais
            </h2>

          </div>

          <div className="form-grid">

            <div className="form-group full">

              <label htmlFor="nome">
                Nome completo
              </label>

              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
              />

            </div>

            <div className="form-group">

              <label htmlFor="email">
                Usuário ou e-mail
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

            </div>

            <div className="form-group">

              <label htmlFor="telefone">
                Telefone
              </label>

              <input
                id="telefone"
                type="text"
                value={telefone}
                onChange={(event) =>
                  setTelefone(event.target.value)
                }
              />

            </div>

            <div className="form-group">

              <label htmlFor="senha">
                Nova senha
              </label>

              <input
                id="senha"
                type="password"
                placeholder="Deixe em branco para manter"
              />

            </div>

            <div className="form-group">

              <label htmlFor="confirmarSenha">
                Confirmar nova senha
              </label>

              <input
                id="confirmarSenha"
                type="password"
                placeholder="Confirme a nova senha"
              />

            </div>

          </div>

        </section>

        <section className="form-panel">

          <div className="form-panel-header">

            <span>
              ACESSO AO SISTEMA
            </span>

            <h2>
              Perfil e permissões
            </h2>

          </div>

          <div className="form-group">

            <label htmlFor="perfil">
              Perfil de acesso
            </label>

            <select
              id="perfil"
              value={perfil}
              onChange={(event) => setPerfil(event.target.value)}
            >

              <option value="administrador">
                Administrador
              </option>

              <option value="fisioterapeuta">
                Fisioterapeuta
              </option>

              <option value="secretaria">
                Secretária
              </option>

              <option value="estagiario">
                Estagiário
              </option>

            </select>

          </div>

          <div className="permission-info">

            <div className="permission-icon">
              🔐
            </div>

            <div>

              <strong>
                Alteração de perfil
              </strong>

              <p>
                Alterar o perfil modifica as permissões
                padrão associadas a este usuário.
              </p>

            </div>

          </div>

          <div className="form-group">

            <label>
              Status do usuário
            </label>

            <div className="status-options">

              <label className="status-option">

                <input
                  type="radio"
                  name="status"
                  checked={status === "Ativo"}
                  onChange={() => setStatus("Ativo")}
                />

                <span>
                  Ativo
                </span>

              </label>

              <label className="status-option">

                <input
                  type="radio"
                  name="status"
                  checked={status === "Inativo"}
                  onChange={() => setStatus("Inativo")}
                />

                <span>
                  Inativo
                </span>

              </label>

            </div>

          </div>

        </section>

      </div>

      <section className="permissions-preview">

        <div className="form-panel-header">

          <span>
            PERMISSÕES ATUAIS
          </span>

          <h2>
            Permissões do perfil: {nomePerfil[perfil]}
          </h2>

          <p>
            Estas são as permissões padrão associadas ao perfil selecionado.
          </p>

        </div>

        <div className="permissions-grid">

          {permissoes[perfil].map(
            ([nomePermissao, permitido]) => (

              <div
                className={`permission-card ${
                  permitido ? "" : "restricted"
                }`}
                key={nomePermissao}
              >

                <strong>
                  {permitido ? "✓" : "×"} {nomePermissao}
                </strong>

                <span>
                  {permitido
                    ? "Acesso permitido"
                    : "Acesso restrito"}
                </span>

              </div>

            )
          )}

        </div>

      </section>

      <div className="novo-usuario-actions">

        <button
          type="button"
          className="secondary-button"
          onClick={onVoltar}
        >
          Cancelar
        </button>

        <button
          type="button"
          className="primary-button"
          onClick={handleSalvar}
        >
          Salvar alterações
        </button>

      </div>

    </div>
  );
}

export default EditarUsuario;