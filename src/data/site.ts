import type { NavTree } from "../schemas/navigation";
import type { Footer } from "../schemas/strapi.graphql.zod";

export const fallbackNavigation: NavTree = [
    { title: "Inicio", type: "INTERNAL", path: "/", items: [], additionalFields: { style: "default" } },
    { title: "Conócenos", type: "INTERNAL", path: "/about", items: [], additionalFields: { style: "default" } },
    { title: "Impacto", type: "INTERNAL", path: "/impact", items: [], additionalFields: { style: "default" } },
    {
        title: "Proyectos",
        type: "INTERNAL",
        path: "/projects",
        items: [{ title: "Batucada Popular", type: "INTERNAL", path: "/projects/batucada-popular/", items: [] }],
        additionalFields: { style: "default" },
    },
    { title: "Súmate", type: "INTERNAL", path: "/about#contacto", items: [], additionalFields: { style: "cta", ctaText: "Hagamos minka" } },
];

export const withBatucadaProject = (navigation: NavTree): NavTree =>
    navigation.map((item) => {
        const items = item.items?.map((child) => ({ ...child })) ?? [];
        const isProjects = item.path === "/projects" || item.title.trim().toLocaleLowerCase("es") === "proyectos";

        if (!isProjects) return { ...item, items };

        const existing = items.find((child) => child.title.trim().toLocaleLowerCase("es") === "batucada popular");
        const otherItems = items.filter((child) => child !== existing);

        return {
            ...item,
            items: [
                ...otherItems,
                {
                    ...existing,
                    title: "Batucada Popular",
                    type: "INTERNAL",
                    path: "/projects/batucada-popular/",
                    items: existing?.items ?? [],
                },
            ],
        };
    });

export const fallbackFooter: Footer = {
    documentId: "fallback-footer",
    Socials: {
        id: "fallback-socials",
        facebook: "https://www.facebook.com/FMinkayni/",
        instagram: "https://www.instagram.com/batucada_popular_/",
        tiktok: "https://www.tiktok.com/@batucada.popular",
    },
    Copyright: {
        id: "fallback-copyright",
        legalname: "Fundación Minkayni",
        yearStart: 2020,
        autoYear: true,
    },
};

export const fallbackLegend = "La **Fundación Minkayni** es una organización ecuatoriana que utiliza la música, la danza y el teatro comunitario como herramientas de transformación social. Su proyecto insignia, la **Batucada Popular**, crea espacios seguros donde niñas, niños y adolescentes fortalecen su creatividad, autoestima y sentido de comunidad.";
