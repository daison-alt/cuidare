"""Instalador Cuidare: conferência financeira somente leitura, sem migração de banco."""
from pathlib import Path

root = Path.cwd()
backend_router = root / "backend/app/routers/conciliacao_financeira.py"
frontend_component = root / "cuidare/src/components/ConciliacaoFinanceira.jsx"
frontend_css = root / "cuidare/src/components/ConciliacaoFinanceira.css"
main = root / "backend/app/main.py"
financeiro = root / "cuidare/src/pages/Financeiro.jsx"
marca = "CUIDARE_CONCILIACAO_LEITURA_V1"

for p in (main, financeiro):
    if not p.is_file():
        raise SystemExit("Arquivo não encontrado: " + str(p))
for p in (backend_router, frontend_component, frontend_css):
    if p.exists():
        raise SystemExit("Arquivo já existe, não vou sobrescrever: " + str(p))
contents = {p: p.read_text() for p in (main, financeiro)}
if any(marca in codigo for codigo in contents.values()):
    raise SystemExit("Instalação detectada no código; nenhum arquivo foi alterado.")

def trocar(path, old, new):
    s = contents[path]
    n = s.count(old)
    if n != 1:
        raise SystemExit(
            "Trecho incompatível em %s (%d ocorrências). Nenhuma alteração. %r"
            % (path.name, n, old[:100])
        )
    contents[path] = s.replace(old, new, 1)


api_source = '''"""Conferência de receitas e Caixa. Apenas consulta, sem escritas no banco."""
from collections import defaultdict
from decimal import Decimal
import re

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auditoria_estorno import AuditoriaEstorno
from app.models.conta_receber import ContaReceber
from app.models.movimentacao_caixa import MovimentacaoCaixa
from app.models.recebimento_conta import RecebimentoConta
from app.models.recebimento_conta_forma import RecebimentoContaForma
from app.security.autorizacao import exigir_permissao


router = APIRouter(prefix="/financeiro", tags=["Conferência Financeira"])


def moeda(valor):
    return Decimal(str(valor or 0)).quantize(Decimal("0.01"))


def alerta(destino, codigo, texto, conta_id=None, recibo_id=None):
    destino.append({
        "codigo": codigo,
        "mensagem": texto,
        "conta_id": conta_id,
        "recibo_id": recibo_id,
    })


@router.get("/conciliacao")
def consultar_conciliacao(
    db: Session = Depends(get_db),
    _=Depends(exigir_permissao("financeiro.visualizar")),
):
    # Leitura apenas; nenhuma tabela ou valor é modificado.
    contas = db.query(ContaReceber).all()
    recibos = db.query(RecebimentoConta).all()
    formas = db.query(RecebimentoContaForma).all()
    movimentos = db.query(MovimentacaoCaixa).filter(
        MovimentacaoCaixa.categoria.in_(
            ("recebimento", "estorno_recebimento")
        )
    ).all()
    auditorias = db.query(AuditoriaEstorno).all()

    contas_por_id = {c.id: c for c in contas}
    recibos_por_id = {r.id: r for r in recibos}
    formas_por_recibo = defaultdict(list)
    for forma in formas:
        formas_por_recibo[forma.recebimento_id].append(forma)

    movimentos_por_id = {m.id: m for m in movimentos}
    entradas_por_recibo = defaultdict(list)
    regex = re.compile(r"Recibo #(\\d+)\\b")

    alertas = []
    observacoes = []
    recibos_por_conta = defaultdict(list)
    total_entradas_recibos = Decimal("0.00")
    total_recibos_ativos = Decimal("0.00")

    # Apenas entradas com referência expressa a recibo.
    # Entradas manuais antigas sem recibo não são presumidas como fraudulentas.
    for m in movimentos:
        if m.categoria != "recebimento":
            continue
        match = regex.search(m.observacoes or "")
        if match:
            id_recibo = int(match.group(1))
            entradas_por_recibo[id_recibo].append(m)
            if id_recibo not in recibos_por_id:
                alerta(
                    alertas,
                    "movimento_sem_recibo",
                    "Movimento #%d aponta para recibo inexistente #%d." %
                    (m.id, id_recibo),
                    recibo_id=id_recibo,
                )

    for recibo in recibos:
        conta = contas_por_id.get(recibo.conta_receber_id)
        recibos_por_conta[recibo.conta_receber_id].append(recibo)
        id_recibo = recibo.id
        total = moeda(recibo.valor_total)
        pagamentos = [
            f for f in formas_por_recibo[id_recibo] if f.ativo
        ]
        entradas = [
            m for m in entradas_por_recibo[id_recibo] if m.ativo
        ]

        total_formas = sum((moeda(f.valor) for f in pagamentos), Decimal("0.00"))
        total_entradas = sum((moeda(m.valor) for m in entradas), Decimal("0.00"))

        if conta is None:
            alerta(
                alertas, "recibo_sem_conta",
                "Recibo #%d não possui conta a receber existente." % id_recibo,
                recibo_id=id_recibo,
            )
        elif not conta.ativo:
            alerta(
                alertas, "conta_desativada_com_recibo",
                "Conta #%d está inativa, mas tem histórico de recibo #%d." %
                (conta.id, id_recibo),
                conta_id=conta.id, recibo_id=id_recibo,
            )

        if total_entradas != total:
            alerta(
                alertas, "recibo_movimento_divergente",
                "Recibo #%d: recebido R$ %.2f e entrada no Caixa R$ %.2f." %
                (id_recibo, total, total_entradas),
                conta_id=recibo.conta_receber_id, recibo_id=id_recibo,
            )
        for entrada in entradas:
            if entrada.tipo != "entrada":
                alerta(
                    alertas, "tipo_movimento_inesperado",
                    "Movimento #%d do recibo #%d não é uma entrada." %
                    (entrada.id, id_recibo),
                    conta_id=recibo.conta_receber_id,
                    recibo_id=id_recibo,
                )

        if recibo.ativo:
            total_recibos_ativos += total
            total_entradas_recibos += total_entradas
            if total_formas != total:
                alerta(
                    alertas, "formas_divergentes",
                    "Recibo #%d: soma dos meios de pagamento R$ %.2f, recibo R$ %.2f." %
                    (id_recibo, total_formas, total),
                    conta_id=recibo.conta_receber_id, recibo_id=id_recibo,
                )
            for forma in pagamentos:
                movimento_forma = sum(
                    (
                        moeda(m.valor) for m in entradas
                        if m.forma_pagamento == forma.forma_pagamento
                    ), Decimal("0.00")
                )
                if movimento_forma != moeda(forma.valor):
                    alerta(
                        alertas, "forma_caixa_divergente",
                        "Recibo #%d: diferença na forma de pagamento %s." %
                        (id_recibo, forma.forma_pagamento),
                        conta_id=recibo.conta_receber_id, recibo_id=id_recibo,
                    )
        else:
            if not any(a.recebimento_id == id_recibo for a in auditorias):
                alerta(
                    observacoes, "estorno_sem_auditoria",
                    "Recibo #%d está inativo sem auditoria de estorno vinculada." %
                    id_recibo,
                    conta_id=recibo.conta_receber_id, recibo_id=id_recibo,
                )
            if pagamentos:
                alerta(
                    alertas, "formas_ativas_em_estorno",
                    "Recibo estornado #%d ainda possui formas de pagamento ativas." %
                    id_recibo,
                    conta_id=recibo.conta_receber_id, recibo_id=id_recibo,
                )

    for auditoria in auditorias:
        estornos_ids = [
            x for x in (auditoria.movimentacoes_estorno_ids or "").split(",")
            if x.strip().isdigit()
        ]
        movimentos_estorno = [
            movimentos_por_id.get(int(x)) for x in estornos_ids
        ]
        if (
            not estornos_ids
            or any(m is None for m in movimentos_estorno)
            or any(
                m.tipo != "saida" or m.categoria != "estorno_recebimento" or not m.ativo
                for m in movimentos_estorno if m is not None
            )
            or sum((moeda(m.valor) for m in movimentos_estorno if m), Decimal(0))
            != moeda(auditoria.valor)
        ):
            alerta(
                alertas, "estorno_caixa_divergente",
                "Estorno auditado #%d não corresponde às saídas do Caixa." %
                auditoria.id,
                recibo_id=auditoria.recebimento_id,
            )

    for conta in contas:
        recibos_conta = recibos_por_conta.get(conta.id, [])
        total_registrado = sum(
            (moeda(r.valor_total) for r in recibos_conta if r.ativo),
            Decimal("0.00"),
        )
        valor_pago = moeda(conta.valor_pago)
        if total_registrado != valor_pago:
            destino = alertas if recibos_conta else observacoes
            alerta(
                destino,
                "saldo_sem_correspondencia" if recibos_conta else "recebimento_legado",
                "Conta #%d: saldo pago R$ %.2f; recibos ativos R$ %.2f.%s" %
                (
                    conta.id, valor_pago, total_registrado,
                    "" if recibos_conta else " Pode ser lançamento antigo sem recibo.",
                ),
                conta_id=conta.id,
            )
        if conta.ativo and conta.status == "pago" and valor_pago < moeda(conta.valor):
            alerta(
                alertas, "status_incorreto",
                "Conta #%d está marcada como paga com saldo em aberto." % conta.id,
                conta_id=conta.id,
            )

    return {
        "somente_leitura": True,
        "resumo": {
            "contas": len(contas),
            "recibos_ativos": sum(1 for r in recibos if r.ativo),
            "recibos_estornados": sum(1 for r in recibos if not r.ativo),
            "total_recibos_ativos": float(total_recibos_ativos),
            "total_entradas_vinculadas": float(total_entradas_recibos),
            "divergencias": len(alertas),
            "observacoes": len(observacoes),
        },
        "divergencias": alertas,
        "observacoes": observacoes,
        "nota": (
            "Conferência interna de registros, não conciliação bancária. "
            "Pix, cartão e depósitos só são confirmados nos extratos externos."
        ),
    }
'''

ui_source = '''import { useEffect, useState } from "react";
import { API_URL } from "../config";
import "./ConciliacaoFinanceira.css";

const MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatar(valor) {
  return MOEDA.format(Number(valor || 0));
}

function ListaItens({ itens, titulo, tipo }) {
  return (
    <section className="conciliacao-grupo">
      <h3>{titulo} ({itens.length})</h3>
      {itens.length === 0 ? (
        <p className="conciliacao-vazio">
          {tipo === "alerta" ? "Nenhuma divergência identificada." : "Nenhuma observação adicional."}
        </p>
      ) : (
        <ul>
          {itens.map((item, i) => (
            <li key={item.codigo + "-" + i}>
              <strong>{item.codigo.replace(/_/g, " ")}</strong>
              <span>{item.mensagem}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ConciliacaoFinanceira({ onFechar }) {
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function conferir() {
    try {
      setCarregando(true);
      setErro("");
      const resposta = await fetch(API_URL + "/financeiro/conciliacao");
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        throw new Error(dados.detail || "Não foi possível conferir os registros.");
      }
      setResultado(await resposta.json());
    } catch (e) {
      setErro(e.message || "Erro ao consultar a conferência.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { conferir(); }, []);

  return (
    <section className="conciliacao-card" aria-label="Conferência de recibos e Caixa">
      <header className="conciliacao-cabecalho">
        <div>
          <span className="conciliacao-marca">CONFERÊNCIA · SOMENTE LEITURA</span>
          <h2>Recibos e Caixa</h2>
          <p>Compare recebimentos, formas de pagamento e entradas registradas no Caixa.</p>
        </div>
        <div className="conciliacao-botoes">
          <button type="button" onClick={conferir} disabled={carregando}>
            {carregando ? "Conferindo..." : "Conferir novamente"}
          </button>
          <button type="button" onClick={onFechar}>Fechar</button>
        </div>
      </header>
      {erro && <p className="conciliacao-erro" role="alert">{erro}</p>}
      {resultado && (
        <>
          <div className="conciliacao-indicadores">
            <div><span>Recibos ativos</span><strong>{resultado.resumo.recibos_ativos}</strong></div>
            <div><span>Total recebido</span><strong>{formatar(resultado.resumo.total_recibos_ativos)}</strong></div>
            <div><span>Entradas conferidas</span><strong>{formatar(resultado.resumo.total_entradas_vinculadas)}</strong></div>
            <div><span>Divergências</span><strong className={resultado.resumo.divergencias ? "conciliacao-vermelho" : "conciliacao-verde"}>{resultado.resumo.divergencias}</strong></div>
          </div>
          <ListaItens itens={resultado.divergencias} titulo="Divergências a verificar" tipo="alerta" />
          <ListaItens itens={resultado.observacoes} titulo="Registros antigos ou observações" tipo="observacao" />
          <p className="conciliacao-nota">{resultado.nota}</p>
        </>
      )}
    </section>
  );
}
'''

css_source = '''/* Painel de conferência: estilos isolados dos demais módulos. */
.conciliacao-card {
  margin: 0 0 24px;
  padding: 24px;
  background: #fff;
  border: 1px solid #d8e6da;
  border-radius: 16px;
  color: #244a37;
}
.conciliacao-cabecalho {
  display: flex; justify-content: space-between; align-items: start;
  flex-wrap: wrap; gap: 20px; margin-bottom: 20px;
}
.conciliacao-cabecalho h2 {
  margin: 4px 0 5px; font-size: 23px; color: #0e4334;
}
.conciliacao-cabecalho p { font-size: 14px; color: #586a5e; }
.conciliacao-marca {
  color: #956c20; font-size: 11px; font-weight: 750;
  letter-spacing: .8px;
}
.conciliacao-botoes { display: flex; gap: 8px; flex-wrap: wrap; }
.conciliacao-botoes button {
  cursor: pointer; border: 1px solid #c8d9ce; background: #f8faf8;
  border-radius: 9px; padding: 10px 13px; font-weight: 650; color: #0e4334;
}
.conciliacao-botoes button:disabled { opacity: .5; cursor: wait; }
.conciliacao-indicadores {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px; margin: 15px 0 24px;
}
.conciliacao-indicadores > div {
  display: flex; flex-direction: column; gap: 9px;
  background: #f5f8f5; border: 1px solid #e2ebe2;
  padding: 16px; border-radius: 12px;
}
.conciliacao-indicadores span { color: #617468; font-size: 12px; }
.conciliacao-indicadores strong { font-size: 20px; overflow-wrap: anywhere; }
.conciliacao-vermelho { color: #b33e36; }
.conciliacao-verde { color: #167349; }
.conciliacao-grupo { margin: 18px 0; }
.conciliacao-grupo h3 { font-size: 16px; margin: 0 0 11px; color: #173e30; }
.conciliacao-grupo ul { margin: 0; padding: 0; list-style: none; }
.conciliacao-grupo li {
  display: flex; flex-direction: column; gap: 4px;
  padding: 10px 12px; margin: 7px 0;
  border: 1px solid #eee1d3; border-radius: 9px; background: #fffaf5;
  color: #614735; font-size: 13px;
}
.conciliacao-grupo li strong { text-transform: uppercase; font-size: 11px; }
.conciliacao-vazio { color: #607666; font-size: 14px; }
.conciliacao-erro { background: #fff1f1; color: #a12b2b; padding: 12px; border-radius: 8px; }
.conciliacao-nota { font-size: 12px; color: #6f776f; padding-top: 12px; border-top: 1px solid #e5ebe5; }
@media (max-width: 880px) {
  .conciliacao-indicadores { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 420px) {
  .conciliacao-indicadores { grid-template-columns: 1fr; }
  .conciliacao-card { padding: 15px; }
}
'''

trocar(
    main,
    'from app.routers.recebimentos_conta import router as recebimentos_conta_router\n',
    'from app.routers.recebimentos_conta import router as recebimentos_conta_router\n'
    'from app.routers.conciliacao_financeira import router as conciliacao_financeira_router  # ' + marca + '\n',
)
trocar(
    main,
    'app.include_router(recebimentos_conta_router)\n',
    'app.include_router(recebimentos_conta_router)\n'
    'app.include_router(conciliacao_financeira_router)\n',
)

trocar(
    financeiro,
    'import "./Financeiro.css";\n',
    'import "./Financeiro.css";\n'
    'import ConciliacaoFinanceira from "../components/ConciliacaoFinanceira";  // ' + marca + '\n',
)
trocar(
    financeiro,
    '  const [aba, setAba] = useState("visao-geral");',
    '  const [aba, setAba] = useState("visao-geral");\n'
    '  const [mostrarConciliacao, setMostrarConciliacao] = useState(false);',
)
trocar(
    financeiro,
    '''          <button
            type="button"
            className="financeiro-refresh-button"
            onClick={carregarContas}
          >''',
    '''          <button
            type="button"
            className="financeiro-secondary-button"
            onClick={() => setMostrarConciliacao((atual) => !atual)}
          >
            {mostrarConciliacao ? "Fechar conferência" : "Conferir Recibos e Caixa"}
          </button>

          <button
            type="button"
            className="financeiro-refresh-button"
            onClick={carregarContas}
          >''',
)
trocar(
    financeiro,
    '''      <section className="financeiro-saldo-card">''',
    '''      {mostrarConciliacao && (
        <ConciliacaoFinanceira onFechar={() => setMostrarConciliacao(false)} />
      )}

      <section className="financeiro-saldo-card">''',
)

for p,s in contents.items():
    if p.suffix == ".py":
        compile(s, str(p), "exec")
compile(api_source, str(backend_router), "exec")

backend_router.parent.mkdir(parents=True, exist_ok=True)
frontend_component.parent.mkdir(parents=True, exist_ok=True)

# Escrever somente quando todas as verificações passam.
backend_router.write_text(api_source)
frontend_component.write_text(ui_source)
frontend_css.write_text(css_source)
for p, codigo in contents.items():
    p.write_text(codigo)

print("✅ Conferência somente leitura instalada.")
print("✅ Confere recibos, formas de pagamento, entradas e estornos do Caixa.")
print("✅ Distingue registros antigos sem recibos de divergências confirmáveis.")
print("✅ Painel acessível pelo botão Conferir Recibos e Caixa no Financeiro.")
print("✅ Nenhuma alteração em valores, lançamentos ou bancos existentes.")
print("Reinicie a API e compile: cd cuidare && npm run build")
