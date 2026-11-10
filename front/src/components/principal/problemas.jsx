
import "./problemas.css";
import { CircleDollarSign, PackageX, TrendingUp, UserMinus } from "lucide-react";

const PROBLEMAS = [
  { Icone: CircleDollarSign, titulo: "Preço errado" },
  { Icone: PackageX, titulo: "Produto que não gira" },
  { Icone: TrendingUp, titulo: "Mercado que mudou" },
  { Icone: UserMinus, titulo: "Cliente que foi embora" },
];

export default function Problema() {
  return (
    <section className="mm-problemas">
      <h2 className="mm-problemas-title">
        Empresas não quebram só por falta de dinheiro
      </h2>

      <p className="mm-problemas-sub">
        A maioria quebra porque está com o preço errado, vendendo produto que não
        gira e sem perceber as mudanças do mercado.
      </p>

      <div className="mm-problemas-grid">
        {PROBLEMAS.map(({ Icone, titulo }) => (
          <div key={titulo} className="mm-problema-card">
            <span className="mm-problema-icon">
              <Icone size={30} strokeWidth={1.75} />
            </span>
            <span className="mm-problema-label">{titulo}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
