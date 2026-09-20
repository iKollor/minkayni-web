/* ──────────────────────────────────────────────────────────────────────────
   buildMenuData(): lo que necesitan los dos menús —el desplegable de
   escritorio y el panel escalonado— construido una sola vez por página.

   Reúne el árbol de navegación (ya en el idioma y con el prefijo puesto), los
   proyectos del CMS para el megamenú, los sociales del pie, los idiomas con
   su enlace a la misma página y las etiquetas del diccionario.
─────────────────────────────────────────────────────────────────────────── */
import type { MenuData, MenuLink, MenuProject } from "../components/react/menu-types";
import type { NavTree } from "../schemas/navigation";
import type { Footer } from "../schemas/strapi.graphql.zod";
import type { ProjectItem } from "../components/projects/ProjectExplorer.astro";
import { buildSocialItems } from "../scripts/components/socials";
import { strapiMediaUrl } from "./media-url";
import { getImage } from "astro:assets";
import { locales, localeName, localizePath, stripLocale, useTranslations, type Locale } from "../i18n";

const STRAPI_URL = import.meta.env.STRAPI_URL ?? "";

const samePage = (a: string, b: string) => stripLocale(a).replace(/\/$/, "") === stripLocale(b).replace(/\/$/, "");

/* La miniatura del megamenú se pinta a 240 px de ancho. La del CMS ya llega
   redimensionada por el proxy de medios; la local de respaldo pasa por
   astro:assets por la misma razón: antes se enviaba el original de la foto
   de la Batucada (367 KB) para una tarjeta de 240 px. */
const projectImage = async (project: ProjectItem): Promise<string | undefined> => {
    const cmsUrl = project.image?.url;
    if (cmsUrl) return strapiMediaUrl(cmsUrl, STRAPI_URL, 280);
    if (!project.localImage) return undefined;
    if (project.localImage.format === "svg") return project.localImage.src;
    const { src } = await getImage({ src: project.localImage, width: 480, format: "webp" });
    return src;
};

export async function buildMenuData(opts: {
    locale: Locale;
    navHeader: NavTree;
    footer: Footer;
    projects: ProjectItem[];
    currentPath: string;
    contactEmail?: string;
}): Promise<MenuData> {
    const { locale, navHeader, footer, projects, currentPath, contactEmail } = opts;
    const t = useTranslations(locale);
    const projectsHref = localizePath("/projects", locale);

    const toLink = (title: string, path: string | undefined | null): MenuLink | null =>
        path ? { label: title, href: path, current: samePage(path, currentPath) } : null;

    /* El panel lista todos los botones del árbol; la portada se añade si el
       CMS no la incluye, como hacía el menú anterior. */
    const items = navHeader.map((b) => toLink(b.title, b.path)).filter((l): l is MenuLink => l !== null);
    const home = localizePath("/", locale);
    if (!items.some((l) => samePage(l.href, home))) items.unshift({ label: t("nav.home"), href: home, current: samePage(home, currentPath) });

    /* Cada proyecto enlaza a su tarjeta en la página de proyectos, salvo los
       que tienen página propia (Batucada Popular y sus subpáginas). */
    const menuProjects: MenuProject[] = await Promise.all(
        projects.map(async (p) => ({
            title: p.title,
            description: p.summary ?? p.detail ?? "",
            href: p.href.startsWith("/projects/") ? localizePath(p.href, locale) : `${projectsHref}#${p.anchor}`,
            src: await projectImage(p),
            alt: p.imageAlt ?? p.title,
        })),
    );

    const languages = locales.map((code) => ({
        code,
        label: localeName[code],
        short: t(code === "es" ? "lang.esShort" : "lang.enShort"),
        href: localizePath(currentPath, code),
        current: code === locale,
    }));

    return {
        items,
        projectsHref,
        projects: menuProjects,
        languages,
        socials: buildSocialItems(footer.Socials).map((s) => ({ label: s.label, href: s.href, external: true })),
        /* Lista secundaria del menú: las páginas que no vienen del árbol del
           CMS. Novedades va aquí porque el plugin Navigation no la conoce y,
           sin un enlace, una página fechada que nadie encuentra no cuenta
           como contenido actualizado para nadie. «Aporta hoy» va la primera
           por la misma razón: la página de aportes solo se enlazaba desde el
           404 y desde Novedades, y la revisión de Ad Grants pide llamadas a
           la acción alcanzables desde cualquier página. El pie las repite. */
        secondary: [
            { label: t("page.donate"), href: localizePath("/donate", locale) },
            { label: t("news.title"), href: localizePath("/novedades", locale) },
            { label: t("nav.legalTransparency"), href: localizePath("/transparencia", locale) },
        ],
        contactEmail,
        labels: {
            open: t("menu.open"),
            close: t("menu.close"),
            allProjects: t("menu.allProjects"),
            socials: t("menu.socials"),
            language: t("menu.language"),
            changeLanguage: t("lang.label"),
            navigation: t("nav.mainNavigation"),
        },
    };
}
