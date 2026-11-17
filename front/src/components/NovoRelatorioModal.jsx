import { useEffect, useMemo, useState } from "react";
import {
  X,
  Sparkles,
  Building2,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Database,
} from "lucide-react";
import "./NovoRelatorioModal.css";
import { listarNegociosUsuario, listarProdutos } from "../api";
import { gerarPdf } from "../utils/relatorioPdf";

/* Serviço de IA: usa VITE_IA_URL se existir (Node), senão o serviço do chat */
const IA_URL = (
  import.meta.env.VITE_IA_URL ||
  import.meta.env.VITE_CHAT_URL ||
  "http://localhost:3002"
).replace(/\/+$/, "");

const TIPOS = [
  "Diagnóstico de Produtos",
  "Análise de Mercado",
  "Análise de Concorrência",
  "Monitoramento de Tendências",
  "Diagnóstico de Crescimento",
  "Comparativo de Empresas",
  "Outro",
];

const ETAPAS = [
  "Lendo seus produtos e indicadores...",
  "Consultando a análise de IA...",
  "Montando o PDF...",
];

/* ───────── utilidades ───────── */

function formatarBRL(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarPct(valor) {
  return `${Number(valor || 0).toFixed(1)}%`;
}

function formatarPeriodo(inicio, fim) {
  const fmt = (v) => (v ? v.split("-").reverse().join("/") : "");
  if (inicio && fim) return `${fmt(inicio)} a ${fmt(fim)}`;
  if (inicio) return `A partir de ${fmt(inicio)}`;
  if (fim) return `Até ${fmt(fim)}`;
  return "Não informado";
}

function normalizarLista(dados) {
  if (!dados) return [];
  const l = Array.isArray(dados)
    ? dados
    : dados.negocios || dados.data || dados.lista || [];
  return Array.isArray(l) ? l : [];
}

function normalizarTendencia(valor) {
  const s = String(valor || "").toLowerCase();
  if (s.includes("qued")) return "EmQueda";
  if (s.includes("cresc")) return "Crescendo";
  return "Estavel";
}

function normalizarProduto(p) {
  return {
    id: p?.id,
    nome: p?.nome ?? "Produto",
    categoria: p?.categoria ?? "",
    preco: Number(p?.preco ?? p?.preco_venda ?? 0),
    precoCusto: Number(p?.precoCusto ?? p?.preco_custo ?? p?.custo ?? 0),
    vendas: Number(p?.vendas ?? p?.vendas_mes ?? 0),
    tendencia: normalizarTendencia(p?.tendencia),
    estrategico: Boolean(p?.estrategico),
  };
}

function calcularIndicadores(produtos, negocio) {
  const itens = produtos.map((p) => {
    const receita = p.preco * p.vendas;
    const custo = p.precoCusto * p.vendas;
    return {
      ...p,
      receita,
      custo,
      lucro: receita - custo,
      margemUnit: p.preco > 0 ? ((p.preco - p.precoCusto) / p.preco) * 100 : 0,
    };
  });

  const receita = itens.reduce((s, p) => s + p.receita, 0);
  const custoVariavel = itens.reduce((s, p) => s + p.custo, 0);
  const custoFixo = Number(negocio?.custos_mensais) || 0;
  const custos = custoVariavel + custoFixo;
  const lucro = receita - custos;
  const unidades = itens.reduce((s, p) => s + p.vendas, 0);

  return {
    itens,
    ranking: [...itens].sort((a, b) => b.receita - a.receita),
    receita,
    custos,
    lucro,
    margem: receita > 0 ? (lucro / receita) * 100 : 0,
    total: itens.length,
    unidades,
    ticket: unidades > 0 ? receita / unidades : 0,
    crescendo: itens.filter((p) => p.tendencia === "Crescendo").length,
    emQueda: itens.filter((p) => p.tendencia === "EmQueda").length,
    estrategicos: itens.filter((p) => p.estrategico).length,
  };
}

/* análise usada quando a IA não responde — o PDF nunca sai vazio */
function analiseFallback(dados, ind) {
  const local = dados.regiao ? ` na região de ${dados.regiao}` : "";
  const melhor = ind.ranking?.[0];

  if (!ind.total) {
    return {
      origem: "local",
      resumo:
        `Este relatório (${dados.tipo}) de ${dados.empresa}${local} ainda não tem produtos ` +
        `cadastrados. Sem produtos com preço e vendas, não é possível calcular receita, ` +
        `margem e tendência. Cadastre os produtos para que a análise traga números reais.`,
      pontos_melhoria: [
        "Cadastrar os produtos vendidos, com preço de custo, preço de venda e vendas por mês.",
        "Marcar como estratégicos os itens que sustentam o posicionamento do negócio.",
        "Atualizar as vendas mensalmente para que a tendência reflita a realidade.",
      ],
      recomendacoes_crescimento: [
        "Começar pelo produto de maior giro: os dados dele já permitem decisões úteis.",
        "Revisar a precificação a partir da margem unitária de cada item.",
        "Reabrir este relatório após cadastrar os produtos para obter o diagnóstico completo.",
      ],
    };
  }

  return {
    origem: "local",
    resumo:
      `${dados.tipo} de ${dados.empresa}${local}, em ${dados.periodo}. ` +
      `Com ${ind.total} produto(s) e ${ind.unidades} unidade(s) vendidas no período, a receita ` +
      `estimada é de ${formatarBRL(ind.receita)} e o lucro de ${formatarBRL(ind.lucro)}, ` +
      `com margem de ${formatarPct(ind.margem)}. ` +
      (melhor
        ? `"${melhor.nome}" é o principal gerador de receita (${formatarBRL(melhor.receita)}).`
        : ""),
    pontos_melhoria: [
      ind.emQueda > 0
        ? `${ind.emQueda} produto(s) em queda de tendência exigem revisão de preço ou exposição.`
        : "Nenhum produto em queda — a base está estável.",
      ind.margem < 20
        ? "Margem geral baixa: revisar custo unitário e mix de vendas."
        : "Margem geral saudável, com espaço para ampliar volume.",
      ind.estrategicos === 0
        ? "Nenhum produto marcado como estratégico: falta clareza sobre o que priorizar."
        : `${ind.estrategicos} produto(s) estratégicos sustentam o posicionamento.`,
      `Ticket médio de ${formatarBRL(ind.ticket)} — oportunidade clara de venda combinada (combos/upsell).`,
    ],
    recomendacoes_crescimento: [
      melhor
        ? `Concentrar estoque e divulgação em "${melhor.nome}": é onde o retorno por real investido é maior.`
        : "Concentrar esforços no produto de maior receita.",
      ind.emQueda > 0
        ? "Agir nos produtos em queda nas próximas 2 semanas, antes que a receita caia."
        : "Manter a cadência de acompanhamento para detectar quedas cedo.",
      ind.margem < 25
        ? "Renegociar fornecedores ou ajustar preço entre 5% e 8% nos itens de menor margem."
        : "Avaliar aumento de preço nos itens com maior demanda e menor elasticidade.",
      "Definir meta mensal de receita e revisar os números a cada quinze dias.",
    ],
  };
}

/* aceita as duas convenções de resposta do serviço de IA */
function normalizarAnalise(dados, dadosForm, ind) {
  const fallback = analiseFallback(dadosForm, ind);
  if (!dados) return fallback;

  const base = typeof dados === "string" ? { resumo: dados } : dados;
  const conteudo = base.relatorio || base.resultado || base;

  const listaTexto = (valor) => {
    if (!Array.isArray(valor)) return [];
    return valor
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.texto || item?.descricao || item?.titulo || ""
      )
      .filter(Boolean);
  };

  const analise = {
    origem: "ia",
    resumo: conteudo.resumo || conteudo.resumo_executivo || fallback.resumo,
    pontos_melhoria: listaTexto(
      conteudo.pontos_melhoria || conteudo.pontos_fortes || conteudo.forcas
    ),
    recomendacoes_crescimento: listaTexto(
      conteudo.recomendacoes_crescimento ||
        conteudo.recomendacoes ||
        conteudo.acoes
    ),
  };

  if (analise.pontos_melhoria.length === 0) {
    analise.pontos_melhoria = fallback.pontos_melhoria;
  }
  if (analise.recomendacoes_crescimento.length === 0) {
    analise.recomendacoes_crescimento = fallback.recomendacoes_crescimento;
  }

  return analise;
}

/* ───────── modal ───────── */

export default function NovoRelatorioModal({ aberto, onFechar }) {
  const [negocios, setNegocios] = useState([]);
  const [negocioId, setNegocioId] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [empresa, setEmpresa] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [regiao, setRegiao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [etapa, setEtapa] = useState(0);
  const [erro, setErro] = useState("");

  const negocioAtivo = useMemo(
    () => negocios.find((n) => n.id === negocioId) || negocios[0] || null,
    [negocios, negocioId]
  );

  const ind = useMemo(
    () => calcularIndicadores(produtos, negocioAtivo),
    [produtos, negocioAtivo]
  );

  /* carrega negócios + produtos do banco ao abrir */
  useEffect(() => {
    if (!aberto) return undefined;

    let montado = true;

    (async () => {
      try {
        const lista = normalizarLista(await listarNegociosUsuario());
        if (!montado) return;

        setNegocios(lista);

        let local = null;
        try {
          local = JSON.parse(localStorage.getItem("negocio") || "null");
        } catch {
          local = null;
        }

        const escolhido = lista.find((n) => n.id === local?.id) || lista[0] || null;

        if (escolhido) {
          setNegocioId(escolhido.id);
          setEmpresa(escolhido.nome || "");
          setRegiao(escolhido.localizacao || "");
          setTitulo((atual) => atual || `Relatório de desempenho — ${escolhido.nome}`);

          const itens = await listarProdutos(escolhido.id);
          if (montado) {
            setProdutos(Array.isArray(itens) ? itens.map(normalizarProduto) : []);
          }
        }
      } catch {
        /* segue sem dados: o relatório ainda pode ser gerado */
      } finally {
        if (montado) setCarregandoDados(false);
      }
    })();

    return () => {
      montado = false;
    };
  }, [aberto]);

  /* Esc fecha */
  useEffect(() => {
    if (!aberto) return undefined;

    function onKey(e) {
      if (e.key === "Escape" && !carregando) onFechar();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto, carregando, onFechar]);

  if (!aberto) return null;

  async function handleGerar(event) {
    event.preventDefault();
    if (carregando) return;

    if (!titulo.trim() || !empresa.trim()) {
      setErro("Preencha pelo menos o título e a empresa.");
      return;
    }

    setErro("");
    setCarregando(true);
    setEtapa(0);

    const dados = {
      titulo: titulo.trim(),
      tipo,
      empresa: empresa.trim(),
      periodo: formatarPeriodo(inicio, fim),
      regiao: regiao.trim() || "Não informada",
      observacoes: observacoes.trim(),
    };

    let analise;

    try {
      setEtapa(1);

      const resposta = await fetch(`${IA_URL}/relatorio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dados,
          negocio: negocioAtivo,
          produtos,
          periodo_dias: inicio && fim ? null : 30,
          indicadores: {
            receita: ind.receita,
            custos: ind.custos,
            lucro: ind.lucro,
            margem: ind.margem,
            produtos_ativos: ind.total,
            em_queda: ind.emQueda,
            crescendo: ind.crescendo,
            ticket_medio: ind.ticket,
          },
        }),
      });

      if (!resposta.ok) throw new Error(`Servidor retornou ${resposta.status}`);

      analise = normalizarAnalise(await resposta.json(), dados, ind);
    } catch (error) {
      console.warn("IA indisponível, usando análise local:", error);
      analise = analiseFallback(dados, ind);
    }

    try {
      setEtapa(2);
      gerarPdf(dados, analise, ind);
      onFechar();
    } catch (error) {
      setErro(`Não foi possível gerar o PDF. (${error.message || "erro"})`);
    } finally {
      setCarregando(false);
      setEtapa(0);
    }
  }

  return (
    <div
      className="relatorio-overlay"
      onClick={() => !carregando && onFechar()}
      role="presentation"
    >
      <div
        className="relatorio-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Novo relatório"
      >
        <div className="relatorio-header">
          <div className="relatorio-header-texto">
            <h2>Novo relatório</h2>
            <p>A IA analisa seus produtos reais e monta o PDF</p>
          </div>

          <button
            type="button"
            className="relatorio-fechar"
            onClick={() => !carregando && onFechar()}
            aria-label="Fechar"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        <form className="relatorio-form" onSubmit={handleGerar}>
          {erro && (
            <div className="relatorio-erro" role="alert">
              <AlertCircle size={16} strokeWidth={2.2} />
              {erro}
            </div>
          )}

          {/* contexto: o que a IA vai ler */}
          <div className="relatorio-contexto">
            <div className="relatorio-contexto-topo">
              <Database size={15} strokeWidth={2.2} />
              <span>Dados que a IA vai analisar</span>
              {carregandoDados && (
                <Loader2 className="relatorio-girando" size={14} strokeWidth={2.4} />
              )}
            </div>

            <div className="relatorio-contexto-grade">
              <label className="relatorio-contexto-item">
                <Building2 size={14} strokeWidth={2} />
                <div>
                  <span>Negócio</span>
                  {negocios.length > 1 ? (
                    <select
                      value={negocioId ?? ""}
                      onChange={(e) => setNegocioId(Number(e.target.value))}
                      disabled={carregando}
                    >
                      {negocios.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.nome}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <strong>{negocioAtivo?.nome || "Nenhum negócio"}</strong>
                  )}
                </div>
              </label>

              <div className="relatorio-contexto-item">
                <Package size={14} strokeWidth={2} />
                <div>
                  <span>Produtos</span>
                  <strong>{ind.total}</strong>
                </div>
              </div>

              <div className="relatorio-contexto-item">
                <TrendingUp size={14} strokeWidth={2} />
                <div>
                  <span>Receita / margem</span>
                  <strong>
                    {formatarBRL(ind.receita)} · {formatarPct(ind.margem)}
                  </strong>
                </div>
              </div>
            </div>

            {!carregandoDados && ind.total === 0 && (
              <p className="relatorio-contexto-aviso">
                Nenhum produto cadastrado — o relatório explicará o que falta em vez
                de inventar números.
              </p>
            )}
          </div>

          <div className="relatorio-grid">
            <div className="relatorio-campo full">
              <label htmlFor="rel-titulo">Título do relatório *</label>
              <input
                id="rel-titulo"
                type="text"
                placeholder="Ex.: Panorama do setor de varejo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                disabled={carregando}
              />
            </div>

            <div className="relatorio-campo">
              <label htmlFor="rel-tipo">Tipo</label>
              <select
                id="rel-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                disabled={carregando}
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="relatorio-campo">
              <label htmlFor="rel-empresa">Empresa *</label>
              <input
                id="rel-empresa"
                type="text"
                placeholder="Ex.: MarketMind Tecnologia"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                disabled={carregando}
              />
            </div>

            <div className="relatorio-campo">
              <label htmlFor="rel-inicio">Início do período</label>
              <input
                id="rel-inicio"
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                disabled={carregando}
              />
            </div>

            <div className="relatorio-campo">
              <label htmlFor="rel-fim">Fim do período</label>
              <input
                id="rel-fim"
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                disabled={carregando}
              />
            </div>

            <div className="relatorio-campo full">
              <label htmlFor="rel-regiao">Região</label>
              <input
                id="rel-regiao"
                type="text"
                placeholder="Ex.: Sudeste, Brasil"
                value={regiao}
                onChange={(e) => setRegiao(e.target.value)}
                disabled={carregando}
              />
            </div>

            <div className="relatorio-campo full">
              <label htmlFor="rel-observacoes">Observações</label>
              <textarea
                id="rel-observacoes"
                placeholder="Contexto, objetivos ou pontos que a análise deve considerar..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                disabled={carregando}
              />
            </div>
          </div>

          {carregando && (
            <div className="relatorio-progresso" aria-live="polite">
              {ETAPAS.map((nome, i) => (
                <div
                  key={nome}
                  className={`relatorio-etapa ${i < etapa ? "concluida" : ""} ${
                    i === etapa ? "atual" : ""
                  }`}
                >
                  {i < etapa ? (
                    <CheckCircle2 size={14} strokeWidth={2.4} />
                  ) : i === etapa ? (
                    <Loader2 className="relatorio-girando" size={14} strokeWidth={2.4} />
                  ) : (
                    <span className="relatorio-etapa-bola" />
                  )}
                  {nome}
                </div>
              ))}
            </div>
          )}

          <div className="relatorio-acoes">
            <button
              type="button"
              className="btn-cancelar"
              onClick={onFechar}
              disabled={carregando}
            >
              Cancelar
            </button>

            <button type="submit" className="btn-gerar" disabled={carregando}>
              {carregando ? (
                <>
                  <Loader2 className="relatorio-girando" size={15} strokeWidth={2.4} />
                  {ETAPAS[etapa]}
                </>
              ) : (
                <>
                  <Sparkles size={15} strokeWidth={2.2} />
                  Gerar com IA e baixar PDF
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
