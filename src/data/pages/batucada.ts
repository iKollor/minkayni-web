/* Fallback local de /projects/batucada-popular (página principal del proyecto). */
import type { ImageMetadata } from "astro";
import type { CmsMedia } from "./types";
import HeroPhoto from "../../assets/FOTO_BATUCADA.webp";
import CommunityPhoto from "../../assets/batucada-popular/comunidad.webp";

export const batucadaFallback = {
    heroMetaLeft: "Guayaquil, Ecuador",
    heroMetaRight: "Desde 2020",
    heroTitle: "El barrio suena, se organiza y se transforma.",
    heroCaption: "Arte, organización y transformación comunitaria.",
    heroPrimary: { text: "Conoce el proceso", href: "#historia" },
    heroSecondary: { text: "Ver metodología", href: "#metodologia" },
    heroImage: null as CmsMedia,
    heroLocalImage: HeroPhoto as ImageMetadata | undefined,
    heroImageAlt: "Jóvenes de Batucada Popular tocando tambores durante una presentación",
    introHeading: {
        eyebrow: "Un proceso construido desde los territorios",
        title: "Cuando el tambor convoca, la comunidad *responde*.",
    },
    introBody:
        "Batucada Popular es un colectivo juvenil comunitario y territorial que desarrolla procesos de organización, formación y participación con niñas, niños, adolescentes y jóvenes de sectores populares de Guayaquil.\n\nA través de la percusión, la educación popular y la acción comunitaria, el arte se convierte en una herramienta para fortalecer la convivencia, el liderazgo juvenil y la defensa de los derechos humanos — y para prevenir la captación y el reclutamiento forzado en los barrios.",
    figures: [
        { value: "+300", target: 300, prefix: "+", label: "integrantes" },
        { value: "12", target: 12, prefix: "", label: "sectores" },
        { value: "2020", target: 0, prefix: "", label: "desde" },
    ],
    originTitle: "De dónde venimos",
    originItems: [
        { period: "2019–20", title: "Palos y baldes.", text: "La batucada nace en pandemia como una iniciativa familiar frente al miedo, con instrumentos improvisados." },
        {
            period: "2020",
            title: "La protesta.",
            text: "Salimos con baldes, junto a jóvenes y niños, a reclamar por el presupuesto de las universidades. Fuimos apresados — y esa experiencia nos convenció de organizar a las juventudes para defender sus derechos de forma pacífica.",
        },
        { period: "2020–21", title: "Batambá.", text: "La semilla feminista: las madres que sostenían la vida de los barrios integraron a sus hijas e hijos al proceso." },
        { period: "Hoy", title: "Un referente.", text: "Una red juvenil que moviliza a la ciudad para exigir derechos de manera pacífica y no violenta." },
    ],
    originLink: { text: "Lee la historia completa", href: "/projects/batucada-popular/historia/" },
    pulseHeading: {
        eyebrow: "El corazón del proyecto",
        title: "La percusión es un pretexto para encontrarnos y organizarnos.",
        body: "Los ensayos permanentes son espacios seguros donde las juventudes fortalecen sus capacidades artísticas, desarrollan disciplina, construyen vínculos solidarios y se reconocen como protagonistas del cambio social.",
    },
    pulseHighlight: "No se trata solo de aprender música. Se trata de pertenecer.",
    pulseImage: null as CmsMedia,
    pulseLocalImage: CommunityPhoto as ImageMetadata | undefined,
    pulseImageAlt: "Integrantes de Batucada Popular compartiendo juntas después de una presentación",
    methodHeading: {
        eyebrow: "Metodología DAARR",
        title: "Escuchar. Hacer. Acompañar. Aprender de nuevo.",
    },
    methodSteps: [
        { number: "01", title: "Diagnóstico", text: "Identificamos necesidades y fortalezas del territorio." },
        { number: "02", title: "Acción de aprendizaje", text: "Desarrollamos talleres y actividades formativas mediante el arte." },
        { number: "03", title: "Acompañamiento", text: "Damos seguimiento y fortalecemos el proceso de cada participante." },
        { number: "04", title: "Revisión", text: "Evaluamos resultados, avances y aspectos por mejorar." },
        { number: "05", title: "Reflexión", text: "Analizamos aprendizajes y proyectamos nuevas acciones comunitarias." },
    ],
    methodNote:
        "Los propios jóvenes se trasladan a otros territorios para enseñar percusión y facilitar procesos sobre derechos, salud sexual y reproductiva y nuevas masculinidades: el ciclo forma liderazgos que se multiplican.",
    territoryHeading: {
        eyebrow: "Presencia activa",
        title: "*12 sectores* conectados por una red juvenil que se organiza desde adentro.",
        body: "Más de 300 niñas, niños, adolescentes y jóvenes integran las batucadas en los barrios populares de Guayaquil. La presencia territorial permite responder a las necesidades de cada sector y fortalecer liderazgos e incidencia social desde las propias comunidades.",
    },
    /* El orden define la numeración de la lista y de los pines del mapa.
       Coordenadas de OpenStreetMap (Nominatim, julio 2026). */
    sectors: [
        { name: "Socio Vivienda", lat: -2.1321, lng: -79.9697 },
        { name: "Mapasingue", lat: -2.1536, lng: -79.9239 },
        { name: "Trinipuerto", lat: -2.252, lng: -79.911 },
        { name: "Nigeria", lat: -2.229, lng: -79.9198 },
        { name: "Sergio Toral 1", lat: -2.1142, lng: -79.9884 },
        { name: "Sergio Toral 2", lat: -2.1098, lng: -79.9897 },
        { name: "Bastión Popular, Bloque 2", lat: -2.0933, lng: -79.9257 },
        { name: "Suburbio, Cisne 1", lat: -2.215, lng: -79.907 },
        { name: "Suburbio, Cisne 2", lat: -2.2217, lng: -79.9188 },
        { name: "Guasmo Sur", lat: -2.2673, lng: -79.8927 },
        { name: "Nueva Prosperina", lat: -2.1201, lng: -79.9806 },
        { name: "Paraíso de la Flor", lat: -2.1016, lng: -79.9556 },
    ],
    territoryHint:
        "Haz clic en un sector para acercarte a su barrio. Los puntos señalan sectores, no direcciones; la presencia varía según los periodos y las condiciones de cada barrio.",
    actionHeading: {
        eyebrow: "Acción comunitaria en los barrios",
        title: "El ritmo también recupera memoria, espacio público y voz.",
    },
    communityActions: [{ text: "Encuentros barriales" }, { text: "Procesos de memoria" }, { text: "Campañas comunitarias" }, { text: "Comunicación popular" }],
    ecoHeading: {
        eyebrow: "El ecosistema",
        title: "La batucada no suena sola.",
        body: "Alrededor del proceso crecieron una organización de investigación, un movimiento de barrios, una radio juvenil y una escuela de líderes: contranarrativas que disputan la forma de contar a los barrios populares.",
    },
    ecosystemTags: [{ text: "CESCU" }, { text: "Movimiento de Barrios" }, { text: "Radio Sin Paro" }, { text: "Escuela de Líderes Jóvenes" }, { text: "Batambá" }],
    ecoLink: { text: "Conoce el ecosistema", href: "/projects/batucada-popular/ecosistema/" },
    awardsHeading: {
        eyebrow: "Reconocimientos",
        title: "El mundo empieza a escuchar.",
    },
    awards: [
        {
            year: "2024",
            recipient: "Batucada Popular",
            title: "Resilience Fund — Global Initiative Against Transnational Organized Crime",
            text: "Fellowship que reconoció a la Batucada Popular como una de las diez iniciativas seleccionadas en el mundo, entre alrededor de quinientas propuestas.",
            href: "https://resiliencefund.globalinitiative.net/batucadas-populares-fellowship-2024-ecuador/",
            linkText: "Ver el fellowship",
        },
        {
            year: "2026",
            recipient: "Batucada Popular",
            title: "Presea «Rosa Borja Febres-Cordero de Icaza»",
            text: "Mérito en Servicio Social de las preseas cívicas del Municipio de Guayaquil, a una de las mejores iniciativas populares de la ciudad.",
            href: "https://www.expreso.ec/guayaquil/municipio-guayaquil-revela-lista-ganadores-preseas-civicas-2026-289040.html",
            linkText: "Leer en Expreso",
        },
        {
            year: "",
            recipient: "Batucada Popular",
            title: "Premio Ana Frank de Jóvenes",
            text: "Reconocimiento del Centro Ana Frank Argentina para América Latina a proyectos liderados por jóvenes que promueven la convivencia y la inclusión.",
            href: "https://centroanafrank.com.ar/premio-premio-ana-frank-de-jovenes/",
            linkText: "Conoce el premio",
        },
        {
            year: "2025",
            recipient: "Fundación MINKAYNI",
            title: "ONU Mujeres — Construimos Paz",
            text: "Una de las seis organizaciones que transforman Guayaquil con arte y cultura de paz dentro del programa Construimos Paz.",
            href: "https://ecuador.unwomen.org/es/stories/noticia/2025/06/liderazgos-comunitarios-transforman-guayaquil-a-traves-del-arte-y-la-cultura-de-paz-en-el-marco-de-construimos-paz",
            linkText: "Leer en ONU Mujeres",
        },
    ],
    awardsNote:
        "También nos han contado [Plan V](https://planv.com.ec/historias/batucada-popular-guayaquil/), el [PNUD](https://www.undp.org/es/ecuador/historias/jonathan-y-la-batucada-resistencia-juventud-y-paz-en-los-barrios-de-guayaquil) y [ONU Mujeres](https://ecuador.unwomen.org/es/stories/noticia/2025/06/liderazgos-comunitarios-transforman-guayaquil-a-traves-del-arte-y-la-cultura-de-paz-en-el-marco-de-construimos-paz).",
    rightsHeading: {
        eyebrow: "Enfoque de derechos",
        title: "Participar.\nCrear.\n*Vivir sin violencia.*",
    },
    rightsBodyLeft: "El proyecto promueve el acceso a la cultura, la educación, la convivencia pacífica, la igualdad, la inclusión y el respeto a la diversidad.",
    rightsBodyRight: "Así, las juventudes no son espectadoras: lideran, cuentan sus historias y se convierten en agentes de paz en sus territorios.",
    rightsStamp: "Más tambores, menos armas",
    ctaHeading: {
        eyebrow: "Haz que el ritmo llegue más lejos",
        title: "Dale ritmo a tus proyectos y trabaja con nosotros.",
    },
    ctaPrimary: { text: "Escríbenos por WhatsApp", href: "https://wa.me/593985261647" },
    ctaSecondary: { text: "Ver la Batucada en acción", href: "https://www.instagram.com/batucada_popular_/" },
};
