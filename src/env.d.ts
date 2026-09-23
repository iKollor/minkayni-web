/// <reference types="astro/client" />

declare global {
    interface Window {
        __SMOOTH_CREATED__?: boolean;
        /** Guarda anti-doble-inicialización de la animación de #moments. */
        __MOMENTS_ANIM__?: boolean;
        toggleGrain?: () => void;
        /** La define layouts/lib/head.astro: ejecuta fn cuando el LCP ya está anotado. */
        trasLcp?: (fn: () => void) => void;
        /** La define Analytics.astro; no existe si la medición está apagada. */
        gtag?: (...args: unknown[]) => void;
    }
    /** Eventos propios del sitio, para que addEventListener los tipe. */
    interface WindowEventMap {
        /** Emitido por Menu.astro cuando el menú se abre o se cierra. */
        "menu:state": CustomEvent<{ open: boolean }>;
    }

    interface ImportMetaEnv {
        readonly STRAPI_URL: string;
        readonly STRAPI_TOKEN: string;
        readonly STRAPI_STRICT?: "true" | "false";
        /** Clave de las teselas CARTO. Lleva prefijo PUBLIC_ porque acaba en el navegador. */
        readonly PUBLIC_CARTO_KEY?: string;
        readonly STRAPI_CODEGEN_DEBUG?: "0" | "1";
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
