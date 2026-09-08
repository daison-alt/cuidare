from decimal import Decimal
from pathlib import Path
import tempfile

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db


# ============================================================
# BANCO TEMPORÁRIO
# ============================================================

tmp_dir = tempfile.TemporaryDirectory()
db_path = Path(tmp_dir.name) / "teste_troco.db"

engine = create_engine(
    f"sqlite:///{db_path}",
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


# ============================================================
# FUNÇÕES AUXILIARES
# ============================================================

def criar_movimentacao(
    tipo,
    forma,
    valor,
    numero,
):
    resposta = client.post(
        "/caixa/movimentacoes",
        json={
            "tipo": tipo,
            "categoria": "teste_troco",
            "descricao": (
                f"TESTE TROCO - "
                f"{tipo.upper()} - "
                f"{forma} - "
                f"{numero}"
            ),
            "valor": valor,
            "forma_pagamento": forma,
            "observacoes": (
                "Movimentação criada "
                "automaticamente para teste."
            ),
        },
    )

    if resposta.status_code != 200:
        raise RuntimeError(
            f"Erro ao criar movimentação "
            f"{tipo}/{forma}/{numero}: "
            f"{resposta.status_code} - "
            f"{resposta.text}"
        )

    return resposta.json()


def conferir(condicao, mensagem):
    if not condicao:
        raise AssertionError(mensagem)

    print(f"  [OK] {mensagem}")


# ============================================================
# INÍCIO
# ============================================================

print()
print("=" * 70)
print(" TESTE COMPLETO DO TROCO - CUIDARE")
print("=" * 70)
print()
print(f"Banco temporário: {db_path}")
print()


# ============================================================
# 1. GARANTIR QUE NÃO EXISTE CAIXA ABERTO
# ============================================================

resposta = client.get("/caixa/aberto")

conferir(
    resposta.status_code == 404,
    "Não existe caixa aberto inicialmente.",
)


# ============================================================
# 2. ABRIR CAIXA COM R$ 0,00
# ============================================================

resposta = client.post(
    "/caixa/abrir",
    json={
        "saldo_inicial": 0,
        "usar_troco_anterior": True,
        "observacoes": "Teste automatizado de troco.",
    },
)

conferir(
    resposta.status_code == 200,
    "Caixa de teste aberto com sucesso.",
)

caixa = resposta.json()
caixa_id = caixa["id"]

print(f"  Caixa de teste: #{caixa_id}")
print()


# ============================================================
# 3. CINCO ENTRADAS E CINCO SAÍDAS
#    PARA CADA FORMA DE PAGAMENTO
# ============================================================

formas = [
    "dinheiro",
    "pix",
    "cartao_credito",
    "cartao_debito",
    "transferencia",
]


print("=" * 70)
print(" CRIANDO 50 MOVIMENTAÇÕES")
print("=" * 70)
print()

total_movimentacoes = 0


for forma in formas:

    print(f"Forma de pagamento: {forma}")

    # --------------------------------------------------------
    # DINHEIRO
    #
    # 5 entradas de R$ 300 = R$ 1.500
    # 5 saídas  de R$ 100 = R$   500
    #
    # Resultado líquido = R$ 1.000
    # --------------------------------------------------------

    if forma == "dinheiro":
        valor_entrada = 300
        valor_saida = 100

    # --------------------------------------------------------
    # ELETRÔNICOS
    #
    # 5 entradas de R$ 100 = R$ 500
    # 5 saídas  de R$ 100 = R$ 500
    #
    # Resultado líquido = R$ 0
    # --------------------------------------------------------

    else:
        valor_entrada = 100
        valor_saida = 100

    for numero in range(1, 6):
        criar_movimentacao(
            "entrada",
            forma,
            valor_entrada,
            numero,
        )
        total_movimentacoes += 1

    for numero in range(1, 6):
        criar_movimentacao(
            "saida",
            forma,
            valor_saida,
            numero,
        )
        total_movimentacoes += 1

    print("  [OK] 5 entradas")
    print("  [OK] 5 saídas")
    print()


conferir(
    total_movimentacoes == 50,
    "Foram criadas exatamente 50 movimentações.",
)


# ============================================================
# 4. CONFERIR SALDO ANTES DO FECHAMENTO
# ============================================================

resposta = client.get("/caixa/saldo")

conferir(
    resposta.status_code == 200,
    "Endpoint /caixa/saldo respondeu corretamente.",
)

saldo = resposta.json()

saldo_atual = Decimal(
    str(saldo["saldo_atual"])
)

print()
print(f"  Saldo físico calculado: R$ {saldo_atual:.2f}")

conferir(
    saldo_atual == Decimal("1000.00"),
    "Saldo físico antes do fechamento = R$ 1.000,00.",
)


# ============================================================
# 5. CONFERIR MOVIMENTAÇÕES
# ============================================================

resposta = client.get("/caixa/movimentacoes")

conferir(
    resposta.status_code == 200,
    "Endpoint /caixa/movimentacoes respondeu corretamente.",
)

movimentacoes = resposta.json()

conferir(
    len(movimentacoes) == 50,
    "O caixa possui exatamente 50 movimentações.",
)


# ============================================================
# 6. FECHAR CAIXA
#
# Dinheiro contado: R$ 1.000
# Troco para amanhã: R$ 200
# Retirada: R$ 800
# ============================================================

print()
print("=" * 70)
print(" FECHANDO CAIXA")
print("=" * 70)
print()

resposta = client.post(
    "/caixa/fechar",
    json={
        "saldo_final": 1000,
        "troco_proxima_abertura": 200,
        "observacoes": (
            "Teste automatizado: "
            "R$ 200 de troco e R$ 800 para depósito bancário."
        ),
    },
)

conferir(
    resposta.status_code == 200,
    "Caixa fechado com sucesso.",
)

caixa_fechado = resposta.json()

print(
    f"  Saldo final: "
    f"R$ {Decimal(str(caixa_fechado['saldo_final'])):.2f}"
)

print(
    f"  Troco próxima abertura: "
    f"R$ {Decimal(str(caixa_fechado['troco_proxima_abertura'])):.2f}"
)

print(
    f"  Valor retirado: "
    f"R$ {Decimal(str(caixa_fechado['valor_retirado'])):.2f}"
)

print()


# ============================================================
# 7. VALIDAR TROCO E RETIRADA
# ============================================================

troco = Decimal(
    str(caixa_fechado["troco_proxima_abertura"])
)

retirada = Decimal(
    str(caixa_fechado["valor_retirado"])
)

saldo_final = Decimal(
    str(caixa_fechado["saldo_final"])
)

conferir(
    saldo_final == Decimal("1000.00"),
    "Saldo final registrado = R$ 1.000,00.",
)

conferir(
    troco == Decimal("200.00"),
    "Troco registrado = R$ 200,00.",
)

conferir(
    retirada == Decimal("800.00"),
    "Valor retirado calculado = R$ 800,00.",
)

conferir(
    troco + retirada == saldo_final,
    "Troco + retirada = saldo final.",
)


# ============================================================
# 8. CONFIRMAR QUE TROCO NÃO VIROU MOVIMENTAÇÃO
# ============================================================

# O endpoint /movimentacoes só retorna movimentações
# do caixa aberto. Depois do fechamento deve retornar vazio.

resposta = client.get("/caixa/movimentacoes")

conferir(
    resposta.status_code == 200,
    "Consulta de movimentações após fechamento respondeu.",
)

movimentacoes_pos_fechamento = resposta.json()

conferir(
    len(movimentacoes_pos_fechamento) == 0,
    "Troco NÃO foi registrado como movimentação financeira.",
)


# ============================================================
# 9. CONSULTAR TROCO PARA O PRÓXIMO DIA
# ============================================================

resposta = client.get("/caixa/proximo-troco")

conferir(
    resposta.status_code == 200,
    "Endpoint /caixa/proximo-troco respondeu corretamente.",
)

proximo_troco = resposta.json()

troco_consultado = Decimal(
    str(proximo_troco["troco"])
)

conferir(
    troco_consultado == Decimal("200.00"),
    "Próxima abertura reconhece R$ 200,00 de troco.",
)

conferir(
    proximo_troco["caixa_origem_id"] == caixa_id,
    "Troco está vinculado ao caixa de origem.",
)


# ============================================================
# 10. ABRIR NOVO CAIXA
# ============================================================

print()
print("=" * 70)
print(" ABRINDO O CAIXA DO DIA SEGUINTE")
print("=" * 70)
print()

resposta = client.post(
    "/caixa/abrir",
    json={
        "saldo_inicial": 0,
        "usar_troco_anterior": True,
        "observacoes": "Teste de abertura automática pelo troco.",
    },
)

conferir(
    resposta.status_code == 200,
    "Novo caixa aberto com sucesso.",
)

novo_caixa = resposta.json()

novo_saldo_inicial = Decimal(
    str(novo_caixa["saldo_inicial"])
)

print(
    f"  Novo caixa: #{novo_caixa['id']}"
)

print(
    f"  Saldo inicial automático: "
    f"R$ {novo_saldo_inicial:.2f}"
)

print(
    f"  Caixa origem do troco: "
    f"#{novo_caixa['caixa_origem_troco_id']}"
)

print()


# ============================================================
# 11. VALIDAR ABERTURA AUTOMÁTICA
# ============================================================

conferir(
    novo_saldo_inicial == Decimal("200.00"),
    "Novo caixa iniciou automaticamente com R$ 200,00.",
)

conferir(
    novo_caixa["caixa_origem_troco_id"] == caixa_id,
    "Novo caixa mantém o vínculo com o caixa anterior.",
)


# ============================================================
# 12. CONFIRMAR QUE O TROCO NÃO GEROU MOVIMENTAÇÃO
# ============================================================

resposta = client.get("/caixa/movimentacoes")

conferir(
    resposta.status_code == 200,
    "Movimentações do novo caixa consultadas.",
)

movimentacoes_novo_caixa = resposta.json()

conferir(
    len(movimentacoes_novo_caixa) == 0,
    "Novo caixa iniciou sem criar movimentação financeira de troco.",
)


# ============================================================
# RESULTADO FINAL
# ============================================================

print()
print("=" * 70)
print(" RESULTADO FINAL DO TESTE")
print("=" * 70)
print()

print("  Movimentações criadas:       50")
print("  Entradas:                    25")
print("  Saídas:                      25")
print("  Saldo físico final:          R$ 1.000,00")
print("  Troco próxima abertura:      R$   200,00")
print("  Retirada/depósito bancário:  R$   800,00")
print("  Novo saldo inicial:          R$   200,00")
print()
print("  TROCO COMO MOVIMENTAÇÃO:     NÃO")
print("  VÍNCULO ENTRE CAIXAS:        SIM")
print()
print("=" * 70)
print(" TESTE APROVADO - TROCO FUNCIONANDO")
print("=" * 70)
print()


# ============================================================
# LIMPEZA
# ============================================================

app.dependency_overrides.clear()
engine.dispose()
tmp_dir.cleanup()
