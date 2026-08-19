import "./Usuarios.css";

function Usuarios({
  usuarios,
  onNovoUsuario,
  onEditarUsuario,
  onAlterarStatus,
}) {
  const listaUsuarios = usuarios || [];

  const totalUsuarios = listaUsuarios.length;

  const administradores = listaUsuarios.filter(
    (usuario) => usuario.perfil === "Administrador"
  ).length;

  const usuariosAtivos = listaUsuarios.filter(
    (usuario) => usuario.status === "Ativo"
  ).length;

  const usuariosInativos = listaUsuarios.filter(
    (usuario) => usuario.status === "Inativo"
  ).length;

  return (
    <div className="usuarios-page">

      <div className="usuarios-header">

        <div>

          <span className="page-label">
            ADMINISTRAÇÃO
          </span>

          <h1>
            Usuários
          </h1>

          <p>
            Gerencie os usuários que possuem acesso ao sistema Cuidare.
          </p>

        </div>

        <button
          className="primary-button"
          type="button"
          onClick={onNovoUsuario}
        >
          + Novo usuário
        </button>

      </div>

      <div className="usuarios-summary">

        <div className="summary-card">
          <span>Total de usuários</span>
          <strong>{totalUsuarios}</strong>
          <small>Usuários cadastrados</small>
        </div>

        <div className="summary-card">
          <span>Administradores</span>
          <strong>{administradores}</strong>
          <small>Acesso completo</small>
        </div>

        <div className="summary-card">
          <span>Ativos</span>
          <strong>{usuariosAtivos}</strong>
          <small>Usuários ativos</small>
        </div>

        <div className="summary-card">
          <span>Inativos</span>
          <strong>{usuariosInativos}</strong>
          <small>Usuários inativos</small>
        </div>

      </div>

      <section className="usuarios-panel">

        <div className="panel-title">

          <div>

            <span>
              USUÁRIOS CADASTRADOS
            </span>

            <h2>
              Controle de acesso
            </h2>

          </div>

          <input
            type="text"
            placeholder="Pesquisar usuário..."
            className="search-input"
          />

        </div>

        <div className="usuarios-table">

          <div className="table-header">

            <span>USUÁRIO</span>
            <span>PERFIL</span>
            <span>STATUS</span>
            <span>ÚLTIMO ACESSO</span>
            <span>AÇÕES</span>

          </div>

          {listaUsuarios.map((usuario) => (

            <div
              className="table-row"
              key={usuario.id}
            >

              <div className="user-info">

                <div className="user-avatar">

                  {usuario.nome
                    ? usuario.nome.charAt(0).toUpperCase()
                    : "U"}

                </div>

                <div>

                  <strong>
                    {usuario.nome}
                  </strong>

                  <small>
                    {usuario.email}
                  </small>

                </div>

              </div>

              <span className="role-badge admin">
                {usuario.perfil}
              </span>

              <span
                className={`status-badge ${
                  usuario.status === "Ativo"
                    ? "active"
                    : "inactive"
                }`}
              >
                {usuario.status}
              </span>

              <span className="last-access">
                {usuario.ultimoAcesso}
              </span>

              <div className="user-actions">

                <button
                  type="button"
                  className="action-button"
                  onClick={() => onEditarUsuario(usuario)}
                  title="Editar usuário"
                  aria-label="Editar usuário"
                >
                  ✎
                </button>

                <button
                  type="button"
                  className="action-button"
                  onClick={() => onAlterarStatus(usuario)}
                  title={
                    usuario.status === "Ativo"
                      ? "Inativar usuário"
                      : "Ativar usuário"
                  }
                  aria-label={
                    usuario.status === "Ativo"
                      ? "Inativar usuário"
                      : "Ativar usuário"
                  }
                >
                  {usuario.status === "Ativo"
                    ? "⏸"
                    : "▶"}
                </button>

              </div>

            </div>

          ))}

        </div>

      </section>

    </div>
  );
}

export default Usuarios;