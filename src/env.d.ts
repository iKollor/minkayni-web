/// <reference types="astro/client" />

declare global {
    interface Window {
        __SMOOTH_CREATED__?: boolean;
        toggleGrain?: () => void;
    }
    interface ImportMetaEnv {
        readonly STRAPI_TOKEN: string;
        readonly STRAPI_URL: string;
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }

    interface StrapiMediaFormat {
        name: string;
        hash: string;
        ext: string;
        mime: string;
        width: number;
        height: number;
        size: number;
        path: string | null;
        url: string;
    }

    interface StrapiMediaData {
        id: number;
        documentId: string;
        name: string;
        alternativeText: string;
        caption: string;
        width: number;
        height: number;
        formats: {
            thumbnail?: StrapiMediaFormat;
            medium?: StrapiMediaFormat;
            small?: StrapiMediaFormat;
            [key: string]: StrapiMediaFormat | undefined;
        };
        hash: string;
        ext: string;
        mime: string;
        size: number;
        url: string;
        createdAt: string;
        updatedAt: string;
        [key: string]: any; // Para otros campos opcionales
    }

    interface StrapiMediaField {
        data: StrapiMediaData | null;
    }
}

export {};
