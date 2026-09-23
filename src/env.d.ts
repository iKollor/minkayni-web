/// <reference types="astro/client" />

declare global {
    interface Window {
        __SMOOTH_CREATED__?: boolean;
        /** Guarda anti-doble-inicialización de la animación de #moments. */
        __MOMENTS_ANIM__?: boolean;
        toggleGrain?: () => void;
        /** La define FontFaces.astro cuando ya ha declarado las @font-face. */
        fontsDeclared?: Promise<void>;
        /** La define layouts/lib/head.astro: ejecuta fn cuando el LCP ya está anotado. */
        trasLcp?: (fn: () => void) => void;
        /** La define Analytics.astro; no existe si la medición está apagada. */
        gtag?: (...args: unknown[]) => void;
    }
    /** Eventos propios del sitio, para que addEventListener los tipe. */
    interface WindowEventMap {
        /** Emitido por el menú (SiteMenu.tsx) cuando el menú se abre o se cierra. */
        "menu:state": CustomEvent<{ open: boolean }>;
    }

    interface ImportMetaEnv {
        readonly STRAPI_URL: string;
        readonly STRAPI_TOKEN: string;
        readonly STRAPI_STRICT?: "true" | "false";
        /** Clave de las teselas CARTO. Lleva prefijo PUBLIC_ porque acaba en el navegador. */
        readonly PUBLIC_CARTO_KEY?: string;
        readonly STRAPI_CODEGEN_DEBUG?: "0" | "1";
        /** Origen público de los medios (proxy /media); ver utils/media-url.ts. */
        readonly PUBLIC_MEDIA_ORIGIN?: string;
        readonly PUBLIC_HOME_INTRO?: string;
        /** Propiedad de Google Analytics 4. Por defecto, la de la fundación. */
        readonly PUBLIC_GA_MEASUREMENT_ID?: string;
        /** Conversiones de Google Ads (AW-…), si algún día se enlaza aparte. */
        readonly PUBLIC_ADS_CONVERSION_ID?: string;
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}

export {};

/* Directiva propia `client:lcp` (src/directives/lcp.ts). */
declare module "astro" {
    interface AstroClientDirectives {
        "client:lcp"?: boolean;
    }
}
