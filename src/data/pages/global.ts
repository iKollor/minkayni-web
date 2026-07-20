/* Fallback local de los ajustes globales del sitio (single type `global`). */

export const globalFallback = {
    siteName: "Fundación Minkayni",
    titleSuffix: "• Fundación Minkayni",
    defaultSeo: {
        metaTitle: "Fundación Minkayni",
        metaDescription: "Fundación Minkayni transforma comunidades a través del arte, el liderazgo juvenil y la cultura de paz en Guayaquil.",
    },
    contactEmail: "xavier.moreira@minkayni.org",
    whatsappUrl: "https://wa.me/593985261647",
    menuLabel: "Fundación MINKAYNI",
    pageNav: [
        { text: "Momentos", href: "#moments" },
        { text: "Testimonios", href: "#testimonials" },
        { text: "Nosotros", href: "#about-us" },
        { text: "Proyectos", href: "#projects" },
    ],
};

/* Textos del footer que hoy están fijos en el componente (mezclados con
   la entrada `footer` de Strapi en los layouts). */
export const footerTextsFallback = {
    partnersTitle: "Nuestros Aliados",
    joinTitle: "¿Quieres ser nuestro aliado?",
    joinSubtitle: "Juntos construyamos nuevas oportunidades",
    joinButton: { href: "/about#contacto", defaultText: "Quiero unirme 💜", hoverText: "a cambiar vidas ✨" },
};

/* Títulos de secciones de la portada (campos nuevos del single type homepage). */
export const homepageTextsFallback = {
    testimonialsTitle: "Historias de cambio",
    teamTitle: "Conoce a nuestro equipo",
};

/* Bloque "Proyecto destacado" de la portada (componente sections.featured-project). */
export const featuredProjectFallback = {
    title: "Proyecto destacado",
    body: "Nuestro proyecto estrella es la Batucada Popular, una iniciativa cultural y social que utiliza la música —especialmente los tambores y la percusión— como herramienta de transformación comunitaria y protección de jóvenes en contextos vulnerables.\n\nAl promover Derechos Humanos, convivencia pacífica y resistencia cultural, la Batucada crea un refugio comunitario y fortalece redes de apoyo barrial.",
    button: { href: "/projects/batucada-popular/", defaultText: "Descubre más 🚀", hoverText: "Y siente su impacto 🔥" },
};
