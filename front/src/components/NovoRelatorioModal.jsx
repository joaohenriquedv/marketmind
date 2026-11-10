
import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import "./NovoRelatorioModal.css";

const CHAT_URL = import.meta.env.VITE_CHAT_URL || "http://localhost:3002";

const TIPOS = [
  "Análise de Mercado",
  "Análise de Concorrência",
  "Monitoramento de Tendências",
  "Diagnóstico de Crescimento",
  "Comparativo de Empresas",
  "Outro",
];

function formatarPeriodo(inicio, fim) {
  const fmt = (v) => (v ? v.split("-").reverse().join("/") : "");
  if (inicio && fim) return `${fmt(inicio)} a ${fmt(fim)}`;
  if (inicio) return `A partir de ${fmt(inicio)}`;
  if (fim) return `Até ${fmt(fim)}`;
  return "Não informado";
}

// Análise usada caso a IA falhe (o PDF nunca sai vazio)
function analiseFallback(dados) {
  const local = dados.regiao ? ` na região de ${dados.regiao}` : "";
  return {
    resumo:
      `Este relatório apresenta uma análise de ${dados.tipo} para ${dados.empresa}${local}. ` +
      `O objetivo é apoiar a tomada de decisão a partir do cenário observado` +
      `${dados.periodo !== "Não informado" ? ` no período de ${dados.periodo}` : ""}. ` +
      `A seguir estão os pontos de melhoria e as recomendações para acelerar o crescimento.`,
    pontos_melhoria: [
      "Definir indicadores-chave (KPIs) claros para acompanhar a evolução mês a mês.",
      "Mapear os principais concorrentes e comparar preço, posicionamento e canais de venda.",
      "Estruturar a jornada do cliente para reduzir perdas entre prospecção e fechamento.",
      "Revisar o posicionamento de marca para diferenciar a oferta no mercado.",
    ],
    recomendacoes_crescimento: [
      "Concentrar esforços no segmento de maior margem e demanda comprovada.",
      "Testar novos canais de aquisição com metas semanais e medir o retorno de cada um.",
      "Investir em conteúdo e prova social para reduzir o custo de aquisição de clientes.",
      "Criar uma rotina de revisão quinzenal dos números para agir rápido sobre desvios.",
    ],
  };
}

function gerarPdf(dados, analise) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margem = 18;
  const largura = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const larguraTexto = largura - margem * 2;
  let y = 22;

  function quebraPagina(espaco = 8) {
    if (y + espaco > alturaPagina - 18) {
      doc.addPage();
      y = 22;
    }
  }

  function tituloSecao(texto) {
    quebraPagina(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 106, 0);
    doc.text(texto, margem, y);
    y += 2;
    doc.setDrawColor(255, 106, 0);
    doc.setLineWidth(0.5);
    doc.line(margem, y, largura - margem, y);
    y += 7;
    doc.setTextColor(40, 40, 40);
  }

  function paragrafo(texto, tamanho = 10.5) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(tamanho);
    const linhas = doc.splitTextToSize(String(texto || ""), larguraTexto);
    linhas.forEach((linha) => {
      quebraPagina(7);
      doc.text(linha, margem, y);
      y += 6;
    });
    y += 2;
  }

  function lista(itens) {
    doc.setFontSize(10.5);
    (itens || []).forEach((item) => {
      const linhas = doc.splitTextToSize(String(item), larguraTexto - 6);
      linhas.forEach((linha, i) => {
        quebraPagina(7);
        if (i === 0) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 106, 0);
          doc.text("•", margem, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(40, 40, 40);
        }
        doc.text(linha, margem + 5, y);
        y += 6;
      });
      y += 1;
    });
    y += 3;
  }

  // Faixa de cabeçalho
  doc.setFillColor(255, 106, 0);
  doc.rect(0, 0, largura, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("MarketMind", margem, 8);
  doc.setTextColor(40, 40, 40);

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.splitTextToSize(dados.titulo || "Relatório", larguraTexto).forEach((l) => {
    quebraPagina(10);
    doc.text(l, margem, y);
    y += 9;
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(130, 130, 130);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, margem, y);
  y += 11;
  doc.setTextColor(40, 40, 40);

  // Informações do relatório
  tituloSecao("Informações do Relatório");
  [
    ["Tipo", dados.tipo],
    ["Empresa", dados.empresa],
    ["Período", dados.periodo],
    ["Região", dados.regiao],
  ].forEach(([rotulo, valor]) => {
    quebraPagina(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(`${rotulo}:`, margem, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(valor || "-"), margem + 30, y);
    y += 7;
  });
  y += 3;

  if (dados.observacoes) {
    tituloSecao("Observações");
    paragrafo(dados.observacoes);
  }

  tituloSecao("Resumo da Análise");
  paragrafo(analise.resumo || "Sem resumo disponível.");

  tituloSecao("Pontos de Melhoria");
  lista(
    analise.pontos_melhoria?.length
      ? analise.pontos_melhoria
      : ["Nenhum ponto informado."]
  );

  tituloSecao("Recomendações para Crescimento");
  lista(
    analise.recomendacoes_crescimento?.length
      ? analise.recomendacoes_crescimento
      : ["Nenhuma recomendação informada."]
  );

  // Rodapé com paginação
  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${p} de ${total}  ·  MarketMind`,
      largura - margem,
      alturaPagina - 8,
      { align: "right" }
    );
  }

  const nomeArquivo = `Relatorio-${(dados.empresa || "MarketMind").replace(
    /[^\w-]+/g,
    "_"
  )}.pdf`;
  doc.save(nomeArquivo);
}

export default function NovoRelatorioModal({ aberto, onFechar }) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [empresa, setEmpresa] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [regiao, setRegiao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [etapa, setEtapa] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;
    function onKey(e) {
      if (e.key === "Escape" && !carregando) onFechar();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto, carregando, onFechar]);

  if (!aberto) return null;

  async function handleGerar(event) {
    event.preventDefault();

    if (carregando) return;

    if (!titulo.trim() || !empresa.trim()) {
      setErro("Preencha pelo menos o título e a empresa.");
      return;
    }

    setErro("");
    setCarregando(true);

    const dados = {
      titulo: titulo.trim(),
      tipo,
      empresa: empresa.trim(),
      periodo: formatarPeriodo(inicio, fim),
      regiao: regiao.trim() || "Não informada",
      observacoes: observacoes.trim(),
    };

    let analise;

    try {
      setEtapa("Gerando a análise com IA...");

      const resposta = await fetch(`${CHAT_URL}/relatorio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      if (!resposta.ok) {
        throw new Error(`Servidor retornou ${resposta.status}`);
      }

      analise = await resposta.json();

      if (!analise?.resumo) {
        throw new Error("Resposta inválida da IA");
      }
    } catch (error) {
      // Se a IA falhar, o relatório ainda é gerado com a análise padrão.
      console.warn("Falha ao gerar análise com IA, usando fallback:", error);
      analise = analiseFallback(dados);
    }

    try {
      setEtapa("Montando o PDF...");
      gerarPdf(dados, analise);
      onFechar();
    } catch (error) {
      setErro(`Não foi possível gerar o PDF. (${error.message || "erro"})`);
    } finally {
      setCarregando(false);
      setEtapa("");
    }
  }

  return (
    <div className="relatorio-overlay" onClick={() => !carregando && onFechar()}>
      <div className="relatorio-modal" onClick={(e) => e.stopPropagation()}>
        <div className="relatorio-header">
          <div>
            <h2>Novo Relatório</h2>
            <p>Preencha as informações para gerar o PDF</p>
          </div>
          <button
            type="button"
            className="relatorio-fechar"
            onClick={() => !carregando && onFechar()}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form className="relatorio-form" onSubmit={handleGerar}>
          {erro && <div className="relatorio-erro">{erro}</div>}

          <div className="relatorio-grid">
            <div className="relatorio-campo full">
              <label htmlFor="rel-titulo">Título do relatório *</label>
              <input
                id="rel-titulo"
                type="text"
                placeholder="Ex.: Panorama do setor de varejo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="relatorio-campo">
              <label htmlFor="rel-tipo">Tipo</label>
              <select
                id="rel-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="relatorio-campo">
              <label htmlFor="rel-empresa">Empresa *</label>
              <input
                id="rel-empresa"
                type="text"
                placeholder="Ex.: MarketMind Tecnologia"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
              />
            </div>

            <div className="relatorio-campo">
              <label htmlFor="rel-inicio">Início do período</label>
              <input
                id="rel-inicio"
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>

            <div className="relatorio-campo">
              <label htmlFor="rel-fim">Fim do período</label>
              <input
                id="rel-fim"
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </div>

            <div className="relatorio-campo full">
              <label htmlFor="rel-regiao">Região</label>
              <input
                id="rel-regiao"
                type="text"
                placeholder="Ex.: Sudeste, Brasil"
                value={regiao}
                onChange={(e) => setRegiao(e.target.value)}
              />
            </div>

            <div className="relatorio-campo full">
              <label htmlFor="rel-observacoes">Observações</label>
              <textarea
                id="rel-observacoes"
                placeholder="Contexto, objetivos ou pontos que a análise deve considerar..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>

          <div className="relatorio-acoes">
            <button
              type="button"
              className="btn-cancelar"
              onClick={onFechar}
              disabled={carregando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-gerar" disabled={carregando}>
              {carregando ? etapa || "Gerando..." : "Gerar e baixar PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
