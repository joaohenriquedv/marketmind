import { useState } from "react";
import "./empresa.css";

const SEGMENTOS = [
  "Tecnologia","Varejo","Saúde","Educação","Financeiro","Agronegócio",
  "Logística","Construção","Alimentação","Serviços","Outro",
];
const PORTES = ["MEI", "Micro", "Pequena", "Média", "Grande"];
const ESTADOS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA",
  "PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
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

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = () => {
    onSubmit?.(form);
  };

  return (
    <div className="mm-page">
      {/* ── Left Panel ── */}
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

      {/* ── Right Panel ── */}
      <main className="mm-right">
        <div className="mm-card">
          {/* Stepper */}
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

          <div className="mm-fields">
            {/* Nome da empresa */}
            <div className="mm-field">
              <span className="mm-field-icon">🏢</span>
              <input
                placeholder="Nome da empresa"
                value={form.nome}
                onChange={set("nome")}
              />
            </div>

            {/* Segmento */}
            <div className="mm-field">
              <span className="mm-field-icon">🏷️</span>
              <select value={form.segmento} onChange={set("segmento")}>
                <option value="" disabled>Segmento de atuação</option>
                {SEGMENTOS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <span className="mm-field-arrow">▾</span>
            </div>

            {/* Porte */}
            <div className="mm-field">
              <span className="mm-field-icon">📊</span>
              <select value={form.porte} onChange={set("porte")}>
                <option value="" disabled>Porte da empresa</option>
                {PORTES.map((p) => <option key={p}>{p}</option>)}
              </select>
              <span className="mm-field-arrow">▾</span>
            </div>

            {/* Estado + Cidade */}
            <div className="mm-row">
              <div className="mm-field">
                <span className="mm-field-icon">📍</span>
                <select value={form.estado} onChange={set("estado")}>
                  <option value="" disabled>Estado</option>
                  {ESTADOS.map((e) => <option key={e}>{e}</option>)}
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

            {/* Colaboradores */}
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

            {/* Ano de fundação */}
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

            {/* Descrição */}
            <textarea
              className="mm-textarea"
              placeholder="Descrição do seu negócio"
              value={form.descricao}
              onChange={set("descricao")}
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="mm-btn-row">
            <button className="mm-btn-back" onClick={onBack}>
              ← Voltar
            </button>
            <button className="mm-btn-submit" onClick={handleSubmit}>
              Finalizar cadastro
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

