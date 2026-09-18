
import { useState } from "react";
import "./cadastro.css";
import { cadastrarUsuario } from "../../api";

export default function Cadastro({ onVoltar, onCadastrar }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleCadastrar() {
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

      const resultado = await cadastrarUsuario({
        nome,
        email,
        senha,
      });

      console.log("RESULTADO CADASTRO:", resultado);

      if (resultado.usuario) {
        localStorage.setItem(
          "usuario",
          JSON.stringify(resultado.usuario)
        );

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
      console.log("ERRO NO CADASTRO:", error);
      setErro(error.message || "Erro inesperado ao cadastrar.");
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
          <div className="form-card zoom-in">
            <h2>Criar conta</h2>
            <p>Cadastre-se para começar.</p>

            {erro && <div className="erro-box">{erro}</div>}

            <div className="input-group">
              <span className="input-icon">👤</span>
              <input
                type="text"
                placeholder="Seu nome..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="input-group">
              <span className="input-icon">✉</span>
              <input
                type="email"
                placeholder="Seu email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                placeholder="Senha..."
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <div className="input-group">
              <span className="input-icon">🔐</span>
              <input
                type="password"
                placeholder="Confirmar senha..."
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
            </div>

            <button
              className="login-btn"
              onClick={handleCadastrar}
              disabled={carregando}
            >
              {carregando ? "Cadastrando..." : "Cadastrar"}
            </button>

            <div className="divider">
              <span>ou</span>
            </div>

            <button className="google-btn">
              <span className="google-icon">G</span>
              Google
            </button>

            <div className="signup-text">
              <p>Já tem uma conta?</p>

              <button
                onClick={onVoltar}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#e3812c",
                  fontWeight: 700,
                  fontSize: "1rem",
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
