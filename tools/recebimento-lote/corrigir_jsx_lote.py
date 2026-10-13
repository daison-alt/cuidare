"""Corrige a posicao do JSX do recebimento em lote, sem tocar no backend."""
from pathlib import Path
import re

arquivo = Path("/workspaces/cuidare/cuidare/src/pages/Financeiro.jsx")
if not arquivo.is_file():
    raise SystemExit("Financeiro.jsx nao encontrado. Execute no Codespaces do Cuidare.")

original = arquivo.read_text()
marca = "CUIDARE_RECEBIMENTO_LOTE_V1"
condicao = '          {aba === "receber" && visaoCobrancas === "alunos" &&'
ancora = '          <div className="financeiro-por-aluno-controles">'
if "CUIDARE_CORRECAO_JSX_LOTE_V1" in original:
    print("✅ Correcao ja aplicada.")
    raise SystemExit(0)
if marca not in original:
    raise SystemExit("Instalacao do recebimento multiplo nao encontrada. Nada alterado.")
if original.count(condicao) != 1 or original.count(ancora) != 1:
    raise SystemExit(
        "Estrutura de Financeiro.jsx diferente da esperada. Nada alterado."
    )

inicio = original.index(condicao)
fim = original.index(ancora)
if fim <= inicio or fim - inicio > 2600:
    raise SystemExit("Trechos nao estao na ordem esperada. Nada alterado.")

bloco = original[inicio:fim]
if (
    bloco.count("Receber várias parcelas") != 1
    or bloco.count('className="financeiro-lote-acesso"') != 1
    or not re.search(r"\)\}\s*$", bloco)
    or "        {aba ===" in bloco
):
    raise SystemExit("Bloco do botao diferente do esperado. Nada alterado.")

antes = original[max(0, inicio - 100):inicio]
if not re.search(r'\{aba\s*===\s*"receber"\s*&&\s*\(\s*$', antes):
    raise SystemExit(
        "Nao reconheci o contexto do JSX antigo. Nada alterado."
    )

# Move o JSX do botao para dentro da div ja aberta por {aba === "receber" && (...)}.
novo = original[:inicio] + original[fim:]
if novo.count(ancora) != 1:
    raise SystemExit("Nao consegui identificar o destino. Nada alterado.")
novo = novo.replace(
    ancora,
    ancora + "\n" + bloco.rstrip("\n") + "\n",
    1,
)
novo = novo.replace(
    ancora,
    ancora + "\n          {/* CUIDARE_CORRECAO_JSX_LOTE_V1 */}",
    1,
)
if novo.count("Receber várias parcelas") != 1:
    raise SystemExit("Correcao inconsistente. Nada alterado.")

arquivo.write_text(novo)
print("✅ JSX corrigido: botao movido para dentro do bloco Por aluno.")
print("✅ Backend, Caixa, recibos, agenda e pagamentos nao foram alterados.")
print("Execute: cd cuidare && npm run build")
