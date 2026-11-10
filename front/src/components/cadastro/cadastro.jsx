
import { useState, useEffect, useRef } from "react";
import "./cadastro.css";
import {
  UserRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { cadastrarUsuario } from "../../api";

export default function Cadastro({ onVoltar, onCadastrar }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
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

  async function handleCadastrar(event) {
    event.preventDefault();

    if (carregando) return;

    setErro("");

    if (!nome || !email || !senha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setCarregando(true);

      const resultado = await cadastrarUsuario({ nome, email, senha });

      if (resultado.usuario) {
        localStorage.setItem("usuario", JSON.stringify(resultado.usuario));

        if (resultado.token) {
          localStorage.setItem("token", resultado.token);
        }

        onCadastrar(resultado.usuario);
      } else {
        setErro(
          resultado.erro ||
            resultado.mensagem ||
            "Cadastro feito, mas o usuário não foi retornado pelo servidor."
        );
      }
    } catch (error) {
      setErro(error.message || "Erro inesperado ao cadastrar.");
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
        </div>

        <div className="right-panel">
          <form className="form-card zoom-in" onSubmit={handleCadastrar}>
            <h2>Criar conta</h2>
            <p>Cadastre-se para começar.</p>

            {erro && <div className="erro-box">{erro}</div>}

            <div className="input-group">
              <span className="input-icon">
                <UserRound size={17} strokeWidth={2} />
              </span>
              <input
                type="text"
                placeholder="Seu nome"
                autoComplete="name"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <span className="input-icon">
                <Mail size={17} strokeWidth={2} />
              </span>
              <input
                type="email"
                placeholder="Seu email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <span className="input-icon">
                <Lock size={17} strokeWidth={2} />
              </span>
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Senha"
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
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

            <div className="input-group">
              <span className="input-icon">
                <Lock size={17} strokeWidth={2} />
              </span>
              <input
                type={mostrarConfirmar ? "text" : "password"}
                placeholder="Confirmar senha"
                autoComplete="new-password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="com-toggle"
                required
              />
              <button
                type="button"
                className="toggle-senha"
                onClick={() => setMostrarConfirmar((v) => !v)}
                aria-label={mostrarConfirmar ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarConfirmar ? (
                  <EyeOff size={17} strokeWidth={2} />
                ) : (
                  <Eye size={17} strokeWidth={2} />
                )}
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={carregando}>
              {carregando ? (
                "Cadastrando..."
              ) : (
                <>
                  <UserPlus size={17} strokeWidth={2.2} />
                  Cadastrar
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
              <p>Já tem uma conta?</p>

              <button type="button" className="link-btn" onClick={onVoltar}>
                Entrar
                <ArrowRight size={16} strokeWidth={2.4} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
