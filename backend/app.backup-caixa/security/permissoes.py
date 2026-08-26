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
    },

    "secretaria": {
        "pacientes.visualizar",
        "pacientes.criar",
        "pacientes.editar",

        "agenda.visualizar",
        "agenda.criar",
        "agenda.editar",

        "financeiro.receber",
    },

    "contabilidade": {
        "gestao_fiscal.visualizar",
        "gestao_fiscal.criar",
        "gestao_fiscal.editar",
        "gestao_fiscal.anexar",
        "gestao_fiscal.exportar",

        "relatorios.fiscais.visualizar",
        "relatorios.fiscais.exportar",
    },

    "estagiario": {
        "pacientes.visualizar",
        "agenda.visualizar",
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
