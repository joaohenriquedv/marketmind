import "./cadastro.css";

export default function Cadastro({ onVoltar, onCadastrar }) {
  return (
    <div className="page">
      <div className="login-container">

        <div className="left-panel">
          <h1 className="logo fade-down">
            Market<span>Mind</span>
          </h1>

          <div className="hero-text fade-up">
            <h2>
              Crie sua conta.
              <br />
              <span>Comece a reposicionar seu negócio.</span>
            </h2>
          </div>

          <div className="highlight-box fade-up delay-2">
            <h3>
              Sua empresa não precisa apenas vender mais.
              <br />
              <span>Precisa crescer com direção.</span>
            </h3>
          </div>

          <div className="stats fade-up delay-3">
            <div>
              <h3>+1.200</h3>
              <p>Análises</p>
            </div>
            <div>
              <h3>98%</h3>
              <p>Precisão</p>
            </div>
            <div>
              <h3>+37%</h3>
              <p>Crescimento</p>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="form-card zoom-in">
            <h2>Criar conta</h2>
            <p>Cadastre-se para começar.</p>

            <div className="input-group">
              <span className="input-icon">👤</span>
              <input type="text" placeholder="Seu nome..." />
            </div>

            <div className="input-group">
              <span className="input-icon">✉</span>
              <input type="email" placeholder="Seu email..." />
            </div>

            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input type="password" placeholder="Senha..." />
            </div>

            <div className="input-group">
              <span className="input-icon">🔐</span>
              <input type="password" placeholder="Confirmar senha..." />
            </div>

            <button className="login-btn" onClick={onCadastrar}>Cadastrar</button>

            <div className="divider">
              <span>ou</span>
            </div>

            <button className="google-btn">
              <span className="google-icon">G</span>
              Google
            </button>

            <div className="signup-text">
              <p>Já tem uma conta?</p>
              <button onClick={onVoltar}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#e3812c',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}
              >
                Entrar →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}