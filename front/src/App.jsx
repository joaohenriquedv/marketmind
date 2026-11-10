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
import Admin from "./components/admin/admin";
import Perfil from "./components/perfil/perfil.jsx";
import Planos from "./components/planos/planos.jsx";

/* A navbar fixa é definida no navbar.css, que o navbar.jsx já importa.
   Não é preciso nenhum import de CSS aqui. */

/* Páginas de autenticação não exibem a navbar */
const PAGINAS_SEM_NAVBAR = ["login", "cadastro-usuario", "cadastro-empresa"];

/* Relaciona a página atual com o item que deve ficar ativo no menu.
   Assim a navbar é renderizada uma única vez, aqui no App. */
const MENU_ATIVO = {
  home: "principal",
  principal: "principal",
  dashboard: "dashboard",
  produto: "produto",
  alertas: "alertas",
  contato: "contato",
  perfil: "perfil",
  planos: "planos",
  admin: "admin",
};

function Home({ setPagina }) {
  return (
    <>
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

  const semNavbar = PAGINAS_SEM_NAVBAR.includes(pagina);

  function renderizarPagina() {
    switch (pagina) {
      case "cadastro-usuario":
        return (
          <Cadastro
            onVoltar={() => setPagina("login")}
            onCadastrar={() => setPagina("cadastro-empresa")}
          />
        );

      case "login":
        return (
          <Login
            onNavegar={setPagina}
            onIrParaCadastro={() => setPagina("cadastro-usuario")}
          />
        );

      case "cadastro-empresa":
        return (
          <Empresa
            onBack={() => setPagina("cadastro-usuario")}
            onSubmit={() => setPagina("home")}
          />
        );

      case "home":
      case "principal":
        return <Home setPagina={setPagina} />;

      case "produto":
        return <Produtos onNavegar={setPagina} />;

      case "dashboard":
        return <Dashboard onNavegar={setPagina} />;

      case "contato":
        return <Contato onNavegar={setPagina} />;

      case "alertas":
        return <Alertas onNavegar={setPagina} />;

      case "perfil":
        return <Perfil onNavegar={setPagina} />;

      case "planos":
        return <Planos onNavegar={setPagina} />;

      case "admin":
        return <Admin onNavegar={setPagina} />;

      default:
        return <Home setPagina={setPagina} />;
    }
  }

  return (
    <>
      {!semNavbar && (
        <Navbar
          onNavegar={setPagina}
          paginaAtiva={MENU_ATIVO[pagina] || pagina}
        />
      )}

      {renderizarPagina()}
    </>
  );
}

export default App;
