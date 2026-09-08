import { useEffect, useState } from "react";
import "./Login.css";

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : `https://${window.location.hostname.replace(
        /-5173\.app\.github\.dev$/,
        "-8000.app.github.dev"
      )}`;

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

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

        if (!response.ok) {
          return;
        }

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
      return "";
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
          dados.detail ||
            "Não foi possível realizar o login."
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
    <div className="login-page">

      <div className="login-left">

        <div className="login-brand-area">

          {logoCuidare?.logo_url ? (
            <img
              src={obterLogoUrl()}
              alt="Logo da clínica"
              className="login-clinic-logo"
            />
          ) : (
            <div className="login-logo-fallback">
              C
            </div>
          )}

          <div className="login-brand-text">
            <h1>CUIDARE</h1>

            <p>
              FISIOTERAPIA E PILATES
            </p>
          </div>

          <div className="login-slogan">
            <strong>
              Gestão inteligente.
            </strong>

            <span>
              Cuidado mais humano.
            </span>
          </div>

        </div>

      </div>

      <div className="login-right">

        <div className="login-card">

          <div className="login-heading">

            <span className="login-label">
              ACESSO SEGURO
            </span>

            <h2>
              Bem-vindo ao Cuidare
            </h2>

            <p>
              Entre com suas credenciais para acessar
              o sistema da clínica.
            </p>

          </div>

          <form onSubmit={handleLogin}>

            <div className="form-group">

              <label htmlFor="email">
                Usuário ou e-mail
              </label>

              <input
                id="email"
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="username"
                autoFocus
              />

            </div>

            <div className="form-group">

              <label htmlFor="password">
                Senha
              </label>

              <input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) =>
                  setSenha(event.target.value)
                }
                autoComplete="current-password"
              />

            </div>

            {erro && (
              <div className="login-error">
                {erro}
              </div>
            )}

            <div className="login-options">

              <label className="remember">

                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(event) =>
                    setLembrar(event.target.checked)
                  }
                />

                <span>
                  Lembrar acesso
                </span>

              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  setErro(
                    "A recuperação de senha será disponibilizada em uma próxima etapa."
                  )
                }
              >
                Esqueci minha senha
              </button>

            </div>

            <button
              type="submit"
              className="login-button"
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>

            <button
              type="button"
              className="prototype-button"
              onClick={abrirPrototipo}
            >
              Abrir protótipo
            </button>

          </form>

          <div className="login-security">

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

          </div>

        </div>

        <div className="login-footer">
          <span>
            Cuidare • Gestão inteligente para uma clínica mais humana.
          </span>
        </div>

      </div>

    </div>
  );
}

export default Login;
