/* ──────────────────────────────────────────────────────────────────────────
   loadLayoutContent(): lo que los dos layouts necesitan antes de pintar nada
   —menú de cabecera, pie y ajustes globales— resuelto para un idioma.

   Vivía duplicado en MainLayout.astro y PageLayout.astro. Al añadir el inglés
   la duplicación dejaba de ser inocente: cualquier regla de respaldo escrita
   en un layout y no en el otro se convertía en una diferencia silenciosa
   entre la portada y las páginas interiores.
─────────────────────────────────────────────────────────────────────────── */
import { withFallback } from "./content";
import { loadPageContent, readEntry } from "./page-content";
import {
    fallbackFooter,
    fallbackNavigation,
    fallbackNavigationEn,
    localizeNavigation,
    repararRutas,
    withBatucadaProject,
} from "../data/site";
import { globalFallback } from "../data/pages/global";
import { projectsFallback } from "../data/pages/projects";
import { defaultLocale, type Locale } from "../i18n";
import { localizeLinks } from "./localize-links";
import type { NavTree } from "../schemas/navigation";
import type { FooterContent } from "../schemas/pages.zod";

const loadNavigation = async (locale: Locale): Promise<NavTree> => {
    const collection = locale === defaultLocale ? "navigationHeader" : "navigationHeaderEn";
    const tree = (await readEntry(collection, `navigation:header:${locale}`)) as NavTree | undefined;

    /* Una lista vacía no es un menú: es el árbol de ese idioma sin crear en el
       plugin Navigation. Se trata igual que si Strapi no respondiera. */
    const source = tree && tree.length > 0 ? tree : locale === defaultLocale ? fallbackNavigation : fallbackNavigationEn;

    /* `repararRutas` primero: las rutas del CMS llegan sin prefijo de idioma,
       que es justo como las guarda la tabla de redirecciones. */
    return localizeNavigation(repararRutas(withBatucadaProject(source)), locale);
};

const loadFooter = async (locale: Locale): Promise<FooterContent> => {
    const spanish = await readEntry("footer", "footer");
    const base = spanish === undefined ? fallbackFooter : withFallback(fallbackFooter, spanish);

    if (locale === defaultLocale) return base;

    const translated = await readEntry("footerEn", "footer");
    const merged = translated === undefined ? base : withFallback(base, translated);

    /* El CTA «Quiero unirme» apunta a /about#contacto en los dos idiomas: en
       inglés tiene que llevar a /en/about#contacto. */
    return localizeLinks(merged, locale);
};

export async function loadLayoutContent(locale: Locale) {
    const [navHeader, footer, site, projectsPage] = await Promise.all([
        loadNavigation(locale),
        loadFooter(locale),
        loadPageContent("globalSettings", globalFallback, locale),
        /* Los proyectos alimentan el megamenú de «Proyectos» en todas las páginas. */
        loadPageContent("projectsPage", projectsFallback, locale),
    ]);

    return { navHeader, footer, site, projects: projectsPage.projects };
}
