/**
 * Renderiza cadenas Markdown que llegan desde el CMS a HTML, usando el mismo
 * pipeline unified/rehype que los ficheros `.md` del proyecto.
 *
 * Sustituye a `@astropub/md`, que quedó anclado a `@astrojs/markdown-remark@5`
 * y no es instalable junto a Astro 7. El procesador se crea una sola vez y se
 * reutiliza en todo el build.
 */
import { createMarkdownProcessor, type MarkdownRenderer } from "@astrojs/markdown-remark";
import { rehypePlugins } from "./markdown-pipeline";

let processor: Promise<MarkdownRenderer> | undefined;

const getProcessor = () => (processor ??= createMarkdownProcessor({ rehypePlugins }));

/** Markdown → HTML de bloque (párrafos, listas, encabezados…). */
export async function renderMarkdown(content: string): Promise<string> {
    const { code } = await (await getProcessor()).render(content);
    return code;
}

/**
 * Markdown → HTML sin el `<p>` envolvente, para incrustar en una línea de
 * texto existente. Sólo desenvuelve cuando la salida es un único párrafo.
 */
export async function renderMarkdownInline(content: string): Promise<string> {
    const code = await renderMarkdown(content);
    const trimmed = code.trim();
    return trimmed.startsWith("<p>") && trimmed.endsWith("</p>") && !trimmed.slice(3, -4).includes("<p>")
        ? trimmed.slice(3, -4)
        : code;
}
