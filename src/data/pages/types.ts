import type { ImageMetadata } from "astro";

/** Forma mínima de un media de Strapi que usan las plantillas. */
export type CmsMedia = {
    url?: string | null;
    alternativeText?: string | null;
    width?: number | null;
    height?: number | null;
} | null;

/** Item con imagen del CMS + asset local de respaldo. */
export type WithLocalImage = {
    image?: CmsMedia;
    localImage?: ImageMetadata;
};
