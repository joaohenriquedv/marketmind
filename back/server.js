const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const usuariosRoutes = require("./routes/usuarios");
const negociosRoutes = require("./routes/negocios");
const adminRoutes = require("./routes/admin");
const senhaRoutes = require("./routes/senha");

const app = express();

/* Atrás de proxy/túnel/hospedagem, para o IP real chegar nas requisições */
app.set("trust proxy", 1);

/* Front buildado (front/dist) — precisa ser resolvido antes das rotas */
const DIST = path.join(__dirname, "..", "front", "dist");
const SERVIR_FRONT = fs.existsSync(path.join(DIST, "index.html"));
const PREFIXOS_API = ["/usuarios", "/negocios", "/admin", "/senha"];

/* FRONT_URL aceita vários domínios separados por vírgula */
const origensPermitidas = (process.env.FRONT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origem, callback) {
      // requisições sem Origin (curl, apps, server-to-server)
      if (!origem) return callback(null, true);
      return callback(null, origensPermitidas.includes(origem.replace(/\/+$/, "")));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res, next) => {
  // quando o front buildado existe, "/" é servido pelo index.html abaixo
  if (SERVIR_FRONT) return next();
  res.json({ status: "ok", mensagem: "Back MarketMind funcionando" });
});

app.use("/usuarios", usuariosRoutes);
app.use("/negocios", negociosRoutes);
app.use("/admin", adminRoutes);
app.use("/senha", senhaRoutes);

/* ============================================================
   Opcional: servir o front buildado (front/dist) pelo próprio
   Express. Assim site + API ficam no MESMO domínio — sem CORS,
   sem precisar de dois túneis no dia da apresentação.
   Ative com: cd front && npm run build
   ============================================================ */
if (SERVIR_FRONT) {
  app.use(express.static(DIST, { index: false }));

  // Fallback do SPA: qualquer GET que não seja API devolve o index.html
  app.get(/.*/, (req, res, next) => {
    if (PREFIXOS_API.some((p) => req.path.startsWith(p))) return next();
    res.sendFile(path.join(DIST, "index.html"));
  });
}

app.use((req, res) => {
  return res.status(404).json({ erro: "Rota não encontrada." });
});

app.use((error, req, res, next) => {
  console.error("Erro geral no servidor:", error);
  return res.status(500).json({ erro: "Erro interno do servidor." });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Back rodando na porta ${PORT}`);
  console.log(`Origens liberadas no CORS: ${origensPermitidas.join(", ")}`);
  console.log(
    SERVIR_FRONT
      ? "Front buildado detectado em front/dist — servindo site + API no mesmo domínio."
      : "Front buildado NÃO encontrado — rode `npm run build` em front/ para servir o site por aqui."
  );
});
