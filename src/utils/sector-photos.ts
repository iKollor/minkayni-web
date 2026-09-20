/* ──────────────────────────────────────────────────────────────────────────
   Fotos de un sector del mapa de Batucada, listas para el navegador.

   El componente Sector de Strapi tiene un campo `photos`; esta función lo
   traduce a lo que necesitan la polaroid del mapa (una miniatura) y el visor
   a pantalla completa (la grande, con candidatas por ancho de pantalla).
   Todo pasa por el proxy /media, como el resto de imágenes del CMS.

   Mientras un barrio no tenga fotos propias se usan las genéricas del
   proyecto, que viven en /public y no dependen del CMS. */
import { strapiMediaUrl, strapiMediaSrcSet } from "./media-url";

export type ViewerPhoto = {
    /** Versión pequeña: la polaroid sobre el mapa. */
    thumb: string;
    /** Versión grande: la del visor. */
    full: string;
    /** Candidatas del visor; vacío en las genéricas, que tienen un solo tamaño. */
    srcset: string;
    alt: string;
    /** Leyenda que escribe quien sube la foto (campo Caption de Strapi). */
    caption?: string;
    width?: number;
    height?: number;
};

type CmsPhoto =
    | {
          url?: string | null;
          alternativeText?: string | null;
          caption?: string | null;
          width?: number | null;
          height?: number | null;
      }
    | null
    | undefined;

const THUMB_WIDTH = 480;
const FULL_WIDTH = 1600;
const VIEWER_WIDTHS = [640, 960, 1280, 1600];

/** Tope por sector: el visor es una galería corta, no un archivo fotográfico. */
export const MAX_SECTOR_PHOTOS = 8;

/** Las tres fotos del proyecto que sirven a cualquier sector sin fotos propias. */
export const genericSectorPhotos = (alt: string): ViewerPhoto[] =>
    [1, 2, 3].map((n) => ({
        thumb: `/batucada/hover-${n}.webp`,
        full: `/batucada/hover-${n}.webp`,
        srcset: "",
        alt,
        width: 400,
        height: 240,
    }));

/**
 * Fotos de un sector, o las genéricas si aún no tiene las suyas.
 *
 * @param photos     Campo `photos` del sector tal y como llega de Strapi.
 * @param strapiBase Origen del CMS (`STRAPI_URL`), que resuelve las rutas.
 * @param alt        Texto alternativo de respaldo, ya traducido, para las
 *                   fotos que el CMS no describa.
 */
export function sectorPhotos(photos: readonly CmsPhoto[] | null | undefined, strapiBase: string, alt: string): ViewerPhoto[] {
    const resolved: ViewerPhoto[] = [];

    for (const photo of photos ?? []) {
        if (resolved.length >= MAX_SECTOR_PHOTOS) break;
        const url = photo?.url ?? "";
        if (!url) continue;

        const full = strapiMediaUrl(url, strapiBase, FULL_WIDTH);
        const thumb = strapiMediaUrl(url, strapiBase, THUMB_WIDTH);
        /* Una URL que el proxy no reconoce (otro dominio, ruta con `..`)
           devuelve cadena vacía: esa foto no se publica. */
        if (!full || !thumb) continue;

        resolved.push({
            thumb,
            full,
            srcset: strapiMediaSrcSet(url, strapiBase, VIEWER_WIDTHS),
            alt: photo?.alternativeText?.trim() || alt,
            /* Leyenda y texto alternativo no son lo mismo: el alternativo
               describe la foto a quien no la ve, la leyenda la cuenta a todo
               el mundo. Por eso no se copia el uno en el otro. */
            caption: photo?.caption?.trim() || undefined,
            width: photo?.width ?? undefined,
            height: photo?.height ?? undefined,
        });
    }

    return resolved.length ? resolved : genericSectorPhotos(alt);
}
