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
import { z } from "zod";
import {
  AboutPageSchema,
  ImpactPageSchema,
  ProjectsPageSchema,
  BatucadaPageSchema,
  BatucadaEcosystemPageSchema,
  BatucadaHistoryPageSchema,
  GlobalSettingsSchema,
  FeaturedProjectSchema,
  ActionButtonSchema,
} from "../schemas/pages.zod";
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

/* ── Selecciones GraphQL reutilizables (componentes de página) ─────────── */
const headingSelection = `id eyebrow title body`;
const linkSelection = `id text href`;
const buttonSelection = `id href defaultText hoverText`;
const listItemSelection = `id text meta`;
const statSelection = `id value target prefix suffix label detail`;
const stepSelection = `id number title text`;
const awardSelection = `id year org title text href linkText`;
const orgCardSelection = `id kind name text accentColor dark`;
const sectorSelection = `id name lat lng`;
const linkCardSelection = `id eyebrow title text href linkText external`;
const timelineSelection = `id chip period title text accent imageAlt image { ${uploadFileSelection} }`;
const cardSelection = `id title description showIcon cta icon { ${uploadFileSelection} }`;
const pressItemSelection = `id outlet year title href logo { ${uploadFileSelection} }`;
const seoSelection = `id metaTitle metaDescription shareImage { ${uploadFileSelection} }`;
const metricGroupSelection = `id title metrics { ${listItemSelection} }`;
const projectCardSelection = `id anchor category categoryLabel type title summary detail imageAlt href linkText external accent image { ${uploadFileSelection} }`;
const featuredProjectSelection = `id title body logo { ${uploadFileSelection} } photo { ${uploadFileSelection} } button { ${buttonSelection} }`;

const entryMetaSelection = `
    documentId
    createdAt
    updatedAt
    publishedAt
    locale
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
    testimonialsTitle
    teamTitle
    featuredProject { ${featuredProjectSelection} }
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
    partnersTitle
    joinTitle
    joinSubtitle
    joinButton { ${buttonSelection} }
    createdAt
    updatedAt
    publishedAt
    locale
`;

/* ── Selecciones de los single types de página ─────────────────────────── */
const aboutPageSelection = `
    ${entryMetaSelection}
    intro { ${headingSelection} }
    actionLines { ${cardSelection} }
    historyHeading { ${headingSelection} }
    timeline { ${timelineSelection} }
    mission { ${cardSelection} }
    vision { ${cardSelection} }
    ecosystemHeading { ${headingSelection} }
    ecosystemCards { ${orgCardSelection} }
    ecosystemLink { ${linkSelection} }
    teamHeading { ${headingSelection} }
    teamMembers { ${cardSelection} }
    teamNote
    transparencyHeading { ${headingSelection} }
    policies { ${listItemSelection} }
    transparencyNote
    pressHeading { ${headingSelection} }
    pressLinks { ${pressItemSelection} }
    pressCta { ${linkSelection} }
    contactHeading { ${headingSelection} }
    contactButton { ${buttonSelection} }
    contactSecondary { ${linkSelection} }
    seo { ${seoSelection} }
`;

const impactPageSelection = `
    ${entryMetaSelection}
    intro { ${headingSelection} }
    sectionNav { ${linkSelection} }
    stats { ${statSelection} }
    statsNote
    resultsHeading { ${headingSelection} }
    resultsQuote
    resultsQuoteCite
    resultsLink { ${linkSelection} }
    results { ${statSelection} }
    otherProcessesTitle
    otherProcesses { ${metricGroupSelection} }
    awardsHeading { ${headingSelection} }
    awards { ${awardSelection} }
    awardsNote
    pressHeading { ${headingSelection} }
    pressItems { ${pressItemSelection} }
    journeyHeading { ${headingSelection} }
    journeyCards { ${linkCardSelection} }
    ctaHeading { ${headingSelection} }
    ctaButton { ${buttonSelection} }
    seo { ${seoSelection} }
`;

const projectsPageSelection = `
    ${entryMetaSelection}
    intro { ${headingSelection} }
    explorerHeading { ${headingSelection} }
    filters { ${listItemSelection} }
    projects { ${projectCardSelection} }
    methodHeading { ${headingSelection} }
    methodSteps { ${stepSelection} }
    methodLink { ${linkSelection} }
    horizonHeading { ${headingSelection} }
    horizonCards { ${cardSelection} }
    alliancesHeading { ${headingSelection} }
    allies { ${listItemSelection} }
    alliancesNote
    ctaButton { ${buttonSelection} }
    ctaSecondary { ${linkSelection} }
    seo { ${seoSelection} }
`;

const batucadaPageSelection = `
    ${entryMetaSelection}
    heroMetaLeft
    heroMetaRight
    heroTitle
    heroCaption
    heroPrimary { ${linkSelection} }
    heroSecondary { ${linkSelection} }
    heroImage { ${uploadFileSelection} }
    introHeading { ${headingSelection} }
    introBody
    figures { ${statSelection} }
    originTitle
    originItems { ${timelineSelection} }
    originLink { ${linkSelection} }
    pulseHeading { ${headingSelection} }
    pulseHighlight
    pulseImage { ${uploadFileSelection} }
    methodHeading { ${headingSelection} }
    methodSteps { ${stepSelection} }
    methodNote
    territoryHeading { ${headingSelection} }
    sectors { ${sectorSelection} }
    territoryHint
    actionHeading { ${headingSelection} }
    communityActions { ${listItemSelection} }
    ecoHeading { ${headingSelection} }
    ecosystemTags { ${listItemSelection} }
    ecoLink { ${linkSelection} }
    awardsHeading { ${headingSelection} }
    awards { ${awardSelection} }
    awardsNote
    rightsHeading { ${headingSelection} }
    rightsBodyLeft
    rightsBodyRight
    rightsStamp
    ctaHeading { ${headingSelection} }
    ctaPrimary { ${linkSelection} }
    ctaSecondary { ${linkSelection} }
    seo { ${seoSelection} }
`;

const batucadaEcosystemPageSelection = `
    ${entryMetaSelection}
    backLink { ${linkSelection} }
    hero { ${headingSelection} }
    pulseline { ${listItemSelection} }
    organismsHeading { ${headingSelection} }
    organisms { ${orgCardSelection} }
    horizonsHeading { ${headingSelection} }
    horizons { ${cardSelection} }
    alliesHeading { ${headingSelection} }
    allies { ${listItemSelection} }
    ctaHeading { ${headingSelection} }
    ctaPrimary { ${linkSelection} }
    ctaSecondary { ${linkSelection} }
    seo { ${seoSelection} }
`;

const batucadaHistoryPageSelection = `
    ${entryMetaSelection}
    backLink { ${linkSelection} }
    hero { ${headingSelection} }
    pulseline { ${listItemSelection} }
    timelineHeading { ${headingSelection} }
    timeline { ${timelineSelection} }
    senseHeading { ${headingSelection} }
    senseHighlight
    senseImage { ${uploadFileSelection} }
    ctaHeading { ${headingSelection} }
    ctaPrimary { ${linkSelection} }
    ctaSecondary { ${linkSelection} }
    seo { ${seoSelection} }
`;

const globalSelection = `
    ${entryMetaSelection}
    siteName
    titleSuffix
    defaultSeo { ${seoSelection} }
    contactEmail
    whatsappUrl
    menuLabel
    pageNav { ${linkSelection} }
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
  schema: HomepageSchema().extend({
    testimonialsTitle: z.string().nullish(),
    teamTitle: z.string().nullish(),
    featuredProject: FeaturedProjectSchema().nullish(),
  }),
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
  schema: FooterSchema().extend({
    partnersTitle: z.string().nullish(),
    joinTitle: z.string().nullish(),
    joinSubtitle: z.string().nullish(),
    joinButton: ActionButtonSchema().nullish(),
  }),
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

/* ── Single types de página ────────────────────────────────────────────── */
const definePageSingle = <S extends z.ZodTypeAny>(rootField: string, selection: string, schema: S) =>
  defineCollection({
    loader: strapiConfigured
      ? strapiLoader({
          mode: "single",
          rootField,
          selection,
          client: clientHeaders,
          cacheDurationInMs: contentCacheMs,
          idResolver: () => rootField,
          locale: "es",
        })
      : preserveCachedContent(rootField),
    schema,
  });

const aboutPage = definePageSingle("aboutPage", aboutPageSelection, AboutPageSchema());
const impactPage = definePageSingle("impactPage", impactPageSelection, ImpactPageSchema());
const projectsPage = definePageSingle("projectsPage", projectsPageSelection, ProjectsPageSchema());
const batucadaPage = definePageSingle("batucadaPage", batucadaPageSelection, BatucadaPageSchema());
const batucadaEcosystemPage = definePageSingle(
  "batucadaEcosystemPage",
  batucadaEcosystemPageSelection,
  BatucadaEcosystemPageSchema()
);
const batucadaHistoryPage = definePageSingle(
  "batucadaHistoryPage",
  batucadaHistoryPageSelection,
  BatucadaHistoryPageSchema()
);
const globalSettings = definePageSingle("global", globalSelection, GlobalSettingsSchema());

export const collections = {
  posts,
  homepage,
  navigationHeader,
  footer,
  aboutPage,
  impactPage,
  projectsPage,
  batucadaPage,
  batucadaEcosystemPage,
  batucadaHistoryPage,
  globalSettings,
};
