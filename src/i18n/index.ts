/* ──────────────────────────────────────────────────────────────────────────
   Idiomas del sitio.

   El español es el idioma por defecto y NO lleva prefijo: `/about` sigue
   siendo la misma URL que antes de existir el inglés. Eso es deliberado —
   cambiar las URLs españolas habría obligado a redirigir once páginas y a
   rehacer el posicionamiento ya ganado. El inglés vive bajo `/en/`.

   El par de funciones que importa:
   - `getLocale(url)`     : qué idioma se está sirviendo.
   - `localizePath(p, l)` : la misma ruta en el otro idioma.
   Todo lo demás se apoya en esas dos.
─────────────────────────────────────────────────────────────────────────── */
import { ui, type UiKey } from "./ui";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

/** `lang` del <html>. El español declara región porque el sitio es de Ecuador. */
export const htmlLang: Record<Locale, string> = {
    es: "es-EC",
    en: "en",
};

/** `og:locale` de Open Graph, que exige el formato `idioma_REGIÓN`. */
export const ogLocale: Record<Locale, string> = {
    es: "es_EC",
    en: "en_US",
};

/** Nombre del idioma en su propio idioma, como manda la costumbre. */
export const localeName: Record<Locale, string> = {
    es: "Español",
    en: "English",
};

const isLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

/* ── Rutas cuyo slug cambia de idioma ──────────────────────────────────────

   La clave es la ruta canónica, que es siempre la española; el valor, cómo se
   escribe en los demás idiomas. Traducir el slug no es cosmético: `/en/historia`
   le dice a un lector inglés que se ha equivocado de sitio, y a un buscador que
   esa página es española.

   `batucada-popular` NO está aquí, y es deliberado: es el nombre propio del
   proyecto y se escribe igual en los dos idiomas. Sus subrutas sí se traducen,
   porque `historia` y `ecosistema` son palabras comunes, no parte del nombre.

   `/about`, `/impact`, `/projects` y `/donate` tampoco aparecen: ya están en
   inglés en el sitio español, así que no hay nada que traducir. */
const TRANSLATED_PATHS: Record<string, Partial<Record<Locale, string>>> = {
    "/transparencia": { en: "/transparency" },
    "/projects/batucada-popular/historia": { en: "/projects/batucada-popular/history" },
    "/projects/batucada-popular/ecosistema": { en: "/projects/batucada-popular/ecosystem" },
};

/** Índice inverso: de la ruta traducida a la canónica. */
const CANONICAL_PATHS = new Map<string, string>();
for (const [canonical, byLocale] of Object.entries(TRANSLATED_PATHS)) {
    for (const translated of Object.values(byLocale)) {
        if (translated) CANONICAL_PATHS.set(translated, canonical);
    }
}

/**
 * Idioma de la página que se está renderizando, deducido de la URL.
 * `/en`, `/en/`, `/en/about` → inglés. Cualquier otra cosa → español.
 */
export function getLocale(url: URL | string): Locale {
    const pathname = typeof url === "string" ? url : url.pathname;
    const first = pathname.split("/").filter(Boolean)[0];
    return first !== undefined && isLocale(first) && first !== defaultLocale ? first : defaultLocale;
}

/**
 * Ruta canónica: sin prefijo de idioma y con los slugs en español.
 * `/en/about` → `/about`; `/en/transparency` → `/transparencia`; `/en` → `/`.
 *
 * Es la clave con la que se identifica «la misma página» entre idiomas, así
 * que de ella dependen los `hreflang`, el selector de idioma y cualquier
 * comparación de rutas.
 */
export function stripLocale(pathname: string): string {
    const segments = pathname.split("/").filter(Boolean);
    const first = segments[0];
    if (first !== undefined && isLocale(first) && first !== defaultLocale) segments.shift();

    const withoutLocale = segments.length === 0 ? "/" : `/${segments.join("/")}`;
    return CANONICAL_PATHS.get(withoutLocale) ?? withoutLocale;
}

/**
 * La misma ruta en el idioma pedido. Acepta rutas ya prefijadas, así que es
 * idempotente: `localizePath("/en/about", "en")` sigue siendo `/en/about`.
 * Las URL absolutas, los anclas sueltas y los `mailto:` se devuelven intactos.
 */
export function localizePath(path: string, locale: Locale): string {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(path)) return path;

    const [pathnameRaw, ...rest] = path.split(/(?=[?#])/);
    const suffix = rest.join("");
    const canonical = stripLocale(pathnameRaw || "/");
    const pathname = (locale === defaultLocale ? canonical : TRANSLATED_PATHS[canonical]?.[locale]) ?? canonical;
    const trailing = pathnameRaw.endsWith("/") && pathname !== "/" ? "/" : "";

    if (locale === defaultLocale) return `${pathname}${trailing}${suffix}`;
    return pathname === "/" ? `/${locale}/${suffix}` : `/${locale}${pathname}${trailing}${suffix}`;
}

/** Las dos versiones de la página actual, para los `hreflang` del <head>. */
export function alternatePaths(url: URL | string): Array<{ locale: Locale; path: string }> {
    const pathname = typeof url === "string" ? url : url.pathname;
    return locales.map((locale) => ({ locale, path: localizePath(pathname, locale) }));
}

/**
 * Traductor de las cadenas de interfaz del repositorio.
 *
 *   const t = useTranslations(locale);
 *   t("nav.home")                          → "Inicio" | "Home"
 *   t("nav.submenuOf", { title: "Proyectos" })
 *
 * Si una clave falta en inglés cae al español en vez de romper la página:
 * un texto sin traducir es un defecto visible y corregible; una excepción en
 * build deja el sitio entero fuera.
 */
export function useTranslations(locale: Locale) {
    return function t(key: UiKey, params?: Record<string, string | number>): string {
        const value: string = ui[locale][key] ?? ui[defaultLocale][key];
        if (!params) return value;
        return value.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));
    };
}

export { ui };
export type { UiKey };
