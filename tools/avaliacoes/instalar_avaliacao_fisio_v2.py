"""Instala ou atualiza a ficha clinica do Cuidare com 6 termos de dor.

Seguro para a versao anterior: so substitui arquivos reconhecidos.
Nao altera dados do SQLite, prontuarios, evolucoes ou agendamentos.
"""
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path("/workspaces/cuidare")
PIN_ORIGINAL = "65910f5a0e46308bd78fac57e1240272c5240d0d"
PIN_ATUAL = "976c5bf1defc2be7279e10b52b683806e25c0c5c"
INSTALADOR_ORIGINAL = "7683a87f2fcca95dc818656800a031f7e9acaf70"
MARCA = "CUIDARE_AVALIACAO_FISIO_V1"

ALVOS = [
    "backend/app/schemas/avaliacao_fisioterapeutica.py",
    "backend/app/routers/avaliacoes_fisioterapeuticas.py",
    "cuidare/src/components/AvaliacoesFisioterapeuticas.jsx",
    "cuidare/src/components/AvaliacoesFisioterapeuticas.css",
]

def baixar(ref, caminho):
    url = f"https://raw.githubusercontent.com/daison-alt/cuidare/{ref}/{caminho}"
    requisicao = Request(url, headers={"User-Agent": "cuidare-clinica"})
    with urlopen(requisicao, timeout=30) as resposta:
        return resposta.read().decode("utf-8")


if not ROOT.is_dir():
    raise SystemExit("Execute este comando no Codespaces do Cuidare.")

main = ROOT / "backend/app/main.py"
prontuario = ROOT / "cuidare/src/pages/Prontuario.jsx"
if not main.is_file() or not prontuario.is_file():
    raise SystemExit("Arquivos principais nao encontrados. Nenhuma alteracao realizada.")

marca_main = MARCA in main.read_text(encoding="utf-8")
marca_prontuario = MARCA in prontuario.read_text(encoding="utf-8")
if marca_main != marca_prontuario:
    raise SystemExit("Instalacao anterior incompleta. Pare e envie este erro ao ChatGPT.")

# Download e validacao antes de qualquer substituicao.
atualizacoes = {}
for relativo in ALVOS:
    original = baixar(PIN_ORIGINAL, relativo)
    novo = baixar(PIN_ATUAL, relativo)
    destino = ROOT / relativo
    atualizacoes[destino] = (original, novo)
    if destino.exists():
        local = destino.read_text(encoding="utf-8")
        if local not in (original, novo):
            raise SystemExit(
                f"Arquivo personalizado/diferente em {relativo}. "
                "Nenhuma alteracao realizada; revise antes de substituir."
            )
    elif marca_main:
        raise SystemExit(
            f"Falta arquivo de instalacao anterior: {relativo}. "
            "Nenhuma alteracao realizada."
        )
    if relativo.endswith(".py"):
        compile(novo, str(destino), "exec")

if not marca_main:
    # Instala a estrutura original, incluindo tabela e rota de avaliacoes.
    codigo = baixar(
        INSTALADOR_ORIGINAL,
        "tools/avaliacoes/instalar_avaliacao_fisio_v1.py"
    )
    exec(compile(codigo, "<instalar_avaliacao_fisio_v1>", "exec"), {"__name__": "__main__"})

for destino, (_, novo) in atualizacoes.items():
    if destino.read_text(encoding="utf-8") != novo:
        destino.write_text(novo, encoding="utf-8")

print("✅ Avaliacao fisioterapeutica instalada/atualizada.")
print("✅ Seis termos clinicos de dor com definicoes entre parenteses.")
print("✅ Selecao multipla; registros antigos preservados.")
print("✅ Historico da lesao e avaliacoes estatica/dinamica mantidos.")
print("✅ Nenhum prontuario, evolucao ou pagamento foi modificado.")
print("Teste: python -m compileall -q backend/app && cd cuidare && npm run build")
