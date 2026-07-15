import type { Loader, LoaderContext } from "astro/loaders";

type StrapiNode = Record<string, unknown>;

type Opts = {
  mode?: "collection" | "single";
  rootField: string;
  selection: string;
  client: { endpoint: string; headers?: Record<string, string> };
  pageSize?: number;
  cacheDurationInMs?: number;
  idResolver?: (node: StrapiNode) => string;
  status?: "PUBLISHED" | "DRAFT";
  locale?: string;
};

const NETWORK_TIMEOUT_MS = 30_000;
const MAX_PAGES = 200;

const cap = (value: string) =>
  value ? value[0].toUpperCase() + value.slice(1) : value;
const squash = (value: string) => value.replace(/\s+/g, " ").trim();

const asNode = (value: unknown): StrapiNode | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as StrapiNode;
};

const asNodes = (value: unknown): StrapiNode[] => {
  if (!Array.isArray(value)) return [];
  return value.map(asNode).filter((node): node is StrapiNode => node !== null);
};

export function strapiLoader({
  mode = "collection",
  rootField,
  selection,
  client,
  pageSize = 25,
  cacheDurationInMs = 0,
  idResolver,
  status = "PUBLISHED",
  locale,
}: Opts): Loader {
  const request = async (
    query: string,
    variables: Record<string, unknown>,
    operationName: string
  ): Promise<Record<string, unknown>> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);

    try {
      const response = await fetch(client.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apollo-require-preflight": "true",
          "x-apollo-operation-name": operationName,
          ...(client.headers ?? {}),
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `GraphQL ${response.status} ${response.statusText}: ${body}`
        );
      }

      const payload: unknown = await response.json();
      const result = asNode(payload);
      const errors = result?.errors;
      if (Array.isArray(errors) && errors.length)
        throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);

      return asNode(result?.data) ?? {};
    } finally {
      clearTimeout(timeout);
    }
  };

  const getStableId = (node: StrapiNode, fallback: string) => {
    const custom = idResolver?.(node);
    if (typeof custom === "string" && custom.trim()) return custom;
    return String(node.documentId ?? node.id ?? fallback);
  };

  const isPublished = (node: StrapiNode) =>
    typeof node.publishedAt === "string" && node.publishedAt.length > 0;

  const getPreviousIds = (meta: LoaderContext["meta"]): string[] => {
    const stored = meta.get("ids");
    if (Array.isArray(stored))
      return stored.filter((id): id is string => typeof id === "string");
    if (typeof stored !== "string") return [];

    try {
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : [];
    } catch {
      return [];
    }
  };

  const singleQuery = squash(`
        query ${cap(rootField)}($status: PublicationStatus${
    locale ? ", $locale: I18NLocaleCode" : ""
  }) {
            ${rootField}(status: $status${locale ? ", locale: $locale" : ""}) {
                ${selection}
            }
        }
    `);

  const collectionQuery = squash(`
        query ${cap(
          rootField
        )}($page: Int!, $pageSize: Int!, $status: PublicationStatus) {
            ${rootField}(pagination: { page: $page, pageSize: $pageSize }, status: $status) {
                ${selection}
            }
        }
    `);

  return {
    name: rootField,
    async load(ctx: LoaderContext) {
      const { store, meta, logger, generateDigest, parseData } = ctx;
      const lastSynced = meta.get("lastSynced");

      if (lastSynced && Date.now() - Number(lastSynced) < cacheDurationInMs) {
        logger.info(`[${rootField}] Skipping sync (cached)`);
        return;
      }

      try {
        const previousIds = getPreviousIds(meta);
        const seenIds = new Set<string>();

        if (mode === "single") {
          const variables: Record<string, unknown> = { status };
          if (locale) variables.locale = locale;

          const response = await request(
            singleQuery,
            variables,
            cap(rootField)
          );
          const node = asNode(response[rootField]);

          if (!node || (status === "PUBLISHED" && !isPublished(node))) {
            logger.warn(
              `[${rootField}] single: no hay contenido publicado; se conserva la caché local.`
            );
            return;
          }

          const id = getStableId(node, rootField);
          const data = await parseData({ id, data: node });
          store.set({ id, digest: generateDigest(data), data });
          seenIds.add(id);

          for (const oldId of previousIds) {
            if (!seenIds.has(oldId)) store.delete(oldId);
          }

          meta.set("ids", JSON.stringify([...seenIds]));
          meta.set("lastSynced", String(Date.now()));
          logger.info(
            `[${rootField}] Stored single id=${id}${
              locale ? ` [locale=${locale}]` : ""
            }`
          );
          return;
        }

        let page = 1;
        let stored = 0;

        while (page <= MAX_PAGES) {
          const response = await request(
            collectionQuery,
            { page, pageSize, status },
            cap(rootField)
          );
          const nodes = asNodes(response[rootField]).filter(
            (node) => status !== "PUBLISHED" || isPublished(node)
          );

          for (const [index, node] of nodes.entries()) {
            const id = getStableId(node, `${rootField}-${page}-${index}`);
            const data = await parseData({ id, data: node });
            store.set({ id, digest: generateDigest(data), data });
            seenIds.add(id);
            stored++;
          }

          if (nodes.length < pageSize) break;
          page++;
        }

        if (page > MAX_PAGES)
          logger.warn(
            `[${rootField}] Se alcanzó el máximo de ${MAX_PAGES} páginas.`
          );

        if (!stored) {
          logger.warn(
            `[${rootField}] collection: no hay contenido publicado; se conserva la caché local.`
          );
          return;
        }

        for (const oldId of previousIds) {
          if (!seenIds.has(oldId)) store.delete(oldId);
        }

        meta.set("ids", JSON.stringify([...seenIds]));
        meta.set("lastSynced", String(Date.now()));

        logger.info(`[${rootField}] collection: stored ${stored} documents.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(
          `[${rootField}] No se pudo sincronizar con Strapi; se conserva la caché local. ${message}`
        );
      }
    },
    schema() {
      throw new Error("Pasa tu schema Zod en defineCollection().");
    },
  };
}
