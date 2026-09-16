import type { NavTree } from "../schemas/navigation";
import type { Footer } from "../schemas/strapi.graphql.zod";
import { localizePath, type Locale } from "../i18n";

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

/* Menú de respaldo en inglés. Se usa mientras el árbol `header` del plugin
   Navigation no exista en ese idioma dentro del CMS —hoy la petición con
   `locale=en` devuelve una lista vacía—. Las rutas van sin prefijo: se lo
   pone `localizeNavigation`, igual que a las que llegan de Strapi. */
export const fallbackNavigationEn: NavTree = [
    { title: "Home", type: "INTERNAL", path: "/", items: [], additionalFields: { style: "default" } },
    { title: "About us", type: "INTERNAL", path: "/about", items: [], additionalFields: { style: "default" } },
    { title: "Impact", type: "INTERNAL", path: "/impact", items: [], additionalFields: { style: "default" } },
    {
        title: "Projects",
        type: "INTERNAL",
        path: "/projects",
        items: [{ title: "Batucada Popular", type: "INTERNAL", path: "/projects/batucada-popular/", items: [] }],
        additionalFields: { style: "default" },
    },
    {
        title: "Join us",
        type: "INTERNAL",
        path: "/about#contacto",
        items: [],
        additionalFields: { style: "cta", ctaText: "Let us make minka" },
    },
];

/* El CMS guarda una sola ruta por ítem (`/about`), sea cual sea el idioma del
   árbol. El prefijo `/en` es cosa del sitio, no del editor, así que se aplica
   aquí y no se le pide a nadie que lo escriba a mano en el admin. Las rutas
   externas y los anclas los deja intactos `localizePath`. */
export const localizeNavigation = (navigation: NavTree, locale: Locale): NavTree =>
    navigation.map((item) => ({
        ...item,
        path: item.path ? localizePath(item.path, locale) : item.path,
        items: item.items?.map((child) => ({
            ...child,
            path: child.path ? localizePath(child.path, locale) : child.path,
        })),
    }));

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

export const fallbackLegendEn = "The **Minkayni Foundation** is an Ecuadorian organisation that uses music, dance and community theatre as tools for social transformation. Its flagship project, **Batucada Popular**, creates safe spaces where children and teenagers build their creativity, self-esteem and sense of community.";

export const fallbackLegend = "La **Fundación Minkayni** es una organización ecuatoriana que utiliza la música, la danza y el teatro comunitario como herramientas de transformación social. Su proyecto insignia, la **Batucada Popular**, crea espacios seguros donde niñas, niños y adolescentes fortalecen su creatividad, autoestima y sentido de comunidad.";
