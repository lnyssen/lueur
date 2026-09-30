"""Génère les icônes de l'appli : un renard sous la lune, dans les couleurs du crépuscule."""
from PIL import Image, ImageDraw, ImageFilter

S = 4  # suréchantillonnage


def icon(size, pad=0.0):
    n = size * S
    img = Image.new("RGB", (n, n))
    d = ImageDraw.Draw(img)
    top, bot = (31, 29, 61), (104, 86, 150)
    for y in range(n):
        k = y / n
        d.line([(0, y), (n, y)], fill=tuple(round(top[i] + (bot[i] - top[i]) * k) for i in range(3)))

    def P(x, y):  # coordonnées 0..100, resserrées par la marge de sécurité
        f = 1 - 2 * pad
        return ((pad + x / 100 * f) * n, (pad + y / 100 * f) * n)

    glow = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    (mx, my), r = P(70, 28), n * 0.2 * (1 - 2 * pad)
    g.ellipse([mx - r, my - r, mx + r, my + r], fill=(255, 224, 150, 110))
    glow = glow.filter(ImageFilter.GaussianBlur(n * 0.05))
    img.paste(glow, (0, 0), glow)
    d = ImageDraw.Draw(img)
    r = n * 0.085 * (1 - 2 * pad)
    d.ellipse([mx - r, my - r, mx + r, my + r], fill=(255, 243, 207))

    d.polygon([P(0, 78), P(28, 62), P(52, 74), P(78, 58), P(100, 72), P(100, 100), P(0, 100)], fill=(49, 47, 89))
    orange, dark, white, ink = (240, 138, 60), (201, 98, 42), (255, 241, 222), (43, 39, 72)
    d.polygon([P(24, 40), P(33, 20), P(44, 36), P(56, 36), P(67, 20), P(76, 40), P(72, 62), P(50, 82), P(28, 62)], fill=orange)
    d.polygon([P(33, 20), P(44, 36), P(36, 38)], fill=dark)
    d.polygon([P(67, 20), P(56, 36), P(64, 38)], fill=dark)
    d.polygon([P(28, 62), P(42, 58), P(50, 66), P(58, 58), P(72, 62), P(50, 82)], fill=white)
    d.polygon([P(46, 72), P(54, 72), P(50, 78)], fill=ink)
    for ex in (40, 60):
        (x, y), r = P(ex, 51), n * 0.022 * (1 - 2 * pad)
        d.ellipse([x - r, y - r, x + r, y + r], fill=ink)
    return img.resize((size, size), Image.LANCZOS)


icon(192).save("icons/icon-192.png")
icon(512).save("icons/icon-512.png")
icon(512, pad=0.12).save("icons/icon-maskable-512.png")
icon(180).save("icons/apple-touch-icon.png")
