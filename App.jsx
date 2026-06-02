import { useState } from "react";
import Principal from "./components/principal/principal.jsx";
import Problema from "./components/principal/problemas.jsx";
import Empresa from "./components/principal/empresa.jsx";
import Features from "./components/principal/features.jsx";
import ComoFunciona from "./components/principal/comofunciona.jsx";
import Diferencial from "./components/principal/diferencial.jsx";
import CTA from "./components/principal/cta.jsx";
import Produtos from "./components/produto/produto.jsx";
import Cadastro from "./components/cadastro/Cadastro.jsx";
import Login from "./components/login/login.jsx";

function Home({ setPagina }) {
  return (
    <>
      <Principal onNavegar={setPagina} />
      <Problema />
      <Diferencial />
      <Features />
      <ComoFunciona />
      <CTA onComecar={() => setPagina("cadastro-usuario")} />
    </>
  );
}

function App() {
  const [pagina, setPagina] = useState("cadastro-usuario");

  if (pagina === "cadastro-usuario") {
    return (
      <Cadastro
        onVoltar={() => setPagina("login")} // ← "Entrar" vai para login
        onCadastrar={() => setPagina("cadastro-empresa")}
      />
    );
  }

  if (pagina === "login") {
    return (
      <Login
        onEntrar={() => setPagina("produto")} // ← "Entrar" vai para produtos
        onCriarConta={() => setPagina("cadastro-usuario")}
      />
    );
  }

  if (pagina === "cadastro-empresa") {
    return (
      <Empresa
        onBack={() => setPagina("cadastro-usuario")}
        onSubmit={() => setPagina("home")}
      />
    );
  }

  if (pagina === "produto") {
    return <Produtos onNavegar={setPagina} />;
  }

  if (pagina === "dashboard") {
    return <div>Dashboard em breve</div>;
  }

  if (pagina === "contato") {
    return <div>Contato em breve</div>;
  }

  return <Home setPagina={setPagina} />;
}

export default App;
