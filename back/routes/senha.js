
const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const db = require("../db");

const router = express.Router();

/* ------------------------- configuração ------------------------- */
const FRONT_URL = (process.env.FRONT_URL || "").trim().replace(/\/+$/, "");
const REMETENTE_NOME = process.env.MAIL_NOME || "MarketMind";

/* A API da Brevo só aceita o e-mail puro. Se MAIL_FROM vier como
   'MarketMind <contato@x.com>', extrai só o endereço. */
const MAIL_FROM_BRUTO = (process.env.MAIL_FROM || "").trim();
const REMETENTE_EMAIL = (
  MAIL_FROM_BRUTO.match(/<([^>]+)>/)?.[1] || MAIL_FROM_BRUTO
).trim();
const TOKEN_VALIDADE_MIN = 30;
const MAX_PEDIDOS = 3;
const JANELA_MIN = 15;

if (!FRONT_URL) {
  console.error(
    "[senha] FRONT_URL não definida no .env — o link do e-mail apontaria para lugar nenhum."
  );
}

const smtpConfigurado = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

const transporter = smtpConfigurado
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

/* Prioridade: Brevo (HTTP) > Resend (HTTP) > SMTP.
   HTTP é mais confiável em hospedagens que bloqueiam portas de SMTP. */
const PROVEDOR = process.env.BREVO_API_KEY
  ? "brevo"
  : process.env.RESEND_API_KEY
  ? "resend"
  : smtpConfigurado
  ? "smtp"
  : null;

if (!PROVEDOR) {
  console.error(
    "[senha] Nenhum provedor de e-mail configurado (BREVO_API_KEY, RESEND_API_KEY ou SMTP_*). " +
      "A rota /senha/recuperar vai responder 503 até isso ser resolvido."
  );
}

if (PROVEDOR && !REMETENTE_EMAIL) {
  console.error(
    "[senha] MAIL_FROM vazio ou inválido no .env — a Brevo recusa o envio sem remetente."
  );
}

/* ------------------------- utilidades ------------------------- */
const hashToken = (t) => crypto.createHash("sha256").update(t).digest("hex");

const emailValido = (e) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim());

const escaparHtml = (s) =>
  String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/* ------------------------- envio de e-mail ------------------------- */
async function enviarEmail({ para, nome, assunto, html }) {
  if (!PROVEDOR) {
    throw new Error("Nenhum provedor de e-mail configurado no servidor.");
  }

  if (PROVEDOR === "brevo") {
    const resposta = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: REMETENTE_EMAIL, name: REMETENTE_NOME },
        to: [{ email: para, name: nome || undefined }],
        subject: assunto,
        htmlContent: html,
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => "");
      throw new Error(`Brevo ${resposta.status}: ${detalhe.slice(0, 400)}`);
    }
    return;
  }

  if (PROVEDOR === "resend") {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${REMETENTE_NOME} <${REMETENTE_EMAIL}>`,
        to: [para],
        subject: assunto,
        html,
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => "");
      throw new Error(`Resend ${resposta.status}: ${detalhe.slice(0, 400)}`);
    }
    return;
  }

  await transporter.sendMail({
    from: `"${REMETENTE_NOME}" <${REMETENTE_EMAIL}>`,
    to: para,
    subject: assunto,
    html,
  });
}

function montarHtmlRecuperacao(nome, link) {
  return `
  <div style="margin:0;padding:0;background:#f5f7fa">
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1f2937">
      <div style="background:#ffffff;border-radius:14px;padding:28px 26px;border:1px solid #e9edf2">
        <p style="margin:0 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#f97316;font-weight:bold">
          MarketMind
        </p>
        <h2 style="margin:0 0 14px;font-size:21px">Olá, ${escaparHtml(nome) || "tudo bem"}!</h2>
        <p style="color:#4b5563;line-height:1.6;margin:0 0 10px">
          Recebemos um pedido para redefinir a senha da sua conta.
          Clique no botão abaixo para criar uma nova senha.
        </p>
        <p style="text-align:center;margin:26px 0">
          <a href="${link}" style="background:#f97316;color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:8px;font-weight:bold;display:inline-block">
            Criar nova senha
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 6px">
          O link expira em ${TOKEN_VALIDADE_MIN} minutos e só pode ser usado uma vez.
        </p>
        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0">
          Se não foi você, ignore este e-mail — sua senha continua a mesma.
        </p>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:11.5px;margin:16px 0 0">
        Se o botão não abrir, copie e cole este endereço no navegador:<br>
        <span style="color:#6b7280;word-break:break-all">${link}</span>
      </p>
    </div>
  </div>`;
}

/* ============================================================
   POST /senha/recuperar   { "email": "..." }
   ============================================================ */
router.post("/recuperar", async (req, res) => {
  const email = String(req.body?.email || "").trim();

  const respostaPadrao = {
    mensagem:
      "Se o e-mail estiver cadastrado, enviaremos um link de recuperação.",
  };

  if (!emailValido(email)) {
    return res.status(400).json({ mensagem: "Informe um e-mail válido." });
  }

  if (!PROVEDOR || !REMETENTE_EMAIL) {
    return res.status(503).json({
      mensagem:
        "Recuperação de senha indisponível no momento. Fale com o suporte.",
    });
  }

  try {
    const [usuarios] = await db.query(
      "SELECT id, nome, email FROM usuarios WHERE email = ? AND ativo = TRUE LIMIT 1",
      [email]
    );

    // Mesma resposta exista ou não a conta (não revela quem tem cadastro)
    if (!usuarios.length) return res.json(respostaPadrao);

    const usuario = usuarios[0];

    // Limite persistente no banco (sobrevive a reinício do servidor)
    const [recentes] = await db.query(
      `SELECT COUNT(*) AS total
         FROM recuperacao_senha
        WHERE usuario_id = ?
          AND criado_em > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [usuario.id, JANELA_MIN]
    );

    if (Number(recentes[0].total) >= MAX_PEDIDOS) {
      return res.status(429).json({
        mensagem:
          "Muitos pedidos seguidos. Aguarde 15 minutos ou verifique seu e-mail.",
      });
    }

    // Invalida links anteriores e limpa registros antigos deste usuário
    await db.query(
      `DELETE FROM recuperacao_senha
        WHERE usuario_id = ?
          AND (usado_em IS NOT NULL OR expira_em < NOW())`,
      [usuario.id]
    );
    await db.query(
      "UPDATE recuperacao_senha SET usado_em = NOW() WHERE usuario_id = ? AND usado_em IS NULL",
      [usuario.id]
    );

    const token = crypto.randomBytes(32).toString("hex");
    const expiraEm = new Date(Date.now() + TOKEN_VALIDADE_MIN * 60 * 1000);

    const [insercao] = await db.query(
      "INSERT INTO recuperacao_senha (usuario_id, token_hash, expira_em) VALUES (?, ?, ?)",
      [usuario.id, hashToken(token), expiraEm]
    );

    const link = `${FRONT_URL}/?recuperar=${token}`;

    try {
      await enviarEmail({
        para: usuario.email,
        nome: usuario.nome,
        assunto: "Redefinir sua senha — MarketMind",
        html: montarHtmlRecuperacao(usuario.nome, link),
      });
    } catch (erroEnvio) {
      // Não deixa token órfão no banco se o e-mail não saiu
      await db.query("DELETE FROM recuperacao_senha WHERE id = ?", [
        insercao.insertId,
      ]);
      throw erroEnvio;
    }

    return res.json(respostaPadrao);
  } catch (erro) {
    console.error("Erro em POST /senha/recuperar:", erro);
    return res.status(500).json({
      mensagem:
        "Não conseguimos enviar o e-mail agora. Tente novamente em instantes.",
    });
  }
});

/* ============================================================
   POST /senha/redefinir   { "token": "...", "senha": "..." }
   ============================================================ */
router.post("/redefinir", async (req, res) => {
  const { token, senha } = req.body || {};

  if (!token || !senha) {
    return res.status(400).json({ mensagem: "Dados incompletos." });
  }

  const senhaTexto = String(senha);

  if (senhaTexto.length < 6) {
    return res
      .status(400)
      .json({ mensagem: "A senha deve ter no mínimo 6 caracteres." });
  }

  try {
    const [registros] = await db.query(
      `SELECT id, usuario_id
         FROM recuperacao_senha
        WHERE token_hash = ?
          AND usado_em IS NULL
          AND expira_em > NOW()
        LIMIT 1`,
      [hashToken(String(token))]
    );

    if (!registros.length) {
      return res.status(400).json({
        mensagem: "Link inválido ou expirado. Solicite um novo e-mail.",
      });
    }

    const registro = registros[0];
    const senhaHash = await bcrypt.hash(senhaTexto, 10);

    await db.query("UPDATE usuarios SET senha = ? WHERE id = ?", [
      senhaHash,
      registro.usuario_id,
    ]);

    // Consome o token e invalida qualquer outro pendente do mesmo usuário
    await db.query(
      "UPDATE recuperacao_senha SET usado_em = NOW() WHERE usuario_id = ? AND usado_em IS NULL",
      [registro.usuario_id]
    );

    return res.json({ mensagem: "Senha redefinida com sucesso." });
  } catch (erro) {
    console.error("Erro em POST /senha/redefinir:", erro);
    return res.status(500).json({
      mensagem: "Não foi possível redefinir a senha. Tente novamente.",
    });
  }
});

module.exports = router;
