/**
 * Markdown → HTML en el navegador, con la misma salida que `render-markdown.ts`
 * produce en build. Lo usa la vista previa de borradores del constructor
 * (BuilderPreview.tsx), que pinta contenido sin pasar por Astro.
 *
 * El pipeline de build (`@astrojs/markdown-remark`) no corre en el navegador:
 * arrastra dependencias de Node. Aquí se reproduce pieza a pieza:
 *  - `marked` con GFM, como remark-gfm.
 *  - `marked-smartypants`, como remark-smartypants (comillas tipográficas,
 *    rayas, puntos suspensivos).
 *  - `markdown-dom.ts` aplica las MISMAS reglas del sitio (`markdown-rules.ts`)
 *    y los `id` de encabezado, sobre el DOM en vez de sobre hast.
 *
 * Solo se carga en la página de vista previa (import dinámico): las páginas
 * publicadas no pagan ni un byte por esto.
 */
import { marked } from "marked";
import { markedSmartypants } from "marked-smartypants";
import { applyMarkdownRules } from "./markdown-dom";
import { markdownRules } from "./markdown-rules";

/* `config: "1"` es el modo estándar de smartypants: `--` → raya larga (—),
   como remark-smartypants en build. El valor por defecto del plugin (2, «a la
   antigua») convierte `--` en raya corta y divergía de la página publicada. */
marked.use(markedSmartypants({ config: "1" }), { gfm: true, async: false });

export function renderMarkdownInBrowser(content: string): string {
    const html = marked.parse(content, { async: false }) as string;
    const template = document.createElement("template");
    template.innerHTML = html;
    applyMarkdownRules(template.content, markdownRules);
    return template.innerHTML;
}
