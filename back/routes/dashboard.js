/* ===========================================================
   GET /dashboard — payload completo da visão do usuário

   Uma requisição devolve:
     negocios        -> todos os negócios do usuário (com receita/lucro/margem)
     negocio_ativo   -> o selecionado (ou o primeiro)
     produtos        -> produtos do negócio ativo
     indicadores     -> receita, custos, lucro, margem, ticket, ranking...

   Tudo filtrado pelo usuário do token: nunca cruza dados entre contas.
   =========================================================== */

const express = require("express");
const db = require("../db");
const verificarToken = require("../middlewares/verificarToken");
const {
  mapaProdutosPorNegocio,
  enriquecerNegocio,
  normalizarProdutoSaida,
  calcularIndicadores,
} = require("../lib/indicadores");

const router = express.Router();

router.use(verificarToken);

router.get("/", async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const [brutos] = await db.query(
      "SELECT * FROM negocios WHERE usuario_id = ? ORDER BY criado_em DESC",
      [usuarioId]
    );

    const agregados = await mapaProdutosPorNegocio();

    const negocios = brutos.map((n) => enriquecerNegocio(n, agregados.get(n.id)));

    /* qual negócio abrir: o pedido na query, o primeiro da lista */
    const pedido = Number(req.query.negocio_id);

    const negocioAtivo =
      negocios.find((n) => n.id === pedido) || negocios[0] || null;

    let produtos = [];

    if (negocioAtivo) {
      const [linhas] = await db.query(
        "SELECT * FROM produtos WHERE negocio_id = ? ORDER BY id DESC",
        [negocioAtivo.id]
      );

      produtos = linhas.map(normalizarProdutoSaida);
    }

    const indicadores = calcularIndicadores(produtos, negocioAtivo);

    return res.json({
      negocios,
      negocio_ativo: negocioAtivo,
      produtos,
      indicadores,
    });
  } catch (error) {
    console.error("Erro em GET /dashboard:", error);

    return res.status(500).json({ erro: "Erro ao carregar o dashboard." });
  }
});

module.exports = router;
