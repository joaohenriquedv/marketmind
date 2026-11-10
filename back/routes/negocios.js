
const express = require("express");
const db = require("../db");
const verificarToken = require("../middlewares/verificarToken");

const router = express.Router();

/* ===============================
   HELPERS
================================ */

function normalizarProdutoSaida(p) {
  return {
    id: p.id,
    negocio_id: p.negocio_id,
    nome: p.nome,
    categoria: p.categoria || "",
    preco: Number(p.preco) || 0,
    precoCusto: Number(p.preco_custo) || 0,
    vendas: Number(p.vendas) || 0,
    tendencia: p.tendencia || "Estavel",
    estrategico: Boolean(p.estrategico),
  };
}

// Garante que o negócio pertence ao usuário logado
async function negocioDoUsuario(negocioId, usuarioId) {
  const [linhas] = await db.query(
    "SELECT id FROM negocios WHERE id = ? AND usuario_id = ?",
    [negocioId, usuarioId]
  );
  return linhas.length > 0;
}

/* ===============================
   CRIAR NEGÓCIO
================================ */
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
      concorrentes,
      descricao,
    } = req.body;

    const usuarioId = req.usuario.id;

    if (!nome || nome.trim() === "") {
      return res.status(400).json({ erro: "O nome do negócio é obrigatório." });
    }

    const [usuarioExiste] = await db.query(
      "SELECT id, ativo FROM usuarios WHERE id = ?",
      [usuarioId]
    );

    if (usuarioExiste.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }
    if (!usuarioExiste[0].ativo) {
      return res.status(403).json({ erro: "Usuário desativado." });
    }

    const [resultado] = await db.query(
      `
      INSERT INTO negocios
      (
        usuario_id, nome, segmento, localizacao, receita_mensal,
        custos_mensais, funcionarios, anos_mercado, publico_alvo,
        concorrentes, descricao
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        concorrentes || "",
        descricao || "",
      ]
    );

    const [linhas] = await db.query("SELECT * FROM negocios WHERE id = ?", [
      resultado.insertId,
    ]);

    return res.status(201).json({
      sucesso: true,
      mensagem: "Negócio cadastrado com sucesso.",
      negocio: linhas[0],
    });
  } catch (error) {
    console.error("Erro ao cadastrar negócio:", error);
    return res.status(500).json({ erro: "Erro ao cadastrar negócio." });
  }
});

/* ===============================
   ATUALIZAR NEGÓCIO
================================ */
router.patch("/:negocioId", verificarToken, async (req, res) => {
  try {
    const { negocioId } = req.params;
    const usuarioId = req.usuario.id;

    const {
      nome,
      segmento,
      localizacao,
      receita_mensal,
      custos_mensais,
      funcionarios,
      anos_mercado,
      publico_alvo,
      concorrentes,
      descricao,
    } = req.body;

    if (!(await negocioDoUsuario(negocioId, usuarioId))) {
      return res.status(404).json({ erro: "Negócio não encontrado." });
    }

    const campos = [];
    const valores = [];

    if (nome !== undefined) {
      if (!String(nome).trim()) {
        return res
          .status(400)
          .json({ erro: "O nome do negócio não pode ficar vazio." });
      }
      campos.push("nome = ?");
      valores.push(String(nome).trim());
    }
    if (segmento !== undefined) {
      campos.push("segmento = ?");
      valores.push(segmento || "");
    }
    if (localizacao !== undefined) {
      campos.push("localizacao = ?");
      valores.push(localizacao || "");
    }
    if (receita_mensal !== undefined) {
      campos.push("receita_mensal = ?");
      valores.push(Number(receita_mensal) || 0);
    }
    if (custos_mensais !== undefined) {
      campos.push("custos_mensais = ?");
      valores.push(Number(custos_mensais) || 0);
    }
    if (funcionarios !== undefined) {
      campos.push("funcionarios = ?");
      valores.push(Number(funcionarios) || 0);
    }
    if (anos_mercado !== undefined) {
      campos.push("anos_mercado = ?");
      valores.push(Number(anos_mercado) || 0);
    }
    if (publico_alvo !== undefined) {
      campos.push("publico_alvo = ?");
      valores.push(publico_alvo || "");
    }
    if (concorrentes !== undefined) {
      campos.push("concorrentes = ?");
      valores.push(concorrentes || "");
    }
    if (descricao !== undefined) {
      campos.push("descricao = ?");
      valores.push(descricao || "");
    }

    if (campos.length === 0) {
      return res.status(400).json({ erro: "Nenhum campo para atualizar." });
    }

    valores.push(negocioId, usuarioId);

    await db.query(
      `UPDATE negocios SET ${campos.join(", ")} WHERE id = ? AND usuario_id = ?`,
      valores
    );

    const [linhas] = await db.query("SELECT * FROM negocios WHERE id = ?", [
      negocioId,
    ]);

    return res.json({
      sucesso: true,
      mensagem: "Negócio atualizado com sucesso.",
      negocio: linhas[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar negócio:", error);
    return res.status(500).json({ erro: "Erro ao atualizar negócio." });
  }
});

/* ===============================
   PRODUTOS — LISTAR
================================ */
router.get("/:negocioId/produtos", verificarToken, async (req, res) => {
  try {
    const { negocioId } = req.params;
    const usuarioId = req.usuario.id;

    if (!(await negocioDoUsuario(negocioId, usuarioId))) {
      return res.status(404).json({ erro: "Negócio não encontrado." });
    }

    const [linhas] = await db.query(
      "SELECT * FROM produtos WHERE negocio_id = ? ORDER BY id DESC",
      [negocioId]
    );

    return res.json(linhas.map(normalizarProdutoSaida));
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return res.status(500).json({ erro: "Erro ao listar produtos." });
  }
});

/* ===============================
   PRODUTOS — CRIAR
================================ */
router.post("/:negocioId/produtos", verificarToken, async (req, res) => {
  try {
    const { negocioId } = req.params;
    const usuarioId = req.usuario.id;

    const { nome, categoria, preco, precoCusto, preco_custo, vendas, tendencia, estrategico } =
      req.body;

    if (!(await negocioDoUsuario(negocioId, usuarioId))) {
      return res.status(404).json({ erro: "Negócio não encontrado." });
    }

    if (!nome || !String(nome).trim()) {
      return res.status(400).json({ erro: "O nome do produto é obrigatório." });
    }

    const [resultado] = await db.query(
      `
      INSERT INTO produtos
      (negocio_id, nome, categoria, preco, preco_custo, vendas, tendencia, estrategico)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        negocioId,
        String(nome).trim(),
        categoria || "",
        Number(preco) || 0,
        Number(precoCusto ?? preco_custo) || 0,
        Number(vendas) || 0,
        tendencia || "Estavel",
        estrategico ? 1 : 0,
      ]
    );

    const [linhas] = await db.query("SELECT * FROM produtos WHERE id = ?", [
      resultado.insertId,
    ]);

    return res.status(201).json({ produto: normalizarProdutoSaida(linhas[0]) });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return res.status(500).json({ erro: "Erro ao criar produto." });
  }
});

/* ===============================
   PRODUTOS — ATUALIZAR
================================ */
router.patch("/:negocioId/produtos/:produtoId", verificarToken, async (req, res) => {
  try {
    const { negocioId, produtoId } = req.params;
    const usuarioId = req.usuario.id;

    if (!(await negocioDoUsuario(negocioId, usuarioId))) {
      return res.status(404).json({ erro: "Negócio não encontrado." });
    }

    const [existe] = await db.query(
      "SELECT id FROM produtos WHERE id = ? AND negocio_id = ?",
      [produtoId, negocioId]
    );

    if (existe.length === 0) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    const { nome, categoria, preco, precoCusto, preco_custo, vendas, tendencia, estrategico } =
      req.body;

    const campos = [];
    const valores = [];

    if (nome !== undefined) {
      if (!String(nome).trim()) {
        return res.status(400).json({ erro: "O nome não pode ficar vazio." });
      }
      campos.push("nome = ?");
      valores.push(String(nome).trim());
    }
    if (categoria !== undefined) {
      campos.push("categoria = ?");
      valores.push(categoria || "");
    }
    if (preco !== undefined) {
      campos.push("preco = ?");
      valores.push(Number(preco) || 0);
    }
    if (precoCusto !== undefined || preco_custo !== undefined) {
      campos.push("preco_custo = ?");
      valores.push(Number(precoCusto ?? preco_custo) || 0);
    }
    if (vendas !== undefined) {
      campos.push("vendas = ?");
      valores.push(Number(vendas) || 0);
    }
    if (tendencia !== undefined) {
      campos.push("tendencia = ?");
      valores.push(tendencia || "Estavel");
    }
    if (estrategico !== undefined) {
      campos.push("estrategico = ?");
      valores.push(estrategico ? 1 : 0);
    }

    if (campos.length === 0) {
      return res.status(400).json({ erro: "Nenhum campo para atualizar." });
    }

    valores.push(produtoId, negocioId);

    await db.query(
      `UPDATE produtos SET ${campos.join(", ")} WHERE id = ? AND negocio_id = ?`,
      valores
    );

    const [linhas] = await db.query("SELECT * FROM produtos WHERE id = ?", [
      produtoId,
    ]);

    return res.json({ produto: normalizarProdutoSaida(linhas[0]) });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return res.status(500).json({ erro: "Erro ao atualizar produto." });
  }
});

/* ===============================
   PRODUTOS — EXCLUIR
================================ */
router.delete("/:negocioId/produtos/:produtoId", verificarToken, async (req, res) => {
  try {
    const { negocioId, produtoId } = req.params;
    const usuarioId = req.usuario.id;

    if (!(await negocioDoUsuario(negocioId, usuarioId))) {
      return res.status(404).json({ erro: "Negócio não encontrado." });
    }

    const [resultado] = await db.query(
      "DELETE FROM produtos WHERE id = ? AND negocio_id = ?",
      [produtoId, negocioId]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    return res.json({ sucesso: true, mensagem: "Produto excluído." });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return res.status(500).json({ erro: "Erro ao excluir produto." });
  }
});

/* ===============================
   LISTAR NEGÓCIOS DO USUÁRIO
================================ */
router.get("/", verificarToken, async (req, res) => {
  try {
    const [negocios] = await db.query(
      "SELECT * FROM negocios WHERE usuario_id = ? ORDER BY criado_em DESC",
      [req.usuario.id]
    );

    return res.json(negocios);
  } catch (error) {
    console.error("Erro ao buscar negócios:", error);
    return res.status(500).json({ erro: "Erro ao buscar negócios." });
  }
});

/* ===============================
   BUSCAR UM NEGÓCIO
================================ */
router.get("/:negocioId", verificarToken, async (req, res) => {
  try {
    const { negocioId } = req.params;

    const [negocios] = await db.query(
      "SELECT * FROM negocios WHERE id = ? AND usuario_id = ?",
      [negocioId, req.usuario.id]
    );

    if (negocios.length === 0) {
      return res.status(404).json({ erro: "Negócio não encontrado." });
    }

    return res.json(negocios[0]);
  } catch (error) {
    console.error("Erro ao buscar negócio:", error);
    return res.status(500).json({ erro: "Erro ao buscar negócio." });
  }
});

module.exports = router;
