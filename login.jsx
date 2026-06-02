import "./login.css";

export default function Login({ onEntrar, onCriarConta }) {
  return (
    <div className="page">
      <div className="login-container">

        <div className="left-panel">
          <h1 className="logo fade-down">
            Market<span>Mind</span>
          </h1>

          <div className="hero-text fade-up">
            <h2>
              Negócios mais<br />
              estratégicos.<br />
              <span>Reposicionamento<br />que gera vantagem.</span>
            </h2>
          </div>

          <div className="highlight-box fade-up delay-2">
            <h3>
              Seu negócio não precisa de mais dados.
              <br />
              <span>Precisa de direção.</span>
            </h3>
          </div>

          
        </div>

        <div className="right-panel">
          <div className="form-card zoom-in">
            <div className="form-card-header">
              <h2>Bem-vindo!</h2>
              <p>Acesse sua análise estratégica.</p>
            </div>

            <div className="input-group">
              <span className="input-icon">✉</span>
              <input type="email" placeholder="Seu email..." />
            </div>

            <div className="input-group password-group">
              <span className="input-icon">🔒</span>
              <input type="password" placeholder="Sua senha..." />
              <a href="#" className="forgot-link">Esqueceu?</a>
            </div>

            <button className="login-btn" onClick={onEntrar}>
              Entrar
            </button>

            <div className="divider">
              <span>ou</span>
            </div>

            <button className="google-btn">
              <span className="google-icon">G</span>
              Continuar com Google
            </button>

            <div className="signup-text">
              <p>Ainda não tem conta?</p>
              <button onClick={onCriarConta} className="link-btn">
                Criar conta →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}