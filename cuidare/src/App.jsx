import "./App.css";
import { useEffect, useState } from "react";

import Login from "./Login";
import Usuarios from "./pages/Usuarios";
import NovoUsuario from "./pages/NovoUsuario";
import EditarUsuario from "./pages/EditarUsuario";
import GestaoFiscal from "./pages/GestaoFiscal";
import Pacientes from "./pages/Pacientes";
import NovoPaciente from "./pages/NovoPaciente";
import ConfiguracaoFiscal from "./pages/ConfiguracaoFiscal";
import VisualizarPaciente from "./pages/VisualizarPaciente";
import EditarPaciente from "./pages/EditarPaciente";
import Prontuario from "./pages/Prontuario";
import Agenda from "./pages/Agenda";
import NovoAgendamento from "./pages/NovoAgendamento";
import EditarAgendamento from "./pages/EditarAgendamento";
import Financeiro from "./pages/Financeiro";
import ContasReceber from "./pages/ContasReceber";
import Caixa from "./pages/Caixa";
import Estoque from "./pages/Estoque";
import Servicos from "./pages/Servicos";
import PlanosPilates from "./pages/PlanosPilates";
import AlunosPilates from "./pages/AlunosPilates";
import Campanhas from "./pages/Campanhas";
import CentralRecibos from "./CentralRecibos";
import NotasNFSe from "./NotasNFSe";
import { API_URL } from "./config";


const STATUS_LABELS = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

function formatarData(data) {
  if (!data) return "";

  const [ano, mes, dia] = data.split("-");

  return `${dia}/${mes}/${ano}`;
}

function App() {
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);

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

  const [configuracaoFiscalSelecionada, setConfiguracaoFiscalSelecionada] =
    useState(null);

  const [usuarios, setUsuarios] = useState([]);

  const [dashboardDados, setDashboardDados] = useState({
    pacientes: [],
    agendamentos: [],
    carregando: true,
    erro: "",
  });

  const [logoCuidare, setLogoCuidare] = useState(null);
  const [logoVersao, setLogoVersao] = useState(Date.now());

  useEffect(() => {
    if (!usuarioLogado) {
      return;
    }

    async function carregarLogoCuidare() {
      try {
        const response = await fetch(
          `${API_URL}/configuracoes/identidade`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data.logo_nome && data.logo_url) {
          setLogoCuidare(data);
          setLogoVersao(Date.now());
        } else {
          setLogoCuidare(null);
        }
      } catch {
        setLogoCuidare(null);
      }
    }

    carregarLogoCuidare();
  }, [usuarioLogado]);

  function obterLogoCuidareUrl() {
    if (!logoCuidare?.logo_url) {
      return "";
    }

    return `${API_URL}${logoCuidare.logo_url}?v=${logoVersao}`;
  }

  useEffect(() => {
    if (!usuarioLogado || currentPage !== "dashboard") {
      return;
    }

    async function carregarDashboard() {
      try {
        setDashboardDados((atual) => ({
          ...atual,
          carregando: true,
          erro: "",
        }));

        const [pacientesResponse, agendamentosResponse] =
          await Promise.all([
            fetch(`${API_URL}/pacientes`),
            fetch(`${API_URL}/agendamentos`),
          ]);

        if (!pacientesResponse.ok || !agendamentosResponse.ok) {
          throw new Error("Não foi possível carregar os dados do Dashboard.");
        }

        const [pacientesData, agendamentosData] = await Promise.all([
          pacientesResponse.json(),
          agendamentosResponse.json(),
        ]);

        setDashboardDados({
          pacientes: Array.isArray(pacientesData) ? pacientesData : [],
          agendamentos: Array.isArray(agendamentosData)
            ? agendamentosData
            : [],
          carregando: false,
          erro: "",
        });
      } catch (error) {
        console.error("Erro ao carregar Dashboard:", error);

        setDashboardDados((atual) => ({
          ...atual,
          carregando: false,
          erro:
            "Não foi possível carregar os dados do Dashboard. Verifique se a API está funcionando.",
        }));
      }
    }

    carregarDashboard();
  }, [usuarioLogado, currentPage]);

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

  function obterToken() {
    return localStorage.getItem("cuidare_token");
  }

  function normalizarPerfil(perfil) {
    const valor = String(perfil || "").trim().toLowerCase();

    const perfis = {
      administrador: "administrador",
      "administrador": "administrador",
      fisioterapeuta: "fisioterapeuta",
      secretaria: "secretaria",
      recepção: "secretaria",
      recepcao: "secretaria",
      estagiario: "estagiario",
      "estagiário": "estagiario",
      contabilidade: "contabilidade",
      contador: "contabilidade",
    };

    return perfis[valor] || valor;
  }

  function formatarUsuarioApi(usuario) {
    const nomesPerfil = {
      administrador: "Administrador",
      fisioterapeuta: "Fisioterapeuta",
      secretaria: "Recepção",
      contabilidade: "Contabilidade",
      estagiario: "Estagiário",
    };

    return {
      ...usuario,
      perfil:
        nomesPerfil[
          normalizarPerfil(usuario.perfil)
        ] || usuario.perfil,
      status: usuario.status ? "Ativo" : "Inativo",
      ultimoAcesso: usuario.ultimo_acesso
        ? new Date(usuario.ultimo_acesso).toLocaleString("pt-BR")
        : "Nunca acessou",
    };
  }

  async function carregarUsuarios() {
    try {
      const token = obterToken();

      if (!token) {
        throw new Error("Token de acesso não encontrado.");
      }

      const resposta = await fetch(
        `${API_URL}/usuarios`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            "Não foi possível carregar os usuários."
        );
      }

      setUsuarios(
        Array.isArray(dados)
          ? dados.map(formatarUsuarioApi)
          : []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar usuários:",
        error
      );

      alert(
        error.message ||
          "Não foi possível carregar os usuários."
      );
    }
  }

  useEffect(() => {
    if (
      !usuarioLogado ||
      currentPage !== "usuarios"
    ) {
      return;
    }

    carregarUsuarios();
  }, [usuarioLogado, currentPage]);

  async function adicionarUsuario(novoUsuario) {
    try {
      const token = obterToken();

      const perfil = normalizarPerfil(
        novoUsuario.perfil
      );

      const resposta = await fetch(
        `${API_URL}/usuarios`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: novoUsuario.nome.trim(),
            email: novoUsuario.email.trim(),
            telefone:
              novoUsuario.telefone?.trim() || null,
            senha: novoUsuario.senha,
            perfil,
            status: novoUsuario.status === "Ativo",
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            "Não foi possível criar o usuário."
        );
      }

      setUsuarios((usuariosAtuais) => [
        ...usuariosAtuais,
        formatarUsuarioApi(dados),
      ]);

      setCurrentPage("usuarios");
    } catch (error) {
      console.error(
        "Erro ao criar usuário:",
        error
      );

      alert(
        error.message ||
          "Não foi possível criar o usuário."
      );
    }
  }

  async function atualizarUsuario(usuarioAtualizado) {
    try {
      const token = obterToken();

      const resposta = await fetch(
        `${API_URL}/usuarios/${usuarioAtualizado.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: usuarioAtualizado.nome.trim(),
            email: usuarioAtualizado.email.trim(),
            telefone:
              usuarioAtualizado.telefone?.trim() || null,
            perfil: normalizarPerfil(
              usuarioAtualizado.perfil
            ),
            status:
              usuarioAtualizado.status === "Ativo",
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            "Não foi possível atualizar o usuário."
        );
      }

      const usuarioFormatado =
        formatarUsuarioApi(dados);

      setUsuarios((usuariosAtuais) =>
        usuariosAtuais.map((usuario) =>
          usuario.id === usuarioFormatado.id
            ? usuarioFormatado
            : usuario
        )
      );

      setCurrentPage("usuarios");
    } catch (error) {
      console.error(
        "Erro ao atualizar usuário:",
        error
      );

      alert(
        error.message ||
          "Não foi possível atualizar o usuário."
      );
    }
  }

  async function alterarStatusUsuario(usuario) {
    try {
      const token = obterToken();

      const novoStatus =
        usuario.status !== "Ativo";

      const resposta = await fetch(
        `${API_URL}/usuarios/${usuario.id}/status?ativo=${novoStatus}`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            "Não foi possível alterar o status."
        );
      }

      const usuarioFormatado =
        formatarUsuarioApi(dados);

      setUsuarios((usuariosAtuais) =>
        usuariosAtuais.map((usuarioAtual) =>
          usuarioAtual.id === usuarioFormatado.id
            ? usuarioFormatado
            : usuarioAtual
        )
      );
    } catch (error) {
      console.error(
        "Erro ao alterar status:",
        error
      );

      alert(
        error.message ||
          "Não foi possível alterar o status do usuário."
      );
    }
  }

  function abrirEdicao(usuario) {
    setUsuarioSelecionado(usuario);
    setCurrentPage("editar-usuario");
  }

  if (!usuarioLogado) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentPage === "prontuario") {
    return (
      <Prontuario
        pacienteId={pacienteSelecionado}
        onVoltar={() => {
          setCurrentPage("pacientes");
        }}
      />
    );
  }

  if (currentPage === "novo-agendamento") {
    return (
      <NovoAgendamento
        onVoltar={() => setCurrentPage("agenda")}
        onSalvo={() => setCurrentPage("agenda")}
      />
    );
  }

  if (currentPage === "editar-agendamento") {
    return (
      <EditarAgendamento
        agendamentoId={agendamentoSelecionado}
        onVoltar={() => {
          setAgendamentoSelecionado(null);
          setCurrentPage("agenda");
        }}
        onSalvo={() => {
          setAgendamentoSelecionado(null);
          setCurrentPage("agenda");
        }}
      />
    );
  }

  if (currentPage === "agenda") {
    return (
      <Agenda
        onVoltar={() => setCurrentPage("dashboard")}
        onNovoAgendamento={() => setCurrentPage("novo-agendamento")}
        onEditarAgendamento={(agendamentoId) => {
          setAgendamentoSelecionado(agendamentoId);
          setCurrentPage("editar-agendamento");
        }}
      />
    );
  }

  if (currentPage === "pacientes") {
    return (
      <Pacientes
        onNovoPaciente={() => setCurrentPage("novo-paciente")}
        onVisualizarPaciente={(pacienteId) => {
          setPacienteSelecionado(pacienteId);
          setCurrentPage("visualizar-paciente");
        }}
        onEditarPaciente={(pacienteId) => {
          setPacienteSelecionado(pacienteId);
          setCurrentPage("editar-paciente");
        }}
        onVoltar={() => setCurrentPage("dashboard")}
      />
    );
  }

  if (currentPage === "novo-paciente") {
    return (
      <NovoPaciente
        onVoltar={() => setCurrentPage("pacientes")}
        onSalvo={() => setCurrentPage("pacientes")}
      />
    );
  }

  if (currentPage === "editar-paciente") {
    return (
      <EditarPaciente
        pacienteId={pacienteSelecionado}
        onVoltar={() => {
          setCurrentPage("pacientes");
        }}
        onSalvo={() => {
          setCurrentPage("pacientes");
        }}
      />
    );
  }

  if (currentPage === "visualizar-paciente") {
    return (
      <VisualizarPaciente
        pacienteId={pacienteSelecionado}
        onVoltar={() => {
          setPacienteSelecionado(null);
          setCurrentPage("pacientes");
        }}
        onAbrirProntuario={() => {
          setCurrentPage("prontuario");
        }}
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
        onVoltar={() => setCurrentPage("dashboard")}
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
    return (
      <GestaoFiscal
        onVoltar={() => setCurrentPage("dashboard")}
      />
    );
  }

  if (currentPage === "configuracao-fiscal") {
    return (
      <ConfiguracaoFiscal
        configuracaoId={configuracaoFiscalSelecionada}
        onVoltar={() => setCurrentPage("dashboard")}
      />
    );
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


  if (currentPage === "financeiro") {
    return (
      <Financeiro
        onVoltar={() => setCurrentPage("dashboard")}
      />
    );
  }

  if (currentPage === "caixa") {
    return (
      <Caixa
        onVoltar={() => setCurrentPage("financeiro")}
      />
    );
  }

  if (currentPage === "estoque") {
    return (
      <Estoque
        onVoltar={() => setCurrentPage("dashboard")}
      />
    );
  }

  if (currentPage === "alunos-pilates") {
    return (
      <AlunosPilates
        onVoltar={() => setCurrentPage("servicos")}
      />
    );
  }

  if (currentPage === "planos-pilates") {
    return (
      <PlanosPilates
        onVoltar={() => setCurrentPage("servicos")}
      />
    );
  }

  if (currentPage === "campanhas") {
    return (
      <Campanhas
        onVoltar={() => setCurrentPage("dashboard")}
      />
    );
  }

  if (currentPage === "recibos") {
    return (
      <CentralRecibos
        onVoltar={() => setCurrentPage("financeiro")}
      />
    );
  }

  if (currentPage === "notas") {
    return (
      <NotasNFSe
        onVoltar={() => setCurrentPage("dashboard")}
      />
    );
  }

  if (currentPage === "servicos") {
    return (
      <Servicos
        onVoltar={() => setCurrentPage("dashboard")}
        onAbrirPlanosPilates={() => setCurrentPage("planos-pilates")}
        onAbrirAlunosPilates={() => setCurrentPage("alunos-pilates")}
      />
    );
  }

  if (currentPage === "contas-receber") {
    return (
      <ContasReceber
        onVoltar={() => setCurrentPage("financeiro")}
      />
    );
  }

  const nomeUsuario = usuarioLogado?.nome || "Usuário";
  const perfilUsuario = usuarioLogado?.perfil || "Usuário";

  const horaAtual = new Date().getHours();

  let saudacao = "Boa noite";

  if (horaAtual >= 5 && horaAtual < 12) {
    saudacao = "Bom dia";
  } else if (horaAtual >= 12 && horaAtual < 18) {
    saudacao = "Boa tarde";
  }

  const primeiroNome = nomeUsuario.trim().split(/\s+/)[0] || "Usuário";

  const hoje = new Date().toISOString().slice(0, 10);

  const pacientesAtivos = dashboardDados.pacientes.filter(
    (paciente) => paciente.ativo
  );

  const atendimentosHoje = dashboardDados.agendamentos.filter(
    (agendamento) =>
      agendamento.data === hoje &&
      agendamento.ativo &&
      !["cancelado", "faltou"].includes(agendamento.status)
  );

  const proximosAtendimentos = dashboardDados.agendamentos
    .filter(
      (agendamento) =>
        agendamento.ativo &&
        agendamento.data >= hoje &&
        !["cancelado", "faltou", "concluido"].includes(
          agendamento.status
        )
    )
    .sort((a, b) => {
      const dataHoraA = `${a.data}T${a.hora_inicio}`;
      const dataHoraB = `${b.data}T${b.hora_inicio}`;

      return dataHoraA.localeCompare(dataHoraB);
    })
    .slice(0, 5);

  function buscarPaciente(id) {
    return dashboardDados.pacientes.find(
      (paciente) => paciente.id === id
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            {logoCuidare ? (
              <img
                src={obterLogoCuidareUrl()}
                alt="Logo Cuidare"
              />
            ) : (
              "C"
            )}
          </div>

          <div>
            <h1>Cuidare</h1>
            <span>Gestão em Saúde</span>
          </div>
        </div>

        <nav className="menu">
          <button
            className={`menu-item ${
              currentPage === "dashboard" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={`menu-item ${
              currentPage === "pacientes" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("pacientes")}
          >
            Pacientes
          </button>

          <button
            className={`menu-item ${
              currentPage === "agenda" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("agenda")}
          >
            Agenda
          </button>

          <button
            className={`menu-item ${
              currentPage === "financeiro" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("financeiro")}
          >
            Financeiro
          </button>

          <button
            className={`menu-item ${
              currentPage === "recibos" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("recibos")}
          >
            Recibos
          </button>

          <button
            className={`menu-item ${
              currentPage === "notas" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("notas")}
          >
            Notas / NFS-e
          </button>

          <button
            className={`menu-item ${
              currentPage === "caixa" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("caixa")}
          >
            Caixa
          </button>

          <button
            className={`menu-item ${
              currentPage === "estoque" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("estoque")}
          >
            Estoque
          </button>

          <button
            className={`menu-item ${
              currentPage === "campanhas" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("campanhas")}
          >
            Marketing
          </button>

          <button
            className={`menu-item ${
              currentPage === "servicos" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("servicos")}
          >
            Serviços
          </button>

          <button
            className={`menu-item ${
              currentPage === "configuracao-fiscal"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setCurrentPage("configuracao-fiscal")
            }
          >
            Configurações
          </button>

          {["Administrador", "administrador"].includes(
            usuarioLogado?.perfil
          ) && (
            <button
              className={`menu-item ${
                currentPage === "usuarios" ? "active" : ""
              }`}
              onClick={() => setCurrentPage("usuarios")}
            >
              Usuários
            </button>
          )}

          <button
            className={`menu-item ${
              currentPage === "gestao-fiscal"
                ? "active"
                : ""
            }`}
            onClick={() => setCurrentPage("gestao-fiscal")}
          >
            Gestão Fiscal
          </button>
        </nav>

        <div className="sidebar-footer">
          <span>{perfilUsuario}</span>

          <strong>{nomeUsuario}</strong>

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
              {saudacao}, {primeiroNome}!
            </span>

            <h2>Dashboard</h2>
          </div>

          <div className="user-area">
            <div className="avatar">
              {nomeUsuario.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{nomeUsuario}</strong>

              <span>{perfilUsuario}</span>
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
                Tenha o controle da sua clínica em um só
                lugar.
              </h3>

              <p>
                O Cuidare foi desenvolvido para tornar a
                gestão da clínica mais simples, segura e
                inteligente.
              </p>
            </div>

            <div className="card-symbol">
              {logoCuidare ? (
                <img
                  src={obterLogoCuidareUrl()}
                  alt="Logo Cuidare"
                />
              ) : (
                "✚"
              )}
            </div>
          </div>

          {dashboardDados.erro && (
            <div className="agenda-error">
              {dashboardDados.erro}
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <span>Pacientes</span>

              <strong>
                {dashboardDados.carregando
                  ? "..."
                  : pacientesAtivos.length}
              </strong>

              <small>
                {pacientesAtivos.length === 1
                  ? "Paciente ativo cadastrado"
                  : "Pacientes ativos cadastrados"}
              </small>
            </div>

            <div className="stat-card">
              <span>Atendimentos hoje</span>

              <strong>
                {dashboardDados.carregando
                  ? "..."
                  : atendimentosHoje.length}
              </strong>

              <small>
                Atendimentos programados para hoje
              </small>
            </div>

            <div className="stat-card">
              <span>Contas pendentes</span>

              <strong>0</strong>

              <small>
                Nenhuma pendência financeira cadastrada
              </small>
            </div>
          </div>

          <div className="content-grid">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <span>AGENDA</span>

                  <h3>Próximos atendimentos</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage("agenda")}
                >
                  Ver agenda
                </button>
              </div>

              {dashboardDados.carregando ? (
                <div className="empty-state">
                  <div className="empty-icon">◷</div>

                  <strong>
                    Carregando atendimentos...
                  </strong>

                  <p>
                    Aguarde enquanto buscamos a agenda.
                  </p>
                </div>
              ) : proximosAtendimentos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">◷</div>

                  <strong>
                    Nenhum atendimento agendado
                  </strong>

                  <p>
                    Os próximos atendimentos aparecerão
                    aqui.
                  </p>
                </div>
              ) : (
                <div className="dashboard-appointments">
                  {proximosAtendimentos.map(
                    (agendamento) => {
                      const paciente = buscarPaciente(
                        agendamento.paciente_id
                      );

                      return (
                        <div
                          className="dashboard-appointment"
                          key={agendamento.id}
                        >
                          <div>
                            <strong>
                              {agendamento.hora_inicio.slice(
                                0,
                                5
                              )}
                            </strong>

                            <span>
                              {formatarData(
                                agendamento.data
                              )}
                            </span>
                          </div>

                          <div>
                            <strong>
                              {paciente?.nome ||
                                `Paciente #${agendamento.paciente_id}`}
                            </strong>

                            <span>
                              {STATUS_LABELS[
                                agendamento.status
                              ] || agendamento.status}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <span>ACESSO RÁPIDO</span>

                  <h3>Principais ações</h3>
                </div>
              </div>

              <div className="quick-actions">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage("novo-paciente")
                  }
                >
                  Novo paciente
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage("novo-agendamento")
                  }
                >
                  Novo atendimento
                </button>

                <button type="button">
                  Novo lançamento
                </button>

                <button type="button">
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
