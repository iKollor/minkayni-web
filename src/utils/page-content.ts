/* ──────────────────────────────────────────────────────────────────────────
   loadPageContent(): patrón único de las páginas para leer su single type
   de Strapi y mezclarlo sobre el fallback local.

   const d = await loadPageContent("aboutPage", aboutFallback);
   → d tiene SIEMPRE la forma del fallback (todo presente), con los campos
     que el editor haya llenado en Strapi por encima.
─────────────────────────────────────────────────────────────────────────── */
import { getEntry } from "astro:content";
import { getData } from "./i18n";
import { withFallback } from "./content";

type SingleCollection =
    | "aboutPage"
    | "impactPage"
    | "projectsPage"
    | "batucadaPage"
    | "batucadaEcosystemPage"
    | "batucadaHistoryPage"
    | "globalSettings";

/** id del documento dentro de la colección (lo fija idResolver en config.ts). */
const ENTRY_IDS: Record<SingleCollection, string> = {
    aboutPage: "aboutPage",
    impactPage: "impactPage",
    projectsPage: "projectsPage",
    batucadaPage: "batucadaPage",
    batucadaEcosystemPage: "batucadaEcosystemPage",
    batucadaHistoryPage: "batucadaHistoryPage",
    globalSettings: "global",
};

export async function loadPageContent<T>(collection: SingleCollection, fallback: T): Promise<T> {
    try {
        const entry = await getEntry(collection as never, ENTRY_IDS[collection] as never);
        if (!entry) return fallback;
        const data = getData(entry as never, "es");
        return withFallback(fallback, data);
    } catch {
        return fallback;
    }
}
