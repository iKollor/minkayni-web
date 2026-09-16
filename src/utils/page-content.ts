/* ──────────────────────────────────────────────────────────────────────────
   loadPageContent(): patrón único de las páginas para leer su single type
   de Strapi y mezclarlo sobre el fallback local.

   const d = await loadPageContent("aboutPage", aboutFallback);
   → d tiene SIEMPRE la forma del fallback (todo presente), con los campos
     que el editor haya llenado en Strapi por encima.

   Con idioma:

   const d = await loadPageContent("aboutPage", aboutFallback, "en");
   → tres capas, de menos a más prioridad:
       1. el fallback local (español, dentro del repositorio),
       2. lo que haya en Strapi en español,
       3. lo que haya en Strapi en inglés.

   El español en medio es deliberado. Mientras una página esté a medio
   traducir, sus campos sin traducir muestran el español VIVO del CMS y no la
   copia del repositorio, que envejece en cuanto alguien edita el CMS. Un
   párrafo en español dentro de la página inglesa es un defecto visible que
   se arregla traduciéndolo; un párrafo desactualizado no se nota y engaña.
─────────────────────────────────────────────────────────────────────────── */
import { getEntry } from "astro:content";
import { getData } from "./i18n";
import { withFallback } from "./content";
import { defaultLocale, type Locale } from "../i18n";
import { localizeLinks } from "./localize-links";

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

/** Nombre de la colección de Astro que guarda este single type en ese idioma. */
const collectionFor = (collection: SingleCollection, locale: Locale): string =>
    locale === defaultLocale ? collection : `${collection}En`;

const readEntry = async (collection: string, id: string): Promise<unknown> => {
    try {
        const entry = await getSingleEntry(collection, id);
        return entry ? getData(entry) : undefined;
    } catch {
        return undefined;
    }
};

/**
 * Superpone la traducción sobre una entrada ya cargada, conservando su tipo.
 *
 *   const homepage = await localizeEntry(await getEntry("homepage", "homepage"), "homepageEn", "homepage", locale);
 *
 * Para las colecciones que no son single types de página y se siguen leyendo
 * con `getEntry`. Los campos vacíos en inglés conservan el español, igual que
 * en `loadPageContent`.
 */
export async function localizeEntry<E extends { collection: string; data: unknown }>(
    base: E | undefined,
    translatedCollection: string,
    id: string,
    locale: Locale
): Promise<E | undefined> {
    if (locale === defaultLocale || base === undefined) return base;

    const translated = await readEntry(translatedCollection, id);
    if (translated === undefined) return { ...base, data: localizeLinks(base.data, locale) };

    return { ...base, data: localizeLinks(withFallback(base.data, translated), locale) };
}

export async function loadPageContent<T>(
    collection: SingleCollection,
    fallback: T,
    locale: Locale = defaultLocale
): Promise<T> {
    const id = ENTRY_IDS[collection];

    const spanish = await readEntry(collection, id);
    const base = spanish === undefined ? fallback : withFallback(fallback, spanish);

    if (locale === defaultLocale) return base;

    const translated = await readEntry(collectionFor(collection, locale), id);
    const merged = translated === undefined ? base : withFallback(base, translated);

    /* Los enlaces internos del CMS se escriben sin prefijo; aquí se les pone. */
    return localizeLinks(merged, locale);
}
