import { useMemo } from "react";
import "./PainelAgendaInteligente.css";

function limparTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function dataLocal(date = new Date()) {
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${mes}-${dia}`;
}

function mudarDia(data, incremento) {
  const [ano, mes, dia] = String(data || "").split("-").map(Number);
  const valor = new Date(ano, mes - 1, dia);
  valor.setDate(valor.getDate() + incremento);
  return dataLocal(valor);
}

export { dataLocal, mudarDia, limparTexto };

export default function PainelAgendaInteligente({
  dia, onDiaMudar, agendamentos, servicos, profissionais,
  busca, onBuscaMudar, status, onStatusMudar,
  modalidade, onModalidadeMudar,
  quantidadeExibida, onAtualizar, carregando,
}) {
  const mapaServicos = useMemo(
    () => new Map(servicos.map((servico) => [String(servico.id), servico])),
    [servicos]
  );
  const mapaProfissionais = useMemo(
    () => new Map(profissionais.map((p) => [String(p.id), p])),
    [profissionais]
  );
  const resumo = useMemo(() => {
    const ativos = agendamentos.filter(
      (a) => a.ativo !== false && !["cancelado", "faltou"].includes(a.status)
    );
    return {
      agendados: ativos.filter((a) => ["agendado", "confirmado"].includes(a.status)).length,
      atendendo: ativos.filter((a) => a.status === "em_atendimento").length,
      concluidos: ativos.filter((a) => a.status === "concluido").length,
      ausencias: agendamentos.filter((a) => a.status === "faltou" && a.ativo !== false).length,
      cancelados: agendamentos.filter((a) => a.status === "cancelado" && a.ativo !== false).length,
    };
  }, [agendamentos]);

  const turmas = useMemo(() => {
    const grupos = new Map();
    for (const a of agendamentos) {
      if (a.ativo === false || ["cancelado", "faltou"].includes(a.status)) continue;
      const servico = mapaServicos.get(String(a.servico_id));
      if (servico?.modalidade_pilates !== "grupo") continue;
      const inicio = String(a.hora_inicio || "").slice(0, 5);
      const fim = String(a.hora_fim || "").slice(0, 5);
      const chave = [a.profissional_id, a.servico_id, inicio, fim].join("|");
      if (!grupos.has(chave)) grupos.set(chave, {
        inicio, fim, ocupadas: 0,
        servico: servico.nome,
        profissional: mapaProfissionais.get(String(a.profissional_id))?.nome || "Profissional",
      });
      grupos.get(chave).ocupadas += 1;
    }
    return [...grupos.values()]
      .filter((item) => item.ocupadas < 3)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
  }, [agendamentos, mapaServicos, mapaProfissionais]);

  return (
    <section className="agenda-inteligente" aria-label="Painel da agenda inteligente">
      <div className="agenda-inteligente-nav">
        <div className="agenda-inteligente-nav-botoes">
          <button type="button" onClick={() => onDiaMudar(mudarDia(dia, -1))}>
            ← Dia anterior
          </button>
          <button type="button" onClick={() => onDiaMudar(dataLocal())}>
            Hoje
          </button>
          <button type="button" onClick={() => onDiaMudar(mudarDia(dia, 1))}>
            Próximo dia →
          </button>
        </div>
        <button type="button" onClick={onAtualizar} disabled={carregando}>
          {carregando ? "Atualizando..." : "↻ Atualizar dados"}
        </button>
      </div>

      <div className="agenda-inteligente-indicadores">
        <div><strong>{resumo.agendados}</strong><span>Agendados / confirmados</span></div>
        <div><strong>{resumo.atendendo}</strong><span>Em atendimento</span></div>
        <div><strong>{resumo.concluidos}</strong><span>Concluídos</span></div>
        <div><strong>{resumo.ausencias}</strong><span>Faltas</span></div>
        <div><strong>{resumo.cancelados}</strong><span>Cancelados</span></div>
      </div>

      <div className="agenda-inteligente-filtros">
        <div>
          <label htmlFor="agenda-busca-paciente">Buscar paciente</label>
          <input id="agenda-busca-paciente" type="search"
            placeholder="Digite o nome do paciente"
            value={busca} onChange={(e) => onBuscaMudar(e.target.value)}/>
        </div>
        <div>
          <label htmlFor="agenda-filtro-status">Situação</label>
          <select id="agenda-filtro-status" value={status}
            onChange={(e) => onStatusMudar(e.target.value)}>
            <option value="todos">Todas</option>
            <option value="agendado">Agendado</option>
            <option value="confirmado">Confirmado</option>
            <option value="em_atendimento">Em atendimento</option>
            <option value="concluido">Concluído</option>
            <option value="faltou">Faltou</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div>
          <label htmlFor="agenda-filtro-modalidade">Modalidade</label>
          <select id="agenda-filtro-modalidade" value={modalidade}
            onChange={(e) => onModalidadeMudar(e.target.value)}>
            <option value="todos">Todas</option>
            <option value="grupo">Pilates em grupo</option>
            <option value="individual">Pilates individual</option>
            <option value="outros">Fisioterapia / outros</option>
          </select>
        </div>
      </div>

      <div className="agenda-inteligente-contagem" aria-live="polite">
        Exibindo <strong>{quantidadeExibida}</strong> de <strong>{agendamentos.length}</strong>
        {" "}agendamentos registrados no dia
        {busca || status !== "todos" || modalidade !== "todos" ? " (com filtros)" : ""}.
      </div>

      <div className="agenda-inteligente-turmas">
        <div className="agenda-inteligente-turmas-titulo">
          <strong>Turmas de Pilates com menos de 3 alunos</strong>
          <small>Ocupação atual dos horários com turmas já formadas</small>
        </div>
        {turmas.length ? (
          <div className="agenda-inteligente-turmas-lista">
            {turmas.map((turma, i) => (
              <div className="agenda-inteligente-turma" key={i}>
                <strong>{turma.inicio}–{turma.fim}</strong>
                <span>{turma.servico} · {turma.profissional}</span>
                <b>{turma.ocupadas}/3</b>
              </div>
            ))}
          </div>
        ) : (
          <p className="agenda-inteligente-sem-turmas">
            Nenhuma turma de Pilates em grupo com ocupação parcial registrada nesta data.
          </p>
        )}
        <p className="agenda-inteligente-nota">
          Contagem informativa, não reserva de vaga. A matrícula precisa validar
          disponibilidade em todas as aulas do pacote no servidor.
        </p>
      </div>
    </section>
  );
}
