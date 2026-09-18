
const API_URL = "http://localhost:3000";

function obterToken() {
  return localStorage.getItem("token");
}

async function tratarResposta(resposta) {
  let dados;

  try {
    dados = await resposta.json();
  } catch (error) {
    throw new Error(
      "O servidor não retornou uma resposta válida.",
      { cause: error }
    );
  }

  if (!resposta.ok) {
    throw new Error(
      dados.erro ||
      dados.mensagem ||
      "Erro ao realizar a operação."
    );
  }

  return dados;
}

// ===============================
// CADASTRO
// ===============================

export async function cadastrarUsuario(dados) {
  const resposta = await fetch(
    `${API_URL}/usuarios/cadastrar`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dados)
    }
  );

  return tratarResposta(resposta);
}

// ===============================
// LOGIN
// ===============================

export async function loginUsuario(dados) {
  const resposta = await fetch(
    `${API_URL}/usuarios/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dados)
    }
  );

  return tratarResposta(resposta);
}

// ===============================
// ADMIN - RESUMO
// ===============================

export async function buscarResumoAdmin() {
  const resposta = await fetch(
    `${API_URL}/admin/resumo`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${obterToken()}`
      }
    }
  );

  return tratarResposta(resposta);
}

// ===============================
// ADMIN - USUÁRIOS
// ===============================

export async function buscarUsuariosAdmin() {
  const resposta = await fetch(
    `${API_URL}/admin/usuarios`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${obterToken()}`
      }
    }
  );

  return tratarResposta(resposta);
}

// ===============================
// ADMIN - NEGÓCIOS
// ===============================

export async function buscarNegociosAdmin() {
  const resposta = await fetch(
    `${API_URL}/admin/negocios`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${obterToken()}`
      }
    }
  );

  return tratarResposta(resposta);
}

// ===============================
// ADMIN - ALTERAR STATUS
// ===============================

export async function alterarStatusUsuario(id, ativo) {
  const resposta = await fetch(
    `${API_URL}/admin/usuarios/${id}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${obterToken()}`
      },
      body: JSON.stringify({
        ativo
      })
    }
  );

  return tratarResposta(resposta);
}

// ===============================
// NEGÓCIOS - CRIAR
// ===============================

export async function criarNegocio(dados) {
  const resposta = await fetch(
    `${API_URL}/negocios/criar`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${obterToken()}`
      },
      body: JSON.stringify(dados)
    }
  );

  return tratarResposta(resposta);
}

// ===============================
// NEGÓCIOS - LISTAR DO USUÁRIO
// ===============================

export async function listarNegociosUsuario() {
  const resposta = await fetch(
    `${API_URL}/negocios`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${obterToken()}`
      }
    }
  );

  return tratarResposta(resposta);
}

// ===============================
// NEGÓCIOS - BUSCAR UM
// ===============================

export async function buscarNegocio(negocioId) {
  const resposta = await fetch(
    `${API_URL}/negocios/${negocioId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${obterToken()}`
      }
    }
  );

  return tratarResposta(resposta);
}
