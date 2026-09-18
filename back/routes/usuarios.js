const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// CADASTRAR USUÁRIO
router.post("/cadastrar", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: "Preencha nome, email e senha."
      });
    }

    if (senha.length < 6) {
      return res.status(400).json({
        erro: "A senha deve ter pelo menos 6 caracteres."
      });
    }

    const emailFormatado = email.trim().toLowerCase();

    const [usuariosExistentes] = await db.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [emailFormatado]
    );

    if (usuariosExistentes.length > 0) {
      return res.status(400).json({
        erro: "E-mail já cadastrado."
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const [resultado] = await db.query(
      `
      INSERT INTO usuarios
      (nome, email, senha, tipo, ativo)
      VALUES (?, ?, ?, 'usuario', TRUE)
      `,
      [
        nome.trim(),
        emailFormatado,
        senhaHash
      ]
    );

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso.",
      usuario: {
        id: resultado.insertId,
        nome: nome.trim(),
        email: emailFormatado,
        tipo: "usuario",
        ativo: true
      }
    });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);

    return res.status(500).json({
      erro: "Erro interno ao cadastrar usuário."
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: "Preencha email e senha."
      });
    }

    const emailFormatado = email.trim().toLowerCase();

    const [usuarios] = await db.query(
      `
      SELECT
        id,
        nome,
        email,
        senha,
        tipo,
        ativo
      FROM usuarios
      WHERE email = ?
      `,
      [emailFormatado]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        erro: "Email ou senha inválidos."
      });
    }

    const usuario = usuarios[0];

    if (!usuario.ativo) {
      return res.status(403).json({
        erro: "Este usuário está desativado."
      });
    }

    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senha
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        erro: "Email ou senha inválidos."
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    return res.json({
      mensagem: "Login realizado com sucesso.",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        ativo: Boolean(usuario.ativo)
      }
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);

    return res.status(500).json({
      erro: "Erro interno ao fazer login."
    });
  }
});

// LISTAR USUÁRIOS
// Por enquanto esta rota continua pública.
// Depois ela será protegida para apenas administradores.
router.get("/", async (req, res) => {
  try {
    const [usuarios] = await db.query(`
      SELECT
        id,
        nome,
        email,
        tipo,
        ativo,
        criado_em,
        atualizado_em
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

module.exports = router;