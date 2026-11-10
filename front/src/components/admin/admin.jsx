
import { useState, useEffect, useMemo } from "react";
import "./admin.css";
import {
  ShieldCheck,
  Users,
  UserCheck,
  Building2,
  Package,
  TriangleAlert,
  MessageSquare,
  DollarSign,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Ban,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  buscarPerfilUsuario,
  buscarResumoAdmin,
  buscarUsuariosAdmin,
  buscarNegociosAdmin,
  alterarStatusUsuario,
} from "../../api";

/* ── Utilidades ── */

function formatarBRL(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(valor) {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function pegarIniciais(nome) {
  if (!nome) return "?";
  const partes = String(nome).trim().split(/\s+/).filter(Boolean);
  const a = partes[0]?.[0] || "";
  const b = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

/* ── Acesso negado ── */
function AcessoNegado({ onNavegar }) {
  return (
    <div className="adm-page">
      <div className="adm-negado">
        <div className="adm-negado-icon">
          <Lock size={30} strokeWidth={1.8} />
        </div>
        <h1>Acesso restrito</h1>
        <p>
          Esta área é exclusiva para administradores. Sua conta não tem
          permissão para acessá-la.
        </p>
        <button
          className="adm-btn-voltar"
          onClick={() => onNavegar && onNavegar("dashboard")}
        >
          <ArrowLeft size={16} strokeWidth={2.2} />
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );
}

export default function DashboardAdmin({ onNavegar }) {
  const [verificando, setVerificando] = useState(true);
  const [ehAdmin, setEhAdmin] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [resumo, setResumo] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [busca, setBusca] = useState("");
  const [alterandoId, setAlterandoId] = useState(null);

  /* 1) Confirma NO SERVIDOR se o usuário logado é admin */
  useEffect(() => {
    let montado = true;

    (async () => {
      try {
        const perfil = await buscarPerfilUsuario();
        if (montado) setEhAdmin(perfil?.tipo === "admin");
      } catch {
        if (montado) setEhAdmin(false);
      } finally {
        if (montado) setVerificando(false);
      }
    })();

    return () => {
      montado = false;
    };
  }, []);

  /* 2) Só carrega os dados se for admin */
  useEffect(() => {
    if (!ehAdmin) return undefined;

    let montado = true;

    (async () => {
      setCarregando(true);
      setErro("");

      try {
        const [r, u, n] = await Promise.all([
          buscarResumoAdmin(),
          buscarUsuariosAdmin(),
          buscarNegociosAdmin(),
        ]);

        if (!montado) return;

        setResumo(r);
        setUsuarios(Array.isArray(u) ? u : []);
        setNegocios(Array.isArray(n) ? n : []);
      } catch (error) {
        if (montado) {
          setErro(
            error.message || "Não foi possível carregar os dados do painel."
          );
        }
      } finally {
        if (montado) setCarregando(false);
      }
    })();

    return () => {
      montado = false;
    };
  }, [ehAdmin]);

  async function recarregar() {
    setCarregando(true);
    setErro("");

    try {
      const [r, u, n] = await Promise.all([
        buscarResumoAdmin(),
        buscarUsuariosAdmin(),
        buscarNegociosAdmin(),
      ]);

      setResumo(r);
      setUsuarios(Array.isArray(u) ? u : []);
      setNegocios(Array.isArray(n) ? n : []);
    } catch (error) {
      setErro(error.message || "Não foi possível carregar os dados do painel.");
    } finally {
      setCarregando(false);
    }
  }

  async function alternarStatus(usuario) {
    const novoStatus = !usuario.ativo;
    setAlterandoId(usuario.id);
    setErro("");

    try {
      await alterarStatusUsuario(usuario.id, novoStatus);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, ativo: novoStatus } : u))
      );
    } catch (error) {
      setErro(error.message || "Não foi possível alterar o status do usuário.");
    } finally {
      setAlterandoId(null);
    }
  }

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return usuarios;

    return usuarios.filter((u) =>
      [u.nome, u.email, u.tipo].some((v) =>
        String(v || "").toLowerCase().includes(termo)
      )
    );
  }, [usuarios, busca]);

  if (verificando) {
    return (
      <div className="adm-page">
        <div className="adm-loading">
          <Loader2 className="adm-girando" size={24} strokeWidth={2} />
          Verificando permissões...
        </div>
      </div>
    );
  }

  if (!ehAdmin) return <AcessoNegado onNavegar={onNavegar} />;

  const r = resumo || {};

  const kpis = [
    {
      label: "Usuários",
      value: r.total_usuarios ?? usuarios.length,
      cls: "azul",
      Icone: Users,
    },
    {
      label: "Usuários ativos",
      value: r.usuarios_ativos ?? usuarios.filter((u) => u.ativo).length,
      cls: "verde",
      Icone: UserCheck,
    },
    {
      label: "Administradores",
      value: r.total_admins ?? usuarios.filter((u) => u.tipo === "admin").length,
      cls: "laranja",
      Icone: ShieldCheck,
    },
    {
      label: "Negócios",
      value: r.total_negocios ?? negocios.length,
      cls: "roxo",
      Icone: Building2,
    },
    {
      label: "Produtos",
      value: r.total_produtos ?? 0,
      cls: "azul",
      Icone: Package,
    },
    {
      label: "Alertas pendentes",
      value: r.alertas_pendentes ?? 0,
      sub: `de ${r.total_alertas ?? 0} alertas`,
      cls: "vermelho",
      Icone: TriangleAlert,
    },
    {
      label: "Conversas com IA",
      value: r.total_conversas ?? 0,
      cls: "ciano",
      Icone: MessageSquare,
    },
    {
      label: "Receita total",
      value: formatarBRL(r.receita_total),
      sub: "soma das receitas mensais",
      cls: "verde",
      Icone: DollarSign,
    },
  ];

  return (
    <div className="adm-page">
      <header className="adm-header">
        <div className="adm-header-left">
          <div className="adm-badge">
            <ShieldCheck size={15} strokeWidth={2.4} />
            Administrador
          </div>
          <h1>Painel de Administração</h1>
          <p>Visão geral de todos os usuários e negócios da plataforma.</p>
        </div>

        <button
          className="adm-refresh"
          onClick={recarregar}
          disabled={carregando}
          title="Atualizar dados"
        >
          <RefreshCw size={16} strokeWidth={2} />
          Atualizar
        </button>
      </header>

      <div className="adm-body">
        {erro && (
          <div className="adm-erro">
            <AlertCircle size={17} strokeWidth={2} />
            <span>{erro}</span>
          </div>
        )}

        {/* KPIs */}
        <div className="adm-kpis">
          {kpis.map(({ label, value, sub, cls, Icone }) => (
            <div key={label} className="adm-kpi">
              <div className={`adm-kpi-icon ${cls}`}>
                <Icone size={18} strokeWidth={2} />
              </div>
              <div className="adm-kpi-texto">
                <div className="adm-kpi-label">{label}</div>
                <div className="adm-kpi-value">{value}</div>
                {sub && <div className="adm-kpi-sub">{sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* USUÁRIOS */}
        <section className="adm-card">
          <div className="adm-card-head">
            <h2>Usuários</h2>

            <div className="adm-busca">
              <Search size={15} strokeWidth={2} />
              <input
                placeholder="Buscar por nome, e-mail ou tipo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          {carregando ? (
            <div className="adm-loading">
              <Loader2 className="adm-girando" size={22} strokeWidth={2} />
              Carregando usuários...
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="adm-vazio">
              <Users size={24} strokeWidth={1.8} />
              <p>Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <div className="adm-tabela-wrap">
              <table className="adm-tabela">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>E-mail</th>
                    <th>Tipo</th>
                    <th>Cadastro</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="adm-usuario">
                          <span className="adm-avatar">
                            {pegarIniciais(u.nome)}
                          </span>
                          <span className="adm-usuario-nome">
                            {u.nome || "Sem nome"}
                          </span>
                        </div>
                      </td>
                      <td className="adm-muted">{u.email || "—"}</td>
                      <td>
                        <span
                          className={`adm-tag ${
                            u.tipo === "admin" ? "admin" : "usuario"
                          }`}
                        >
                          {u.tipo === "admin" ? "Admin" : "Usuário"}
                        </span>
                      </td>
                      <td className="adm-muted">{formatarData(u.criado_em)}</td>
                      <td>
                        <span className={`adm-status ${u.ativo ? "on" : "off"}`}>
                          {u.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`adm-btn-status ${
                            u.ativo ? "desativar" : "ativar"
                          }`}
                          onClick={() => alternarStatus(u)}
                          disabled={alterandoId === u.id}
                        >
                          {alterandoId === u.id ? (
                            <Loader2
                              className="adm-girando"
                              size={13}
                              strokeWidth={2.4}
                            />
                          ) : u.ativo ? (
                            <Ban size={13} strokeWidth={2.4} />
                          ) : (
                            <CheckCircle2 size={13} strokeWidth={2.4} />
                          )}
                          {u.ativo ? "Desativar" : "Ativar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* NEGÓCIOS */}
        <section className="adm-card">
          <div className="adm-card-head">
            <h2>Negócios</h2>
            <span className="adm-count">{negocios.length} cadastrado(s)</span>
          </div>

          {carregando ? (
            <div className="adm-loading">
              <Loader2 className="adm-girando" size={22} strokeWidth={2} />
              Carregando negócios...
            </div>
          ) : negocios.length === 0 ? (
            <div className="adm-vazio">
              <Building2 size={24} strokeWidth={1.8} />
              <p>Nenhum negócio cadastrado ainda.</p>
            </div>
          ) : (
            <div className="adm-negocios">
              {negocios.map((n) => (
                <div key={n.id} className="adm-negocio">
                  <div className="adm-negocio-top">
                    <div className="adm-negocio-icon">
                      <Building2 size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="adm-negocio-nome">
                        {n.nome || "Sem nome"}
                      </div>
                      <div className="adm-negocio-seg">
                        {n.segmento || "Segmento não informado"}
                      </div>
                    </div>
                  </div>

                  <div className="adm-negocio-info">
                    <span>
                      <MapPin size={12} strokeWidth={2.2} />
                      {n.localizacao || "Local não informado"}
                    </span>
                    <span>
                      <Users size={12} strokeWidth={2.2} />
                      {n.funcionarios ?? 0} colaborador(es)
                    </span>
                    <span>
                      <DollarSign size={12} strokeWidth={2.2} />
                      Receita: {formatarBRL(n.receita_mensal)}
                    </span>
                    <span>
                      <Calendar size={12} strokeWidth={2.2} />
                      Desde {formatarData(n.criado_em)}
                    </span>
                  </div>

                  <div className="adm-negocio-dono">
                    <Mail size={12} strokeWidth={2.2} />
                    {n.usuario_nome || n.usuario_email || "Sem responsável"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
