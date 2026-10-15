"""CUIDARE_AGENDA_ATALHOS_V3

Ativa os cinco indicadores da Agenda como atalhos de filtragem.
Atualizacao estritamente do frontend, sem alterar dados ou backend.
"""
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path("/workspaces/cuidare")
REF_ANTERIOR = "08be8786cde3abc6584c2ac23f570596073aa443"
REF_NOVO = "3f287cad327326315e75cf1c84efad1f329242e6"
MARCA_V2 = "CUIDARE_AGENDA_INTELIGENTE_V2"
MARCA_V3 = "CUIDARE_AGENDA_ATALHOS_V3"

AGENDA = ROOT / "cuidare/src/pages/Agenda.jsx"
RELATIVOS = (
    "cuidare/src/components/PainelAgendaInteligente.jsx",
    "cuidare/src/components/PainelAgendaInteligente.css",
)

def baixar(ref, caminho):
    url = f"https://raw.githubusercontent.com/daison-alt/cuidare/{ref}/{caminho}"
    req = Request(url, headers={"User-Agent": "cuidare-agenda-installer"})
    try:
        with urlopen(req, timeout=30) as response:
            return response.read().decode("utf-8")
    except Exception as exc:
        raise SystemExit(f"Nao foi possivel baixar {caminho}: {exc}. Nada foi modificado.")

if not AGENDA.is_file():
    raise SystemExit("Nao foi encontrada a Agenda do Codespaces. Nenhum arquivo alterado.")

agenda = AGENDA.read_text(encoding="utf-8")
if MARCA_V2 not in agenda:
    raise SystemExit("A Agenda Inteligente V2 precisa estar instalada antes. Nada foi alterado.")

# Valida os dois componentes e todas as ancoras antes de escrever.
downloads = {}
for relativo in RELATIVOS:
    destino = ROOT / relativo
    if not destino.is_file():
        raise SystemExit(f"Arquivo ausente: {relativo}. Nada foi modificado.")
    conteudo_antigo = baixar(REF_ANTERIOR, relativo)
    conteudo_novo = baixar(REF_NOVO, relativo)
    local = destino.read_text(encoding="utf-8")
    if local not in (conteudo_antigo, conteudo_novo):
        raise SystemExit(f"{relativo} foi personalizado. Nenhum arquivo foi alterado.")
    downloads[destino] = conteudo_novo

if MARCA_V3 in agenda:
    if all(p.read_text(encoding="utf-8") == valor for p, valor in downloads.items()):
        print("✅ Atalhos da Agenda Inteligente ja estao ativados.")
        raise SystemExit(0)
    raise SystemExit("Instalacao parcial. Envie esta mensagem antes de continuar.")

antigo = '      if (filtroStatus !== "todos" && item.status !== filtroStatus) return false;'
novo = '''      // CUIDARE_AGENDA_ATALHOS_V3
      if (filtroStatus === "agendados_confirmados") {
        if (!["agendado", "confirmado"].includes(item.status)) return false;
      } else if (filtroStatus !== "todos" && item.status !== filtroStatus) {
        return false;
      }'''

if agenda.count(antigo) != 1:
    raise SystemExit("Filtro da Agenda diferente do esperado. Nenhum arquivo alterado.")

agenda = agenda.replace(antigo, novo, 1)

# Escreve os componentes primeiro, ativando por ultimo o filtro na Agenda.
for destino, conteudo in downloads.items():
    if destino.read_text(encoding="utf-8") != conteudo:
        destino.write_text(conteudo, encoding="utf-8")

AGENDA.write_text(agenda, encoding="utf-8")

print("✅ Cinco atalhos do resumo da Agenda ativados.")
print("✅ Um clique filtra; segundo clique volta a exibir todos.")
print("✅ Agendados e confirmados aparecem juntos no primeiro atalho.")
print("✅ Busca e filtro de modalidade continuam disponiveis.")
print("✅ Sem alteracoes na agenda salva, nas reservas ou no financeiro.")
print("Execute: cd /workspaces/cuidare/cuidare && npm run build")
