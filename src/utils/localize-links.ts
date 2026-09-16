/* ──────────────────────────────────────────────────────────────────────────
   localizeLinks(): prefija con el idioma los enlaces internos que vienen del
   CMS.

   El editor escribe `/about#contacto` una sola vez, en el idioma que sea. Es
   lo correcto: el prefijo `/en` es una decisión de este sitio —podría ser un
   subdominio mañana— y no algo que deba aprenderse quien redacta. Así que se
   aplica aquí, al leer, y no se le pide a nadie que lo teclee.

   Qué NO se toca, y por qué:
   - Las URL absolutas y los `mailto:`/`tel:`, que no son de este sitio.
   - Las anclas sueltas (`#contacto`), que ya apuntan a la página actual.
   - Los ficheros: `/media/...`, `/uploads/...` y cualquier ruta con extensión.
     Son los archivos de Strapi y del directorio público; no tienen versión por
     idioma y prefijarlos daría un 404.
─────────────────────────────────────────────────────────────────────────── */
import { localizePath, type Locale } from "../i18n";

/** Claves cuyo valor es una ruta. Cualquier otra cadena se deja intacta. */
const LINK_KEYS = new Set(["href", "path", "url", "link"]);

/* `/media/x.png`, `/uploads/y.webp`, `/documento.pdf`: archivos, no páginas. */
const FILE_PATH = /^\/(?:media|uploads|_astro)\//i;
const HAS_EXTENSION = /\.[a-z0-9]{2,5}(?:[?#]|$)/i;

const isInternalPage = (value: string): boolean =>
    value.startsWith("/") && !value.startsWith("//") && !FILE_PATH.test(value) && !HAS_EXTENSION.test(value);

export function localizeLinks<T>(value: T, locale: Locale): T {
    if (Array.isArray(value)) {
        return value.map((item) => localizeLinks(item, locale)) as unknown as T;
    }

    if (value !== null && typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
            out[key] =
                LINK_KEYS.has(key) && typeof item === "string" && isInternalPage(item)
                    ? localizePath(item, locale)
                    : localizeLinks(item, locale);
        }
        return out as T;
    }

    return value;
}
