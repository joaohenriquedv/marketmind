
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const verificarToken = require("../middlewares/verificarToken");

const router = express.Router();

/* CADASTRAR */
router.post("/cadastrar", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: "Preencha nome, email e senha." });
    }
    if (senha.length < 6) {
      return res
        .status(400)
        .json({ erro: "A senha deve ter pelo menos 6 caracteres." });
    }

    const emailFormatado = email.trim().toLowerCase();

    const [existentes] = await db.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [emailFormatado]
    );

    if (existentes.length > 0) {
      return res.status(400).json({ erro: "E-mail já cadastrado." });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const [resultado] = await db.query(
      "INSERT INTO usuarios (nome, email, senha, tipo, ativo) VALUES (?, ?, ?, 'usuario', TRUE)",
      [nome.trim(), emailFormatado, senhaHash]
    );

    const token = jwt.sign(
      { id: resultado.insertId, email: emailFormatado, tipo: "usuario" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso.",
      token,
      usuario: {
        id: resultado.insertId,
        nome: nome.trim(),
        email: emailFormatado,
        telefone: "",
        foto: "",
        tipo: "usuario",
        ativo: true,
      },
    });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    return res.status(500).json({ erro: "Erro interno ao cadastrar usuário." });
  }
});

/* LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "Preencha email e senha." });
    }

    const emailFormatado = email.trim().toLowerCase();

    const [usuarios] = await db.query(
      "SELECT id, nome, email, senha, telefone, foto, tipo, ativo FROM usuarios WHERE email = ?",
      [emailFormatado]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ erro: "Email ou senha inválidos." });
    }

    const usuario = usuarios[0];

    if (!usuario.ativo) {
      return res.status(403).json({ erro: "Este usuário está desativado." });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: "Email ou senha inválidos." });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      mensagem: "Login realizado com sucesso.",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone || "",
        foto: usuario.foto || "",
        tipo: usuario.tipo,
        ativo: Boolean(usuario.ativo),
      },
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({ erro: "Erro interno ao fazer login." });
  }
});

/* MEU PERFIL */
router.get("/me", verificarToken, async (req, res) => {
  try {
    const [linhas] = await db.query(
      "SELECT id, nome, email, telefone, foto, tipo, ativo FROM usuarios WHERE id = ?",
      [req.usuario.id]
    );

    if (linhas.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    return res.json(linhas[0]);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return res.status(500).json({ erro: "Erro ao buscar perfil." });
  }
});

/* ATUALIZAR MEU PERFIL */
router.patch("/me", verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { nome, email, telefone, foto } = req.body;

    const campos = [];
    const valores = [];

    if (nome !== undefined) {
      if (!String(nome).trim()) {
        return res.status(400).json({ erro: "O nome não pode ficar vazio." });
      }
      campos.push("nome = ?");
      valores.push(String(nome).trim());
    }

    if (email !== undefined) {
      const emailFormatado = String(email).trim().toLowerCase();

      if (!emailFormatado) {
        return res.status(400).json({ erro: "O e-mail não pode ficar vazio." });
      }

      const [outro] = await db.query(
        "SELECT id FROM usuarios WHERE email = ? AND id <> ?",
        [emailFormatado, usuarioId]
      );

      if (outro.length > 0) {
        return res.status(400).json({ erro: "E-mail já cadastrado." });
      }

      campos.push("email = ?");
      valores.push(emailFormatado);
    }

    if (telefone !== undefined) {
      campos.push("telefone = ?");
      valores.push(String(telefone).trim());
    }

    if (foto !== undefined) {
      campos.push("foto = ?");
      valores.push(foto || null);
    }

    if (campos.length === 0) {
      return res.status(400).json({ erro: "Nenhum campo para atualizar." });
    }

    valores.push(usuarioId);

    await db.query(`UPDATE usuarios SET ${campos.join(", ")} WHERE id = ?`, valores);

    const [linhas] = await db.query(
      "SELECT id, nome, email, telefone, foto, tipo, ativo FROM usuarios WHERE id = ?",
      [usuarioId]
    );

    return res.json({
      sucesso: true,
      mensagem: "Perfil atualizado com sucesso.",
      usuario: linhas[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return res.status(500).json({ erro: "Erro ao atualizar perfil." });
  }
});

/* ALTERAR A PRÓPRIA SENHA */
router.patch("/me/senha", verificarToken, async (req, res) => {
  try {
    const { senha_atual, nova_senha } = req.body || {};

    if (!senha_atual || !nova_senha) {
      return res.status(400).json({
        erro: "Informe a senha atual e a nova senha.",
      });
    }

    if (String(nova_senha).length < 6) {
      return res.status(400).json({
        erro: "A nova senha deve ter pelo menos 6 caracteres.",
      });
    }

    const [usuarios] = await db.query(
      "SELECT senha FROM usuarios WHERE id = ?",
      [req.usuario.id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const senhaConfere = await bcrypt.compare(
      String(senha_atual),
      usuarios[0].senha
    );

    if (!senhaConfere) {
      return res.status(400).json({ erro: "A senha atual está incorreta." });
    }

    const senhaHash = await bcrypt.hash(String(nova_senha), 10);

    await db.query("UPDATE usuarios SET senha = ? WHERE id = ?", [
      senhaHash,
      req.usuario.id,
    ]);

    return res.json({
      sucesso: true,
      mensagem: "Senha alterada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return res.status(500).json({
      erro: "Não foi possível alterar a senha.",
    });
  }
});

/* PREFERÊNCIAS DA CONTA */
const PREFERENCIAS_PADRAO = {
  ativas: true,
  notificacoes: true,
  relatorios: true,
  novidades: true,
};

router.get("/me/preferencias", verificarToken, async (req, res) => {
  try {
    const [linhas] = await db.query(
      "SELECT dados FROM preferencias_usuario WHERE usuario_id = ?",
      [req.usuario.id]
    );

    let preferencias = PREFERENCIAS_PADRAO;

    if (linhas.length > 0) {
      const dados = linhas[0].dados;
      preferencias =
        typeof dados === "string" ? JSON.parse(dados) : dados;
    }

    return res.json({
      preferencias: { ...PREFERENCIAS_PADRAO, ...preferencias },
    });
  } catch (error) {
    console.error("Erro ao buscar preferências:", error);
    return res.status(500).json({
      erro: "Não foi possível carregar as preferências.",
    });
  }
});

router.patch("/me/preferencias", verificarToken, async (req, res) => {
  try {
    const chaves = Object.keys(PREFERENCIAS_PADRAO);
    const preferencias = {};

    for (const chave of chaves) {
      if (typeof req.body?.[chave] !== "boolean") {
        return res.status(400).json({
          erro: "As preferências devem ser valores booleanos.",
        });
      }

      preferencias[chave] = req.body[chave];
    }

    await db.query(
      `INSERT INTO preferencias_usuario (usuario_id, dados)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE dados = VALUES(dados)`,
      [req.usuario.id, JSON.stringify(preferencias)]
    );

    return res.json({ sucesso: true, preferencias });
  } catch (error) {
    console.error("Erro ao salvar preferências:", error);
    return res.status(500).json({
      erro: "Não foi possível salvar as preferências.",
    });
  }
});

/* LISTAR USUÁRIOS */
router.get("/", verificarToken, async (req, res) => {
  try {
    const [usuarios] = await db.query(
      "SELECT id, nome, email, tipo, ativo, criado_em, atualizado_em FROM usuarios ORDER BY criado_em DESC"
    );

    return res.json(usuarios);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return res.status(500).json({ erro: "Erro ao listar usuários." });
  }
});

module.exports = router;
