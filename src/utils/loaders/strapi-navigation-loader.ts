// src/utils/loaders/navigation-loader.ts
import type { Loader, LoaderContext } from "astro/loaders";

type Opts = {
    slug?: string;
    locale?: string;
    url: string; // STRAPI_URL sin / final, ej: https://cms.tuapp.com
    token?: string;
    cacheMs?: number;
};

export function navigationLoader({ slug = "header", locale = "es", url, token, cacheMs = 0 }: Opts): Loader {
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

            const endpoint = `${url}/api/navigation/render/${encodeURIComponent(slug)}` + `?type=TREE&menu=true&locale=${encodeURIComponent(locale)}`;

            const res = await fetch(endpoint, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) {
                const body = await res.text().catch(() => "");
                throw new Error(`Navigation fetch failed: ${res.status} ${body}`);
            }

            const data = await res.json();
            const id = `navigation:${slug}:${locale}`;
            const parsed = await parseData({ id, data });
            store.set({ id, digest: generateDigest(parsed), data: parsed });
            meta.set("lastSynced", String(Date.now()));
        },
        schema() {
            // Import diferido para evitar ciclos
            const { NavigationTreeSchema } = require("../../schemas/navigation");
            return NavigationTreeSchema;
        },
    };
}
