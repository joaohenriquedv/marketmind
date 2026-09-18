function verificarAdmin(req, res, next) {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        erro: "Usuário não autenticado."
      });
    }

    if (req.usuario.tipo !== "admin") {
      return res.status(403).json({
        erro: "Acesso negado. Permissão de administrador necessária."
      });
    }

    next();
  } catch (error) {
    console.error("Erro ao verificar permissão de administrador:", error);

    return res.status(500).json({
      erro: "Erro ao verificar permissão de administrador."
    });
  }
}

module.exports = verificarAdmin;