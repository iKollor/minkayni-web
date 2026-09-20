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
   final del <head>, detrás del CSS, que va primero. Los imports dinámicos
   (`import()`) y las islas de React no se tocan: esos siguen cargando
   cuando hacen falta.

   Además, tanto los scripts como sus precargas llevan `fetchpriority="low"`.
   Chrome pide con prioridad alta cualquier script del <head>, módulos
   incluidos, y PageSpeed (el modelo Lantern de Lighthouse) cuenta como
   bloqueante del primer pintado todo script de prioridad alta que termine
   de bajar antes de ese pintado: en móvil simulado sumaba un segundo al
   FCP. El contenido no necesita el JavaScript para verse —viene pintado en
   el HTML—, así que declararlo de prioridad baja es decir la verdad; en la
   práctica, con el CSS en línea y las fuentes por delante, los scripts
   siguen llegando en el mismo viaje. Medido en local (mediana de tres):
   FCP móvil 3,8 s → 2,8 s; escritorio 0,84 → 0,64. */
import type { AstroIntegration } from "astro";
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_MODULE = /<script type="module"(?: fetchpriority="low")? src="([^"]+)"/g;
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
    return [...html.matchAll(/<link rel="modulepreload" fetchpriority="low" href="([^"]+)">/g)].map((m) => m[1]);
}

/** `<script type="module" src>` → con `fetchpriority="low"` (idempotente). */
export function lowerScriptPriority(html: string): string {
    return html.replace(/<script type="module" src="/g, '<script type="module" fetchpriority="low" src="');
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
                    const links = deps.map((dep) => `<link rel="modulepreload" fetchpriority="low" href="${dep}">`).join("");
                    await writeFile(file, lowerScriptPriority(html).replace("</head>", `${links}</head>`));
                    pages += 1;
                }
                logger.info(`modulepreload en ${pages} páginas`);
            },
        },
    };
}
