/* ──────────────────────────────────────────────────────────────────────────
   strapiFetch(): la única forma en que el build habla con Strapi.

   La usan la validación de conexión, el loader GraphQL y el de navegación.
   Antes eran tres `fetch` con tres políticas distintas (8 s con reintentos,
   30 s sin ellos, 8 s fijos) y solo uno ocultaba el token en los mensajes.

   - Tiempo límite por intento.
   - Reintenta solo lo transitorio: fallos de red, tiempo agotado y los
     estados 408/425/429/5xx de pasarela. Un 401 o un error GraphQL no se
     arreglan repitiendo la petición.
   - No lanza por un estado HTTP: devuelve la respuesta y decide quien llama.
     Sí lanza cuando no llega respuesta, con el token ya redactado.
─────────────────────────────────────────────────────────────────────────── */

const TRANSIENT_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

export type StrapiFetchOptions = {
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
    timeoutMs: number;
    maxAttempts?: number;
    retryDelayMs?: number;
    /** Valor que nunca debe aparecer en un mensaje de error (el token). */
    secret?: string;
    fetchImpl?: typeof fetch;
};

export type StrapiResponse = {
    ok: boolean;
    status: number;
    statusText: string;
    text: string;
    attempts: number;
};

const wait = (delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs));

export const redact = (value: unknown, secret?: string): string => {
    const message = String(value ?? "");
    return secret ? message.split(secret).join("[REDACTED]") : message;
};

/** Recorta un cuerpo de respuesta para un mensaje de error legible y sin secretos. */
export const excerpt = (text: string, secret?: string, max = 300): string => redact(text.slice(0, max), secret);

export async function strapiFetch(
    url: string,
    { method = "POST", headers, body, timeoutMs, maxAttempts = 1, retryDelayMs = 250, secret, fetchImpl }: StrapiFetchOptions
): Promise<StrapiResponse> {
    const doFetch = fetchImpl ?? globalThis.fetch;
    const attemptLimit = Math.max(1, maxAttempts);

    for (let attempt = 1; ; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const retry = attempt < attemptLimit;

        try {
            const response = await doFetch(url, { method, headers, body, signal: controller.signal });
            const text = await response.text();
            if (!response.ok && TRANSIENT_STATUSES.has(response.status) && retry) {
                if (retryDelayMs > 0) await wait(retryDelayMs * attempt);
                continue;
            }
            return { ok: response.ok, status: response.status, statusText: response.statusText, text, attempts: attempt };
        } catch (error) {
            if (retry) {
                if (retryDelayMs > 0) await wait(retryDelayMs * attempt);
                continue;
            }
            const isAbort = error instanceof Error && error.name === "AbortError";
            throw new Error(redact(isAbort ? `Timeout después de ${timeoutMs}ms.` : error instanceof Error ? error.message : error, secret));
        } finally {
            clearTimeout(timer);
        }
    }
}

/** Cabeceras comunes de una petición GraphQL a Strapi (Apollo exige el preflight). */
export const graphqlHeaders = (operationName: string, extra: Record<string, string> = {}): Record<string, string> => ({
    "Content-Type": "application/json",
    "apollo-require-preflight": "true",
    "x-apollo-operation-name": operationName,
    ...extra,
});
