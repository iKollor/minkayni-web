/* ──────────────────────────────────────────────────────────────────────────
   Esquemas Zod escritos a mano para los single types de página en Strapi
   (about-page, impact-page, projects-page, batucada-*, global).

   Son deliberadamente laxos (todo nullish): si un campo aún no se llenó en
   el CMS, la página usa su fallback local (src/data/fallbacks/*). Cuando se
   regenere `strapi.graphql.zod.ts` con `npm run zod:gen`, estos esquemas
   siguen siendo la fuente para las colecciones de contenido.
─────────────────────────────────────────────────────────────────────────── */
import { z } from "zod";
import { UploadFileSchema } from "./strapi.graphql.zod";

const media = () => UploadFileSchema().nullish();

export const SectionHeadingSchema = () =>
    z.object({
        id: z.string().nullish(),
        eyebrow: z.string().nullish(),
        title: z.string().nullish(),
        body: z.string().nullish(),
    });

export const LinkSchema = () =>
    z.object({
        id: z.string().nullish(),
        text: z.string().nullish(),
        href: z.string().nullish(),
    });

export const ActionButtonSchema = () =>
    z.object({
        id: z.string().nullish(),
        href: z.string().nullish(),
        defaultText: z.string().nullish(),
        hoverText: z.string().nullish(),
    });

export const TimelineItemSchema = () =>
    z.object({
        id: z.string().nullish(),
        chip: z.string().nullish(),
        period: z.string().nullish(),
        title: z.string().nullish(),
        text: z.string().nullish(),
        accent: z.boolean().nullish(),
        image: media(),
        imageAlt: z.string().nullish(),
    });

export const StatSchema = () =>
    z.object({
        id: z.string().nullish(),
        value: z.string().nullish(),
        target: z.number().nullish(),
        prefix: z.string().nullish(),
        suffix: z.string().nullish(),
        label: z.string().nullish(),
        detail: z.string().nullish(),
    });

export const MethodStepSchema = () =>
    z.object({
        id: z.string().nullish(),
        number: z.string().nullish(),
        title: z.string().nullish(),
        text: z.string().nullish(),
    });

export const AwardSchema = () =>
    z.object({
        id: z.string().nullish(),
        year: z.string().nullish(),
        org: z.string().nullish(),
        recipient: z.string().nullish(),
        title: z.string().nullish(),
        text: z.string().nullish(),
        href: z.string().nullish(),
        linkText: z.string().nullish(),
    });

export const PressItemSchema = () =>
    z.object({
        id: z.string().nullish(),
        outlet: z.string().nullish(),
        year: z.string().nullish(),
        title: z.string().nullish(),
        href: z.string().nullish(),
        logo: media(),
    });

export const OrgCardSchema = () =>
    z.object({
        id: z.string().nullish(),
        kind: z.string().nullish(),
        name: z.string().nullish(),
        text: z.string().nullish(),
        accentColor: z.string().nullish(),
        dark: z.boolean().nullish(),
        logo: media(),
        instagramUrl: z.string().nullish(),
    });

export const SectorSchema = () =>
    z.object({
        id: z.string().nullish(),
        name: z.string().nullish(),
        lat: z.number().nullish(),
        lng: z.number().nullish(),
    });

export const ListItemSchema = () =>
    z.object({
        id: z.string().nullish(),
        text: z.string().nullish(),
        meta: z.string().nullish(),
    });

export const LinkCardSchema = () =>
    z.object({
        id: z.string().nullish(),
        eyebrow: z.string().nullish(),
        title: z.string().nullish(),
        text: z.string().nullish(),
        href: z.string().nullish(),
        linkText: z.string().nullish(),
        external: z.boolean().nullish(),
    });

export const CardSchema = () =>
    z.object({
        id: z.string().nullish(),
        title: z.string().nullish(),
        description: z.string().nullish(),
        icon: media(),
        showIcon: z.boolean().nullish(),
        cta: z.string().nullish(),
    });

export const MetricGroupSchema = () =>
    z.object({
        id: z.string().nullish(),
        title: z.string().nullish(),
        metrics: z.array(ListItemSchema().nullable()).nullish(),
    });

export const ProjectCardSchema = () =>
    z.object({
        id: z.string().nullish(),
        anchor: z.string().nullish(),
        category: z.string().nullish(),
        categoryLabel: z.string().nullish(),
        type: z.string().nullish(),
        title: z.string().nullish(),
        summary: z.string().nullish(),
        detail: z.string().nullish(),
        image: media(),
        imageAlt: z.string().nullish(),
        href: z.string().nullish(),
        linkText: z.string().nullish(),
        external: z.boolean().nullish(),
        accent: z.string().nullish(),
    });

export const FeaturedProjectSchema = () =>
    z.object({
        id: z.string().nullish(),
        title: z.string().nullish(),
        body: z.string().nullish(),
        logo: media(),
        photo: media(),
        button: ActionButtonSchema().nullish(),
    });

export const SeoSchema = () =>
    z.object({
        id: z.string().nullish(),
        metaTitle: z.string().nullish(),
        metaDescription: z.string().nullish(),
        shareImage: media(),
    });

const entryBase = {
    documentId: z.string().nullish(),
    createdAt: z.string().nullish(),
    updatedAt: z.string().nullish(),
    publishedAt: z.string().nullish(),
    locale: z.string().nullish(),
};

export const AboutPageSchema = () =>
    z.object({
        ...entryBase,
        intro: SectionHeadingSchema().nullish(),
        actionLines: z.array(CardSchema().nullable()).nullish(),
        historyHeading: SectionHeadingSchema().nullish(),
        timeline: z.array(TimelineItemSchema().nullable()).nullish(),
        mission: CardSchema().nullish(),
        vision: CardSchema().nullish(),
        ecosystemHeading: SectionHeadingSchema().nullish(),
        ecosystemCards: z.array(OrgCardSchema().nullable()).nullish(),
        ecosystemLink: LinkSchema().nullish(),
        teamHeading: SectionHeadingSchema().nullish(),
        teamMembers: z.array(CardSchema().nullable()).nullish(),
        teamNote: z.string().nullish(),
        transparencyHeading: SectionHeadingSchema().nullish(),
        policies: z.array(ListItemSchema().nullable()).nullish(),
        transparencyNote: z.string().nullish(),
        pressHeading: SectionHeadingSchema().nullish(),
        pressLinks: z.array(PressItemSchema().nullable()).nullish(),
        pressCta: LinkSchema().nullish(),
        contactHeading: SectionHeadingSchema().nullish(),
        contactButton: ActionButtonSchema().nullish(),
        contactSecondary: LinkSchema().nullish(),
        seo: SeoSchema().nullish(),
    });
export type AboutPage = z.infer<ReturnType<typeof AboutPageSchema>>;

export const ImpactPageSchema = () =>
    z.object({
        ...entryBase,
        intro: SectionHeadingSchema().nullish(),
        sectionNav: z.array(LinkSchema().nullable()).nullish(),
        stats: z.array(StatSchema().nullable()).nullish(),
        statsNote: z.string().nullish(),
        resultsHeading: SectionHeadingSchema().nullish(),
        resultsQuote: z.string().nullish(),
        resultsQuoteCite: z.string().nullish(),
        resultsLink: LinkSchema().nullish(),
        results: z.array(StatSchema().nullable()).nullish(),
        otherProcessesTitle: z.string().nullish(),
        otherProcesses: z.array(MetricGroupSchema().nullable()).nullish(),
        awardsHeading: SectionHeadingSchema().nullish(),
        awards: z.array(AwardSchema().nullable()).nullish(),
        awardsNote: z.string().nullish(),
        pressHeading: SectionHeadingSchema().nullish(),
        pressItems: z.array(PressItemSchema().nullable()).nullish(),
        journeyHeading: SectionHeadingSchema().nullish(),
        journeyCards: z.array(LinkCardSchema().nullable()).nullish(),
        ctaHeading: SectionHeadingSchema().nullish(),
        ctaButton: ActionButtonSchema().nullish(),
        seo: SeoSchema().nullish(),
    });
export type ImpactPage = z.infer<ReturnType<typeof ImpactPageSchema>>;

export const ProjectsPageSchema = () =>
    z.object({
        ...entryBase,
        intro: SectionHeadingSchema().nullish(),
        explorerHeading: SectionHeadingSchema().nullish(),
        filters: z.array(ListItemSchema().nullable()).nullish(),
        projects: z.array(ProjectCardSchema().nullable()).nullish(),
        methodHeading: SectionHeadingSchema().nullish(),
        methodSteps: z.array(MethodStepSchema().nullable()).nullish(),
        methodLink: LinkSchema().nullish(),
        horizonHeading: SectionHeadingSchema().nullish(),
        horizonCards: z.array(CardSchema().nullable()).nullish(),
        alliancesHeading: SectionHeadingSchema().nullish(),
        allies: z.array(ListItemSchema().nullable()).nullish(),
        alliancesNote: z.string().nullish(),
        ctaButton: ActionButtonSchema().nullish(),
        ctaSecondary: LinkSchema().nullish(),
        seo: SeoSchema().nullish(),
    });
export type ProjectsPage = z.infer<ReturnType<typeof ProjectsPageSchema>>;

export const BatucadaPageSchema = () =>
    z.object({
        ...entryBase,
        heroMetaLeft: z.string().nullish(),
        heroMetaRight: z.string().nullish(),
        heroTitle: z.string().nullish(),
        heroCaption: z.string().nullish(),
        heroPrimary: LinkSchema().nullish(),
        heroSecondary: LinkSchema().nullish(),
        heroImage: media(),
        introHeading: SectionHeadingSchema().nullish(),
        introBody: z.string().nullish(),
        figures: z.array(StatSchema().nullable()).nullish(),
        originTitle: z.string().nullish(),
        originItems: z.array(TimelineItemSchema().nullable()).nullish(),
        originLink: LinkSchema().nullish(),
        pulseHeading: SectionHeadingSchema().nullish(),
        pulseHighlight: z.string().nullish(),
        pulseImage: media(),
        methodHeading: SectionHeadingSchema().nullish(),
        methodSteps: z.array(MethodStepSchema().nullable()).nullish(),
        methodNote: z.string().nullish(),
        territoryHeading: SectionHeadingSchema().nullish(),
        sectors: z.array(SectorSchema().nullable()).nullish(),
        territoryHint: z.string().nullish(),
        actionHeading: SectionHeadingSchema().nullish(),
        communityActions: z.array(ListItemSchema().nullable()).nullish(),
        ecoHeading: SectionHeadingSchema().nullish(),
        ecosystemTags: z.array(ListItemSchema().nullable()).nullish(),
        ecoLink: LinkSchema().nullish(),
        awardsHeading: SectionHeadingSchema().nullish(),
        awards: z.array(AwardSchema().nullable()).nullish(),
        awardsNote: z.string().nullish(),
        rightsHeading: SectionHeadingSchema().nullish(),
        rightsBodyLeft: z.string().nullish(),
        rightsBodyRight: z.string().nullish(),
        rightsStamp: z.string().nullish(),
        ctaHeading: SectionHeadingSchema().nullish(),
        ctaPrimary: LinkSchema().nullish(),
        ctaSecondary: LinkSchema().nullish(),
        seo: SeoSchema().nullish(),
    });
export type BatucadaPage = z.infer<ReturnType<typeof BatucadaPageSchema>>;

export const BatucadaEcosystemPageSchema = () =>
    z.object({
        ...entryBase,
        backLink: LinkSchema().nullish(),
        hero: SectionHeadingSchema().nullish(),
        pulseline: z.array(ListItemSchema().nullable()).nullish(),
        organismsHeading: SectionHeadingSchema().nullish(),
        organisms: z.array(OrgCardSchema().nullable()).nullish(),
        horizonsHeading: SectionHeadingSchema().nullish(),
        horizons: z.array(CardSchema().nullable()).nullish(),
        alliesHeading: SectionHeadingSchema().nullish(),
        allies: z.array(ListItemSchema().nullable()).nullish(),
        ctaHeading: SectionHeadingSchema().nullish(),
        ctaPrimary: LinkSchema().nullish(),
        ctaSecondary: LinkSchema().nullish(),
        seo: SeoSchema().nullish(),
    });
export type BatucadaEcosystemPage = z.infer<ReturnType<typeof BatucadaEcosystemPageSchema>>;

export const BatucadaHistoryPageSchema = () =>
    z.object({
        ...entryBase,
        backLink: LinkSchema().nullish(),
        hero: SectionHeadingSchema().nullish(),
        pulseline: z.array(ListItemSchema().nullable()).nullish(),
        timelineHeading: SectionHeadingSchema().nullish(),
        timeline: z.array(TimelineItemSchema().nullable()).nullish(),
        senseHeading: SectionHeadingSchema().nullish(),
        senseHighlight: z.string().nullish(),
        senseImage: media(),
        ctaHeading: SectionHeadingSchema().nullish(),
        ctaPrimary: LinkSchema().nullish(),
        ctaSecondary: LinkSchema().nullish(),
        seo: SeoSchema().nullish(),
    });
export type BatucadaHistoryPage = z.infer<ReturnType<typeof BatucadaHistoryPageSchema>>;

/* Subpáginas del constructor (collection type `page` con dynamic zone).
   Las secciones se validan de forma laxa: cada bloque se discrimina en el
   renderer por __typename. */
export const BuilderPageSchema = () =>
    z.object({
        ...entryBase,
        title: z.string().nullish(),
        slug: z.string().nullish(),
        description: z.string().nullish(),
        sections: z.array(z.any()).nullish(),
        seo: SeoSchema().nullish(),
    });
export type BuilderPage = z.infer<ReturnType<typeof BuilderPageSchema>>;

export const GlobalSettingsSchema = () =>
    z.object({
        ...entryBase,
        siteName: z.string().nullish(),
        titleSuffix: z.string().nullish(),
        defaultSeo: SeoSchema().nullish(),
        contactEmail: z.string().nullish(),
        whatsappUrl: z.string().nullish(),
        menuLabel: z.string().nullish(),
        pageNav: z.array(LinkSchema().nullable()).nullish(),
    });
export type GlobalSettings = z.infer<ReturnType<typeof GlobalSettingsSchema>>;
