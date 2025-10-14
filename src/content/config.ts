// src/content/config.ts
import { defineCollection } from "astro:content";
import { strapiLoader } from "../utils/loaders/strapi-loader";
// Tus schemas generados (en tu caso funciones):
import { PostSchema, HomepageSchema, FooterSchema } from "../schemas/strapi.graphql.zod";
import { navigationLoader } from "../utils/loaders/strapi-navigation-loader";
import { NavigationTreeSchema } from "../schemas/navigation";

const endpoint = (import.meta.env.STRAPI_URL ?? "") + "/graphql";
const token = import.meta.env.STRAPI_TOKEN ?? "";

// Construye headers consistentes con tu gfetch del loader
function buildAuthHeaders(t?: string): Record<string, string> {
    return {
        "Content-Type": "application/json",
        "apollo-require-preflight": "true",
        "x-apollo-operation-name": "ValidateConnection",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
}

type ValidateResult = {
    ok: boolean;
    status?: number;
    message?: string;
    elapsedMs: number;
};

let headers;

export async function validateStrapiConnection(url: string = endpoint, t: string = token, timeoutMs = 8000): Promise<ValidateResult> {
    const started = Date.now();
    if (!url || !url.startsWith("http")) {
        return {
            ok: false,
            message: "Endpoint inválido o vacío",
            elapsedMs: Date.now() - started,
        };
    }

    headers = buildAuthHeaders(t);
    const body = {
        query: "query Ping { __typename }",
        operationName: "Ping",
    };

    // Timeout con AbortController
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);

    try {
        console.log("Using Strapi endpoint:", url);
        console.log("Using Strapi token:", t ? "****" : "No token provided");

        const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: ac.signal,
        });

        clearTimeout(timer);

        const status = res.status;
        let json: any = null;
        try {
            json = await res.json();
        } catch {
            // si no es JSON, intenta texto para depurar
            const text = await res.text().catch(() => "");
            return {
                ok: false,
                status,
                message: `Respuesta no JSON (${status}): ${text?.slice(0, 200)}`,
                elapsedMs: Date.now() - started,
            };
        }

        if (!res.ok) {
            return {
                ok: false,
                status,
                message: `HTTP ${status}: ${JSON.stringify(json)?.slice(0, 300)}`,
                elapsedMs: Date.now() - started,
            };
        }

        // Validación mínima esperada
        if (json?.data?.__typename === "Query") {
            console.log("✅ Strapi connection validated successfully!");
            return { ok: true, status, elapsedMs: Date.now() - started };
        }

        // Si viene errors de Apollo
        if (json?.errors?.length) {
            return {
                ok: false,
                status,
                message: `GraphQL errors: ${JSON.stringify(json.errors)}`,
                elapsedMs: Date.now() - started,
            };
        }

        return {
            ok: false,
            status,
            message: `Respuesta inesperada: ${JSON.stringify(json)?.slice(0, 300)}`,
            elapsedMs: Date.now() - started,
        };
    } catch (err: any) {
        clearTimeout(timer);
        const msg = err?.name === "AbortError" ? `Timeout después de ${timeoutMs}ms` : String(err?.message || err);
        return { ok: false, message: msg, elapsedMs: Date.now() - started };
    }
}

// (Opcional) Asegura la conexión al iniciar y falla en build si no valida
const check = await validateStrapiConnection();
if (!check.ok) {
    console.error("❌ Strapi connection is invalid.", check);
    throw new Error(check.message ?? "Strapi connection failed");
} else {
    console.log(`✅ Strapi connection is valid. (${check.elapsedMs}ms)`);
}

const posts = defineCollection({
    loader: strapiLoader({
        mode: "collection",
        rootField: "posts",
        client: { endpoint, headers },
        depth: 2,
        cacheDurationInMs: 0,
    }),
    schema: PostSchema(),
});

const homepage = defineCollection({
    loader: strapiLoader({
        mode: "single",
        rootField: "homepage",
        client: { endpoint, headers },
        depth: 2,
        cacheDurationInMs: 0,
        idResolver: () => "homepage",
    }),
    schema: HomepageSchema(),
});

const footer = defineCollection({
    loader: strapiLoader({
        mode: "single",
        rootField: "footer",
        client: { endpoint, headers },
        depth: 2,
        cacheDurationInMs: 0,
        idResolver: () => "footer",
    }),
    schema: FooterSchema(),
});

const navigationHeader = defineCollection({
    loader: navigationLoader({
        slug: "header",
        locale: "es",
        url: import.meta.env.STRAPI_URL,
        token: import.meta.env.STRAPI_TOKEN,
        cacheMs: 0,
    }),
    schema: NavigationTreeSchema,
});

export const collections = { posts, homepage, navigationHeader, footer };
