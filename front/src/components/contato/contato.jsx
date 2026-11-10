
import { useState } from "react";
import { Mail, Phone, Clock, Headphones, Send, TrendingUp, Check, ChevronDown } from "lucide-react";
import "./contato.css";

const ASSUNTOS = [
  "Selecione o assunto",
  "Dúvida sobre a plataforma",
  "Problema técnico",
  "Cobrança e pagamento",
  "Sugestão",
  "Outro",
];

export default function ContatoMarketMind() {
  const [assunto, setAssunto] = useState(ASSUNTOS[0]);
  const [assuntoAberto, setAssuntoAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  const limite = 1000;

  const handleMensagemChange = (e) => {
    const valor = e.target.value;
    if (valor.length <= limite) {
      setMensagem(valor);
      if (erro) setErro("");
    }
  };

  const handleEnviar = () => {
    if (assunto === ASSUNTOS[0]) {
      setErro("Escolha um assunto antes de enviar.");
      return;
    }
    if (mensagem.trim().length === 0) {
      setErro("Escreva sua mensagem antes de enviar.");
      return;
    }

    setErro("");
    setEnviando(true);

    // Simula uma chamada de envio (substitua por uma chamada de API real)
    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
      setMensagem("");
      setAssunto(ASSUNTOS[0]);

      setTimeout(() => setEnviado(false), 4000);
    }, 1200);
  };

  let submitClass = "contato-submit";
  if (enviado) submitClass += " contato-submit--success";
  if (enviando) submitClass += " contato-submit--sending";

  return (
    <div className="contato-page">
      <div className="contato-container">
        {/* Header */}
        <div className="contato-header">
          <h1 className="contato-title">Contato</h1>
          <p className="contato-subtitle">Central de suporte da MarketMind</p>
        </div>

        <div className="contato-grid">
          {/* Coluna esquerda */}
          <div className="contato-card">
            <h2 className="contato-card-title">Fale com nosso time</h2>
            <p className="contato-card-desc">
              Estamos prontos para te ajudar. Escolha o canal de atendimento
              ou envie sua mensagem.
            </p>

            <div className="contato-info-list">
              <InfoRow
                icon={<Mail size={20} color="#f97316" />}
                title="E-mail de suporte"
                value="team.marketmind.7@gmail.com"
                href="mailto:team.marketmind.7@gmail.com"
              />
              <div className="contato-divider" />
              <InfoRow
                icon={<Phone size={20} color="#f97316" />}
                title="WhatsApp"
                value="81 98907-1780"
                href="https://wa.me/5581989071780"
              />
              <div className="contato-divider" />
              <InfoRow
                icon={<Clock size={20} color="#f97316" />}
                title="Horário de atendimento"
                value="Segunda a sexta, das 8h às 18h."
                plain
              />
            </div>

            <div className="contato-highlight">
              <div className="contato-icon-box">
                <Headphones size={20} color="#f97316" />
              </div>
              <div>
                <p className="contato-highlight-title">
                  Precisa de ajuda rápida?
                </p>
                <p className="contato-highlight-text">
                  Nossa equipe está disponível para te atender e garantir a
                  melhor experiência na plataforma.
                </p>
              </div>
            </div>
          </div>

          {/* Coluna direita - Formulário */}
          <div className="contato-card">
            <h2 className="contato-card-title">Envie sua mensagem</h2>
            <p className="contato-card-desc">
              Preencha os campos abaixo e entraremos em contato em breve.
            </p>

            {/* Assunto */}
            <label className="contato-label">Assunto</label>
            <div className="contato-select-wrapper">
              <button
                type="button"
                onClick={() => setAssuntoAberto((v) => !v)}
                className={
                  "contato-select-button" +
                  (assunto === ASSUNTOS[0]
                    ? " contato-select-button--placeholder"
                    : "")
                }
              >
                {assunto}
                <ChevronDown
                  size={16}
                  color="#a1a1aa"
                  className={
                    "contato-select-chevron" +
                    (assuntoAberto ? " contato-select-chevron--open" : "")
                  }
                />
              </button>

              {assuntoAberto && (
                <div className="contato-select-dropdown">
                  {ASSUNTOS.map((op, i) => (
                    <div
                      key={op}
                      onClick={() => {
                        if (i !== 0) {
                          setAssunto(op);
                          if (erro) setErro("");
                        }
                        setAssuntoAberto(false);
                      }}
                      className={
                        "contato-select-option" +
                        (i === 0 ? " contato-select-option--placeholder" : "") +
                        (assunto === op ? " contato-select-option--selected" : "")
                      }
                    >
                      {op}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mensagem */}
            <label className="contato-label">Mensagem</label>
            <div className="contato-textarea-wrapper">
              <textarea
                value={mensagem}
                onChange={handleMensagemChange}
                placeholder="Escreva sua dúvida ou solicitação..."
                rows={7}
                className="contato-textarea"
              />
              <span className="contato-char-count">
                {mensagem.length}/{limite}
              </span>
            </div>

            {erro && <p className="contato-error">{erro}</p>}

            <button
              onClick={handleEnviar}
              disabled={enviando}
              className={
                submitClass + (erro ? " contato-submit--has-error" : "")
              }
            >
              {enviado ? (
                <>
                  <Check size={18} /> Mensagem enviada!
                </>
              ) : enviando ? (
                "Enviando..."
              ) : (
                <>
                  Enviar mensagem <Send size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="contato-footer">
          <TrendingUp size={22} color="#f97316" />
          <span className="contato-footer-brand">MarketMind</span>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, title, value, href, plain }) {
  const content = (
    <div className="contato-info-row">
      <div className="contato-icon-box">{icon}</div>
      <div>
        <p className="contato-info-title">{title}</p>
        <p
          className={
            "contato-info-value" + (plain ? "" : " contato-info-value--accent")
          }
        >
          {value}
        </p>
      </div>
    </div>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }
  return content;
}
