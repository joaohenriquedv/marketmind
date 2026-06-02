import './diferencial.css'

export default function Diferencial() {
  const outros = [
    'Mostram números e gráficos',
    'Você interpreta sozinho',
    'Linguagem técnica e complicada',
    'Genérico para qualquer empresa',
  ]

  const marketmind = [
    'Entende o mercado e reposiciona',
    'Diz exatamente o que fazer',
    'Linguagem simples e direta',
    'Foco no pequeno negócio de PE',
  ]

  return (
    <section className="diferencial">
      <h2 className="diferencial__titulo">Por que o MarketMind é diferente?</h2>

      <div className="diferencial__cards">
        <div className="diferencial__card diferencial__card--outros">
          <p className="diferencial__card-label">Outros apps</p>
          <ul className="diferencial__lista">
            {outros.map((item) => (
              <li key={item} className="diferencial__item diferencial__item--negativo">
                <span className="diferencial__icone diferencial__icone--x" aria-hidden="true">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="diferencial__card diferencial__card--marketmind">
          <p className="diferencial__card-label diferencial__card-label--destaque">
            MarketMind <span aria-label="coração"></span>
          </p>
          <ul className="diferencial__lista">
            {marketmind.map((item) => (
              <li key={item} className="diferencial__item diferencial__item--positivo">
                <span className="diferencial__icone diferencial__icone--check" aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}