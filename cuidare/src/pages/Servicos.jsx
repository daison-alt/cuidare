import { useEffect, useMemo, useState } from "react";
import "./Servicos.css";

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : `https://${window.location.hostname.replace(
        /-5173\.app\.github\.dev$/,
        "-8000.app.github.dev"
      )}`;

function obterToken() {
  return localStorage.getItem("cuidare_token");
}

function formatarValor(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "R$ 0,00";
  }

  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return String(valor);
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function valorParaApi(valor) {
  const texto = String(valor || "")
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(texto);

  if (Number.isNaN(numero)) {
    return "";
  }

  return numero.toFixed(2);
}

function valorParaFormulario(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "";
  }

  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return String(valor);
  }

  return numero.toFixed(2).replace(".", ",");
}

const formularioInicial = {
  nome: "",
  descricao: "",
  duracao_minutos: "60",
  valor: "",
  ativo: true,
};

export default function Servicos({ onVoltar, onAbrirPlanosPilates, onAbrirAlunosPilates }) {
  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [salvando, setSalvando] = useState(false);

  const [filtro, setFiltro] = useState("todos");

  async function carregarServicos() {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await fetch(`${API_URL}/servicos`, {
        headers: {
          Authorization: `Bearer ${obterToken()}`,
        },
      });

      const dados = await resposta.json().catch(() => []);

      if (!resposta.ok) {
        throw new Error(
          dados?.detail || "Não foi possível carregar os serviços."
        );
      }

      setServicos(Array.isArray(dados) ? dados : []);
    } catch (error) {
      setErro(error.message || "Erro ao carregar os serviços.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarServicos();
  }, []);

  const servicosFiltrados = useMemo(() => {
    if (filtro === "ativos") {
      return servicos.filter((servico) => servico.ativo);
    }

    if (filtro === "inativos") {
      return servicos.filter((servico) => !servico.ativo);
    }

    return servicos;
  }, [servicos, filtro]);

  function abrirNovo() {
    setEditandoId(null);
    setFormulario(formularioInicial);
    setErro("");
    setMensagem("");
    setModalAberto(true);
  }

  function abrirEdicao(servico) {
    setEditandoId(servico.id);

    setFormulario({
      nome: servico.nome || "",
      descricao: servico.descricao || "",
      duracao_minutos: String(servico.duracao_minutos || 60),
      valor: valorParaFormulario(servico.valor),
      ativo: Boolean(servico.ativo),
    });

    setErro("");
    setMensagem("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);
    setEditandoId(null);
    setFormulario(formularioInicial);
  }

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function salvarServico(event) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    const nome = formulario.nome.trim();
    const duracao = Number(formulario.duracao_minutos);
    const valor = valorParaApi(formulario.valor);

    if (!nome) {
      setErro("Informe o nome do serviço.");
      return;
    }

    if (!Number.isInteger(duracao) || duracao <= 0) {
      setErro("A duração deve ser um número inteiro maior que zero.");
      return;
    }

    if (formulario.valor.trim() && !valor) {
      setErro("Informe um valor válido.");
      return;
    }

    setSalvando(true);

    try {
      const corpo = {
        nome,
        descricao: formulario.descricao.trim() || null,
        duracao_minutos: duracao,
        valor: valor || null,
        ativo: Boolean(formulario.ativo),
      };

      const url = editandoId
        ? `${API_URL}/servicos/${editandoId}`
        : `${API_URL}/servicos`;

      const resposta = await fetch(url, {
        method: editandoId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${obterToken()}`,
        },
        body: JSON.stringify(corpo),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados?.detail ||
            `Não foi possível ${
              editandoId ? "atualizar" : "cadastrar"
            } o serviço.`
        );
      }

      setMensagem(
        editandoId
          ? "Serviço atualizado com sucesso."
          : "Serviço cadastrado com sucesso."
      );

      setModalAberto(false);
      setEditandoId(null);
      setFormulario(formularioInicial);

      await carregarServicos();
    } catch (error) {
      setErro(error.message || "Erro ao salvar serviço.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(servico) {
    setErro("");
    setMensagem("");

    try {
      const resposta = await fetch(`${API_URL}/servicos/${servico.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${obterToken()}`,
        },
        body: JSON.stringify({
          ativo: !servico.ativo,
        }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados?.detail || "Não foi possível alterar o status do serviço."
        );
      }

      setMensagem(
        servico.ativo
          ? "Serviço inativado com sucesso."
          : "Serviço ativado com sucesso."
      );

      await carregarServicos();
    } catch (error) {
      setErro(error.message || "Erro ao alterar o status.");
    }
  }

  return (
    <div className="servicos-page">
      <header className="servicos-header">
        <div>
          <span className="servicos-kicker">CONFIGURAÇÃO</span>
          <h1>Serviços</h1>
          <p>
            Cadastre e organize os serviços oferecidos pela clínica.
          </p>
        </div>

        <div className="servicos-header-actions">
          <button
            type="button"
            className="servicos-button secondary"
            onClick={onVoltar}
          >
            ← Voltar
          </button>

          <button
            type="button"
            className="servicos-button primary"
            onClick={abrirNovo}
          >
            + Novo serviço
          </button>
        </div>
      </header>

      {mensagem && (
        <div className="servicos-alert success">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="servicos-alert error">
          {erro}
        </div>
      )}

      <section className="servicos-modulos">
        <div className="servicos-modulo destaque">
          <div className="servicos-modulo-icone">🧘</div>

          <div className="servicos-modulo-conteudo">
            <span className="servicos-modulo-kicker">PILATES</span>
            <h2>Gestão do Pilates</h2>
            <p>
              Gerencie os planos, matrículas dos alunos e aulas disponíveis.
            </p>

            <div className="servicos-modulo-acoes">
              <button
                type="button"
                className="servicos-button primary"
                onClick={onAbrirPlanosPilates}
              >
                Planos de Pilates
              </button>

              <button
                type="button"
                className="servicos-button secondary"
                onClick={onAbrirAlunosPilates}
              >
                Alunos de Pilates
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="servicos-summary">
        <div className="servicos-summary-card">
          <span>Total</span>
          <strong>{servicos.length}</strong>
          <small>Serviços cadastrados</small>
        </div>

        <div className="servicos-summary-card">
          <span>Ativos</span>
          <strong>{servicos.filter((servico) => servico.ativo).length}</strong>
          <small>Disponíveis para uso</small>
        </div>

        <div className="servicos-summary-card">
          <span>Inativos</span>
          <strong>
            {servicos.filter((servico) => !servico.ativo).length}
          </strong>
          <small>Fora de uso</small>
        </div>
      </section>

      <section className="servicos-panel">
        <div className="servicos-panel-header">
          <div>
            <span>CATÁLOGO</span>
            <h2>Serviços cadastrados</h2>
          </div>

          <div className="servicos-filtros">
            <button
              type="button"
              className={filtro === "todos" ? "active" : ""}
              onClick={() => setFiltro("todos")}
            >
              Todos
            </button>

            <button
              type="button"
              className={filtro === "ativos" ? "active" : ""}
              onClick={() => setFiltro("ativos")}
            >
              Ativos
            </button>

            <button
              type="button"
              className={filtro === "inativos" ? "active" : ""}
              onClick={() => setFiltro("inativos")}
            >
              Inativos
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="servicos-empty">
            <strong>Carregando serviços...</strong>
            <p>Aguarde enquanto buscamos os serviços cadastrados.</p>
          </div>
        ) : servicosFiltrados.length === 0 ? (
          <div className="servicos-empty">
            <div className="servicos-empty-icon">✦</div>
            <strong>
              {servicos.length === 0
                ? "Nenhum serviço cadastrado"
                : "Nenhum serviço encontrado"}
            </strong>
            <p>
              {servicos.length === 0
                ? "Cadastre o primeiro serviço para começar."
                : "Altere o filtro para visualizar outros serviços."}
            </p>

            {servicos.length === 0 && (
              <button
                type="button"
                className="servicos-button primary"
                onClick={abrirNovo}
              >
                + Cadastrar primeiro serviço
              </button>
            )}
          </div>
        ) : (
          <div className="servicos-table-wrapper">
            <table className="servicos-table">
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Duração</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {servicosFiltrados.map((servico) => (
                  <tr key={servico.id}>
                    <td>
                      <div className="servico-nome">
                        <strong>{servico.nome}</strong>

                        {servico.descricao && (
                          <small>{servico.descricao}</small>
                        )}
                      </div>
                    </td>

                    <td>{servico.duracao_minutos} min</td>

                    <td>{formatarValor(servico.valor)}</td>

                    <td>
                      <span
                        className={`servico-status ${
                          servico.ativo ? "ativo" : "inativo"
                        }`}
                      >
                        <span />
                        {servico.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td>
                      <div className="servico-acoes">
                        <button
                          type="button"
                          className="acao-editar"
                          onClick={() => abrirEdicao(servico)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className={
                            servico.ativo
                              ? "acao-inativar"
                              : "acao-ativar"
                          }
                          onClick={() => alternarStatus(servico)}
                        >
                          {servico.ativo ? "Inativar" : "Ativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalAberto && (
        <div className="servicos-modal-backdrop">
          <div
            className="servicos-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="servico-modal-title"
          >
            <div className="servicos-modal-header">
              <div>
                <span>SERVIÇO</span>
                <h2 id="servico-modal-title">
                  {editandoId ? "Editar serviço" : "Novo serviço"}
                </h2>
              </div>

              <button
                type="button"
                className="servicos-close"
                onClick={fecharModal}
                disabled={salvando}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form onSubmit={salvarServico}>
              <div className="servicos-form-grid">
                <label className="campo campo-full">
                  <span>Nome do serviço *</span>
                  <input
                    type="text"
                    value={formulario.nome}
                    onChange={(event) =>
                      atualizarCampo("nome", event.target.value)
                    }
                    placeholder="Ex.: Pilates"
                    maxLength={150}
                    autoFocus
                  />
                </label>

                <label className="campo campo-full">
                  <span>Descrição</span>
                  <textarea
                    value={formulario.descricao}
                    onChange={(event) =>
                      atualizarCampo("descricao", event.target.value)
                    }
                    placeholder="Descrição do serviço..."
                    rows={3}
                  />
                </label>

                <label className="campo">
                  <span>Duração (minutos) *</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formulario.duracao_minutos}
                    onChange={(event) =>
                      atualizarCampo(
                        "duracao_minutos",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="campo">
                  <span>Valor</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formulario.valor}
                    onChange={(event) =>
                      atualizarCampo("valor", event.target.value)
                    }
                    placeholder="Ex.: 150,00"
                  />
                </label>

                <label className="servico-checkbox campo-full">
                  <input
                    type="checkbox"
                    checked={formulario.ativo}
                    onChange={(event) =>
                      atualizarCampo("ativo", event.target.checked)
                    }
                  />
                  <span>
                    <strong>Serviço ativo</strong>
                    <small>
                      Serviços ativos ficam disponíveis para utilização no
                      sistema.
                    </small>
                  </span>
                </label>
              </div>

              <div className="servicos-modal-footer">
                <button
                  type="button"
                  className="servicos-button secondary"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="servicos-button primary"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : editandoId
                    ? "Salvar alterações"
                    : "Cadastrar serviço"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
