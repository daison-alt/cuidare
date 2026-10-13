"""Cuidare: conecta matrículas de Pilates a cobranças pendentes, mantendo o Caixa existente."""
from pathlib import Path

raiz = Path.cwd()
modelo = raiz / "backend/app/models/cobranca_plano_pilates.py"
servico = raiz / "backend/app/services/cobranca_pilates.py"
main = raiz / "backend/app/main.py"
classico = raiz / "backend/app/routers/alunos_planos_pilates.py"
inteligente = raiz / "backend/app/routers/matriculas_inteligentes.py"
frontend = raiz / "cuidare/src/pages/AlunosPilates.jsx"
marca = "CUIDARE_COBRANCA_PILATES_V1"

for arquivo in (main, classico, inteligente, frontend):
    if not arquivo.is_file():
        raise SystemExit(f"Arquivo necessário não encontrado: {arquivo}")
if modelo.exists() or servico.exists():
    raise SystemExit(
        "Modelo ou serviço de cobrança já existe. "
        "Não sobrescrevi arquivos. Envie esta mensagem para conferirmos."
    )

codigo = {
    main: main.read_text(),
    classico: classico.read_text(),
    inteligente: inteligente.read_text(),
    frontend: frontend.read_text(),
}
if any(marca in texto for texto in codigo.values()):
    raise SystemExit("Instalação anterior identificada. Nenhum arquivo alterado.")


def trocar(arquivo, trecho, novo):
    original = codigo[arquivo]
    if original.count(trecho) != 1:
        raise SystemExit(
            f"Trecho não encontrado ou duplicado em {arquivo.name}: {trecho[:65]!r}. "
            "Nenhum arquivo alterado."
        )
    codigo[arquivo] = original.replace(trecho, novo, 1)


modelo_codigo = '''from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer

from app.database import Base


class CobrancaPlanoPilates(Base):
    """Vínculo imutável: uma cobrança financeira por matrícula de Pilates."""
    __tablename__ = "cobrancas_planos_pilates"

    id = Column(Integer, primary_key=True, index=True)
    aluno_plano_id = Column(
        Integer, ForeignKey("alunos_planos_pilates.id"),
        nullable=False, unique=True, index=True
    )
    conta_receber_id = Column(
        Integer, ForeignKey("contas_receber.id"),
        nullable=False, unique=True, index=True
    )
    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)
'''

servico_codigo = '''from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session

from app.models.cobranca_plano_pilates import CobrancaPlanoPilates
from app.models.conta_receber import ContaReceber


def criar_cobranca_plano(db: Session, contrato, plano):
    """
    Cria a conta pendente do valor contratado.
    Não cria recebimento, movimentação financeira nem exige Caixa aberto.
    Deve ser chamada antes do commit da matrícula.
    """
    existente = (
        db.query(CobrancaPlanoPilates)
        .filter(CobrancaPlanoPilates.aluno_plano_id == contrato.id)
        .first()
    )
    if existente:
        return db.get(ContaReceber, existente.conta_receber_id)

    valor = Decimal(str(contrato.valor_contratado)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    if not valor.is_finite() or valor < 0:
        raise ValueError("Valor contratado de Pilates inválido.")
    if valor == 0:
        # Plano totalmente gratuito/cortesia: nenhuma cobrança monetária.
        return None

    conta = ContaReceber(
        paciente_id=contrato.paciente_id,
        descricao=f"Plano de Pilates - {plano.nome} - Matrícula #{contrato.id}",
        categoria="Pilates",
        valor=valor,
        vencimento=contrato.data_inicio,
        status="pendente",
        valor_pago=Decimal("0.00"),
        forma_pagamento=None,
        data_pagamento=None,
        observacoes=(
            f"Matrícula de Pilates #{contrato.id}. "
            f"Vigência: {contrato.data_inicio:%d/%m/%Y} a "
            f"{contrato.data_fim:%d/%m/%Y}. "
            "Recebimento deve ser registrado pelo Financeiro com Caixa aberto."
        ),
        ativo=True,
    )
    db.add(conta)
    db.flush()

    db.add(CobrancaPlanoPilates(
        aluno_plano_id=contrato.id,
        conta_receber_id=conta.id,
    ))
    db.flush()
    return conta
'''

# A tabela só será criada no início da API pelo create_all existente.
trocar(
    main,
    "from app.models.conta_receber import ContaReceber",
    "from app.models.conta_receber import ContaReceber\n"
    "from app.models.cobranca_plano_pilates import CobrancaPlanoPilates  # " + marca,
)

for arquivo in (classico, inteligente):
    antigo = "from app.models.aluno_plano_pilates import AlunoPlanoPilates"
    novo = antigo + "\nfrom app.services.cobranca_pilates import criar_cobranca_plano  # " + marca
    trocar(arquivo, antigo, novo)

trocar(
    classico,
    "    db.add(registro)\n    db.commit()\n    db.refresh(registro)",
    "    db.add(registro)\n"
    "    db.flush()\n"
    "    criar_cobranca_plano(db, registro, plano)\n"
    "    db.commit()\n"
    "    db.refresh(registro)",
)

trocar(
    inteligente,
    '        db.commit()\n        return {"matricula_id": contrato.id, "aulas_agendadas": len(reservas)}',
    '        conta = criar_cobranca_plano(db, contrato, plano)\n'
    '        db.commit()\n'
    '        return {\n'
    '            "matricula_id": contrato.id,\n'
    '            "aulas_agendadas": len(reservas),\n'
    '            "conta_receber_id": conta.id if conta else None,\n'
    '        }',
)

# Mostrar o número da cobrança após matrícula inteligente.
trecho_front = '''          Matrícula #{resultadoMatricula.matricula_id} criada com sucesso.
          {" "}{resultadoMatricula.aulas_agendadas} aulas já reservadas na Agenda.'''
novo_front = trecho_front + '''
          {resultadoMatricula.conta_receber_id ? (
            <p style={{ marginTop: 8 }}>
              Cobrança #{resultadoMatricula.conta_receber_id} criada como
              pendente no Financeiro. O pagamento será registrado no Caixa ao receber.
            </p>
          ) : (
            <p style={{ marginTop: 8 }}>
              Matrícula sem cobrança (valor contratado zero).
            </p>
          )}'''
trocar(frontend, trecho_front, novo_front)

for arquivo, texto in codigo.items():
    if arquivo.suffix == ".py":
        compile(texto, str(arquivo), "exec")
compile(modelo_codigo, str(modelo), "exec")
compile(servico_codigo, str(servico), "exec")

# Todos os testes de compatibilidade passaram: escrever apenas agora.
modelo.parent.mkdir(parents=True, exist_ok=True)
servico.parent.mkdir(parents=True, exist_ok=True)
modelo.write_text(modelo_codigo)
servico.write_text(servico_codigo)
for arquivo, texto in codigo.items():
    arquivo.write_text(texto)

print("✅ Vínculo financeiro de matrícula instalado.")
print("✅ Cobrança pendente criada no valor contratado, com vencimento no início do plano.")
print("✅ Cobrança e matrícula gravadas na mesma transação.")
print("✅ Uma única cobrança por matrícula (vínculo exclusivo no banco).")
print("✅ Nenhum lançamento no Caixa antes do recebimento.")
print("✅ Matrículas e pagamentos anteriores preservados.")
print("Próximo passo: compilar e reiniciar a API.")
