# Pipeline del Lottie de la intro (`src/assets/lottie/logo_intro.json`)

El motion graphic del logotipo que usa `LogoMotion.astro` no se exportó desde
After Effects: se **reconstruyó cuadro a cuadro** a partir del
`logo_intro.webm` original (1920×1080, 24 fps, 120 cuadros) para que la
coreografía, los tiempos y el desenfoque de movimiento sean los mismos, pero
con vectores (SVG animado vía `lottie-web`) en vez de video con alpha.

Cómo se construye:

1. **Geometría exacta** de los glifos: `svg_glyphs.py` lee
   `src/assets/SVG/LOGO+TAG.svg` (isotipo, letras «inkayni», tagline) y
   `PATH_TAG.svg` (trazo de escritura del tagline) y los convierte a béziers
   Lottie. `centerline.py` obtiene además la línea central de las dos «n»
   (se dibujan con *trim paths*) y alinea el trazo de escritura con el tagline.
2. **Medición del video**: `track_components.py` (componentes por color),
   `track_figures.py` (esqueleto del cuerpo, brazo y cabeza de las dos figuras
   en cada cuadro), `track_letters.py` (posición, rotación y escala de cada
   letra por ajuste de máscara), `track_misc.py` (isotipo final, extremos del
   degradado, avance del tagline, desenfoque global) y `track_nreveal.py`
   (progreso del trazo de las «n»).
3. **Ensamblado**: `build_lottie.py` genera el JSON con una clave por cuadro
   (interpolación lineal) para figuras, letras, degradado y desenfoque
   gaussiano (efecto Lottie) y lo compacta.
4. **Verificación**: `harness/render.mjs` renderiza el JSON con `lottie-web`
   en Chromium (Playwright) y `compare.py` mide el IoU cuadro a cuadro contra
   el video (media ≈ 0,86; los cuadros de barrido con mucho blur bajan la
   media, el resto está entre 0,85 y 0,95).

Requisitos: Python 3 con `numpy scipy scikit-image svgpathtools pillow`,
ffmpeg (por ejemplo `pip install imageio-ffmpeg`) y Node con
`playwright-core` en `harness/`. Todo lo intermedio va a `INTRO_WORK`
(por defecto `scripts/intro-lottie/work`, ignorado por git):

```bash
export INTRO_WORK=scripts/intro-lottie/work
mkdir -p "$INTRO_WORK/frames" "$INTRO_WORK/frames960"
ffmpeg -c:v libvpx-vp9 -i src/assets/videos/logo_intro.webm -pix_fmt rgba "$INTRO_WORK/frames/f%03d.png"
ffmpeg -c:v libvpx-vp9 -i src/assets/videos/logo_intro.webm -vf scale=960:-1 -pix_fmt rgba "$INTRO_WORK/frames960/f%03d.png"
cd scripts/intro-lottie
python3 svg_glyphs.py && python3 centerline.py
python3 track_components.py && python3 track_figures.py 0 76 && python3 track_misc.py
python3 track_letters.py i k a y i2 && python3 track_letters.py n n2 && python3 track_nreveal.py
python3 build_lottie.py            # escribe $INTRO_WORK/logo_intro.json
cd harness && npm i && node render.mjs "$INTRO_WORK/logo_intro.json" "$INTRO_WORK/render" 0.5
cd .. && python3 compare.py "$INTRO_WORK/render" 0.5 --sheet
cp "$INTRO_WORK/logo_intro.json" ../../src/assets/lottie/logo_intro.json
```

Los ajustes manuales (cuadros con la cabeza fuera de plano, desenfoque de los
barridos de cámara, claves de letras que el ajuste automático no resuelve por
el blur) están al principio de `build_lottie.py`, documentados en línea.
