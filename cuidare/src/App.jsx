import "./App.css";
import { useState } from "react";

import Login from "./Login";
import Usuarios from "./pages/Usuarios";
import NovoUsuario from "./pages/NovoUsuario";
import EditarUsuario from "./pages/EditarUsuario";
import GestaoFiscal from "./pages/GestaoFiscal";


function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const usuarioSalvo = localStorage.getItem("cuidare_usuario");

    if (!usuarioSalvo) {
      return null;
    }

    try {
      return JSON.parse(usuarioSalvo);
    } catch {
      localStorage.removeItem("cuidare_usuario");
      localStorage.removeItem("cuidare_token");
      return null;
    }
  });

  const [currentPage, setCurrentPage] = useState("dashboard");

  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  const [usuarios, setUsuarios] = useState([
    {
      id: 1,
      nome: "Administrador",
      email: "admin@cuidare.com.br",
      telefone: "(00) 00000-0000",
      perfil: "Administrador",
      status: "Ativo",
      ultimoAcesso: "Acesso recente",
    },
    {
      id: 2,
      nome: "Clínica Cuidare",
      email: "clinica@cuidare.com.br",
      telefone: "(00) 00000-0000",
      perfil: "Administrador",
      status: "Ativo",
      ultimoAcesso: "Acesso recente",
    },
  ]);


  function handleLogin(usuario) {
    setUsuarioLogado(usuario);
    setCurrentPage("dashboard");
  }


  function handleLogout() {
    localStorage.removeItem("cuidare_token");
    localStorage.removeItem("cuidare_usuario");

    setUsuarioLogado(null);
    setCurrentPage("dashboard");
  }


  function adicionarUsuario(novoUsuario) {
    const usuario = {
      ...novoUsuario,
      id: Date.now(),
      ultimoAcesso: "Nunca acessou",
    };

    setUsuarios((usuariosAtuais) => [
      ...usuariosAtuais,
      usuario,
    ]);

    setCurrentPage("usuarios");
  }


  function atualizarUsuario(usuarioAtualizado) {
    setUsuarios((usuariosAtuais) =>
      usuariosAtuais.map((usuario) =>
        usuario.id === usuarioAtualizado.id
          ? usuarioAtualizado
          : usuario
      )
    );

    setCurrentPage("usuarios");
  }


  function alterarStatusUsuario(usuario) {
    setUsuarios((usuariosAtuais) =>
      usuariosAtuais.map((usuarioAtual) =>
        usuarioAtual.id === usuario.id
          ? {
              ...usuarioAtual,
              status:
                usuarioAtual.status === "Ativo"
                  ? "Inativo"
                  : "Ativo",
            }
          : usuarioAtual
      )
    );
  }


  function abrirEdicao(usuario) {
    setUsuarioSelecionado(usuario);
    setCurrentPage("editar-usuario");
  }


  if (!usuarioLogado) {
    return (
      <Login
        onLogin={handleLogin}
      />
    );
  }


  if (currentPage === "usuarios") {
    return (
      <Usuarios
        usuarios={usuarios}
        onNovoUsuario={() => setCurrentPage("novo-usuario")}
        onEditarUsuario={abrirEdicao}
        onAlterarStatus={alterarStatusUsuario}
      />
    );
  }


  if (currentPage === "novo-usuario") {
    return (
      <NovoUsuario
        onVoltar={() => setCurrentPage("usuarios")}
        onSalvar={adicionarUsuario}
      />
    );
  }


  if (currentPage === "gestao-fiscal") {
    return <GestaoFiscal />;
  }

  if (currentPage === "editar-usuario") {
    return (
      <EditarUsuario
        usuario={usuarioSelecionado}
        onVoltar={() => setCurrentPage("usuarios")}
        onSalvar={atualizarUsuario}
      />
    );
  }


  const nomeUsuario =
    usuarioLogado?.nome || "Usuário";

  const perfilUsuario =
    usuarioLogado?.perfil || "Usuário";


  return (
    <div className="app">

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            C
          </div>

          <div>
            <h1>Cuidare</h1>
            <span>Gestão em Saúde</span>
          </div>

        </div>


        <nav className="menu">

          <button
            className="menu-item active"
            onClick={() => setCurrentPage("dashboard")}
          >
            Dashboard
          </button>


          <button className="menu-item">
            Pacientes
          </button>


          <button className="menu-item">
            Prontuários
          </button>


          <button className="menu-item">
            Agenda
          </button>


          <button className="menu-item">
            Financeiro
          </button>


          <button className="menu-item">
            Estoque
          </button>


          <button className="menu-item">
            Relatórios
          </button>


          <button
            className="menu-item"
            onClick={() => setCurrentPage("usuarios")}
          >
            Configurações
          </button>

          <button
            className={`menu-item ${currentPage === "gestao-fiscal" ? "active" : ""}`}
            onClick={() => setCurrentPage("gestao-fiscal")}
          >
            Gestão Fiscal
          </button>

        </nav>


        <div className="sidebar-footer">

          <span>
            {perfilUsuario}
          </span>

          <strong>
            {nomeUsuario}
          </strong>

          <button
            onClick={handleLogout}
            className="logout-button"
          >
            Sair
          </button>

        </div>

      </aside>


      <main className="main-content">

        <header className="topbar">

          <div>

            <span className="welcome">
              Bem-vindo ao Cuidare
            </span>

            <h2>
              Dashboard
            </h2>

          </div>


          <div className="user-area">

            <div className="avatar">
              {nomeUsuario.charAt(0).toUpperCase()}
            </div>


            <div>

              <strong>
                {nomeUsuario}
              </strong>

              <span>
                {perfilUsuario}
              </span>

            </div>

          </div>

        </header>


        <section className="dashboard">

          <div className="welcome-card">

            <div>

              <span className="card-label">
                VISÃO GERAL
              </span>


              <h3>
                Tenha o controle da sua clínica em um só lugar.
              </h3>


              <p>
                O Cuidare foi desenvolvido para tornar a gestão
                da clínica mais simples, segura e inteligente.
              </p>

            </div>


            <div className="card-symbol">
              ✚
            </div>

          </div>


          <div className="stats-grid">

            <div className="stat-card">

              <span>
                Pacientes
              </span>

              <strong>
                0
              </strong>

              <small>
                Nenhum paciente cadastrado
              </small>

            </div>


            <div className="stat-card">

              <span>
                Atendimentos hoje
              </span>

              <strong>
                0
              </strong>

              <small>
                Agenda disponível
              </small>

            </div>


            <div className="stat-card">

              <span>
                Receita do mês
              </span>

              <strong>
                R$ 0,00
              </strong>

              <small>
                Aguardando lançamentos
              </small>

            </div>


            <div className="stat-card">

              <span>
                Contas pendentes
              </span>

              <strong>
                0
              </strong>

              <small>
                Nenhuma pendência
              </small>

            </div>

          </div>


          <div className="content-grid">

            <section className="panel">

              <div className="panel-header">

                <div>

                  <span>
                    AGENDA
                  </span>

                  <h3>
                    Próximos atendimentos
                  </h3>

                </div>


                <button>
                  Ver agenda
                </button>

              </div>


              <div className="empty-state">

                <div className="empty-icon">
                  ◷
                </div>


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

                  <span>
                    ACESSO RÁPIDO
                  </span>

                  <h3>
                    Principais ações
                  </h3>

                </div>

              </div>


              <div className="quick-actions">

                <button>
                  Novo paciente
                </button>


                <button>
                  Novo atendimento
                </button>


                <button>
                  Novo lançamento
                </button>


                <button>
                  Registrar ocorrência
                </button>

              </div>

            </section>

          </div>

        </section>

      </main>

    </div>
  );
}


export default App;