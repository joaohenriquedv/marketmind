
import { useState, useEffect, useRef } from "react";
import "./login.css";
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight } from "lucide-react";
import { loginUsuario } from "../../api";

function Login({ onNavegar, onIrParaCadastro }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const pageRef = useRef(null);

  /* Brilho que segue o mouse */
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    function mover(evento) {
      const caixa = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${evento.clientX - caixa.left}px`);
      el.style.setProperty("--my", `${evento.clientY - caixa.top}px`);
    }

    el.addEventListener("mousemove", mover);
    return () => el.removeEventListener("mousemove", mover);
  }, []);

  async function handleLogin(event) {
    event.preventDefault();

    if (carregando) return;

    setErro("");
    setCarregando(true);

    try {
      const resposta = await loginUsuario({
        email: email.trim(),
        senha,
      });

      if (!resposta.token || !resposta.usuario) {
        throw new Error(
          "O servidor não retornou os dados necessários para o login."
        );
      }

      localStorage.setItem("token", resposta.token);
      localStorage.setItem("usuario", JSON.stringify(resposta.usuario));

      if (resposta.usuario.tipo === "admin") {
        onNavegar("admin");
      } else {
        onNavegar("principal");
      }
    } catch (error) {
      setErro(error.message || "Não foi possível fazer login.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="page" ref={pageRef}>
      <div className="bg-blobs" aria-hidden="true">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
      </div>

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
              <span className="input-icon">
                <Mail size={17} strokeWidth={2} />
              </span>
              <input
                id="email"
                type="email"
                placeholder="Digite seu e-mail"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <span className="input-icon">
                <Lock size={17} strokeWidth={2} />
              </span>
              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                className="com-toggle"
                required
              />
              <button
                type="button"
                className="toggle-senha"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? (
                  <EyeOff size={17} strokeWidth={2} />
                ) : (
                  <Eye size={17} strokeWidth={2} />
                )}
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={carregando}>
              {carregando ? (
                "Entrando..."
              ) : (
                <>
                  <LogIn size={17} strokeWidth={2.2} />
                  Entrar
                </>
              )}
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
                Criar conta
                <ArrowRight size={16} strokeWidth={2.4} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
