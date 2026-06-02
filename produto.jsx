import { useState } from "react";
import "./produto.css";
import Navbar from "../navbar.jsx";

const initialProdutos = [
  {
    id: 1,
    nome: "Coxinha",
    categoria: "Salgados",
    preco: 5.0,
    vendas: 800,
    tendencia: "Estavel",
    estrategico: true,
  },
  {
    id: 2,
    nome: "Pastel de Carne",
    categoria: "Salgados",
    preco: 6.0,
    vendas: 500,
    tendencia: "Crescendo",
    estrategico: true,
  },
  {
    id: 3,
    nome: "Suco Natural",
    categoria: "Bebidas",
    preco: 6.0,
    vendas: 300,
    tendencia: "Crescendo",
    estrategico: false,
  },
  {
    id: 4,
    nome: "Empada",
    categoria: "Salgados",
    preco: 4.0,
    vendas: 200,
    tendencia: "EmQueda",
    estrategico: false,
  },
  {
    id: 5,
    nome: "Refrigerante Lata",
    categoria: "Bebidas",
    preco: 5.0,
    vendas: 400,
    tendencia: "Estavel",
    estrategico: false,
  },
];

const tendenciaLabel = {
  Estavel: { label: "→ Estável", cls: "estavel" },
  Crescendo: { label: "→ Crescendo", cls: "crescendo" },
  EmQueda: { label: "↘️ Em queda", cls: "emqueda" },
};

function calcMargem(preco, custo) {
  if (!custo || custo <= 0) return null;
  return (((preco - custo) / preco) * 100).toFixed(1);
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
          <button className="modal-close" onClick={onClose}>
            ×
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
          <button className="modal-close" onClick={onClose}>
            ×
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

export default function Produtos({ onNavegar }) {
  const [produtos, setProdutos] = useState(initialProdutos);
  const [modalNovo, setModalNovo] = useState(false);
  const [editando, setEditando] = useState(null);

  function salvarNovo(p) {
    setProdutos((prev) => [...prev, p]);
  }

  function salvarEdicao(p) {
    setProdutos((prev) => prev.map((x) => (x.id === p.id ? p : x)));
  }

  function deletar(id) {
    setProdutos((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <>
      <Navbar onNavegar={onNavegar} paginaAtiva="produto" />
      <div className="produtos-page">
        <div className="produtos-container">
          <div className="produtos-header">
            <div>
              <h1>Produtos</h1>
              <p>Gerencie seus produtos e serviços</p>
            </div>
            <div className="header-right">
              <div className="negocio-select">
                <span className="negocio-icon">🏪</span>
                <span>Lanchonete da Maria</span>
                <span className="select-arrow">▾</span>
              </div>
              <button className="btn-novo" onClick={() => setModalNovo(true)}>
                + Novo Produto
              </button>
            </div>
          </div>

          <div className="produtos-grid">
            {produtos.map((p) => {
              const margem = calcMargem(p.preco, p.precoCusto);
              const receita = (p.preco * p.vendas).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });
              const tend =
                tendenciaLabel[p.tendencia] || tendenciaLabel.Estavel;

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
                      <button onClick={() => setEditando(p)}>✏️</button>
                      <button onClick={() => deletar(p.id)}>🗑️</button>
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
      </div>
    </>
  );
}
