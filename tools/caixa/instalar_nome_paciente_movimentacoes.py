"""Identificacao de paciente/aluno nas entradas do Caixa, inclusive historico.

Somente altera o formato da resposta de consulta. Nao modifica o banco de dados.
"""
from pathlib import Path

raiz = Path.cwd()
rotas = raiz / "backend/app/routers/caixa.py"
schema = raiz / "backend/app/schemas/movimentacao_caixa.py"
pagina = raiz / "cuidare/src/pages/Caixa.jsx"
estilos = raiz / "cuidare/src/pages/Caixa.css"
arquivos = (rotas, schema, pagina, estilos)
marca = "CUIDARE_NOME_PACIENTE_CAIXA_V1"

for arquivo in arquivos:
    if not arquivo.is_file():
        raise SystemExit("Arquivo nao encontrado: " + str(arquivo))
codigo = {p: p.read_text(encoding="utf-8") for p in arquivos}
if all(marca in codigo[p] for p in arquivos):
    print("✅ Identificacao de pacientes no Caixa ja instalada.")
    raise SystemExit(0)
if any(marca in codigo[p] for p in arquivos):
    raise SystemExit("Instalacao parcial detectada. Nenhum arquivo alterado.")


def trocar(caminho, antes, depois):
    atual = codigo[caminho]
    n = atual.count(antes)
    if n != 1:
        raise SystemExit(
            f"Estrutura diferente em {caminho.name}: "
            f"{n} ocorrencias de {antes[:85]!r}. "
            "Nenhum arquivo alterado."
        )
    codigo[caminho] = atual.replace(antes, depois, 1)


trocar(
    schema,
    '    descricao: str\n    valor: Decimal',
    '    descricao: str\n'
    '    paciente_nome: str | None = None  # ' + marca + '\n'
    '    valor: Decimal',
)

trocar(
    rotas,
    "from decimal import Decimal\n",
    "from decimal import Decimal\n"
    "import re  # " + marca + "\n",
)
trocar(
    rotas,
    "from app.models.movimentacao_caixa import MovimentacaoCaixa\n",
    "from app.models.movimentacao_caixa import MovimentacaoCaixa\n"
    "from app.models.conta_receber import ContaReceber\n"
    "from app.models.paciente import Paciente\n",
)

helper = '''
# CUIDARE_NOME_PACIENTE_CAIXA_V1
def listar_movimentacoes_com_pacientes(db: Session, movimentos):
    """Acrescenta nome do paciente SEM gravar nem alterar movimentacoes.

    A relacao ja existe em observacoes: Conta a receber #123 | Recibo #000456.
    Consultamos contas/pacientes em lote para evitar uma busca por movimento.
    Recebimentos antigos sao incluidos; demais movimentacoes mantem nome vazio.
    """
    contas_dos_movimentos = {}
    for movimento in movimentos:
        if movimento.tipo != "entrada" or movimento.categoria != "recebimento":
            continue
        match = re.search(
            r"\\bConta a receber\\s*#\\s*(\\d+)\\b",
            movimento.observacoes or "",
            flags=re.IGNORECASE,
        )
        if match:
            contas_dos_movimentos[movimento.id] = int(match.group(1))

    nomes = {}
    if contas_dos_movimentos:
        ids = set(contas_dos_movimentos.values())
        registros = (
            db.query(ContaReceber.id, Paciente.nome)
            .outerjoin(Paciente, Paciente.id == ContaReceber.paciente_id)
            .filter(ContaReceber.id.in_(ids))
            .all()
        )
        nomes = {
            conta_id: nome
            for conta_id, nome in registros
            if nome
        }

    resultado = []
    for movimento in movimentos:
        dados = MovimentacaoCaixaResposta.model_validate(movimento).model_dump()
        dados["paciente_nome"] = nomes.get(contas_dos_movimentos.get(movimento.id))
        resultado.append(dados)
    return resultado


'''
ancora_helper = '''# ============================================================
# MOVIMENTAÇÕES
# ============================================================

@router.get(
    "/movimentacoes",
'''
trocar(rotas, ancora_helper, helper + ancora_helper)

trocar(
    rotas,
    '''def listar_movimentacoes(
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("caixa.visualizar")),
    caixa = obter_caixa_aberto(db)''',
    '''def listar_movimentacoes(
    db: Session = Depends(get_db),
    usuario=Depends(exigir_permissao("caixa.visualizar")),
):
    caixa = obter_caixa_aberto(db)''',
)

trocar(
    rotas,
    '''    return (
        db.query(MovimentacaoCaixa)
        .filter(
            MovimentacaoCaixa.caixa_id == caixa.id,
            MovimentacaoCaixa.ativo.is_(True),
        )
        .order_by(
            MovimentacaoCaixa.id.desc()
        )
        .all()
    )


@router.post(
    "/movimentacoes",''',
    '''    movimentos = (
        db.query(MovimentacaoCaixa)
        .filter(
            MovimentacaoCaixa.caixa_id == caixa.id,
            MovimentacaoCaixa.ativo.is_(True),
        )
        .order_by(
            MovimentacaoCaixa.id.desc()
        )
        .all()
    )
    return listar_movimentacoes_com_pacientes(db, movimentos)


@router.post(
    "/movimentacoes",''',
)

trocar(
    rotas,
    '''def detalhes_caixa_historico(
    caixa_id: int,
    db: Session = Depends(get_db),
):
    usuario=Depends(exigir_permissao("caixa.visualizar")),
    caixa = (''',
    '''def detalhes_caixa_historico(
    caixa_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(exigir_permissao("caixa.visualizar")),
):
    caixa = (''',
)
trocar(
    rotas,
    '''        "movimentacoes": movimentacoes,
        "conferencia": conferencia,''',
    '''        "movimentacoes": listar_movimentacoes_com_pacientes(db, movimentacoes),
        "conferencia": conferencia,''',
)

# Exibir o nome abaixo da descricao em todos os recebimentos com paciente.
trocar(
    pagina,
    '''                            {item.descricao}
                          </strong>

                          {item.categoria && (''',
    '''                            {item.descricao}
                          </strong>

                          {item.paciente_nome && (
                            <small className="caixa-identificacao-paciente">
                              Paciente: <b>{item.paciente_nome}</b>
                            </small>
                          )}

                          {item.categoria && (''',
)
trocar(
    pagina,
    '''                              <td>{movimento.descricao || "-"}</td>''',
    '''                              <td>
                                <span>{movimento.descricao || "-"}</span>
                                {movimento.paciente_nome && (
                                  <small className="caixa-identificacao-paciente">
                                    Paciente: <b>{movimento.paciente_nome}</b>
                                  </small>
                                )}
                              </td>''',
)
codigo[estilos] += '''
/* CUIDARE_NOME_PACIENTE_CAIXA_V1 */
.caixa-identificacao-paciente {
  display: block;
  margin-top: 6px;
  color: #0e4334;
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.caixa-identificacao-paciente b { font-weight: 750; }
'''

compile(codigo[rotas], str(rotas), "exec")
compile(codigo[schema], str(schema), "exec")

# Gravar somente depois de validar todos os trechos.
for caminho, conteudo in codigo.items():
    caminho.write_text(conteudo, encoding="utf-8")

print("✅ Caixa: nome do paciente/aluno abaixo da descricao do recebimento.")
print("✅ Tambem funciona no historico de caixas fechados.")
print("✅ Entradas antigas identificadas pelo numero da conta vinculada.")
print("✅ Nenhuma movimentacao, pagamento ou valor foi alterado.")
print("✅ Permissao de visualizacao do Caixa reforcada nas consultas.")
print("Reinicie a API e execute: cd cuidare && npm run build")
