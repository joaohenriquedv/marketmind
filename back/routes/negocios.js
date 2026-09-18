const express = require("express");
const db = require("../db");
const verificarToken = require("../middlewares/verificarToken");

const router = express.Router();

// CRIAR NEGÓCIO
router.post("/criar", verificarToken, async (req, res) => {
  try {
    const {
      nome,
      segmento,
      localizacao,
      receita_mensal,
      custos_mensais,
      funcionarios,
      anos_mercado,
      publico_alvo,
      concorrentes
    } = req.body;

    const usuarioId = req.usuario.id;

    if (!nome || nome.trim() === "") {
      return res.status(400).json({
        erro: "O nome do negócio é obrigatório."
      });
    }

    const [usuarioExiste] = await db.query(
      `
      SELECT id, ativo
      FROM usuarios
      WHERE id = ?
      `,
      [usuarioId]
    );

    if (usuarioExiste.length === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado."
      });
    }

    if (!usuarioExiste[0].ativo) {
      return res.status(403).json({
        erro: "Usuário desativado."
      });
    }

    const [resultado] = await db.query(
      `
      INSERT INTO negocios
      (
        usuario_id,
        nome,
        segmento,
        localizacao,
        receita_mensal,
        custos_mensais,
        funcionarios,
        anos_mercado,
        publico_alvo,
        concorrentes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        usuarioId,
        nome.trim(),
        segmento || "",
        localizacao || "",
        Number(receita_mensal) || 0,
        Number(custos_mensais) || 0,
        Number(funcionarios) || 0,
        Number(anos_mercado) || 0,
        publico_alvo || "",
        concorrentes || ""
      ]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Negócio cadastrado com sucesso.",
      negocio: {
        id: resultado.insertId,
        usuario_id: usuarioId,
        nome: nome.trim()
      }
    });
  } catch (error) {
    console.error("Erro ao cadastrar negócio:", error);

    return res.status(500).json({
      erro: "Erro ao cadastrar negócio."
    });
  }
});

// LISTAR NEGÓCIOS DO USUÁRIO LOGADO
router.get("/", verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const [negocios] = await db.query(
      `
      SELECT *
      FROM negocios
      WHERE usuario_id = ?
      ORDER BY criado_em DESC
      `,
      [usuarioId]
    );

    return res.json(negocios);
  } catch (error) {
    console.error("Erro ao buscar negócios:", error);

    return res.status(500).json({
      erro: "Erro ao buscar negócios."
    });
  }
});

// BUSCAR UM NEGÓCIO ESPECÍFICO DO USUÁRIO
router.get("/:negocioId", verificarToken, async (req, res) => {
  try {
    const { negocioId } = req.params;
    const usuarioId = req.usuario.id;

    const [negocios] = await db.query(
      `
      SELECT *
      FROM negocios
      WHERE id = ?
        AND usuario_id = ?
      `,
      [negocioId, usuarioId]
    );

    if (negocios.length === 0) {
      return res.status(404).json({
        erro: "Negócio não encontrado."
      });
    }

    return res.json(negocios[0]);
  } catch (error) {
    console.error("Erro ao buscar negócio:", error);

    return res.status(500).json({
      erro: "Erro ao buscar negócio."
    });
  }
});

module.exports = router;