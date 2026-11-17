/* ===========================================================
   MarketMind — serviço de relatório com IA (Node/Express)
   Roda sozinho:  node server-relatorio.js
   Ou monte no seu servidor atual:  app.use(require("./server-relatorio").router)

   Provedores (escolha UM no .env):
     OPENAI_API_KEY=sk-...                      -> OpenAI
     LLM_BASE_URL=https://api.groq.com/openai/v1 + LLM_API_KEY=...  -> compatível
     GEMINI_API_KEY=...                         -> Google Gemini
     OLLAMA_URL=http://localhost:11434          -> Ollama local

   Opcionais: LLM_MODEL, RELATORIO_PORT (padrão 3003), LLM_TIMEOUT_MS
   =========================================================== */

const path = require("path");

/* Lê sempre o .env desta pasta, mesmo rodando o node de outro lugar */
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

const app = express();
const router = express.Router();

const PORT = Number(process.env.RELATORIO_PORT) || 3003;
const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 45000;
const MODELO_PADRAO = "gpt-4o-mini";

const SISTEMA = `Você é o analista de negócios do MarketMind, especialista em pequenos
negócios brasileiros. Recebe os produtos reais de um negócio (preço de venda, preço de
custo, vendas mensais, tendência, se é estratégico) e os indicadores já calculados.

Escreva em português do Brasil, direto e concreto, sem jargão de consultoria.
Use SOMENTE os números recebidos. Se um dado faltar, diga o que falta em vez de estimar.
Cada recomendação deve citar um produto ou um número do relatório e dizer o porquê.

Responda SOMENTE com JSON válido neste formato:
{
  "resumo": "3 a 5 frases sobre a situação do negócio",
  "pontos_melhoria": ["3 a 4 frases curtas"],
  "recomendacoes_crescimento": ["3 a 5 frases curtas, da mais urgente para a menos"],
  "recomendacoes": [
    {"prioridade": "alta|media|baixa", "titulo": "ação curta", "descricao": "porquê e como"}
  ]
}
Nada de texto fora do JSON.`;

/* ───────── provedor ───────── */

function provedorAtivo() {
  if (process.env.LLM_BASE_URL) return "compat";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OLLAMA_URL) return "ollama";
  return null;
}

function modeloAtivo() {
  return process.env.LLM_MODEL || (provedorAtivo() === "gemini" ? "gemini-1.5-flash" : MODELO_PADRAO);
}

async function postJson(url, corpo, headers = {}) {
  const controlador = new AbortController();
  const timer = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(corpo),
      signal: controlador.signal,
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => "");
      throw new Error(`HTTP ${resposta.status} — ${detalhe.slice(0, 300)}`);
    }

    return await resposta.json();
  } catch (erro) {
    if (erro.name === "AbortError") {
      throw new Error("O provedor de IA demorou demais para responder.");
    }
    throw erro;
  } finally {
    clearTimeout(timer);
  }
}

async function chamarLLM(mensagemUsuario) {
  const provedor = provedorAtivo();

  if (provedor === "openai" || provedor === "compat") {
    const base = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
    const chave = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;

    const dados = await postJson(
      `${base}/chat/completions`,
      {
        model: modeloAtivo(),
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SISTEMA },
          { role: "user", content: mensagemUsuario },
        ],
      },
      { Authorization: `Bearer ${chave}` }
    );

    return dados?.choices?.[0]?.message?.content || "";
  }

  if (provedor === "gemini") {
    const modelo = modeloAtivo();
    const dados = await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        systemInstruction: { parts: [{ text: SISTEMA }] },
        contents: [{ role: "user", parts: [{ text: mensagemUsuario }] }],
        generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
      }
    );

    const partes = dados?.candidates?.[0]?.content?.parts || [];
    return partes.map((p) => p.text || "").join("");
  }

  if (provedor === "ollama") {
    const base = process.env.OLLAMA_URL.replace(/\/+$/, "");
    const dados = await postJson(`${base}/api/chat`, {
      model: modeloAtivo(),
      stream: false,
      format: "json",
      messages: [
        { role: "system", content: SISTEMA },
        { role: "user", content: mensagemUsuario },
      ],
    });

    return dados?.message?.content || "";
  }

  throw new Error(
    "Nenhum provedor de IA configurado (OPENAI_API_KEY, LLM_BASE_URL, GEMINI_API_KEY ou OLLAMA_URL)."
  );
}

/* ───────── prompt ───────── */

function moeda(valor) {
  return `R$ ${Number(valor || 0).toFixed(2)}`;
}

function montarMensagem(payload = {}) {
  const negocio = payload.negocio || {};
  const ind = payload.indicadores || {};
  const produtos = Array.isArray(payload.produtos) ? payload.produtos : [];

  const linhas = [
    `Título pedido: ${payload.titulo || "não informado"}`,
    `Tipo de relatório: ${payload.tipo || "não informado"}`,
    `Empresa: ${payload.empresa || negocio.nome || "não informada"}`,
    `Período: ${payload.periodo || "não informado"}`,
    `Região: ${payload.regiao || negocio.localizacao || "não informada"}`,
  ];

  if (payload.observacoes) {
    linhas.push(`Observações do usuário: ${payload.observacoes}`);
  }

  linhas.push(
    "",
    `Segmento: ${negocio.segmento || "não informado"}`,
    `Funcionários: ${negocio.funcionarios ?? 0}`,
    `Anos de mercado: ${negocio.anos_mercado ?? 0}`,
    `Custos fixos mensais: ${moeda(negocio.custos_mensais)}`,
    "",
    "Indicadores calculados:",
    `- receita: ${moeda(ind.receita)}`,
    `- custos totais: ${moeda(ind.custos)}`,
    `- lucro: ${moeda(ind.lucro)}`,
    `- margem: ${Number(ind.margem || 0).toFixed(1)}%`,
    `- ticket médio: ${moeda(ind.ticket_medio)}`,
    `- produtos ativos: ${ind.produtos_ativos ?? produtos.length}`,
    `- em crescimento: ${ind.crescendo ?? 0}`,
    `- em queda: ${ind.em_queda ?? 0}`,
    "",
    "Produtos (nome | preço | custo | vendas/mês | tendência | estratégico):"
  );

  if (produtos.length === 0) {
    linhas.push("(nenhum produto cadastrado)");
  }

  produtos.forEach((p) => {
    linhas.push(
      [
        p.nome || "?",
        moeda(p.preco),
        moeda(p.precoCusto),
        p.vendas ?? 0,
        p.tendencia || "Estavel",
        p.estrategico ? "sim" : "não",
      ].join(" | ")
    );
  });

  return linhas.join("\n");
}

/* ───────── parsing tolerante ───────── */

function extrairJSON(texto) {
  const limpo = String(texto || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(limpo);
  } catch {
    /* tenta recortar o primeiro objeto */
  }

  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");

  if (inicio >= 0 && fim > inicio) {
    try {
      return JSON.parse(limpo.slice(inicio, fim + 1));
    } catch {
      return null;
    }
  }

  return null;
}

function textos(valor) {
  if (!Array.isArray(valor)) return [];

  return valor
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return item.texto || item.descricao || item.titulo || "";
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 8);
}

function normalizar(dados, bruto) {
  if (!dados) {
    /* modelo devolveu texto puro: vira resumo em vez de quebrar a tela */
    return {
      resumo: String(bruto || "").trim(),
      pontos_melhoria: [],
      recomendacoes_crescimento: [],
      pontos_fortes: [],
      riscos: [],
      recomendacoes: [],
    };
  }

  const pontos = textos(dados.pontos_melhoria || dados.pontos_fortes);
  const recomendacoesTexto = textos(
    dados.recomendacoes_crescimento || dados.recomendacoes
  );

  const recomendacoes = (Array.isArray(dados.recomendacoes) ? dados.recomendacoes : [])
    .filter((r) => r && typeof r === "object")
    .slice(0, 8)
    .map((r) => ({
      prioridade: String(r.prioridade || "media").toLowerCase(),
      titulo: String(r.titulo || "").trim(),
      descricao: String(r.descricao || "").trim(),
    }));

  return {
    resumo: String(dados.resumo || dados.resumo_executivo || "").trim(),
    pontos_melhoria: pontos,
    recomendacoes_crescimento: recomendacoesTexto,
    pontos_fortes: pontos,
    riscos: textos(dados.riscos || dados.alertas),
    recomendacoes,
  };
}

/* ───────── rotas ───────── */

router.get("/relatorio/saude", (req, res) => {
  const provedor = provedorAtivo();

  res.json({
    ok: Boolean(provedor),
    provedor,
    modelo: provedor ? modeloAtivo() : null,
    mensagem: provedor
      ? "Serviço de relatório pronto."
      : "Configure OPENAI_API_KEY, LLM_BASE_URL, GEMINI_API_KEY ou OLLAMA_URL no .env.",
  });
});

router.post("/relatorio", async (req, res) => {
  if (!provedorAtivo()) {
    return res.status(503).json({
      erro: "Nenhum provedor de IA configurado no serviço de relatório.",
    });
  }

  try {
    const bruto = await chamarLLM(montarMensagem(req.body));
    const dados = extrairJSON(bruto);

    return res.json(normalizar(dados, bruto));
  } catch (erro) {
    console.error("Erro em /relatorio:", erro.message);

    const emProducao = process.env.NODE_ENV === "production";

    return res.status(502).json({
      erro: emProducao
        ? "Não foi possível gerar a análise agora."
        : `Falha na IA: ${erro.message}`,
    });
  }
});

/* ───────── servidor ───────── */

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(router);

if (require.main === module) {
  app.listen(PORT, () => {
    const provedor = provedorAtivo();

    console.log(`Serviço de relatório na porta ${PORT}`);
    console.log(
      provedor
        ? `Provedor de IA: ${provedor} (modelo ${modeloAtivo()})`
        : "ATENÇÃO: nenhum provedor de IA configurado — /relatorio responderá 503."
    );
  });
}

module.exports = { app, router };
