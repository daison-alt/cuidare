import { useErro } from "./components/avisos";
import { useEffect, useState } from "react";
import "./Login.css";
import { API_URL } from "./config";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useErro();
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [logoCuidare, setLogoCuidare] = useState(null);
  const [logoVersao, setLogoVersao] = useState(Date.now());

  useEffect(() => {
    const emailSalvo = localStorage.getItem("cuidare_email");

    if (emailSalvo) {
      setEmail(emailSalvo);
      setLembrar(true);
    }
  }, []);

  useEffect(() => {
    async function carregarLogo() {
      try {
        const response = await fetch(
          `${API_URL}/configuracoes/identidade`
        );

        if (!response.ok) return;

        const data = await response.json();

        if (data.logo_nome && data.logo_url) {
          setLogoCuidare(data);
          setLogoVersao(Date.now());
        }
      } catch (error) {
        console.error("Erro ao carregar logo:", error);
      }
    }

    carregarLogo();
  }, []);

  function obterLogoUrl() {
    if (!logoCuidare?.logo_url) {
      return "/logo-cuidare-login.png";
    }

    return `${API_URL}${logoCuidare.logo_url}?v=${logoVersao}`;
  }

  async function handleLogin(event) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      if (!email.trim() || !senha) {
        setErro("Informe o e-mail e a senha.");
        return;
      }

      const resposta = await fetch(
        `${API_URL}/auth/login?email=${encodeURIComponent(
          email.trim()
        )}&senha=${encodeURIComponent(senha)}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(
          dados.detail || "Não foi possível realizar o login."
        );
        return;
      }

      localStorage.setItem(
        "cuidare_token",
        dados.access_token
      );

      localStorage.setItem(
        "cuidare_usuario",
        JSON.stringify(dados.usuario)
      );

      if (lembrar) {
        localStorage.setItem(
          "cuidare_email",
          email.trim()
        );
      } else {
        localStorage.removeItem("cuidare_email");
      }

      onLogin(dados.usuario);
    } catch (error) {
      console.error("Erro ao realizar login:", error);

      setErro(
        "Não foi possível conectar ao servidor. Verifique se a API está funcionando."
      );
    } finally {
      setCarregando(false);
    }
  }

  function abrirPrototipo() {
    window.dispatchEvent(
      new CustomEvent("cuidare-abrir-prototipo")
    );
  }

  return (
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
  );
}

export default Login;
