import "./principal.css";
import Navbar from "../navbar.jsx";

export default function HeroSection({ onNavegar }) {
  return (
    <>
      <Navbar onNavegar={onNavegar} paginaAtiva="home" />

      {/* resto do Hero sem mudança... */}

      {/* ── HERO ── */}
      <section className="mm-hero">
        {/* Left */}
        <div className="mm-hero-left">
          <div className="mm-hero-badge">
            <span>✳️</span> Plataforma completa de gestão
          </div>

          <h1 className="mm-hero-title">
            Gestão inteligente
            <br />
            para <em>negócios</em>
            <br />
            <em>modernos</em>
          </h1>

          <p className="mm-hero-sub">
            Controle vendas, clientes e crescimento com uma plataforma simples e
            poderosa.
          </p>

          <a href="#" className="mm-hero-cta">
            Acessar Dashboard →
          </a>

          <div className="mm-hero-features">
            <div className="mm-hero-feature">
              <span className="mm-hero-feature-icon"></span>
              <div>
                <div className="mm-hero-feature-title">Relatórios</div>
                <div className="mm-hero-feature-sub">em tempo real</div>
              </div>
            </div>
            <div className="mm-hero-feature">
              <span className="mm-hero-feature-icon"></span>
              <div>
                <div className="mm-hero-feature-title">Gestão de</div>
                <div className="mm-hero-feature-sub">clientes</div>
              </div>
            </div>
            <div className="mm-hero-feature">
              <span className="mm-hero-feature-icon"></span>
              <div>
                <div className="mm-hero-feature-title">Decisões</div>
                <div className="mm-hero-feature-sub">baseadas em dados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Laptop mockup */}
        <div className="mm-hero-right">
          <div className="mm-laptop-wrap">
            <div className="mm-laptop">
              <div className="mm-laptop-screen">
                <div className="mm-dash">
                  {/* Sidebar */}
                  <div className="mm-dash-sidebar">
                    <div className="mm-dash-sidebar-logo">
                      Market<span>Mind</span>
                    </div>
                    {[
                      { icon: "📊", label: "Dashboard", active: true },
                      { icon: "💰", label: "Vendas" },
                      { icon: "👤", label: "Clientes" },
                      { icon: "📦", label: "Produtos" },
                      { icon: "📋", label: "Relatórios" },
                      { icon: "🎯", label: "Metas" },
                      { icon: "⚙️", label: "Config." },
                    ].map(({ icon, label, active }) => (
                      <div
                        key={label}
                        className={`mm-dash-nav-item${active ? " active" : ""}`}
                      >
                        {icon} {label}
                      </div>
                    ))}
                  </div>

                  {/* Main */}
                  <div className="mm-dash-main">
                    {/* Header */}
                    <div className="mm-dash-header">
                      <span className="mm-dash-header-title">Dashboard</span>
                      <div className="mm-dash-header-right">
                        <span className="mm-dash-period">
                          Últimos 30 dias ▾
                        </span>
                      </div>
                    </div>

                    {/* KPIs */}
                    <div className="mm-dash-kpis">
                      {[
                        {
                          label: "Receita total",
                          value: "R$ 256,8k",
                          delta: "+12,6%",
                        },
                        { label: "Vendas", value: "1.524", delta: "+8,3%" },
                        {
                          label: "Novos clientes",
                          value: "2.350",
                          delta: "+18,7%",
                        },
                        {
                          label: "Ticket médio",
                          value: "R$ 128,90",
                          delta: "+6,1%",
                        },
                      ].map(({ label, value, delta }) => (
                        <div key={label} className="mm-kpi">
                          <div className="mm-kpi-label">{label}</div>
                          <div className="mm-kpi-value">{value}</div>
                          <div className="mm-kpi-delta">
                            {delta} vs mês anterior
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Charts */}
                    <div className="mm-dash-charts">
                      <div className="mm-dash-chart-big">
                        <div className="mm-chart-title">
                          Evolução de vendas — Últimos 7 meses
                        </div>
                        <div className="mm-area-chart">
                          <svg viewBox="0 0 200 50" preserveAspectRatio="none">
                            <defs>
                              <linearGradient
                                id="g1"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="#f47421"
                                  stopOpacity="0.3"
                                />
                                <stop
                                  offset="100%"
                                  stopColor="#f47421"
                                  stopOpacity="0.02"
                                />
                              </linearGradient>
                            </defs>
                            <path
                              d="M0,40 C20,35 30,30 50,25 C70,20 80,28 100,22 C120,16 140,18 160,10 C175,5 190,8 200,6 L200,50 L0,50 Z"
                              fill="url(#g1)"
                            />
                            <path
                              d="M0,40 C20,35 30,30 50,25 C70,20 80,28 100,22 C120,16 140,18 160,10 C175,5 190,8 200,6"
                              fill="none"
                              stroke="#f47421"
                              strokeWidth="1.5"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="mm-dash-chart-small">
                        <div className="mm-chart-title">Top produtos</div>
                        {[
                          { name: "Produto A", pct: 85, val: "R$95.430" },
                          { name: "Produto B", pct: 65, val: "R$42.310" },
                          { name: "Produto C", pct: 55, val: "R$41.120" },
                          { name: "Produto D", pct: 45, val: "R$30.640" },
                        ].map(({ name, pct, val }) => (
                          <div key={name} className="mm-product-row">
                            <span className="mm-product-name">{name}</span>
                            <div className="mm-product-bar-wrap">
                              <div
                                className="mm-product-bar"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="mm-product-val">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom */}
                    <div className="mm-dash-bottom">
                      <div className="mm-dash-donut-card">
                        <div className="mm-chart-title">Canais de vendas</div>
                        <div className="mm-donut-row">
                          <svg width="36" height="36" viewBox="0 0 36 36">
                            <circle
                              cx="18"
                              cy="18"
                              r="12"
                              fill="none"
                              stroke="#e8e6e3"
                              strokeWidth="6"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="12"
                              fill="none"
                              stroke="#f47421"
                              strokeWidth="6"
                              strokeDasharray="45 75"
                              strokeDashoffset="-7"
                              transform="rotate(-90 18 18)"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="12"
                              fill="none"
                              stroke="#fdd5b8"
                              strokeWidth="6"
                              strokeDasharray="19 75"
                              strokeDashoffset="-52"
                              transform="rotate(-90 18 18)"
                            />
                          </svg>
                          <div className="mm-donut-legend">
                            <div className="mm-legend-item">
                              <div
                                className="mm-legend-dot"
                                style={{ background: "#f47421" }}
                              />{" "}
                              Online — 60%
                            </div>
                            <div className="mm-legend-item">
                              <div
                                className="mm-legend-dot"
                                style={{ background: "#fdd5b8" }}
                              />{" "}
                              Loja Física — 25%
                            </div>
                            <div className="mm-legend-item">
                              <div
                                className="mm-legend-dot"
                                style={{ background: "#e8e6e3" }}
                              />{" "}
                              Marketplace — 15%
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mm-dash-stat-card">
                        <div className="mm-stat-label">Clientes ativos</div>
                        <div className="mm-stat-big">+2.350</div>
                        <div className="mm-stat-delta">
                          +18,7% vs mês anterior
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mm-laptop-base" />
            <div className="mm-laptop-foot" />
          </div>
        </div>
      </section>
    </>
  );
}
