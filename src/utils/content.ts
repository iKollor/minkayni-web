/* ──────────────────────────────────────────────────────────────────────────
   withFallback(): mezcla el contenido que llega de Strapi sobre el fallback
   local de la página.

   Reglas:
   - null/undefined/"" en el CMS → se conserva el valor del fallback.
   - Objetos → merge recursivo clave por clave.
   - Arrays → si el CMS trae elementos, REEMPLAZAN al fallback completo
     (el orden y la cantidad los decide el editor); si viene vacío o nulo,
     se conserva el fallback.
   El resultado siempre tiene la forma del fallback (T), por lo que las
   plantillas pueden tratar los campos del fallback como presentes.
─────────────────────────────────────────────────────────────────────────── */

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const mergeValue = (fallback: unknown, incoming: unknown): unknown => {
    if (incoming === null || incoming === undefined) return fallback;

    if (typeof incoming === "string") {
        return incoming.trim() ? incoming : fallback;
    }

    if (Array.isArray(incoming)) {
        const cleaned = incoming.filter((item) => item !== null && item !== undefined);
        return cleaned.length ? cleaned : fallback;
    }

    if (isPlainObject(incoming)) {
        if (!isPlainObject(fallback)) return incoming;
        const out: PlainObject = { ...fallback };
        for (const key of Object.keys(incoming)) {
            out[key] = mergeValue(fallback[key], incoming[key]);
        }
        return out;
    }

    // number | boolean | resto de primitivos
    return incoming;
};

export function withFallback<T>(fallback: T, incoming: unknown): T {
    return mergeValue(fallback, incoming) as T;
}
