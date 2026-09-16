/// <reference types="astro/client" />

declare global {
    interface Window {
        __SMOOTH_CREATED__?: boolean;
        /** Guarda anti-doble-inicialización de la animación de #moments. */
        __MOMENTS_ANIM__?: boolean;
        toggleGrain?: () => void;
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
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}

export {};
