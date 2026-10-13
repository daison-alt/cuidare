"""Aplica a nova tela de login do Cuidare sem modificar autenticação ou banco."""
from pathlib import Path

raiz = Path.cwd()
jsx = raiz / "cuidare/src/Login.jsx"
css = raiz / "cuidare/src/Login.css"

if not jsx.is_file() or not css.is_file():
    raise SystemExit("Execute na pasta /workspaces/cuidare.")

codigo = jsx.read_text()
marca = "login-ref-v2"
if marca in codigo:
    print("✅ Login com o novo design já instalado.")
    raise SystemExit(0)

antigo = '  const [carregando, setCarregando] = useState(false);'
if codigo.count(antigo) != 1:
    raise SystemExit("Login.jsx está diferente do esperado. Nada foi modificado.")

codigo = codigo.replace(
    antigo,
    antigo + '\n  const [mostrarSenha, setMostrarSenha] = useState(false);',
    1
)

inicio = codigo.find('  return (\n    <div className="login-page">')
fim = codigo.rfind('\n}\n\nexport default Login;')
if inicio < 0 or fim < inicio:
    raise SystemExit("Não localizei a estrutura do login. Nada foi modificado.")

tela = r'''  return (
    <main className="login-page login-ref-v2">
      <section className="login-left" aria-label="Cuidare — Fisioterapia e Pilates">
        <svg className="login-folhagem login-folhagem-topo" viewBox="0 0 240 280"
          fill="none" aria-hidden="true">
          <path d="M0 186C41 119 83 74 189 3" stroke="#7d8c67" strokeWidth="3" />
          <g fill="#8c9d79" fillOpacity=".52">
            <ellipse cx="24" cy="141" rx="12" ry="39" transform="rotate(-53 24 141)" />
            <ellipse cx="37" cy="103" rx="13" ry="42" transform="rotate(15 37 103)" />
            <ellipse cx="65" cy="123" rx="13" ry="41" transform="rotate(-66 65 123)" />
            <ellipse cx="88" cy="71" rx="13" ry="41" transform="rotate(20 88 71)" />
            <ellipse cx="118" cy="81" rx="13" ry="40" transform="rotate(-67 118 81)" />
            <ellipse cx="151" cy="34" rx="12" ry="39" transform="rotate(30 151 34)" />
          </g>
        </svg>
        <div className="login-gold-swoosh login-gold-swoosh-top" aria-hidden="true" />
        <div className="login-gold-swoosh login-gold-swoosh-bottom" aria-hidden="true" />
        <div className="login-left-inner">
          <div className="login-brand">
            <img
              src={obterLogoUrl()}
              alt="Logo Cuidare — Fisioterapia e Pilates"
              className="login-clinic-logo"
            />
            <p className="login-brand-slogan">CUIDAR DO SEU CORPO É CUIDAR DE VOCÊ.</p>
          </div>
          <div className="login-left-lower">
            <h2>Bem-vindo(a) ao Cuidare</h2>
            <p>Sua saúde, nosso maior cuidado.</p>
            <div className="login-services" aria-label="Serviços da Cuidare">
              <div className="login-service">
                <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="24" cy="8" r="4" />
                  <path d="M24 14v13M16 20l8 5 8-5M15 19L9 13M33 19l6-6M24 27L14 35M24 27l10 8" />
                  <path d="M4 37c4-4 11-4 17-1M44 37c-4-4-11-4-17-1M9 41c10 5 20 5 30 0" />
                </svg>
                <span>PILATES</span>
              </div>
              <div className="login-service">
                <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 4c-11 1-11 9 0 10 9 1 9 8 0 9-10 1-11 8-1 10 11 2 11 9 1 11" />
                  <path d="M27 4c11 1 11 9 0 10-9 1-9 8 0 9 10 1 11 8 1 10-11 2-11 9-1 11" />
                  <path d="M19 9h10M19 18h10M19 28h10M19 38h10" />
                </svg>
                <span>FISIOTERAPIA<br />ORTOPÉDICA</span>
              </div>
              <div className="login-service">
                <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M25 7C13 3 7 14 10 25c2 7 9 6 10 14 1 8 12 5 11-4" />
                  <path d="M19 20c0-9 15-10 16 0 0 5-2 8-7 10-4 1-5 4-4 7" />
                  <path d="M18 24c-4-9 9-13 11-5 2 6-6 5-6 10" />
                </svg>
                <span>FISIOTERAPIA<br />VESTIBULAR</span>
              </div>
              <div className="login-service">
                <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 5v21l-7 11M25 5v21l7 11M23 13l-6 5M25 13l6 5" />
                  <path d="M18 10C9 11 4 23 7 34c2 7 11 8 15 1V13M30 10c9 1 14 13 11 24-2 7-11 8-15 1V13" />
                  <path d="M11 21l9 6M37 21l-9 6" />
                </svg>
                <span>FISIOTERAPIA<br />RESPIRATÓRIA</span>
              </div>
            </div>
          </div>
        </div>
        <svg className="login-folhagem login-folhagem-base" viewBox="0 0 240 280"
          fill="none" aria-hidden="true">
          <path d="M0 186C41 119 83 74 189 3" stroke="#7d8c67" strokeWidth="3" />
          <g fill="#8c9d79" fillOpacity=".52">
            <ellipse cx="24" cy="141" rx="12" ry="39" transform="rotate(-53 24 141)" />
            <ellipse cx="37" cy="103" rx="13" ry="42" transform="rotate(15 37 103)" />
            <ellipse cx="65" cy="123" rx="13" ry="41" transform="rotate(-66 65 123)" />
            <ellipse cx="88" cy="71" rx="13" ry="41" transform="rotate(20 88 71)" />
            <ellipse cx="118" cy="81" rx="13" ry="40" transform="rotate(-67 118 81)" />
            <ellipse cx="151" cy="34" rx="12" ry="39" transform="rotate(30 151 34)" />
          </g>
        </svg>
      </section>

      <section className="login-right" aria-label="Acesso ao Cuidare">
        <div className="login-card">
          <div className="login-heading">
            <span className="login-label">ACESSO SEGURO</span>
            <h1>Bem-vindo ao Cuidare</h1>
            <div className="login-heading-rule" aria-hidden="true" />
            <p>Entre com seu usuário e senha.</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label htmlFor="email">Usuário ou e-mail</label>
              <div className="login-input-shell">
                <svg viewBox="0 0 24 24" className="login-input-icon" aria-hidden="true"
                  fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="7.5" r="3.5" />
                  <path d="M5.5 20v-2c0-3 3-5 6.5-5s6.5 2 6.5 5v2" />
                </svg>
                <input
                  id="email" type="email"
                  placeholder="Digite seu usuário ou e-mail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Senha</label>
              <div className="login-input-shell">
                <svg viewBox="0 0 24 24" className="login-input-icon" aria-hidden="true"
                  fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
                </svg>
                <input
                  id="password" type={mostrarSenha ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button type="button" className="login-password-toggle"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={mostrarSenha}
                  onClick={() => setMostrarSenha((valor) => !valor)}>
                  {mostrarSenha ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                      aria-hidden="true">
                      <path d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A11 11 0 0 1 12 5c5 0 9 3.4 10 7-0.5 1.7-1.7 3.4-3.4 4.7M6.2 6.2C4 7.7 2.5 9.7 2 12c1 3.6 5 7 10 7 1.6 0 3.1-.3 4.4-1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                      aria-hidden="true">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {erro && <div className="login-error" role="alert">{erro}</div>}

            <button type="submit" className="login-button" disabled={carregando}>
              {carregando ? "Entrando..." : "Entrar"}
              {!carregando && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="login-separator" aria-hidden="true"><span>OU</span></div>
          <div className="login-security">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true">
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
            </svg>
            <span>Acesso restrito a usuários autorizados</span>
          </div>
        </div>
      </section>
    </main>
  );'''

# Manter todo o código anterior de autenticação como está.
codigo = codigo[:inicio] + tela + codigo[fim:]

estilos = r'''/* Login Cuidare — referência premium v2. Escopo isolado. */
.login-ref-v2 {
  --login-verde: #104a38;
  --login-ouro: #c6a254;
  width: 100%;
  min-height: 100vh;
  min-height: 100svh;
  display: grid;
  grid-template-columns: 52.7% 47.3%;
  background: #fdfbf6;
  color: #114837;
  overflow-x: hidden;
}

.login-ref-v2 .login-left {
  position: relative;
  min-width: 0;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 49% 38%, rgba(255,255,248,.77), transparent 58%),
    radial-gradient(ellipse at 5% 88%, rgba(137,156,108,.22), transparent 45%),
    radial-gradient(ellipse at 98% 93%, rgba(102,127,79,.33), transparent 50%),
    #e3e7d3;
}

.login-ref-v2 .login-left-inner {
  position: relative;
  z-index: 1;
  width: min(90%, 650px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 55px 8px 42px;
}

.login-ref-v2 .login-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.login-ref-v2 .login-clinic-logo {
  display: block;
  width: min(100%, 570px);
  height: auto;
  max-height: min(49vh, 515px);
  object-fit: contain;
  object-position: center;
  mix-blend-mode: multiply;
}

.login-ref-v2 .login-brand-slogan {
  color: #13503d;
  margin: 2px 0 0;
  letter-spacing: .21em;
  text-transform: uppercase;
  font-size: clamp(9px, 1.07vw, 14px);
  text-align: center;
  line-height: 1.6;
}

.login-ref-v2 .login-left-lower {
  margin-top: clamp(28px, 5.5vh, 62px);
  color: #104d3b;
}

.login-ref-v2 .login-left-lower h2 {
  margin: 0 0 6px;
  color: #145541;
  font-size: clamp(20px, 1.8vw, 29px);
  font-weight: 700;
  letter-spacing: -.025em;
}
.login-ref-v2 .login-left-lower > p {
  margin: 0;
  color: #545e59;
  font-size: clamp(13px, 1.15vw, 18px);
}
.login-ref-v2 .login-services {
  display: grid;
  grid-template-columns: repeat(4, minmax(0,1fr));
  margin-top: clamp(22px, 4vh, 44px);
  gap: 0;
}
.login-ref-v2 .login-service {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
  min-width: 0;
  padding: 0 9px;
  color: #0e5140;
  border-right: 1px solid rgba(14, 81, 64, .48);
}
.login-ref-v2 .login-service:last-child { border-right: 0; }
.login-ref-v2 .login-service svg { width: 44px; height: 44px; }
.login-ref-v2 .login-service span {
  display: block;
  min-height: 36px;
  font-size: clamp(8px,.8vw,11px);
  line-height: 1.45;
  font-weight: 650;
  letter-spacing: .07em;
}

.login-ref-v2 .login-folhagem {
  position: absolute;
  width: clamp(120px, 19vw, 260px);
  opacity: .75;
  z-index: 0;
  pointer-events: none;
}
.login-ref-v2 .login-folhagem-topo {
  left: -30px; top: -45px;
  transform: rotate(13deg);
}
.login-ref-v2 .login-folhagem-base {
  right: -46px; bottom: -65px;
  transform: rotate(190deg);
}
.login-ref-v2 .login-gold-swoosh {
  position: absolute;
  z-index: 0; pointer-events: none;
  border-top: 2px solid rgba(178,132,44,.83);
  width: 260px;
  height: 70px;
  border-radius: 50%;
}
.login-ref-v2 .login-gold-swoosh-top {
  top: 24px; left: 145px;
  transform: rotate(-14deg);
}
.login-ref-v2 .login-gold-swoosh-bottom {
  bottom: 15px; right: 35px;
  transform: rotate(-22deg);
}

.login-ref-v2 .login-right {
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px clamp(20px, 4vw, 70px);
  background: radial-gradient(ellipse at 51% 44%, #fff 5%, #fdfbf8 80%);
}
.login-ref-v2 .login-right::after {
  content: "";
  pointer-events: none;
  position: absolute;
  right: -80px; bottom: -70px;
  width: 200px; height: 250px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(154,170,125,.17), transparent 68%);
}
.login-ref-v2 .login-card {
  position: relative;
  z-index: 1;
  width: min(100%, 540px);
  background: rgba(255,255,255,.78);
  border: 1px solid rgba(199,159,80,.48);
  border-radius: 22px;
  padding: clamp(34px, 3.7vw, 56px);
  box-shadow: 0 15px 45px rgba(53,70,53,.055);
}
.login-ref-v2 .login-heading { margin-bottom: 32px; }
.login-ref-v2 .login-label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.1px;
  color: #10503f;
  margin-bottom: 12px;
}
.login-ref-v2 .login-heading h1 {
  font-size: clamp(28px, 2.42vw, 40px);
  font-weight: 750;
  letter-spacing: -.036em;
  color: #13523f;
  margin: 0;
  line-height: 1.15;
  white-space: nowrap;
}
.login-ref-v2 .login-heading-rule {
  width: 84px;
  height: 2px;
  background: #c9a454;
  margin-top: 17px;
}
.login-ref-v2 .login-heading p {
  color: #68716e;
  font-size: 15px;
  margin: 19px 0 0;
  line-height: 1.5;
}
.login-ref-v2 .login-field { margin-bottom: 22px; }
.login-ref-v2 .login-field label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #164b3b;
  margin-bottom: 9px;
}
.login-ref-v2 .login-input-shell {
  display: flex;
  align-items: center;
  min-height: 58px;
  border: 1px solid #d5d9d5;
  border-radius: 15px;
  background: rgba(255,255,255,.96);
  transition: border-color .15s ease, box-shadow .15s ease;
}
.login-ref-v2 .login-input-shell:focus-within {
  border-color: #c3a05c;
  box-shadow: 0 0 0 3px rgba(195,160,92,.11);
}
.login-ref-v2 .login-input-icon {
  flex-shrink: 0;
  width: 20px; height: 20px;
  margin-left: 18px;
  color: #61716c;
}
.login-ref-v2 .login-input-shell input {
  flex: 1;
  min-width: 0;
  width: auto;
  background: transparent;
  height: 56px;
  padding: 0 12px 0 15px;
  border: 0;
  outline: 0;
  box-shadow: none !important;
  font-size: 14px;
  color: #273b33;
}
.login-ref-v2 .login-input-shell input::placeholder {
  color: #979d9a;
}
.login-ref-v2 .login-password-toggle {
  border: 0;
  background: transparent;
  color: #546861;
  padding: 10px 15px;
  cursor: pointer;
  line-height: 0;
}
.login-ref-v2 .login-password-toggle svg { width: 21px; height: 21px; }
.login-ref-v2 .login-password-toggle:focus-visible {
  outline: 2px solid #c29b47; outline-offset: -4px; border-radius: 8px;
}
.login-ref-v2 .login-error {
  border: 1px solid #e7bdbd;
  background: #fff4f4;
  color: #953333;
  padding: 11px 12px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 13px;
}
.login-ref-v2 .login-button {
  width: 100%;
  height: 59px;
  margin-top: 11px;
  border: 0; border-radius: 14px;
  background: linear-gradient(115deg,#0f4b39,#12664d,#0c4d39);
  box-shadow: 0 8px 22px rgba(15,75,57,.13);
  color: #fff;
  font-size: 20px;
  font-weight: 720;
  display: flex; align-items: center; justify-content: center;
  gap: 17px; cursor: pointer;
}
.login-ref-v2 .login-button:hover:not(:disabled) {
  filter: brightness(1.07);
}
.login-ref-v2 .login-button:disabled { opacity: .65; cursor: wait; }
.login-ref-v2 .login-button span { font-size: 27px; font-weight: 400; }

.login-ref-v2 .login-separator {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 35px 0 27px;
  color: #777f79;
  font-size: 13px;
  justify-content: center;
}
.login-ref-v2 .login-separator::before,
.login-ref-v2 .login-separator::after {
  content: ""; flex: 1; height: 1px; background: #e3e7e1;
}
.login-ref-v2 .login-security {
  display: flex; align-items: center; justify-content: center;
  gap: 9px; color: #909794; font-size: 12px; text-align: center;
}
.login-ref-v2 .login-security svg { width: 16px; height: 16px; }

@media (max-width: 1250px) {
  .login-ref-v2 .login-card { padding: 32px 29px; }
  .login-ref-v2 .login-heading h1 { white-space: normal; font-size: 31px; }
  .login-ref-v2 .login-left-inner { width: 94%; }
  .login-ref-v2 .login-clinic-logo { max-height: 43vh; }
  .login-ref-v2 .login-left-lower { margin-top: 20px; }
  .login-ref-v2 .login-service { padding: 0 5px; }
}
@media (max-width: 850px) {
  .login-ref-v2 { grid-template-columns: 1fr; }
  .login-ref-v2 .login-left {
    min-height: 0;
    padding: 25px 10px;
  }
  .login-ref-v2 .login-left-inner {
    padding: 10px 8px; width: min(90%,580px);
  }
  .login-ref-v2 .login-clinic-logo {
    max-height: 260px;
    width: min(100%, 330px);
  }
  .login-ref-v2 .login-left-lower { margin-top: 6px; }
  .login-ref-v2 .login-services { margin-top: 20px; }
  .login-ref-v2 .login-right { padding: 30px 20px 55px; }
  .login-ref-v2 .login-card { width: min(100%,550px); }
}
@media (max-width: 450px) {
  .login-ref-v2 .login-left-inner { width: 100%; }
  .login-ref-v2 .login-left-lower h2 { font-size: 20px; }
  .login-ref-v2 .login-left-lower > p { font-size: 13px; }
  .login-ref-v2 .login-service svg { width: 31px; height: 31px; }
  .login-ref-v2 .login-service span { font-size: 8px; }
  .login-ref-v2 .login-card { padding: 29px 22px; }
  .login-ref-v2 .login-heading h1 { font-size: 29px; }
  .login-ref-v2 .login-brand-slogan { font-size: 8px; }
}
@media (max-height: 760px) and (min-width: 851px) {
  .login-ref-v2 .login-left-inner { padding-top: 26px; padding-bottom: 20px; }
  .login-ref-v2 .login-clinic-logo { max-height: 39vh; }
  .login-ref-v2 .login-left-lower { margin-top: 12px; }
  .login-ref-v2 .login-services { margin-top: 18px; }
  .login-ref-v2 .login-service svg { width: 34px; height: 34px; }
  .login-ref-v2 .login-card { padding-top: 28px; padding-bottom: 26px; }
  .login-ref-v2 .login-heading { margin-bottom: 18px; }
  .login-ref-v2 .login-separator { margin: 21px 0 17px; }
}
'''

# Validar textos antes da gravação; autenticador handleLogin foi preservado.
if codigo.count("async function handleLogin") != 1 or codigo.count("onSubmit={handleLogin}") != 1:
    raise SystemExit("Validação do formulário falhou. Nada foi modificado.")

jsx.write_text(codigo)
css.write_text(estilos)
print("✅ Tela de login redesenhada conforme a referência.")
print("✅ Logo centralizado, identidade verde/dourada e quatro especialidades.")
print("✅ Ícones dos campos e botão para visualizar senha.")
print("✅ Login, token, autenticação e banco preservados.")
print("Próximo passo: cd cuidare && npm run build")
