
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
require("dotenv").config();

const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// Avisa logo na subida se a chave não estiver definida
if (!process.env.GROQ_API_KEY) {
  console.error(
    "❌ GROQ_API_KEY não está definida no .env — o chat não vai funcionar."
  );
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    mensagem: "Chat IA MarketMind funcionando"
  });
});

app.get("/teste-banco", async (req, res) => {
  try {
    const [resultado] = await db.query("SELECT 1 AS conectado");
    res.json({
      status: "ok",
      banco: resultado
    });
  } catch (error) {
    console.error("ERRO BANCO:", error.message);
    res.status(500).json({
      erro: "Erro ao conectar no banco",
      detalhe: error.message
    });
  }
});

app.post("/chat", async (req, res) => {
  const { mensagem, usuario_id } = req.body;

  if (!mensagem) {
    return res.status(400).json({
      erro: "Mensagem é obrigatória"
    });
  }

  // ── 1) CHAMADA À IA (isolada) ──
  let resposta;

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "Você é o assistente da MarketMind. Responda de forma simples e ajude o usuário com dúvidas sobre marketing, vendas, relatórios e empresas."
        },
        {
          role: "user",
          content: mensagem
        }
      ]
    });

    resposta = completion.choices[0].message.content;
  } catch (error) {
    // Mostra o erro REAL da Groq no terminal
    console.error(
      "ERRO GROQ:",
      error?.response?.data || error.message || error
    );

    return res.status(502).json({
      erro:
        error?.response?.data?.error?.message ||
        "Erro ao falar com a IA."
    });
  }

  // ── 2) SALVAR HISTÓRICO (não derruba o chat se o banco falhar) ──
  try {
    await db.query(
      "INSERT INTO conversas (usuario_id, pergunta, resposta) VALUES (?, ?, ?)",
      [usuario_id || "visitante", mensagem, resposta]
    );
  } catch (dbError) {
    console.error(
      "ERRO BANCO (histórico não salvo):",
      dbError.message
    );
  }

  return res.json({ resposta });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Servidor da IA rodando em http://localhost:${PORT}`);
}); 