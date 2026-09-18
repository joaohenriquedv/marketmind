const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        erro: "Token não informado."
      });
    }

    const partes = authorization.split(" ");

    if (
      partes.length !== 2 ||
      partes[0].toLowerCase() !== "bearer"
    ) {
      return res.status(401).json({
        erro: "Formato de token inválido."
      });
    }

    const token = partes[1];

    const dadosUsuario = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.usuario = dadosUsuario;

    next();
  } catch (error) {
    console.error("Erro ao verificar token:", error);

    return res.status(401).json({
      erro: "Token inválido ou expirado."
    });
  }
}

module.exports = verificarToken;