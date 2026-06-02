import './cta.css'

export default function CTA({ onComecar }) {
  return (
    <section className="cta">
      <div className="cta__icone" aria-hidden="true">⚡</div>
      <h2 className="cta__titulo">Pronto para recalcular a rota?</h2>
      <p className="cta__subtitulo">
        Cadastre seu negócio gratuitamente e receba seu diagnóstico em minutos.
      </p>
      <button className="cta__botao" onClick={onComecar}>
        Começar agora
      </button>
    </section>
  )
}