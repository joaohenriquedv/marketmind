
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
  Pencil,
  Trash2,
  Save,
  TrendingUp,
  TrendingDown,
  Percent,
} from "lucide-react";
import {
  buscarPerfilUsuario,
  buscarResumoAdmin,
  buscarUsuariosAdmin,
  buscarNegociosAdmin,
  buscarProdutosAdmin,
  atualizarNegocioAdmin,
  excluirNegocioAdmin,
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

function formatarTendencia(valor) {
  const s = String(valor || "").toLowerCase();
  if (s.includes("qued")) return "Em queda";
  if (s.includes("cresc")) return "Crescendo";
  return "Estável";
}

function classeTendencia(valor) {
  const s = String(valor || "").toLowerCase();
  if (s.includes("qued")) return "emqueda";
  if (s.includes("cresc")) return "crescendo";
  return "estavel";
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

/* ── Modal: editar negócio ── */
function ModalEditarNegocio({ negocio, salvando, onFechar, onSalvar }) {
  const [form, setForm] = useState({
    nome: negocio?.nome || "",
    segmento: negocio?.segmento || "",
    localizacao: negocio?.localizacao || "",
    receita_mensal: negocio?.receita_mensal ?? 0,
    custos_mensais: negocio?.custos_mensais ?? 0,
    funcionarios: negocio?.funcionarios ?? 0,
    anos_mercado: negocio?.anos_mercado ?? 0,
  });

  const [erro, setErro] = useState("");

  function aoDigitar(evento) {
    const { name, value } = evento.target;
    setForm((atual) => ({ ...atual, [name]: value }));
  }

  function enviar(evento) {
    evento.preventDefault();

    if (!String(form.nome).trim()) {
      setErro("O nome do negócio é obrigatório.");
      return;
    }

    onSalvar({
      nome: String(form.nome).trim(),
      segmento: form.segmento,
      localizacao: form.localizacao,
      receita_mensal: Number(form.receita_mensal) || 0,
      custos_mensais: Number(form.custos_mensais) || 0,
      funcionarios: Number(form.funcionarios) || 0,
      anos_mercado: Number(form.anos_mercado) || 0,
    });
  }

  return (
    <div
      className="adm-modal-overlay"
      onClick={() => !salvando && onFechar()}
      role="presentation"
    >
      <div
        className="adm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Editar negócio"
      >
        <div className="adm-modal-head">
          <div>
            <h2>Editar negócio</h2>
            <p>{negocio?.usuario_nome || negocio?.usuario_email || "—"}</p>
          </div>

          <button
            type="button"
            className="adm-modal-fechar"
            onClick={onFechar}
            disabled={salvando}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form className="adm-modal-body" onSubmit={enviar}>
          {erro && <div className="adm-modal-erro">{erro}</div>}

          <div className="adm-modal-grid">
            <label className="adm-campo full">
              <span>Nome *</span>
              <input
                name="nome"
                value={form.nome}
                onChange={aoDigitar}
                disabled={salvando}
              />
            </label>

            <label className="adm-campo">
              <span>Segmento</span>
              <input
                name="segmento"
                value={form.segmento}
                onChange={aoDigitar}
                disabled={salvando}
              />
            </label>

            <label className="adm-campo">
              <span>Localização</span>
              <input
                name="localizacao"
                value={form.localizacao}
                onChange={aoDigitar}
                disabled={salvando}
              />
            </label>

            <label className="adm-campo">
              <span>Receita mensal (R$)</span>
              <input
                type="number"
                step="0.01"
                name="receita_mensal"
                value={form.receita_mensal}
                onChange={aoDigitar}
                disabled={salvando}
              />
            </label>

            <label className="adm-campo">
              <span>Custos mensais (R$)</span>
              <input
                type="number"
                step="0.01"
                name="custos_mensais"
                value={form.custos_mensais}
                onChange={aoDigitar}
                disabled={salvando}
              />
            </label>

            <label className="adm-campo">
              <span>Funcionários</span>
              <input
                type="number"
                name="funcionarios"
                value={form.funcionarios}
                onChange={aoDigitar}
                disabled={salvando}
              />
            </label>

            <label className="adm-campo">
              <span>Anos de mercado</span>
              <input
                type="number"
                name="anos_mercado"
                value={form.anos_mercado}
                onChange={aoDigitar}
                disabled={salvando}
              />
            </label>
          </div>

          <div className="adm-modal-acoes">
            <button
              type="button"
              className="adm-btn-neutro"
              onClick={onFechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button type="submit" className="adm-btn-primario" disabled={salvando}>
              <Save size={14} strokeWidth={2.2} />
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal: excluir negócio ── */
function ModalExcluirNegocio({ negocio, salvando, onFechar, onConfirmar }) {
  return (
    <div
      className="adm-modal-overlay"
      onClick={() => !salvando && onFechar()}
      role="presentation"
    >
      <div
        className="adm-modal adm-modal-perigo"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label="Excluir negócio"
      >
        <div className="adm-modal-head">
          <div>
            <h2>Excluir negócio</h2>
            <p>Esta ação não pode ser desfeita.</p>
          </div>

          <button
            type="button"
            className="adm-modal-fechar"
            onClick={onFechar}
            disabled={salvando}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="adm-modal-body">
          <p className="adm-confirma-texto">
            Excluir <strong>{negocio?.nome}</strong>?
          </p>

          <ul className="adm-confirma-lista">
            <li>
              {negocio?.total_produtos ?? 0} produto(s) desse negócio serão
              apagados junto.
            </li>
            <li>Alertas e registros ligados a ele também são removidos.</li>
            <li>
              A conta do responsável (
              {negocio?.usuario_nome || negocio?.usuario_email || "—"}) continua
              ativa.
            </li>
          </ul>

          <div className="adm-modal-acoes">
            <button
              type="button"
              className="adm-btn-neutro"
              onClick={onFechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="adm-btn-perigo"
              onClick={onConfirmar}
              disabled={salvando}
            >
              <Trash2 size={14} strokeWidth={2.2} />
              {salvando ? "Excluindo..." : "Excluir definitivamente"}
            </button>
          </div>
        </div>
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
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [buscaNegocio, setBuscaNegocio] = useState("");

  const [editandoNegocio, setEditandoNegocio] = useState(null);
  const [excluindoNegocio, setExcluindoNegocio] = useState(null);
  const [salvandoNegocio, setSalvandoNegocio] = useState(false);
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
        const [r, u, n, pr] = await Promise.all([
          buscarResumoAdmin(),
          buscarUsuariosAdmin(),
          buscarNegociosAdmin(),
          buscarProdutosAdmin(),
        ]);

        if (!montado) return;

        setResumo(r);
        setUsuarios(Array.isArray(u) ? u : []);
        setNegocios(Array.isArray(n) ? n : []);
        setProdutos(Array.isArray(pr) ? pr : []);
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
      const [r, u, n, pr] = await Promise.all([
        buscarResumoAdmin(),
        buscarUsuariosAdmin(),
        buscarNegociosAdmin(),
        buscarProdutosAdmin(),
      ]);

      setResumo(r);
      setUsuarios(Array.isArray(u) ? u : []);
      setNegocios(Array.isArray(n) ? n : []);
      setProdutos(Array.isArray(pr) ? pr : []);
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

  async function salvarNegocio(dados) {
    if (!editandoNegocio) return;

    setSalvandoNegocio(true);
    setErro("");

    try {
      await atualizarNegocioAdmin(editandoNegocio.id, dados);
      await recarregar();
      setEditandoNegocio(null);
    } catch (error) {
      setErro(error.message || "Não foi possível salvar o negócio.");
    } finally {
      setSalvandoNegocio(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluindoNegocio) return;

    setSalvandoNegocio(true);
    setErro("");

    try {
      await excluirNegocioAdmin(excluindoNegocio.id);
      await recarregar();
      setExcluindoNegocio(null);
    } catch (error) {
      setErro(error.message || "Não foi possível excluir o negócio.");
    } finally {
      setSalvandoNegocio(false);
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

  const negociosFiltrados = useMemo(() => {
    const termo = buscaNegocio.trim().toLowerCase();
    if (!termo) return negocios;

    return negocios.filter((n) =>
      [n.nome, n.segmento, n.localizacao, n.usuario_nome, n.usuario_email].some(
        (v) => String(v || "").toLowerCase().includes(termo)
      )
    );
  }, [negocios, buscaNegocio]);

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
      sub:
        r.negocios_com_produtos > 0
          ? `${r.negocios_com_produtos} negócio(s) com produtos`
          : "valores do cadastro",
      cls: "verde",
      Icone: DollarSign,
    },
    {
      label: "Lucro total",
      value: formatarBRL(r.lucro_total),
      sub: `custos: ${formatarBRL(r.custos_total)}`,
      cls: (r.lucro_total ?? 0) >= 0 ? "verde" : "vermelho",
      Icone: (r.lucro_total ?? 0) >= 0 ? TrendingUp : TrendingDown,
    },
    {
      label: "Margem média",
      value: `${Number(r.margem_media ?? 0).toFixed(1)}%`,
      sub:
        (r.margem_media ?? 0) >= 30
          ? "saudável"
          : (r.margem_media ?? 0) > 0
            ? "atenção"
            : "sem margem",
      cls: (r.margem_media ?? 0) >= 30 ? "verde" : "laranja",
      Icone: Percent,
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

            <div className="adm-busca">
              <Search size={15} strokeWidth={2} />
              <input
                placeholder="Buscar por nome, segmento ou responsável..."
                value={buscaNegocio}
                onChange={(e) => setBuscaNegocio(e.target.value)}
              />
            </div>

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
          ) : negociosFiltrados.length === 0 ? (
            <div className="adm-vazio">
              <Search size={24} strokeWidth={1.8} />
              <p>Nenhum negócio encontrado para essa busca.</p>
            </div>
          ) : (
            <div className="adm-negocios">
              {negociosFiltrados.map((n) => (
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
                      <Package size={12} strokeWidth={2.2} />
                      {n.total_produtos ?? 0} produto(s)
                    </span>
                    <span>
                      <Calendar size={12} strokeWidth={2.2} />
                      Desde {formatarData(n.criado_em)}
                    </span>
                  </div>

                  <div className="adm-negocio-fin">
                    <div>
                      <span>Receita</span>
                      <strong>{formatarBRL(n.receita ?? n.receita_mensal)}</strong>
                    </div>
                    <div>
                      <span>Lucro</span>
                      <strong className={(n.lucro ?? 0) >= 0 ? "ok" : "ruim"}>
                        {formatarBRL(n.lucro)}
                      </strong>
                    </div>
                    <div>
                      <span>Margem</span>
                      <strong
                        className={
                          (n.margem ?? 0) >= 20
                            ? "ok"
                            : (n.margem ?? 0) > 0
                              ? "atencao"
                              : "ruim"
                        }
                      >
                        {(n.receita ?? 0) > 0
                          ? `${Number(n.margem ?? 0).toFixed(1)}%`
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  <div className="adm-negocio-dono">
                    <Mail size={12} strokeWidth={2.2} />
                    {n.usuario_nome || n.usuario_email || "Sem responsável"}
                  </div>

                  <div className="adm-negocio-fonte">
                    {n.fonte_indicadores === "produtos"
                      ? `Calculado com ${n.total_produtos} produto(s)`
                      : "Baseado nos valores do cadastro"}
                  </div>

                  <div className="adm-negocio-acoes">
                    <button
                      type="button"
                      className="adm-btn-acao"
                      onClick={() => setEditandoNegocio(n)}
                    >
                      <Pencil size={13} strokeWidth={2.2} />
                      Editar
                    </button>

                    <button
                      type="button"
                      className="adm-btn-acao perigo"
                      onClick={() => setExcluindoNegocio(n)}
                    >
                      <Trash2 size={13} strokeWidth={2.2} />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PRODUTOS */}
        <section className="adm-card">
          <div className="adm-card-head">
            <h2>Produtos</h2>
            <span className="adm-count">{produtos.length} cadastrado(s)</span>
          </div>

          {carregando ? (
            <div className="adm-loading">
              <Loader2 className="adm-girando" size={22} strokeWidth={2} />
              Carregando produtos...
            </div>
          ) : produtos.length === 0 ? (
            <div className="adm-vazio">
              <Package size={24} strokeWidth={1.8} />
              <p>Nenhum produto cadastrado pelos usuários ainda.</p>
            </div>
          ) : (
            <div className="adm-tabela-wrap">
              <table className="adm-tabela">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Negócio</th>
                    <th>Responsável</th>
                    <th>Preço</th>
                    <th>Vendas/mês</th>
                    <th>Receita</th>
                    <th>Tendência</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="adm-usuario">
                          <span className="adm-avatar">
                            {pegarIniciais(p.nome)}
                          </span>
                          <span className="adm-usuario-nome">
                            {p.nome || "Sem nome"}
                            {p.categoria ? (
                              <span className="adm-muted"> · {p.categoria}</span>
                            ) : null}
                          </span>
                        </div>
                      </td>
                      <td className="adm-muted">{p.negocio_nome || "—"}</td>
                      <td className="adm-muted">
                        {p.usuario_nome || p.usuario_email || "—"}
                      </td>
                      <td>{formatarBRL(p.preco)}</td>
                      <td>{p.vendas ?? 0}</td>
                      <td>{formatarBRL(p.receita)}</td>
                      <td>
                        <span className={`adm-tag ${classeTendencia(p.tendencia)}`}>
                          {formatarTendencia(p.tendencia)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {editandoNegocio && (
        <ModalEditarNegocio
          negocio={editandoNegocio}
          salvando={salvandoNegocio}
          onFechar={() => !salvandoNegocio && setEditandoNegocio(null)}
          onSalvar={salvarNegocio}
        />
      )}

      {excluindoNegocio && (
        <ModalExcluirNegocio
          negocio={excluindoNegocio}
          salvando={salvandoNegocio}
          onFechar={() => !salvandoNegocio && setExcluindoNegocio(null)}
          onConfirmar={confirmarExclusao}
        />
      )}
    </div>
  );
}
