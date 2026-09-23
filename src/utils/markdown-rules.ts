/**
 * Reglas propias del Markdown del sitio: lo que se aplica DESPUÉS de
 * convertir el Markdown a HTML, en cualquier entorno.
 *
 * Es solo datos, sin dependencias, porque tiene dos consumidores que no
 * comparten nada más:
 *  - `markdown-pipeline.ts` las aplica sobre el árbol hast en build (plugin
 *    rehype-modular), para los `.md` del repo y los campos de Strapi.
 *  - `markdown-dom.ts` las aplica sobre el DOM en el navegador, en la vista
 *    previa de borradores del constructor, donde no hay build.
 *
 * Una regla añadida aquí llega a los dos caminos a la vez; así la vista
 * previa no puede quedarse atrás del sitio publicado.
 */
import type { ModularConfig } from "./rehype-modular";

export const markdownRules: ModularConfig = {
    /* SHORTCODES en texto: {{odometer:150}} → <span data-count="150">150</span>.
       El contador animado (countUp.js + Odometer, scripts/count-up.ts) se monta sobre
       cualquier [data-count] del sitio; aquí solo se deja el número en el HTML. */
    textPatterns: [
        {
            pattern: /{{\s*odometer\s*:\s*(\d{1,6})\s*}}/g,
            replace: (m: RegExpExecArray) => {
                const num = m[1];
                return {
                    type: "element",
                    tagName: "span",
                    properties: { "data-count": num, "data-count-manual": "", "data-count-live": "", className: ["tabular-nums", "font-semibold"] },
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
