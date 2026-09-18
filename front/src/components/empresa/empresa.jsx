import { useState } from "react";
import "./empresa.css";
import { criarNegocio } from "../../api";

const SEGMENTOS = [
  "Tecnologia", "Varejo", "Saúde", "Educação", "Financeiro", "Agronegócio",
  "Logística", "Construção", "Alimentação", "Serviços", "Outro",
];

const PORTES = ["MEI", "Micro", "Pequena", "Média", "Grande"];

const ESTADOS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

export default function MarketMindEmpresa({ onBack, onSubmit }) {
  const [form, setForm] = useState({
    nome: "",
    segmento: "",
    porte: "",
    estado: "",
    cidade: "",
    colaboradores: "",
    fundacao: "",
    descricao: "",
  });

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const set = (key) => (e) => {
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!form.nome || !form.segmento || !form.porte || !form.estado || !form.cidade) {
      setErro("Preencha os dados principais da empresa.");
      return;
    }

    const usuarioSalvo = localStorage.getItem("usuario");

    if (!usuarioSalvo) {
      setErro("Usuário não encontrado. Faça login novamente.");
      return;
    }

    const usuario = JSON.parse(usuarioSalvo);

    setCarregando(true);

    try {
      const resultado = await criarNegocio({
        usuario_id: usuario.id,
        nome: form.nome,
        segmento: form.segmento,
        localizacao: `${form.cidade} - ${form.estado}`,
        receita_mensal: 0,
        custos_mensais: 0,
        funcionarios: Number(form.colaboradores) || 0,
        anos_mercado: form.fundacao
          ? new Date().getFullYear() - Number(form.fundacao)
          : 0,
        publico_alvo: form.porte,
        concorrentes: "",
      });

      localStorage.setItem("negocio", JSON.stringify(resultado.negocio));

      if (onSubmit) {
        onSubmit(resultado.negocio);
      }

      alert("Empresa cadastrada com sucesso!");
    } catch (error) {
      console.error("Erro ao cadastrar empresa:", error);
      setErro(error.message || "Erro ao cadastrar empresa.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mm-page">
      <aside className="mm-left">
        <div className="mm-logo">
          Market<span>Mind</span>
        </div>

        <p className="mm-tagline">
          Dados inteligentes.
          <br />
          <em>Decisões que transformam.</em>
        </p>

        <div className="mm-deco-line" />
      </aside>

      <main className="mm-right">
        <div className="mm-card">
          <div className="mm-stepper">
            <div className="mm-step-item">
              <div className="mm-step-circle done">1</div>
              <span className="mm-step-label">Usuário</span>
            </div>

            <div className="mm-step-connector done" />

            <div className="mm-step-item">
              <div className="mm-step-circle active">2</div>
              <span className="mm-step-label active">Empresa</span>
            </div>

            <div className="mm-step-connector" />

            <div className="mm-step-item">
              <div className="mm-step-circle idle">3</div>
              <span className="mm-step-label">Pronto</span>
            </div>
          </div>

          <h1 className="mm-title">Sua empresa</h1>

          {erro && <div className="mm-erro-box">{erro}</div>}

          <div className="mm-fields">
            <div className="mm-field">
              <span className="mm-field-icon">🏢</span>
              <input
                placeholder="Nome da empresa"
                value={form.nome}
                onChange={set("nome")}
              />
            </div>

            <div className="mm-field">
              <span className="mm-field-icon">🏷️</span>
              <select value={form.segmento} onChange={set("segmento")}>
                <option value="" disabled>
                  Segmento de atuação
                </option>

                {SEGMENTOS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <span className="mm-field-arrow">▾</span>
            </div>

            <div className="mm-field">
              <span className="mm-field-icon">📊</span>
              <select value={form.porte} onChange={set("porte")}>
                <option value="" disabled>
                  Porte da empresa
                </option>

                {PORTES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <span className="mm-field-arrow">▾</span>
            </div>

            <div className="mm-row">
              <div className="mm-field">
                <span className="mm-field-icon">📍</span>

                <select value={form.estado} onChange={set("estado")}>
                  <option value="" disabled>
                    Estado
                  </option>

                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>

                <span className="mm-field-arrow">▾</span>
              </div>

              <div className="mm-field">
                <input
                  placeholder="Cidade"
                  value={form.cidade}
                  onChange={set("cidade")}
                  style={{ paddingLeft: "14px" }}
                />
              </div>
            </div>

            <div className="mm-field">
              <span className="mm-field-icon">👥</span>

              <input
                placeholder="Número de colaboradores"
                type="number"
                min="1"
                value={form.colaboradores}
                onChange={set("colaboradores")}
              />
            </div>

            <div className="mm-field">
              <span className="mm-field-icon">📅</span>

              <input
                placeholder="Ano de fundação"
                type="number"
                min="1900"
                max="2026"
                value={form.fundacao}
                onChange={set("fundacao")}
              />
            </div>

            <textarea
              className="mm-textarea"
              placeholder="Descrição do seu negócio"
              value={form.descricao}
              onChange={set("descricao")}
              rows={3}
            />
          </div>

          <div className="mm-btn-row">
            <button className="mm-btn-back" onClick={onBack}>
              ← Voltar
            </button>

            <button
              className="mm-btn-submit"
              onClick={handleSubmit}
              disabled={carregando}
            >
              {carregando ? "Salvando..." : "Finalizar cadastro"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}