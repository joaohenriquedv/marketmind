
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const TEMPO_LIMITE_MS = 15000;

function obterToken() {
  return localStorage.getItem("token");
}

async function requisitar(caminho, opcoes = {}) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);

  let resposta;

  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      signal: controlador.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "O servidor demorou demais para responder. Tente novamente.",
        { cause: error }
      );
    }

    throw new Error(
      "Não foi possível conectar ao servidor. Verifique se o backend está rodando.",
      { cause: error }
    );
  } finally {
    clearTimeout(temporizador);
  }

  return tratarResposta(resposta);
}

async function tratarResposta(resposta) {
  const texto = await resposta.text();

  let dados = null;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = null;
    }
  }

  if (!resposta.ok) {
    const mensagemBackend =
      dados?.erro || dados?.mensagem || dados?.detail || dados?.message;

    if (resposta.status === 401) {
      throw new Error(mensagemBackend || "Email ou senha inválidos.");
    }
    if (resposta.status === 403) {
      throw new Error(
        mensagemBackend || "Você não tem permissão para esta ação."
      );
    }
    if (resposta.status >= 500) {
      throw new Error(
        mensagemBackend ||
          "Erro interno no servidor. Tente novamente mais tarde."
      );
    }
    throw new Error(
      mensagemBackend || `Erro ${resposta.status} ao realizar a operação.`
    );
  }

  if (dados === null) {
    throw new Error("O servidor não retornou uma resposta válida.");
  }

  return dados;
}

/* ===============================
   CADASTRO
================================ */
export async function cadastrarUsuario(dados) {
  return requisitar("/usuarios/cadastrar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
}

/* ===============================
   LOGIN
================================ */
export async function loginUsuario(dados) {
  return requisitar("/usuarios/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
}

/* ===============================
   ADMIN
================================ */
export async function buscarResumoAdmin() {
  return requisitar("/admin/resumo", {
    method: "GET",
    headers: { Authorization: `Bearer ${obterToken()}` },
  });
}

export async function buscarUsuariosAdmin() {
  return requisitar("/admin/usuarios", {
    method: "GET",
    headers: { Authorization: `Bearer ${obterToken()}` },
  });
}

export async function buscarNegociosAdmin() {
  return requisitar("/admin/negocios", {
    method: "GET",
    headers: { Authorization: `Bearer ${obterToken()}` },
  });
}

export async function alterarStatusUsuario(id, ativo) {
  return requisitar(`/admin/usuarios/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${obterToken()}`,
    },
    body: JSON.stringify({ ativo }),
  });
}

/* ===============================
   NEGÓCIOS
================================ */
export async function criarNegocio(dados) {
  return requisitar("/negocios/criar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${obterToken()}`,
    },
    body: JSON.stringify(dados),
  });
}

export async function listarNegociosUsuario() {
  return requisitar("/negocios", {
    method: "GET",
    headers: { Authorization: `Bearer ${obterToken()}` },
  });
}

export async function buscarNegocio(negocioId) {
  return requisitar(`/negocios/${negocioId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${obterToken()}` },
  });
}

export async function atualizarNegocio(negocioId, dados) {
  return requisitar(`/negocios/${negocioId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${obterToken()}`,
    },
    body: JSON.stringify(dados),
  });
}

/* ===============================
   PRODUTOS (por negócio)
================================ */
export async function listarProdutos(negocioId) {
  return requisitar(`/negocios/${negocioId}/produtos`, {
    method: "GET",
    headers: { Authorization: `Bearer ${obterToken()}` },
  });
}

export async function criarProduto(negocioId, dados) {
  return requisitar(`/negocios/${negocioId}/produtos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${obterToken()}`,
    },
    body: JSON.stringify(dados),
  });
}

export async function atualizarProduto(negocioId, produtoId, dados) {
  return requisitar(`/negocios/${negocioId}/produtos/${produtoId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${obterToken()}`,
    },
    body: JSON.stringify(dados),
  });
}

export async function deletarProduto(negocioId, produtoId) {
  return requisitar(`/negocios/${negocioId}/produtos/${produtoId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${obterToken()}` },
  });
}

/* ===============================
   PERFIL DO USUÁRIO
================================ */
export async function buscarPerfilUsuario() {
  return requisitar("/usuarios/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${obterToken()}` },
  });
}

export async function atualizarPerfilUsuario(dados) {
  return requisitar("/usuarios/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${obterToken()}`,
    },
    body: JSON.stringify(dados),
  });
}
