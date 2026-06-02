import "./features.css";

const cards = [
  {
    icon: "🎯",
    title: "Diagnóstico de Posicionamento",
    desc: "Analisa seus produtos e margens e diz se seu negócio está bem posicionado no mercado.",
    quote: '"Você está trabalhando muito e ganhando pouco."',
  },
  {
    icon: "⚠️",
    title: "Alertas Estratégicos",
    desc: "Avisa quando seu preço está errado, quando um produto não compensa e quando você está perdendo espaço.",
    quote: '"Seu preço está abaixo do mercado."',
  },
  {
    icon: "📈",
    title: "Reposicionamento Automático",
    desc: "Sugere mudanças concretas: ajustar preços, trocar foco de produto e criar promoções mais inteligentes.",
    quote: '"Pare de investir nisso e foque naquilo."',
  },
  {
    icon: "📊",
    title: "Simulação de Mercado",
    desc: "Teste cenários antes de decidir. Veja o impacto de cada mudança antes de agir.",
    quote: '"Veja o que acontece antes de decidir."',
  },
  {
    icon: "📦",
    title: "Gestão de Produtos",
    desc: "Veja quais produtos geram lucro e quais estão em queda, com margem calculada automaticamente.",
    quote: '"Esse produto não vale a pena."',
  },
  {
    icon: "🏆",
    title: "Previsão de Competitividade",
    desc: "Veja sua posição no mercado e se está crescendo ou em risco de ser ultrapassado.",
    quote: '"Se continuar assim, vai perder clientes."',
  },
];

export default function Features() {
  return (
    <section className="ft-section">
      <h2 className="ft-title">O que o MarketMind faz por você</h2>
      <p className="ft-sub">
        Muito mais do que mostrar números — o sistema entende o mercado e
        reposiciona o seu negócio.
      </p>
      <div className="ft-grid">
        {cards.map(({ icon, title, desc, quote }) => (
          <div key={title} className="ft-card">
            <div className="ft-icon-wrap">{icon}</div>
            <div className="ft-card-title">{title}</div>
            <div className="ft-card-desc">{desc}</div>
            <div className="ft-card-quote">{quote}</div>
          </div>
        ))}
      </div>
    </section>
  );
}