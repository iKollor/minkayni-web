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
    | "globalSettings"
    | "legalTransparency"
    | "donatePage";

/** id del documento dentro de la colección (lo fija idResolver en config.ts). */
const ENTRY_IDS: Record<SingleCollection, string> = {
    aboutPage: "aboutPage",
    impactPage: "impactPage",
    projectsPage: "projectsPage",
    batucadaPage: "batucadaPage",
    batucadaEcosystemPage: "batucadaEcosystemPage",
    batucadaHistoryPage: "batucadaHistoryPage",
    globalSettings: "global",
    legalTransparency: "legalTransparency",
    donatePage: "donatePage",
};

/** Forma mínima que este helper necesita de una entrada de `astro:content`. */
type SingleEntry = { collection: string; data: Record<string, unknown> };

/* `getEntry` está sobrecargado por colección y no resuelve la sobrecarga
   cuando el nombre es una unión. El tipo concreto de la entrada da igual
   aquí: el valor se reduce de inmediato a la forma del fallback, que es el
   contrato que este helper promete. Un solo cast con nombre, en vez de los
   tres `as never` que además hacían que TS creyera que getEntry era síncrono. */
const getSingleEntry = getEntry as (collection: string, id: string) => Promise<SingleEntry | undefined>;

export async function loadPageContent<T>(collection: SingleCollection, fallback: T): Promise<T> {
    try {
        const entry = await getSingleEntry(collection, ENTRY_IDS[collection]);
        if (!entry) return fallback;
        return withFallback(fallback, getData(entry, "es"));
    } catch {
        return fallback;
    }
}
