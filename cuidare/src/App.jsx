import './App.css'
import Login from "./Login";
import { useState } from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">C</div>

          <div>
            <h1>Cuidare</h1>
            <span>Gestão em Saúde</span>
          </div>
        </div>

        <nav className="menu">
          <button className="menu-item active">Dashboard</button>
          <button className="menu-item">Pacientes</button>
          <button className="menu-item">Prontuários</button>
          <button className="menu-item">Agenda</button>
          <button className="menu-item">Financeiro</button>
          <button className="menu-item">Estoque</button>
          <button className="menu-item">Relatórios</button>
          <button className="menu-item">Configurações</button>
        </nav>

        <div className="sidebar-footer">
          <span>Administrador</span>
          <strong>Cuidare Clínica</strong>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="welcome">Bem-vindo ao Cuidare</span>
            <h2>Dashboard</h2>
          </div>

          <div className="user-area">
            <div className="avatar">A</div>

            <div>
              <strong>Administrador</strong>
              <span>Acesso completo</span>
            </div>
          </div>
        </header>

        <section className="dashboard">

          <div className="welcome-card">
            <div>
              <span className="card-label">VISÃO GERAL</span>

              <h3>
                Tenha o controle da sua clínica em um só lugar.
              </h3>

              <p>
                O Cuidare foi desenvolvido para tornar a gestão da clínica
                mais simples, segura e inteligente.
              </p>
            </div>

            <div className="card-symbol">✚</div>
          </div>

          <div className="stats-grid">

            <div className="stat-card">
              <span>Pacientes</span>
              <strong>0</strong>
              <small>Nenhum paciente cadastrado</small>
            </div>

            <div className="stat-card">
              <span>Atendimentos hoje</span>
              <strong>0</strong>
              <small>Agenda disponível</small>
            </div>

            <div className="stat-card">
              <span>Receita do mês</span>
              <strong>R$ 0,00</strong>
              <small>Aguardando lançamentos</small>
            </div>

            <div className="stat-card">
              <span>Contas pendentes</span>
              <strong>0</strong>
              <small>Nenhuma pendência</small>
            </div>

          </div>

          <div className="content-grid">

            <section className="panel">

              <div className="panel-header">
                <div>
                  <span>AGENDA</span>
                  <h3>Próximos atendimentos</h3>
                </div>

                <button>Ver agenda</button>
              </div>

              <div className="empty-state">
                <div className="empty-icon">◷</div>

                <strong>
                  Nenhum atendimento agendado
                </strong>

                <p>
                  Os próximos atendimentos aparecerão aqui.
                </p>
              </div>

            </section>

            <section className="panel">

              <div className="panel-header">
                <div>
                  <span>ACESSO RÁPIDO</span>
                  <h3>Principais ações</h3>
                </div>
              </div>

              <div className="quick-actions">
                <button>Novo paciente</button>
                <button>Novo atendimento</button>
                <button>Novo lançamento</button>
                <button>Registrar ocorrência</button>
              </div>

            </section>

          </div>

        </section>
      </main>
    </div>
  );
}

export default App;