const express = require("express");
const db = require("../db");

const verificarToken = require("../middlewares/verificarToken");
const verificarAdmin = require("../middlewares/verificarAdmin");

const router = express.Router();

// Todas as rotas abaixo exigem login e usuário administrador
router.use(verificarToken);
router.use(verificarAdmin);

// RESUMO DO DASHBOARD
router.get("/resumo", async (req, res) => {
  try {
    const [resultado] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM usuarios) AS total_usuarios,

        (
          SELECT COUNT(*)
          FROM usuarios
          WHERE ativo = TRUE
        ) AS usuarios_ativos,

        (
          SELECT COUNT(*)
          FROM usuarios
          WHERE tipo = 'admin'
        ) AS total_admins,

        (SELECT COUNT(*) FROM negocios) AS total_negocios,

        (SELECT COUNT(*) FROM produtos) AS total_produtos,

        (SELECT COUNT(*) FROM alertas) AS total_alertas,

        (
          SELECT COUNT(*)
          FROM alertas
          WHERE resolvido = FALSE
        ) AS alertas_pendentes,

        (SELECT COUNT(*) FROM conversas) AS total_conversas,

        (
          SELECT COALESCE(SUM(receita_mensal), 0)
          FROM negocios
        ) AS receita_total
    `);

    return res.json(resultado[0]);
  } catch (error) {
    console.error("Erro ao carregar resumo administrativo:", error);

    return res.status(500).json({
      erro: "Erro ao carregar resumo administrativo."
    });
  }
});

// LISTAR USUÁRIOS
router.get("/usuarios", async (req, res) => {
  try {
    const [usuarios] = await db.query(`
      SELECT
        id,
        nome,
        email,
        tipo,
        ativo,
        criado_em
      FROM usuarios
      ORDER BY criado_em DESC
    `);

    return res.json(usuarios);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);

    return res.status(500).json({
      erro: "Erro ao listar usuários."
    });
  }
});

// LISTAR EMPRESAS
router.get("/negocios", async (req, res) => {
  try {
    const [negocios] = await db.query(`
      SELECT
        n.id,
        n.nome,
        n.segmento,
        n.localizacao,
        n.receita_mensal,
        n.custos_mensais,
        n.funcionarios,
        n.criado_em,
        u.nome AS usuario_nome,
        u.email AS usuario_email
      FROM negocios n
      INNER JOIN usuarios u
        ON u.id = n.usuario_id
      ORDER BY n.criado_em DESC
    `);

    return res.json(negocios);
  } catch (error) {
    console.error("Erro ao listar negócios:", error);

    return res.status(500).json({
      erro: "Erro ao listar negócios."
    });
  }
});

// ATIVAR OU DESATIVAR USUÁRIO
router.patch("/usuarios/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;

    if (typeof ativo !== "boolean") {
      return res.status(400).json({
        erro: "O campo ativo deve ser verdadeiro ou falso."
      });
    }

    if (Number(id) === Number(req.usuario.id)) {
      return res.status(400).json({
        erro: "Você não pode desativar sua própria conta."
      });
    }

    const [resultado] = await db.query(
      `
      UPDATE usuarios
      SET ativo = ?
      WHERE id = ?
      `,
      [ativo, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado."
      });
    }

    return res.json({
      mensagem: ativo
        ? "Usuário ativado com sucesso."
        : "Usuário desativado com sucesso."
    });
  } catch (error) {
    console.error("Erro ao alterar status:", error);

    return res.status(500).json({
      erro: "Erro ao alterar status do usuário."
    });
  }
});

module.exports = router;