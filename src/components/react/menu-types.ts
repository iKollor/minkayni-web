/* Datos que comparten los dos menús (el desplegable de escritorio y el panel
   escalonado) para que los layouts los construyan una sola vez. */

export interface MenuLink {
    label: string;
    href: string;
    /** Página actual: se pinta atenuada y sin enlace activo. */
    current?: boolean;
    external?: boolean;
}

export interface MenuProject {
    title: string;
    description: string;
    href: string;
    src?: string;
    alt?: string;
}

export interface MenuLanguage {
    code: string;
    /** Nombre del idioma en su propio idioma («Español», «English»). */
    label: string;
    short: string;
    href: string;
    current: boolean;
}

export interface MenuLabels {
    /** Texto del botón cuando el menú está cerrado / abierto. */
    open: string;
    close: string;
    allProjects: string;
    socials: string;
    language: string;
    changeLanguage: string;
    navigation: string;
}

export interface MenuData {
    /** Enlaces principales, ya en el idioma y con el prefijo de ruta puestos. */
    items: MenuLink[];
    /** Ruta canónica de la página de proyectos en este idioma (/projects o /en/projects). */
    projectsHref: string;
    projects: MenuProject[];
    languages: MenuLanguage[];
    socials: MenuLink[];
    /** Enlaces institucionales del pie del panel (transparencia legal…). */
    secondary: MenuLink[];
    labels: MenuLabels;
}
