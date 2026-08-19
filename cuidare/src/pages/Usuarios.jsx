import "./Usuarios.css";
function Usuarios() {
  return (
    <div className="usuarios-page">

      <div className="usuarios-header">
        <div>
          <span className="page-label">ADMINISTRAÇÃO</span>
          <h1>Usuários</h1>
          <p>
            Gerencie os usuários que possuem acesso ao sistema Cuidare.
          </p>
        </div>

        <button className="primary-button">
          + Novo usuário
        </button>
      </div>

      <div className="usuarios-summary">

        <div className="summary-card">
          <span>Total de usuários</span>
          <strong>2</strong>
          <small>Usuários cadastrados</small>
        </div>

        <div className="summary-card">
          <span>Administradores</span>
          <strong>2</strong>
          <small>Acesso completo</small>
        </div>

        <div className="summary-card">
          <span>Ativos</span>
          <strong>2</strong>
          <small>Usuários ativos</small>
        </div>

        <div className="summary-card">
          <span>Inativos</span>
          <strong>0</strong>
          <small>Nenhum usuário inativo</small>
        </div>

      </div>

      <section className="usuarios-panel">

        <div className="panel-title">
          <div>
            <span>USUÁRIOS CADASTRADOS</span>
            <h2>Controle de acesso</h2>
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

          <div className="table-row">

            <div className="user-info">
              <div className="user-avatar">D</div>

              <div>
                <strong>Administrador</strong>
                <small>admin@cuidare.com.br</small>
              </div>
            </div>

            <span className="role-badge admin">
              Administrador
            </span>

            <span className="status-badge active">
              Ativo
            </span>

            <span className="last-access">
              Acesso recente
            </span>

            <button className="action-button">
              ⋮
            </button>

          </div>

          <div className="table-row">

            <div className="user-info">
              <div className="user-avatar">C</div>

              <div>
                <strong>Clínica Cuidare</strong>
                <small>clinica@cuidare.com.br</small>
              </div>
            </div>

            <span className="role-badge admin">
              Administrador
            </span>

            <span className="status-badge active">
              Ativo
            </span>

            <span className="last-access">
              Acesso recente
            </span>

            <button className="action-button">
              ⋮
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Usuarios;