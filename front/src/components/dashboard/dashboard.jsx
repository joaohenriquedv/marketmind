
import { useState, useMemo, useEffect, useCallback } from "react";
import "./dashboard.css";
import {
  Building2,
  TriangleAlert,
  TrendingUp,
  TrendingDown,
  Percent,
  Package,
  DollarSign,
  Zap,
  FolderPlus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import SeletorNegocio from "../seletorneg";
import NovoNegocio from "../novonegocio";
import {
  listarNegociosUsuario,
  criarNegocio,
  listarProdutos,
} from "../../api";

/* ── Utilidades ── */

function formatBRL(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function lerUsuarioLocal() {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function lerNegocioLocal() {
  try {
    const raw = localStorage.getItem("negocio");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizarNegocios(dados) {
  if (!dados) return [];
  const lista = Array.isArray(dados)
    ? dados
    : dados.negocios || dados.data || dados.lista || [];
  return Array.isArray(lista) ? lista : [];
}

function normalizarTendencia(t) {
  const s = String(t || "").toLowerCase();
  if (s.includes("cresc") || s.includes("cresce") || s.includes("subind")) {
    return "Crescendo";
  }
  if (s.includes("qued") || s.includes("caind")) {
    return "EmQueda";
  }
  return "Estavel";
}

function normalizarProduto(p) {
  return {
    nome: p.nome ?? p.name ?? p.produto ?? "Produto",
    preco: Number(p.preco ?? p.preço ?? p.price ?? p.valor ?? 0),
    custo: Number(p.custo ?? p.precoCusto ?? p.cost ?? 0),
    vendas: Number(p.vendas ?? p.quantidade ?? p.qtd ?? p.sales ?? 0),
    tendencia: normalizarTendencia(p.tendencia ?? p.trend ?? p.status),
  };
}

export default function Dashboard({ onNavegar }) {
  const [negocios, setNegocios] = useState(() => {
    const local = lerNegocioLocal();
    return local?.id != null ? [local] : [];
  });
  const [ativoId, setAtivoId] = useState(() => {
    const local = lerNegocioLocal();
    return local?.id != null ? local.id : null;
  });

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [showSeletor, setShowSeletor] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const negocioAtivo = useMemo(
    () => negocios.find((n) => n.id === ativoId) || negocios[0] || null,
    [negocios, ativoId]
  );

  /* Produtos vindos do BANCO (por negócio ativo) */
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    let montado = true;
    const id = negocioAtivo?.id;

    if (id == null) return undefined;

    (async () => {
      try {
        const lista = await listarProdutos(id);
        if (montado) {
          setProdutos(
            Array.isArray(lista) ? lista.map(normalizarProduto) : []
          );
        }
      } catch {
        if (montado) setProdutos([]);
      }
    })();

    return () => {
      montado = false;
    };
  }, [negocioAtivo?.id]);

  const buscarNegocios = useCallback(
    async () => normalizarNegocios(await listarNegociosUsuario()),
    []
  );

  /* Busca inicial: todo setState acontece DEPOIS de um await */
  useEffect(() => {
    let montado = true;
    const tinhaLocal = lerNegocioLocal()?.id != null;

    (async () => {
      try {
        const lista = await buscarNegocios();
        if (!montado) return;

        if (lista.length) {
          setNegocios(lista);
          setAtivoId((atual) =>
            lista.some((n) => n.id === atual) ? atual : lista[0].id
          );
        }
      } catch {
        if (montado && !tinhaLocal) {
          setErro(
            "Não foi possível carregar seus negócios. Verifique se o servidor está rodando."
          );
        }
      } finally {
        if (montado) setCarregando(false);
      }
    })();

    return () => {
      montado = false;
    };
  }, [buscarNegocios]);

  async function recarregar() {
    setCarregando(true);
    setErro("");

    try {
      const lista = await buscarNegocios();
      if (lista.length) {
        setNegocios(lista);
        setAtivoId((atual) =>
          lista.some((n) => n.id === atual) ? atual : lista[0].id
        );
      }
    } catch {
      setErro(
        "Não foi possível carregar seus negócios. Verifique se o servidor está rodando."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function handleSalvarNegocio(form = {}) {
    setShowModal(false);

    const usuario = lerUsuarioLocal();
    const base = {
      usuario_id: usuario?.id,
      nome: form.nome,
      segmento: form.segmento || "",
      localizacao:
        form.localizacao ||
        (form.cidade
          ? `${form.cidade}${form.estado ? ` - ${form.estado}` : ""}`
          : ""),
      receita_mensal: Number(form.receita_mensal) || 0,
      custos_mensais: Number(form.custos_mensais) || 0,
      funcionarios: Number(form.colaboradores ?? form.funcionarios) || 0,
      anos_mercado: Number(form.anos_mercado) || 0,
      publico_alvo: form.publico_alvo || form.porte || "",
      concorrentes: form.concorrentes || "",
      descricao: form.descricao || "",
    };

    let novo;

    try {
      const resultado = await criarNegocio(base);
      novo = resultado?.negocio ? { ...resultado.negocio } : { ...base };
    } catch {
      novo = { ...base };
    }

    if (novo.id == null) novo.id = Date.now();

    setNegocios((prev) => [...prev, novo]);
    setAtivoId(novo.id);
    localStorage.setItem("negocio", JSON.stringify(novo));
  }

  /* ── Métricas ── */
  const stats = useMemo(() => {
    const temProdutos = produtos.length > 0;

    const receitaProdutos = produtos.reduce((a, p) => a + p.preco * p.vendas, 0);
    const custoVariavel = produtos.reduce((a, p) => a + p.custo * p.vendas, 0);
    const custoFixo = Number(negocioAtivo?.custos_mensais) || 0;

    const receita = temProdutos
      ? receitaProdutos
      : Number(negocioAtivo?.receita_mensal) || 0;
    const custos = temProdutos ? custoVariavel + custoFixo : custoFixo;
    const lucro = receita - custos;
    const margem = receita > 0 ? (lucro / receita) * 100 : 0;

    const crescendo = produtos.filter((p) => p.tendencia === "Crescendo").length;
    const estavel = produtos.filter((p) => p.tendencia === "Estavel").length;
    const emQueda = produtos.filter((p) => p.tendencia === "EmQueda").length;
    const total = produtos.length;

    const margemScore = Math.max(0, Math.min(margem / 60, 1)) * 60;
    const tendenciaScore = total > 0 ? (crescendo / total) * 40 : 0;
    const competitividade = Math.round(margemScore + tendenciaScore);

    const topProdutos = [...produtos]
      .map((p) => ({ ...p, receita: p.preco * p.vendas }))
      .sort((a, b) => b.receita - a.receita);

    const maxReceita = topProdutos[0]?.receita || 1;
    const produtosEmQueda = produtos.filter((p) => p.tendencia === "EmQueda");

    return {
      temProdutos,
      receita,
      custos,
      lucro,
      margem,
      crescendo,
      estavel,
      emQueda,
      total,
      competitividade,
      topProdutos,
      maxReceita,
      produtosEmQueda,
    };
  }, [produtos, negocioAtivo]);

  /* ── Geometria do gauge ── */
  const gaugeRadius = 42;
  const gaugeCirc = 2 * Math.PI * gaugeRadius;
  const gaugeOffset =
    gaugeCirc * (1 - Math.min(Math.max(stats.competitividade, 0), 100) / 100);
  const gaugeColor =
    stats.competitividade >= 60
      ? "#22c55e"
      : stats.competitividade >= 35
        ? "#f47421"
        : "#ef4444";

  /* ── Geometria do donut ── */
  const donutRadius = 35;
  const donutCirc = 2 * Math.PI * donutRadius;
  const arcCrescendo = donutCirc * (stats.total ? stats.crescendo / stats.total : 0);
  const arcEstavel = donutCirc * (stats.total ? stats.estavel / stats.total : 0);
  const arcQueda = donutCirc * (stats.total ? stats.emQueda / stats.total : 0);

  const kpis = [
    {
      label: "Receita Estimada",
      value: formatBRL(stats.receita),
      delta: stats.temProdutos
        ? `${stats.total} produto(s)`
        : "cadastre seus produtos",
      deltaClass: "blue",
      Icone: DollarSign,
    },
    {
      label: "Lucro Estimado",
      value: formatBRL(stats.lucro),
      delta: stats.lucro >= 0 ? "✓ Positivo" : "⚠ Negativo",
      deltaClass: stats.lucro >= 0 ? "green" : "red",
      Icone: stats.lucro >= 0 ? TrendingUp : TrendingDown,
    },
    {
      label: "Margem Média",
      value: `${stats.margem.toFixed(1)}%`,
      delta:
        stats.margem >= 30
          ? "✓ Saudável"
          : stats.margem > 0
            ? "⚠ Atenção"
            : "sem dados",
      deltaClass: stats.margem >= 30 ? "green" : "blue",
      Icone: Percent,
    },
    {
      label: "Produtos Ativos",
      value: String(stats.total),
      delta: `${stats.crescendo} em crescimento`,
      deltaClass: "blue",
      Icone: Package,
    },
  ];

  const semEmpresa = !carregando && !erro && !negocioAtivo;

  return (
    <div className="db-page">
      <header className="db-header">
        <div className="db-header-left">
          <h1>Dashboard</h1>
          <p>Visão geral do seu negócio</p>
        </div>

        {negocioAtivo && (
          <div className="db-header-right">
            <div style={{ position: "relative" }}>
              <div
                className="db-company-select"
                onClick={() => setShowSeletor((v) => !v)}
              >
                <span className="db-company-icon">
                  <Building2 size={16} strokeWidth={2} />
                </span>
                {negocioAtivo.nome}
                <span className="db-company-caret">
                  {showSeletor ? "▴" : "▾"}
                </span>
              </div>

              {showSeletor && (
                <SeletorNegocio
                  negocios={negocios}
                  ativo={ativoId}
                  onSelecionar={setAtivoId}
                  onNovo={() => {
                    setShowSeletor(false);
                    setShowModal(true);
                  }}
                  onClose={() => setShowSeletor(false)}
                />
              )}
            </div>

            <button
              className="db-refresh"
              onClick={recarregar}
              disabled={carregando}
              title="Atualizar dados"
            >
              <RefreshCw size={16} strokeWidth={2} />
            </button>
          </div>
        )}
      </header>

      <div className="db-body">
        {carregando && (
          <div className="db-loading">
            <span className="db-spinner" />
            Carregando seus dados...
          </div>
        )}

        {!carregando && erro && (
          <div className="db-erro">
            <AlertCircle size={18} strokeWidth={2} />
            <span>{erro}</span>
            <button className="db-erro-btn" onClick={recarregar}>
              Tentar de novo
            </button>
          </div>
        )}

        {semEmpresa && (
          <div className="db-empty">
            <div className="db-empty-icon">
              <Building2 size={28} strokeWidth={1.8} />
            </div>
            <div className="db-empty-title">Nenhuma empresa cadastrada</div>
            <div className="db-empty-text">
              Cadastre sua empresa para ver receita, lucro, margem e
              competitividade calculados a partir dos seus dados.
            </div>
            <button
              className="db-empty-btn"
              onClick={() => onNavegar && onNavegar("cadastro-empresa")}
            >
              <FolderPlus size={16} strokeWidth={2} />
              Cadastrar minha empresa
            </button>
          </div>
        )}

        {!carregando && !erro && negocioAtivo && (
          <>
            {stats.produtosEmQueda.length > 0 && (
              <div className="db-alert">
                <div className="db-alert-left">
                  <div className="db-alert-icon">
                    <TriangleAlert size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="db-alert-title">Produtos em queda</div>
                    <div className="db-alert-sub">
                      {stats.produtosEmQueda.length} produto(s) com tendência de
                      queda nas vendas.
                    </div>
                  </div>
                </div>
                <span
                  className="db-alert-link"
                  onClick={() => onNavegar && onNavegar("alertas")}
                >
                  Ver todos ({stats.produtosEmQueda.length}) →
                </span>
              </div>
            )}

            <div className="db-kpis">
              {kpis.map(({ label, value, delta, deltaClass, Icone }) => (
                <div key={label} className="db-kpi">
                  <div className="db-kpi-left">
                    <span className="db-kpi-label">{label}</span>
                    <span className="db-kpi-value">{value}</span>
                    <span className={`db-kpi-delta ${deltaClass}`}>
                      {delta}
                    </span>
                  </div>
                  <div className="db-kpi-icon">
                    <Icone size={18} strokeWidth={2} />
                  </div>
                </div>
              ))}
            </div>

            <div className="db-charts">
              <div className="db-chart-card">
                <div className="db-chart-title">Competitividade</div>
                <div className="db-gauge-wrap">
                  <div className="db-gauge">
                    <svg viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r={gaugeRadius}
                        fill="none"
                        stroke="#e8e6e3"
                        strokeWidth="10"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r={gaugeRadius}
                        fill="none"
                        stroke={gaugeColor}
                        strokeWidth="10"
                        strokeDasharray={gaugeCirc}
                        strokeDashoffset={gaugeOffset}
                        strokeLinecap="round"
                        style={{
                          transition:
                            "stroke-dashoffset 0.6s ease, stroke 0.6s ease",
                        }}
                      />
                    </svg>
                    <div className="db-gauge-label">
                      <span className="db-gauge-num">
                        {stats.competitividade}
                      </span>
                      <span className="db-gauge-den">/100</span>
                    </div>
                  </div>
                  <div className="db-gauge-sub">
                    {stats.competitividade >= 60 ? (
                      <>
                        Seu negócio está bem
                        <br />
                        posicionado!
                      </>
                    ) : stats.competitividade >= 35 ? (
                      <>
                        Há espaço para
                        <br />
                        melhorar
                      </>
                    ) : (
                      <>
                        Atenção: posição
                        <br />
                        de risco
                      </>
                    )}
                  </div>
                  <button
                    className="db-gauge-btn"
                    onClick={() => onNavegar && onNavegar("alertas")}
                  >
                    Ver sugestões →
                  </button>
                </div>
              </div>

              {stats.temProdutos ? (
                <>
                  <div className="db-chart-card">
                    <div className="db-chart-title">Tendência dos Produtos</div>
                    <div className="db-donut-wrap">
                      <svg width="130" height="130" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r={donutRadius}
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="22"
                          strokeDasharray={`${arcCrescendo} ${
                            donutCirc - arcCrescendo
                          }`}
                          strokeDashoffset="0"
                          transform="rotate(-90 50 50)"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r={donutRadius}
                          fill="none"
                          stroke="#f47421"
                          strokeWidth="22"
                          strokeDasharray={`${arcEstavel} ${
                            donutCirc - arcEstavel
                          }`}
                          strokeDashoffset={-arcCrescendo}
                          transform="rotate(-90 50 50)"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r={donutRadius}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="22"
                          strokeDasharray={`${arcQueda} ${donutCirc - arcQueda}`}
                          strokeDashoffset={-(arcCrescendo + arcEstavel)}
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="db-donut-legend">
                        <div className="db-legend-item">
                          <div
                            className="db-legend-dot"
                            style={{ background: "#22c55e" }}
                          />{" "}
                          Crescendo ({stats.crescendo})
                        </div>
                        <div className="db-legend-item">
                          <div
                            className="db-legend-dot"
                            style={{ background: "#f47421" }}
                          />{" "}
                          Estável ({stats.estavel})
                        </div>
                        <div className="db-legend-item">
                          <div
                            className="db-legend-dot"
                            style={{ background: "#ef4444" }}
                          />{" "}
                          Em queda ({stats.emQueda})
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="db-chart-card">
                    <div className="db-chart-title">Top Produtos (Receita)</div>
                    <div className="db-bars">
                      {stats.topProdutos.map(({ nome, receita }) => (
                        <div key={nome} className="db-bar-row">
                          <span className="db-bar-label">{nome}</span>
                          <div className="db-bar-track">
                            <div
                              className="db-bar-fill"
                              style={{
                                width: `${(receita / stats.maxReceita) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="db-bar-val">
                            {receita.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="db-chart-card db-chart-empty">
                  <Package size={28} strokeWidth={1.8} />
                  <div className="db-chart-empty-title">
                    Sem produtos cadastrados
                  </div>
                  <div className="db-chart-empty-text">
                    Cadastre seus produtos e vendas para ver tendências e o
                    ranking por receita.
                  </div>
                  <button
                    className="db-empty-btn"
                    onClick={() => onNavegar && onNavegar("produto")}
                  >
                    <FolderPlus size={16} strokeWidth={2} />
                    Cadastrar produtos
                  </button>
                </div>
              )}
            </div>

            <div className="db-simple-banner">
              <div className="db-simple-icon">
                <Zap size={18} strokeWidth={2} />
              </div>
              <div>
                <div className="db-simple-title">
                  Modo Simples — {negocioAtivo.nome}
                </div>
                <div className="db-simple-text">
                  {stats.produtosEmQueda.length > 0 ? (
                    <span>
                      ⚠️{" "}
                      {stats.produtosEmQueda.map((p) => p.nome).join(", ")} estão
                      vendendo menos. Pode ser hora de mudar de estratégia.
                    </span>
                  ) : stats.temProdutos ? (
                    <span>Seus produtos estão indo bem. Continue assim!</span>
                  ) : (
                    <span>
                      Cadastre seus produtos para receber recomendações
                      personalizadas.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <NovoNegocio
          onClose={() => setShowModal(false)}
          onSalvar={handleSalvarNegocio}
        />
      )}
    </div>
  );
}
