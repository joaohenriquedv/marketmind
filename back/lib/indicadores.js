/* ===========================================================
   Indicadores financeiros — fonte única no servidor
   Usado por /admin (painel) e por /dashboard (visão do usuário),
   para que os dois nunca mostrem números diferentes.

   Regra:
   - com produtos: receita e custo variável vêm dos produtos
   - sem produtos: usa receita_mensal e custos_mensais do cadastro
   - o custo fixo (custos_mensais) entra sempre
   =========================================================== */

const db = require("../db");

let cacheColunas = null;

/* O banco pode ter (preco, vendas) ou (preco_venda, vendas_mes) */
async function colunasProdutos() {
  if (cacheColunas) return cacheColunas;

  const [linhas] = await db.query("SHOW COLUMNS FROM produtos");
  cacheColunas = new Map(linhas.map((l) => [l.Field, String(l.Type || "")]));

  return cacheColunas;
}

function camposProduto(cols) {
  return {
    preco: cols.has("preco_venda") ? "preco_venda" : "preco",
    vendas: cols.has("vendas_mes") ? "vendas_mes" : "vendas",
    custo: "preco_custo",
  };
}

function tendenciaParaFront(valor) {
  const s = String(valor || "").toLowerCase();
  if (s.includes("qued")) return "EmQueda";
  if (s.includes("cresc")) return "Crescendo";
  return "Estavel";
}

function tendenciaParaBanco(valor, tipoEnum) {
  const s = String(valor || "").toLowerCase();
  const canonico = s.includes("qued")
    ? "EmQueda"
    : s.includes("cresc")
      ? "Crescendo"
      : "Estavel";

  if (!String(tipoEnum || "").includes("'estavel'")) return canonico;

  return canonico === "EmQueda"
    ? "em_queda"
    : canonico === "Crescendo"
      ? "crescendo"
      : "estavel";
}

/* Linha do banco → formato do front (aceita os dois schemas) */
function normalizarProdutoSaida(p) {
  const preco = Number(p.preco_venda ?? p.preco ?? 0);
  const custo = Number(p.preco_custo ?? p.precoCusto ?? 0);
  const vendas = Number(p.vendas_mes ?? p.vendas ?? 0);

  return {
    id: p.id,
    negocio_id: p.negocio_id,
    nome: p.nome,
    categoria: p.categoria || "",
    preco,
    precoCusto: custo,
    custo,
    vendas,
    receita: preco * vendas,
    tendencia: tendenciaParaFront(p.tendencia),
    estrategico: Boolean(p.estrategico),
  };
}

/* { negocio_id: { receita, custo, itens } } para todos os negócios */
async function mapaProdutosPorNegocio() {
  const cols = await colunasProdutos();
  const mapa = new Map();

  if (!cols.has("negocio_id")) return mapa;

  const c = camposProduto(cols);

  const [linhas] = await db.query(
    `SELECT negocio_id, ${c.preco} AS preco, ${c.vendas} AS vendas, ${c.custo} AS custo FROM produtos`
  );

  linhas.forEach((linha) => {
    const quantidade = Number(linha.vendas) || 0;
    const atual = mapa.get(linha.negocio_id) || { receita: 0, custo: 0, itens: 0 };

    atual.receita += (Number(linha.preco) || 0) * quantidade;
    atual.custo += (Number(linha.custo) || 0) * quantidade;
    atual.itens += 1;

    mapa.set(linha.negocio_id, atual);
  });

  return mapa;
}

/* Negócio + agregado → negócio com receita, custos, lucro e margem */
function enriquecerNegocio(negocio, agregado) {
  const temProdutos = Boolean(agregado && agregado.itens > 0);

  const receita = temProdutos
    ? agregado.receita
    : Number(negocio.receita_mensal) || 0;

  const custoVariavel = temProdutos ? agregado.custo : 0;
  const custoFixo = Number(negocio.custos_mensais) || 0;
  const custos = custoVariavel + custoFixo;
  const lucro = receita - custos;

  return {
    ...negocio,
    total_produtos: agregado?.itens ?? (Number(negocio.total_produtos) || 0),
    receita,
    custos,
    custo_fixo: custoFixo,
    custo_variavel: custoVariavel,
    lucro,
    margem: receita > 0 ? (lucro / receita) * 100 : 0,
    fonte_indicadores: temProdutos ? "produtos" : "cadastro",
  };
}

/* Indicadores de UM negócio a partir da lista de produtos */
function calcularIndicadores(produtos, negocio) {
  const itens = (produtos || []).map((p) => {
    const preco = Number(p.preco) || 0;
    const custo = Number(p.precoCusto ?? p.custo) || 0;
    const vendas = Number(p.vendas) || 0;

    const receita = preco * vendas;
    const custoTotal = custo * vendas;

    return {
      ...p,
      preco,
      custo,
      vendas,
      receita,
      custo_total: custoTotal,
      lucro: receita - custoTotal,
      margem_unit: preco > 0 ? ((preco - custo) / preco) * 100 : 0,
    };
  });

  const receitaProdutos = itens.reduce((s, p) => s + p.receita, 0);
  const custoVariavel = itens.reduce((s, p) => s + p.custo_total, 0);
  const custoFixo = Number(negocio?.custos_mensais) || 0;
  const usaProdutos = itens.length > 0;

  const receita = usaProdutos
    ? receitaProdutos
    : Number(negocio?.receita_mensal) || 0;

  const custos = usaProdutos ? custoVariavel + custoFixo : custoFixo;
  const lucro = receita - custos;
  const unidades = itens.reduce((s, p) => s + p.vendas, 0);

  const ranking = [...itens].sort((a, b) => b.receita - a.receita);

  return {
    fonte: usaProdutos ? "produtos" : "cadastro",
    receita,
    custos,
    custo_fixo: custoFixo,
    custo_variavel: custoVariavel,
    lucro,
    margem: receita > 0 ? (lucro / receita) * 100 : 0,
    ticket_medio: unidades > 0 ? receita / unidades : 0,
    total_produtos: itens.length,
    unidades,
    crescendo: itens.filter((p) => p.tendencia === "Crescendo").length,
    estavel: itens.filter((p) => p.tendencia === "Estavel").length,
    em_queda: itens.filter((p) => p.tendencia === "EmQueda").length,
    estrategicos: itens.filter((p) => p.estrategico).length,
    ranking: ranking.map((p) => ({
      id: p.id,
      nome: p.nome,
      preco: p.preco,
      precoCusto: p.custo,
      vendas: p.vendas,
      receita: p.receita,
      lucro: p.lucro,
      margem_unit: p.margem_unit,
      tendencia: p.tendencia,
      estrategico: p.estrategico,
    })),
  };
}

module.exports = {
  colunasProdutos,
  camposProduto,
  tendenciaParaFront,
  tendenciaParaBanco,
  normalizarProdutoSaida,
  mapaProdutosPorNegocio,
  enriquecerNegocio,
  calcularIndicadores,
};
