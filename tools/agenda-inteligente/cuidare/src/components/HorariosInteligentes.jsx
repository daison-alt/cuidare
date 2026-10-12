import { useEffect, useState } from "react";
import { API_URL } from "../config";
import "./HorariosInteligentes.css";

const DIAS = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export default function HorariosInteligentes({
  pacienteId, planoId, profissionalId, inicio, fim, selecionados, onChange,
}) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    setDados(null);
    setErro("");
    setMostrarTodos(false);
    if (!pacienteId || !planoId || !profissionalId || !inicio || !fim) {
      return () => { ativo = false; };
    }
    async function carregar() {
      setCarregando(true);
      try {
        const params = new URLSearchParams({
          paciente_id: String(pacienteId),
          plano_id: String(planoId),
          profissional_id: String(profissionalId),
          data_inicio: inicio,
          data_fim: fim,
        });
        const token = localStorage.getItem("cuidare_token");
        const resposta = await fetch(
          API_URL + "/matriculas-inteligentes/opcoes?" + params,
          { headers: token ? { Authorization: "Bearer " + token } : {} }
        );
        const json = await resposta.json();
        if (!resposta.ok) {
          throw new Error(
            typeof json.detail === "string"
              ? json.detail
              : "Não foi possível consultar os horários."
          );
        }
        if (ativo) setDados(json);
      } catch (e) {
        if (ativo) setErro(e.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [pacienteId, planoId, profissionalId, inicio, fim]);

  if (!pacienteId || !planoId || !profissionalId || !inicio || !fim) {
    return (
      <section className="horarios-inteligentes">
        <h3>Horários fixos da matrícula</h3>
        <p>Selecione aluno, plano, fisioterapeuta e período para consultar as vagas.</p>
      </section>
    );
  }

  const frequencia = Number(dados?.frequencia || 0);

  function selecionar(item) {
    const mesma = (h) =>
      h.dia_semana === item.dia_semana && h.hora_inicio === item.hora_inicio;
    if (selecionados.some(mesma)) {
      onChange(selecionados.filter((h) => !mesma(h)));
      return;
    }
    if (
      selecionados.length >= frequencia ||
      selecionados.some((h) => h.dia_semana === item.dia_semana)
    ) return;
    onChange([...selecionados, {
      dia_semana: item.dia_semana, hora_inicio: item.hora_inicio,
    }].sort((a, b) => a.dia_semana - b.dia_semana));
  }

  return (
    <section className="horarios-inteligentes">
      <h3>Horários fixos da matrícula</h3>
      {carregando && <p>Verificando todas as aulas do pacote...</p>}
      {erro && <p role="alert" style={{ color: "#aa3a32" }}>{erro}</p>}
      {dados && (
        <>
          <p>
            Selecione <strong>{frequencia} {frequencia === 1 ? "dia" : "dias"} da semana</strong>.
            As opções foram verificadas para toda a duração do pacote,
            priorizando a ocupação das turmas.
          </p>
          <div className="hi-contador">
            <strong>{selecionados.length} de {frequencia} selecionados</strong>
            {selecionados.length === frequencia
              ? " · Pronto para matricular" : " · Escolha abaixo"}
          </div>
          {(dados.opcoes || []).length === 0 ? (
            <p>Nenhum horário disponível durante todo o plano. Ajuste o período ou fisioterapeuta.</p>
          ) : (
            <>
              <div className="hi-semanas">
                {DIAS.map((dia, indice) => {
                  const opcoes = dados.opcoes.filter((h) => h.dia_semana === indice);
                  if (!opcoes.length) return null;
                  return (
                    <div className="hi-dia" key={dia}>
                      <strong>{dia}</strong>
                      <div className="hi-opcoes">
                        {(mostrarTodos ? opcoes : opcoes.slice(0, 4)).map((item) => {
                          const marcado = selecionados.some(
                            (s) => s.dia_semana === item.dia_semana
                              && s.hora_inicio === item.hora_inicio
                          );
                          const indisponivel = !marcado && (
                            selecionados.length >= frequencia ||
                            selecionados.some((s) => s.dia_semana === item.dia_semana)
                          );
                          const grupo = dados.modalidade === "grupo";
                          const rotulo = grupo && item.ocupacao_media > 0
                            ? "Turma em formação · média " + item.ocupacao_media + "/3"
                            : grupo ? "Nova turma · 3 vagas" : "Atendimento exclusivo";
                          return (
                            <button
                              key={item.hora_inicio}
                              type="button"
                              className={"hi-opcao" + (marcado ? " hi-selecionado" : "")}
                              aria-pressed={marcado}
                              disabled={indisponivel}
                              onClick={() => selecionar(item)}
                            >
                              <span className="hi-hora">
                                {item.hora_inicio}–{item.hora_fim}
                              </span>
                              <small>{rotulo}</small>
                              {marcado && <b>Selecionado ✓</b>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className="hi-mostrar"
                onClick={() => setMostrarTodos((v) => !v)}
              >
                {mostrarTodos ? "Mostrar sugestões principais" : "Mostrar todos os horários disponíveis"}
              </button>
            </>
          )}
          <p className="hi-nota">
            O sistema verifica as vagas novamente na confirmação.
            As aulas ficam agendadas agora, mas só são descontadas após a presença.
          </p>
        </>
      )}
    </section>
  );
}
