import "./navbar.css";

export default function Navbar({ onNavegar, paginaAtiva }) {
  return (
    <nav className="mm-nav">
      <a className="mm-nav-logo" href="principal" onClick={(e) => { e.preventDefault(); onNavegar('principal') }}>
        <span className="mm-nav-logo-icon"></span>
        Market<span>Mind</span>
      </a>
      <ul className="mm-nav-links">
        <li>
          <a href="principal" className={paginaAtiva === 'principal' ? 'active' : ''} onClick={(e) => { e.preventDefault(); onNavegar('principal') }}>
            Início
          </a>
        </li>
        <li>
          <a href="produto" className={paginaAtiva === 'produto' ? 'active' : ''} onClick={(e) => { e.preventDefault(); onNavegar('produto') }}>
            Produto
          </a>
        </li>
        <li>
          <a href="dashboard" className={paginaAtiva === 'dashboard' ? 'active' : ''} onClick={(e) => { e.preventDefault(); onNavegar('dashboard') }}>
            Dashboard
          </a>
        </li>
        <li>
          <a href="contato" className={paginaAtiva === 'contato' ? 'active' : ''} onClick={(e) => { e.preventDefault(); onNavegar('contato') }}>
            Contato
          </a>
        </li>
      </ul>
      <div className="mm-nav-avatar-wrap">
        <div className="mm-nav-avatar">A</div>
        <span className="mm-nav-caret">▾</span>
      </div>
    </nav>
  );
}