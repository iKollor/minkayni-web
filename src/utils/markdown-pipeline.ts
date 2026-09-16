/**
 * Configuración única del pipeline Markdown del sitio.
 *
 * Desde Astro 7 el procesador por defecto es Sätteri (nativo, en Rust) y los
 * plugins remark/rehype sólo funcionan con el procesador `unified()` de
 * `@astrojs/markdown-remark`. Este módulo define los plugins una sola vez y los
 * comparte entre dos consumidores:
 *
 *  - `astro.config.ts`, vía `markdown.processor: unified({ rehypePlugins })`,
 *    para los ficheros `.md` del proyecto.
 *  - `components/Markdown.astro`, que renderiza en tiempo de build los campos
 *    de texto enriquecido que llegan desde Strapi.
 *
 * Mantenerlos juntos evita que ambos caminos diverjan (que un enlace del CMS
 * salga sin `rel="noopener"`, por ejemplo).
 */
import type { RehypePlugins } from "@astrojs/markdown-remark";
import rehypeModular, { type ModularConfig } from "./rehype-modular";

const modularConfig: ModularConfig = {
    /* SHORTCODES en texto: {{odometer:150}} → <span data-count="150">150</span>.
       El contador animado (Counter de reactbits) lo monta CounterMount sobre
       cualquier [data-count] del sitio; aquí solo se deja el número en el HTML. */
    textPatterns: [
        {
            pattern: /{{\s*odometer\s*:\s*(\d{1,6})\s*}}/g,
            replace: (m: RegExpExecArray) => {
                const num = m[1];
                return {
                    type: "element",
                    tagName: "span",
                    properties: { "data-count": num, className: ["tabular-nums", "font-semibold"] },
                    children: [{ type: "text", value: num }],
                };
            },
        },
    ],

    /* REGLAS por selector para todos los anchors, externos/internos, etc. */
    rules: [
        // Todos los <a>: añade clases (sin duplicar)
        { selector: "a", classes: { add: "anchor-fx" } },

        // Externos: abre nueva pestaña + rel seguro
        {
            selector: 'a[href^="http"]',
            attributes: {
                target: { value: "_blank" },
                rel: { value: "noopener noreferrer" },
            },
        },
        // Internos: limpia target/rel si los hubiera
        {
            selector: 'a[href^="/"]',
            attributes: {
                target: { value: undefined },
                rel: { value: undefined },
            },
        },
    ],
};

export const rehypePlugins: RehypePlugins = [[rehypeModular, modularConfig]];
