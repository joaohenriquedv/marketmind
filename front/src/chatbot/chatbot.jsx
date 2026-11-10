
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./chatbot.css";

const CHAT_URL = import.meta.env.VITE_CHAT_URL || "http://localhost:3002";

export default function ChatBot() {
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [conversas, setConversas] = useState([]);
  const [enviando, setEnviando] = useState(false);

  const corpoRef = useRef(null);

  // Rola o chat para a última mensagem automaticamente
  useEffect(() => {
    if (corpoRef.current) {
      corpoRef.current.scrollTop = corpoRef.current.scrollHeight;
    }
  }, [conversas, enviando]);

  async function enviarMensagem() {
    const texto = mensagem.trim();

    if (!texto || enviando) return;

    setConversas((prev) => [
      ...prev,
      { tipo: "usuario", texto },
    ]);

    setMensagem("");
    setEnviando(true);

    try {
      const response = await axios.post(`${CHAT_URL}/chat`, {
        mensagem: texto,
        usuario_id: "usuario_1",
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
      <img
        src="/chatbot.png"
        alt="Abrir chat"
        className="chat-image"
        onClick={() => setAberto(!aberto)}
      />

      {aberto && (
        <div className="chat-box">
          <div className="chat-header">
            <strong>MarketMind Bot</strong>
            <button type="button" onClick={() => setAberto(false)}>
              X
            </button>
          </div>

          <div className="chat-body" ref={corpoRef}>
            {conversas.map((msg, index) => (
              <div key={index} className={`msg ${msg.tipo}`}>
                {msg.texto}
              </div>
            ))}

            {enviando && (
              <div className="msg bot digitando">digitando...</div>
            )}
          </div>

          <div className="chat-footer">
            <input
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  enviarMensagem();
                }
              }}
            />

            <button type="button" onClick={enviarMensagem} disabled={enviando}>
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
