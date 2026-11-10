
import { useState, useEffect } from "react";
import "./alertas.css";
import {
  TriangleAlert,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Lightbulb,
  ArrowRight,
  Building2,
  Store,
  Package,
  Loader2,
} from "lucide-react";
import SeletorNegocio from "./seletorneg";
import { listarNegociosUsuario, listarProdutos } from "../api";

const CHAT_URL = import.meta.env.VITE_CHAT_URL || "http://localhost:3002";

/* ── Utilidades ── */

function lerNegocio() {
  try {
    const raw = localStorage.getItem("negocio");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizarLista(dados) {
  if (!dados) return [];
  const l = Array.isArray(dados)
    ? dados
    : dados.negocios || dados.data || dados.lista || [];
  return Array.isArray(l) ? l : [];
}

function normalizarTendencia(t) {
  const s = String(t || "").toLowerCase();
  if (s.includes("cresc") || s.includes("subind")) return "Crescendo";
  if (s.includes("qued") || s.includes("caind")) return "EmQueda";
  return "Estavel";
}

/* Produto vindo da API → formato usado pelos alertas */
function normalizarProduto(p) {
  return {
    nome: p.nome ?? "Produto",
    categoria: p.categoria ?? "",
    preco: Number(p.preco) || 0,
    custo: Number(p.precoCusto ?? p.custo) || 0,
    vendas: Number(p.vendas) || 0,
    tendencia: normalizarTendencia(p.tendencia),
    estrategico: Boolean(p.estrategico),
  };
}

function classeNivel(nivel) {
  const s = String(nivel || "").toLowerCase();
  if (s.includes("crit")) return "critico";
  if (s.includes("oport")) return "oportunidade";
  return "atencao";
}

export default function Alertas() {
  const [negocios, setNegocios] = useState(() => {
    const local = lerNegocio();
    return local?.id != null ? [local] : [];
  });
  const [ativoId, setAtivoId] = useState(() => lerNegocio()?.id ?? null);
  const [produtos, setProdutos] = useState([]);

  const [showSeletor, setShowSeletor] = useState(false);
  const [alertasIA, setAlertasIA] = useState([]);
  const [analisando, setAnalisando] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const negocioAtivo =
    negocios.find((n) => n.id === ativoId) || negocios[0] || null;

  /* Busca os negócios do usuário (setState só depois do await) */
  useEffect(() => {
    let montado = true;

    (async () => {
      try {
        const lista = normalizarLista(await listarNegociosUsuario());
        if (!montado || lista.length === 0) return;

        setNegocios(lista);
        const id = lista[0].id;
        setAtivoId(id);

        try {
          const itens = await listarProdutos(id);
          if (montado) {
            setProdutos(
              Array.isArray(itens) ? itens.map(normalizarProduto) : []
            );
          }
        } catch {
          if (montado) setProdutos([]);
        }
      } catch {
        /* segue com o que veio do localStorage */
      } finally {
        if (montado) setCarregando(false);
      }
    })();

    return () => {
      montado = false;
    };
  }, []);

  /* Recarrega os produtos quando o negócio ativo muda */
  useEffect(() => {
    let montado = true;
    const id = negocioAtivo?.id;

    if (id == null) return undefined;

    (async () => {
      try {
        const itens = await listarProdutos(id);
        if (montado) {
          setProdutos(Array.isArray(itens) ? itens.map(normalizarProduto) : []);
        }
      } catch {
        if (montado) setProdutos([]);
      }
    })();

    return () => {
      montado = false;
    };
  }, [negocioAtivo?.id]);

  async function selecionarNegocio(valor) {
    const id = valor && typeof valor === "object" ? valor.id : valor;
    setAtivoId(id);
    setAlertasIA([]);
    setShowSeletor(false);

    try {
      const itens = await listarProdutos(id);
      setProdutos(Array.isArray(itens) ? itens.map(normalizarProduto) : []);
    } catch {
      setProdutos([]);
    }
  }

  const produtosEmQueda = produtos.filter((p) => p.tendencia === "EmQueda");

  async function analisar() {
    if (analisando) return;

    if (produtos.length === 0) {
      setErro("Cadastre produtos para a IA conseguir analisar.");
      return;
    }

    setAnalisando(true);
    setErro("");
    setAlertasIA([]);

    try {
      const resposta = await fetch(`${CHAT_URL}/alertas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ negocio: negocioAtivo, produtos }),
      });

      if (!resposta.ok) {
        throw new Error(`Servidor retornou ${resposta.status}`);
      }

      const dados = await resposta.json();
      setAlertasIA(Array.isArray(dados.alertas) ? dados.alertas : []);
    } catch (error) {
      console.error("Erro na análise de IA:", error);
      setErro(
        "Não foi possível gerar a análise agora. Verifique se o serviço de IA está rodando."
      );
    } finally {
      setAnalisando(false);
    }
  }

  return (
    <div className="al-page">
      <header className="al-header">
        <div className="al-header-left">
          <h1>Alertas Estratégicos</h1>
          <p>O que você precisa saber agora sobre seu negócio</p>
        </div>

        <div className="al-header-right">
          <div style={{ position: "relative" }}>
            <div
              className="al-company-select"
              onClick={() => setShowSeletor((v) => !v)}
            >
              <span className="al-company-icon">
                <Store size={16} strokeWidth={2} />
              </span>
              {carregando
                ? "Carregando..."
                : negocioAtivo?.nome || "Nenhum negócio"}
              <span className="al-company-caret">
                {showSeletor ? "▴" : "▾"}
              </span>
            </div>

            {showSeletor && (
              <SeletorNegocio
                negocios={negocios}
                ativo={ativoId}
                onSelecionar={selecionarNegocio}
                onClose={() => setShowSeletor(false)}
              />
            )}
          </div>

          <button
            className="al-btn-ia"
            onClick={analisar}
            disabled={analisando}
          >
            {analisando ? (
              <>
                <Loader2 className="al-girando" size={16} strokeWidth={2.2} />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles size={16} strokeWidth={2.2} />
                Análise IA
              </>
            )}
          </button>
        </div>
      </header>

      <div className="al-body">
        {erro && (
          <div className="al-msg">
            <TriangleAlert size={16} strokeWidth={2.2} />
            {erro}
          </div>
        )}

        {/* ALERTAS AUTOMÁTICOS */}
        <div className="al-section-label">Alertas automáticos</div>

        {produtosEmQueda.length > 0 ? (
          <div className="al-card atencao">
            <div className="al-card-icon">
              <TrendingDown size={17} strokeWidth={2.2} />
            </div>
            <div className="al-card-body">
              <div className="al-card-top">
                <span className="al-card-title">
                  {produtosEmQueda.length === 1
                    ? `"${produtosEmQueda[0].nome}" em queda`
                    : `${produtosEmQueda.length} produtos em queda`}
                </span>
                <span className="al-badge atencao">Atenção</span>
              </div>
              <div className="al-card-desc">
                {produtosEmQueda.map((p) => p.nome).join(", ")} com tendência de
                queda nas vendas. Considere mudar a estratégia ou trocar o foco.
              </div>
            </div>
          </div>
        ) : (
          <div className="al-card ok">
            <div className="al-card-icon">
              <TrendingUp size={17} strokeWidth={2.2} />
            </div>
            <div className="al-card-body">
              <div className="al-card-top">
                <span className="al-card-title">Nenhum produto em queda</span>
                <span className="al-badge ok">Tudo certo</span>
              </div>
              <div className="al-card-desc">
                {produtos.length === 0
                  ? "Cadastre seus produtos para começar a receber alertas automáticos."
                  : "Suas vendas estão estáveis ou crescendo. Continue assim!"}
              </div>
            </div>
          </div>
        )}

        {/* ALERTAS DA IA */}
        <div className="al-section-label">Alertas da IA</div>

        {analisando && alertasIA.length === 0 && (
          <div className="al-empty">
            <Loader2 className="al-girando" size={22} strokeWidth={2} />
            <p>Analisando seus produtos...</p>
          </div>
        )}

        {!analisando && alertasIA.length === 0 && (
          <div className="al-empty">
            <div className="al-empty-icon">
              <Lightbulb size={22} strokeWidth={1.9} />
            </div>
            <p>
              Clique em <strong>Análise IA</strong> para gerar um diagnóstico
              completo, produto por produto.
            </p>
          </div>
        )}

        {alertasIA.map((alerta, i) => {
          const nivel = classeNivel(alerta.nivel);
          return (
            <div
              key={`${alerta.titulo}-${i}`}
              className={`al-card al-card-anim ${nivel}`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="al-card-icon">
                {alerta.produto ? (
                  <Package size={17} strokeWidth={2.2} />
                ) : (
                  <Sparkles size={17} strokeWidth={2.2} />
                )}
              </div>

              <div className="al-card-body">
                <div className="al-card-top">
                  <span className="al-card-title">{alerta.titulo}</span>
                  <span className={`al-badge ${nivel}`}>{alerta.nivel}</span>
                </div>

                {alerta.produto && (
                  <div className="al-card-tag">
                    <Building2 size={12} strokeWidth={2.2} />
                    {alerta.produto}
                  </div>
                )}

                <div className="al-card-desc">{alerta.desc}</div>

                {alerta.acao && (
                  <div className="al-card-action">
                    <ArrowRight size={14} strokeWidth={2.4} />
                    {alerta.acao}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
