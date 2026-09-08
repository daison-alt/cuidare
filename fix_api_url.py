import re

FILES_SRC = ["cuidare/src/App.jsx", "cuidare/src/Login.jsx"]

FILES_PAGES = [
    "cuidare/src/pages/EditarAgendamento.jsx",
    "cuidare/src/pages/Campanhas.jsx",
    "cuidare/src/pages/ConfiguracaoFiscal.jsx",
    "cuidare/src/pages/Financeiro.jsx",
    "cuidare/src/pages/GestaoFiscal.jsx",
    "cuidare/src/pages/NovoPaciente.jsx",
    "cuidare/src/pages/VisualizarPaciente.jsx",
    "cuidare/src/pages/AlunosPilates.jsx",
    "cuidare/src/pages/Estoque.jsx",
    "cuidare/src/pages/Pacientes.jsx",
    "cuidare/src/pages/Agenda.jsx",
    "cuidare/src/pages/VisualizarAgendamento.jsx",
    "cuidare/src/pages/ContasPagar.jsx",
    "cuidare/src/pages/ContasReceber.jsx",
    "cuidare/src/pages/Caixa.jsx",
    "cuidare/src/pages/EditarPaciente.jsx",
    "cuidare/src/pages/Prontuario.jsx",
    "cuidare/src/pages/Servicos.jsx",
    "cuidare/src/pages/PlanosPilates.jsx",
    "cuidare/src/pages/NovoAgendamento.jsx",
]

pattern = re.compile(r"const API_URL[\s\S]*?;\n?")

def process(path, import_path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if "const API_URL" not in content:
        print(f"[PULEI] {path} -- nao tem 'const API_URL'")
        return

    new_content, n = pattern.subn("", content, count=1)
    if n == 0:
        print(f"[ERRO] {path} -- regex nao casou, checar manualmente")
        return

    import_line = f'import {{ API_URL }} from "{import_path}";'
    if import_line not in new_content:
        lines = new_content.split("\n")
        last_import_idx = 0
        for i, line in enumerate(lines):
            if line.strip().startswith("import "):
                last_import_idx = i
        lines.insert(last_import_idx + 1, import_line)
        new_content = "\n".join(lines)

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"[OK] {path}")

for f in FILES_SRC:
    process(f, "./config")

for f in FILES_PAGES:
    process(f, "../config")
