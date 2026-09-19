"""Recorta las fuentes del sitio a los caracteres que el sitio usa de verdad.

Las Aristotelica vienen del foundry con 800 caracteres y 1.124 glifos: alfabetos
y signos que esta web no escribe nunca. Eso pone cada peso en ~70 KB, y la
portada llega a pedir nueve. Son ~620 KB de fuentes, más de la mitad del peso
de la página.

Aquí se recorta cada .woff2 al bloque latino (que ya cubre el español entero:
á é í ó ú ñ ü ¿ ¡) más el latino extendido, la puntuación tipográfica y los
símbolos de moneda que aparecen en /donate. El resultado se escribe al lado,
con la extensión `.subset.woff2`, y es lo que carga el CSS.

Los originales NO se tocan: quedan en el repositorio como fuente de verdad para
poder volver a generar los subsets si algún día hace falta otro carácter.

    python tools/fonts/subset.py
"""

from __future__ import annotations

import pathlib
import sys

from fontTools.subset import Subsetter, Options
from fontTools.ttLib import TTFont

RAIZ = pathlib.Path(__file__).resolve().parents[2] / "src" / "assets" / "fonts"

# Rangos de Google Fonts `latin` + `latin-ext`, más lo que usa este sitio:
# comillas y rayas tipográficas, símbolos de moneda y el bloque entero de
# flechas (U+2190-21FF). Las flechas van completas a propósito: la primera
# versión de este recorte se quedó solo con las cuatro cardinales y dejó fuera
# las diagonales ↗ ↘ que marcan los enlaces externos, que el original sí traía.
RANGOS = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
    "U+0100-012F,U+0132-014F,U+0150-0151,U+0154-017F,"
    "U+0304,U+0308,U+0329,"
    "U+2000-206F,U+2074,U+20A0-20BF,U+2113,U+2122,U+2190-21FF,U+2212,U+2215,"
    "U+25CF,U+2605,U+2713,U+FEFF,U+FFFD"
)


def unicodes(rangos: str) -> set[int]:
    puntos: set[int] = set()
    for trozo in rangos.split(","):
        trozo = trozo.strip().removeprefix("U+")
        if "-" in trozo:
            ini, fin = trozo.split("-")
            puntos.update(range(int(ini, 16), int(fin, 16) + 1))
        else:
            puntos.add(int(trozo, 16))
    return puntos


def recortar(origen: pathlib.Path, destino: pathlib.Path, puntos: set[int]) -> tuple[int, int]:
    fuente = TTFont(origen)

    opciones = Options()
    opciones.flavor = "woff2"
    # El layout que sí se usa: ligaduras, kerning y las formas contextuales.
    opciones.layout_features = ["kern", "liga", "clig", "calt", "ccmp", "locl", "mark", "mkmk", "rlig"]
    # `name` y `post` cargan cadenas (copyright, nombres de glifo) que el
    # navegador no necesita para pintar texto.
    opciones.name_IDs = [1, 2, 3, 4, 6]
    opciones.glyph_names = False
    opciones.notdef_outline = True
    opciones.recalc_bounds = True
    opciones.drop_tables += ["FFTM"]

    subsetter = Subsetter(options=opciones)
    subsetter.populate(unicodes=puntos)
    subsetter.subset(fuente)

    destino.parent.mkdir(parents=True, exist_ok=True)
    fuente.save(destino)
    fuente.close()
    return origen.stat().st_size, destino.stat().st_size


def main() -> int:
    if not RAIZ.is_dir():
        print(f"No encuentro {RAIZ}", file=sys.stderr)
        return 1

    puntos = unicodes(RANGOS)
    originales = sorted(p for p in RAIZ.rglob("*.woff2") if not p.name.endswith(".subset.woff2"))
    if not originales:
        print("No hay .woff2 que recortar", file=sys.stderr)
        return 1

    antes = despues = 0
    for origen in originales:
        destino = origen.with_suffix("").with_suffix(".subset.woff2")
        destino = origen.parent / (origen.stem + ".subset.woff2")
        a, d = recortar(origen, destino, puntos)
        antes += a
        despues += d
        print(f"{origen.name:42} {a/1024:6.1f} KB -> {d/1024:5.1f} KB  ({100 - d*100//a:.0f}% menos)")

    print(f"\n{len(originales)} fuentes: {antes/1024:.0f} KB -> {despues/1024:.0f} KB "
          f"({(antes-despues)/1024:.0f} KB menos en total)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
