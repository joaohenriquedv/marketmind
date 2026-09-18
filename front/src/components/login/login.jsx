
import { useState } from "react";
import "./login.css";
import { loginUsuario } from "../../api";

function Login({ onNavegar, onIrParaCadastro }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    if (carregando) return;

    setErro("");
    setCarregando(true);

    try {
      const resposta = await loginUsuario({
        email: email.trim(),
        senha
      });

      if (!resposta.token || !resposta.usuario) {
        throw new Error(
          "O servidor não retornou os dados necessários para o login."
        );
      }

      // Salva o token
      localStorage.setItem(
        "token",
        resposta.token
      );

      // Salva o usuário
      localStorage.setItem(
        "usuario",
        JSON.stringify(resposta.usuario)
      );

      // Redireciona de acordo com o tipo
      if (resposta.usuario.tipo === "admin") {
        onNavegar("admin");
      } else {
        onNavegar("principal");
      }

    } catch (error) {
      console.error("Erro no login:", error);

      setErro(
        error.message ||
        "Não foi possível fazer login."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="page">
      <div className="login-container">
        <div className="left-panel">
          <h1 className="logo fade-down">
            Market<span>Mind</span>
          </h1>

          <div className="hero-text fade-up">
            <h2>
              Bem-vindo de volta.
              <br />
              <span>Continue reposicionando seu negócio.</span>
            </h2>
          </div>

          <div className="highlight-box fade-up delay-2">
            <h3>
              Acompanhe seus números.
              <br />
              <span>Decida com direção.</span>
            </h3>
          </div>
        </div>

        <div className="right-panel">
          <form className="form-card zoom-in" onSubmit={handleLogin}>
            <h2>Entrar</h2>
            <p>Acesse sua conta para continuar.</p>

            {erro && <div className="erro-box">{erro}</div>}

            <div className="input-group">
              <span className="input-icon">✉</span>
              <input
                id="email"
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                id="senha"
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>

            <div className="divider">
              <span>ou</span>
            </div>

            <button type="button" className="google-btn">
              <span className="google-icon">G</span>
              Google
            </button>

            <div className="signup-text">
              <p>Ainda não tem uma conta?</p>

              <button
                type="button"
                className="link-btn"
                onClick={() => onIrParaCadastro && onIrParaCadastro()}
              >
                Criar conta →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
