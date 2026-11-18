
import { useEffect, useState } from "react";
import { ArrowLeft, Wrench } from "lucide-react";
import "./RecuperarSenha.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOLDOWN_SEGUNDOS = 60;

/* ============================================================
   true  -> o formulário aparece normal, mas ao confirmar mostra
            o aviso de manutenção e NÃO chama a API
   false -> fluxo real de recuperação por e-mail
   ============================================================ */
const MANUTENCAO = true;

const TEXTO_MANUTENCAO =
  "O envio de e-mails de recuperação está temporariamente desativado enquanto finalizamos a configuração do serviço. Tente novamente mais tarde ou fale com o suporte informando o e-mail da sua conta.";

export default function RecuperarSenha({ onVoltar, onRecuperarSenha }) {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function enviar(valorEmail) {
    setErro("");
    setEnviando(true);
    try {
      await onRecuperarSenha(valorEmail);
      setEnviado(true);
      setCooldown(COOLDOWN_SEGUNDOS);
    } catch (e) {
      setErro(e?.message || "Não foi possível enviar o e-mail. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const valor = email.trim();
    setErro("");
    setAviso("");

    if (!valor) return setErro("Informe o e-mail cadastrado.");
    if (!EMAIL_REGEX.test(valor)) return setErro("Informe um e-mail válido.");

    if (MANUTENCAO) {
      setAviso(TEXTO_MANUTENCAO);
      return;
    }

    if (typeof onRecuperarSenha !== "function") {
      setAviso(TEXTO_MANUTENCAO);
      return;
    }

    enviar(valor);
  }

  function handleReenviar() {
    if (cooldown > 0 || enviando) return;
    enviar(email.trim());
  }

  const emailMascarado = email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) =>
    a + "*".repeat(Math.min(b.length, 6)) + c
  );

  return (
    <div className="recuperar-tela">
      <div className="recuperar-card">
        <div className="recuperar-topo">
          <button type="button" className="recuperar-voltar" onClick={onVoltar}>
            <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" />
            Voltar para o login
          </button>
        </div>

        {!enviado ? (
          <>
            <h1 className="recuperar-titulo">Recuperar senha</h1>
            <p className="recuperar-texto">
              Informe o e-mail cadastrado na sua conta. Enviaremos um link para
              você criar uma nova senha.
            </p>

            <form className="recuperar-form" onSubmit={handleSubmit} noValidate>
              <label className="recuperar-label" htmlFor="recuperar-email">
                E-mail
              </label>
              <input
                id="recuperar-email"
                className={`recuperar-input ${
                  erro ? "recuperar-input-erro" : ""
                }`}
                type="email"
                name="email"
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (erro) setErro("");
                  if (aviso) setAviso("");
                }}
                disabled={enviando}
              />

              {erro && (
                <p className="recuperar-erro" role="alert">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                className="recuperar-botao"
                disabled={enviando}
              >
                {enviando ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>

            {aviso && (
              <div className="recuperar-aviso" role="alert" aria-live="polite">
                <Wrench
                  className="recuperar-aviso-icone"
                  size={17}
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
                <div>
                  <p className="recuperar-aviso-titulo">
                    Serviço indisponível no momento
                  </p>
                  <p className="recuperar-aviso-texto">{aviso}</p>
                </div>
              </div>
            )}

            <p className="recuperar-ajuda">
              Lembrou a senha?{" "}
              <button type="button" className="recuperar-link" onClick={onVoltar}>
                Fazer login
              </button>
            </p>
          </>
        ) : (
          <>
            <div className="recuperar-icone" aria-hidden="true">✓</div>
            <h1 className="recuperar-titulo">Verifique seu e-mail</h1>
            <p className="recuperar-texto">
              Se <strong>{emailMascarado}</strong> estiver cadastrado, o link de
              recuperação chegará em instantes.
            </p>
            <p className="recuperar-texto recuperar-texto-pequeno">
              Não encontrou? Olhe a caixa de spam. O link expira em 30 minutos e
              só pode ser usado uma vez.
            </p>

            <button
              type="button"
              className="recuperar-botao recuperar-botao-claro"
              onClick={handleReenviar}
              disabled={cooldown > 0 || enviando}
            >
              {cooldown > 0
                ? `Reenviar em ${cooldown}s`
                : enviando
                ? "Enviando..."
                : "Reenviar e-mail"}
            </button>

            {erro && (
              <p className="recuperar-erro" role="alert">{erro}</p>
            )}

            <p className="recuperar-ajuda">
              <button type="button" className="recuperar-link" onClick={onVoltar}>
                Voltar para o login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
