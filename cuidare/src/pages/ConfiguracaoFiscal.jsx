import { useEffect, useState } from "react";
import "./ConfiguracaoFiscal.css";
import { API_URL } from "../config";


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
  porte_empresa: "",
  natureza_juridica: "",
  enquadramento_tributario: "",
  optante_simples_nacional: false,
  anexo_simples: "",
  faixa_simples: "",
  aliquota_nominal_simples: "",
  aliquota_efetiva_simples: "",
  iss_retido: false,
  irrf_aliquota: "",
  pis_aliquota: "",
  cofins_aliquota: "",
  csll_aliquota: "",
  inss_aliquota: "",
  ibs_aliquota: "",
  cbs_aliquota: "",
  serie_nfse: "",
  ultimo_numero_nfse: 0,
  tipo_emissao_nfse: "",
  integracao_nfse_ativa: false,
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

  const [logo, setLogo] = useState(null);
  const [logoCarregando, setLogoCarregando] = useState(true);
  const [logoEnviando, setLogoEnviando] = useState(false);
  const [logoRemovendo, setLogoRemovendo] = useState(false);
  const [logoMensagem, setLogoMensagem] = useState("");
  const [logoErro, setLogoErro] = useState("");
  const [logoVersao, setLogoVersao] = useState(Date.now());

  useEffect(() => {
    carregarConfiguracao();
    carregarIdentidadeVisual();
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
          porte_empresa:
            configuracao.porte_empresa || "",
          natureza_juridica:
            configuracao.natureza_juridica || "",
          enquadramento_tributario:
            configuracao.enquadramento_tributario || "",
          optante_simples_nacional:
            configuracao.optante_simples_nacional || false,
          anexo_simples:
            configuracao.anexo_simples || "",
          faixa_simples:
            configuracao.faixa_simples || "",
          aliquota_nominal_simples:
            configuracao.aliquota_nominal_simples || "",
          aliquota_efetiva_simples:
            configuracao.aliquota_efetiva_simples || "",
          iss_retido:
            configuracao.iss_retido || false,
          irrf_aliquota:
            configuracao.irrf_aliquota || "",
          pis_aliquota:
            configuracao.pis_aliquota || "",
          cofins_aliquota:
            configuracao.cofins_aliquota || "",
          csll_aliquota:
            configuracao.csll_aliquota || "",
          inss_aliquota:
            configuracao.inss_aliquota || "",
          ibs_aliquota:
            configuracao.ibs_aliquota || "",
          cbs_aliquota:
            configuracao.cbs_aliquota || "",
          serie_nfse:
            configuracao.serie_nfse || "",
          ultimo_numero_nfse:
            configuracao.ultimo_numero_nfse || 0,
          tipo_emissao_nfse:
            configuracao.tipo_emissao_nfse || "",
          integracao_nfse_ativa:
            configuracao.integracao_nfse_ativa || false,
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

  async function carregarIdentidadeVisual() {
    try {
      setLogoCarregando(true);
      setLogoErro("");

      const resposta = await fetch(
        `${API_URL}/configuracoes/identidade`
      );

      if (!resposta.ok) {
        throw new Error(
          "Não foi possível carregar a identidade visual."
        );
      }

      const dados = await resposta.json();

      if (dados.logo_nome && dados.logo_url) {
        setLogo(dados);
      } else {
        setLogo(null);
      }
    } catch (error) {
      setLogoErro(error.message);
    } finally {
      setLogoCarregando(false);
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

  async function enviarLogo(event) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    setLogoMensagem("");
    setLogoErro("");

    const extensoesPermitidas = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!extensoesPermitidas.includes(arquivo.type)) {
      setLogoErro(
        "Formato inválido. Escolha uma imagem PNG, JPG, JPEG ou WEBP."
      );
      event.target.value = "";
      return;
    }

    const limite = 5 * 1024 * 1024;

    if (arquivo.size > limite) {
      setLogoErro(
        "A logo deve ter no máximo 5 MB."
      );
      event.target.value = "";
      return;
    }

    try {
      setLogoEnviando(true);

      const dados = new FormData();
      dados.append("arquivo", arquivo);

      const resposta = await fetch(
        `${API_URL}/configuracoes/identidade/logo`,
        {
          method: "POST",
          body: dados,
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.detail ||
            "Não foi possível enviar a logo."
        );
      }

      setLogo(resultado);
      setLogoVersao(Date.now());

      setLogoMensagem(
        "Logo da Cuidare atualizada com sucesso."
      );
    } catch (error) {
      setLogoErro(error.message);
    } finally {
      setLogoEnviando(false);
      event.target.value = "";
    }
  }

  async function removerLogo() {
    const confirmar = window.confirm(
      "Deseja realmente remover a logo da Cuidare?"
    );

    if (!confirmar) {
      return;
    }

    try {
      setLogoRemovendo(true);
      setLogoMensagem("");
      setLogoErro("");

      const resposta = await fetch(
        `${API_URL}/configuracoes/identidade/logo`,
        {
          method: "DELETE",
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.detail ||
            "Não foi possível remover a logo."
        );
      }

      setLogo(null);
      setLogoVersao(Date.now());

      setLogoMensagem(
        "Logo removida com sucesso."
      );
    } catch (error) {
      setLogoErro(error.message);
    } finally {
      setLogoRemovendo(false);
    }
  }

  function obterLogoUrl() {
    if (!logo?.logo_url) {
      return "";
    }

    return `${API_URL}${logo.logo_url}?v=${logoVersao}`;
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
              <h3>Tributação e enquadramento</h3>
              <p>Parâmetros tributários da empresa.</p>
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
                <option value="">Selecione</option>
                <option value="Simples Nacional">Simples Nacional</option>
                <option value="Lucro Presumido">Lucro Presumido</option>
                <option value="Lucro Real">Lucro Real</option>
              </select>
            </label>

            <label>
              Porte da empresa
              <select
                name="porte_empresa"
                value={formulario.porte_empresa}
                onChange={alterarCampo}
              >
                <option value="">Selecione</option>
                <option value="MEI">MEI</option>
                <option value="ME">Microempresa (ME)</option>
                <option value="EPP">Empresa de Pequeno Porte (EPP)</option>
                <option value="Demais">Demais empresas</option>
              </select>
            </label>

            <label>
              Natureza jurídica
              <input
                name="natureza_juridica"
                value={formulario.natureza_juridica}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Enquadramento tributário
              <input
                name="enquadramento_tributario"
                value={formulario.enquadramento_tributario}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Código do serviço
              <input
                name="codigo_servico"
                value={formulario.codigo_servico}
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

            <label className="field-wide">
              Descrição do serviço
              <input
                name="descricao_servico"
                value={formulario.descricao_servico}
                onChange={alterarCampo}
              />
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                name="optante_simples_nacional"
                checked={formulario.optante_simples_nacional}
                onChange={alterarCampo}
              />
              Optante pelo Simples Nacional
            </label>

            <label>
              Anexo do Simples
              <input
                name="anexo_simples"
                value={formulario.anexo_simples}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Faixa do Simples
              <input
                name="faixa_simples"
                value={formulario.faixa_simples}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Alíquota nominal (%)
              <input
                name="aliquota_nominal_simples"
                value={formulario.aliquota_nominal_simples}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Alíquota efetiva (%)
              <input
                name="aliquota_efetiva_simples"
                value={formulario.aliquota_efetiva_simples}
                onChange={alterarCampo}
              />
            </label>
          </div>
        </section>

        <section className="config-card">
          <div className="config-card-title">
            <span>04</span>

            <div>
              <h3>Retenções e tributos</h3>
              <p>Impostos e retenções aplicáveis à empresa.</p>
            </div>
          </div>

          <div className="config-grid">
            <label className="checkbox-field">
              <input
                type="checkbox"
                name="iss_retido"
                checked={formulario.iss_retido}
                onChange={alterarCampo}
              />
              ISS retido
            </label>

            <label>
              IRRF (%)
              <input
                name="irrf_aliquota"
                value={formulario.irrf_aliquota}
                onChange={alterarCampo}
              />
            </label>

            <label>
              PIS (%)
              <input
                name="pis_aliquota"
                value={formulario.pis_aliquota}
                onChange={alterarCampo}
              />
            </label>

            <label>
              COFINS (%)
              <input
                name="cofins_aliquota"
                value={formulario.cofins_aliquota}
                onChange={alterarCampo}
              />
            </label>

            <label>
              CSLL (%)
              <input
                name="csll_aliquota"
                value={formulario.csll_aliquota}
                onChange={alterarCampo}
              />
            </label>

            <label>
              INSS (%)
              <input
                name="inss_aliquota"
                value={formulario.inss_aliquota}
                onChange={alterarCampo}
              />
            </label>
          </div>
        </section>

        <section className="config-card">
          <div className="config-card-title">
            <span>05</span>

            <div>
              <h3>IBS e CBS</h3>
              <p>Campos preparados para a transição tributária.</p>
            </div>
          </div>

          <div className="config-grid">
            <label>
              IBS (%)
              <input
                name="ibs_aliquota"
                value={formulario.ibs_aliquota}
                onChange={alterarCampo}
                placeholder="Conforme orientação contábil"
              />
            </label>

            <label>
              CBS (%)
              <input
                name="cbs_aliquota"
                value={formulario.cbs_aliquota}
                onChange={alterarCampo}
                placeholder="Conforme orientação contábil"
              />
            </label>
          </div>
        </section>

        <section className="config-card">
          <div className="config-card-title">
            <span>06</span>

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
                <option value="homologacao">Homologação</option>
                <option value="producao">Produção</option>
              </select>
            </label>

            <label>
              Tipo de emissão
              <select
                name="tipo_emissao_nfse"
                value={formulario.tipo_emissao_nfse}
                onChange={alterarCampo}
              >
                <option value="">Selecione</option>
                <option value="NFS-e Nacional">NFS-e Nacional</option>
                <option value="Provedor municipal">Provedor municipal</option>
              </select>
            </label>

            <label>
              Provedor NFS-e
              <input
                name="provedor_nfse"
                value={formulario.provedor_nfse}
                onChange={alterarCampo}
                placeholder="Ex.: provedor municipal"
              />
            </label>

            <label>
              Série da NFS-e
              <input
                name="serie_nfse"
                value={formulario.serie_nfse}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Último número utilizado
              <input
                name="ultimo_numero_nfse"
                type="number"
                min="0"
                value={formulario.ultimo_numero_nfse}
                onChange={alterarCampo}
              />
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                name="integracao_nfse_ativa"
                checked={formulario.integracao_nfse_ativa}
                onChange={alterarCampo}
              />
              Integração NFS-e configurada
            </label>
          </div>
        </section>

        <section className="config-card">
          <div className="config-card-title">
            <span>07</span>

            <div>
              <h3>Observações fiscais</h3>
              <p>Informações complementares da configuração.</p>
            </div>
          </div>

          <textarea
            className="config-observacoes"
            name="observacoes"
            rows="4"
            value={formulario.observacoes}
            onChange={alterarCampo}
            placeholder="Orientações do contador, regras específicas e observações tributárias..."
          />
        </section>

<section className="config-card identidade-visual-card">
          <div className="config-card-title">
            <span>08</span>

            <div>
              <h3>Identidade visual</h3>
              <p>
                Personalize o Cuidare com a logo da sua clínica.
              </p>
            </div>
          </div>

          <div className="identidade-visual-content">
            <div className="identidade-logo-preview">
              {logoCarregando ? (
                <span>Carregando...</span>
              ) : logo?.logo_url ? (
                <img
                  src={obterLogoUrl()}
                  alt="Logo da Cuidare"
                />
              ) : (
                <div className="identidade-logo-vazia">
                  <strong>C</strong>
                  <span>Sem logo cadastrada</span>
                </div>
              )}
            </div>

            <div className="identidade-logo-info">
              <strong>Logo da Cuidare</strong>

              <p>
                Essa logo será utilizada na identidade visual
                do sistema, incluindo o menu lateral e o
                painel principal.
              </p>

              <p className="identidade-formatos">
                Formatos aceitos: PNG, JPG, JPEG e WEBP.
                Tamanho máximo: 5 MB.
              </p>

              <div className="identidade-logo-actions">
                <label className="config-save-button identidade-upload-button">
                  {logoEnviando
                    ? "Enviando..."
                    : logo
                    ? "Substituir logo"
                    : "Escolher logo"}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={enviarLogo}
                    disabled={logoEnviando}
                    hidden
                  />
                </label>

                {logo && (
                  <button
                    type="button"
                    className="config-cancel-button"
                    onClick={removerLogo}
                    disabled={logoRemovendo}
                  >
                    {logoRemovendo
                      ? "Removendo..."
                      : "Remover logo"}
                  </button>
                )}
              </div>

              {logoMensagem && (
                <div className="config-success identidade-mensagem">
                  {logoMensagem}
                </div>
              )}

              {logoErro && (
                <div className="config-error identidade-mensagem">
                  {logoErro}
                </div>
              )}
            </div>
          </div>
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
