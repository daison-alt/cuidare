import { useState } from "react";
import "./NovoUsuario.css";

function NovoUsuario({ onVoltar }) {
  const [perfil, setPerfil] = useState("");

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
            Novo usuário
          </h1>

          <p>
            Cadastre um novo usuário e defina seu nível de acesso ao Cuidare.
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
                placeholder="Digite o nome completo"
              />

            </div>

            <div className="form-group">

              <label htmlFor="email">
                Usuário ou e-mail
              </label>

              <input
                id="email"
                type="email"
                placeholder="Digite o usuário ou e-mail"
              />

            </div>

            <div className="form-group">

              <label htmlFor="telefone">
                Telefone
              </label>

              <input
                id="telefone"
                type="text"
                placeholder="(00) 00000-0000"
              />

            </div>

            <div className="form-group">

              <label htmlFor="senha">
                Senha
              </label>

              <input
                id="senha"
                type="password"
                placeholder="Digite uma senha"
              />

            </div>

            <div className="form-group">

              <label htmlFor="confirmarSenha">
                Confirmar senha
              </label>

              <input
                id="confirmarSenha"
                type="password"
                placeholder="Confirme a senha"
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

              <option value="" disabled>
                Selecione um perfil
              </option>

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
                Permissões por perfil
              </strong>

              <p>
                As permissões são apresentadas automaticamente
                de acordo com o perfil selecionado.
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
                  value="ativo"
                  defaultChecked
                />

                <span>
                  Ativo
                </span>

              </label>

              <label className="status-option">

                <input
                  type="radio"
                  name="status"
                  value="inativo"
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
            PERMISSÕES
          </span>

          <h2>
            {perfil
              ? `Permissões do perfil: ${
                  perfil === "administrador"
                    ? "Administrador"
                    : perfil === "fisioterapeuta"
                    ? "Fisioterapeuta"
                    : perfil === "secretaria"
                    ? "Secretária"
                    : "Estagiário"
                }`
              : "Selecione um perfil"
            }
          </h2>

          <p>
            Os acessos abaixo serão definidos automaticamente
            conforme o perfil escolhido.
          </p>

        </div>

        {!perfil && (
          <div className="permission-empty">
            <div>
              🔐
            </div>

            <strong>
              Nenhum perfil selecionado
            </strong>

            <p>
              Selecione um perfil acima para visualizar
              as permissões disponíveis.
            </p>
          </div>
        )}

        {perfil && (
          <div className="permissions-grid">

            {permissoes[perfil].map(([nome, permitido]) => (

              <div
                className={`permission-card ${
                  permitido ? "" : "restricted"
                }`}
                key={nome}
              >

                <strong>
                  {permitido ? "✓" : "×"} {nome}
                </strong>

                <span>
                  {permitido
                    ? "Acesso permitido"
                    : "Acesso restrito"
                  }
                </span>

              </div>

            ))}

          </div>
        )}

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
        >
          Criar usuário
        </button>

      </div>

    </div>
  );
}

export default NovoUsuario;