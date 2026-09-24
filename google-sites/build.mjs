/* ──────────────────────────────────────────────────────────────────────────
   Genera los bloques listos para pegar en Google Sites (embeds/*.html).

   Google Sites no deja subir tipografías ni SVG al tema, pero sí pegar HTML
   en «Insertar código». Cada bloque se vuelve autónomo: las fuentes de marca
   (Aristotelica) van incrustadas en base64 con las mismas métricas
   corregidas que usa el sitio, y los logos van como SVG en línea.

   Uso: node google-sites/build.mjs
─────────────────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, "..", "src", "assets");
const fonts = join(assets, "fonts");

const FONT_FILES = {
    "display-900": ["Aristotelica Pro Display", 900, "Aristotelica_Pro_Display_WEBFONT/AristotelicaProDisp-Ft.subset.woff2"],
    "display-700": ["Aristotelica Pro Display", 700, "Aristotelica_Pro_Display_WEBFONT/AristotelicaProDisp-Bld.subset.woff2"],
    "display-500": ["Aristotelica Pro Display", 500, "Aristotelica_Pro_Display_WEBFONT/AristotelicaProDisp-Dmbld.subset.woff2"],
    "text-400": ["Aristotelica Pro Text", 400, "Aristotelica_Pro_Text_WEBFONT/AristotelicaProTx-Rg.subset.woff2"],
    "text-700": ["Aristotelica Pro Text", 700, "Aristotelica_Pro_Text_WEBFONT/AristotelicaProTx-Bld.subset.woff2"],
};

/* Solo los pesos que pinta cada bloque: cada uno pesa ~32 KB en base64. */
const BLOCKS = {
    "footer.html": ["display-900", "display-700", "display-500", "text-400", "text-700"],
    "hero.html": ["display-900"],
    "encabezado.html": ["display-900", "text-700"],
    "boton.html": ["display-500"],
};

const fontFace = (key) => {
    const [family, weight, file] = FONT_FILES[key];
    const data = readFileSync(join(fonts, file)).toString("base64");
    /* Mismos overrides que AristotelicaProDisplay.css: sin ellos se recortan
       tildes y colas en cajas con overflow oculto. */
    return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${data}) format("woff2");font-weight:${weight};font-style:normal;font-display:swap;ascent-override:88%;descent-override:22%;line-gap-override:0%}`;
};

const inlineSvg = (file) =>
    readFileSync(join(assets, "SVG", file), "utf8")
        .replace(/<\?xml[^>]*\?>\s*/g, "")
        .replace(/<!--[\s\S]*?-->\s*/g, "")
        .replace(/<svg /, '<svg aria-hidden="true" focusable="false" ')
        .trim();

const baseCss = readFileSync(join(here, "fuente", "_base.css"), "utf8");
const replacements = {
    "{{BASE_CSS}}": baseCss,
    "{{LOGO_TAG_WHITE}}": inlineSvg("LOGO+TAG_WHITE.svg"),
    "{{FLOR}}": inlineSvg("misc/flor.svg"),
};

/* Variante ligera: sin fuentes incrustadas, con Nunito de Google Fonts (la
   misma fuente de respaldo que declara el sitio). Por si Google Sites
   rechaza un bloque por tamaño; se pierde Aristotelica. */
const LIGHT_FONTS = '@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;700;900&display=swap");';

mkdirSync(join(here, "embeds", "ligero"), { recursive: true });

for (const [name, weights] of Object.entries(BLOCKS)) {
    let source = readFileSync(join(here, "fuente", name), "utf8");
    for (const [token, value] of Object.entries(replacements)) source = source.split(token).join(value);

    const variants = [
        [join("embeds", name), weights.map(fontFace).join("\n")],
        [join("embeds", "ligero", name), LIGHT_FONTS],
    ];
    for (const [path, fontsCss] of variants) {
        const html = source.replace("{{FONTS}}", fontsCss);
        writeFileSync(join(here, path), html);
        console.log(`${path}  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
    }
}
