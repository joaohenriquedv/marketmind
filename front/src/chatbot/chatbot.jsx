import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { X, Send, Sparkles } from "lucide-react";
import "./chatbot.css";

const CHAT_URL = import.meta.env.VITE_CHAT_URL || "http://localhost:3002";
const AVATAR = "/chatbot.png"; // precisa estar em front/public/chatbot.png

const MENSAGEM_INICIAL = {
  tipo: "bot",
  texto:
    "Olá! Sou o MarketMind Bot. Posso falar sobre seus produtos, margem, receita e tendências do seu negócio. O que você quer analisar?",
};

/* Avatar com fallback: se /chatbot.png não existir, mostra o ícone */
function Avatar({ classe, falhou, onErro }) {
  if (falhou) {
    return (
      <span className={classe} aria-hidden="true">
        <Sparkles size={15} strokeWidth={2.2} />
      </span>
    );
  }

  return (
    <span className={classe}>
      <img src={AVATAR} alt="" onError={onErro} aria-hidden="true" />
    </span>
  );
}

function lerUsuario() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

export default function ChatBot() {
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [conversas, setConversas] = useState([MENSAGEM_INICIAL]);
  const [enviando, setEnviando] = useState(false);
  const [avatarFalhou, setAvatarFalhou] = useState(false);

  const corpoRef = useRef(null);
  const inputRef = useRef(null);

  /* Rola para a última mensagem */
  useEffect(() => {
    if (corpoRef.current) {
      corpoRef.current.scrollTop = corpoRef.current.scrollHeight;
    }
  }, [conversas, enviando]);

  /* Foca o campo ao abrir */
  useEffect(() => {
    if (aberto && inputRef.current) inputRef.current.focus();
  }, [aberto]);

  /* Fecha com Esc */
  useEffect(() => {
    if (!aberto) return undefined;

    function aoTeclar(evento) {
      if (evento.key === "Escape") setAberto(false);
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  async function enviarMensagem() {
    const texto = mensagem.trim();

    if (!texto || enviando) return;

    const usuario = lerUsuario();

    setConversas((prev) => [...prev, { tipo: "usuario", texto }]);
    setMensagem("");
    setEnviando(true);

    try {
      const response = await axios.post(`${CHAT_URL}/chat`, {
        mensagem: texto,
        usuario_id: usuario?.id ?? "anonimo",
      });

      setConversas((prev) => [
        ...prev,
        {
          tipo: "bot",
          texto:
            response.data?.resposta ||
            "Desculpe, não consegui gerar uma resposta.",
        },
      ]);
    } catch (error) {
      const status = error?.response?.status;

      let textoErro = "Erro ao conectar com o servidor.";

      if (status === 502 || status === 503 || status === 504) {
        textoErro =
          "O serviço do chat está indisponível no momento. Tente novamente em instantes.";
      } else if (!error.response) {
        textoErro =
          "Não foi possível falar com o serviço do chat. Verifique se ele está rodando.";
      }

      setConversas((prev) => [...prev, { tipo: "bot", texto: textoErro }]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`chat-launcher${aberto ? " aberto" : ""}`}
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? "Fechar chat" : "Abrir chat"}
        aria-expanded={aberto}
      >
        <Avatar
          classe="chat-launcher-avatar"
          falhou={avatarFalhou}
          onErro={() => setAvatarFalhou(true)}
        />
      </button>

      {aberto && (
        <div className="chat-box" role="dialog" aria-label="Chat MarketMind">
          <header className="chat-header">
            <Avatar
              classe="chat-header-avatar"
              falhou={avatarFalhou}
              onErro={() => setAvatarFalhou(true)}
            />

            <div className="chat-header-texto">
              <strong>MarketMind Bot</strong>
              <span className="chat-header-sub">Assistente de IA</span>
            </div>

            <button
              type="button"
              className="chat-close"
              onClick={() => setAberto(false)}
              aria-label="Fechar chat"
            >
              <X size={17} strokeWidth={2.4} />
            </button>
          </header>

          <div className="chat-body" ref={corpoRef}>
            {conversas.map((msg, index) => (
              <div key={index} className={`msg ${msg.tipo}`}>
                {msg.tipo === "bot" && (
                  <Avatar
                    classe="msg-avatar"
                    falhou={avatarFalhou}
                    onErro={() => setAvatarFalhou(true)}
                  />
                )}
                <div className="msg-texto">{msg.texto}</div>
              </div>
            ))}

            {enviando && (
              <div className="msg bot">
                <Avatar
                  classe="msg-avatar"
                  falhou={avatarFalhou}
                  onErro={() => setAvatarFalhou(true)}
                />
                <div className="msg-texto digitando" aria-label="Digitando">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          <form
            className="chat-footer"
            onSubmit={(event) => {
              event.preventDefault();
              enviarMensagem();
            }}
          >
            <input
              ref={inputRef}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              maxLength={500}
              aria-label="Mensagem"
            />

            <button
              type="submit"
              className="chat-enviar"
              disabled={enviando || !mensagem.trim()}
              aria-label="Enviar mensagem"
            >
              <Send size={16} strokeWidth={2.2} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
