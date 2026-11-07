PERFIS_PERMITIDOS = {
    "administrador",
    "fisioterapeuta",
    "secretaria",
    "contabilidade",
    "estagiario",
}


PERMISSOES = {
    "administrador": {
        "*",
    },

    "fisioterapeuta": {
        "pacientes.visualizar",
        "pacientes.criar",
        "pacientes.editar",

        "prontuarios.visualizar",
        "prontuarios.criar",
        "prontuarios.editar",

        "agenda.visualizar",
        "agenda.criar",
        "agenda.editar",

        "cuidare_ia.visualizar",
        "servicos.visualizar",
    },

    "secretaria": {
        "pacientes.visualizar",
        "pacientes.criar",
        "pacientes.editar",

        "agenda.visualizar",
        "agenda.criar",
        "agenda.editar",
        "servicos.visualizar",
        "marketing.visualizar",
        "marketing.criar",

        "financeiro.visualizar",
        "financeiro.receber",
        "contas_receber.visualizar",
        "contas_receber.criar",
        "contas_receber.editar",

        "caixa.visualizar",
        "caixa.abrir",
        "caixa.fechar",
        "caixa.entrada",
        "caixa.saida",
        "caixa.sangria",
        "caixa.suprimento",
        "caixa.conferencia",
    },

    "contabilidade": {
        "gestao_fiscal.visualizar",
        "gestao_fiscal.criar",
        "gestao_fiscal.editar",
        "gestao_fiscal.anexar",
        "gestao_fiscal.exportar",

        "relatorios.fiscais.visualizar",
        "relatorios.fiscais.exportar",
        "servicos.visualizar",
    },

    "estagiario": {
        "pacientes.visualizar",
        "agenda.visualizar",
        "servicos.visualizar",
    },
}


def perfil_valido(perfil: str) -> bool:
    return perfil in PERFIS_PERMITIDOS


def tem_permissao(
    perfil: str,
    permissao: str,
) -> bool:
    permissoes = PERMISSOES.get(perfil, set())

    if "*" in permissoes:
        return True

    return permissao in permissoes
