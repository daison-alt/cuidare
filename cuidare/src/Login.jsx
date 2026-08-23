import { useState } from "react";
import "./Login.css";

const API_URL =
  "https://humble-waddle-97x5v4vpg7j73ppxq-8000.app.github.dev";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

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

      // Guarda o token para as próximas requisições da aplicação
      localStorage.setItem(
        "cuidare_token",
        dados.access_token
      );

      // Guarda os dados do usuário logado
      localStorage.setItem(
        "cuidare_usuario",
        JSON.stringify(dados.usuario)
      );

      // Se o usuário marcou "Lembrar acesso",
      // guarda o e-mail no navegador.
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

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-brand">
          <div className="login-logo-placeholder">
            C
          </div>

          <h1>CUIDARE</h1>

          <p>
            FISIOTERAPIA E PILATES
          </p>
        </div>

        <div className="login-card">

          <div className="login-heading">

            <span>
              ACESSO AO SISTEMA
            </span>

            <h2>
              Bem-vindo ao Cuidare
            </h2>

            <p>
              Entre com suas credenciais para acessar o sistema.
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
              {carregando
                ? "Entrando..."
                : "Entrar"}
            </button>

          </form>

        </div>

        <div className="login-footer">

          <span>
            Cuidare
          </span>

          <p>
            Gestão inteligente para uma clínica mais humana.
          </p>

        </div>

      </div>
    </div>
  );
}

export default Login;