import { notificarErro } from "./components/avisos";
import "./App.css";
import LayoutPrincipal from "./LayoutPrincipal";
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
import ResumoPendencias from "./ResumoPendencias";


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

// CUIDARE_DASHBOARD_FINANCEIRO_V1
function saldoPendenteDashboard(conta) {
  if (!conta || conta.ativo === false || ["cancelado", "pago"].includes(conta.status)) {
    return 0;
  }
  return Math.max(0, Math.round(
    (Number(conta.valor || 0) - Number(conta.valor_pago || 0)) * 100
  ) / 100);
}

function formatarDinheiroDashboard(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
  // CUIDARE_ATALHOS_DASHBOARD_V1
  const [atalhoFinanceiro, setAtalhoFinanceiro] = useState(null);

  useEffect(() => {
    if (currentPage !== "financeiro") setAtalhoFinanceiro(null);
  }, [currentPage]);
  // CUIDARE_TURNO_GRADE_V1
  const [relogioDashboard, setRelogioDashboard] = useState(() => new Date());

  useEffect(() => {
    if (currentPage !== "dashboard") return;
    setRelogioDashboard(new Date());
    const timer = setInterval(() => setRelogioDashboard(new Date()), 60000);
    return () => clearInterval(timer);
  }, [currentPage]);

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

  const [financeiroDashboard, setFinanceiroDashboard] = useState({
    receber: [],
    pagar: [],
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
        notificarErro(
          "Não foi possível carregar os dados do Dashboard."
        );

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

  // CUIDARE_DASHBOARD_FINANCEIRO_V1
  const podeVerFinanceiroDashboard = [
    "administrador", "secretaria", "recepcao", "recepção",
  ].includes(String(usuarioLogado?.perfil || "").trim().toLocaleLowerCase("pt-BR"));

  useEffect(() => {
    if (!usuarioLogado || currentPage !== "dashboard" || !podeVerFinanceiroDashboard) {
      return;
    }

    const controller = new AbortController();
    setFinanceiroDashboard((atual) => ({
      ...atual, carregando: true, erro: "",
    }));

    async function consultarFinanceiro() {
      try {
        const [receberRes, pagarRes] = await Promise.all([
          fetch(API_URL + "/contas-receber", { signal: controller.signal }),
          fetch(API_URL + "/contas-pagar", { signal: controller.signal }),
        ]);
        if (!receberRes.ok || !pagarRes.ok) {
          throw new Error("Os vencimentos não puderam ser consultados.");
        }
        const [receber, pagar] = await Promise.all([
          receberRes.json(), pagarRes.json(),
        ]);
        if (!controller.signal.aborted) {
          setFinanceiroDashboard({
            receber: Array.isArray(receber) ? receber : [],
            pagar: Array.isArray(pagar) ? pagar : [],
            carregando: false,
            erro: "",
          });
        }
      } catch (erro) {
        if (!controller.signal.aborted) {
          setFinanceiroDashboard((atual) => ({
            ...atual,
            carregando: false,
            erro: "Não foi possível consultar as pendências financeiras agora.",
          }));
        }
      }
    }

    consultarFinanceiro();
    return () => controller.abort();
  }, [usuarioLogado, currentPage, podeVerFinanceiroDashboard]);

  function abrirFinanceiroComFiltro(aba, vencimento = "todos", contaId = null) {
    setAtalhoFinanceiro({ aba, vencimento, contaId });
    setCurrentPage("financeiro");
  }

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

      notificarErro(
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

      notificarErro(
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

      notificarErro(
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

      notificarErro(
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
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <Prontuario
        pacienteId={pacienteSelecionado}
        onVoltar={() => {
          setCurrentPage("pacientes");
        }}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "novo-agendamento") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <NovoAgendamento
        onVoltar={() => setCurrentPage("agenda")}
        onSalvo={() => setCurrentPage("agenda")}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "editar-agendamento") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
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
      </LayoutPrincipal>
    );
  }

  if (currentPage === "agenda") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <Agenda
        onVoltar={() => setCurrentPage("dashboard")}
        onNovoAgendamento={() => setCurrentPage("novo-agendamento")}
        onEditarAgendamento={(agendamentoId) => {
          setAgendamentoSelecionado(agendamentoId);
          setCurrentPage("editar-agendamento");
        }}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "pacientes") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
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
      </LayoutPrincipal>
    );
  }

  if (currentPage === "novo-paciente") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <NovoPaciente
        onVoltar={() => setCurrentPage("pacientes")}
        onSalvo={() => setCurrentPage("pacientes")}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "editar-paciente") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <EditarPaciente
        pacienteId={pacienteSelecionado}
        onVoltar={() => {
          setCurrentPage("pacientes");
        }}
        onSalvo={() => {
          setCurrentPage("pacientes");
        }}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "visualizar-paciente") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
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
      </LayoutPrincipal>
    );
  }

  if (currentPage === "usuarios") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <Usuarios
        usuarios={usuarios}
        onNovoUsuario={() => setCurrentPage("novo-usuario")}
        onEditarUsuario={abrirEdicao}
        onAlterarStatus={alterarStatusUsuario}
        onVoltar={() => setCurrentPage("dashboard")}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "novo-usuario") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <NovoUsuario
        onVoltar={() => setCurrentPage("usuarios")}
        onSalvar={adicionarUsuario}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "gestao-fiscal") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <GestaoFiscal
        onVoltar={() => setCurrentPage("dashboard")}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "configuracao-fiscal") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <ConfiguracaoFiscal
        configuracaoId={configuracaoFiscalSelecionada}
        onVoltar={() => setCurrentPage("dashboard")}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "editar-usuario") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <EditarUsuario
        usuario={usuarioSelecionado}
        onVoltar={() => setCurrentPage("usuarios")}
        onSalvar={atualizarUsuario}
      />
      </LayoutPrincipal>
    );
  }


  if (currentPage === "financeiro") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <Financeiro
        onVoltar={() => setCurrentPage("dashboard")}
        onAbrirCaixa={() => setCurrentPage("caixa")} // CUIDARE_INTEGRIDADE_FINANCEIRA_V1
              atalhoDashboard={atalhoFinanceiro}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "caixa") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <Caixa
        onVoltar={() => setCurrentPage("financeiro")}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "estoque") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <Estoque
        onVoltar={() => setCurrentPage("dashboard")}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "alunos-pilates") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <AlunosPilates
        onVoltar={() => setCurrentPage("servicos")}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "planos-pilates") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <PlanosPilates
        onVoltar={() => setCurrentPage("servicos")}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "campanhas") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <Campanhas
        onVoltar={() => setCurrentPage("dashboard")}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "recibos") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <CentralRecibos
        onVoltar={() => setCurrentPage("financeiro")}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "notas") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <NotasNFSe
        onVoltar={() => setCurrentPage("dashboard")}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "servicos") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <Servicos
        onVoltar={() => setCurrentPage("dashboard")}
        onAbrirPlanosPilates={() => setCurrentPage("planos-pilates")}
        onAbrirAlunosPilates={() => setCurrentPage("alunos-pilates")}
      />
      </LayoutPrincipal>
    );
  }

  if (currentPage === "contas-receber") {
    return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
      <ContasReceber
        onVoltar={() => setCurrentPage("financeiro")}
      />
      </LayoutPrincipal>
    );
  }

  const hoje = [
    relogioDashboard.getFullYear(),
    String(relogioDashboard.getMonth() + 1).padStart(2, "0"),
    String(relogioDashboard.getDate()).padStart(2, "0"),
  ].join("-");

  const receitasPendentes = financeiroDashboard.receber.filter(
    (conta) => saldoPendenteDashboard(conta) > 0
  );
  const despesasPendentes = financeiroDashboard.pagar.filter(
    (conta) => saldoPendenteDashboard(conta) > 0
  );

  const receitasHoje = receitasPendentes.filter((c) => c.vencimento === hoje);
  const despesasHoje = despesasPendentes.filter((c) => c.vencimento === hoje);
  const receitasAtrasadas = receitasPendentes.filter((c) => c.vencimento < hoje);
  const despesasAtrasadas = despesasPendentes.filter((c) => c.vencimento < hoje);

  function somaPendente(lista) {
    return lista.reduce((soma, conta) => soma + saldoPendenteDashboard(conta), 0);
  }

  const itensFinanceirosPrioritarios = [
    ...receitasAtrasadas.map((c) => ({ ...c, tipo: "Receber", atrasado: true })),
    ...despesasAtrasadas.map((c) => ({ ...c, tipo: "Pagar", atrasado: true })),
    ...receitasHoje.map((c) => ({ ...c, tipo: "Receber", atrasado: false })),
    ...despesasHoje.map((c) => ({ ...c, tipo: "Pagar", atrasado: false })),
  ].sort((a, b) =>
    String(a.vencimento).localeCompare(String(b.vencimento)) ||
    String(a.tipo).localeCompare(String(b.tipo))
  ).slice(0, 6);

  const pacientesAtivos = dashboardDados.pacientes.filter(
    (paciente) => paciente.ativo
  );

  const atendimentosHoje = dashboardDados.agendamentos.filter(
    (agendamento) =>
      agendamento.data === hoje &&
      agendamento.ativo &&
      !["cancelado", "faltou"].includes(agendamento.status)
  );

  const turnoAtual = relogioDashboard.getHours() < 12
    ? { nome: "Manhã", inicio: "00:00", fim: "12:00" }
    : { nome: "Tarde e noite", inicio: "12:00", fim: "24:00" };

  const proximosAtendimentos = dashboardDados.agendamentos
    .filter((agendamento) => (
      agendamento.ativo &&
      agendamento.data === hoje &&
      !["cancelado", "faltou"].includes(agendamento.status) &&
      String(agendamento.hora_inicio || "") >= turnoAtual.inicio &&
      String(agendamento.hora_inicio || "") < turnoAtual.fim
    ))
    .sort((a, b) =>
      String(a.hora_inicio || "").localeCompare(String(b.hora_inicio || ""))
    );

  function buscarPaciente(id) {
    return dashboardDados.pacientes.find(
      (paciente) => paciente.id === id
    );
  }

  return (
      <LayoutPrincipal
        pagina={currentPage}
        usuario={usuarioLogado}
        logoUrl={logoCuidare ? obterLogoCuidareUrl() : ""}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
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

            {podeVerFinanceiroDashboard && (
              <div className="stat-card">
                <span>Contas pendentes</span>
                <strong>
                  {financeiroDashboard.carregando
                    ? "..."
                    : receitasPendentes.length + despesasPendentes.length}
                </strong>
                <small>
                  {financeiroDashboard.erro
                    ? "Consulta indisponível"
                    : "Cobranças e despesas em aberto"}
                </small>
              </div>
            )}
          </div>

          {podeVerFinanceiroDashboard && (
            <section className="dashboard-financeiro-diario">
              <header className="dashboard-financeiro-topo">
                <div>
                  <span>FINANCEIRO DO DIA</span>
                  <h3>Vencimentos e pendências</h3>
                </div>
                <button type="button" onClick={() => setCurrentPage("financeiro")}>
                  Ver no Financeiro →
                </button>
              </header>

              {financeiroDashboard.carregando ? (
                <p className="dashboard-financeiro-mensagem">Consultando vencimentos...</p>
              ) : financeiroDashboard.erro ? (
                <p className="dashboard-financeiro-erro" role="status">
                  {financeiroDashboard.erro}
                </p>
              ) : (
                <>
                  <div className="dashboard-financeiro-resumos">
                    <button type="button"
                      className={"dashboard-financeiro-cartao-atalho"}
                      onClick={() => abrirFinanceiroComFiltro("receber", "hoje")}
                      aria-label="Consultar receber hoje no Financeiro">
                      <span>Receber hoje</span>
                      <strong>{formatarDinheiroDashboard(somaPendente(receitasHoje))}</strong>
                      <small>{receitasHoje.length} cobrança(s)</small>
                    </button>
                    <button type="button"
                      className={"dashboard-financeiro-cartao-atalho"}
                      onClick={() => abrirFinanceiroComFiltro("pagar", "hoje")}
                      aria-label="Consultar pagar hoje no Financeiro">
                      <span>Pagar hoje</span>
                      <strong>{formatarDinheiroDashboard(somaPendente(despesasHoje))}</strong>
                      <small>{despesasHoje.length} despesa(s)</small>
                    </button>
                    <button type="button"
                      className={"dashboard-financeiro-cartao-atalho" + (receitasAtrasadas.length ? " dashboard-financeiro-atencao" : "")}
                      onClick={() => abrirFinanceiroComFiltro("receber", "atrasados")}
                      aria-label="Consultar recebimentos em atraso no Financeiro">
                      <span>Recebimentos em atraso</span>
                      <strong>{formatarDinheiroDashboard(somaPendente(receitasAtrasadas))}</strong>
                      <small>{receitasAtrasadas.length} cobrança(s)</small>
                    </button>
                    <button type="button"
                      className={"dashboard-financeiro-cartao-atalho" + (despesasAtrasadas.length ? " dashboard-financeiro-atencao" : "")}
                      onClick={() => abrirFinanceiroComFiltro("pagar", "atrasados")}
                      aria-label="Consultar despesas em atraso no Financeiro">
                      <span>Despesas em atraso</span>
                      <strong>{formatarDinheiroDashboard(somaPendente(despesasAtrasadas))}</strong>
                      <small>{despesasAtrasadas.length} despesa(s)</small>
                    </button>
                  </div>

                  {itensFinanceirosPrioritarios.length > 0 ? (
                    <div className="dashboard-financeiro-lista">
                      <strong className="dashboard-financeiro-lista-titulo">
                        Pendências prioritárias
                      </strong>
                      {itensFinanceirosPrioritarios.map((item) => (
                        <button type="button" className="dashboard-financeiro-item dashboard-financeiro-item-atalho"
                          key={item.tipo + "-" + item.id}
                          onClick={() => abrirFinanceiroComFiltro(
                            item.tipo === "Receber" ? "receber" : "pagar",
                            item.atrasado ? "atrasados" : "hoje",
                            item.id
                          )}
                          title="Abrir este lançamento no Financeiro">
                          <span className={
                            item.atrasado
                              ? "dashboard-financeiro-tipo atrasado"
                              : "dashboard-financeiro-tipo"
                          }>
                            {item.atrasado ? "Atrasado · " : "Hoje · "}
                            {item.tipo}
                          </span>
                          <strong title={item.descricao}>{item.descricao}</strong>
                          <span>{item.vencimento?.split("-").reverse().join("/")}</span>
                          <b>{formatarDinheiroDashboard(saldoPendenteDashboard(item))}</b>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="dashboard-financeiro-mensagem">
                      Nenhuma cobrança ou despesa vencida ou vencendo hoje.
                    </p>
                  )}
                </>
              )}
            </section>
          )}

          <div className="content-grid">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <span>AGENDA</span>

                  <h3>Agenda do turno · {turnoAtual.nome}</h3>
                  <small className="dashboard-turno-contador">
                    {proximosAtendimentos.length} atendimento(s) hoje neste turno
                  </small>
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
                    Nenhum atendimento neste turno
                  </strong>

                  <p>
                    Os atendimentos deste turno aparecerão
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
      </LayoutPrincipal>
  );
}

export default App;
