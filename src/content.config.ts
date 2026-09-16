// src/content.config.ts — versión simplificada
import { defineCollection } from "astro:content";
import type { Loader } from "astro/loaders";
import { strapiLoader } from "./utils/loaders/strapi-loader";
import { navigationLoader } from "./utils/loaders/strapi-navigation-loader";
import { validateStrapiConnection } from "./utils/strapi-connection";
import {
  PostSchema,
  HomepageSchema,
  FooterSchema,
} from "./schemas/strapi.graphql.zod";
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
  SectionHeadingSchema,
  ListItemSchema,
  TestimonialEntrySchema,
  TeamMemberEntrySchema,
  LegalTransparencySchema,
  DonatePageSchema,
} from "./schemas/pages.zod";
import { NavigationTreeSchema } from "./schemas/navigation";

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
const awardSelection = `id year org recipient title text href linkText`;
const orgCardSelection = `id kind name text accentColor dark instagramUrl logo { ${uploadFileSelection} }`;
const sectorSelection = `id name lat lng`;
const linkCardSelection = `id eyebrow title text href linkText external`;
const timelineSelection = `id chip period title text accent imageAlt image { ${uploadFileSelection} }`;
const cardSelection = `id title description showIcon cta icon { ${uploadFileSelection} }`;
const pressItemSelection = `id outlet year title href logo { ${uploadFileSelection} }`;
const seoSelection = `id metaTitle metaDescription shareImage { ${uploadFileSelection} }`;
const metricGroupSelection = `id title metrics(pagination: { limit: 100 }) { ${listItemSelection} }`;
const projectCardSelection = `id anchor category categoryLabel type title summary detail imageAlt href linkText external accent image { ${uploadFileSelection} }`;
const featuredProjectSelection = `id title headline body logo { ${uploadFileSelection} } photo { ${uploadFileSelection} } button { ${buttonSelection} } stats(pagination: { limit: 100 }) { ${statSelection} }`;

const entryMetaSelection = `
    documentId
    createdAt
    updatedAt
    publishedAt
    locale
`;

/* Testimonios y Equipo viven en sus propios collection types
   (colecciones `testimonials` y `teamMembers` más abajo). */
const testimonialSelection = `
    documentId
    createdAt
    updatedAt
    publishedAt
    author_quote { id author body }
    organization
    picture { ${uploadFileSelection} }
    age
    author_role
    sort
`;

const teamMemberSelection = `
    documentId
    createdAt
    updatedAt
    publishedAt
    full_name
    role
    organization
    about
    picture { ${uploadFileSelection} }
    email
    age
    phone_number
    sort
`;

const homepageSelection = `
    documentId
    legend
    testimonialsTitle
    teamTitle
    featuredProject { ${featuredProjectSelection} }
    projectsCtaHeading { ${headingSelection} }
    projectsCtaTags(pagination: { limit: 100 }) { ${listItemSelection} }
    projectsCtaButton { ${buttonSelection} }
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

const donationMethodSelection = `id name description href linkText fee icon`;

const donatePageSelection = `
    ${entryMetaSelection}
    intro { ${headingSelection} }
    channelLinks(pagination: { limit: 10 }) { ${linkSelection} }
    accountsHeading { ${headingSelection} }
    accounts(pagination: { limit: 100 }) { id bank accountType accountNumber holder taxId swift holderAddress bankAddress currency wireNote note }
    transferNote
    internationalHeading { ${headingSelection} }
    paymentMethodsHeading { ${headingSelection} }
    paymentMethods(pagination: { limit: 100 }) { ${donationMethodSelection} }
    transferAppsHeading { ${headingSelection} }
    transferApps(pagination: { limit: 100 }) { ${donationMethodSelection} }
    english { id title body note }
    faqHeading { ${headingSelection} }
    faq(pagination: { limit: 100 }) { id question answer }
    impactHeading { ${headingSelection} }
    impactCards(pagination: { limit: 100 }) { ${cardSelection} }
    otherWaysHeading { ${headingSelection} }
    otherWays(pagination: { limit: 100 }) { ${cardSelection} }
    contactButton { ${buttonSelection} }
    whatsappLink { ${linkSelection} }
    legalNote
    seo { ${seoSelection} }
`;

const legalTransparencySelection = `
    ${entryMetaSelection}
    eyebrow
    title
    intro
    legalName
    tradeName
    ruc
    legalForm
    legalStatus
    ministryResolution
    incorporationDate
    suiosCode
    boardRegistration
    legalRepresentative
    economicActivity
    addressStreet
    addressLocality
    addressRegion
    addressCountry
    email
    phone
    website
    records(pagination: { limit: 100 }) { id label value }
    verificationLinks(pagination: { limit: 100 }) { ${linkSelection} }
    documents(pagination: { limit: 100 }) { id title note file { ${uploadFileSelection} } }
    note
    pageLink { ${linkSelection} }
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
    projectsCtaHeading: SectionHeadingSchema().nullish(),
    projectsCtaTags: z.array(ListItemSchema().nullable()).nullish(),
    projectsCtaButton: ActionButtonSchema().nullish(),
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

const homepageEn = defineCollection({
  loader: strapiConfigured
    ? strapiLoader({
        mode: "single",
        rootField: "homepage",
        selection: homepageSelection,
        client: clientHeaders,
        cacheDurationInMs: contentCacheMs,
        idResolver: () => "homepage",
        locale: "en",
      })
    : preserveCachedContent("homepage:en"),
  schema: HomepageSchema().extend({
    testimonialsTitle: z.string().nullish(),
    teamTitle: z.string().nullish(),
    featuredProject: FeaturedProjectSchema().nullish(),
    projectsCtaHeading: SectionHeadingSchema().nullish(),
    projectsCtaTags: z.array(ListItemSchema().nullable()).nullish(),
    projectsCtaButton: ActionButtonSchema().nullish(),
  }),
});

const footerEn = defineCollection({
  loader: strapiConfigured
    ? strapiLoader({
        mode: "single",
        rootField: "footer",
        selection: footerSelection,
        client: clientHeaders,
        cacheDurationInMs: contentCacheMs,
        idResolver: () => "footer",
        locale: "en",
      })
    : preserveCachedContent("footer:en"),
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

/* El plugin Navigation guarda un árbol por idioma. Mientras el árbol `header`
   en inglés no exista en el CMS, este loader devuelve una lista vacía y los
   layouts usan `navigationFallbackEn` (src/data/pages/global.ts). */
const navigationHeaderEn = defineCollection({
  loader: strapiConfigured
    ? navigationLoader({
        slug: "header",
        locale: "en",
        url: STRAPI_BASE,
        token: STRAPI_TOKEN,
        cacheMs: contentCacheMs,
      })
    : preserveCachedContent("navigationHeader:en"),
  schema: NavigationTreeSchema,
});

/* ── Single types de página ────────────────────────────────────────────── */
/* Cada single type se registra una vez por idioma. Una colección de Astro
   admite un solo loader, y el loader lleva el locale dentro de la consulta
   GraphQL, así que dos idiomas son necesariamente dos colecciones: `aboutPage`
   (español) y `aboutPageEn` (inglés). `loadPageContent` es quien elige entre
   las dos, y quien cae al español cuando el inglés todavía está vacío. */
const definePageSingle = <S extends z.ZodType>(
  rootField: string,
  selection: string,
  schema: S,
  locale: string = "es"
) => {
  const suffix = locale === "es" ? "" : `:${locale}`;
  return defineCollection({
    loader: strapiConfigured
      ? strapiLoader({
          mode: "single",
          rootField,
          selection,
          client: clientHeaders,
          cacheDurationInMs: contentCacheMs,
          idResolver: () => rootField,
          locale,
        })
      : preserveCachedContent(`${rootField}${suffix}`),
    schema,
  });
};

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
const legalTransparency = definePageSingle(
  "legalTransparency",
  legalTransparencySelection,
  LegalTransparencySchema()
);
const donatePage = definePageSingle("donatePage", donatePageSelection, DonatePageSchema());

/* Los mismos single types en inglés. El editor traduce en el CMS con el
   selector de idioma del admin; hasta que lo haga, estas colecciones llegan
   vacías y `loadPageContent` sirve el español. */
const aboutPageEn = definePageSingle("aboutPage", aboutPageSelection, AboutPageSchema(), "en");
const impactPageEn = definePageSingle("impactPage", impactPageSelection, ImpactPageSchema(), "en");
const projectsPageEn = definePageSingle("projectsPage", projectsPageSelection, ProjectsPageSchema(), "en");
const batucadaPageEn = definePageSingle("batucadaPage", batucadaPageSelection, BatucadaPageSchema(), "en");
const batucadaEcosystemPageEn = definePageSingle(
  "batucadaEcosystemPage",
  batucadaEcosystemPageSelection,
  BatucadaEcosystemPageSchema(),
  "en"
);
const batucadaHistoryPageEn = definePageSingle(
  "batucadaHistoryPage",
  batucadaHistoryPageSelection,
  BatucadaHistoryPageSchema(),
  "en"
);
const globalSettingsEn = definePageSingle("global", globalSelection, GlobalSettingsSchema(), "en");
const legalTransparencyEn = definePageSingle(
  "legalTransparency",
  legalTransparencySelection,
  LegalTransparencySchema(),
  "en"
);
const donatePageEn = definePageSingle("donatePage", donatePageSelection, DonatePageSchema(), "en");

/* Testimonios y Equipo (collection types en Strapi, orden por campo sort). */
const testimonials = defineCollection({
  loader: strapiConfigured
    ? strapiLoader({
        mode: "collection",
        rootField: "testimonials",
        selection: testimonialSelection,
        client: clientHeaders,
        cacheDurationInMs: contentCacheMs,
      })
    : preserveCachedContent("testimonials"),
  schema: TestimonialEntrySchema(),
});

const teamMembers = defineCollection({
  loader: strapiConfigured
    ? strapiLoader({
        mode: "collection",
        rootField: "teamMembers",
        selection: teamMemberSelection,
        client: clientHeaders,
        cacheDurationInMs: contentCacheMs,
      })
    : preserveCachedContent("teamMembers"),
  schema: TeamMemberEntrySchema(),
});

/* Testimonios y Equipo en inglés. Hasta que el CMS desplegado tenga la
   internacionalización activada en esos dos tipos, la consulta con `locale`
   falla y el loader conserva la caché vacía: la portada inglesa sigue
   mostrándolos en español, que es el comportamiento de respaldo del sitio. */
const testimonialsEn = defineCollection({
  loader: strapiConfigured
    ? strapiLoader({
        mode: "collection",
        rootField: "testimonials",
        selection: testimonialSelection,
        client: clientHeaders,
        cacheDurationInMs: contentCacheMs,
        locale: "en",
      })
    : preserveCachedContent("testimonials:en"),
  schema: TestimonialEntrySchema(),
});

const teamMembersEn = defineCollection({
  loader: strapiConfigured
    ? strapiLoader({
        mode: "collection",
        rootField: "teamMembers",
        selection: teamMemberSelection,
        client: clientHeaders,
        cacheDurationInMs: contentCacheMs,
        locale: "en",
      })
    : preserveCachedContent("teamMembers:en"),
  schema: TeamMemberEntrySchema(),
});

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

const builderPagesEn = defineCollection({
  loader: strapiConfigured
    ? strapiLoader({
        mode: "collection",
        rootField: "pages",
        selection: builderPageSelection,
        client: clientHeaders,
        cacheDurationInMs: contentCacheMs,
        locale: "en",
      })
    : preserveCachedContent("pages:en"),
  schema: BuilderPageSchema(),
});

export const collections = {
  posts,
  homepage,
  homepageEn,
  navigationHeader,
  navigationHeaderEn,
  footer,
  footerEn,
  testimonials,
  testimonialsEn,
  teamMembers,
  teamMembersEn,
  aboutPage,
  aboutPageEn,
  impactPage,
  impactPageEn,
  projectsPage,
  projectsPageEn,
  batucadaPage,
  batucadaPageEn,
  batucadaEcosystemPage,
  batucadaEcosystemPageEn,
  batucadaHistoryPage,
  batucadaHistoryPageEn,
  globalSettings,
  globalSettingsEn,
  legalTransparency,
  legalTransparencyEn,
  donatePage,
  donatePageEn,
  builderPages,
  builderPagesEn,
};
