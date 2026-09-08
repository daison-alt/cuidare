from io import BytesIO
from pathlib import Path
from decimal import Decimal

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import (
    Paragraph,
    Table,
    TableStyle,
)
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


FORMAS_LABEL = {
    "dinheiro": "Dinheiro",
    "pix": "PIX",
    "cartao_credito": "Cartão de crédito",
    "cartao_debito": "Cartão de débito",
    "transferencia": "Transferência",
    "debito_automatico": "Débito automático",
    "outro": "Outro",
}


def moeda(valor):
    valor = Decimal(str(valor or 0))
    texto = f"{valor:,.2f}"
    texto = texto.replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {texto}"


def data_br(data):
    if not data:
        return ""
    return data.strftime("%d/%m/%Y")


def quebrar_texto(c, texto, fonte, tamanho, largura):
    palavras = str(texto or "").split()

    linhas = []
    atual = ""

    for palavra in palavras:
        teste = palavra if not atual else f"{atual} {palavra}"

        if stringWidth(teste, fonte, tamanho) <= largura:
            atual = teste
        else:
            if atual:
                linhas.append(atual)
            atual = palavra

    if atual:
        linhas.append(atual)

    return linhas


def desenhar_logo(c, caminho, x, y, largura_max, altura_max):
    if not caminho:
        return False

    caminho = Path(caminho)

    if not caminho.exists():
        return False

    try:
        imagem = ImageReader(str(caminho))
        largura, altura = imagem.getSize()

        escala = min(
            largura_max / largura,
            altura_max / altura,
        )

        largura_final = largura * escala
        altura_final = altura * escala

        c.drawImage(
            imagem,
            x + (largura_max - largura_final) / 2,
            y + (altura_max - altura_final) / 2,
            width=largura_final,
            height=altura_final,
            preserveAspectRatio=True,
            mask="auto",
        )

        return True
    except Exception:
        return False


def desenhar_marca_dagua(c, caminho, centro_x, centro_y):
    if not caminho:
        return

    caminho = Path(caminho)

    if not caminho.exists():
        return

    try:
        imagem = ImageReader(str(caminho))
        largura, altura = imagem.getSize()

        tamanho = 75 * mm
        escala = tamanho / max(largura, altura)

        largura_final = largura * escala
        altura_final = altura * escala

        if hasattr(c, "setFillAlpha"):
            c.saveState()
            c.setFillAlpha(0.07)

        c.drawImage(
            imagem,
            centro_x - largura_final / 2,
            centro_y - altura_final / 2,
            width=largura_final,
            height=altura_final,
            preserveAspectRatio=True,
            mask="auto",
        )

        if hasattr(c, "setFillAlpha"):
            c.restoreState()

    except Exception:
        pass


def desenhar_cabecalho(
    c,
    dados,
    y_topo,
    altura,
):
    esquerda = 18 * mm
    direita = 18 * mm
    largura = A4[0] - esquerda - direita

    y_base = y_topo - altura

    c.setStrokeColor(colors.HexColor("#d9dfe5"))
    c.setLineWidth(0.7)
    c.roundRect(
        esquerda,
        y_base,
        largura,
        altura,
        4 * mm,
        stroke=1,
        fill=0,
    )

    logo_ok = desenhar_logo(
        c,
        dados.get("logo_caminho"),
        esquerda + 5 * mm,
        y_base + 7 * mm,
        42 * mm,
        altura - 14 * mm,
    )

    inicio_texto = esquerda + 52 * mm if logo_ok else esquerda + 7 * mm

    nome_clinica = (
        dados.get("nome_fantasia")
        or dados.get("razao_social")
        or "CUIDARE"
    )

    c.setFillColor(colors.HexColor("#203040"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(
        inicio_texto,
        y_topo - 13 * mm,
        nome_clinica[:55],
    )

    c.setFillColor(colors.HexColor("#52606d"))
    c.setFont("Helvetica", 8.5)

    y = y_topo - 19 * mm

    if dados.get("razao_social"):
        c.drawString(
            inicio_texto,
            y,
            str(dados["razao_social"])[:65],
        )
        y -= 4.5 * mm

    if dados.get("cnpj"):
        c.drawString(
            inicio_texto,
            y,
            f"CNPJ: {dados['cnpj']}",
        )
        y -= 4.5 * mm

    endereco = dados.get("endereco_completo")
    if endereco:
        for linha in quebrar_texto(
            c,
            endereco,
            "Helvetica",
            8.5,
            largura - (inicio_texto - esquerda) - 7 * mm,
        )[:2]:
            c.drawString(
                inicio_texto,
                y,
                linha,
            )
            y -= 4.2 * mm

    c.setFillColor(colors.HexColor("#203040"))
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(
        esquerda + largura - 7 * mm,
        y_topo - 12 * mm,
        f"RECIBO Nº {dados['numero_recibo']}",
    )

    c.setFont("Helvetica", 8.5)
    c.setFillColor(colors.HexColor("#52606d"))
    c.drawRightString(
        esquerda + largura - 7 * mm,
        y_topo - 17 * mm,
        f"Data: {data_br(dados['data_recebimento'])}",
    )


def desenhar_via(c, dados, y_topo, altura):
    esquerda = 18 * mm
    direita = 18 * mm
    largura = A4[0] - esquerda - direita

    y_base = y_topo - altura

    desenhar_marca_dagua(
        c,
        dados.get("logo_caminho"),
        A4[0] / 2,
        y_base + altura / 2,
    )

    c.setFillColor(colors.HexColor("#203040"))
    c.setFont("Helvetica-Bold", 8)
    c.drawString(
        esquerda,
        y_topo - 4 * mm,
        dados["via"],
    )

    cabecalho_topo = y_topo - 8 * mm
    cabecalho_altura = 36 * mm

    desenhar_cabecalho(
        c,
        dados,
        cabecalho_topo,
        cabecalho_altura,
    )

    y = cabecalho_topo - cabecalho_altura - 8 * mm

    # Cliente / paciente
    c.setFillColor(colors.HexColor("#203040"))
    c.setFont("Helvetica-Bold", 9)
    c.drawString(
        esquerda,
        y,
        "CLIENTE / PACIENTE",
    )

    y -= 6 * mm

    nome = dados.get("paciente_nome") or "Cliente não vinculado"
    cpf = dados.get("paciente_cpf")

    c.setFont("Helvetica-Bold", 9)
    c.drawString(esquerda, y, str(nome)[:70])

    if cpf:
        c.setFont("Helvetica", 8.5)
        c.drawRightString(
            esquerda + largura,
            y,
            f"CPF: {cpf}",
        )

    y -= 8 * mm

    # Referência
    c.setFillColor(colors.HexColor("#52606d"))
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(
        esquerda,
        y,
        "REFERÊNCIA",
    )

    y -= 5 * mm

    c.setFillColor(colors.HexColor("#203040"))
    c.setFont("Helvetica", 9)

    referencia = dados.get("descricao") or "Recebimento"
    for linha in quebrar_texto(
        c,
        referencia,
        "Helvetica",
        9,
        largura,
    )[:2]:
        c.drawString(esquerda, y, linha)
        y -= 4.5 * mm

    y -= 2 * mm

    # Valores
    dados_valores = [
        ["Valor total da conta", moeda(dados["valor_total_conta"])],
        ["Recebido nesta operação", moeda(dados["valor_recebimento"])],
        ["Total recebido acumulado", moeda(dados["valor_recebido_acumulado"])],
        ["Saldo pendente", moeda(dados["valor_pendente"])],
    ]

    tabela = Table(
        dados_valores,
        colWidths=[
            largura * 0.65,
            largura * 0.35,
        ],
        rowHeights=6 * mm,
    )

    tabela.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    colors.HexColor("#f7f9fb"),
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.4,
                    colors.HexColor("#d9dfe5"),
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (0, -1),
                    "Helvetica",
                ),
                (
                    "FONTNAME",
                    (1, 0),
                    (1, -1),
                    "Helvetica-Bold",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    8.5,
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, -1),
                    colors.HexColor("#203040"),
                ),
                (
                    "ALIGN",
                    (1, 0),
                    (1, -1),
                    "RIGHT",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
            ]
        )
    )

    w, h = tabela.wrapOn(c, largura, 50 * mm)
    tabela.drawOn(c, esquerda, y - h)

    y -= h + 6 * mm

    # Formas de pagamento
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(colors.HexColor("#203040"))
    c.drawString(
        esquerda,
        y,
        "FORMA(S) DE PAGAMENTO",
    )

    y -= 5 * mm

    c.setFont("Helvetica", 8.5)

    for pagamento in dados["pagamentos"]:
        forma = FORMAS_LABEL.get(
            pagamento["forma_pagamento"],
            pagamento["forma_pagamento"],
        )

        c.drawString(
            esquerda,
            y,
            forma,
        )

        c.drawRightString(
            esquerda + largura,
            y,
            moeda(pagamento["valor"]),
        )

        y -= 4.5 * mm

    y -= 2 * mm

    # Observações
    observacoes = dados.get("observacoes")

    if observacoes:
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(
            esquerda,
            y,
            "OBSERVAÇÕES",
        )

        y -= 5 * mm

        c.setFont("Helvetica", 8)
        for linha in quebrar_texto(
            c,
            observacoes,
            "Helvetica",
            8,
            largura,
        )[:3]:
            c.drawString(
                esquerda,
                y,
                linha,
            )
            y -= 4 * mm

    # Declaração
    y_assinatura = y_base + 13 * mm

    c.setStrokeColor(colors.HexColor("#aeb8c2"))
    c.setLineWidth(0.5)

    c.line(
        esquerda + 18 * mm,
        y_assinatura,
        esquerda + 82 * mm,
        y_assinatura,
    )

    c.setFont("Helvetica", 7.5)
    c.setFillColor(colors.HexColor("#52606d"))

    c.drawCentredString(
        esquerda + 50 * mm,
        y_assinatura - 4 * mm,
        "Responsável / Clínica",
    )

    c.setFont("Helvetica", 7)
    c.drawRightString(
        esquerda + largura,
        y_base + 7 * mm,
        "Documento emitido pelo sistema Cuidare.",
    )



def gerar_recibo_pdf(dados):
    buffer = BytesIO()

    c = canvas.Canvas(
        buffer,
        pagesize=A4,
    )

    largura, altura = A4

    # Duas vias na mesma folha A4
    margem_superior = 10 * mm
    margem_inferior = 10 * mm
    espaco = 8 * mm

    altura_via = (
        altura
        - margem_superior
        - margem_inferior
        - espaco
    ) / 2

    topo_1 = altura - margem_superior
    topo_2 = altura_via + margem_inferior

    desenhar_via(
        c,
        {
            **dados,
            "via": "VIA DO CLIENTE",
        },
        topo_1,
        altura_via,
    )

    # Separador
    y_separador = altura_via + margem_inferior + espaco / 2

    c.setStrokeColor(colors.HexColor("#b9c1c9"))
    c.setDash(4, 3)
    c.setLineWidth(0.6)

    c.line(
        18 * mm,
        y_separador,
        largura - 18 * mm,
        y_separador,
    )

    c.setDash()

    desenhar_via(
        c,
        {
            **dados,
            "via": "VIA DA CLÍNICA",
        },
        topo_2,
        altura_via,
    )

    c.save()

    buffer.seek(0)
    return buffer.getvalue()
