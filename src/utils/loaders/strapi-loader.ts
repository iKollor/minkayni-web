// src/utils/loaders/strapi-loader.ts
import type { Loader, LoaderContext } from "astro/loaders";

type TypeRef = { kind: string; name?: string | null; ofType?: TypeRef | null };
type InputVal = { name: string; type: TypeRef };
type Field = { name: string; type: TypeRef; args?: InputVal[] };
type GType = {
    kind: "SCALAR" | "OBJECT" | "INTERFACE" | "UNION" | "ENUM" | "INPUT_OBJECT";
    name: string;
    fields?: Field[];
    inputFields?: InputVal[];
    possibleTypes?: { name: string }[];
};
type GSchema = { types: GType[]; queryType?: { name: string } };

type Opts = {
    mode?: "collection" | "single";
    rootField: string;
    client: { endpoint: string; headers?: Record<string, string> };
    depth?: number;
    pageSize?: number;
    cacheDurationInMs?: number;
    idResolver?: (node: any) => string;
    status?: "PUBLISHED" | "DRAFT";
    preferredLocale?: string;
};

const NETWORK_TIMEOUT_MS = 30_000;
const MAX_PAGES = 200;

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const squash = (s: string) => s.replace(/\s+/g, " ").trim();
const unwrap = (t: TypeRef) => {
    let c = t;
    while ((c.kind === "NON_NULL" || c.kind === "LIST") && c.ofType) c = c.ofType;
    return c;
};
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export function strapiLoader({ mode = "collection", rootField, client, depth = 2, pageSize = 25, cacheDurationInMs = 0, idResolver, status = "PUBLISHED", preferredLocale }: Opts): Loader {
    const gfetch = async (query: string, variables?: Record<string, any>, op = "AstroLoader") => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), NETWORK_TIMEOUT_MS);
        const headers = {
            "Content-Type": "application/json",
            "apollo-require-preflight": "true",
            "x-apollo-operation-name": op,
            ...(client.headers ?? {}),
        };
        try {
            const res = await fetch(client.endpoint, {
                method: "POST",
                headers,
                body: JSON.stringify({ query, ...(variables && Object.keys(variables).length ? { variables } : {}) }),
                signal: ctrl.signal,
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`GraphQL ${res.status} ${res.statusText}: ${txt}`);
            }
            const json = await res.json();
            if (json.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
            return json.data;
        } finally {
            clearTimeout(timer);
        }
    };

    const getSchema = async (): Promise<GSchema> => {
        const INTROSPECTION = `
      query __I__ {
        __schema {
          queryType { name }
          types {
            kind
            name
            fields {
              name
              args { name type { kind name ofType { kind name ofType { kind name } } } }
              type { kind name ofType { kind name ofType { kind name } } }
            }
            inputFields { name type { kind name ofType { kind name ofType { kind name } } } }
            possibleTypes { name }
          }
        }
      }
    `;
        const d = await gfetch(INTROSPECTION);
        return d.__schema as GSchema;
    };

    // Introspección helpers
    const getQueryType = (schema: GSchema) => schema.types.find((t) => t.name === (schema.queryType?.name ?? "Query") && t.kind === "OBJECT");
    const getRootField = (schema: GSchema, rf: string) => getQueryType(schema)?.fields?.find((f) => f.name === rf);
    const fieldHasArg = (schema: GSchema, rf: string, arg: string) => !!getRootField(schema, rf)?.args?.some((a) => a.name === arg);
    const getType = (schema: GSchema, name?: string | null) => schema.types.find((t) => t.name === name);
    const inputHasField = (schema: GSchema, field: string, inputName?: string | null) => {
        if (!inputName) return false;
        const t = getType(schema, inputName);
        return !!(t && t.kind === "INPUT_OBJECT" && t.inputFields?.some((i) => i.name === field));
    };

    // Construcción de selección
    const buildSelection = (schema: GSchema) => {
        const tmap = new Map(schema.types.map((t) => [t.name, t] as const));
        const hasField = (tn: string, fn: string) => !!tmap.get(tn)?.fields?.some((f) => f.name === fn);
        const minSel = (tn: string) => (hasField(tn, "documentId") ? "documentId" : hasField(tn, "id") ? "id" : "__typename");
        const isScalar = (tr: TypeRef) => {
            const n = unwrap(tr);
            if (n.kind === "SCALAR" || n.kind === "ENUM") return true;
            const name = (n.name ?? "").toLowerCase();
            return ["datetime", "json", "upload", "id"].includes(name);
        };

        const GLOBAL_BLOCK = new Set(["related", "localizations", "createdBy", "updatedBy"]);
        const BLOCK_BY_TYPE: Record<string, Set<string>> = { UploadFile: new Set(["related"]) };

        const forType = (tn: string, max = 2, seen = new Map<string, number>()): string => {
            const T = tmap.get(tn);
            if (!T || T.kind === "SCALAR" || T.kind === "ENUM") return "";
            const used = seen.get(tn) ?? 0;
            if (used >= max) return minSel(tn);
            seen.set(tn, used + 1);
            if (T.kind === "UNION" || T.kind === "INTERFACE") {
                const poss = T.possibleTypes ?? [];
                if (!poss.length) return "__typename";
                return `__typename ${poss.map((p) => `... on ${p.name} { ${minSel(p.name)} }`).join(" ")}`;
            }
            const perBlock = BLOCK_BY_TYPE[tn] ?? new Set<string>();
            const out: string[] = [];
            for (const f of T.fields ?? []) {
                if (GLOBAL_BLOCK.has(f.name) || perBlock.has(f.name)) continue;
                if (isScalar(f.type)) {
                    out.push(f.name);
                    continue;
                }
                const named = unwrap(f.type).name;
                if (!named) continue;
                const sub = forType(named, max, new Map(seen)) || minSel(named);
                out.push(`${f.name} { ${sub} }`);
            }
            return out.length ? out.join(" ") : minSel(tn);
        };

        const rootShape = (rf: string) => {
            const Qf = getRootField(schema, rf);
            if (!Qf) throw new Error(`No existe Query.${rf}`);
            const retName = unwrap(Qf.type).name!;
            const R = getType(schema, retName);
            const fields = R?.fields?.map((x) => x.name) ?? [];
            const hasDataMeta = fields.includes("data") && fields.includes("meta");
            const hasNodes = fields.includes("nodes");
            const inner = forType(R?.name ?? retName, depth);

            const HAS_ARG_LOCALE = fieldHasArg(schema, rf, "locale");
            const HAS_ARG_FILTERS = fieldHasArg(schema, rf, "filters");
            const HAS_ARG_PAGINATION = fieldHasArg(schema, rf, "pagination");
            const HAS_ARG_PAGE = fieldHasArg(schema, rf, "page");
            const HAS_ARG_PAGE_SIZE = fieldHasArg(schema, rf, "pageSize");

            let FILTERS_HAS_LOCALE = false;
            if (HAS_ARG_FILTERS) {
                const filtersArg = Qf.args?.find((a) => a.name === "filters");
                const filtersName = unwrap(filtersArg!.type).name;
                FILTERS_HAS_LOCALE = inputHasField(schema, "locale", filtersName);
            }

            const varsDecl: string[] = [];
            const argList: string[] = [];
            const filterList: string[] = [];

            if (HAS_ARG_LOCALE) {
                argList.push(`locale:$locale`);
                varsDecl.push(`$locale:I18NLocaleCode`);
            } else if (HAS_ARG_FILTERS && FILTERS_HAS_LOCALE) {
                filterList.push(`locale:{ eq:$locale }`);
                varsDecl.push(`$locale:I18NLocaleCode`);
            }

            if (fieldHasArg(schema, rf, "status")) {
                argList.push(`status:$status`);
                varsDecl.push(`$status: PublicationStatus`);
            } else if (fieldHasArg(schema, rf, "publicationState")) {
                argList.push(`publicationState:$publicationState`);
                varsDecl.push(`$publicationState: PublicationState`);
            }

            if (mode === "collection") {
                if (HAS_ARG_PAGINATION) {
                    argList.push(`pagination:{ page:$page, pageSize:$pageSize }`);
                    varsDecl.push(`$page:Int!`, `$pageSize:Int!`);
                } else {
                    if (HAS_ARG_PAGE) {
                        argList.push(`page:$page`);
                        varsDecl.push(`$page:Int!`);
                    }
                    if (HAS_ARG_PAGE_SIZE) {
                        argList.push(`pageSize:$pageSize`);
                        varsDecl.push(`$pageSize:Int!`);
                    }
                }
            }

            if (HAS_ARG_FILTERS && filterList.length) argList.push(`filters:{ ${filterList.join(", ")} }`);

            const VARS_DECL = varsDecl.length ? `(${varsDecl.join(", ")})` : "";
            const ARG_LIST = argList.length ? `(${argList.join(", ")})` : "";

            const baseQuery = squash(`
        query ${cap(rf)}${VARS_DECL} {
          ${rf}${ARG_LIST} { ${inner} }
        }
      `);

            return {
                variant: hasDataMeta ? ("dataMeta" as const) : hasNodes ? ("nodes" as const) : ("plain" as const),
                query: baseQuery,
                supports: {
                    usesVar: (name: string) => new RegExp(`\\$${name}\\b`).test(baseQuery),
                    serverFiltersLocale: HAS_ARG_LOCALE || (HAS_ARG_FILTERS && FILTERS_HAS_LOCALE),
                    hasDataMeta,
                    hasNodes,
                    wantsPagination: mode === "collection",
                },
            };
        };

        return { rootShape };
    };

    const getStableId = (node: any, fb: string) => {
        const custom = idResolver?.(node);
        if (typeof custom === "string" && custom.trim().length) return custom;
        return String(node?.documentId ?? node?.id ?? fb);
    };
    const isPublished = (n: any) => !!(n?.publishedAt ?? n?.attributes?.publishedAt ?? null);
    const getNodeLocale = (n: any) => n?.locale ?? n?.attributes?.locale;

    const detectLocales = async (schema: GSchema, logger: LoaderContext["logger"]): Promise<string[]> => {
        try {
            const Q = getQueryType(schema);
            const candidates = ["i18NLocales", "i18nLocales", "locales"];
            const field = Q?.fields?.find((f) => candidates.includes(f.name))?.name;
            if (field) {
                const data = await gfetch(`query LOCALES { ${field} { code } }`);
                const list = data?.[field] ?? [];
                const codes = Array.isArray(list) ? list.map((x) => x?.code).filter(Boolean) : [];
                if (codes.length) {
                    logger.info(`[${rootField}] Usando locales: ${codes.join(", ")}`);
                    return codes;
                }
            }
        } catch {}
        return ["es", "en"];
    };

    return {
        name: rootField,
        async load(ctx: LoaderContext) {
            const { store, meta, logger, generateDigest, parseData } = ctx;

            const last = meta.get("lastSynced");
            if (last && Date.now() - Number(last) < cacheDurationInMs) {
                logger.info(`[${rootField}] Skipping sync (cached)`);
                return;
            }

            const schema = await getSchema();
            const locales = await detectLocales(schema, logger);
            const { rootShape } = buildSelection(schema);
            const { variant, query, supports } = rootShape(rootField);

            const prevRaw = meta.get("ids");
            let prevIds: string[] = [];
            if (Array.isArray(prevRaw)) prevIds = prevRaw;
            else if (typeof prevRaw === "string") {
                try {
                    prevIds = JSON.parse(prevRaw);
                } catch {
                    prevIds = [];
                }
            }
            const seenIds = new Set<string>();

            // SINGLE — bundle
            if (mode === "single") {
                const allByLocale: Record<string, any> = {};
                for (const loc of locales) {
                    const vars: Record<string, any> = {};
                    if (supports.usesVar("locale")) vars.locale = loc;
                    if (supports.usesVar("status")) vars.status = status;
                    if (supports.usesVar("publicationState")) vars.publicationState = status === "PUBLISHED" ? "LIVE" : "PREVIEW";

                    const d = await gfetch(query, vars);
                    let node: any;
                    if (variant === "dataMeta") node = d?.[rootField]?.data?.[0];
                    else if (variant === "nodes") node = d?.[rootField]?.nodes?.[0];
                    else node = d?.[rootField];

                    if (node && (status === "PUBLISHED" ? isPublished(node) : true)) allByLocale[loc] = node;
                }

                if (!Object.keys(allByLocale).length) {
                    for (const oldId of prevIds) {
                        store.delete(oldId);
                        logger.info(`[${rootField}] Deleted old id=${oldId}`);
                    }
                    meta.set("ids", JSON.stringify([]));
                    meta.set("lastSynced", String(Date.now()));
                    logger.warn(`[${rootField}] single: no hay items para el estado ${status}.`);
                    return;
                }

                const baseLocale = (preferredLocale && allByLocale[preferredLocale] ? preferredLocale : null) ?? locales.find((l) => allByLocale[l])!;
                const finalNode = { ...clone(allByLocale[baseLocale]), _i18n: clone(allByLocale), _defaultLocale: baseLocale };

                const id = getStableId(finalNode, `${rootField}-${baseLocale}`);
                const data = await parseData({ id, data: finalNode });
                store.set({ id, digest: generateDigest(data), data });
                seenIds.add(id);

                for (const oldId of prevIds)
                    if (!seenIds.has(oldId)) {
                        store.delete(oldId);
                        logger.info(`[${rootField}] Deleted old id=${oldId}`);
                    }
                meta.set("ids", JSON.stringify([...seenIds]));
                meta.set("lastSynced", String(Date.now()));
                logger.info(`[${rootField}] Stored single id=${id} [baseLocale=${baseLocale}, bundle]`);
                return;
            }

            // COLLECTION — bundle por documento
            type Bundle = { _i18n: Record<string, any>; locales: Set<string> };
            const byDoc = new Map<string, Bundle>();
            let stored = 0;

            // === NUEVO: detectar si el CT tiene campo locale (i18n) ===
            let ctHasLocaleField: boolean | null = null; // null = desconocido; true/false = decidido en runtime

            // Iteraremos locales; si no hay i18n, recortamos a 1 vuelta
            const iterLocales = [...locales];

            for (let li = 0; li < iterLocales.length; li++) {
                const loc = iterLocales[li];

                // Si ya determinamos que NO hay i18n, no sigas iterando locales
                if (ctHasLocaleField === false && li > 0) break;

                let page = 1;
                let pageCount = Number.MAX_SAFE_INTEGER;
                let pageCountKnown = false;

                logger.info(`[${rootField}] [${loc}] sync start`);

                do {
                    if (page > MAX_PAGES) {
                        logger.warn(`[${rootField}] [${loc}] max pages (${MAX_PAGES}) — stop.`);
                        break;
                    }

                    const vars: Record<string, any> = {};
                    if (supports.usesVar("locale")) vars.locale = loc;
                    if (supports.usesVar("status")) vars.status = status;
                    if (supports.usesVar("publicationState")) vars.publicationState = status === "PUBLISHED" ? "LIVE" : "PREVIEW";
                    if (supports.usesVar("page")) vars.page = page;
                    if (supports.usesVar("pageSize")) vars.pageSize = pageSize;

                    const d = await gfetch(query, vars);

                    let nodes: any[] = [];
                    if (variant === "dataMeta") {
                        nodes = d?.[rootField]?.data ?? [];
                        const pc = d?.[rootField]?.meta?.pagination?.pageCount;
                        if (typeof pc === "number") {
                            pageCount = pc;
                            pageCountKnown = true;
                        }
                    } else if (variant === "nodes") {
                        nodes = d?.[rootField]?.nodes ?? [];
                        const pi = d?.[rootField]?.pageInfo;
                        if (typeof pi?.pageCount === "number") {
                            pageCount = pi.pageCount;
                            pageCountKnown = true;
                        }
                    } else {
                        nodes = Array.isArray(d?.[rootField]) ? d[rootField] : d?.[rootField] ? [d[rootField]] : [];
                        if (!supports.usesVar("page")) {
                            pageCount = 1;
                            pageCountKnown = true;
                        }
                    }

                    // === detectar si el CT trae 'locale' en los nodos ===
                    if (ctHasLocaleField === null) {
                        const sample = nodes[0];
                        const sampleLocale = sample ? getNodeLocale(sample) : undefined;
                        ctHasLocaleField = sampleLocale !== undefined; // true si existe, false si no
                        if (ctHasLocaleField === false) {
                            logger.info(`[${rootField}] CT sin i18n (sin campo locale) — desactivo filtrado por locale y no iteraré más locales.`);
                        }
                    }

                    // corte si vacío
                    if (!nodes.length) {
                        logger.info(`[${rootField}] [${loc}] page ${page} (0 items)`);
                        if (supports.usesVar("page") && !pageCountKnown) break;
                        if (!supports.usesVar("page")) break;
                    }

                    // Filtrar por locale solo si el CT es i18n
                    if (ctHasLocaleField && !supports.serverFiltersLocale) {
                        nodes = nodes.filter((n) => getNodeLocale(n) === loc);
                    }

                    // Filtro por publicados solo si status === "PUBLISHED"
                    if (status === "PUBLISHED") nodes = nodes.filter(isPublished);

                    for (const n of nodes) {
                        const key = getStableId(n, `${rootField}-${loc}-${page}`);
                        let b = byDoc.get(key);
                        if (!b) {
                            b = { _i18n: {}, locales: new Set() };
                            byDoc.set(key, b);
                        }
                        if (ctHasLocaleField) b._i18n[loc] = n;
                        else b._i18n["default"] = n;
                        b.locales.add(ctHasLocaleField ? loc : "default");
                    }

                    // corte por página incompleta si no sabemos pageCount
                    if (supports.usesVar("page") && !pageCountKnown) {
                        const expected = supports.usesVar("pageSize") ? pageSize : Number.MAX_SAFE_INTEGER;
                        if (nodes.length < expected) {
                            logger.info(`[${rootField}] [${loc}] incomplete page (${nodes.length} < ${expected}) — stop.`);
                            break;
                        }
                    }

                    page++;
                    if (pageCountKnown && page > pageCount) break;
                } while (true);
            }

            // build + store
            for (const [docKey, bundle] of byDoc.entries()) {
                const publishedLocales = Array.from(bundle.locales);
                if (!publishedLocales.length) continue;

                const baseLocale = (preferredLocale && bundle.locales.has(preferredLocale) ? preferredLocale : null) ?? (ctHasLocaleField ? publishedLocales[0] : "default");

                const baseNode = bundle._i18n[baseLocale];
                const finalNode = { ...clone(baseNode), _i18n: clone(bundle._i18n), _defaultLocale: baseLocale };

                const id = getStableId(finalNode, docKey);
                const data = await parseData({ id, data: finalNode });
                store.set({ id, digest: generateDigest(data), data });
                seenIds.add(id);
                stored++;
            }

            for (const oldId of prevIds)
                if (!seenIds.has(oldId)) {
                    store.delete(oldId);
                }
            meta.set("ids", JSON.stringify([...seenIds]));
            meta.set("lastSynced", String(Date.now()));
            if (!stored) ctx.logger.warn(`[${rootField}] collection: no trajo items (status=${status}).`);
            else ctx.logger.info(`[${rootField}] collection: stored ${stored} bundled documents.`);
        },
        schema() {
            throw new Error("Pasa tu schema Zod en defineCollection().");
        },
    };
}
