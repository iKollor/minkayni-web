/* ──────────────────────────────────────────────────────────────────────────
   Exporta los logos de src/assets/SVG a PNG con fondo transparente: Google
   Sites solo acepta imágenes rasterizadas para el logo y el favicon.

   Uso (necesita Playwright con Chromium):
     NODE_PATH=$(npm root -g) node google-sites/exportar-logos.mjs
─────────────────────────────────────────────────────────────────────────── */
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const here = dirname(fileURLToPath(import.meta.url));
const svgDir = join(here, "..", "src", "assets", "SVG");
const out = join(here, "logos");
mkdirSync(out, { recursive: true });

/* [archivo SVG, PNG de salida, ancho en px, fondo de la miniatura] */
const LOGOS = [
    ["LOGO+TAG.svg", "minkayni-logo-color.png", 1200],
    ["LOGO+TAG_WHITE.svg", "minkayni-logo-blanco.png", 1200],
    ["LOGO.svg", "minkayni-nombre-color.png", 1200],
    ["LOGO_WHITE.svg", "minkayni-nombre-blanco.png", 1200],
    ["ISOTIPO.svg", "minkayni-isotipo-degradado.png", 512],
    ["ISOTIPO_WHITE.svg", "minkayni-isotipo-blanco.png", 512, "#ffffff"],
    ["misc/flor.svg", "minkayni-flor.png", 256],
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();

for (const [file, name, width, color] of LOGOS) {
    const svg = readFileSync(join(svgDir, file), "utf8").replace(/<\?xml[^>]*\?>/, "");
    await page.setContent(
        `<style>html,body{margin:0;background:transparent}svg{display:block;width:${width}px;height:auto;color:${color ?? "#000"}}</style>${svg}`,
    );
    await page.locator("svg").screenshot({ path: join(out, name), omitBackground: true });
    console.log(`logos/${name}`);
}

/* Favicon: isotipo en degradado centrado en un cuadrado. */
const iso = readFileSync(join(svgDir, "ISOTIPO.svg"), "utf8").replace(/<\?xml[^>]*\?>/, "");
await page.setViewportSize({ width: 512, height: 512 });
await page.setContent(
    `<style>html,body{margin:0;background:transparent}div{width:512px;height:512px;display:grid;place-items:center}svg{height:440px;width:auto}</style><div>${iso}</div>`,
);
await page.locator("div").screenshot({ path: join(out, "minkayni-favicon.png"), omitBackground: true });
console.log("logos/minkayni-favicon.png");

await browser.close();
