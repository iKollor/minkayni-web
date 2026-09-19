/* ──────────────────────────────────────────────────────────────────────────
   Vista previa de borradores del constructor, para el botón «Vista previa»
   del panel de Strapi.

   El sitio público es estático: una subpágina existe solo si estaba publicada
   cuando se construyó. Para ver un borrador hace falta generar la página en el
   momento, así que esto solo corre en la build de vista previa
   (`PREVIEW_MODE=1`, ver astro.config.ts), que se despliega como un servicio
   aparte. Producción no incluye esta ruta.

   Todo se lee en tiempo de petición desde el entorno del proceso: el mismo
   contenedor sirve cualquier borrador sin reconstruirse.
─────────────────────────────────────────────────────────────────────────── */
import { timingSafeEqual } from "node:crypto";
import { builderPageSelection } from "../content.config";
import { BuilderPageSchema, type BuilderPage } from "../schemas/pages.zod";
import { defaultLocale, getLocale, type Locale } from "../i18n";
import { localizeBuilderPage } from "./builder-pages";

const env = (name: string): string => (process.env[name] ?? import.meta.env[name] ?? "").toString().trim();

/** El CMS manda la clave en la URL; se compara en tiempo constante. */
export function previewSecretMatches(given: string | null): boolean {
    const expected = env("PREVIEW_SECRET");
    if (!expected || !given) return false;
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

/** Cabeceras de toda respuesta de la vista previa. */
export function previewHeaders(): Record<string, string> {
    let cmsOrigin = "";
    try {
        cmsOrigin = new URL(env("STRAPI_URL")).origin;
    } catch {
        /* sin STRAPI_URL válida, solo el propio origen puede enmarcarla */
    }
    return {
        /* Siempre el borrador del momento, nunca una copia en caché. */
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
        /* Solo el panel de Strapi puede mostrarla en su iframe. */
        "Content-Security-Policy": `frame-ancestors 'self'${cmsOrigin ? ` ${cmsOrigin}` : ""}`,
        /* La clave viaja en la URL: que no salga en el Referer de los enlaces. */
        "Referrer-Policy": "no-referrer",
    };
}

const QUERY = `
    query PreviewPage($documentId: ID!, $status: PublicationStatus, $locale: I18NLocaleCode) {
        page(documentId: $documentId, status: $status, locale: $locale) {
            ${builderPageSelection}
        }
    }
`;

async function fetchPage(documentId: string, locale: Locale, status: "DRAFT" | "PUBLISHED"): Promise<BuilderPage | null> {
    const base = env("STRAPI_URL").replace(/\/$/, "");
    if (!base) throw new Error("Falta STRAPI_URL en el entorno de la vista previa.");

    const token = env("STRAPI_TOKEN");
    const response = await fetch(`${base}/graphql`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apollo-require-preflight": "true",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: QUERY, variables: { documentId, status, locale } }),
        signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Strapi respondió ${response.status} al pedir el borrador.`);

    const payload = (await response.json()) as { data?: { page?: unknown }; errors?: unknown[] };
    if (payload.errors?.length) throw new Error(`GraphQL: ${JSON.stringify(payload.errors).slice(0, 300)}`);
    if (!payload.data?.page) return null;
    /* El mismo esquema que el loader: la página llega con la forma que espera
       BlockRenderer. */
    return BuilderPageSchema().parse(payload.data.page);
}

/** Borrador (o versión publicada) de una subpágina, en el idioma pedido y con
    la misma mezcla que las rutas publicadas: lo que falte en inglés, en
    español. `null` si el documento no existe. */
export async function fetchBuilderPreview(documentId: string, locale: Locale, status: "DRAFT" | "PUBLISHED"): Promise<BuilderPage | null> {
    const spanish = await fetchPage(documentId, defaultLocale, status);
    if (locale === defaultLocale) return spanish;

    const translation = await fetchPage(documentId, locale, status);
    /* Página creada primero en inglés: no hay base española que completar. */
    if (!spanish) return translation ? localizeBuilderPage(translation, null, locale) : null;
    return localizeBuilderPage(spanish, translation, locale);
}

export type PreviewResult = { page: BuilderPage } | { response: Response };

/** Decide qué responde la ruta: la página a pintar o una respuesta de error
    en texto plano. El idioma sale del prefijo de la URL, como en todo el
    sitio, y `status=published` (que el CMS manda desde la pestaña de lo
    publicado) enseña la versión publicada en vez del borrador. */
export async function resolvePreview(url: URL, documentId: string | undefined): Promise<PreviewResult> {
    const plain = (status: number, body: string): PreviewResult => ({
        response: new Response(body, { status, headers: { ...previewHeaders(), "Content-Type": "text/plain; charset=utf-8" } }),
    });

    if (!previewSecretMatches(url.searchParams.get("secret"))) {
        return plain(401, "Vista previa no autorizada: falta la clave o no coincide con PREVIEW_SECRET.");
    }

    const status = url.searchParams.get("status") === "published" ? "PUBLISHED" : "DRAFT";
    try {
        const page = await fetchBuilderPreview(documentId ?? "", getLocale(url), status);
        return page ? { page } : plain(404, "Este documento no existe o todavía no tiene contenido en este idioma.");
    } catch (error) {
        console.error("[vista previa]", error);
        return plain(502, "No se pudo leer el borrador desde Strapi. Revisa STRAPI_URL y STRAPI_TOKEN del servicio de vista previa.");
    }
}
