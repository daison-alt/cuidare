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
  const perfilNormalizado = String(perfil || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const administrador = perfilNormalizado === "administrador";
  const recepcao = perfilNormalizado === "secretaria" || perfilNormalizado === "recepcao";
  const paginasRecepcao = new Set([
    "dashboard",
    "pacientes",
    "agenda",
    "financeiro",
    "recibos",
    "caixa",
    "campanhas",
    "servicos",
  ]);

  return (
    <nav className="menu" aria-label="Navegação principal">
      {grupos.map((grupo) => {
        const itensVisiveis = grupo.itens.filter(([pagina]) => {
          if (recepcao) return paginasRecepcao.has(pagina);
          if (pagina === "usuarios") return administrador;
          if (pagina === "campanhas") return administrador;
          return true;
        });

        if (itensVisiveis.length === 0) return null;

        return (
          <div className="menu-grupo" key={grupo.titulo}>
            <span className="menu-grupo-label">{grupo.titulo}</span>
            {itensVisiveis.map(([pagina, nome, Icone]) => {
              const ativo = atual === pagina;
              return (
                <button
                  key={pagina}
                  type="button"
                  className={"menu-item " + (ativo ? "active" : "")}
                  aria-current={ativo ? "page" : undefined}
                  onClick={() => onNavigate(pagina)}
                >
                  <Icone size={19} strokeWidth={1.8} aria-hidden="true" />
                  <span>{nome}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
