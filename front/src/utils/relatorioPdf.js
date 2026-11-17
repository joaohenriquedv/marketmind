/* ===========================================================
   Geração do PDF do relatório — MarketMind
   Layout medido: cada bloco avança pela altura real da linha
   (getTextWidth + line-height em função do tamanho da fonte),
   então nada se sobrepõe nem vaza da página.
   =========================================================== */

import { jsPDF } from "jspdf";

const PT_MM = 0.3528; // 1pt em mm

const LARANJA = [244, 116, 33];
const ESCURO = [22, 24, 29];
const TEXTO = [55, 60, 66];
const CINZA = [122, 128, 136];
const CLARO = [248, 247, 245];

/* altura de uma linha para um tamanho de fonte */
function alturaLinha(pt, fator = 1.3) {
  return pt * PT_MM * fator;
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function pct(valor) {
  return `${Number(valor || 0).toFixed(1)}%`;
}

/* corta com reticências respeitando a largura disponível */
function limitar(doc, texto, largura) {
  let t = String(texto ?? "");

  if (doc.getTextWidth(t) <= largura) return t;

  while (t.length > 1 && doc.getTextWidth(`${t}…`) > largura) {
    t = t.slice(0, -1);
  }

  return `${t}…`;
}

/* reduz a fonte até caber (usado nos valores dos KPIs) */
function textoQueCabe(doc, texto, largura, tamanhoMax, tamanhoMin = 7) {
  let tamanho = tamanhoMax;

  while (tamanho > tamanhoMin) {
    doc.setFontSize(tamanho);
    if (doc.getTextWidth(String(texto)) <= largura) return tamanho;
    tamanho -= 0.5;
  }

  doc.setFontSize(tamanhoMin);
  return tamanhoMin;
}

export function gerarPdf(dados, analise, ind) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const M = 16;
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const CW = W - M * 2; // 178mm
  const RESERVA_RODAPE = 18;
  const LIMITE = H - RESERVA_RODAPE;

  let y = 0;

  /* ---------- controle de página ---------- */
  function novaPagina() {
    doc.addPage();
    y = M + 6;
  }

  function precisa(altura) {
    if (y + altura > LIMITE) novaPagina();
  }

  function fonte(tamanho, estilo = "normal", cor = ESCURO) {
    doc.setFont("helvetica", estilo);
    doc.setFontSize(tamanho);
    doc.setTextColor(...cor);
  }

  /* ---------- blocos ---------- */

  function paragrafo(texto, tamanho = 10.5) {
    fonte(tamanho, "normal", TEXTO);

    const passo = alturaLinha(tamanho, 1.42);
    const linhas = doc.splitTextToSize(String(texto || ""), CW);

    linhas.forEach((linha) => {
      precisa(passo);
      doc.text(linha, M, y);
      y += passo;
    });

    y += 2;
  }

  function secao(titulo) {
    const passo = alturaLinha(11.5, 1.4);

    precisa(passo + 12);

    y += 4;
    fonte(11.5, "bold", LARANJA);
    doc.text(titulo, M, y);

    y += 2.6;
    doc.setDrawColor(...LARANJA);
    doc.setLineWidth(0.4);
    doc.line(M, y, W - M, y);
    y += 6.4;
  }

  function lista(itens) {
    const tamanho = 10.5;
    const passo = alturaLinha(tamanho, 1.4);
    const recuo = 5;

    (itens || []).forEach((item) => {
      const linhas = doc.splitTextToSize(String(item), CW - recuo);

      linhas.forEach((linha, i) => {
        precisa(passo);

        fonte(tamanho, "normal", TEXTO);

        if (i === 0) {
          fonte(tamanho, "bold", LARANJA);
          doc.text("•", M, y);
          fonte(tamanho, "normal", TEXTO);
        }

        doc.text(linha, M + recuo, y);
        y += passo;
      });

      y += 1.1;
    });

    y += 2;
  }

  /* ---------- cabeçalho ---------- */
  const alturaFaixa = 20;

  doc.setFillColor(...LARANJA);
  doc.rect(0, 0, W, alturaFaixa, "F");

  fonte(14, "bold", [255, 255, 255]);
  doc.text("MarketMind", M, 12.4);

  const larguraMarca = doc.getTextWidth("MarketMind");

  fonte(8.5, "normal", [255, 255, 255]);
  const tipo = limitar(doc, dados.tipo || "Relatório", CW - larguraMarca - 12);
  doc.text(tipo, W - M, 12.4, { align: "right" });

  /* ---------- título ---------- */
  y = alturaFaixa + 14;

  const tamanhoTitulo = 18;
  const passoTitulo = alturaLinha(tamanhoTitulo, 1.22);

  fonte(tamanhoTitulo, "bold", ESCURO);

  doc
    .splitTextToSize(String(dados.titulo || "Relatório"), CW)
    .forEach((linha) => {
      precisa(passoTitulo);
      doc.text(linha, M, y);
      y += passoTitulo;
    });

  y += 2.6;

  fonte(8.5, "normal", CINZA);
  const legenda = `Gerado em ${new Date().toLocaleString("pt-BR")} · ${
    analise.origem === "local"
      ? "análise local (IA indisponível)"
      : "análise por IA"
  }`;
  doc.text(limitar(doc, legenda, CW), M, y);
  y += 10;

  /* ---------- metadados (caixas de altura dinâmica) ---------- */
  const metas = [
    ["Empresa", dados.empresa],
    ["Período", dados.periodo],
    ["Região", dados.regiao],
    ["Produtos", `${ind.total} cadastrado(s)`],
  ];

  const gapX = 4;
  const larguraCaixa = (CW - gapX) / 2;
  const paddingCaixa = 3.4;
  const passoLabel = alturaLinha(7, 1.2);
  const passoValor = alturaLinha(9.5, 1.3);

  for (let i = 0; i < metas.length; i += 2) {
    const par = metas.slice(i, i + 2);

    /* mede a altura necessária com o maior valor do par */
    fonte(9.5, "bold", ESCURO);

    const alturas = par.map(([, valor]) => {
      const linhas = doc.splitTextToSize(String(valor || "-"), larguraCaixa - paddingCaixa * 2);
      return paddingCaixa * 2 + passoLabel + linhas.length * passoValor;
    });

    const alturaBloco = Math.max(...alturas);

    precisa(alturaBloco + 4);

    par.forEach(([rotulo, valor], coluna) => {
      const x = M + coluna * (larguraCaixa + gapX);

      doc.setFillColor(...CLARO);
      doc.roundedRect(x, y, larguraCaixa, alturaBloco, 2, 2, "F");

      fonte(7, "normal", CINZA);
      doc.text(String(rotulo).toUpperCase(), x + paddingCaixa, y + paddingCaixa + passoLabel * 0.75);

      fonte(9.5, "bold", ESCURO);

      let yy = y + paddingCaixa + passoLabel + passoValor * 0.78;
      const linhas = doc.splitTextToSize(String(valor || "-"), larguraCaixa - paddingCaixa * 2);

      linhas.slice(0, 2).forEach((linha) => {
        doc.text(linha, x + paddingCaixa, yy);
        yy += passoValor;
      });
    });

    y += alturaBloco + 4;
  }

  /* ---------- KPIs ---------- */
  const kpis = [
    ["Receita", moeda(ind.receita)],
    ["Lucro", moeda(ind.lucro)],
    ["Margem", pct(ind.margem)],
    ["Ticket médio", moeda(ind.ticket)],
  ];

  const gapKpi = 3;
  const larguraKpi = (CW - gapKpi * 3) / 4;
  const alturaKpi = 17;
  const paddingKpi = 2.6;

  precisa(alturaKpi + 8);

  kpis.forEach(([rotulo, valor], i) => {
    const x = M + i * (larguraKpi + gapKpi);

    doc.setDrawColor(238, 234, 229);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, larguraKpi, alturaKpi, 2, 2, "FD");

    fonte(7, "normal", CINZA);
    doc.text(String(rotulo).toUpperCase(), x + paddingKpi, y + 5.2);

    const tamanho = textoQueCabe(doc, valor, larguraKpi - paddingKpi * 2, 11, 7.5);
    fonte(tamanho, "bold", ESCURO);
    doc.text(String(valor), x + paddingKpi, y + 12.4);
  });

  y += alturaKpi + 6;

  /* ---------- conteúdo ---------- */
  if (dados.observacoes) {
    secao("Observações");
    paragrafo(dados.observacoes);
  }

  secao("Resumo da análise");
  paragrafo(analise.resumo || "Sem resumo disponível.");

  secao("Pontos de melhoria");
  lista(
    analise.pontos_melhoria?.length
      ? analise.pontos_melhoria
      : ["Nenhum ponto informado."]
  );

  secao("Recomendações para crescimento");
  lista(
    analise.recomendacoes_crescimento?.length
      ? analise.recomendacoes_crescimento
      : ["Nenhuma recomendação informada."]
  );

  /* ---------- tabela de produtos ---------- */
  if (ind.ranking?.length) {
    secao("Produtos no período");

    const colunas = [
      { titulo: "Produto", frac: 0.34, align: "left" },
      { titulo: "Preço", frac: 0.15, align: "right" },
      { titulo: "Vendas", frac: 0.11, align: "right" },
      { titulo: "Receita", frac: 0.17, align: "right" },
      { titulo: "Margem", frac: 0.11, align: "right" },
      { titulo: "Tendência", frac: 0.12, align: "left" },
    ].map((c) => ({ ...c, largura: c.frac * CW }));

    const paddingCelula = 2;
    const tamanhoCelula = 8.5;
    const passCelula = alturaLinha(tamanhoCelula, 1.25);
    const alturaCabecalho = 8;

    function cabecalho() {
      precisa(alturaCabecalho + 10);

      doc.setFillColor(...CLARO);
      doc.rect(M, y, CW, alturaCabecalho, "F");

      fonte(7.5, "bold", CINZA);

      let x = M + paddingCelula;

      colunas.forEach((c) => {
        doc.text(
          c.titulo.toUpperCase(),
          c.align === "right" ? x + c.largura - paddingCelula * 2 : x,
          y + 5.2,
          { align: c.align === "right" ? "right" : "left" }
        );
        x += c.largura;
      });

      y += alturaCabecalho;
    }

    cabecalho();

    ind.ranking.forEach((p, index) => {
      fonte(tamanhoCelula, "normal", ESCURO);

      const nomeLinhas = doc
        .splitTextToSize(String(p.nome || "Produto"), colunas[0].largura - paddingCelula * 2)
        .slice(0, 2);

      const alturaLinhaTabela = Math.max(
        7,
        nomeLinhas.length * passCelula + 3
      );

      if (y + alturaLinhaTabela > LIMITE) {
        novaPagina();
        cabecalho();
        fonte(tamanhoCelula, "normal", ESCURO);
      }

      if (index % 2 === 1) {
        doc.setFillColor(252, 251, 250);
        doc.rect(M, y, CW, alturaLinhaTabela, "F");
      }

      const tendencia =
        p.tendencia === "EmQueda"
          ? "Em queda"
          : p.tendencia === "Crescendo"
            ? "Crescendo"
            : "Estável";

      const valores = [
        null, // nome é desenhado linha a linha
        moeda(p.preco),
        String(p.vendas ?? 0),
        moeda(p.receita),
        pct(p.margemUnit),
        tendencia,
      ];

      let x = M + paddingCelula;

      colunas.forEach((c, i) => {
        if (i === 0) {
          let yy = y + 4.6;

          nomeLinhas.forEach((linha) => {
            doc.text(linha, x, yy);
            yy += passCelula;
          });
        } else {
          const texto = limitar(doc, valores[i], c.largura - paddingCelula * 2);

          doc.text(
            texto,
            c.align === "right" ? x + c.largura - paddingCelula * 2 : x,
            y + 4.9,
            { align: c.align === "right" ? "right" : "left" }
          );
        }

        x += c.largura;
      });

      y += alturaLinhaTabela;
    });

    y += 4;
  }

  /* ---------- rodapé ---------- */
  const totalPaginas = doc.internal.getNumberOfPages();

  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);

    doc.setDrawColor(238, 234, 229);
    doc.setLineWidth(0.3);
    doc.line(M, H - 14, W - M, H - 14);

    fonte(8, "normal", [155, 160, 166]);
    doc.text("MarketMind · Relatório gerado automaticamente", M, H - 9);
    doc.text(`Página ${pagina} de ${totalPaginas}`, W - M, H - 9, {
      align: "right",
    });
  }

  const nomeArquivo = `Relatorio-${(dados.empresa || "MarketMind").replace(
    /[^\w-]+/g,
    "_"
  )}.pdf`;

  doc.save(nomeArquivo);
}
