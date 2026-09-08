import re

# ---------- Login.jsx ----------
path = "src/Login.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Trocar subtítulo
old_subtitle = """            <p>
              Entre com suas credenciais para acessar
              o sistema da clínica.
            </p>"""
new_subtitle = """            <p>
              Entre com seu usuário e senha.
            </p>"""

if old_subtitle in content:
    content = content.replace(old_subtitle, new_subtitle, 1)
    print("[OK] subtitulo trocado")
else:
    print("[AVISO] subtitulo nao encontrado, verificar manualmente")

# 2. Remover o botao "Abrir prototipo" de dentro do form
old_button = """            <button
              type="button"
              className="prototype-button"
              onClick={abrirPrototipo}
            >
              Abrir protótipo
            </button>

"""
if old_button in content:
    content = content.replace(old_button, "", 1)
    print("[OK] botao antigo removido do form")
else:
    print("[AVISO] botao antigo nao encontrado, verificar manualmente")

# 3. Inserir o novo link "Abrir prototipo" logo apos o </form>
new_link_block = """</form>

          <button
            type="button"
            className="prototype-link"
            onClick={abrirPrototipo}
          >
            Abrir protótipo
          </button>"""

if "</form>" in content:
    content = content.replace("</form>", new_link_block, 1)
    print("[OK] link novo inserido apos </form>")
else:
    print("[ERRO] </form> nao encontrado")

# 4. Simplificar caixa de seguranca
old_security = """          <div className="login-security">

            <span className="security-icon">
              🔒
            </span>

            <div>
              <strong>
                Ambiente protegido
              </strong>

              <p>
                Seus dados são tratados com segurança
                e acesso restrito.
              </p>
            </div>

          </div>"""

new_security = """          <div className="login-security">
            <span className="security-icon">🔒</span>
            <span>Autenticação e permissões ficam no backend.</span>
          </div>"""

if old_security in content:
    content = content.replace(old_security, new_security, 1)
    print("[OK] caixa de seguranca simplificada")
else:
    print("[AVISO] caixa de seguranca nao encontrada, verificar manualmente")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

# ---------- Login.css ----------
path_css = "src/Login.css"
with open(path_css, "r", encoding="utf-8") as f:
    css = f.read()

# Remove .prototype-button e .prototype-button:hover
css, n1 = re.subn(r"\.prototype-button \{[^}]*\}\n\n\.prototype-button:hover \{[^}]*\}\n", "", css)
print(f"[{'OK' if n1 else 'AVISO'}] blocos .prototype-button removidos ({n1})")

# Remove .login-security, .login-security strong, .login-security p (originais)
css, n2 = re.subn(r"\.login-security \{[^}]*\}\n\n\.security-icon \{[^}]*\}\n\n\.login-security strong \{[^}]*\}\n\n\.login-security p \{[^}]*\}\n", "", css)
print(f"[{'OK' if n2 else 'AVISO'}] blocos .login-security antigos removidos ({n2})")

# Adiciona os novos blocos no final
css += """
.prototype-link {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #0e4334;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
}

.prototype-link:hover {
  text-decoration: underline;
}

.security-icon {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: #e5efe9;
  font-size: 15px;
}

.login-security {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  padding: 0;
  background: transparent;
}

.login-security span:last-child {
  color: #899690;
  font-size: 12px;
}
"""

with open(path_css, "w", encoding="utf-8") as f:
    f.write(css)

print("[OK] Login.css atualizado")
