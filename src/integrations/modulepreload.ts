/* Precarga de los módulos compartidos.

   Cada `<script>` de un componente Astro sale como un `<script type="module">`
   propio, y casi todos importan los mismos trozos: `main`, `gsap`,
   `ScrollTrigger`, el runtime del empaquetador. El navegador solo descubre
   esos trozos al descargar y leer el script que los importa, así que antes de
   ejecutar nada encadena dos o tres viajes de ida y vuelta —PageSpeed lo
   llamaba «cadena de dependencias crítica» de seis segundos en escritorio—.

   Vite añade `<link rel="modulepreload">` por cada trozo importado cuando es
   él quien escribe el HTML; Astro escribe el HTML por su cuenta y no lo hace.
   Esta integración lo repone al final del build: lee los scripts de cada
   página, sigue sus imports estáticos y declara cada trozo alcanzable al
   final del <head>, detrás de las fuentes y el CSS, que van primero. Los
   imports dinámicos (`import()`) y las islas de React no se tocan: esos
   siguen cargando cuando hacen falta. */
import type { AstroIntegration } from "astro";
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_MODULE = /<script type="module" src="([^"]+)"/g;
/* Solo imports/exports estáticos con ruta relativa; `import(...)` no cuadra
   con ninguna de las dos formas (el paréntesis está excluido). */
const STATIC_IMPORT = /(?:import|export)(?:[^"'`;()]*?)from\s*["'](\.{1,2}\/[^"']+)["']|import\s*["'](\.{1,2}\/[^"']+)["']/g;

/** Rutas (absolutas del sitio, `/_astro/x.js`) que `code` importa de forma estática. */
export function staticImports(code: string, from: string): string[] {
    const base = path.posix.dirname(from);
    const found = new Set<string>();
    for (const match of code.matchAll(STATIC_IMPORT)) {
        const spec = match[1] ?? match[2];
        if (spec) found.add(path.posix.normalize(path.posix.join(base, spec)));
    }
    return [...found];
}

/** Módulos alcanzables desde `entries` (sin incluirlos), en orden de descubrimiento. */
export async function transitiveImports(root: string, entries: string[]): Promise<string[]> {
    const seen = new Set(entries);
    const deps: string[] = [];
    const queue = [...entries];
    while (queue.length) {
        const current = queue.shift()!;
        const file = path.join(root, current);
        let code: string;
        try {
            if (!(await stat(file)).isFile()) continue;
            code = await readFile(file, "utf8");
        } catch {
            continue;
        }
        for (const dep of staticImports(code, current)) {
            if (seen.has(dep)) continue;
            seen.add(dep);
            deps.push(dep);
            queue.push(dep);
        }
    }
    return deps;
}

export function moduleEntries(html: string): string[] {
    return [...html.matchAll(SCRIPT_MODULE)].map((m) => m[1]);
}

export function preloadedModules(html: string): string[] {
    return [...html.matchAll(/<link rel="modulepreload" href="([^"]+)">/g)].map((m) => m[1]);
}

async function htmlFiles(dir: string): Promise<string[]> {
    const out: string[] = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
        else if (entry.name.endsWith(".html")) out.push(full);
    }
    return out;
}

export default function modulepreload(): AstroIntegration {
    return {
        name: "minkayni:modulepreload",
        hooks: {
            "astro:build:done": async ({ dir, logger }) => {
                const root = fileURLToPath(dir);
                let pages = 0;
                for (const file of await htmlFiles(root)) {
                    const html = await readFile(file, "utf8");
                    const entries = moduleEntries(html);
                    if (!entries.length || !html.includes("</head>")) continue;
                    const deps = await transitiveImports(root, entries);
                    if (!deps.length) continue;
                    const links = deps.map((dep) => `<link rel="modulepreload" href="${dep}">`).join("");
                    await writeFile(file, html.replace("</head>", `${links}</head>`));
                    pages += 1;
                }
                logger.info(`modulepreload en ${pages} páginas`);
            },
        },
    };
}
