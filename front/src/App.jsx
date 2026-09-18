
import { useState } from "react";

import Cadastro from "./components/cadastro/cadastro.jsx";
import Login from "./components/login/login.jsx";
import Principal from "./components/principal/principal.jsx";
import Problema from "./components/principal/problemas.jsx";
import Empresa from "./components/empresa/empresa.jsx";
import Features from "./components/principal/features.jsx";
import ComoFunciona from "./components/principal/comofunciona.jsx";
import Diferencial from "./components/principal/diferencial.jsx";
import CTA from "./components/principal/cta.jsx";
import Produtos from "./components/produto/produto.jsx";
import Navbar from "./components/navbar.jsx";
import Dashboard from "./components/dashboard/dashboard.jsx";
import Alertas from "./components/alertas.jsx";
import ChatBot from "./chatbot/chatbot";
import Contato from "./components/contato/contato.jsx";
import DashboardAdmin from "./components/admin/DashboardAdmin.jsx";

function Home({ setPagina, pagina }) {
  return (
    <>
      <Navbar onNavegar={setPagina} paginaAtiva={pagina} />
      <Principal onNavegar={setPagina} />
      <Problema />
      <Diferencial />
      <Features />
      <ComoFunciona />
      <ChatBot />
      <CTA onComecar={() => setPagina("cadastro-usuario")} />
    </>
  );
}

function App() {
  const [pagina, setPagina] = useState("login");

  if (pagina === "cadastro-usuario") {
    return (
      <Cadastro
        onVoltar={() => setPagina("login")}
        onCadastrar={() => setPagina("cadastro-empresa")}
      />
    );
  }

  if (pagina === "login") {
    return (
      <Login
        onNavegar={setPagina}
        onIrParaCadastro={() => setPagina("cadastro-usuario")}
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

  if (pagina === "home" || pagina === "principal") {
    return <Home setPagina={setPagina} pagina={pagina} />;
  }

  if (pagina === "produto") {
    return (
      <>
        <Navbar onNavegar={setPagina} paginaAtiva="produto" />
        <Produtos onNavegar={setPagina} />
      </>
    );
  }

  if (pagina === "dashboard") {
    return (
      <>
        <Navbar onNavegar={setPagina} paginaAtiva="dashboard" />
        <Dashboard onNavegar={setPagina} />
      </>
    );
  }

  if (pagina === "contato") {
    return (
      <>
        <Navbar onNavegar={setPagina} paginaAtiva="contato" />
        <Contato onNavegar={setPagina} />
      </>
    );
  }

  if (pagina === "alertas") {
    return (
      <>
        <Navbar onNavegar={setPagina} paginaAtiva="alertas" />
        <Alertas onNavegar={setPagina} />
      </>
    );
  }

  if (pagina === "admin") {
    return (
      <>
        <Navbar onNavegar={setPagina} paginaAtiva="admin" />
        <DashboardAdmin onNavegar={setPagina} />
      </>
    );
  }

  return <Home setPagina={setPagina} pagina="principal" />;
}

export default App;
