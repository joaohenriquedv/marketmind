import "./problemas.css";

const cards = [
  { icon: "$", label: "Preço errado" },
  { icon: "📦", label: "Produto que não gira" },
  { icon: "📈", label: "Mercado que mudou" },
  { icon: "👥", label: "Cliente que foi embora" },
];

export default function ProblemSection() {
  return (
    <section className="ps-section">
      <h2 className="ps-title">
        Empresas não quebram só por falta de dinheiro
      </h2>
      <p className="ps-sub">
        A maioria quebra porque está com o preço errado, vendendo produto que não
        gira e sem perceber as mudanças do mercado.
      </p>
      <div className="ps-cards">
        {cards.map(({ icon, label }) => (
          <div key={label} className="ps-card">
            <span className="ps-card-icon">{icon}</span>
            <span className="ps-card-label">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
