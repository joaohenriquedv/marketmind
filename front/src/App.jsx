
import { useState } from "react";
import Cadastro from "./components/cadastro/cadastro.jsx";
import Login from "./components/login/login.jsx";
import RecuperarSenha from "./components/login/RecuperarSenha.jsx";
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
const PAGINAS_SEM_NAVBAR = [
  "login",
  "cadastro-usuario",
  "cadastro-empresa",
  "recuperar-senha",
];

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
      <CTA onComecar={() => setPagina("cadastro-usuario")} />
    </>
  );
}

function App() {
  const [pagina, setPagina] = useState("login");

  const semNavbar = PAGINAS_SEM_NAVBAR.includes(pagina);

  function navegar(destino) {
    setPagina(destino);
  }

  function renderizarPagina() {
    switch (pagina) {
      case "cadastro-usuario":
        return (
          <Cadastro
            onVoltar={() => navegar("login")}
            onCadastrar={() => navegar("cadastro-empresa")}
          />
        );

      case "login":
        return (
          <Login
            onNavegar={navegar}
            onIrParaCadastro={() => navegar("cadastro-usuario")}
          />
        );

      /* A recuperação mostra o formulário normal e, ao confirmar,
         exibe o aviso de manutenção (MANUTENCAO em recuperarSenha.jsx).
         Nenhuma chamada de API acontece aqui. */
      case "recuperar-senha":
        return <RecuperarSenha onVoltar={() => navegar("login")} />;

      case "cadastro-empresa":
        return (
          <Empresa
            onBack={() => navegar("cadastro-usuario")}
            onSubmit={() => navegar("home")}
          />
        );

      case "home":
      case "principal":
        return <Home setPagina={navegar} />;

      case "produto":
        return <Produtos onNavegar={navegar} />;

      case "dashboard":
        return <Dashboard onNavegar={navegar} />;

      case "contato":
        return <Contato onNavegar={navegar} />;

      case "alertas":
        return <Alertas onNavegar={navegar} />;

      case "perfil":
        return <Perfil onNavegar={navegar} />;

      case "planos":
        return <Planos onNavegar={navegar} />;

      case "admin":
        return <Admin onNavegar={navegar} />;

      default:
        return <Home setPagina={navegar} />;
    }
  }

  return (
    <>
      {!semNavbar && (
        <Navbar
          onNavegar={navegar}
          paginaAtiva={MENU_ATIVO[pagina] || pagina}
        />
      )}

      {renderizarPagina()}
      {!semNavbar && <ChatBot />}
    </>
  );
}

export default App;
