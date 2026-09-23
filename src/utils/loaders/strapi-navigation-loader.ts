import type { Loader, LoaderContext } from "astro/loaders";
import { excerpt, strapiFetch } from "../strapi-client";

type Opts = {
    slug?: string;
    locale?: string;
    /** Origen de Strapi; se tolera la barra final. */
    url: string;
    token?: string;
    cacheMs?: number;
    /** Ver `strict` en strapi-loader.ts. */
    strict?: boolean;
};

const NAVIGATION_TIMEOUT_MS = 8000;

export function navigationLoader({ slug = "header", locale = "es", url, token, cacheMs = 0, strict = false }: Opts): Loader {
    return {
        name: `navigation:${slug}:${locale}`,
        async load(ctx: LoaderContext) {
            const { store, meta, generateDigest, parseData, logger } = ctx;

            if (cacheMs) {
                const last = meta.get("lastSynced");
                if (last && Date.now() - Number(last) < cacheMs) {
                    logger.info(`[nav:${slug}] cache hit`);
                    return;
                }
            }

            const endpoint = `${url.replace(/\/+$/, "")}/api/navigation/render/${encodeURIComponent(slug)}` + `?type=TREE&menu=true&locale=${encodeURIComponent(locale)}`;
            try {
                const res = await strapiFetch(endpoint, {
                    method: "GET",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    timeoutMs: NAVIGATION_TIMEOUT_MS,
                    maxAttempts: 2,
                    secret: token,
                });
                if (!res.ok) throw new Error(`Navigation fetch failed: ${res.status} ${excerpt(res.text, token, 500)}`);

                const data = JSON.parse(res.text) as Record<string, unknown>;
                const id = `navigation:${slug}:${locale}`;
                const parsed = await parseData({ id, data });
                store.set({ id, digest: generateDigest(parsed), data: parsed });
                meta.set("lastSynced", String(Date.now()));
            } catch (error) {
                if (strict) throw error;
                const message = error instanceof Error ? error.message : String(error);
                logger.warn(`[nav:${slug}] No se pudo sincronizar; se conserva la caché local. ${message}`);
            }
        },
    };
}
