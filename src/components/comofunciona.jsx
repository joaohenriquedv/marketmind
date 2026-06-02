import "./ComoFunciona.css";

const steps = [
  {
    num: "01",
    title: "Cadastre seu negócio",
    desc: "Informe o segmento, receita, custos e produtos.",
  },
  {
    num: "02",
    title: "Receba o diagnóstico",
    desc: "A IA analisa tudo e mostra onde você está errando.",
  },
  {
    num: "03",
    title: "Veja os alertas",
    desc: "Alertas diretos sobre preços, produtos e mercado.",
  },
  {
    num: "04",
    title: "Reposicione o negócio",
    desc: "Siga as sugestões e recalcule a rota do seu negócio.",
  },
];

export default function ComoFunciona() {
  return (
    <section className="hw-section">
      <h2 className="hw-title">Como funciona</h2>
      <p className="hw-sub">Simples, rápido e direto ao ponto.</p>

      <div className="hw-steps">
        {steps.map(({ num, title, desc }) => (
          <div key={num} className="hw-step">
            <div className="hw-step-inner">
              <div className="hw-step-num">{num}</div>
              <div className="hw-step-text">
                <span className="hw-step-title">{title}</span>
                <span className="hw-step-desc">{desc}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}