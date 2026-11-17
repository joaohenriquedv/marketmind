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

/* Validação mínima de e-mail: algo@dominio.tld */
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Plano de reserva: evita crash caso lerPlano() devolva null/undefined. */
const PLANO_PADRAO = {
  nomeCompleto: "Plano não identificado",
  statusRotulo: "—",
  descricao: "Não foi possível carregar os detalhes do plano.",
  cicloRotulo: "—",
  precoTexto: "—",
};

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
    const salvas = localStorage.getItem(CHAVE_PREFERENCIAS);
    return salvas
      ? { ...PREFERENCIAS_PADRAO, ...JSON.parse(salvas) }
      : { ...PREFERENCIAS_PADRAO };
  } catch {
    return { ...PREFERENCIAS_PADRAO };
  }
}

function normalizarLista(dados) {
  if (!dados) return [];
  const lista = Array.isArray(dados)
    ? dados
    : dados.negocios || dados.data || dados.lista || [];
  return Array.isArray(lista) ? lista : [];
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
  const primeira = partes[0]?.[0] || "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";

  return (primeira + ultima).toUpperCase() || "?";
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
    negocio?.anos_mercado
      ? String(ANO_ATUAL - Number(negocio.anos_mercado))
      : ""
  );
  const [descricao, setDescricao] = useState(() => negocio?.descricao ?? "");

  const [editandoEmpresa, setEditandoEmpresa] = useState(false);
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
  const [salvandoPessoal, setSalvandoPessoal] = useState(false);

  /* O plano ainda é lido do navegador até existir uma API de assinatura. */
  const [planoSalvo] = useState(lerPlano);

  /* Preferências de notificações, salvas neste navegador. */
  const [preferencias, setPreferencias] = useState(lerPreferencias);
  const [preferenciasAbertas, setPreferenciasAbertas] = useState(true);

  const [feedback, setFeedback] = useState("");
  const inputFotoRef = useRef(null);
  const feedbackTimer = useRef(null);

  const plano = planoSalvo ?? PLANO_PADRAO;

  function mostrarFeedback(mensagem) {
    if (!mensagem) return;
    setFeedback(mensagem);
    window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(""), 2600);
  }

  /* Limpa o timer de feedback ao desmontar (evita setState em componente desmontado). */
  useEffect(() => {
    return () => window.clearTimeout(feedbackTimer.current);
  }, []);

  function salvarUsuario(patch) {
    const atual = lerUsuario() || {};
    const atualizado = { ...atual, ...patch };
    localStorage.setItem("usuario", JSON.stringify(atualizado));
    return atualizado;
  }

  /* Carrega o perfil atualizado do servidor. */
  useEffect(() => {
    let montado = true;

    (async () => {
      try {
        const bruto = await buscarPerfilUsuario();
        if (!montado || !bruto) return;

        /* A API pode responder { usuario }, { data } ou o objeto direto. */
        const dados = bruto?.usuario ?? bruto?.data ?? bruto;
        if (!dados || typeof dados !== "object") return;

        /* Resposta vazia não pode apagar o que já está na tela/localStorage. */
        if (!dados.nome && !dados.email && !dados.telefone && !dados.foto) return;

        const patchLocal = {};

        if (dados.nome) {
          setNome(dados.nome);
          patchLocal.nome = dados.nome;
        }

        if (dados.email) {
          setEmail(dados.email);
          patchLocal.email = dados.email;
        }

        if (dados.telefone != null) {
          setTelefone(dados.telefone);
          patchLocal.telefone = dados.telefone;
        }

        if (dados.foto != null) {
          setFoto(dados.foto);
          patchLocal.foto = dados.foto;
        }

        if (Object.keys(patchLocal).length > 0) {
          salvarUsuario(patchLocal);
        }
      } catch {
        /* Mantém os dados já carregados na tela. */
      }
    })();

    return () => {
      montado = false;
    };
  }, []);

  /* Carrega os dados da empresa do servidor. */
  useEffect(() => {
    let montado = true;

    (async () => {
      try {
        const lista = normalizarLista(await listarNegociosUsuario());
        if (!montado || lista.length === 0) return;

        const negocioAtual = lista[0];
        const local = extrairLocal(negocioAtual.localizacao);

        setNegocio(negocioAtual);
        setEmpresa(negocioAtual.nome || "");
        setSegmento(negocioAtual.segmento || "");
        setPorte(negocioAtual.publico_alvo || negocioAtual.porte || "");
        setEstado(local.estado);
        setCidade(local.cidade);
        setColaboradores(
          negocioAtual.funcionarios != null
            ? String(negocioAtual.funcionarios)
            : ""
        );
        setFundacao(
          negocioAtual.anos_mercado
            ? String(ANO_ATUAL - Number(negocioAtual.anos_mercado))
            : ""
        );
        setDescricao(negocioAtual.descricao || "");

        localStorage.setItem("negocio", JSON.stringify(negocioAtual));
      } catch {
        /* Mantém os dados já carregados na tela. */
      }
    })();

    return () => {
      montado = false;
    };
  }, []);

  /* Grava as preferências no navegador.
     A persistência é feita no manipulador do evento, e não dentro de um
     useEffect: chamar setState sincronamente em um efeito dispara renders em
     cascata (regra react-hooks/set-state-in-effect). */
  function persistirPreferencias(proximas) {
    try {
      localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(proximas));
    } catch {
      mostrarFeedback(
        "Não foi possível salvar as preferências neste navegador."
      );
    }
  }

  function alternarPreferencia(chave) {
    const proximas = { ...preferencias, [chave]: !preferencias[chave] };
    setPreferencias(proximas);
    persistirPreferencias(proximas);
  }

  function alternarPreferenciasAtivas() {
    const proximas = { ...preferencias, ativas: !preferencias.ativas };
    setPreferencias(proximas);
    persistirPreferencias(proximas);
    setPreferenciasAbertas(true);
  }

  async function salvarAlteracoes() {
    if (!nome.trim()) {
      mostrarFeedback("Informe seu nome completo.");
      return;
    }

    if (!email.trim()) {
      mostrarFeedback("Informe seu e-mail.");
      return;
    }

    if (!EMAIL_VALIDO.test(email.trim())) {
      mostrarFeedback("Informe um e-mail válido (ex.: nome@empresa.com.br).");
      return;
    }

    setSalvandoPessoal(true);

    try {
      const resposta = await atualizarPerfilUsuario({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
      });

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
      }

      mostrarFeedback("Alterações salvas com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      mostrarFeedback(
        error.message || "Não foi possível salvar seus dados no servidor."
      );
    } finally {
      setSalvandoPessoal(false);
    }
  }

  async function salvarEmpresa(evento) {
    if (evento) evento.preventDefault();

    if (!empresa.trim()) {
      mostrarFeedback("Informe o nome da empresa.");
      return;
    }

    if (fundacao !== "") {
      const ano = Number(fundacao);
      if (!Number.isFinite(ano) || ano < 1900 || ano > ANO_ATUAL) {
        mostrarFeedback(
          `Informe um ano de fundação entre 1900 e ${ANO_ATUAL}.`
        );
        return;
      }
    }

    if (colaboradores !== "") {
      const total = Number(colaboradores);
      if (!Number.isFinite(total) || total < 0) {
        mostrarFeedback("Número de colaboradores inválido.");
        return;
      }
    }

    const base = lerNegocio() || {};

    const payload = {
      nome: empresa.trim(),
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
          "Não foi possível sincronizar os dados da empresa com o servidor."
        );
        setSalvandoEmpresa(false);
        return;
      }
    } else {
      mostrarFeedback("A empresa ainda não está cadastrada no servidor.");
      setSalvandoEmpresa(false);
      return;
    }

    localStorage.setItem("negocio", JSON.stringify(atualizado));
    setNegocio(atualizado);
    setSalvandoEmpresa(false);
    setEditandoEmpresa(false);
  }

  function cancelarEdicaoEmpresa() {
    const negocioSalvo = lerNegocio() || {};
    const local = extrairLocal(negocioSalvo.localizacao);

    setEmpresa(negocioSalvo.nome || "");
    setSegmento(negocioSalvo.segmento || "");
    setPorte(negocioSalvo.publico_alvo || negocioSalvo.porte || "");
    setEstado(local.estado);
    setCidade(local.cidade);
    setColaboradores(
      negocioSalvo.funcionarios != null
        ? String(negocioSalvo.funcionarios)
        : ""
    );
    setFundacao(
      negocioSalvo.anos_mercado
        ? String(ANO_ATUAL - Number(negocioSalvo.anos_mercado))
        : ""
    );
    setDescricao(negocioSalvo.descricao || "");
    setEditandoEmpresa(false);
  }

  function escolherFoto() {
    inputFotoRef.current?.click();
  }

  async function handleFoto(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;

    if (!arquivo.type || !arquivo.type.startsWith("image/")) {
      mostrarFeedback("Selecione um arquivo de imagem (JPG ou PNG).");
      return;
    }

    if (arquivo.size > 8 * 1024 * 1024) {
      mostrarFeedback("Imagem muito grande. Use uma de até 8 MB.");
      return;
    }

    const leitor = new FileReader();

    leitor.onerror = () => {
      mostrarFeedback("Não foi possível ler o arquivo selecionado.");
    };

    leitor.onload = () => {
      const imagem = new window.Image();

      imagem.onerror = () => {
        mostrarFeedback("Arquivo de imagem inválido.");
      };

      imagem.onload = async () => {
        const tamanho = 256;
        const canvas = document.createElement("canvas");
        canvas.width = tamanho;
        canvas.height = tamanho;

        const contexto = canvas.getContext("2d");

        if (!contexto) {
          mostrarFeedback("Este navegador não suporta o recorte da imagem.");
          return;
        }

        try {
          const lado = Math.min(imagem.width, imagem.height);
          const sx = (imagem.width - lado) / 2;
          const sy = (imagem.height - lado) / 2;

          contexto.drawImage(
            imagem,
            sx,
            sy,
            lado,
            lado,
            0,
            0,
            tamanho,
            tamanho
          );

          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

          await atualizarPerfilUsuario({ foto: dataUrl });
          setFoto(dataUrl);
          salvarUsuario({ foto: dataUrl });
          mostrarFeedback("Foto de perfil atualizada.");
        } catch (error) {
          console.error("Erro ao salvar foto:", error);
          mostrarFeedback(
            error.message || "Não foi possível salvar sua foto no servidor."
          );
        }
      };

      imagem.src = leitor.result;
    };

    leitor.readAsDataURL(arquivo);
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

        {feedback && (
          <div className="perfil-feedback" role="status">
            {feedback}
          </div>
        )}

        <div className="perfil-grid">
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
                    autoComplete="name"
                    value={nome}
                    onChange={(evento) => setNome(evento.target.value)}
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
                    autoComplete="email"
                    value={email}
                    onChange={(evento) => setEmail(evento.target.value)}
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
                    type="tel"
                    autoComplete="tel"
                    value={telefone}
                    placeholder="(00) 00000-0000"
                    onChange={(evento) => setTelefone(evento.target.value)}
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
                    onClick={() =>
                      setPreferenciasAbertas(!preferenciasAbertas)
                    }
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
                      <p>
                        Fique por dentro de novas funcionalidades e melhorias.
                      </p>
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
                      aria-pressed={
                        preferencias.ativas && preferencias.novidades
                      }
                    >
                      <span />
                    </button>
                  </div>

                  {!preferencias.ativas && (
                    <p className="preferencias-aviso">
                      Preferências desativadas — nenhuma notificação será
                      enviada enquanto o interruptor estiver desligado.
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
                      "A alteração de senha não está disponível nesta versão."
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
                  <p className="pagamento-aviso">
                    Pagamento ainda não conectado. Nenhum dado de cartão é
                    armazenado nesta página.
                  </p>
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
                <span className="empresa-info-value">
                  {colaboradores || "—"}
                </span>
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
                      onChange={(evento) => setEmpresa(evento.target.value)}
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
                      onChange={(evento) => setSegmento(evento.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {SEGMENTOS.map((item) => (
                        <option key={item} value={item}>
                          {item}
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
                      onChange={(evento) => setPorte(evento.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {PORTES.map((item) => (
                        <option key={item} value={item}>
                          {item}
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
                      onChange={(evento) => setEstado(evento.target.value)}
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
                      onChange={(evento) => setCidade(evento.target.value)}
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
                      onChange={(evento) =>
                        setColaboradores(evento.target.value)
                      }
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
                      onChange={(evento) => setFundacao(evento.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group full">
                  <label htmlFor="emp-descricao">
                    Descrição do seu negócio
                  </label>
                  <textarea
                    id="emp-descricao"
                    className="empresa-textarea"
                    value={descricao}
                    placeholder="Fale um pouco sobre o seu negócio..."
                    onChange={(evento) => setDescricao(evento.target.value)}
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
                  {salvandoEmpresa
                    ? "Salvando..."
                    : "Salvar dados da empresa"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
