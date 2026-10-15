import { useEffect, useState } from "react";
import { API_URL } from "../config";
import { useErro } from "./avisos";
import "./AvaliacoesFisioterapeuticas.css";

const DESCRITORES_DOR = [
  { valor: "pontada", nome: "Pontada", ajuda: "Fisgada ou dor aguda" },
  { valor: "queimacao", nome: "Queimação", ajuda: "Ardência ou calor" },
  { valor: "latejante", nome: "Latejante", ajuda: "Sensação pulsátil" },
  { valor: "pressao_aperto", nome: "Pressão ou aperto", ajuda: "Compressão ou peso" },
  { valor: "choque_eletrico", nome: "Choque elétrico", ajuda: "Sensação de descarga" },
  { valor: "profunda_surda", nome: "Profunda ou surda", ajuda: "Incômodo profundo e pouco localizado" },
];

const SECOES = [
  {
    chave: "anamnese",
    titulo: "Anamnese",
    campos: [
      ["queixa_principal", "Queixa principal"],
      ["historia_doenca_atual", "História da doença atual"],
      ["historico_lesao", "Histórico da lesão", "Como ocorreu, quando começou, evolução, recidivas e tratamentos anteriores"],
      ["antecedentes", "Antecedentes e comorbidades"],
      ["cirurgias", "Cirurgias ou internações"],
      ["medicacoes", "Medicamentos em uso"],
      ["limitacoes_funcionais", "Limitações funcionais"],
    ],
  },
  {
    chave: "dor",
    titulo: "Avaliação da dor",
    campos: [
      ["intensidade_dor", "Intensidade (escala de 0 a 10)", "", "numero"],
      ["caracteristica_dor", "Característica predominante da dor", "", "dor"],
      ["localizacao_dor", "Localização da dor"],
      ["frequencia_dor", "Frequência e duração da dor"],
      ["irradiacao_dor", "Irradiação"],
      ["fatores_agravantes", "Fatores que pioram a dor"],
      ["fatores_alivio", "Fatores que aliviam a dor"],
      ["observacoes_dor", "Descrição complementar / outras características"],
    ],
  },
  {
    chave: "fisico",
    titulo: "Exame físico",
    campos: [
      ["pressao_arterial", "Pressão arterial (mmHg)", "Exemplo: 120/80", "texto"],
      ["frequencia_cardiaca", "Frequência cardíaca (bpm)", "", "numero"],
      ["avaliacao_estatica", "Avaliação estática", "Postura, alinhamento, assimetrias e observações em repouso"],
      ["avaliacao_dinamica", "Avaliação dinâmica", "Movimentos funcionais, marcha, compensações e controle motor"],
      ["avaliacao_postural", "Observações posturais complementares"],
      ["forca_muscular", "Força muscular"],
      ["amplitude_movimento", "Amplitude de movimento"],
      ["goniometria", "Goniometria"],
      ["testes_especiais", "Testes especiais e resultados"],
    ],
  },
  {
    chave: "plano",
    titulo: "Plano terapêutico",
    campos: [
      ["diagnostico_fisioterapeutico", "Diagnóstico fisioterapêutico"],
      ["objetivos_terapeuticos", "Objetivos terapêuticos"],
      ["condutas", "Condutas planejadas"],
      ["plano_tratamento", "Plano e frequência de tratamento"],
    ],
  },
];

const MODELO_VAZIO = Object.fromEntries(
  SECOES.flatMap(({ campos }) =>
    campos.map(([chave, , , tipo]) => [
      chave,
      tipo === "numero" || tipo === "dor" ? null : "",
    ])
  )
);

function formatarRegistro(data) {
  if (!data) return "Sem data";
  const date = new Date(data.endsWith("Z") ? data : data + "Z");
  return Number.isNaN(date.getTime())
    ? "Sem data"
    : date.toLocaleString("pt-BR");
}

function preenchido(dados) {
  return Object.values(dados).some(
    (valor) =>
      valor !== null &&
      valor !== undefined &&
      (typeof valor !== "string" || valor.trim() !== "")
  );
}

export default function AvaliacoesFisioterapeuticas({ prontuarioId }) {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [formulario, setFormulario] = useState({ ...MODELO_VAZIO });
  const [tipo, setTipo] = useState("inicial");
  const [aba, setAba] = useState("anamnese");
  const [selecionada, setSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useErro();

  useEffect(() => {
    if (!prontuarioId) {
      setAvaliacoes([]);
      setSelecionada(null);
      setFormulario({ ...MODELO_VAZIO });
      return;
    }
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        const resposta = await fetch(
          `${API_URL}/prontuarios/${prontuarioId}/avaliacoes`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("cuidare_token") || ""}` } }
        );
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.detail || "Não foi possível carregar as avaliações.");
        if (!ativo) return;
        const itens = Array.isArray(dados) ? dados : [];
        setAvaliacoes(itens);
        setSelecionada(itens[0] || null);
        setTipo(itens.some((x) => x.tipo === "inicial") ? "reavaliacao" : "inicial");
        setFormulario({ ...MODELO_VAZIO });
        setAba("anamnese");
      } catch (e) {
        if (ativo) setErro(e.message || "Não foi possível carregar as avaliações.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [prontuarioId, setErro]);

  const emConsulta = Boolean(selecionada);
  const exibido = emConsulta
    ? { ...MODELO_VAZIO, ...(selecionada.formulario || {}) }
    : formulario;

  function novaAvaliacao() {
    if (!emConsulta && preenchido(formulario) &&
        !window.confirm("Iniciar outra avaliação? Os dados ainda não salvos serão descartados.")) {
      return;
    }
    setFormulario({ ...MODELO_VAZIO });
    setTipo(avaliacoes.some((x) => x.tipo === "inicial") ? "reavaliacao" : "inicial");
    setSelecionada(null);
    setAba("anamnese");
    setErro("");
  }

  function selecionarHistorico(registro) {
    if (!emConsulta && preenchido(formulario) &&
        !window.confirm("Visualizar registro anterior? A avaliação não salva será descartada.")) {
      return;
    }
    setSelecionada(registro);
    setAba("anamnese");
    setErro("");
  }

  function atualizarCampo(campo, valor) {
    if (emConsulta) return;
    setFormulario((antes) => ({ ...antes, [campo]: valor }));
  }

  async function salvarAvaliacao(evento) {
    evento.preventDefault();
    if (!prontuarioId || emConsulta || salvando) return;
    if (!preenchido(formulario)) {
      setErro("Preencha ao menos um campo antes de registrar a avaliação.");
      return;
    }
    if (!window.confirm(
      "Confirmar registro clínico? Esta avaliação será preservada no histórico e não poderá ser editada nesta versão."
    )) return;

    setSalvando(true);
    setErro("");
    try {
      const resposta = await fetch(
        `${API_URL}/prontuarios/${prontuarioId}/avaliacoes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("cuidare_token") || ""}`,
          },
          body: JSON.stringify({ tipo, formulario }),
        }
      );
      const dados = await resposta.json();
      if (!resposta.ok) {
        throw new Error(
          typeof dados.detail === "string"
            ? dados.detail
            : "Não foi possível registrar a avaliação."
        );
      }
      setAvaliacoes((atuais) => [dados, ...atuais]);
      setSelecionada(dados);
      setFormulario({ ...MODELO_VAZIO });
    } catch (e) {
      setErro(e.message || "Não foi possível registrar a avaliação.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="avaliacoes-fisio" aria-labelledby="avaliacoes-fisio-titulo">
      <div className="avaliacoes-fisio-topo">
        <div>
          <span className="avaliacoes-fisio-sobretitulo">AVALIAÇÕES CLÍNICAS</span>
          <h3 id="avaliacoes-fisio-titulo">Avaliação fisioterapêutica</h3>
          <p>Anamnese, avaliação da dor, exame físico e plano terapêutico. Cada registro permanece no histórico.</p>
        </div>
        {prontuarioId && (
          <button type="button" className="avaliacoes-fisio-nova"
            onClick={novaAvaliacao} disabled={carregando || salvando}>
            + Nova avaliação
          </button>
        )}
      </div>

      {!prontuarioId ? (
        <div className="avaliacoes-fisio-aviso">
          Salve o prontuário acima para habilitar a ficha de avaliação.
        </div>
      ) : carregando ? (
        <div className="avaliacoes-fisio-aviso">Carregando avaliações...</div>
      ) : (
        <>
          {avaliacoes.length > 0 && (
            <div className="avaliacoes-fisio-historico">
              <strong>Histórico de avaliações</strong>
              <div className="avaliacoes-fisio-registros">
                {avaliacoes.map((item) => (
                  <button type="button" key={item.id}
                    className={`avaliacoes-fisio-registro ${selecionada?.id === item.id ? "ativo" : ""}`}
                    onClick={() => selecionarHistorico(item)}>
                    <span>{item.tipo === "inicial" ? "Avaliação inicial" : "Reavaliação"}</span>
                    <small>{formatarRegistro(item.criado_em)} · {item.profissional_nome}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {erro && <div className="avaliacoes-fisio-erro" role="alert">{erro}</div>}

          <form onSubmit={salvarAvaliacao}>
            <div className="avaliacoes-fisio-contexto">
              <div className="avaliacoes-fisio-campo">
                <label htmlFor="avaliacao-tipo">Tipo de avaliação</label>
                <select id="avaliacao-tipo" value={emConsulta ? selecionada.tipo : tipo}
                  disabled={emConsulta || salvando}
                  onChange={(e) => setTipo(e.target.value)}>
                  <option value="inicial">Avaliação inicial</option>
                  <option value="reavaliacao">Reavaliação</option>
                </select>
              </div>
              {emConsulta ? (
                <div className="avaliacoes-fisio-registrado">
                  <strong>Registro definitivo #{selecionada.id}</strong>
                  <span>{formatarRegistro(selecionada.criado_em)} · {selecionada.profissional_nome}</span>
                </div>
              ) : (
                <p className="avaliacoes-fisio-rascunho">
                  Preencha a ficha e confira os dados antes de registrar.
                  O conteúdo ainda não está salvo.
                </p>
              )}
            </div>

            <div className="avaliacoes-fisio-abas" role="tablist" aria-label="Seções da avaliação">
              {SECOES.map((secao) => (
                <button key={secao.chave} type="button" role="tab"
                  aria-selected={aba === secao.chave}
                  className={aba === secao.chave ? "ativo" : ""}
                  onClick={() => setAba(secao.chave)}>
                  {secao.titulo}
                </button>
              ))}
            </div>

            {SECOES.filter((secao) => secao.chave === aba).map((secao) => (
              <div className="avaliacoes-fisio-secao" role="tabpanel" key={secao.chave}>
                <h4>{secao.titulo}</h4>
                {secao.chave === "dor" && (
                  <p className="avaliacoes-fisio-instrucao">
                    Selecione apenas a característica predominante da dor. Registre detalhes adicionais no campo de descrição complementar.
                  </p>
                )}
                <div className="avaliacoes-fisio-campos">
                  {secao.campos.map(([chave, nome, ajuda, tipoCampo]) => (
                    <div className={`avaliacoes-fisio-campo ${tipoCampo === "dor" ? "inteiro" : ""}`}
                      key={chave}>
                      <label htmlFor={`avaliacao-${chave}`}>{nome}</label>
                      {tipoCampo === "dor" ? (
                        <div className="avaliacoes-fisio-opcoes" id={`avaliacao-${chave}`}
                          role="radiogroup" aria-label={nome}>
                          {DESCRITORES_DOR.map((opcao) => (
                            <button key={opcao.valor} type="button"
                              role="radio"
                              aria-checked={exibido[chave] === opcao.valor}
                              disabled={emConsulta || salvando}
                              className={exibido[chave] === opcao.valor ? "selecionado" : ""}
                              onClick={() => atualizarCampo(
                                chave, exibido[chave] === opcao.valor ? null : opcao.valor
                              )}>
                              <strong>{opcao.nome}</strong><small>{opcao.ajuda}</small>
                            </button>
                          ))}
                        </div>
                      ) : tipoCampo === "numero" ? (
                        <input type="number" id={`avaliacao-${chave}`}
                          min={chave === "intensidade_dor" ? 0 : 1}
                          max={chave === "intensidade_dor" ? 10 : 300}
                          step="1"
                          placeholder={chave === "intensidade_dor" ? "0 a 10" : "bpm"}
                          value={exibido[chave] ?? ""}
                          disabled={emConsulta || salvando}
                          onChange={(e) => atualizarCampo(
                            chave, e.target.value === "" ? null : Number(e.target.value)
                          )}/>
                      ) : tipoCampo === "texto" ? (
                        <input type="text" id={`avaliacao-${chave}`}
                          placeholder={ajuda || ""}
                          value={exibido[chave] ?? ""}
                          disabled={emConsulta || salvando}
                          onChange={(e) => atualizarCampo(chave, e.target.value)}/>
                      ) : (
                        <textarea id={`avaliacao-${chave}`}
                          rows={3} placeholder={ajuda || `Descreva: ${nome.toLowerCase()}...`}
                          value={exibido[chave] ?? ""}
                          disabled={emConsulta || salvando}
                          onChange={(e) => atualizarCampo(chave, e.target.value)}/>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="avaliacoes-fisio-rodape">
              <span>
                {emConsulta
                  ? "Registro preservado: novas informações devem ser documentadas em outra avaliação."
                  : "Registro clínico definitivo após confirmação."}
              </span>
              {!emConsulta && (
                <button type="submit" disabled={salvando}>
                  {salvando ? "Registrando..." : "Registrar avaliação"}
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </section>
  );
}
