import "./MenuLateral.css";

import {
  LayoutDashboard,
  UsersRound,
  CalendarDays,
  Wallet,
  ReceiptText,
  FileText,
  Landmark,
  Package,
  Megaphone,
  HeartPulse,
  Settings,
  UserRoundCog,
  ShieldCheck,
} from "lucide-react";

const grupos = [
  {
    titulo: "ATENDIMENTO",
    itens: [
      ["dashboard", "Visão geral", LayoutDashboard],
      ["pacientes", "Pacientes", UsersRound],
      ["agenda", "Agenda", CalendarDays],
    ],
  },
  {
    titulo: "FINANCEIRO",
    itens: [
      ["financeiro", "Financeiro", Wallet],
      ["recibos", "Recibos", ReceiptText],
      ["notas", "Notas / NFS-e", FileText],
      ["caixa", "Caixa", Landmark],
    ],
  },
  {
    titulo: "GESTÃO",
    itens: [
      ["estoque", "Estoque", Package],
      ["campanhas", "Marketing", Megaphone],
      ["servicos", "Serviços", HeartPulse],
    ],
  },
  {
    titulo: "ADMINISTRAÇÃO",
    itens: [
      ["configuracao-fiscal", "Configurações", Settings],
      ["usuarios", "Usuários", UserRoundCog],
      ["gestao-fiscal", "Gestão Fiscal", ShieldCheck],
    ],
  },
];

export default function MenuLateral({
  atual,
  perfil,
  onNavigate,
}) {
  const administrador =
    String(perfil).toLowerCase() === "administrador";

  return (
    <nav className="menu" aria-label="Navegação principal">
      {grupos.map((grupo) => (
        <div className="menu-grupo" key={grupo.titulo}>
          <span className="menu-grupo-label">
            {grupo.titulo}
          </span>

          {grupo.itens
            .filter(([pagina]) => pagina !== "usuarios" || administrador)
            .map(([pagina, nome, Icone]) => {
              const ativo = atual === pagina;

              return (
                <button
                  key={pagina}
                  type="button"
                  className={`menu-item ${ativo ? "active" : ""}`}
                  aria-current={ativo ? "page" : undefined}
                  onClick={() => onNavigate(pagina)}
                >
                  <Icone
                    size={19}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <span>{nome}</span>
                </button>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
