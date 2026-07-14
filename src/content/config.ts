// src/content/config.ts — versión simplificada
import { defineCollection } from "astro:content";
import type { Loader } from "astro/loaders";
import { strapiLoader } from "../utils/loaders/strapi-loader";
import { navigationLoader } from "../utils/loaders/strapi-navigation-loader";
import { PostSchema, HomepageSchema, FooterSchema } from "../schemas/strapi.graphql.zod";
import { NavigationTreeSchema } from "../schemas/navigation";

const STRAPI_BASE = import.meta.env.STRAPI_URL ?? "";
const STRAPI_TOKEN = import.meta.env.STRAPI_TOKEN ?? "";
const GRAPHQL_ENDPOINT = STRAPI_BASE ? `${STRAPI_BASE.replace(/\/$/, "")}/graphql` : "";

const buildAuthHeaders = (token?: string) => ({
    "Content-Type": "application/json",
    "apollo-require-preflight": "true",
    "x-apollo-operation-name": "ValidateConnection",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

type ValidateResult = { ok: boolean; status?: number; message?: string; elapsedMs: number };

export async function validateStrapiConnection(url = GRAPHQL_ENDPOINT, token = STRAPI_TOKEN, timeoutMs = 8000): Promise<ValidateResult> {
    const start = Date.now();
    if (!url || !url.startsWith("http")) return { ok: false, message: "Endpoint inválido o vacío", elapsedMs: Date.now() - start };

    const headers = buildAuthHeaders(token);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);

    try {
        const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ query: "query Ping { __typename }" }), signal: ac.signal });
        clearTimeout(timer);

        const status = res.status;
        const text = await res.text();
        let json: any = null;
        try {
            json = text ? JSON.parse(text) : null;
        } catch {
            return { ok: false, status, message: `Respuesta no JSON (${status}): ${text.slice(0, 200)}`, elapsedMs: Date.now() - start };
        }

        if (!res.ok) return { ok: false, status, message: `HTTP ${status}: ${JSON.stringify(json)?.slice(0, 300)}`, elapsedMs: Date.now() - start };

        if (json?.data?.__typename === "Query") return { ok: true, status, elapsedMs: Date.now() - start };

        if (json?.errors?.length) return { ok: false, status, message: `GraphQL errors: ${JSON.stringify(json.errors)}`, elapsedMs: Date.now() - start };

        return { ok: false, status, message: `Respuesta inesperada: ${JSON.stringify(json)?.slice(0, 300)}`, elapsedMs: Date.now() - start };
    } catch (err: any) {
        clearTimeout(timer);
        const msg = err?.name === "AbortError" ? `Timeout después de ${timeoutMs}ms` : String(err?.message || err);
        return { ok: false, message: msg, elapsedMs: Date.now() - start };
    }
}

const check = await validateStrapiConnection(GRAPHQL_ENDPOINT, STRAPI_TOKEN, 3000);
const strictStrapi = import.meta.env.STRAPI_STRICT === "true";
if (!check.ok && strictStrapi) throw new Error(check.message ?? "Strapi connection failed");

const preserveCachedContent = (name: string): Loader => ({
    name,
    async load({ logger }) {
        logger.warn(`[${name}] Strapi no está disponible; se conserva el contenido local existente.`);
    },
});

const contentCacheMs = import.meta.env.DEV ? 15 * 60 * 1000 : 0;

const clientHeaders = GRAPHQL_ENDPOINT ? { endpoint: GRAPHQL_ENDPOINT, headers: buildAuthHeaders(STRAPI_TOKEN) } : { endpoint: GRAPHQL_ENDPOINT };

const posts = defineCollection({
    loader: check.ok ? strapiLoader({ mode: "collection", rootField: "posts", client: clientHeaders, depth: 2, cacheDurationInMs: contentCacheMs }) : preserveCachedContent("posts"),
    schema: PostSchema(),
});

const homepage = defineCollection({
    loader: check.ok ? strapiLoader({ mode: "single", rootField: "homepage", client: clientHeaders, depth: 2, cacheDurationInMs: contentCacheMs, idResolver: () => "homepage" }) : preserveCachedContent("homepage"),
    schema: HomepageSchema(),
});

const footer = defineCollection({
    loader: check.ok ? strapiLoader({ mode: "single", rootField: "footer", client: clientHeaders, depth: 2, cacheDurationInMs: contentCacheMs, idResolver: () => "footer" }) : preserveCachedContent("footer"),
    schema: FooterSchema(),
});

const navigationHeader = defineCollection({
    loader: check.ok ? navigationLoader({ slug: "header", locale: "es", url: STRAPI_BASE, token: STRAPI_TOKEN, cacheMs: contentCacheMs }) : preserveCachedContent("navigationHeader"),
    schema: NavigationTreeSchema,
});

export const collections = { posts, homepage, navigationHeader, footer };
