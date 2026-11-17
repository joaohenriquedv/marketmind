const express = require("express");
const db = require("../db");
const {
  mapaProdutosPorNegocio,
  enriquecerNegocio,
} = require("../lib/indicadores");

const verificarToken = require("../middlewares/verificarToken");
const verificarAdmin = require("../middlewares/verificarAdmin");

const router = express.Router();

// Todas as rotas abaixo exigem login e usuário administrador
router.use(verificarToken);
router.use(verificarAdmin);

/* Produto vindo do banco → formato usado no painel.
   Aceita (preco, vendas) ou (preco_venda, vendas_mes). */
function tendenciaParaFront(valor) {
  const s = String(valor || "").toLowerCase();
  if (s.includes("qued")) return "EmQueda";
  if (s.includes("cresc")) return "Crescendo";
  return "Estavel";
}

function normalizarProdutoAdmin(p) {
  const preco = Number(p.preco_venda ?? p.preco ?? 0);
  const custo = Number(p.preco_custo ?? 0);
  const vendas = Number(p.vendas_mes ?? p.vendas ?? 0);

  return {
    id: p.id,
    negocio_id: p.negocio_id,
    negocio_nome: p.negocio_nome || "",
    usuario_id: p.usuario_id,
    usuario_nome: p.usuario_nome || "",
    usuario_email: p.usuario_email || "",
    nome: p.nome,
    categoria: p.categoria || "",
    preco,
    precoCusto: custo,
    vendas,
    receita: preco * vendas,
    tendencia: tendenciaParaFront(p.tendencia),
    estrategico: Boolean(p.estrategico),
    criado_em: p.criado_em,
  };
}

/* ===============================
   Indicadores financeiros por negócio
   Regra única (a mesma do Dashboard do usuário):
   - com produtos: receita e custo variável vêm dos produtos
   - sem produtos: usa receita_mensal e custos_mensais do cadastro
   O custo fixo (custos_mensais) entra sempre.
================================ */
async function resumoFinanceiro() {
  const [negocios] = await db.query(
    "SELECT id, receita_mensal, custos_mensais FROM negocios"
  );
  const agregados = await mapaProdutosPorNegocio();

  let receita = 0;
  let custos = 0;
  let comProdutos = 0;

  negocios.forEach((n) => {
    const enriquecido = enriquecerNegocio(n, agregados.get(n.id));

    receita += enriquecido.receita;
    custos += enriquecido.custos;

    if (enriquecido.fonte_indicadores === "produtos") comProdutos += 1;
  });

  const lucro = receita - custos;

  return {
    receita_total: receita,
    custos_total: custos,
    lucro_total: lucro,
    margem_media: receita > 0 ? (lucro / receita) * 100 : 0,
    negocios_com_produtos: comProdutos,
    negocios_sem_produtos: negocios.length - comProdutos,
  };
}

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

    const financeiro = await resumoFinanceiro();

    return res.json({ ...resultado[0], ...financeiro });
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
        u.email AS usuario_email,
        (
          SELECT COUNT(*)
          FROM produtos p
          WHERE p.negocio_id = n.id
        ) AS total_produtos
      FROM negocios n
      INNER JOIN usuarios u
        ON u.id = n.usuario_id
      ORDER BY n.criado_em DESC
    `);

    const agregados = await mapaProdutosPorNegocio();

    return res.json(
      negocios.map((n) => enriquecerNegocio(n, agregados.get(n.id)))
    );
  } catch (error) {
    console.error("Erro ao listar negócios:", error);

    return res.status(500).json({
      erro: "Erro ao listar negócios."
    });
  }
});

// LISTAR PRODUTOS (de todos os usuários)
router.get("/produtos", async (req, res) => {
  try {
    const limite = Math.min(Number(req.query.limite) || 300, 1000);

    const [linhas] = await db.query(
      `
      SELECT
        p.*,
        n.nome AS negocio_nome,
        n.usuario_id,
        u.nome AS usuario_nome,
        u.email AS usuario_email
      FROM produtos p
      INNER JOIN negocios n
        ON n.id = p.negocio_id
      INNER JOIN usuarios u
        ON u.id = n.usuario_id
      ORDER BY p.id DESC
      LIMIT ?
      `,
      [limite]
    );

    return res.json(linhas.map(normalizarProdutoAdmin));
  } catch (error) {
    console.error("Erro ao listar produtos (admin):", error);

    return res.status(500).json({
      erro: "Erro ao listar produtos."
    });
  }
});

// ATUALIZAR NEGÓCIO
router.patch("/negocios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const permitidos = [
      "nome",
      "segmento",
      "localizacao",
      "receita_mensal",
      "custos_mensais",
      "funcionarios",
      "anos_mercado",
      "publico_alvo",
      "concorrentes",
      "descricao",
    ];

    const numericos = [
      "receita_mensal",
      "custos_mensais",
      "funcionarios",
      "anos_mercado",
    ];

    const campos = [];
    const valores = [];

    permitidos.forEach((campo) => {
      if (req.body[campo] === undefined) return;

      if (campo === "nome") {
        if (!String(req.body.nome).trim()) {
          return;
        }
        campos.push("nome = ?");
        valores.push(String(req.body.nome).trim());
        return;
      }

      campos.push(`${campo} = ?`);
      valores.push(
        numericos.includes(campo)
          ? Number(req.body[campo]) || 0
          : req.body[campo] || ""
      );
    });

    if (campos.length === 0) {
      return res.status(400).json({ erro: "Nenhum campo para atualizar." });
    }

    valores.push(id);

    const [resultado] = await db.query(
      `UPDATE negocios SET ${campos.join(", ")} WHERE id = ?`,
      valores
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: "Negócio não encontrado." });
    }

    const [linhas] = await db.query(
      `
      SELECT
        n.*,
        u.nome AS usuario_nome,
        u.email AS usuario_email,
        (SELECT COUNT(*) FROM produtos p WHERE p.negocio_id = n.id) AS total_produtos
      FROM negocios n
      INNER JOIN usuarios u ON u.id = n.usuario_id
      WHERE n.id = ?
      `,
      [id]
    );

    return res.json({
      mensagem: "Negócio atualizado com sucesso.",
      negocio: linhas[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar negócio (admin):", error);
    return res.status(500).json({ erro: "Erro ao atualizar negócio." });
  }
});

// EXCLUIR NEGÓCIO (produtos e alertas caem em cascata)
router.delete("/negocios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [existe] = await db.query("SELECT id, nome FROM negocios WHERE id = ?", [id]);

    if (existe.length === 0) {
      return res.status(404).json({ erro: "Negócio não encontrado." });
    }

    const [produtos] = await db.query(
      "SELECT COUNT(*) AS total FROM produtos WHERE negocio_id = ?",
      [id]
    );

    const [resultado] = await db.query("DELETE FROM negocios WHERE id = ?", [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: "Negócio não encontrado." });
    }

    return res.json({
      mensagem: `Negócio "${existe[0].nome}" excluído.`,
      produtos_removidos: Number(produtos[0].total) || 0,
    });
  } catch (error) {
    console.error("Erro ao excluir negócio (admin):", error);

    const emProducao = process.env.NODE_ENV === "production";

    return res.status(500).json({
      erro: emProducao
        ? "Erro ao excluir negócio."
        : `Erro ao excluir negócio: ${error.sqlMessage || error.message}`,
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
