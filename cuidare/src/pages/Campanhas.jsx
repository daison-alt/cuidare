import { useEffect, useState } from "react";
import { API_URL } from "../config";


const TIPOS = [
  "Aniversário",
  "Indique um amigo",
  "Sorteio",
  "Desconto",
  "Brinde",
  "Personalizada",
];

export default function Campanhas({ onVoltar }) {
  const [campanhas, setCampanhas] = useState([]);
  const [aniversariantes, setAniversariantes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [indicacoes, setIndicacoes] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarIndicacao, setMostrarIndicacao] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    tipo: "Aniversário",
    data_inicio: "",
    data_fim: "",
    regra: "",
    beneficio: "",
    percentual_desconto: "",
    publico: "Todos",
    ativo: true,
  });

  const [indicacao, setIndicacao] = useState({
    indicador_id: "",
    indicado_id: "",
  });

  function carregar() {
    fetch(`${API_URL}/campanhas`)
      .then((r) => r.json())
      .then(setCampanhas)
      .catch(() => setCampanhas([]));

    fetch(`${API_URL}/campanhas/aniversariantes`)
      .then((r) => r.json())
      .then(setAniversariantes)
      .catch(() => setAniversariantes([]));

    fetch(`${API_URL}/pacientes`)
      .then((r) => r.json())
      .then(setPacientes)
      .catch(() => setPacientes([]));

    fetch(`${API_URL}/indicacoes`)
      .then((r) => r.json())
      .then(setIndicacoes)
      .catch(() => setIndicacoes([]));
  }

  useEffect(() => {
    carregar();
  }, []);

  function alterar(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvar(e) {
    e.preventDefault();

    if (!form.nome.trim() || !form.data_inicio) {
      alert("Informe o nome e a data inicial da campanha.");
      return;
    }

    const resposta = await fetch(`${API_URL}/campanhas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        percentual_desconto:
          form.percentual_desconto === ""
            ? null
            : Number(form.percentual_desconto),
      }),
    });

    if (!resposta.ok) {
      alert("Não foi possível salvar a campanha.");
      return;
    }

    setForm({
      nome: "",
      tipo: "Aniversário",
      data_inicio: "",
      data_fim: "",
      regra: "",
      beneficio: "",
      percentual_desconto: "",
      publico: "Todos",
      ativo: true,
    });

    setMostrarForm(false);
    carregar();
  }

  async function salvarIndicacao(e) {
    e.preventDefault();

    if (!indicacao.indicador_id || !indicacao.indicado_id) {
      alert("Selecione quem indicou e quem foi indicado.");
      return;
    }

    if (indicacao.indicador_id === indicacao.indicado_id) {
      alert("O paciente não pode indicar a si mesmo.");
      return;
    }

    const resposta = await fetch(`${API_URL}/indicacoes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        indicador_id: Number(indicacao.indicador_id),
        indicado_id: Number(indicacao.indicado_id),
      }),
    });

    if (!resposta.ok) {
      const erro = await resposta.json().catch(() => ({}));
      alert(erro.detail || "Não foi possível registrar a indicação.");
      return;
    }

    setIndicacao({
      indicador_id: "",
      indicado_id: "",
    });

    setMostrarIndicacao(false);
    carregar();

    alert("Indicação registrada! Benefício de 10% de desconto gerado.");
  }

  function nomePaciente(id) {
    const paciente = pacientes.find((p) => p.id === id);
    return paciente ? paciente.nome : `Paciente #${id}`;
  }

  return (
    <div className="page campanhas-page">
      <div className="page-header">
        <div>
          <h1>Marketing / Campanhas</h1>
          <p>Crie e acompanhe campanhas da clínica.</p>
        </div>

        <button onClick={onVoltar}>Voltar</button>
      </div>

      {!mostrarForm && !mostrarIndicacao && (
        <div className="campanhas-acoes">
          <button onClick={() => setMostrarForm(true)}>
            + Nova campanha
          </button>

          <button onClick={() => setMostrarIndicacao(true)}>
            + Indique um amigo
          </button>
        </div>
      )}

      {mostrarForm && (
        <div className="campanhas-card">
          <h2>Nova campanha</h2>

          <form className="campanhas-form" onSubmit={salvar}>
            <div>
              <label>Nome</label>
              <input
                value={form.nome}
                onChange={(e) => alterar("nome", e.target.value)}
                placeholder="Ex.: Semana do Pilates"
              />
            </div>

            <div>
              <label>Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => alterar("tipo", e.target.value)}
              >
                {TIPOS.map((tipo) => (
                  <option key={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Data inicial</label>
              <input
                type="date"
                value={form.data_inicio}
                onChange={(e) => alterar("data_inicio", e.target.value)}
              />
            </div>

            <div>
              <label>Data final</label>
              <input
                type="date"
                value={form.data_fim}
                onChange={(e) => alterar("data_fim", e.target.value)}
              />
            </div>

            <div>
              <label>Benefício</label>
              <input
                value={form.beneficio}
                onChange={(e) => alterar("beneficio", e.target.value)}
                placeholder="Ex.: Liberação miofascial"
              />
            </div>

            <div>
              <label>Desconto (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.percentual_desconto}
                onChange={(e) =>
                  alterar("percentual_desconto", e.target.value)
                }
                placeholder="Ex.: 10"
              />
            </div>

            <div>
              <label>Público</label>
              <select
                value={form.publico}
                onChange={(e) => alterar("publico", e.target.value)}
              >
                <option>Todos</option>
                <option>Pacientes ativos</option>
                <option>Alunos de Pilates</option>
              </select>
            </div>

            <div>
              <label>Campanha</label>
              <select
                value={form.ativo ? "Ativa" : "Inativa"}
                onChange={(e) =>
                  alterar("ativo", e.target.value === "Ativa")
                }
              >
                <option>Ativa</option>
                <option>Inativa</option>
              </select>
            </div>

            <div className="campo-full">
              <label>Regra</label>
              <textarea
                value={form.regra}
                onChange={(e) => alterar("regra", e.target.value)}
                placeholder="Descreva como funciona a campanha."
              />
            </div>

            <div className="campanhas-botoes">
              <button type="submit">Salvar campanha</button>

              <button
                type="button"
                onClick={() => setMostrarForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {mostrarIndicacao && (
        <div className="campanhas-card">
          <h2>🤝 Indique um amigo</h2>

          <p>
            O paciente que indicar um novo paciente terá direito a{" "}
            <strong>10% de desconto</strong>.
          </p>

          <form className="campanhas-form" onSubmit={salvarIndicacao}>
            <div>
              <label>Quem indicou?</label>
              <select
                value={indicacao.indicador_id}
                onChange={(e) =>
                  setIndicacao({
                    ...indicacao,
                    indicador_id: e.target.value,
                  })
                }
              >
                <option value="">Selecione o paciente</option>

                {pacientes.map((paciente) => (
                  <option key={paciente.id} value={paciente.id}>
                    {paciente.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Quem foi indicado?</label>
              <select
                value={indicacao.indicado_id}
                onChange={(e) =>
                  setIndicacao({
                    ...indicacao,
                    indicado_id: e.target.value,
                  })
                }
              >
                <option value="">Selecione o novo paciente</option>

                {pacientes.map((paciente) => (
                  <option key={paciente.id} value={paciente.id}>
                    {paciente.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="campanhas-botoes">
              <button type="submit">Registrar indicação</button>

              <button
                type="button"
                onClick={() => setMostrarIndicacao(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="campanhas-card">
        <h2>🎂 Aniversariantes do mês</h2>

        {aniversariantes.length === 0 ? (
          <p>Nenhum aniversariante neste mês.</p>
        ) : (
          <div className="campanhas-lista">
            {aniversariantes.map((paciente) => (
              <div className="campanha-item" key={paciente.id}>
                <h3>{paciente.nome}</h3>

                <p>
                  {new Date(
                    paciente.data_nascimento
                  ).toLocaleDateString("pt-BR")}
                </p>

                <p>🎁 Liberação miofascial</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="campanhas-card">
        <h2>🤝 Indicações</h2>

        {indicacoes.length === 0 ? (
          <p>Nenhuma indicação registrada.</p>
        ) : (
          <div className="indicacoes-lista">
            {indicacoes.map((item) => (
              <div className="indicacao-item" key={item.id}>
                <strong>{nomePaciente(item.indicador_id)}</strong>

                <p>
                  Indicou: {nomePaciente(item.indicado_id)}
                </p>

                <p>🎁 Benefício: {item.beneficio}</p>

                <p className="campanhas-status">
                  Status: {item.status}
                </p>

                <button
                  type="button"
                  className="botao-remover-indicacao"
                  onClick={async () => {
                    if (!window.confirm("Deseja remover esta indicação?")) {
                      return;
                    }

                    const resposta = await fetch(
                      `${API_URL}/indicacoes/${item.id}`,
                      {
                        method: "DELETE",
                      }
                    );

                    if (!resposta.ok) {
                      alert("Não foi possível remover a indicação.");
                      return;
                    }

                    carregar();
                  }}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="campanhas-card">
        <h2>📣 Campanhas cadastradas</h2>

        {campanhas.length === 0 ? (
          <p>Nenhuma campanha cadastrada.</p>
        ) : (
          <div className="campanhas-lista">
            {campanhas.map((campanha) => (
              <div className="campanha-item" key={campanha.id}>
                <h3>{campanha.nome}</h3>

                <p>
                  {campanha.tipo} ·{" "}
                  {campanha.ativo ? "Ativa" : "Inativa"}
                </p>

                <p>
                  {campanha.data_inicio}
                  {campanha.data_fim
                    ? ` até ${campanha.data_fim}`
                    : ""}
                </p>

                {campanha.publico && (
                  <p>👥 Público: {campanha.publico}</p>
                )}

                {campanha.beneficio && (
                  <p>🎁 {campanha.beneficio}</p>
                )}

                {campanha.percentual_desconto != null && (
                  <p>
                    💰 Desconto: {campanha.percentual_desconto}%
                  </p>
                )}

                {campanha.regra && (
                  <p>📋 {campanha.regra}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
