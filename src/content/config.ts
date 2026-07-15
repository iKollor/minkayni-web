// src/content/config.ts — versión simplificada
import { defineCollection } from "astro:content";
import type { Loader } from "astro/loaders";
import { strapiLoader } from "../utils/loaders/strapi-loader";
import { navigationLoader } from "../utils/loaders/strapi-navigation-loader";
import { validateStrapiConnection } from "../utils/strapi-connection";
import {
  PostSchema,
  HomepageSchema,
  FooterSchema,
} from "../schemas/strapi.graphql.zod";
import { NavigationTreeSchema } from "../schemas/navigation";

const STRAPI_BASE = (import.meta.env.STRAPI_URL ?? "").trim();
const STRAPI_TOKEN = (import.meta.env.STRAPI_TOKEN ?? "").trim();
const GRAPHQL_ENDPOINT = STRAPI_BASE
  ? `${STRAPI_BASE.replace(/\/$/, "")}/graphql`
  : "";

const buildAuthHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  "apollo-require-preflight": "true",
  "x-apollo-operation-name": "ValidateConnection",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const strictStrapi = import.meta.env.STRAPI_STRICT === "true";
const strapiConfigured = Boolean(GRAPHQL_ENDPOINT && STRAPI_TOKEN);

if (strictStrapi) {
  const check = await validateStrapiConnection({
    endpoint: GRAPHQL_ENDPOINT,
    token: STRAPI_TOKEN,
  });
  if (!check.ok)
    throw new Error(check.message ?? "Strapi connection failed");
}

const preserveCachedContent = (name: string): Loader => ({
  name,
  async load({ logger }) {
    logger.warn(
      `[${name}] Strapi no está disponible; se conserva el contenido local existente.`
    );
  },
});

const contentCacheMs = import.meta.env.DEV ? 15 * 60 * 1000 : 0;

const clientHeaders = GRAPHQL_ENDPOINT
  ? { endpoint: GRAPHQL_ENDPOINT, headers: buildAuthHeaders(STRAPI_TOKEN) }
  : { endpoint: GRAPHQL_ENDPOINT };

const uploadFileSelection = `
    documentId
    name
    alternativeText
    caption
    width
    height
    formats
    hash
    ext
    mime
    size
    url
    previewUrl
    provider
    provider_metadata
    createdAt
    updatedAt
    publishedAt
`;

const postSelection = `
    documentId
    platform
    media_kind
    permalink
    external_id
    owner_handle
    caption
    like_count
    comment_count
    view_count
    posted_at
    source { ${uploadFileSelection} }
    thumbnail_url
    is_featured
    raw
    createdAt
    updatedAt
    publishedAt
`;

const homepageSelection = `
    documentId
    legend
    Testimonials {
        id
        author_quote { id author body }
        organization
        picture { ${uploadFileSelection} }
        age
        author_role
    }
    Teams {
        id
        full_name
        role
        organization
        about
        picture { ${uploadFileSelection} }
        email
        age
        phone_number
    }
    createdAt
    updatedAt
    publishedAt
    locale
`;

const footerSelection = `
    documentId
    privacyLink { id text href }
    termsLink { id text href }
    Socials { id facebook instagram twitter tiktok }
    Copyright { id legalname yearStart autoYear yearOverride extraText }
    partnersGallery {
        id
        files { ${uploadFileSelection} }
    }
    createdAt
    updatedAt
    publishedAt
    locale
`;

const posts = defineCollection({
  loader: strapiConfigured
    ? strapiLoader({
        mode: "collection",
        rootField: "posts",
        selection: postSelection,
        client: clientHeaders,
        cacheDurationInMs: contentCacheMs,
      })
    : preserveCachedContent("posts"),
  schema: PostSchema(),
});

const homepage = defineCollection({
  loader: strapiConfigured
    ? strapiLoader({
        mode: "single",
        rootField: "homepage",
        selection: homepageSelection,
        client: clientHeaders,
        cacheDurationInMs: contentCacheMs,
        idResolver: () => "homepage",
        locale: "es",
      })
    : preserveCachedContent("homepage"),
  schema: HomepageSchema(),
});

const footer = defineCollection({
  loader: strapiConfigured
    ? strapiLoader({
        mode: "single",
        rootField: "footer",
        selection: footerSelection,
        client: clientHeaders,
        cacheDurationInMs: contentCacheMs,
        idResolver: () => "footer",
        locale: "es",
      })
    : preserveCachedContent("footer"),
  schema: FooterSchema(),
});

const navigationHeader = defineCollection({
  loader: strapiConfigured
    ? navigationLoader({
        slug: "header",
        locale: "es",
        url: STRAPI_BASE,
        token: STRAPI_TOKEN,
        cacheMs: contentCacheMs,
      })
    : preserveCachedContent("navigationHeader"),
  schema: NavigationTreeSchema,
});

export const collections = { posts, homepage, navigationHeader, footer };
