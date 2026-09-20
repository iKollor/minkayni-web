/* Scripts de módulo con `fetchpriority="low"`, en cada página del build.

   Chrome pide con prioridad alta cualquier script del <head>, módulos
   incluidos, y el modelo de PageSpeed (Lantern) cuenta como bloqueante del
   primer pintado todo script de prioridad alta que termine de bajar antes de
   ese pintado: en móvil simulado sumaba un segundo al FCP. El contenido no
   necesita el JavaScript para verse —viene pintado en el HTML—, así que
   declararlo de prioridad baja es decir la verdad. Astro no deja poner
   atributos a sus `<script>` hoisted; esta integración los reescribe al
   terminar el build. Medido en local (mediana de tres): FCP móvil
   3,8 s → 2,8 s; escritorio 0,84 → 0,64.

   Se probó también precargar con `<link rel="modulepreload">` cada trozo
   que importan los scripts (`main`, `gsap`, `ScrollTrigger`…): acorta la
   cadena de descargas para el usuario, pero en las pasadas de PageSpeed con
   red rápida esos 180 KB terminaban de bajar antes de que se pintara el LCP
   y el modelo los sumaba al LCP (4,6 s frente a 1,2 s cuando llegaban
   después). Sin precarga, los trozos se piden cuando el script que los
   importa ya se ejecuta, después del pintado. Aquí quedan las funciones
   para seguir los imports estáticos: la prueba las usa para comprobar que
   ningún trozo se precarga. */
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
        name: "minkayni:script-priority",
        hooks: {
            "astro:build:done": async ({ dir, logger }) => {
                const root = fileURLToPath(dir);
                let pages = 0;
                for (const file of await htmlFiles(root)) {
                    const html = await readFile(file, "utf8");
                    if (!moduleEntries(html).length) continue;
                    await writeFile(file, lowerScriptPriority(html));
                    pages += 1;
                }
                logger.info(`scripts con fetchpriority="low" en ${pages} páginas`);
            },
        },
    };
}
