/* ──────────────────────────────────────────────────────────────────────────
   Rutas de las subpáginas del constructor (collection type `page` de Strapi),
   compartidas por `/[...slug]` y `/en/[...slug]`.

   La lista de rutas la manda SIEMPRE el español. Si la sacara cada idioma de
   su propia colección, una subpágina sin traducir no existiría en inglés y el
   `hreflang` de la española apuntaría a un 404. Existiendo la ruta, la página
   inglesa muestra el contenido español mientras nadie lo traduzca: el mismo
   criterio que en el resto del sitio.
─────────────────────────────────────────────────────────────────────────── */
import { getCollection } from "astro:content";
import { getData } from "./i18n";
import { withFallback } from "./content";
import { localizeLinks } from "./localize-links";
import { defaultLocale, type Locale } from "../i18n";
import type { BuilderPage } from "../schemas/pages.zod";

/** Rutas propias del sitio que una subpágina jamás debe pisar. */
const RESERVED = new Set([
    "",
    "about",
    "impact",
    "projects",
    "batucada-popular",
    "index",
    "admin",
    "api",
    "media",
    "batucada",
    /* Reservada desde que existe el inglés: `/en` es el prefijo de idioma, y
       una subpágina con ese slug se lo comería entero. */
    "en",
]);

const readCollection = async (name: "builderPages" | "builderPagesEn"): Promise<BuilderPage[]> => {
    try {
        const entries = await getCollection(name as "builderPages");
        return entries.map((entry) => getData(entry) as BuilderPage);
    } catch {
        return [];
    }
};

const isPublishedRoute = (page: BuilderPage): page is BuilderPage & { slug: string } => {
    const slug = page?.slug?.trim();
    return Boolean(slug) && !RESERVED.has(slug as string) && Boolean(page.publishedAt);
};

export async function builderPagePaths(locale: Locale) {
    const spanish = (await readCollection("builderPages")).filter(isPublishedRoute);

    if (locale === defaultLocale) {
        return spanish.map((page) => ({ params: { slug: page.slug }, props: { page } }));
    }

    const translated = new Map((await readCollection("builderPagesEn")).map((page) => [page.slug?.trim(), page]));

    return spanish.map((page) => {
        const match = translated.get(page.slug);
        const merged = match ? withFallback(page, match) : page;
        /* Igual que en loadPageContent: los enlaces internos que escribe el
           editor van sin prefijo y se les pone aquí. */
        return { params: { slug: page.slug }, props: { page: localizeLinks(merged, locale) } };
    });
}
