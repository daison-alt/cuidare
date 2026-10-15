"""Instalador seguro da ficha de avaliacao do Cuidare.

Execute na raiz /workspaces/cuidare. Baixa arquivos de um commit imutavel,
valida as ancoras antes de modificar o projeto e nao altera dados existentes.
"""
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path("/workspaces/cuidare")
REF = "65910f5a0e46308bd78fac57e1240272c5240d0d"
MARK = "CUIDARE_AVALIACAO_FISIO_V1"
ORIGEM = f"https://raw.githubusercontent.com/daison-alt/cuidare/{REF}"
NOVOS = [
    "backend/app/models/avaliacao_fisioterapeutica.py",
    "backend/app/schemas/avaliacao_fisioterapeutica.py",
    "backend/app/routers/avaliacoes_fisioterapeuticas.py",
    "cuidare/src/components/AvaliacoesFisioterapeuticas.jsx",
    "cuidare/src/components/AvaliacoesFisioterapeuticas.css",
]
MAIN = ROOT / "backend/app/main.py"
PRONTUARIO = ROOT / "cuidare/src/pages/Prontuario.jsx"

if not MAIN.is_file() or not PRONTUARIO.is_file():
    raise SystemExit("Execute este instalador no Codespaces do Cuidare; arquivos principais ausentes.")

main = MAIN.read_text(encoding="utf-8")
prontuario = PRONTUARIO.read_text(encoding="utf-8")

if MARK in main and MARK in prontuario:
    print("✅ Ficha de avaliacao ja instalada.")
    raise SystemExit(0)
if MARK in main or MARK in prontuario:
    raise SystemExit("Instalacao parcial detectada. Nenhum arquivo modificado.")

def trocar(texto, antes, depois, arquivo):
    ocorrencias = texto.count(antes)
    if ocorrencias != 1:
        raise SystemExit(f"{arquivo}: estrutura inesperada ({ocorrencias} correspondencias). Nenhum arquivo modificado.")
    return texto.replace(antes, depois, 1)

# Prepara patches sem modificar nenhum arquivo.
main = trocar(
    main,
    "from app.models.prontuario import Prontuario",
    "from app.models.prontuario import Prontuario\n"
    "from app.models.avaliacao_fisioterapeutica import AvaliacaoFisioterapeutica  # " + MARK,
    "main.py",
)
main = trocar(
    main,
    "from app.routers.prontuarios import router as prontuarios_router",
    "from app.routers.prontuarios import router as prontuarios_router\n"
    "from app.routers.avaliacoes_fisioterapeuticas import router as avaliacoes_fisioterapeuticas_router",
    "main.py",
)
main = trocar(
    main,
    "app.include_router(prontuarios_router)",
    "app.include_router(prontuarios_router)\n"
    "app.include_router(avaliacoes_fisioterapeuticas_router)",
    "main.py",
)
prontuario = trocar(
    prontuario,
    'import { API_URL } from "../config";',
    'import { API_URL } from "../config";\n'
    'import AvaliacoesFisioterapeuticas from "../components/AvaliacoesFisioterapeuticas"; // ' + MARK,
    "Prontuario.jsx",
)
prontuario = trocar(
    prontuario,
    '        <div className="prontuario-main">',
    '        <div className="prontuario-main">\n'
    '          <AvaliacoesFisioterapeuticas prontuarioId={prontuario?.id} />',
    "Prontuario.jsx",
)

# Valida downloads completos e evita sobrescrever arquivos locais existentes.
conteudos = {}
for rel in NOVOS:
    destino = ROOT / rel
    try:
        req = Request(f"{ORIGEM}/{rel}", headers={"User-Agent": "cuidare-installer"})
        with urlopen(req, timeout=25) as resposta:
            conteudo = resposta.read().decode("utf-8")
    except Exception as exc:
        raise SystemExit(f"Erro ao baixar {rel}: {exc}. Nenhum arquivo modificado.")
    if len(conteudo) < 200:
        raise SystemExit(f"Arquivo inesperado: {rel}. Nenhum arquivo modificado.")
    if destino.exists() and destino.read_text(encoding="utf-8") != conteudo:
        raise SystemExit(f"Arquivo local diferente: {rel}. Nenhum arquivo modificado.")
    if rel.endswith(".py"):
        compile(conteudo, str(destino), "exec")
    conteudos[destino] = conteudo

compile(main, str(MAIN), "exec")

# Arquivos novos antes de ativar imports no backend e no frontend.
for destino, conteudo in conteudos.items():
    destino.parent.mkdir(parents=True, exist_ok=True)
    if not destino.exists():
        destino.write_text(conteudo, encoding="utf-8")

MAIN.write_text(main, encoding="utf-8")
PRONTUARIO.write_text(prontuario, encoding="utf-8")

print("✅ Nova ficha de avaliacao inicial e reavaliacao instalada.")
print("✅ Historico da lesao na Anamnese.")
print("✅ 6 caracteristicas da dor com escolha unica.")
print("✅ Avaliacoes estatica e dinamica no Exame Fisico.")
print("✅ Registros clinicos preservados por historico (sem alterar evolucoes).")
print("✅ Permissoes: apenas Administrador ou Fisioterapeuta.")
print("✅ Tabela nova criada automaticamente ao reiniciar a API.")
print("Execute: cd /workspaces/cuidare && python -m compileall -q backend/app && cd cuidare && npm run build")
