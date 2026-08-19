import "./Login.css";

function Login() {
  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-brand">
          <div className="login-logo-placeholder">
            C
          </div>

          <h1>CUIDARE</h1>
          <p>FISIOTERAPIA E PILATES</p>
        </div>

        <div className="login-card">
          <div className="login-heading">
            <span>ACESSO AO SISTEMA</span>
            <h2>Bem-vindo ao Cuidare</h2>
            <p>
              Entre com suas credenciais para acessar o sistema.
            </p>
          </div>

          <form>
            <div className="form-group">
              <label htmlFor="email">Usuário ou e-mail</label>

              <input
                id="email"
                type="text"
                placeholder="Digite seu usuário ou e-mail"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>

              <input
                id="password"
                type="password"
                placeholder="Digite sua senha"
              />
            </div>

            <div className="login-options">
              <label className="remember">
                <input type="checkbox" />
                <span>Lembrar acesso</span>
              </label>

              <button
                type="button"
                className="forgot-password"
              >
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              className="login-button"
            >
              Entrar
            </button>
          </form>
        </div>

        <div className="login-footer">
          <span>Cuidare</span>
          <p>Gestão inteligente para uma clínica mais humana.</p>
        </div>

      </div>
    </div>
  );
}

export default Login;