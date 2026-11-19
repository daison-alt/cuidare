"""Cuidare: liga o sino do cartao Visao Geral do Dashboard aos alertas administrativos.
Sao alterados exclusivamente App.jsx, App.css e ControleClinica.jsx.
"""
import os
import re
from pathlib import Path

raiz = Path(os.environ["CUIDARE_RAIZ"])
app_path = raiz / "cuidare" / "src" / "App.jsx"
css_path = raiz / "cuidare" / "src" / "App.css"
controle_path = raiz / "cuidare" / "src" / "pages" / "ControleClinica.jsx"

for p in (app_path, css_path, controle_path):
    if not p.is_file():
        raise RuntimeError(f"Arquivo esperado nao encontrado: {p}")

app = app_path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
css = css_path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
controle = controle_path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
marker = "CUIDARE_SINO_DASHBOARD_V3"
if marker in app:
    print("Sino no Dashboard ja instalado. Nenhum arquivo foi modificado.")
    raise SystemExit(0)


def unico(texto, padrao, func, nome, flags=0):
    matches = list(re.finditer(padrao, texto, flags))
    if len(matches) != 1:
        raise RuntimeError(f"{nome}: encontrado {len(matches)} vez(es); esperado uma. Nenhum arquivo alterado.")
    m = matches[0]
    return texto[:m.start()] + func(m) + texto[m.end():]

# Identificar o dashboard original e seu marcador, antes de aplicar mudancas.
if "card-symbol" not in app or "controle-clinica" not in app:
    raise RuntimeError("Versao do Dashboard incompatível: card-symbol ou Controle da Clinica ausente.")

# Adiciona icone integrado ao projeto (lucide-react já utilizado no menu).
if 'import { Bell } from "lucide-react";' not in app:
    app = unico(app, r'(import\s+\{\s*useCallback,\s*useEffect,\s*useState\s*\}\s+from\s+"react";)',
                lambda m: m.group(1) + '\nimport { Bell } from "lucide-react";', "Importacao React")

# Armazenar o destino e os avisos de forma independente dos dados de pacientes.
app = unico(
    app,
    r'(const\s*\[\s*currentPage\s*,\s*setCurrentPage\s*\]\s*=\s*useState\("dashboard"\);)',
    lambda m: m.group(1) + '''
  // CUIDARE_SINO_DASHBOARD_V3
  const [abaInicialControle, setAbaInicialControle] = useState("inicio");
  const [alertasControle, setAlertasControle] = useState({ total: null, erro: "" });

  function abrirNotificacoesClinica() {
    setAbaInicialControle("notificacoes");
    setCurrentPage("controle-clinica");
  }

  useEffect(() => {
    if (currentPage !== "controle-clinica") setAbaInicialControle("inicio");
  }, [currentPage]);''',
    "Estado pagina principal"
)

# Aproveita a permissão já existente e busca somente o resumo (nenhum dado médico).
app = unico(
    app,
    r'(const\s+pode\s*=\s*\(chave\)\s*=>\s*permissoesAtuais\?\.\[chave\]\s*===\s*true;)',
    lambda m: m.group(1) + '''
  const podeVerControle = pode("controle_clinica.visualizar");
  useEffect(() => {
    if (!usuarioLogado || currentPage !== "dashboard" || !podeVerControle) return;
    let ativo = true;
    const controller = new AbortController();
    setAlertasControle({ total: null, erro: "" });
    fetch(`${API_URL}/controle-clinica/resumo`, { signal: controller.signal })
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => { if (ativo) setAlertasControle({ total: Array.isArray(d.alertas) ? d.alertas.length : 0, erro: "" }); })
      .catch(e => { if (ativo && e.name !== "AbortError") setAlertasControle({ total: null, erro: "Avisos indisponíveis" }); });
    return () => { ativo = false; controller.abort(); };
  }, [usuarioLogado, currentPage, podeVerControle]);
''',
    "Permissoes dashboard"
)

# Ao abrir a pagina pelo sino, o usuario cai diretamente na aba Notificações.
app = unico(
    app,
    r'(\<ControleClinica\s*\n\s*)(podeEditar=\{pode\("controle_clinica\.editar"\)\})',
    lambda m: m.group(1) + 'abaInicial={abaInicialControle}\n          ' + m.group(2),
    "Propriedade aba inicial"
)

# Corrige o local de fato pedido: substitui o +/logo no cartão VISÃO GERAL do dashboard.
# O logo é mantido como fallback para perfis sem permissão de visualização administrativa.
replacement = '''            {podeVerControle ? (
              <button
                type="button"
                className="dashboard-sino-notificacoes"
                onClick={abrirNotificacoesClinica}
                aria-label={alertasControle.total == null ? "Abrir notificações da clínica" : `Abrir notificações da clínica, ${alertasControle.total} aviso(s)`}
                title={alertasControle.erro || "Abrir notificações e vencimentos"}
              >
                <Bell size={48} strokeWidth={1.6} aria-hidden="true" />
                {alertasControle.total > 0 && (
                  <span className="dashboard-sino-contador">{alertasControle.total > 99 ? "99+" : alertasControle.total}</span>
                )}
                <span className="dashboard-sino-legenda">Notificações</span>
              </button>
            ) : (
              <div className="card-symbol">
                {logoCuidare ? (
                  <img src={obterLogoCuidareUrl()} alt="Logo Cuidare" />
                ) : (
                  "✚"
                )}
              </div>
            )}'''
app = unico(
    app,
    r'<div\s+className="card-symbol"\s*>\s*\{logoCuidare\s*\?\s*\([\s\S]*?\)\s*:\s*\(\s*"✚"\s*\)\s*\}\s*</div>',
    lambda _: replacement,
    "Simbolo/Logo Visao Geral"
)

# Disponibiliza a abertura direta de uma aba. Não afeta o restante do Controle da Clínica.
controle = unico(
    controle,
    r'(export\s+default\s+function\s+ControleClinica\s*\(\s*\{\s*onVoltar\s*,\s*podeEditar\s*=\s*false\s*)(\}\s*\)\s*\{)',
    lambda m: m.group(1) + ', abaInicial = "inicio" ' + m.group(2),
    "Assinatura ControleClinica"
)
controle = unico(
    controle,
    r'(const\s*\[\s*aba\s*,\s*setAba\s*\]\s*=\s*useState\()"inicio"(\s*\)\s*;)',
    lambda m: m.group(1) + 'abaInicial' + m.group(2),
    "Estado aba ControleClinica"
)

# CSS específico e responsivo: sino não desaparece no celular, ao contrário do símbolo antigo.
if marker not in css:
    css += '''
/* CUIDARE_SINO_DASHBOARD_V3 */
.welcome-card .dashboard-sino-notificacoes{
  position:relative;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:5px;flex:0 0 122px;
  width:122px;height:122px;margin-right:4px;padding:12px;
  color:#0e4334;background:#fff;border:1px solid #e8dcc1;
  box-shadow:0 0 0 8px rgba(194,155,71,.08);border-radius:50%;
  cursor:pointer;transition:transform .15s ease, background .15s ease;
}
.welcome-card .dashboard-sino-notificacoes:hover{transform:translateY(-2px);background:#f9f6ec}
.welcome-card .dashboard-sino-notificacoes:focus-visible{outline:3px solid #c29b47;outline-offset:3px}
.dashboard-sino-legenda{font-size:11px;font-weight:700;letter-spacing:.2px}
.dashboard-sino-contador{
  position:absolute;top:4px;right:1px;display:flex;align-items:center;justify-content:center;
  min-width:26px;height:26px;padding:0 5px;border-radius:16px;
  font-size:12px;font-weight:800;color:#fff;background:#a0392f;border:2px solid #fff;
}
@media (max-width:650px){
  .welcome-card .dashboard-sino-notificacoes{display:flex;flex:0 0 78px;width:78px;height:78px;margin-right:0;gap:2px;padding:6px}
  .welcome-card .dashboard-sino-notificacoes svg{width:29px;height:29px}
  .welcome-card .dashboard-sino-legenda{font-size:9px}
  .dashboard-sino-contador{top:-4px;right:-5px}
}
'''

# Apenas escreve se TODOS os pontos do projeto forem validados.
app_path.write_text(app, encoding="utf-8", newline="\n")
css_path.write_text(css, encoding="utf-8", newline="\n")
controle_path.write_text(controle, encoding="utf-8", newline="\n")
print("Sino instalado no cartao VISÃO GERAL do Dashboard, com contagem e abertura direta das Notificações.")
