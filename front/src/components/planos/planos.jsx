import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import "./planos.css";
import { PLANOS, formatarBRL, lerPlano, salvarPlano } from "../../planoAtual";

/* Desconto do plano anual (calculado a partir do catálogo) */
const DESCONTO_ANUAL = Math.round(
  (1 - PLANOS[1].anual / PLANOS[1].mensal) * 100,
);

export default function Planos({ onNavegar }) {
  const [atual, setAtual] = useState(lerPlano);
  const [ciclo, setCiclo] = useState(() => lerPlano().ciclo);
  const [selecionado, setSelecionado] = useState(null); // { id, ciclo }
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState("");

  /* Some com a mensagem de sucesso depois de alguns segundos */
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(""), 4500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  /* Fecha o modal com ESC */
  useEffect(() => {
    if (!selecionado) return;

    function aoTeclar(evento) {
      if (evento.key === "Escape") setSelecionado(null);
    }

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [selecionado]);

  const precoDe = (plano) => (ciclo === "anual" ? plano.anual : plano.mensal);

  function abrirConfirmacao(plano) {
    setSelecionado({ id: plano.id, ciclo });
  }

  async function confirmarTroca() {
    if (!selecionado) return;

    setSalvando(true);

    try {
      /* Simula a chamada ao servidor. Quando existir endpoint,
         troque por: await atualizarPlanoUsuario(selecionado) */
      await new Promise((resolve) => window.setTimeout(resolve, 700));

      const novo = salvarPlano(selecionado);

      setAtual(novo);
      setCiclo(novo.ciclo);
      setSelecionado(null);
      setFeedback(
        `Pronto! Seu plano agora é o ${novo.nomeCompleto} (${novo.cicloRotulo.toLowerCase()}).`,
      );
    } finally {
      setSalvando(false);
    }
  }

  const planoSelecionado = selecionado
    ? PLANOS.find((p) => p.id === selecionado.id)
    : null;

  return (
    <div className="planos-page">
      <main className="planos-container">
        <button
          type="button"
          className="planos-voltar"
          onClick={() => onNavegar && onNavegar("perfil")}
        >
          <ArrowLeft size={15} strokeWidth={2.2} />
          Voltar ao perfil
        </button>

        <header className="planos-header">
          <h1>Planos e assinatura</h1>
          <p>
            Escolha o plano que acompanha o tamanho da sua operação. Você pode
            mudar de plano ou de forma de cobrança quando quiser.
          </p>
        </header>

        {feedback && <div className="planos-feedback">{feedback}</div>}

        {/* Resumo do plano atual */}
        <section className="planos-atual">
          <div className="planos-atual-icone">
            <Crown size={18} strokeWidth={2} />
          </div>

          <div className="planos-atual-info">
            <span className="planos-rotulo">Plano atual</span>
            <div className="planos-atual-titulo">
              <h2>{atual.nomeCompleto}</h2>
              <span className="planos-selo-status">{atual.statusRotulo}</span>
            </div>
            <p>
              {atual.cicloRotulo} · {atual.precoTexto} · próxima cobrança em{" "}
              {atual.proximaCobranca}
            </p>
          </div>
        </section>

        {/* Alternância mensal / anual */}
        <div
          className="planos-ciclo"
          role="group"
          aria-label="Forma de cobrança"
        >
          <button
            type="button"
            className={`planos-ciclo-opcao ${ciclo === "mensal" ? "ativa" : ""}`}
            onClick={() => setCiclo("mensal")}
            aria-pressed={ciclo === "mensal"}
          >
            Mensal
          </button>

          <button
            type="button"
            className={`planos-ciclo-opcao ${ciclo === "anual" ? "ativa" : ""}`}
            onClick={() => setCiclo("anual")}
            aria-pressed={ciclo === "anual"}
          >
            Anual
            <span className="planos-ciclo-desconto">-{DESCONTO_ANUAL}%</span>
          </button>
        </div>

        {/* Planos */}
        <div className="planos-grid">
          {PLANOS.map((plano) => {
            const preco = precoDe(plano);
            const ehAtual = atual.id === plano.id;
            const mesmoCiclo = ehAtual && atual.ciclo === ciclo;

            return (
              <article
                key={plano.id}
                className={`planos-oferta ${plano.destaque ? "destaque" : ""} ${
                  ehAtual ? "atual" : ""
                }`}
              >
                {plano.destaque && !ehAtual && (
                  <span className="planos-selo">
                    <Sparkles size={12} strokeWidth={2.4} />
                    Mais escolhido
                  </span>
                )}

                {ehAtual && (
                  <span className="planos-selo planos-selo-atual">
                    <Crown size={12} strokeWidth={2.4} />
                    Seu plano
                  </span>
                )}

                <h2>{plano.nome}</h2>
                <p className="planos-oferta-desc">{plano.descricao}</p>

                <div className="planos-preco">
                  <strong>{formatarBRL(preco)}</strong>
                  <span>/mês</span>
                </div>

                <p className="planos-preco-obs">
                  {ciclo === "anual"
                    ? `${formatarBRL(preco * 12)} cobrados por ano`
                    : "Cobrança mensal, cancele quando quiser"}
                </p>

                <button
                  type="button"
                  className={`planos-oferta-acao ${ehAtual ? "secundaria" : ""}`}
                  onClick={() => abrirConfirmacao(plano)}
                  disabled={mesmoCiclo}
                >
                  {mesmoCiclo
                    ? "Plano atual"
                    : ehAtual
                      ? `Mudar para cobrança ${
                          ciclo === "anual" ? "anual" : "mensal"
                        }`
                      : "Escolher plano"}
                </button>

                <ul className="planos-recursos">
                  {plano.recursos.map((recurso) => (
                    <li key={recurso}>
                      <Check size={14} strokeWidth={2.6} />
                      {recurso}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <section className="planos-garantia">
          <ShieldCheck size={16} strokeWidth={2.2} />
          <p>
            Todos os planos incluem seus dados protegidos, atualizações
            incluídas e cancelamento a qualquer momento, sem multa.
          </p>
        </section>
      </main>

      {/* Modal de confirmação */}
      {selecionado && planoSelecionado && (
        <div
          className="planos-modal-overlay"
          onClick={() => !salvando && setSelecionado(null)}
        >
          <div
            className="planos-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="planos-modal-titulo"
            onClick={(evento) => evento.stopPropagation()}
          >
            <button
              type="button"
              className="planos-modal-fechar"
              onClick={() => !salvando && setSelecionado(null)}
              aria-label="Fechar"
            >
              <X size={16} strokeWidth={2.2} />
            </button>

            <h3 id="planos-modal-titulo">Confirmar mudança de plano</h3>

            <p className="planos-modal-texto">
              Você está trocando do <strong>{atual.nomeCompleto}</strong> para o{" "}
              <strong>{planoSelecionado.nomeCompleto}</strong> com{" "}
              {selecionado.ciclo === "anual"
                ? "cobrança anual"
                : "cobrança mensal"}
              .
            </p>

            <div className="planos-modal-resumo">
              <span>Novo valor</span>
              <strong>
                {formatarBRL(
                  selecionado.ciclo === "anual"
                    ? planoSelecionado.anual
                    : planoSelecionado.mensal,
                )}
                /mês
              </strong>
            </div>

            <div className="planos-modal-acoes">
              <button
                type="button"
                className="planos-modal-cancelar"
                onClick={() => setSelecionado(null)}
                disabled={salvando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="planos-modal-confirmar"
                onClick={confirmarTroca}
                disabled={salvando}
              >
                {salvando ? (
                  <>
                    <Loader2 size={15} className="planos-spin" />
                    Confirmando...
                  </>
                ) : (
                  "Confirmar mudança"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
