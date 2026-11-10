
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 3002;
const MODELO = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

app.use(cors());
app.use(express.json());

if (!process.env.GROQ_API_KEY) {
  console.error(
    "\n[ERRO] A variável GROQ_API_KEY não está definida.\n" +
      "Crie um arquivo .env na mesma pasta deste arquivo com:\n\n" +
      "  GROQ_API_KEY=sua_chave_da_groq_aqui\n"
  );
  process.exit(1);
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function extrairJson(texto) {
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    /* tenta achar o JSON dentro do texto */
  }
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio !== -1 && fim > inicio) {
    try {
      return JSON.parse(texto.slice(inicio, fim + 1));
    } catch {
      return null;
    }
  }
  return null;
}

app.get("/", (req, res) => {
  res.json({ ok: true, modelo: MODELO });
});

/* ===============================
   CHAT
================================ */
app.post("/chat", async (req, res) => {
  const { mensagem } = req.body || {};

  if (!mensagem || !String(mensagem).trim()) {
    return res.status(400).json({ erro: "A mensagem não pode estar vazia." });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: MODELO,
      messages: [
        {
          role: "system",
          content:
            "Você é o MarketMind Bot, assistente de análise de mercado. " +
            "Responda em português, de forma clara e objetiva.",
        },
        { role: "user", content: String(mensagem) },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const resposta =
      completion?.choices?.[0]?.message?.content ||
      "Desculpe, não consegui gerar uma resposta.";

    return res.json({ resposta });
  } catch (error) {
    const status = error?.status || error?.response?.status || 500;
    console.error(`[chat] Falha (status ${status}):`, error?.message);

    if (status === 401) {
      return res.status(401).json({ erro: "Chave da Groq inválida." });
    }
    if (status === 429) {
      return res.status(429).json({ erro: "Limite de uso da Groq atingido." });
    }
    return res.status(500).json({ erro: "Erro ao consultar a IA." });
  }
});

/* ===============================
   RELATÓRIO (gera a análise para o PDF)
================================ */
app.post("/relatorio", async (req, res) => {
  const { titulo, tipo, empresa, periodo, regiao, observacoes } = req.body || {};

  if (!titulo || !empresa) {
    return res.status(400).json({ erro: "Título e empresa são obrigatórios." });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: MODELO,
      temperature: 0.5,
      max_tokens: 1400,
      messages: [
        {
          role: "system",
          content:
            "Você é um analista de mercado sênior. Escreva em português do Brasil. " +
            "Responda APENAS com um JSON válido no formato: " +
            '{"resumo": string, "pontos_melhoria": string[], "recomendacoes_crescimento": string[]}.',
        },
        {
          role: "user",
          content:
            `Gere a análise para este relatório:\n` +
            `Título: ${titulo}\nTipo: ${tipo || "-"}\nEmpresa: ${empresa}\n` +
            `Período: ${periodo || "-"}\nRegião: ${regiao || "-"}\n` +
            `Observações: ${observacoes || "-"}`,
        },
      ],
    });

    const texto = completion?.choices?.[0]?.message?.content || "";
    const analise = extrairJson(texto) || {
      resumo: texto || "Não foi possível gerar a análise.",
      pontos_melhoria: [],
      recomendacoes_crescimento: [],
    };

    return res.json({
      resumo: analise.resumo || "",
      pontos_melhoria: Array.isArray(analise.pontos_melhoria)
        ? analise.pontos_melhoria
        : [],
      recomendacoes_crescimento: Array.isArray(analise.recomendacoes_crescimento)
        ? analise.recomendacoes_crescimento
        : [],
    });
  } catch (error) {
    const status = error?.status || error?.response?.status || 500;
    console.error(`[relatorio] Falha (status ${status}):`, error?.message);
    return res
      .status(500)
      .json({ erro: "Não foi possível gerar a análise agora." });
  }
});

/* ===============================
   ALERTAS (um alerta por produto)
================================ */
app.post("/alertas", async (req, res) => {
  const { negocio, produtos } = req.body || {};
  const lista = Array.isArray(produtos) ? produtos : [];

  if (lista.length === 0 && !negocio?.nome) {
    return res
      .status(400)
      .json({ erro: "Envie os dados do negócio ou ao menos um produto." });
  }

  const resumoProdutos = lista.map((p) => ({
    nome: p.nome,
    categoria: p.categoria || undefined,
    preco: p.preco,
    custo: p.custo,
    vendasMes: p.vendas,
    tendencia: p.tendencia,
    estrategico: p.estrategico || undefined,
    margemPercentual:
      p.preco > 0 ? Number((((p.preco - p.custo) / p.preco) * 100).toFixed(1)) : null,
  }));

  try {
    const completion = await groq.chat.completions.create({
      model: MODELO,
      temperature: 0.45,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content:
            "Você é um analista de negócios sênior do MarketMind. Escreva em português do Brasil, " +
            "com linguagem simples e direta para um pequeno empreendedor. " +
            "Responda APENAS com um JSON válido, sem texto fora do JSON, no formato exato: " +
            '{"alertas":[{"titulo": string, "nivel": "Crítico" | "Atenção" | "Oportunidade", ' +
            '"produto": string, "desc": string, "acao": string}]}. ' +
            "Regras: gere UM alerta para CADA produto da lista (o campo 'produto' deve ter o nome exato do produto). " +
            "Use 'Crítico' quando houver prejuízo ou risco claro, 'Atenção' para pontos que precisam de ajuste " +
            "e 'Oportunidade' para produtos saudáveis que podem crescer. " +
            "'desc' deve ter 1 a 2 frases explicando o motivo com base nos números, e 'acao' uma recomendação prática. " +
            "No máximo 2 alertas extras (com 'produto' vazio) sobre a estratégia geral do negócio.",
        },
        {
          role: "user",
          content:
            `Negócio: ${negocio?.nome || "-"} ` +
            `(segmento: ${negocio?.segmento || "-"}, localização: ${negocio?.localizacao || "-"}, ` +
            `custos mensais: R$ ${negocio?.custos_mensais || 0}).\n\n` +
            `Produtos (JSON):\n${JSON.stringify(resumoProdutos, null, 2)}\n\n` +
            "Gere os alertas com base nesses dados reais.",
        },
      ],
    });

    const texto = completion?.choices?.[0]?.message?.content || "";
    const dados = extrairJson(texto);

    const alertas = Array.isArray(dados?.alertas)
      ? dados.alertas.map((a) => ({
          titulo: a.titulo || "Alerta",
          nivel: a.nivel || "Atenção",
          produto: a.produto || "",
          desc: a.desc || "",
          acao: a.acao || "",
        }))
      : [];

    return res.json({ alertas });
  } catch (error) {
    const status = error?.status || error?.response?.status || 500;
    console.error(`[alertas] Falha (status ${status}):`, error?.message);

    if (status === 401) {
      return res.status(401).json({ erro: "Chave da Groq inválida." });
    }
    if (status === 429) {
      return res.status(429).json({ erro: "Limite de uso da Groq atingido." });
    }
    return res.status(500).json({ erro: "Não foi possível gerar os alertas." });
  }
});

app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

process.on("unhandledRejection", (motivo) => {
  console.error("[unhandledRejection]", motivo);
});
process.on("uncaughtException", (erro) => {
  console.error("[uncaughtException]", erro);
});

app.listen(PORT, () => {
  console.log(`Servidor do chat rodando em http://localhost:${PORT}`);
  console.log(`Modelo: ${MODELO}`);
});
