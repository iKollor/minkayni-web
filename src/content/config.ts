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
  BuilderPageSchema,
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
const metricGroupSelection = `id title metrics(pagination: { limit: 100 }) { ${listItemSelection} }`;
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
    Testimonials(pagination: { limit: 100 }) {
        id
        author_quote { id author body }
        organization
        picture { ${uploadFileSelection} }
        age
        author_role
    }
    Teams(pagination: { limit: 100 }) {
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
        files(pagination: { limit: 100 }) { ${uploadFileSelection} }
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
    actionLines(pagination: { limit: 100 }) { ${cardSelection} }
    historyHeading { ${headingSelection} }
    timeline(pagination: { limit: 100 }) { ${timelineSelection} }
    mission { ${cardSelection} }
    vision { ${cardSelection} }
    ecosystemHeading { ${headingSelection} }
    ecosystemCards(pagination: { limit: 100 }) { ${orgCardSelection} }
    ecosystemLink { ${linkSelection} }
    teamHeading { ${headingSelection} }
    teamMembers(pagination: { limit: 100 }) { ${cardSelection} }
    teamNote
    transparencyHeading { ${headingSelection} }
    policies(pagination: { limit: 100 }) { ${listItemSelection} }
    transparencyNote
    pressHeading { ${headingSelection} }
    pressLinks(pagination: { limit: 100 }) { ${pressItemSelection} }
    pressCta { ${linkSelection} }
    contactHeading { ${headingSelection} }
    contactButton { ${buttonSelection} }
    contactSecondary { ${linkSelection} }
    seo { ${seoSelection} }
`;

const impactPageSelection = `
    ${entryMetaSelection}
    intro { ${headingSelection} }
    sectionNav(pagination: { limit: 100 }) { ${linkSelection} }
    stats(pagination: { limit: 100 }) { ${statSelection} }
    statsNote
    resultsHeading { ${headingSelection} }
    resultsQuote
    resultsQuoteCite
    resultsLink { ${linkSelection} }
    results(pagination: { limit: 100 }) { ${statSelection} }
    otherProcessesTitle
    otherProcesses(pagination: { limit: 100 }) { ${metricGroupSelection} }
    awardsHeading { ${headingSelection} }
    awards(pagination: { limit: 100 }) { ${awardSelection} }
    awardsNote
    pressHeading { ${headingSelection} }
    pressItems(pagination: { limit: 100 }) { ${pressItemSelection} }
    journeyHeading { ${headingSelection} }
    journeyCards(pagination: { limit: 100 }) { ${linkCardSelection} }
    ctaHeading { ${headingSelection} }
    ctaButton { ${buttonSelection} }
    seo { ${seoSelection} }
`;

const projectsPageSelection = `
    ${entryMetaSelection}
    intro { ${headingSelection} }
    explorerHeading { ${headingSelection} }
    filters(pagination: { limit: 100 }) { ${listItemSelection} }
    projects(pagination: { limit: 100 }) { ${projectCardSelection} }
    methodHeading { ${headingSelection} }
    methodSteps(pagination: { limit: 100 }) { ${stepSelection} }
    methodLink { ${linkSelection} }
    horizonHeading { ${headingSelection} }
    horizonCards(pagination: { limit: 100 }) { ${cardSelection} }
    alliancesHeading { ${headingSelection} }
    allies(pagination: { limit: 100 }) { ${listItemSelection} }
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
    figures(pagination: { limit: 100 }) { ${statSelection} }
    originTitle
    originItems(pagination: { limit: 100 }) { ${timelineSelection} }
    originLink { ${linkSelection} }
    pulseHeading { ${headingSelection} }
    pulseHighlight
    pulseImage { ${uploadFileSelection} }
    methodHeading { ${headingSelection} }
    methodSteps(pagination: { limit: 100 }) { ${stepSelection} }
    methodNote
    territoryHeading { ${headingSelection} }
    sectors(pagination: { limit: 100 }) { ${sectorSelection} }
    territoryHint
    actionHeading { ${headingSelection} }
    communityActions(pagination: { limit: 100 }) { ${listItemSelection} }
    ecoHeading { ${headingSelection} }
    ecosystemTags(pagination: { limit: 100 }) { ${listItemSelection} }
    ecoLink { ${linkSelection} }
    awardsHeading { ${headingSelection} }
    awards(pagination: { limit: 100 }) { ${awardSelection} }
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
    pulseline(pagination: { limit: 100 }) { ${listItemSelection} }
    organismsHeading { ${headingSelection} }
    organisms(pagination: { limit: 100 }) { ${orgCardSelection} }
    horizonsHeading { ${headingSelection} }
    horizons(pagination: { limit: 100 }) { ${cardSelection} }
    alliesHeading { ${headingSelection} }
    allies(pagination: { limit: 100 }) { ${listItemSelection} }
    ctaHeading { ${headingSelection} }
    ctaPrimary { ${linkSelection} }
    ctaSecondary { ${linkSelection} }
    seo { ${seoSelection} }
`;

const batucadaHistoryPageSelection = `
    ${entryMetaSelection}
    backLink { ${linkSelection} }
    hero { ${headingSelection} }
    pulseline(pagination: { limit: 100 }) { ${listItemSelection} }
    timelineHeading { ${headingSelection} }
    timeline(pagination: { limit: 100 }) { ${timelineSelection} }
    senseHeading { ${headingSelection} }
    senseHighlight
    senseImage { ${uploadFileSelection} }
    ctaHeading { ${headingSelection} }
    ctaPrimary { ${linkSelection} }
    ctaSecondary { ${linkSelection} }
    seo { ${seoSelection} }
`;

/* Subpáginas del constructor: dynamic zone discriminada por __typename.
   Los campos heading/cards/items llevan ALIAS únicos por fragmento: GraphQL
   rechaza el mismo nombre con nulabilidad distinta entre tipos de la unión.
   BlockRenderer los normaliza de vuelta a heading/cards/items. */
const builderSectionsSelection = `
    sections {
        __typename
        ... on ComponentBlocksIntro { id introHeading: heading { ${headingSelection} } }
        ... on ComponentBlocksRichText { id body }
        ... on ComponentBlocksMedia { id caption image { ${uploadFileSelection} } }
        ... on ComponentBlocksQuote { id text cite }
        ... on ComponentBlocksStats { id statsHeading: heading { ${headingSelection} } stats(pagination: { limit: 100 }) { ${statSelection} } }
        ... on ComponentBlocksCardGrid { id gridHeading: heading { ${headingSelection} } gridCards: cards(pagination: { limit: 100 }) { ${cardSelection} } }
        ... on ComponentBlocksTimeline { id timelineHeading: heading { ${headingSelection} } timelineItems: items(pagination: { limit: 100 }) { ${timelineSelection} } }
        ... on ComponentBlocksAwards { id awardsHeading: heading { ${headingSelection} } awards(pagination: { limit: 100 }) { ${awardSelection} } note }
        ... on ComponentBlocksPressList { id pressHeading: heading { ${headingSelection} } pressItems: items(pagination: { limit: 100 }) { ${pressItemSelection} } }
        ... on ComponentBlocksLinkCards { id linksHeading: heading { ${headingSelection} } linkCards: cards(pagination: { limit: 100 }) { ${linkCardSelection} } }
        ... on ComponentBlocksAllies { id alliesHeading: heading { ${headingSelection} } allyItems: items(pagination: { limit: 100 }) { ${listItemSelection} } }
        ... on ComponentBlocksCta { id ctaHeading: heading { ${headingSelection} } button { ${buttonSelection} } secondary { ${linkSelection} } }
        ... on Error { code message }
    }
`;

const builderPageSelection = `
    ${entryMetaSelection}
    title
    slug
    description
    ${builderSectionsSelection}
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
    pageNav(pagination: { limit: 100 }) { ${linkSelection} }
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

/* Subpáginas del constructor (collection type `page` en Strapi). */
const builderPages = defineCollection({
  loader: strapiConfigured
    ? strapiLoader({
        mode: "collection",
        rootField: "pages",
        selection: builderPageSelection,
        client: clientHeaders,
        cacheDurationInMs: contentCacheMs,
      })
    : preserveCachedContent("pages"),
  schema: BuilderPageSchema(),
});

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
  builderPages,
};
