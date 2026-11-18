
import { useState, useRef, useEffect } from "react";
import "./navbar.css";
import {
  Bell,
  CreditCard,
  MessageCircle,
  Home,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import NovoRelatorioModal from "./NovoRelatorioModal";

function lerUsuario() {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function pegarIniciais(nome) {
  if (!nome) return "?";
  const partes = String(nome).trim().split(/\s+/).filter(Boolean);
  const a = partes[0]?.[0] || "";
  const b = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

function Navbar({ onNavegar, paginaAtiva }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [gradeAberta, setGradeAberta] = useState(false);
  const [relatorioAberto, setRelatorioAberto] = useState(false);
  const [usuario] = useState(lerUsuario);
  const menuRef = useRef(null);
  const gradeRef = useRef(null);

  useEffect(() => {
    function handleClickFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
      if (gradeRef.current && !gradeRef.current.contains(e.target)) {
        setGradeAberta(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  function handleSair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("negocio");
    setMenuAberto(false);
    onNavegar("login");
  }

  function handlePerfil() {
    setMenuAberto(false);
    onNavegar("perfil");
  }

  const iniciais = pegarIniciais(usuario?.nome ?? usuario?.name);
  const ehAdmin = usuario?.tipo === "admin";
  const atalhos = [
    { label: "Início", destino: "home", Icone: Home },
    { label: "Dashboard", destino: "dashboard", Icone: LayoutDashboard },
    { label: "Produtos", destino: "produto", Icone: Package },
    { label: "Monitoramentos", destino: "alertas", Icone: Bell },
    { label: "Contato", destino: "contato", Icone: MessageCircle },
    { label: "Meu perfil", destino: "perfil", Icone: UserRound },
    { label: "Planos", destino: "planos", Icone: CreditCard },
  ];

  if (ehAdmin) {
    atalhos.push({ label: "Painel admin", destino: "admin", Icone: ShieldCheck });
  }

  return (
    <>
      <header className="perfil-navbar">
        <div
          className="perfil-logo"
          onClick={() => onNavegar("home")}
          style={{ cursor: "pointer" }}
        >
          <span className="logo-market">Market</span>
          <span className="logo-mind">Mind</span>
        </div>

        <nav className="perfil-menu">
          <a
            className={paginaAtiva === "dashboard" ? "ativo" : ""}
            onClick={() => onNavegar("dashboard")}
          >
            Dashboard
          </a>
          <a
            className={paginaAtiva === "produto" ? "ativo" : ""}
            onClick={() => onNavegar("produto")}
          >
            Produtos
          </a>
          <a
            className={paginaAtiva === "alertas" ? "ativo" : ""}
            onClick={() => onNavegar("alertas")}
          >
            Monitoramentos
          </a>
          <a
            className={paginaAtiva === "contato" ? "ativo" : ""}
            onClick={() => onNavegar("contato")}
          >
            Contato
          </a>

          {/* Só aparece para administradores */}
          {ehAdmin && (
            <a
              className={`admin-link ${
                paginaAtiva === "admin" ? "ativo" : ""
              }`}
              onClick={() => onNavegar("admin")}
            >
              <ShieldCheck size={15} strokeWidth={2.2} />
              Admin
            </a>
          )}
        </nav>

        <div className="perfil-actions">
          <div className="navbar-apps" ref={gradeRef}>
            <button
              type="button"
              className={`navbar-apps-button${gradeAberta ? " ativo" : ""}`}
              onClick={() => setGradeAberta((aberta) => !aberta)}
              aria-label="Abrir menu de páginas"
              aria-expanded={gradeAberta}
              aria-haspopup="menu"
              title="Páginas do MarketMind"
            >
              <LayoutGrid size={20} strokeWidth={2} />
            </button>

            {gradeAberta && (
              <div className="navbar-apps-menu" role="menu">
                <div className="navbar-apps-titulo">Páginas</div>
                <div className="navbar-apps-grid">
                  {atalhos.map(({ label, destino, Icone }) => (
                    <button
                      type="button"
                      role="menuitem"
                      key={destino}
                      className={`navbar-apps-item${
                        paginaAtiva === destino ? " ativo" : ""
                      }`}
                      onClick={() => {
                        setGradeAberta(false);
                        onNavegar(destino);
                      }}
                    >
                      <span className="navbar-apps-icone">
                        <Icone size={19} strokeWidth={2} />
                      </span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="navbar-user" ref={menuRef}>
            <button
              className="user-button"
              onClick={() => setMenuAberto(!menuAberto)}
              aria-label="Menu do usuário"
            >
              {usuario?.foto ? (
                <img
                  className="user-avatar-img"
                  src={usuario.foto}
                  alt={usuario?.nome || "Usuário"}
                />
              ) : (
                <span className="user-avatar">{iniciais}</span>
              )}
              <span className="user-arrow">⌄</span>
            </button>

            {menuAberto && (
              <div className="navbar-dropdown">
                <button onClick={handlePerfil} className="navbar-dropdown-item">
                  <UserRound size={16} strokeWidth={2} />
                  Meu Perfil
                </button>

                {ehAdmin && (
                  <button
                    onClick={() => {
                      setMenuAberto(false);
                      onNavegar("admin");
                    }}
                    className="navbar-dropdown-item"
                  >
                    <ShieldCheck size={16} strokeWidth={2} />
                    Painel Admin
                  </button>
                )}

                <button
                  onClick={handleSair}
                  className="navbar-dropdown-item sair"
                >
                  <LogOut size={16} strokeWidth={2} />
                  Sair da conta
                </button>
              </div>
            )}
          </div>

          <button
            className="new-report-button"
            onClick={() => setRelatorioAberto(true)}
          >
            <Plus size={16} strokeWidth={2.5} />
            Novo Relatório
          </button>
        </div>
      </header>

      <NovoRelatorioModal
        aberto={relatorioAberto}
        onFechar={() => setRelatorioAberto(false)}
      />
    </>
  );
}

export default Navbar;
