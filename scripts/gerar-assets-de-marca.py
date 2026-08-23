#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera os 4 PNGs que `app.json` referencia em `assets/`.

POR QUE UM GERADOR VERSIONADO, E NAO SO OS BINARIOS:
`app.json` apontava para assets/icon.png, splash-icon.png, adaptive-icon.png e
favicon.png desde sempre, e `git log -- assets` mostra que NENHUM deles jamais
existiu no historico. Como os 4 sao derivaveis da identidade que ja esta versionada,
o gerador fica junto: se um token de cor mudar, os assets se refazem a partir da
fonte da verdade em vez de apodrecerem como binarios opacos.

FONTES DA VERDADE (nada aqui e inventado):
  - Logomark: o SVG canonico de `Design KURA/Design System/kura-design-system.html`
    (secao "01 - Logomark") — coracao estilizado com 3 pegadas integradas.
  - Cores: `src/theme/tokens.ts` (lightColors.bg / .primary / .amber).
  - Fonte: `Cormorant_500Medium.ttf`, a mesma que `fonts.display` carrega em runtime.
  - Orbes do icone: mesma composicao do SplashContent em `src/app/_layout.tsx`.

Uso:  python3 scripts/gerar-assets-de-marca.py
Requer: Pillow.
"""
import os
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'assets')
FONTE_DISPLAY = os.path.join(RAIZ, 'node_modules', '@expo-google-fonts', 'cormorant', 'Cormorant_500Medium.ttf')

# src/theme/tokens.ts -> lightColors
BG      = (0xF8, 0xF2, 0xE6)
PRIMARY = (0x4A, 0x69, 0x44)
AMBER   = (0x96, 0x61, 0x0A)

SS = 4  # supersampling; tudo e desenhado em SS x e reduzido com LANCZOS no fim

# --- Logomark: path do SVG do design system, viewBox 0 0 48 48 -----------------
# M24 40 C24 40 8 30 8 18 C8 12 12 8 16 8 C19 8 21.5 10 24 13
#         C26.5 10 29 8 32 8 C36 8 40 12 40 18 C40 30 24 40 24 40 Z
SEGMENTOS = [
    ((24, 40), (24, 40), (8, 30), (8, 18)),
    ((8, 18), (8, 12), (12, 8), (16, 8)),
    ((16, 8), (19, 8), (21.5, 10), (24, 13)),
    ((24, 13), (26.5, 10), (29, 8), (32, 8)),
    ((32, 8), (36, 8), (40, 12), (40, 18)),
    ((40, 18), (40, 30), (24, 40), (24, 40)),
]
LARGURA_TRACO = 2.5                                    # stroke-width do SVG
PEGADAS = [((20, 20), 2.5, 0.85), ((28, 20), 2.5, 0.85), ((24, 26), 3.0, 1.0)]


def _cubica(p0, p1, p2, p3, passos=240):
    pts = []
    for i in range(passos + 1):
        t = i / passos
        u = 1 - t
        x = u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0]
        y = u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]
        pts.append((x, y))
    return pts


def logomark(lado, cor):
    """RGBA transparente de `lado`x`lado` com a marca ocupando a viewBox inteira."""
    img = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    e = lado / 48.0

    pontos = []
    for p0, p1, p2, p3 in SEGMENTOS:
        trecho = _cubica(p0, p1, p2, p3)
        pontos.extend(trecho if not pontos else trecho[1:])
    pontos = [(x*e, y*e) for x, y in pontos]

    # O traco e carimbado como uma sequencia densa de discos ao longo do path, e nao
    # com `ImageDraw.line(..., joint='curve')`: o `line` do Pillow monta cada segmento
    # como um quad proprio e, num path curvo reamostrado em centenas de pontos, as
    # bordas desses quads nao coincidem exatamente — o que sobrevive a reducao como
    # uma franja serrilhada ao longo de toda a silhueta (visivel na 1a geracao).
    # Carimbar discos da de graca o stroke-linecap/linejoin="round" do SVG.
    r = LARGURA_TRACO*e/2
    passo = max(1.0, r/3)
    resto = 0.0
    for (x0, y0), (x1, y1) in zip(pontos, pontos[1:]):
        dx, dy = x1-x0, y1-y0
        comp = (dx*dx + dy*dy) ** 0.5
        if comp == 0:
            continue
        t = resto
        while t < comp:
            cx, cy = x0 + dx*t/comp, y0 + dy*t/comp
            d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=cor + (255,))
            t += passo
        resto = t - comp
    d.ellipse([pontos[-1][0]-r, pontos[-1][1]-r, pontos[-1][0]+r, pontos[-1][1]+r], fill=cor + (255,))

    for (px, py), pr, alfa in PEGADAS:
        pad = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ImageDraw.Draw(pad).ellipse(
            [(px-pr)*e, (py-pr)*e, (px+pr)*e, (py+pr)*e], fill=cor + (round(255*alfa),))
        img = Image.alpha_composite(img, pad)
    return img


def _colar_centralizado(base, marca, proporcao):
    """Centraliza a marca pelo DESENHO, nao pela viewBox. Na viewBox 48x48 do SVG o
    coracao ocupa so y=8..40, entao centralizar o quadrado deixava a marca visivelmente
    baixa (e menor do que `proporcao` sugeria). `proporcao` passa a ser a fracao da
    largura da base ocupada pela maior dimensao do desenho recortado."""
    m = marca.crop(marca.getbbox())
    alvo = base.width * proporcao
    escala = alvo / max(m.size)
    m = m.resize((max(1, round(m.width*escala)), max(1, round(m.height*escala))), Image.LANCZOS)
    base.alpha_composite(m, ((base.width - m.width)//2, (base.height - m.height)//2))


def _orbe(tela, centro, raio, cor, alfa):
    """Orbe chapado de baixa opacidade — a mesma composicao do SplashContent."""
    camada = Image.new('RGBA', tela.size, (0, 0, 0, 0))
    cx, cy = centro
    ImageDraw.Draw(camada).ellipse(
        [cx-raio, cy-raio, cx+raio, cy+raio], fill=cor + (round(255*alfa),))
    return Image.alpha_composite(tela, camada)


def gerar_icone(lado=1024):
    """Icone de app: fundo cheio + orbes do splash + marca centralizada."""
    t = lado * SS
    img = Image.new('RGBA', (t, t), BG + (255,))
    # _layout.tsx: orbTR ambar em cima a direita, orbBL sage embaixo a esquerda, opacity .18
    img = _orbe(img, (t*1.02, t*-0.02), t*0.30, AMBER, 0.10)
    img = _orbe(img, (t*-0.03, t*1.03), t*0.27, PRIMARY, 0.10)
    _colar_centralizado(img, logomark(round(t*0.56), PRIMARY), 0.56)
    return img.resize((lado, lado), Image.LANCZOS)


def gerar_adaptive_icon(lado=1024):
    """Camada de FRENTE do Android: transparente (o fundo vem do app.json) e a marca
    dentro do circulo seguro de 66% — o resto e comido pela mascara do launcher."""
    t = lado * SS
    img = Image.new('RGBA', (t, t), (0, 0, 0, 0))
    _colar_centralizado(img, logomark(round(t*0.52), PRIMARY), 0.52)
    return img.resize((lado, lado), Image.LANCZOS)


def _wordmark(altura_em):
    """`Kura.` em Cormorant, recortada no proprio alpha. `.wordmark` do design system:
    letter-spacing -0.03em e o ponto final destacado — aqui em ambar, como no
    SplashContent de `src/app/_layout.tsx`. O Pillow nao expoe tracking, entao os
    glifos sao desenhados um a um."""
    fonte = ImageFont.truetype(FONTE_DISPLAY, altura_em)
    tela = Image.new('RGBA', (altura_em*6, altura_em*3), (0, 0, 0, 0))
    d = ImageDraw.Draw(tela)
    texto, tracking = 'Kura.', -0.03 * altura_em
    larguras = [d.textlength(c, font=fonte) for c in texto]
    x, y = altura_em*0.5, altura_em*0.5
    for c, w in zip(texto, larguras):
        d.text((x, y), c, font=fonte, fill=(AMBER if c == '.' else PRIMARY) + (255,))
        x += w + tracking
    return tela.crop(tela.getbbox())


def gerar_splash_icon(lado=1024):
    """Lockup vertical (marca sobre wordmark) em fundo transparente: o `resizeMode:
    contain` do app.json compoe isso sobre o backgroundColor #F8F2E6.

    As duas pecas sao recortadas no proprio alpha e empilhadas por bbox real, e nao
    posicionadas por fracao fixa da tela: a caixa em da Cormorant tem folga vertical
    grande e sobrepassos que nenhuma metrica nominal descreve, entao ancorar em fracoes
    deixava um vao morto entre marca e palavra (as duas liam como elementos soltos).
    Pelo mesmo motivo o resultado e recortado de novo no fim — margem transparente
    sobrando vira lockup encolhido, ja que `contain` encaixa a IMAGEM inteira na tela.
    """
    t = lado * SS
    marca = logomark(round(t*0.42), PRIMARY)
    marca = marca.crop(marca.getbbox())
    palavra = _wordmark(round(t*0.24))

    vao = round(marca.height * 0.20)
    largura = max(marca.width, palavra.width)
    altura = marca.height + vao + palavra.height
    lockup = Image.new('RGBA', (largura, altura), (0, 0, 0, 0))
    lockup.alpha_composite(marca, ((largura - marca.width)//2, 0))
    lockup.alpha_composite(palavra, ((largura - palavra.width)//2, marca.height + vao))

    folga = round(max(lockup.size) * 0.09)
    quadro = max(lockup.size) + 2*folga
    final = Image.new('RGBA', (quadro, quadro), (0, 0, 0, 0))
    final.alpha_composite(lockup, ((quadro - lockup.width)//2, (quadro - lockup.height)//2))
    return final.resize((lado, lado), Image.LANCZOS)


def gerar_favicon(lado=48):
    """Favicon web: marca grande sobre o fundo da marca — a 48px o traco do coracao
    precisa de todo o espaco que der para continuar legivel."""
    t = lado * SS * 4
    img = Image.new('RGBA', (t, t), BG + (255,))
    _colar_centralizado(img, logomark(round(t*0.80), PRIMARY), 0.80)
    return img.resize((lado, lado), Image.LANCZOS)


if __name__ == '__main__':
    os.makedirs(SAIDA, exist_ok=True)
    for nome, img in [
        ('icon.png',          gerar_icone()),
        ('adaptive-icon.png', gerar_adaptive_icon()),
        ('splash-icon.png',   gerar_splash_icon()),
        ('favicon.png',       gerar_favicon()),
    ]:
        caminho = os.path.join(SAIDA, nome)
        img.save(caminho)
        print('%-20s %sx%s  %.1f KB' % (nome, img.width, img.height, os.path.getsize(caminho)/1024))
