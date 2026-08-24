import { useEffect, useState } from "react";
import "./ConfiguracaoFiscal.css";

const API_URL =
  "https://humble-waddle-97x5v4vpg7j73ppxq-8000.app.github.dev";

const formularioInicial = {
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  inscricao_municipal: "",
  inscricao_estadual: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cep: "",
  municipio: "",
  uf: "",
  codigo_municipio: "",
  regime_tributario: "",
  codigo_servico: "",
  descricao_servico: "",
  aliquota_iss: "",
  emissao_nfse_ativa: false,
  ambiente_nfse: "homologacao",
  provedor_nfse: "",
  observacoes: "",
};

function ConfiguracaoFiscal({ onVoltar }) {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [configuracaoId, setConfiguracaoId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarConfiguracao();
  }, []);

  async function carregarConfiguracao() {
    try {
      setCarregando(true);
      setErro("");
      setMensagem("");

      const resposta = await fetch(`${API_URL}/configuracao-fiscal`);

      if (!resposta.ok) {
        throw new Error(
          "Não foi possível carregar a configuração fiscal."
        );
      }

      const dados = await resposta.json();

      if (dados.length > 0) {
        const configuracao = dados.find((item) => item.ativo) || dados[0];

        setConfiguracaoId(configuracao.id);

        setFormulario({
          razao_social: configuracao.razao_social || "",
          nome_fantasia: configuracao.nome_fantasia || "",
          cnpj: configuracao.cnpj || "",
          inscricao_municipal:
            configuracao.inscricao_municipal || "",
          inscricao_estadual:
            configuracao.inscricao_estadual || "",
          endereco: configuracao.endereco || "",
          numero: configuracao.numero || "",
          complemento: configuracao.complemento || "",
          bairro: configuracao.bairro || "",
          cep: configuracao.cep || "",
          municipio: configuracao.municipio || "",
          uf: configuracao.uf || "",
          codigo_municipio:
            configuracao.codigo_municipio || "",
          regime_tributario:
            configuracao.regime_tributario || "",
          codigo_servico:
            configuracao.codigo_servico || "",
          descricao_servico:
            configuracao.descricao_servico || "",
          aliquota_iss:
            configuracao.aliquota_iss || "",
          emissao_nfse_ativa:
            configuracao.emissao_nfse_ativa || false,
          ambiente_nfse:
            configuracao.ambiente_nfse || "homologacao",
          provedor_nfse:
            configuracao.provedor_nfse || "",
          observacoes:
            configuracao.observacoes || "",
        });
      }
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  function alterarCampo(event) {
    const { name, value, type, checked } = event.target;

    setFormulario((atual) => ({
      ...atual,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function salvarConfiguracao(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const metodo = configuracaoId ? "PUT" : "POST";

      const url = configuracaoId
        ? `${API_URL}/configuracao-fiscal/${configuracaoId}`
        : `${API_URL}/configuracao-fiscal`;

      const resposta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formulario),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            "Não foi possível salvar a configuração fiscal."
        );
      }

      setConfiguracaoId(dados.id);

      setMensagem(
        "Configuração fiscal salva com sucesso."
      );
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <section className="config-fiscal-page">
        <div className="config-loading">
          Carregando configuração fiscal...
        </div>
      </section>
    );
  }

  return (
    <section className="config-fiscal-page">
      <div className="config-header">
        <div>
          <span className="config-label">
            CONFIGURAÇÃO FISCAL
          </span>

          <h2>Dados fiscais da Cuidare</h2>

          <p>
            Configure os dados da empresa e os parâmetros
            necessários para a gestão tributária e emissão de
            documentos fiscais.
          </p>
        </div>

        <button
          type="button"
          className="config-back-button"
          onClick={onVoltar}
        >
          Voltar
        </button>
      </div>

      {mensagem && (
        <div className="config-success">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="config-error">
          {erro}
        </div>
      )}

      <form
        className="config-fiscal-form"
        onSubmit={salvarConfiguracao}
      >
        <section className="config-card">
          <div className="config-card-title">
            <span>01</span>

            <div>
              <h3>Dados da empresa</h3>
              <p>Identificação fiscal da Cuidare.</p>
            </div>
          </div>

          <div className="config-grid">
            <label className="field-wide">
              Razão social
              <input
                name="razao_social"
                value={formulario.razao_social}
                onChange={alterarCampo}
                required
              />
            </label>

            <label className="field-wide">
              Nome fantasia
              <input
                name="nome_fantasia"
                value={formulario.nome_fantasia}
                onChange={alterarCampo}
              />
            </label>

            <label>
              CNPJ
              <input
                name="cnpj"
                value={formulario.cnpj}
                onChange={alterarCampo}
                required
              />
            </label>

            <label>
              Inscrição municipal
              <input
                name="inscricao_municipal"
                value={formulario.inscricao_municipal}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Inscrição estadual
              <input
                name="inscricao_estadual"
                value={formulario.inscricao_estadual}
                onChange={alterarCampo}
              />
            </label>
          </div>
        </section>

        <section className="config-card">
          <div className="config-card-title">
            <span>02</span>

            <div>
              <h3>Endereço</h3>
              <p>Localização fiscal da empresa.</p>
            </div>
          </div>

          <div className="config-grid">
            <label className="field-wide">
              Endereço
              <input
                name="endereco"
                value={formulario.endereco}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Número
              <input
                name="numero"
                value={formulario.numero}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Complemento
              <input
                name="complemento"
                value={formulario.complemento}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Bairro
              <input
                name="bairro"
                value={formulario.bairro}
                onChange={alterarCampo}
              />
            </label>

            <label>
              CEP
              <input
                name="cep"
                value={formulario.cep}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Município
              <input
                name="municipio"
                value={formulario.municipio}
                onChange={alterarCampo}
                required
              />
            </label>

            <label>
              UF
              <input
                name="uf"
                maxLength="2"
                value={formulario.uf}
                onChange={alterarCampo}
                required
              />
            </label>

            <label>
              Código do município
              <input
                name="codigo_municipio"
                value={formulario.codigo_municipio}
                onChange={alterarCampo}
              />
            </label>
          </div>
        </section>

        <section className="config-card">
          <div className="config-card-title">
            <span>03</span>

            <div>
              <h3>Tributação</h3>
              <p>Parâmetros utilizados na operação fiscal.</p>
            </div>
          </div>

          <div className="config-grid">
            <label>
              Regime tributário
              <select
                name="regime_tributario"
                value={formulario.regime_tributario}
                onChange={alterarCampo}
              >
                <option value="">
                  Selecione
                </option>
                <option value="Simples Nacional">
                  Simples Nacional
                </option>
                <option value="Lucro Presumido">
                  Lucro Presumido
                </option>
                <option value="Lucro Real">
                  Lucro Real
                </option>
              </select>
            </label>

            <label>
              Código do serviço
              <input
                name="codigo_servico"
                value={formulario.codigo_servico}
                onChange={alterarCampo}
              />
            </label>

            <label className="field-wide">
              Descrição do serviço
              <input
                name="descricao_servico"
                value={formulario.descricao_servico}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Alíquota ISS (%)
              <input
                name="aliquota_iss"
                type="number"
                min="0"
                step="0.01"
                value={formulario.aliquota_iss}
                onChange={alterarCampo}
              />
            </label>
          </div>
        </section>

        <section className="config-card">
          <div className="config-card-title">
            <span>04</span>

            <div>
              <h3>NFS-e</h3>
              <p>Configuração da emissão de nota fiscal de serviço.</p>
            </div>
          </div>

          <div className="nfse-status-box">
            <div>
              <strong>Emissão de NFS-e</strong>

              <p>
                Ative somente quando a integração fiscal
                estiver devidamente configurada.
              </p>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                name="emissao_nfse_ativa"
                checked={formulario.emissao_nfse_ativa}
                onChange={alterarCampo}
              />

              <span></span>
            </label>
          </div>

          <div className="config-grid">
            <label>
              Ambiente
              <select
                name="ambiente_nfse"
                value={formulario.ambiente_nfse}
                onChange={alterarCampo}
              >
                <option value="homologacao">
                  Homologação
                </option>

                <option value="producao">
                  Produção
                </option>
              </select>
            </label>

            <label>
              Provedor NFS-e
              <input
                name="provedor_nfse"
                value={formulario.provedor_nfse}
                onChange={alterarCampo}
                placeholder="Ex.: Betha, IPM..."
              />
            </label>
          </div>
        </section>

        <section className="config-card">
          <div className="config-card-title">
            <span>05</span>

            <div>
              <h3>Observações</h3>
              <p>Informações complementares da configuração.</p>
            </div>
          </div>

          <textarea
            className="config-observacoes"
            name="observacoes"
            rows="4"
            value={formulario.observacoes}
            onChange={alterarCampo}
            placeholder="Digite observações importantes..."
          />
        </section>

        <div className="config-actions">
          <button
            type="button"
            className="config-cancel-button"
            onClick={onVoltar}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="config-save-button"
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : configuracaoId
                ? "Atualizar configuração"
                : "Salvar configuração"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ConfiguracaoFiscal;
