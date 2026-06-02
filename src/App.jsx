import { useState } from "react";
import Cadastro from "./components/cadastro.jsx";
import Login from "./components/login.jsx";
import Principal from "./components/principal.jsx";
import Problema from "./components/problemas.jsx";
import Empresa from "./components/empresa.jsx";
import Features from "./components/features.jsx";
import ComoFunciona from "./components/comofunciona.jsx";
import Diferencial from "./components/diferencial.jsx";
import CTA from "./components/cta.jsx";
import Produtos from "./components/produto.jsx";
import Navbar from "./components/navbar.jsx";

function Home({ setPagina }) {
  return (
    <>
      <Navbar />
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
