/* ──────────────────────────────────────────────────────────────────────────
   formatTitle(): convierte un título plano del CMS en HTML seguro.

   Convención editorial (documentada en los campos de Strapi):
   - Un salto de línea            → <br />
   - *texto entre asteriscos*     → <span class="…"> con la clase de acento
     que decida cada sección (color de marca, subrayado, etc.)

   Ej.: "Desde los barrios\n*también se produce* futuro."
─────────────────────────────────────────────────────────────────────────── */

const escapeHtml = (value: string): string =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function formatTitle(raw: string, accentClass = ""): string {
    const escaped = escapeHtml(raw);
    const withAccent = escaped.replace(/\*([^*\n]+)\*/g, (_, inner: string) =>
        accentClass ? `<span class="${accentClass}">${inner}</span>` : inner
    );
    return withAccent.replace(/\r?\n/g, "<br />");
}

/** Divide un texto largo en párrafos por línea en blanco (para campos text multi-párrafo). */
export function splitParagraphs(raw: string): string[] {
    return raw
        .split(/\r?\n\s*\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean);
}
