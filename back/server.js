const express = require("express");
const cors = require("cors");
require("dotenv").config();

const usuariosRoutes = require("./routes/usuarios");
const negociosRoutes = require("./routes/negocios");
const adminRoutes = require("./routes/admin");

const app = express();

// Permite que o React se comunique com o backend
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// Permite receber JSON
app.use(express.json());

// Rota de teste
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    mensagem: "Back MarketMind funcionando"
  });
});

// Rotas da aplicação
app.use("/usuarios", usuariosRoutes);
app.use("/negocios", negociosRoutes);
app.use("/admin", adminRoutes);

// Rota não encontrada
app.use((req, res) => {
  return res.status(404).json({
    erro: "Rota não encontrada."
  });
});

// Tratamento geral de erros
app.use((error, req, res, next) => {
  console.error("Erro geral no servidor:", error);

  return res.status(500).json({
    erro: "Erro interno do servidor."
  });
});

// Porta do servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Back rodando em http://localhost:${PORT}`);
});