import { useState, useEffect } from "react";
import {
  buscarResumoAdmin,
  buscarUsuariosAdmin,
  alterarStatusUsuario
} from "../../api";
import "./DashboardAdmin.css";

function DashboardAdmin({ onNavegar }) {
  const [usuarios, setUsuarios] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const usuarioLogado = JSON.parse(
    localStorage.getItem("usuario") || "null"
  );

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [dadosResumo, dadosUsuarios] = await Promise.all([
        buscarResumoAdmin(),
        buscarUsuariosAdmin()
      ]);

      setResumo(dadosResumo);
      setUsuarios(dadosUsuarios);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      setErro(error.message || "Erro ao carregar dados do dashboard.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleAlterarStatus(usuario) {
    const novoStatus = !usuario.ativo;
    const acao = novoStatus ? "ativar" : "desativar";

    const confirmou = window.confirm(
      `Deseja realmente ${acao} o usuário ${usuario.nome}?`
    );

    if (!confirmou) {
      return;
    }

    try {
      await alterarStatusUsuario(usuario.id, novoStatus);

      setUsuarios((listaAtual) =>
        listaAtual.map((item) =>
          item.id === usuario.id
            ? { ...item, ativo: novoStatus }
            : item
        )
      );

      setResumo((resumoAtual) =>
        resumoAtual
          ? {
              ...resumoAtual,
              usuarios_ativos: novoStatus
                ? Number(resumoAtual.usuarios_ativos) + 1
                : Number(resumoAtual.usuarios_ativos) - 1
            }
          : resumoAtual
      );
    } catch (error) {
      alert(error.message);
    }
  }

  function handleSair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    onNavegar("login");
  }

  function obterInicial(nome) {
    return nome ? nome.charAt(0).toUpperCase() : "?";
  }

  if (carregando) {
    return (
      <div className="admin-estado">
        <div className="admin-carregando"></div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="admin-estado">
        <p>{erro}</p>
        <button onClick={carregarDados}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-logo">
            <div className="admin-logo-simbolo">MM</div>
            <div>
              <strong>MarketMind</strong>
              <span>Painel Admin</span>
            </div>
          </div>

          <nav className="admin-menu">
            <button className="ativo">Dashboard</button>
            <button onClick={() => onNavegar("principal")}>
              Área Principal
            </button>
          </nav>
        </div>

        <button className="admin-sair" onClick={handleSair}>
          Sair
        </button>
      </aside>

      <main className="admin-conteudo">
        <header className="admin-cabecalho">
          <div>
            <span className="admin-bem-vindo">Bem-vindo(a)</span>
            <h1>Dashboard Administrativo</h1>
            <p>Visão geral da plataforma MarketMind</p>
          </div>

          <div className="admin-perfil">
            <div className="admin-avatar">
              {obterInicial(usuarioLogado?.nome)}
            </div>
            <div>
              <strong>{usuarioLogado?.nome || "Administrador"}</strong>
              <span>{usuarioLogado?.email}</span>
            </div>
          </div>
        </header>

        {resumo && (
          <section className="admin-cards">
            <div className="admin-card">
              <span>Total de Usuários</span>
              <strong>{resumo.total_usuarios}</strong>
              <small>{resumo.usuarios_ativos} ativos</small>
            </div>

            <div className="admin-card">
              <span>Administradores</span>
              <strong>{resumo.total_admins}</strong>
              <small>Contas com acesso total</small>
            </div>

            <div className="admin-card">
              <span>Negócios Cadastrados</span>
              <strong>{resumo.total_negocios}</strong>
              <small>{resumo.total_produtos} produtos</small>
            </div>

            <div className="admin-card">
              <span>Alertas</span>
              <strong>{resumo.total_alertas}</strong>
              <small>{resumo.alertas_pendentes} pendentes</small>
            </div>

            <div className="admin-card">
              <span>Conversas</span>
              <strong>{resumo.total_conversas}</strong>
              <small>Total registrado</small>
            </div>

            <div className="admin-card">
              <span>Receita Total</span>
              <strong className="admin-valor">
                {Number(resumo.receita_total).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                })}
              </strong>
              <small>Soma de todos os negócios</small>
            </div>
          </section>
        )}

        <section className="admin-painel">
          <div className="admin-painel-cabecalho">
            <div>
              <h2>Usuários</h2>
              <p>Gerencie o acesso dos usuários da plataforma</p>
            </div>

            <button className="admin-atualizar" onClick={carregarDados}>
              Atualizar
            </button>
          </div>

          <div className="admin-tabela-container">
            <table className="admin-tabela">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Cadastro</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 && (
                  <tr>
                    <td className="admin-vazio" colSpan={5}>
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}

                {usuarios.map((usuario) => {
                  const ehContaAtual = usuario.id === usuarioLogado?.id;

                  return (
                    <tr key={usuario.id}>
                      <td>
                        <div className="admin-usuario">
                          <div className="admin-inicial">
                            {obterInicial(usuario.nome)}
                          </div>
                          <div>
                            <strong>{usuario.nome}</strong>
                            <span>{usuario.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-etiqueta ${usuario.tipo}`}
                        >
                          {usuario.tipo === "admin" ? "Admin" : "Usuário"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-status ${
                            usuario.ativo ? "ativo" : "inativo"
                          }`}
                        >
                          {usuario.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td>
                        {new Date(usuario.criado_em).toLocaleDateString(
                          "pt-BR"
                        )}
                      </td>

                      <td>
                        {ehContaAtual ? (
                          <span className="admin-conta-atual">
                            Sua conta
                          </span>
                        ) : (
                          <button
                            className={`admin-botao ${
                              usuario.ativo ? "desativar" : "ativar"
                            }`}
                            onClick={() => handleAlterarStatus(usuario)}
                          >
                            {usuario.ativo ? "Desativar" : "Ativar"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DashboardAdmin;