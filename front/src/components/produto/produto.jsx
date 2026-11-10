
import { useState, useEffect } from "react";
import "./produto.css";
import {
  Store,
  Pencil,
  Trash2,
  Plus,
  X,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Package,
} from "lucide-react";
import SeletorNegocio from "../seletorneg";
import NovoNegocio from "../novonegocio";
import { listarNegociosUsuario as listarNegocios } from "../../api";

const TENDENCIAS = {
  Estavel: { label: "Estável", cls: "estavel", Icone: ArrowRight },
  Crescendo: { label: "Crescendo", cls: "crescendo", Icone: TrendingUp },
  EmQueda: { label: "Em queda", cls: "emqueda", Icone: TrendingDown },
};

function calcMargem(preco, custo) {
  if (!custo || custo <= 0) return null;
  return (((preco - custo) / preco) * 100).toFixed(1);
}

/* ── Persistência dos produtos por negócio ── */
function chaveProdutos(negocioId) {
  return `produtos_${negocioId}`;
}

function carregarProdutos(negocioId) {
  if (negocioId == null) return [];
  try {
    const raw = localStorage.getItem(chaveProdutos(negocioId));
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function salvarProdutos(negocioId, lista) {
  if (negocioId == null) return;
  try {
    localStorage.setItem(chaveProdutos(negocioId), JSON.stringify(lista));
  } catch {
    /* ignora falha de storage */
  }
}

function normalizarListaNegocios(dados) {
  if (!dados) return [];
  const l = Array.isArray(dados)
    ? dados
    : dados.negocios || dados.data || dados.lista || [];
  return Array.isArray(l) ? l : [];
}

function ModalNovoProduto({ onClose, onSalvar }) {
  const [form, setForm] = useState({
    nome: "",
    categoria: "",
    precoCusto: "",
    precoVenda: "",
    vendas: "",
    tendencia: "Estavel",
    estrategico: false,
  });

  function handle(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function submit() {
    if (!form.nome) return;
    onSalvar({
      id: Date.now(),
      nome: form.nome,
      categoria: form.categoria,
      preco: parseFloat(form.precoVenda) || 0,
      precoCusto: parseFloat(form.precoCusto) || 0,
      vendas: parseInt(form.vendas) || 0,
      tendencia: form.tendencia,
      estrategico: form.estrategico,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Novo Produto</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>
        <div className="modal-body">
          <label>Nome *</label>
          <input
            name="nome"
            placeholder="Ex: Coxinha"
            value={form.nome}
            onChange={handle}
            className="input-orange"
          />
          <label>Categoria</label>
          <input
            name="categoria"
            placeholder="Ex: Salgados"
            value={form.categoria}
            onChange={handle}
          />
          <div className="row-2">
            <div>
              <label>Preço de Custo (R$)</label>
              <input
                name="precoCusto"
                type="number"
                value={form.precoCusto}
                onChange={handle}
              />
            </div>
            <div>
              <label>Preço de Venda (R$)</label>
              <input
                name="precoVenda"
                type="number"
                value={form.precoVenda}
                onChange={handle}
              />
            </div>
          </div>
          <label>Vendas por Mês</label>
          <input
            name="vendas"
            type="number"
            value={form.vendas}
            onChange={handle}
          />
          <label>Tendência</label>
          <select name="tendencia" value={form.tendencia} onChange={handle}>
            <option value="Estavel">Estável</option>
            <option value="Crescendo">Crescendo</option>
            <option value="EmQueda">Em queda</option>
          </select>
          <div className="toggle-row">
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="estrategico"
                checked={form.estrategico}
                onChange={handle}
              />
              <span className="toggle-slider"></span>
            </label>
            <span>Produto Estratégico</span>
          </div>
        </div>
        <button className="btn-salvar" onClick={submit}>
          Criar Produto
        </button>
      </div>
    </div>
  );
}

function ModalEditar({ produto, onClose, onSalvar }) {
  const [form, setForm] = useState({
    nome: produto.nome,
    categoria: produto.categoria,
    precoCusto: produto.precoCusto || "",
    precoVenda: produto.preco,
    vendas: produto.vendas,
    tendencia: produto.tendencia,
    estrategico: produto.estrategico,
  });

  function handle(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function submit() {
    onSalvar({
      ...produto,
      nome: form.nome,
      categoria: form.categoria,
      precoCusto: parseFloat(form.precoCusto) || 0,
      preco: parseFloat(form.precoVenda) || 0,
      vendas: parseInt(form.vendas) || 0,
      tendencia: form.tendencia,
      estrategico: form.estrategico,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Produto</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>
        <div className="modal-body">
          <label>Nome *</label>
          <input
            name="nome"
            value={form.nome}
            onChange={handle}
            className="input-orange"
          />
          <label>Categoria</label>
          <input name="categoria" value={form.categoria} onChange={handle} />
          <div className="row-2">
            <div>
              <label>Preço de Custo (R$)</label>
              <input
                name="precoCusto"
                type="number"
                value={form.precoCusto}
                onChange={handle}
              />
            </div>
            <div>
              <label>Preço de Venda (R$)</label>
              <input
                name="precoVenda"
                type="number"
                value={form.precoVenda}
                onChange={handle}
              />
            </div>
          </div>
          <label>Vendas por Mês</label>
          <input
            name="vendas"
            type="number"
            value={form.vendas}
            onChange={handle}
          />
          <label>Tendência</label>
          <select name="tendencia" value={form.tendencia} onChange={handle}>
            <option value="Estavel">Estável</option>
            <option value="Crescendo">Crescendo</option>
            <option value="EmQueda">Em queda</option>
          </select>
          <div className="toggle-row">
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="estrategico"
                checked={form.estrategico}
                onChange={handle}
              />
              <span className="toggle-slider"></span>
            </label>
            <span>Produto Estratégico</span>
          </div>
        </div>
        <button className="btn-salvar" onClick={submit}>
          Salvar
        </button>
      </div>
    </div>
  );
}

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [modalNovo, setModalNovo] = useState(false);
  const [editando, setEditando] = useState(null);

  const [negocios, setNegocios] = useState([]);
  const [ativoId, setAtivoId] = useState(null);
  const [showSeletor, setShowSeletor] = useState(false);
  const [showModalNegocio, setShowModalNegocio] = useState(false);
  const [carregandoNegocios, setCarregandoNegocios] = useState(true);

  useEffect(() => {
    let montado = true;

    (async () => {
      try {
        const usuarioSalvo = localStorage.getItem("usuario");
        if (!usuarioSalvo) return;

        const lista = normalizarListaNegocios(await listarNegocios());
        if (!montado) return;

        setNegocios(lista);
        if (lista.length > 0) {
          setAtivoId(lista[0].id);
          setProdutos(carregarProdutos(lista[0].id));
        }
      } catch (error) {
        console.error("Erro ao carregar negócios:", error);
      } finally {
        if (montado) setCarregandoNegocios(false);
      }
    })();

    return () => {
      montado = false;
    };
  }, []);

  const negocioAtivo = negocios.find((n) => n.id === ativoId) || negocios[0];
  const semNegocio = !carregandoNegocios && !negocioAtivo;

  function selecionarNegocio(valor) {
    const id = valor && typeof valor === "object" ? valor.id : valor;
    setAtivoId(id);
    setProdutos(carregarProdutos(id));
    setShowSeletor(false);
  }

  async function recarregarNegocios(novoIdParaSelecionar) {
    try {
      const lista = normalizarListaNegocios(await listarNegocios());
      setNegocios(lista);

      const id =
        novoIdParaSelecionar ??
        (lista.some((n) => n.id === ativoId) ? ativoId : lista[0]?.id);

      if (id != null) {
        setAtivoId(id);
        setProdutos(carregarProdutos(id));
      }
    } catch (error) {
      console.error("Erro ao recarregar negócios:", error);
    }
  }

  function handleSalvarNegocio(form) {
    recarregarNegocios(form?.id);
  }

  function salvarNovo(p) {
    const lista = [...produtos, p];
    setProdutos(lista);
    salvarProdutos(ativoId, lista);
  }

  function salvarEdicao(p) {
    const lista = produtos.map((x) => (x.id === p.id ? p : x));
    setProdutos(lista);
    salvarProdutos(ativoId, lista);
  }

  function deletar(id) {
    const lista = produtos.filter((x) => x.id !== id);
    setProdutos(lista);
    salvarProdutos(ativoId, lista);
  }

  return (
    <div className="produtos-page">
      <div className="produtos-container">
        <div className="produtos-header">
          <div>
            <h1>Produtos</h1>
            <p>Gerencie seus produtos e serviços</p>
          </div>

          <div className="header-right">
            <div style={{ position: "relative" }}>
              <div
                className="negocio-select"
                onClick={() => setShowSeletor((v) => !v)}
              >
                <span className="negocio-icon">
                  <Store size={16} strokeWidth={2} />
                </span>
                <span>
                  {carregandoNegocios
                    ? "Carregando..."
                    : negocioAtivo?.nome || "Nenhum negócio"}
                </span>
                <span className="select-arrow">
                  {showSeletor ? "▴" : "▾"}
                </span>
              </div>

              {showSeletor && (
                <SeletorNegocio
                  negocios={negocios}
                  ativo={ativoId}
                  onSelecionar={selecionarNegocio}
                  onNovo={() => {
                    setShowSeletor(false);
                    setShowModalNegocio(true);
                  }}
                  onClose={() => setShowSeletor(false)}
                />
              )}
            </div>

            <button className="btn-novo" onClick={() => setModalNovo(true)}>
              <Plus size={16} strokeWidth={2.4} />
              Novo Produto
            </button>
          </div>
        </div>

        {produtos.length === 0 ? (
          <div className="produtos-vazio">
            <div className="produtos-vazio-icon">
              {semNegocio ? (
                <Store size={26} strokeWidth={1.8} />
              ) : (
                <Package size={26} strokeWidth={1.8} />
              )}
            </div>
            <div className="produtos-vazio-title">
              {semNegocio
                ? "Você ainda não tem um negócio"
                : "Nenhum produto cadastrado"}
            </div>
            <div className="produtos-vazio-text">
              {semNegocio
                ? "Cadastre um negócio para começar a gerenciar seus produtos."
                : "Cadastre seus produtos para acompanhar receita, margem e tendência de vendas."}
            </div>
            <button
              className="btn-novo"
              onClick={() =>
                semNegocio ? setShowModalNegocio(true) : setModalNovo(true)
              }
            >
              <Plus size={16} strokeWidth={2.4} />
              {semNegocio ? "Cadastrar negócio" : "Cadastrar produto"}
            </button>
          </div>
        ) : (
          <div className="produtos-grid">
            {produtos.map((p) => {
              const margem = calcMargem(p.preco, p.precoCusto);
              const receita = (p.preco * p.vendas).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });
              const tend = TENDENCIAS[p.tendencia] || TENDENCIAS.Estavel;
              const TendIcone = tend.Icone;

              return (
                <div key={p.id} className="produto-card">
                  <div className="card-top">
                    <div>
                      <div className="card-nome">
                        {p.nome}
                        {p.estrategico && (
                          <span className="badge-estrategico">Estratégico</span>
                        )}
                      </div>
                      <div className="card-categoria">{p.categoria}</div>
                    </div>
                    <div className="card-actions">
                      <button
                        type="button"
                        onClick={() => setEditando(p)}
                        title="Editar"
                      >
                        <Pencil size={16} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deletar(p.id)}
                        title="Excluir"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  <div className="card-stats">
                    <div>
                      <div className="stat-label">PREÇO</div>
                      <div className="stat-value">R$ {p.preco.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="stat-label">VENDAS/MÊS</div>
                      <div className="stat-value">{p.vendas}</div>
                    </div>
                    <div>
                      <div className="stat-label">RECEITA</div>
                      <div className="stat-value">{receita}</div>
                    </div>
                  </div>

                  <div className="card-bottom">
                    <span className={`tendencia ${tend.cls}`}>
                      <TendIcone size={14} strokeWidth={2.2} />
                      {tend.label}
                    </span>
                    {margem && (
                      <span className="margem">Margem: {margem}%</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalNovo && (
        <ModalNovoProduto
          onClose={() => setModalNovo(false)}
          onSalvar={salvarNovo}
        />
      )}
      {editando && (
        <ModalEditar
          produto={editando}
          onClose={() => setEditando(null)}
          onSalvar={salvarEdicao}
        />
      )}
      {showModalNegocio && (
        <NovoNegocio
          onClose={() => setShowModalNegocio(false)}
          onSalvar={handleSalvarNegocio}
        />
      )}
    </div>
  );
}
