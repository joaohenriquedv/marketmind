
import "./cta.css";
import { Zap, Sparkles } from "lucide-react";

export default function CTA({ onComecar }) {
  return (
    <>
      <section className="cta-section">
        <div className="cta-glow" aria-hidden="true" />

        <div className="cta-icon">
          <Zap size={30} strokeWidth={2} fill="currentColor" />
        </div>

        <h2 className="cta-title">Pronto para recalcular a rota?</h2>

        <p className="cta-sub">
          Cadastre seu negócio gratuitamente e receba seu diagnóstico em minutos.
        </p>

        <button type="button" className="cta-button" onClick={onComecar}>
          Começar agora
        </button>
      </section>

      {/* ── RODAPÉ ── */}
      <footer className="mm-footer">
        <div className="mm-footer-brand">
          <span className="mm-footer-mark">
            <Sparkles size={18} strokeWidth={2} />
          </span>
          <span className="mm-footer-logo">
            Market<span>Mind</span>
          </span>
        </div>

        <p className="mm-footer-tagline">
          Inteligência de mercado para negócios que crescem.
        </p>

        <div className="mm-footer-divider" />

        <p className="mm-footer-copy">
          © {new Date().getFullYear()} MarketMind. Todos os direitos reservados.
        </p>
      </footer>
    </>
  );
}
