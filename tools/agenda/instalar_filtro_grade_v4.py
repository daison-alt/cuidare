"""Cuidare - Agenda Inteligente V4.

Quando filtros ou atalhos estao ativos, exibe somente faixas horarias
com atendimentos correspondentes. Nenhuma modificacao no backend nem no banco.
"""
from pathlib import Path

ROOT = Path("/workspaces/cuidare")
AGENDA = ROOT / "cuidare/src/pages/Agenda.jsx"
MARCA_ANTERIOR = "CUIDARE_AGENDA_ATALHOS_V3"
MARCA_NOVA = "CUIDARE_AGENDA_FILTRO_FAIXAS_V4"

if not AGENDA.is_file():
    raise SystemExit("Agenda nao encontrada no Codespaces. Nenhum arquivo alterado.")

texto = AGENDA.read_text(encoding="utf-8")

if MARCA_NOVA in texto:
    print("✅ Filtros de horarios da Agenda V4 ja instalados.")
    raise SystemExit(0)

if MARCA_ANTERIOR not in texto:
    raise SystemExit("Instale os atalhos da Agenda V3 antes desta atualizacao. Nenhum arquivo alterado.")

def trocar(origem, destino):
    global texto
    quantidade = texto.count(origem)
    if quantidade != 1:
        raise SystemExit(
            f"Estrutura nao reconhecida ({quantidade} ocorrencias): "
            f"{origem[:75]!r}. Nenhum arquivo alterado."
        )
    texto = texto.replace(origem, destino, 1)

# Uma faixa horaria so existe durante um filtro se tiver um atendimento visivel.
trocar(
    '''  const faixasAgenda = useMemo(() => {
    const todas = new Set(
      Array.from({ length: 16 }, (_, i) => String(i + 6).padStart(2, "0"))
    );
    agendamentosDoDia.forEach((item) => {''',
    '''  const faixasAgenda = useMemo(() => {
    // CUIDARE_AGENDA_FILTRO_FAIXAS_V4
    const todas = new Set(
      filtrosAtivos
        ? []
        : Array.from({ length: 16 }, (_, i) => String(i + 6).padStart(2, "0"))
    );
    const fonte = filtrosAtivos ? agendamentosVisiveis : agendamentosDoDia;
    fonte.forEach((item) => {''',
)

trocar(
    '''  }, [agendamentosDoDia]);

  function buscarPaciente(id) {''',
    '''  }, [agendamentosDoDia, agendamentosVisiveis, filtrosAtivos]);

  function buscarPaciente(id) {''',
)

# Se o cartao/filtragem nao encontrar nada, nao exibe a grade completa.
trocar(
    '''            <p>Aguarde enquanto buscamos os atendimentos.</p>
          </div>
         ) : (
          <div className="agenda-grade">''',
    '''            <p>Aguarde enquanto buscamos os atendimentos.</p>
          </div>
        ) : filtrosAtivos && agendamentosVisiveis.length === 0 ? (
          <div className="agenda-empty" role="status">
            <strong>Nenhum atendimento nesta seleção.</strong>
            <p>Não há pacientes com esses filtros na data escolhida.</p>
            <button
              type="button"
              className="agenda-primary-button"
              onClick={() => {
                setFiltroStatus("todos");
                setBuscaPaciente("");
                setFiltroModalidade("todos");
              }}
            >
              Mostrar todos os atendimentos
            </button>
          </div>
        ) : (
          <div className="agenda-grade">''',
)

# O contador lateral deve se referir ao resultado filtrado, nao ao resto da agenda.
trocar(
    '''                    <span>{ativos > 0 ? (
                      ativos + (ativos === 1 ? " atendimento" : " atendimentos")
                    ) : "Sem atendimentos ativos"}</span>''',
    '''                    <span>{filtrosAtivos
                      ? (itens.length + (itens.length === 1 ? " resultado" : " resultados"))
                      : ativos > 0
                        ? (ativos + (ativos === 1 ? " atendimento" : " atendimentos"))
                        : "Sem atendimentos ativos"}</span>''',
)

AGENDA.write_text(texto, encoding="utf-8")
print("✅ Agenda Inteligente V4 instalada.")
print("✅ Cartoes mostram apenas horarios e pacientes da situacao selecionada.")
print("✅ Horarios nao correspondentes ficam ocultos durante os filtros.")
print("✅ Sem resultados: mensagem simples e botao Mostrar todos.")
print("✅ Nenhuma alteracao no banco, status, Pilates, presencas ou financeiro.")
print("Agora execute: cd cuidare && npm run build")
