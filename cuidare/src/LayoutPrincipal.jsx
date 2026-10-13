import { useState } from "react";
import { Menu, LogOut, ChevronRight } from "lucide-react";
import MenuLateral from "./MenuLateral";
import "./LayoutPrincipal.css";

const titulos = {
  dashboard: "Dashboard",
  pacientes: "Pacientes",
  "novo-paciente": "Novo paciente",
  "editar-paciente": "Editar paciente",
  "visualizar-paciente": "Dados do paciente",
  prontuario: "Prontuário",
  agenda: "Agenda",
  "novo-agendamento": "Novo atendimento",
  "editar-agendamento": "Editar atendimento",
  financeiro: "Financeiro",
  "contas-receber": "Contas a receber",
  recibos: "Recibos",
  notas: "Notas / NFS-e",
  caixa: "Caixa",
  estoque: "Estoque",
  campanhas: "Marketing",
  servicos: "Serviços",
  "planos-pilates": "Planos de Pilates",
  "alunos-pilates": "Alunos de Pilates",
  usuarios: "Usuários",
  "novo-usuario": "Novo usuário",
  "editar-usuario": "Editar usuário",
  "gestao-fiscal": "Gestão Fiscal",
  "configuracao-fiscal": "Configurações",
};

const paginasPai = {
  "novo-paciente": "pacientes",
  "editar-paciente": "pacientes",
  "visualizar-paciente": "pacientes",
  prontuario: "pacientes",
  "novo-agendamento": "agenda",
  "editar-agendamento": "agenda",
  "contas-receber": "financeiro",
  "planos-pilates": "servicos",
  "alunos-pilates": "servicos",
  "novo-usuario": "usuarios",
  "editar-usuario": "usuarios",
};

export default function LayoutPrincipal({
  pagina,
  usuario,
  logoUrl,
  onNavigate,
  onLogout,
  children,
}) {
  const [menuAberto, setMenuAberto] = useState(false);

  const nome = usuario?.nome || "Usuário";
  const perfil = usuario?.perfil || "Usuário";
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const hora = new Date().getHours();

  const saudacao =
    hora < 5 ? "Boa noite" :
    hora < 12 ? "Bom dia" :
    hora < 18 ? "Boa tarde" : "Boa noite";

  function navegar(destino) {
    setMenuAberto(false);
    onNavigate(destino);
  }

  return (
    <div className="app cuidare-layout">
      {menuAberto && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <aside
        id="cuidare-menu"
        className={`sidebar ${menuAberto ? "sidebar-aberta" : ""}`}
      >
        <div className="brand">
          <div className="brand-icon">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo Cuidare" />
            ) : "C"}
          </div>
          <div>
            <h1>Cuidare</h1>
            <span>Gestão em Saúde</span>
          </div>
        </div>

        <MenuLateral
          atual={paginasPai[pagina] || pagina}
          perfil={perfil}
          onNavigate={navegar}
        />

        <div className="sidebar-footer">
          <span>{perfil}</span>
          <strong>{nome}</strong>
          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
          >
            <LogOut size={17} aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Abrir menu"
            aria-controls="cuidare-menu"
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto(true)}
          >
            <Menu size={22} />
          </button>

          <div className="layout-heading">
            <span className="welcome">
              {saudacao}, {primeiroNome}!
            </span>
            {pagina === "dashboard" ? (
              <h2>Dashboard</h2>
            ) : (
              <div className="layout-breadcrumb">
                <span>Cuidare</span>
                <ChevronRight size={14} aria-hidden="true" />
                <span>{titulos[pagina] || "Área de trabalho"}</span>
              </div>
            )}
          </div>

          <div className="user-area">
            <div className="avatar">
              {nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{nome}</strong>
              <span>{perfil}</span>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
