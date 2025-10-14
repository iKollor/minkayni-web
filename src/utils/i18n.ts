// src/utils/i18n.ts
/* ──────────────────────────────────────────────────────────────────────────
   getData(): acceso tipado a entries de astro:content con i18n y defaults
   - Arrays: siempre T[] (filtra nullish)
   - Escalares: elimina Maybe; si nullish → usa fallback si se provee, si no:
       • arrays → []
       • otros  → "" (pensado para campos de texto)
   - Fallback tipado por clave (opcional)
   - Helpers: getStr(), getArr()
─────────────────────────────────────────────────────────────────────────── */

type AnyObj = Record<string, any>;
type Bundled<T> = T & { _i18n?: Record<string, T>; _defaultLocale?: string };
type EntryLike = { collection: string; data: unknown };

// Toma el tipo del data del entry concreto E
type EntryDataOf<E> = E extends { data: infer D } ? D : never;

// Quita null/undefined del nivel superior
type NonNullish<T> = Exclude<T, null | undefined>;

// Limpieza genérica:
//  - Si T es array -> limpia ítems nullish
//  - Si no, quita Maybe del valor
type Clean<T> = T extends readonly (infer U)[] | (infer U)[] ? Array<NonNullable<U>> : NonNullish<T>;

const isLocale = (s: string) => /^[a-z]{2}(?:-[A-Za-z]{2})?$/i.test(s);

/**
 * Localizes a single object by merging base properties with a chosen locale slice.
 *
 * @typeParam T - The shape of the resulting object (extends a plain object type).
 *
 * @param obj - Either a plain object of type T or a "bundled" object containing optional
 *              localization metadata. A bundled object is expected to possibly include:
 *              - `_i18n`: a mapping of locale keys to partial overrides for T
 *              - `_defaultLocale`: a default locale key to use when no explicit `locale` is provided
 *
 * @param locale - Optional locale key to prefer when selecting which localized slice to merge.
 *
 * @returns A new object of type T. Behavior:
 * - If `obj` is falsy or not an object, it is returned as-is (cast to T).
 * - If `obj` does not contain `_i18n`, the returned object is the input object with any
 *   internal keys `_i18n` and `_defaultLocale` removed.
 * - If `_i18n` is present, a locale key is chosen with the following precedence:
 *     1. the explicit `locale` argument, if present and `i18n[locale]` exists
 *     2. `obj._defaultLocale`, if present and `i18n[obj._defaultLocale]` exists
 *     3. the first key returned by `Object.keys(i18n)` (if any)
 *   The chosen locale's slice (if any) is merged over the base properties (base properties
 *   take lower precedence). Internal keys `_i18n` and `_defaultLocale` are omitted from the result.
 *
 * @remarks
 * - If a chosen locale exists but its slice is falsy, the function falls back to an empty slice.
 * - The function performs a shallow merge: top-level properties from the chosen locale slice
 *   overwrite those in the base object; nested objects are not deeply merged.
 *
 * @example
 * // Given:
 * // const bundled = {
 * //   id: 1,
 * //   title: "Default title",
 * //   _i18n: {
 * //     es: { title: "Título en español" }
 * //   },
 * //   _defaultLocale: "es"
 * // };
 * // localizeOne(bundled) => { id: 1, title: "Título en español" }
 *
 * @example
 * // If no _i18n is present:
 * // localizeOne({ id: 2, name: "Alice", _i18n: undefined }) => { id: 2, name: "Alice" }
 */
function localizeOne<T extends AnyObj>(obj: Bundled<T> | T, locale?: string): T {
    const o = obj as Bundled<T>;
    if (!o || typeof o !== "object") return o as T;
    // IMPORTANT: if it's an Array, return as-is. Arrays don't carry _i18n metadata
    // and destructuring them into `{ ...rest }` would turn them into plain objects.
    if (Array.isArray(o)) return o as unknown as T;

    const i18n = o._i18n;
    if (!i18n) {
        const { _i18n, _defaultLocale, ...rest } = o as AnyObj;
        return rest as T;
    }

    const chosen = (locale && i18n[locale] && locale) || (o._defaultLocale && i18n[o._defaultLocale] && o._defaultLocale) || Object.keys(i18n)[0];

    const slice = (chosen ? i18n[chosen] : {}) || {};
    const { _i18n, _defaultLocale, ...rest } = o as AnyObj;
    return { ...rest, ...slice } as T;
}

const isEntryLike = (x: any): x is EntryLike => !!x && typeof x === "object" && "collection" in x && "data" in x;

/* ===================== OVERLOADS ===================== */
// ENTRY + KEY (con fallback opcional)
export function getData<E extends EntryLike, K extends keyof EntryDataOf<E>, D extends Clean<EntryDataOf<E>[K]>>(src: E | null | undefined, key: K, locale?: string, fallback?: D): Clean<EntryDataOf<E>[K]> | D;

// ENTRIES[] + KEY (con fallback opcional)
export function getData<E extends EntryLike, K extends keyof EntryDataOf<E>, D extends Clean<EntryDataOf<E>[K]>>(src: Array<E> | null | undefined, key: K, locale?: string, fallback?: D): Array<Clean<EntryDataOf<E>[K]> | D>;

// ENTRY → data localizado (sin clave) — **garantiza retorno** (lanza si no existe)
export function getData<E extends EntryLike>(src: E | null | undefined, locale?: string): EntryDataOf<E>;

// ENTRIES[] → data[] localizado (sin clave) — **garantiza retorno** (lanza si no existe)
export function getData<E extends EntryLike>(src: Array<E> | null | undefined, locale?: string): Array<EntryDataOf<E>>;

/* ===================== IMPLEMENTACIÓN ===================== */
export function getData(src: any, a?: any, b?: any, c?: any): any {
    const isArr = Array.isArray(src);

    let key: string | undefined;
    let locale: string | undefined;
    let fallback: unknown;

    // Parseo de sobrecargas
    if (typeof a === "string" && typeof b === "string") {
        // (entry, "Key", "es", [fallback?])  OR  (entries[], "Key", "es", [fallback?])
        key = a;
        locale = b;
        fallback = c;
    } else if (typeof a === "string") {
        // (entry, "Key", [fallback?])  OR  (entry, "es")
        if (isLocale(a)) {
            locale = a;
            fallback = b;
        } else {
            key = a;
            // b puede ser locale o fallback
            if (typeof b === "string" && isLocale(b)) {
                locale = b;
                fallback = c;
            } else {
                fallback = b;
            }
        }
    } else if (a !== undefined) {
        // futuro: opciones; ignorado por ahora
    }

    // ⚠️ Cambio clave: si NO hay clave y src es nullish → lanzamos error (fail-fast, evita `undefined` en el tipo)
    if (!key && src == null) {
        throw new Error("getData(entry): entry not found (called without key)");
    }

    // Con clave: si src nullish → devuelve defaults ([], "" o fallback)
    if (src == null) return isArr ? [] : undefined;

    const project = (entry: any) => {
        const data = isEntryLike(entry) ? entry.data : entry;
        const localized = localizeOne<any>(data, locale);

        // Sin clave: retorna todo el data localizado (no nullish aquí por el guard anterior)
        if (!key) return localized;

        const out = localized?.[key];

        // Si es array → normaliza a [] y limpia ítems nullish
        if (Array.isArray(out)) {
            const cleaned = out.filter((x) => x != null);
            if (cleaned.length === 0 && out.length === 0 && fallback !== undefined) return fallback;
            return cleaned;
        }

        // Nullish → usar fallback si existe; si no, defaults por categoría (string vacío)
        if (out == null) {
            if (fallback !== undefined) return fallback;
            return "" as any;
        }

        return out;
    };

    return isArr ? (src as any[]).map(project) : project(src);
}

/* ===================== HELPERS ERGONÓMICOS (tipados, sin any ni fallback) ===================== */

type ArrayElement<T> = T extends readonly (infer U)[] | (infer U)[] ? U : never;

// Claves cuyo valor (no-nulo) es string
type StringKeys<T> = {
    [P in keyof T]-?: NonNullish<T[P]> extends string ? P : never;
}[keyof T];

// Claves cuyo valor es array (incluye readonly)
type ArrayKeys<T> = {
    [P in keyof T]-?: T[P] extends readonly any[] | any[] ? P : never;
}[keyof T];

/** Para campos de texto: asegura `string` */
export function getStr<E extends EntryLike, K extends StringKeys<EntryDataOf<E>>>(src: E | null | undefined, key: K, locale?: string): string {
    // `getData` (sin fallback) devuelve Clean<EntryDataOf<E>[K]> → `string` por la restricción de K
    const val = getData(src, key as any, locale) as NonNullish<EntryDataOf<E>[K]>;
    return typeof val === "string" ? val : "";
}

/** Para campos array: asegura `T[]` */
export function getArr<E extends EntryLike, K extends ArrayKeys<EntryDataOf<E>>>(src: E | null | undefined, key: K, locale?: string): Array<NonNullish<ArrayElement<EntryDataOf<E>[K]>>> {
    type Out = Array<NonNullish<ArrayElement<EntryDataOf<E>[K]>>>;
    // Llamamos sin fallback para no convertir el tipo en una unión
    const val = getData(src, key as any, locale) as unknown;

    // Normalización robusta en runtime
    if (Array.isArray(val)) {
        // Strapi a veces mete nulls: limpiamos por si acaso
        return val.filter((x) => x != null) as unknown as Out;
    }
    // Si vino null/undefined o cualquier otra cosa rara → []
    return [] as Out;
}
