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
 *
 * Las reglas en sí viven en `markdown-rules.ts`: son datos sin dependencias,
 * y las reutiliza también la vista previa en el navegador (`markdown-dom.ts`).
 */
import type { RehypePlugins } from "@astrojs/markdown-remark";
import rehypeModular from "./rehype-modular";
import { markdownRules } from "./markdown-rules";

export const rehypePlugins: RehypePlugins = [[rehypeModular, markdownRules]];
