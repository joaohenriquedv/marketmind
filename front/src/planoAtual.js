/* planoAtual.js — catálogo de planos + plano salvo no navegador. */
export const CHAVE_PLANO = "mm_plano_atual";

export const PLANOS = [
  {
    id: "essencial",
    nome: "Essencial",
    nomeCompleto: "MarketMind Essencial",
    descricao: "Para quem está começando a acompanhar o mercado.",
    mensal: 129,
    anual: 103,
    recursos: [
      "1 negócio monitorado",
      "3 relatórios por mês",
      "Dashboard básico",
      "Alertas por e-mail",
      "Suporte por e-mail",
    ],
  },
  {
    id: "pro",
    nome: "Pro",
    nomeCompleto: "MarketMind Pro",
    descricao: "Acesso a todos os recursos e funcionalidades premium.",
    mensal: 297,
    anual: 238,
    destaque: true,
    recursos: [
      "5 negócios monitorados",
      "Relatórios ilimitados",
      "Dashboard completo e comparativos",
      "Alertas de mercado em tempo real",
      "Análise de concorrentes",
      "Suporte prioritário",
    ],
  },
  {
    id: "business",
    nome: "Business",
    nomeCompleto: "MarketMind Business",
    descricao: "Para operações com vários times e dados consolidados.",
    mensal: 597,
    anual: 478,
    recursos: [
      "Negócios e usuários ilimitados",
      "Tudo do plano Pro",
      "Relatórios consolidados por setor",
      "Exportação em PDF/Excel e API",
      "Gerente de conta dedicado",
    ],
  },
];

const PADRAO = { id: "pro", ciclo: "mensal", status: "ativo" };

export function formatarBRL(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function buscarPlano(id) {
  return PLANOS.find((p) => p.id === id) || PLANOS[1];
}

function somarDias(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function descreverPlano(dados) {
  const base = buscarPlano(dados?.id);
  const ciclo = dados?.ciclo === "anual" ? "anual" : "mensal";
  const status = dados?.status === "inativo" ? "inativo" : "ativo";
  const preco = ciclo === "anual" ? base.anual : base.mensal;

  return {
    ...base,
    ciclo,
    status,
    preco,
    precoTexto: `${formatarBRL(preco)}/mês`,
    totalTexto:
      ciclo === "anual"
        ? `${formatarBRL(base.anual * 12)} por ano`
        : `${formatarBRL(base.mensal)} por mês`,
    cicloRotulo: ciclo === "anual" ? "Cobrança anual" : "Cobrança mensal",
    statusRotulo: status === "ativo" ? "Ativo" : "Inativo",
    economia: Math.round((1 - base.anual / base.mensal) * 100),
    proximaCobranca: somarDias(ciclo === "anual" ? 365 : 30),
  };
}

export function lerPlano() {
  try {
    const raw = localStorage.getItem(CHAVE_PLANO);
    return descreverPlano(raw ? JSON.parse(raw) : PADRAO);
  } catch {
    return descreverPlano(PADRAO);
  }
}

export function salvarPlano({ id, ciclo }) {
  const dados = {
    id: buscarPlano(id).id,
    ciclo: ciclo === "anual" ? "anual" : "mensal",
    status: "ativo",
  };

  try {
    localStorage.setItem(CHAVE_PLANO, JSON.stringify(dados));
  } catch {
    /* se o storage falhar, a tela ainda reflete a escolha */
  }

  return descreverPlano(dados);
}