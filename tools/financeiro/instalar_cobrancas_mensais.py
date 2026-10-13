"""Instala cobranças mensais de Pilates no Cuidare sem alterar o Caixa nem cobranças existentes."""
from pathlib import Path

root = Path.cwd()
main = root / "backend/app/main.py"
router = root / "backend/app/routers/matriculas_inteligentes.py"
tela = root / "cuidare/src/pages/AlunosPilates.jsx"
financeiro = root / "cuidare/src/pages/Financeiro.jsx"
model = root / "backend/app/models/parcela_plano_pilates.py"
service = root / "backend/app/services/cobranca_parcelada_pilates.py"

for p in (main, router, tela, financeiro):
    if not p.is_file():
        raise SystemExit(f"Arquivo não encontrado: {p}")
if model.exists() or service.exists():
    raise SystemExit(
        "Arquivos de parcelamento já existem. Instalação interrompida, sem sobrescrever. "
        "Informe o resultado antes de repetir."
    )

parts = {p: p.read_text() for p in (main, router, tela, financeiro)}
marker = "CUIDARE_PARCELAS_PILATES_V1"
if any(marker in code for code in parts.values()):
    raise SystemExit("Parcelamento já detectado. Instalação interrompida.")


def trocar(path, trecho, novo):
    old = parts[path]
    num = old.count(trecho)
    if num != 1:
        raise SystemExit(
            f"Trecho inesperado em {path.name}: {trecho[:100]!r} (ocorrências: {num}). "
            "Nenhum arquivo alterado."
        )
    parts[path] = old.replace(trecho, novo, 1)


model_code = '''from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint

from app.database import Base


class ParcelaPlanoPilates(Base):
    """Uma conta a receber por parcela, sem modificar vínculos antigos."""
    __tablename__ = "parcelas_planos_pilates"

    id = Column(Integer, primary_key=True, index=True)
    aluno_plano_id = Column(
        Integer, ForeignKey("alunos_planos_pilates.id"),
        nullable=False, index=True
    )
    conta_receber_id = Column(
        Integer, ForeignKey("contas_receber.id"),
        nullable=False, unique=True, index=True
    )
    numero_parcela = Column(Integer, nullable=False)
    total_parcelas = Column(Integer, nullable=False)
    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint(
            "aluno_plano_id", "numero_parcela",
            name="uq_parcela_pilates_matricula_numero"
        ),
    )
'''

service_code = '''import calendar
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.cobranca_plano_pilates import CobrancaPlanoPilates
from app.models.conta_receber import ContaReceber
from app.models.parcela_plano_pilates import ParcelaPlanoPilates


def somar_meses(dia: date, meses: int) -> date:
    deslocamento = (dia.month - 1) + meses
    ano = dia.year + deslocamento // 12
    mes = deslocamento % 12 + 1
    ultimo = calendar.monthrange(ano, mes)[1]
    return date(ano, mes, min(dia.day, ultimo))


def criar_cobrancas_parceladas(
    db: Session, contrato, plano, numero_parcelas: int,
) -> list[ContaReceber]:
    """Cria cobranças mensais na MESMA transação da matrícula.

    NÃO registra pagamento nem movimentação no Caixa.
    """
    permitido = {"mensal": 1, "trimestral": 3, "semestral": 6}.get(plano.periodo)
    if permitido is None or numero_parcelas != permitido or numero_parcelas <= 1:
        raise HTTPException(
            status_code=400,
            detail="Parcelamento inválido: trimestral em 3 vezes e semestral em 6 vezes."
        )

    # Uma matrícula nunca pode ter dois conjuntos de cobranças.
    if db.query(CobrancaPlanoPilates.id).filter(
        CobrancaPlanoPilates.aluno_plano_id == contrato.id
    ).first() or db.query(ParcelaPlanoPilates.id).filter(
        ParcelaPlanoPilates.aluno_plano_id == contrato.id
    ).first():
        raise HTTPException(409, "Esta matrícula já possui cobranças geradas.")

    valor = Decimal(str(contrato.valor_contratado))
    if not valor.is_finite() or valor < 0:
        raise HTTPException(400, "Valor contratado inválido.")
    valor = valor.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if valor == 0:
        return []

    centavos = int(valor * 100)
    if centavos < numero_parcelas:
        raise HTTPException(400, "O valor contratado é insuficiente para o parcelamento.")

    quociente, resto = divmod(centavos, numero_parcelas)
    contas = []

    for indice in range(numero_parcelas):
        numero = indice + 1
        parcial = Decimal(quociente + (1 if indice < resto else 0)) / Decimal(100)
        vencimento = somar_meses(contrato.data_inicio, indice)
        conta = ContaReceber(
            paciente_id=contrato.paciente_id,
            agendamento_id=None,
            descricao=(
                f"Pilates - {plano.nome} - Matrícula #{contrato.id} "
                f"- Parcela {numero}/{numero_parcelas}"
            ),
            categoria="Pilates",
            valor=parcial,
            vencimento=vencimento,
            status="pendente",
            valor_pago=Decimal("0.00"),
            data_pagamento=None,
            forma_pagamento=None,
            observacoes=(
                f"Parcela {numero} de {numero_parcelas}; "
                f"matrícula #{contrato.id}; "
                f"vigência {contrato.data_inicio:%d/%m/%Y} "
                f"a {contrato.data_fim:%d/%m/%Y}. "
                "Receba exclusivamente pelo Financeiro com Caixa aberto."
            ),
            ativo=True,
        )
        db.add(conta)
        db.flush()

        db.add(ParcelaPlanoPilates(
            aluno_plano_id=contrato.id,
            conta_receber_id=conta.id,
            numero_parcela=numero,
            total_parcelas=numero_parcelas,
        ))
        contas.append(conta)

    db.flush()
    if sum((Decimal(str(c.valor)) for c in contas), Decimal(0)) != valor:
        raise RuntimeError("O total das parcelas não corresponde ao contrato.")
    return contas
'''

trocar(
    main,
    "from app.models.cobranca_plano_pilates import CobrancaPlanoPilates",
    "from app.models.cobranca_plano_pilates import CobrancaPlanoPilates\n"
    "from app.models.parcela_plano_pilates import ParcelaPlanoPilates  # " + marker
)
trocar(
    router,
    "from app.services.cobranca_pilates import criar_cobranca_plano",
    "from app.services.cobranca_pilates import criar_cobranca_plano\n"
    "from app.services.cobranca_parcelada_pilates import criar_cobrancas_parceladas"
)
trocar(
    router,
    "    horarios_semanais: list[HorarioSemanal] = Field(min_length=1, max_length=2)",
    "    horarios_semanais: list[HorarioSemanal] = Field(min_length=1, max_length=2)\n"
    "    numero_parcelas: int = Field(default=1, ge=1, le=6)  # " + marker
)
trocar(
    router,
    '''        conta = criar_cobranca_plano(db, contrato, plano)
        db.commit()
        return {
            "matricula_id": contrato.id,
            "aulas_agendadas": len(reservas),
            "conta_receber_id": conta.id if conta else None,
        }''',
    '''        if dados.numero_parcelas == 1:
            conta = criar_cobranca_plano(db, contrato, plano)
            contas = [conta] if conta else []
        else:
            contas = criar_cobrancas_parceladas(
                db, contrato, plano, dados.numero_parcelas
            )
        db.commit()
        return {
            "matricula_id": contrato.id,
            "aulas_agendadas": len(reservas),
            "conta_receber_id": contas[0].id if contas else None,
            "contas_receber_ids": [c.id for c in contas],
            "numero_parcelas": len(contas),
        }'''
)

trocar(
    tela,
    '  const [resultadoMatricula, setResultadoMatricula] = useState(null);',
    '  const [resultadoMatricula, setResultadoMatricula] = useState(null);\n'
    '  const [numeroParcelas, setNumeroParcelas] = useState(1);  // ' + marker
)
trocar(
    tela,
    '''    if (name === "plano_id") {
      const plano = planos.find(''',
    '''    if (name === "plano_id") {
      setNumeroParcelas(1);
      const plano = planos.find('''
)
trocar(
    tela,
    '''            horarios_semanais: horarios,
            data_inicio:''',
    '''            horarios_semanais: horarios,
            numero_parcelas: numeroParcelas,
            data_inicio:'''
)
trocar(
    tela,
    '''      setHorarios([]);
      setResultadoMatricula(novaMatricula);''',
    '''      setHorarios([]);
      setNumeroParcelas(1);
      setResultadoMatricula(novaMatricula);'''
)

tela_antes = '''          <HorariosInteligentes
            pacienteId={formulario.paciente_id}'''
tela_depois = '''          {formulario.plano_id && (
            <section className="pilates-opcoes-cobranca"
              style={{
                gridColumn: "1 / -1",
                padding: "18px 20px",
                borderRadius: 14,
                border: "1px solid #dfebe4",
                background: "#f7faf8",
              }}>
              <strong style={{ color: "#0e4334", display: "block", marginBottom: 8 }}>
                Como o aluno vai pagar o plano?
              </strong>
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <input type="radio" name="cobranca_pilates"
                  checked={numeroParcelas === 1}
                  onChange={() => setNumeroParcelas(1)} />
                À vista — uma cobrança pelo valor total
              </label>
              {["trimestral", "semestral"].includes(obterPlanoSelecionado()?.periodo) && (
                <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <input type="radio" name="cobranca_pilates"
                    checked={numeroParcelas === (obterPlanoSelecionado()?.periodo === "trimestral" ? 3 : 6)}
                    onChange={() => setNumeroParcelas(
                      obterPlanoSelecionado()?.periodo === "trimestral" ? 3 : 6
                    )} />
                  Parcelado — {obterPlanoSelecionado()?.periodo === "trimestral" ? 3 : 6} cobranças mensais
                </label>
              )}
              <small style={{ display: "block", color: "#60756a", lineHeight: 1.6 }}>
                {numeroParcelas === 1
                  ? "Vencimento na data de início do plano. O pagamento será registrado depois, no Financeiro."
                  : `Serão criadas ${numeroParcelas} parcelas mensais, totalizando ${formatarValor(formulario.valor_contratado)}. A primeira vence no início do plano. Nenhuma parcela será marcada como paga antes do recebimento.`}
              </small>
            </section>
          )}

          <HorariosInteligentes
            pacienteId={formulario.paciente_id}'''
trocar(tela, tela_antes, tela_depois)

resultado_antes = '''          {resultadoMatricula.conta_receber_id ? (
            <p style={{ marginTop: 8 }}>
              Cobrança #{resultadoMatricula.conta_receber_id} criada como
              pendente no Financeiro. O pagamento será registrado no Caixa ao receber.
            </p>
          ) : (
            <p style={{ marginTop: 8 }}>
              Matrícula sem cobrança (valor contratado zero).
            </p>
          )}'''
resultado_depois = '''          {resultadoMatricula.contas_receber_ids?.length ? (
            <p style={{ marginTop: 8 }}>
              {resultadoMatricula.numero_parcelas > 1
                ? `${resultadoMatricula.numero_parcelas} cobranças mensais geradas: ${resultadoMatricula.contas_receber_ids.map((id) => "#" + id).join(", ")}.`
                : `Cobrança #${resultadoMatricula.conta_receber_id} gerada.`}
              {" "}Todas inicialmente pendentes no Financeiro; o Caixa registra
              o valor somente após o recebimento.
            </p>
          ) : (
            <p style={{ marginTop: 8 }}>
              Matrícula sem cobrança (valor contratado zero).
            </p>
          )}'''
trocar(tela, resultado_antes, resultado_depois)

# Primeira simplificação de navegação: os nomes correspondem às tarefas do dia a dia.
trocar(
    financeiro,
    '''            Contas a Receber
          </span>''',
    '''            Cobranças
          </span>'''
)
trocar(
    financeiro,
    '''            Contas a Pagar
          </span>''',
    '''            Despesas
          </span>'''
)
trocar(financeiro, "            + Novo lançamento", "            + Lançamento manual")

# Validar tudo ANTES de qualquer gravação.
compile(model_code, str(model), "exec")
compile(service_code, str(service), "exec")
for p, text in parts.items():
    if p.suffix == ".py":
        compile(text, str(p), "exec")

model.parent.mkdir(parents=True, exist_ok=True)
service.parent.mkdir(parents=True, exist_ok=True)
model.write_text(model_code)
service.write_text(service_code)
for p, text in parts.items():
    p.write_text(text)

print("✅ Cobrança à vista e parcelas mensais integradas à Agenda Inteligente.")
print("✅ Planos trimestrais: 1x ou 3x; semestrais: 1x ou 6x; mensais: 1x.")
print("✅ Matrícula, aulas e cobranças na mesma transação.")
print("✅ Cobranças anteriores preservadas; parcelas novas em tabela independente.")
print("✅ Caixa e fluxo de recebimentos existentes não foram alterados.")
print("✅ Navegação financeira com nomes mais claros.")
print("PRÓXIMO PASSO: compilar, reiniciar o backend e testar uma nova matrícula de teste.")
