// /* BASE:
//    - VITE_API_URL definida  -> usa ela
//    - VITE_API_URL vazia ("") -> mesma origem (site e API no mesmo domínio)
//    - não definida            -> localhost:3000 (desenvolvimento)
// */
// const ENV_URL = import.meta.env.VITE_API_URL;
// const BASE =
//   ENV_URL === undefined
//     ? "http://localhost:3000"
//     : String(ENV_URL).replace(/\/+$/, "");

// const TIMEOUT_MS = 20000;

// async function postJson(caminho, corpo) {
//   const controlador = new AbortController();
//   const timer = setTimeout(() => controlador.abort(), TIMEOUT_MS);

//   let res;
//   try {
//     res = await fetch(`${BASE}${caminho}`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(corpo),
//       signal: controlador.signal,
//     });
//   } catch (e) {
//     clearTimeout(timer);
//     if (e?.name === "AbortError") {
//       throw new Error("O servidor demorou para responder. Tente novamente.");
//     }
//     throw new Error(
//       "Não foi possível conectar ao servidor. Verifique sua conexão e tente de novo."
//     );
//   }
//   clearTimeout(timer);

//   const dados = await res.json().catch(() => ({}));

//   if (!res.ok) {
//     throw new Error(
//       dados.mensagem ||
//         dados.erro ||
//         dados.message ||
//         "Não foi possível concluir a solicitação."
//     );
//   }

//   return dados;
// }

// /* Passo 1 — pede o link por e-mail */
// export function recuperarSenha(email) {
//   return postJson("/senha/recuperar", { email });
// }

// /* Passo 2 — grava a nova senha com o token do e-mail */
// export function redefinirSenha(token, senha) {
//   return postJson("/senha/redefinir", { token, senha });
// }
