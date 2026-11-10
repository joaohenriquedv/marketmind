
import { useState, useEffect, useRef } from "react";
import "./perfil.css";
import {
  UserRound,
  Mail,
  Phone,
  Camera,
  Pencil,
  Save,
  X,
  Building2,
  Tag,
  ChartColumn,
  MapPin,
  Users,
  Calendar,
  AlignLeft,
  Bell,
  FileText,
  Sparkles,
  Lock,
  Crown,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  listarNegociosUsuario,
  atualizarNegocio,
  buscarPerfilUsuario,
  atualizarPerfilUsuario,
} from "../../api";
import { lerPlano } from "../../planoAtual";

const CHAVE_PREFERENCIAS = "preferencias_conta";

const PREFERENCIAS_PADRAO = {
  ativas: true,
  notificacoes: true,
  relatorios: true,
  novidades: true,
};

const SEGMENTOS = [
  "Tecnologia", "Varejo", "Saúde", "Educação", "Financeiro", "Agronegócio",
  "Logística", "Construção", "Alimentação", "Serviços", "Outro",
];

const PORTES = ["MEI", "Micro", "Pequena", "Média", "Grande"];

const ESTADOS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

const ANO_ATUAL = new Date().getFullYear();

/* ── Utilidades ── */

function lerUsuario() {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function lerNegocio() {
  try {
    const raw = localStorage.getItem("negocio");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function lerPreferencias() {
  try {
    const raw = localStorage.getItem(CHAVE_PREFERENCIAS);
    return raw
      ? { ...PREFERENCIAS_PADRAO, ...JSON.parse(raw) }
      : PREFERENCIAS_PADRAO;
  } catch {
    return PREFERENCIAS_PADRAO;
  }
}

function normalizarLista(dados) {
  if (!dados) return [];
  const l = Array.isArray(dados)
    ? dados
    : dados.negocios || dados.data || dados.lista || [];
  return Array.isArray(l) ? l : [];
}

function extrairLocal(localizacao) {
  if (!localizacao) return { cidade: "", estado: "" };
  const partes = String(localizacao).split(" - ");
  if (partes.length === 2) {
    return { cidade: partes[0].trim(), estado: partes[1].trim() };
  }
  return { cidade: String(localizacao).trim(), estado: "" };
}

function pegarIniciais(nome) {
  if (!nome) return "?";
  const partes = String(nome).trim().split(/\s+/).filter(Boolean);
  const a = partes[0]?.[0] || "";
  const b = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

export default function Perfil({ onNavegar }) {
  const [usuario] = useState(lerUsuario);
  const [negocio, setNegocio] = useState(lerNegocio);

  const [nome, setNome] = useState(() => usuario?.nome ?? usuario?.name ?? "");
  const [email, setEmail] = useState(() => usuario?.email ?? "");
  const [telefone, setTelefone] = useState(
    () => usuario?.telefone ?? usuario?.phone ?? ""
  );
  const [foto, setFoto] = useState(() => usuario?.foto ?? "");

  const localInicial = extrairLocal(negocio?.localizacao);
  const [empresa, setEmpresa] = useState(() => negocio?.nome ?? "");
  const [segmento, setSegmento] = useState(() => negocio?.segmento ?? "");
  const [porte, setPorte] = useState(
    () => negocio?.publico_alvo ?? negocio?.porte ?? ""
  );
  const [estado, setEstado] = useState(() => localInicial.estado);
  const [cidade, setCidade] = useState(() => localInicial.cidade);
  const [colaboradores, setColaboradores] = useState(() =>
    negocio?.funcionarios != null ? String(negocio.funcionarios) : ""
  );
  const [fundacao, setFundacao] = useState(() =>
    negocio?.anos_mercado ? String(ANO_ATUAL - Number(negocio.anos_mercado)) : ""
  );
  const [descricao, setDescricao] = useState(() => negocio?.descricao ?? "");

  const [editandoEmpresa, setEditandoEmpresa] = useState(false);
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
  const [salvandoPessoal, setSalvandoPessoal] = useState(false);

  /* Plano atual (lido do localStorage — troque por API quando existir) */
  const [plano] = useState(lerPlano);

  /* Preferências: um único objeto = mais fácil de ligar/desligar tudo */
  const [preferencias, setPreferencias] = useState(lerPreferencias);
  const [preferenciasAbertas, setPreferenciasAbertas] = useState(true);

  const [feedback, setFeedback] = useState("");
  const inputFotoRef = useRef(null);

  function mostrarFeedback(msg) {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(""), 2600);
  }

  function salvarUsuario(patch) {
    const atual = lerUsuario() || {};
    const atualizado = { ...atual, ...patch };
    localStorage.setItem("usuario", JSON.stringify(atualizado));
    return atualizado;
  }

  /* SEMPRE busca o perfil atualizado no servidor (inclui a foto) */
  useEffect(() => {
    let montado = true;

    (async () => {
      try {
        const dados = await buscarPerfilUsuario();
        if (!montado || !dados) return;

        setNome(dados.nome ?? "");
        setEmail(dados.email ?? "");
        setTelefone(dados.telefone ?? "");
        setFoto(dados.foto ?? "");

        salvarUsuario({
          nome: dados.nome,
          email: dados.email,
          telefone: dados.telefone || "",
          foto: dados.foto || "",
        });
      } catch {
        /* se o servidor falhar, mantém o que veio do localStorage */
      }
    })();

    return () => {
      montado = false;
    };
  }, []);

  /* SEMPRE busca o negócio atualizado no servidor */
  useEffect(() => {
    let montado = true;

    (async () => {
      try {
        const lista = normalizarLista(await listarNegociosUsuario());
        if (!montado || lista.length === 0) return;

        const n = lista[0];
        const loc = extrairLocal(n.localizacao);

        setNegocio(n);
        setEmpresa(n.nome || "");
        setSegmento(n.segmento || "");
        setPorte(n.publico_alvo || n.porte || "");
        setEstado(loc.estado);
        setCidade(loc.cidade);
        setColaboradores(n.funcionarios != null ? String(n.funcionarios) : "");
        setFundacao(
          n.anos_mercado ? String(ANO_ATUAL - Number(n.anos_mercado)) : ""
        );
        setDescricao(n.descricao || "");

        localStorage.setItem("negocio", JSON.stringify(n));
      } catch {
        /* se o servidor falhar, mantém o que veio do localStorage */
      }
    })();

    return () => {
      montado = false;
    };
  }, []);

  /* Guarda as preferências no navegador sempre que algo muda */
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(preferencias));
    } catch {
      /* se o storage falhar, a tela continua funcionando */
    }
  }, [preferencias]);

  function alternarPreferencia(chave) {
    setPreferencias((atual) => ({ ...atual, [chave]: !atual[chave] }));
  }

  function alternarPreferenciasAtivas() {
    setPreferencias((atual) => ({ ...atual, ativas: !atual.ativas }));
    setPreferenciasAbertas(true);
  }

  async function salvarAlteracoes() {
    setSalvandoPessoal(true);

    try {
      const resposta = await atualizarPerfilUsuario({ nome, email, telefone });

      if (resposta?.usuario) {
        salvarUsuario({
          nome: resposta.usuario.nome,
          email: resposta.usuario.email,
          telefone: resposta.usuario.telefone || "",
          foto: resposta.usuario.foto || foto,
        });
        setNome(resposta.usuario.nome ?? nome);
        setEmail(resposta.usuario.email ?? email);
        setTelefone(resposta.usuario.telefone ?? telefone);
        setFoto(resposta.usuario.foto ?? foto);
      } else {
        salvarUsuario({ nome, email, telefone });
      }

      mostrarFeedback("Alterações salvas com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      salvarUsuario({ nome, email, telefone });
      mostrarFeedback(
        "Salvo neste navegador, mas não sincronizou com o servidor."
      );
    } finally {
      setSalvandoPessoal(false);
    }
  }

  async function salvarEmpresa(evento) {
    if (evento) evento.preventDefault();

    const base = lerNegocio() || {};

    const payload = {
      nome: empresa,
      segmento,
      publico_alvo: porte,
      localizacao: `${cidade}${estado ? ` - ${estado}` : ""}`,
      funcionarios: Number(colaboradores) || 0,
      anos_mercado: fundacao ? ANO_ATUAL - Number(fundacao) : 0,
      descricao,
    };

    let atualizado = { ...base, ...payload };

    setSalvandoEmpresa(true);

    if (base.id != null) {
      try {
        const resposta = await atualizarNegocio(base.id, payload);
        if (resposta?.negocio) {
          atualizado = { ...atualizado, ...resposta.negocio };
        }
        mostrarFeedback("Dados da empresa salvos.");
      } catch (error) {
        console.error("Erro ao atualizar empresa:", error);
        mostrarFeedback(
          "Salvo neste navegador, mas não sincronizou com o servidor."
        );
      }
    } else {
      mostrarFeedback("Dados da empresa salvos.");
    }

    localStorage.setItem("negocio", JSON.stringify(atualizado));
    setNegocio(atualizado);
    setSalvandoEmpresa(false);
    setEditandoEmpresa(false);
  }

  function cancelarEdicaoEmpresa() {
    const n = lerNegocio() || {};
    const loc = extrairLocal(n.localizacao);

    setEmpresa(n.nome || "");
    setSegmento(n.segmento || "");
    setPorte(n.publico_alvo || n.porte || "");
    setEstado(loc.estado);
    setCidade(loc.cidade);
    setColaboradores(n.funcionarios != null ? String(n.funcionarios) : "");
    setFundacao(n.anos_mercado ? String(ANO_ATUAL - Number(n.anos_mercado)) : "");
    setDescricao(n.descricao || "");

    setEditandoEmpresa(false);
  }

  function escolherFoto() {
    inputFotoRef.current?.click();
  }

  async function handleFoto(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onload = async () => {
      const img = new window.Image();

      img.onload = async () => {
        const tamanho = 256;
        const canvas = document.createElement("canvas");
        canvas.width = tamanho;
        canvas.height = tamanho;
        const ctx = canvas.getContext("2d");
        const lado = Math.min(img.width, img.height);
        const sx = (img.width - lado) / 2;
        const sy = (img.height - lado) / 2;
        ctx.drawImage(img, sx, sy, lado, lado, 0, 0, tamanho, tamanho);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        setFoto(dataUrl);
        salvarUsuario({ foto: dataUrl });

        try {
          await atualizarPerfilUsuario({ foto: dataUrl });
          mostrarFeedback("Foto de perfil atualizada.");
        } catch (error) {
          console.error("Erro ao salvar foto:", error);
          mostrarFeedback(
            "Foto salva neste navegador, mas não sincronizou com o servidor."
          );
        }
      };

      img.src = leitor.result;
    };

    leitor.readAsDataURL(arquivo);
    evento.target.value = "";
  }

  const iniciais = pegarIniciais(nome);
  const localizacaoTexto =
    cidade || estado ? `${cidade}${estado ? ` - ${estado}` : ""}` : "—";

  return (
    <div className="perfil-page">
      <main className="perfil-container">
        <section className="perfil-header">
          <h1>Meu Perfil</h1>
          <p>Gerencie suas informações, sua empresa e suas preferências.</p>
        </section>

        {feedback && <div className="perfil-feedback">{feedback}</div>}

        <div className="perfil-grid">
          {/* COLUNA ESQUERDA */}
          <div className="perfil-left">
            <section className="perfil-card usuario-card">
              <div className="avatar-wrap">
                <div className="avatar">
                  {foto ? (
                    <img src={foto} alt={nome || "Usuário"} />
                  ) : (
                    <span>{iniciais}</span>
                  )}
                </div>

                <button
                  type="button"
                  className="avatar-camera"
                  onClick={escolherFoto}
                  title="Alterar foto"
                  aria-label="Alterar foto"
                >
                  <Camera size={14} strokeWidth={2.2} />
                </button>

                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/*"
                  className="foto-input"
                  onChange={handleFoto}
                />
              </div>

              <div className="usuario-info">
                <h2>{nome || "Usuário"}</h2>
                <p>{email || "Sem e-mail cadastrado"}</p>

                <span className="status">
                  <span className="status-dot" />
                  Conta ativa
                </span>
              </div>
            </section>

            <section className="perfil-card informacoes-card">
              <h2>Informações pessoais</h2>

              <div className="form-group">
                <label htmlFor="pf-nome">Nome completo</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <UserRound size={15} strokeWidth={2} />
                  </span>
                  <input
                    id="pf-nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="pf-email">E-mail</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Mail size={15} strokeWidth={2} />
                  </span>
                  <input
                    id="pf-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="pf-telefone">Telefone</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Phone size={15} strokeWidth={2} />
                  </span>
                  <input
                    id="pf-telefone"
                    type="text"
                    value={telefone}
                    placeholder="(00) 00000-0000"
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                className="save-button"
                onClick={salvarAlteracoes}
                disabled={salvandoPessoal}
              >
                <Save size={15} strokeWidth={2.2} />
                {salvandoPessoal ? "Salvando..." : "Salvar alterações"}
              </button>
            </section>
          </div>

          {/* COLUNA DIREITA */}
          <div className="perfil-right">
            <section
              className={`perfil-card preferencias-card ${
                preferencias.ativas ? "" : "desativado"
              }`}
            >
              <div className="card-head">
                <div className="card-head-texto">
                  <h2>Preferências da conta</h2>
                  <p className="card-description">
                    Escolha como deseja receber as notificações do MarketMind.
                  </p>
                </div>

                <div className="card-head-acoes">
                  <button
                    type="button"
                    className={`switch switch-principal ${
                      preferencias.ativas ? "active" : ""
                    }`}
                    onClick={alternarPreferenciasAtivas}
                    aria-label={
                      preferencias.ativas
                        ? "Desativar preferências de notificação"
                        : "Ativar preferências de notificação"
                    }
                    aria-pressed={preferencias.ativas}
                    title={preferencias.ativas ? "Desativar" : "Ativar"}
                  >
                    <span />
                  </button>

                  <button
                    type="button"
                    className={`card-collapse ${
                      preferenciasAbertas ? "aberto" : ""
                    }`}
                    onClick={() => setPreferenciasAbertas(!preferenciasAbertas)}
                    aria-expanded={preferenciasAbertas}
                    aria-label="Mostrar ou ocultar preferências"
                    title={preferenciasAbertas ? "Recolher" : "Expandir"}
                  >
                    <ChevronDown size={16} strokeWidth={2.2} />
                  </button>
                </div>
              </div>

              {preferenciasAbertas && (
                <div className="preferencias-lista">
                  <div className="preference-item">
                    <div className="preference-icon">
                      <Bell size={15} strokeWidth={2} />
                    </div>
                    <div className="preference-content">
                      <h3>Alertas de mercado</h3>
                      <p>
                        Receba notificações sobre variações e oportunidades do
                        mercado.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`switch ${
                        preferencias.ativas && preferencias.notificacoes
                          ? "active"
                          : ""
                      }`}
                      onClick={() => alternarPreferencia("notificacoes")}
                      disabled={!preferencias.ativas}
                      aria-label="Ativar alertas de mercado"
                      aria-pressed={
                        preferencias.ativas && preferencias.notificacoes
                      }
                    >
                      <span />
                    </button>
                  </div>

                  <div className="preference-item">
                    <div className="preference-icon">
                      <FileText size={15} strokeWidth={2} />
                    </div>
                    <div className="preference-content">
                      <h3>Atualizações de relatórios</h3>
                      <p>
                        Seja avisado quando novos relatórios estiverem
                        disponíveis.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`switch ${
                        preferencias.ativas && preferencias.relatorios
                          ? "active"
                          : ""
                      }`}
                      onClick={() => alternarPreferencia("relatorios")}
                      disabled={!preferencias.ativas}
                      aria-label="Ativar atualizações de relatórios"
                      aria-pressed={
                        preferencias.ativas && preferencias.relatorios
                      }
                    >
                      <span />
                    </button>
                  </div>

                  <div className="preference-item last">
                    <div className="preference-icon">
                      <Sparkles size={15} strokeWidth={2} />
                    </div>
                    <div className="preference-content">
                      <h3>Novidades do MarketMind</h3>
                      <p>Fique por dentro de novas funcionalidades e melhorias.</p>
                    </div>
                    <button
                      type="button"
                      className={`switch ${
                        preferencias.ativas && preferencias.novidades
                          ? "active"
                          : ""
                      }`}
                      onClick={() => alternarPreferencia("novidades")}
                      disabled={!preferencias.ativas}
                      aria-label="Ativar novidades"
                      aria-pressed={preferencias.ativas && preferencias.novidades}
                    >
                      <span />
                    </button>
                  </div>

                  {!preferencias.ativas && (
                    <p className="preferencias-aviso">
                      Preferências desativadas — nenhuma notificação será enviada
                      enquanto o interruptor estiver desligado.
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="perfil-card seguranca-card">
              <h2>Segurança</h2>
              <div className="security-content">
                <div className="security-icon">
                  <Lock size={15} strokeWidth={2} />
                </div>
                <div className="security-info">
                  <h3>Senha</h3>
                  <p>Proteja sua conta com uma senha forte.</p>
                </div>
                <button
                  type="button"
                  className="password-button"
                  onClick={() =>
                    mostrarFeedback(
                      "A alteração de senha estará disponível em breve."
                    )
                  }
                >
                  Alterar senha
                </button>
              </div>
            </section>

            <section className="perfil-card plano-card">
              <h2>Plano atual</h2>
              <div className="plano-content">
                <div className="plano-icon">
                  <Crown size={15} strokeWidth={2} />
                </div>
                <div className="plano-info">
                  <div className="plano-title">
                    <strong>{plano.nomeCompleto}</strong>
                    <span className="pro-status">{plano.statusRotulo}</span>
                  </div>
                  <p>{plano.descricao}</p>
                  <p className="plano-meta">
                    {plano.cicloRotulo} · {plano.precoTexto}
                  </p>
                </div>
                <button
                  type="button"
                  className="manage-plan"
                  onClick={() => onNavegar && onNavegar("planos")}
                >
                  Gerenciar
                  <ChevronRight size={15} strokeWidth={2} />
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* DADOS DA EMPRESA */}
        <section className="perfil-card empresa-card">
          <div className="empresa-head">
            <div>
              <h2>Dados da empresa</h2>
              <p className="card-description">
                Informações do negócio vinculado à sua conta.
              </p>
            </div>

            {negocio && !editandoEmpresa && (
              <button
                type="button"
                className="empresa-editar"
                onClick={() => setEditandoEmpresa(true)}
              >
                <Pencil size={14} strokeWidth={2.2} />
                Editar
              </button>
            )}
          </div>

          {!negocio && !editandoEmpresa ? (
            <div className="empresa-aviso">
              <span>Você ainda não cadastrou uma empresa.</span>
              <button
                type="button"
                onClick={() =>
                  onNavegar
                    ? onNavegar("cadastro-empresa")
                    : setEditandoEmpresa(true)
                }
              >
                Cadastrar agora
              </button>
            </div>
          ) : !editandoEmpresa ? (
            <div className="empresa-info">
              <div className="empresa-info-item">
                <span className="empresa-info-label">
                  <Building2 size={13} strokeWidth={2.2} />
                  Nome da empresa
                </span>
                <span className="empresa-info-value">{empresa || "—"}</span>
              </div>

              <div className="empresa-info-item">
                <span className="empresa-info-label">
                  <Tag size={13} strokeWidth={2.2} />
                  Segmento
                </span>
                <span className="empresa-info-value">{segmento || "—"}</span>
              </div>

              <div className="empresa-info-item">
                <span className="empresa-info-label">
                  <ChartColumn size={13} strokeWidth={2.2} />
                  Porte
                </span>
                <span className="empresa-info-value">{porte || "—"}</span>
              </div>

              <div className="empresa-info-item">
                <span className="empresa-info-label">
                  <MapPin size={13} strokeWidth={2.2} />
                  Localização
                </span>
                <span className="empresa-info-value">{localizacaoTexto}</span>
              </div>

              <div className="empresa-info-item">
                <span className="empresa-info-label">
                  <Users size={13} strokeWidth={2.2} />
                  Colaboradores
                </span>
                <span className="empresa-info-value">{colaboradores || "—"}</span>
              </div>

              <div className="empresa-info-item">
                <span className="empresa-info-label">
                  <Calendar size={13} strokeWidth={2.2} />
                  Ano de fundação
                </span>
                <span className="empresa-info-value">{fundacao || "—"}</span>
              </div>

              <div className="empresa-info-item full">
                <span className="empresa-info-label">
                  <AlignLeft size={13} strokeWidth={2.2} />
                  Descrição
                </span>
                <p className="empresa-info-text">
                  {descricao || "Nenhuma descrição informada."}
                </p>
              </div>
            </div>
          ) : (
            <form className="empresa-form" onSubmit={salvarEmpresa}>
              <div className="empresa-grid">
                <div className="form-group full">
                  <label htmlFor="emp-nome">Nome da empresa</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <Building2 size={15} strokeWidth={2} />
                    </span>
                    <input
                      id="emp-nome"
                      type="text"
                      value={empresa}
                      placeholder="Nome da empresa"
                      onChange={(e) => setEmpresa(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="emp-segmento">Segmento de atuação</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <Tag size={15} strokeWidth={2} />
                    </span>
                    <select
                      id="emp-segmento"
                      value={segmento}
                      onChange={(e) => setSegmento(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {SEGMENTOS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="emp-porte">Porte da empresa</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <ChartColumn size={15} strokeWidth={2} />
                    </span>
                    <select
                      id="emp-porte"
                      value={porte}
                      onChange={(e) => setPorte(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {PORTES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="emp-estado">Estado</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <MapPin size={15} strokeWidth={2} />
                    </span>
                    <select
                      id="emp-estado"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                    >
                      <option value="">UF</option>
                      {ESTADOS.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="emp-cidade">Cidade</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <MapPin size={15} strokeWidth={2} />
                    </span>
                    <input
                      id="emp-cidade"
                      type="text"
                      value={cidade}
                      placeholder="Cidade"
                      onChange={(e) => setCidade(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="emp-colaboradores">
                    Número de colaboradores
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <Users size={15} strokeWidth={2} />
                    </span>
                    <input
                      id="emp-colaboradores"
                      type="number"
                      min="0"
                      value={colaboradores}
                      placeholder="Ex.: 12"
                      onChange={(e) => setColaboradores(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="emp-fundacao">Ano de fundação</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <Calendar size={15} strokeWidth={2} />
                    </span>
                    <input
                      id="emp-fundacao"
                      type="number"
                      min="1900"
                      max={ANO_ATUAL}
                      value={fundacao}
                      placeholder="Ex.: 2018"
                      onChange={(e) => setFundacao(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group full">
                  <label htmlFor="emp-descricao">Descrição do seu negócio</label>
                  <textarea
                    id="emp-descricao"
                    className="empresa-textarea"
                    value={descricao}
                    placeholder="Fale um pouco sobre o seu negócio..."
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="empresa-actions">
                <button
                  type="button"
                  className="empresa-cancelar"
                  onClick={cancelarEdicaoEmpresa}
                >
                  <X size={15} strokeWidth={2.2} />
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={salvandoEmpresa}
                >
                  <Save size={15} strokeWidth={2.2} />
                  {salvandoEmpresa ? "Salvando..." : "Salvar dados da empresa"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
