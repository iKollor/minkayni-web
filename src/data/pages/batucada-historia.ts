/* Fallback local de /projects/batucada-popular/historia. */
import type { ImageMetadata } from "astro";
import type { CmsMedia } from "./types";
import MarchPhoto from "../../assets/batucada-popular/marcha.webp";

export const batucadaHistoriaFallback = {
    backLink: { text: "Batucada Popular", href: "/projects/batucada-popular/" },
    hero: {
        eyebrow: "La historia",
        title: "Del miedo al redoble.",
        body: "La Batucada Popular nace durante la pandemia y recoge experiencias de muchos años atrás: una historia de barrios que aprendieron a responder juntos, contada al ritmo de sus tambores.",
    },
    pulseline: [{ text: "2019 · Palos y baldes" }, { text: "2020 · Nace en pandemia" }, { text: "Hoy · 12 sectores" }],
    timelineHeading: {
        eyebrow: "2010 → hoy",
        title: "Cada etapa dejó un aprendizaje.",
    },
    timeline: [
        {
            period: "2010–2015",
            title: "Primeros aprendizajes comunitarios",
            text: "Quienes después impulsarían MINKAYNI trabajan con poblaciones de sectores populares de Guayaquil: niñez en situación de calle, personas adultas mayores, madres solteras, personas con discapacidad. Ahí se aprende organización barrial y educación popular.",
            accent: false,
        },
        {
            period: "2016–2019",
            title: "Trabajo territorial desde Terranueva",
            text: "La experiencia continúa junto a Fundación Terranueva, con mujeres, juventudes y liderazgos comunitarios. Una certeza se consolida: los barrios ya tienen capacidades, conocimientos y redes para sostener respuestas propias.",
            accent: false,
        },
        {
            period: "2019",
            title: "Palos, baldes y ritmo",
            text: "Johanna Chévez y Xavier Moreira impulsan los primeros ensayos con instrumentos improvisados: palos, baldes, barriles y materiales reciclados. El ritmo convoca, genera confianza y abre espacios de encuentro.",
            accent: true,
        },
        {
            period: "2020",
            title: "Nace en pandemia, como familia",
            text: "Frente al miedo que rodeó la pandemia, la batucada surge primero como una iniciativa familiar. Ese mismo año se constituye jurídicamente la Fundación MINKAYNI, que acompaña y sostiene el proceso.",
            accent: false,
        },
        {
            period: "2020",
            title: "La protesta de los baldes",
            text: "En una época en que la gente temía salir, las batucadas salieron con baldes, junto a jóvenes y niños muy pequeños, a reclamar por la reducción presupuestaria de las universidades. Fuimos apresados — y esa experiencia nos convenció aún más de organizar a adolescentes y jóvenes para defender pacíficamente sus derechos conquistados.",
            accent: true,
        },
        {
            period: "2020–2021",
            title: "Batambá: la semilla feminista",
            text: "Junto a Terranueva, en el marco del grant con GIZ, se impulsan propuestas para vincular a personas en movilidad humana con las comunidades de acogida y prevenir la xenofobia. Nace Batambá, movimiento feminista comunitario, con varias técnicas del proyecto y compañeras del movimiento feminista de Guayaquil, entre otras; nuestra primera instructora fue Percha, una reconocida compañera argentina. Muchas madres sostenían sus hogares y no podían participar de forma permanente: comenzaron a involucrar a sus hijas e hijos, que se integraron al proceso.",
            accent: false,
        },
        {
            period: "2021–2022",
            title: "La violencia nos obliga a profundizar",
            text: "Entre 2021 y 2022, Guayaquil atraviesa un rápido deterioro de sus condiciones de seguridad. El aumento de la violencia armada, las disputas por el control territorial y la expansión de los grupos delictivos organizados afectan con mayor fuerza a los barrios populares, donde niñas, niños, adolescentes y jóvenes quedan cada vez más expuestos. La batucada se fortalece como estrategia comunitaria de prevención, protección y organización juvenil: nuevos referentes frente a los liderazgos del crimen organizado.",
            accent: false,
        },
        {
            period: "2022–2023",
            title: "Del taller artístico al proceso territorial",
            text: "En esta etapa comprendimos que la música podía convocar a las juventudes, pero que el verdadero proceso comenzaba después del primer redoble. Los ensayos dejaron de ser únicamente espacios para aprender ritmos y se convirtieron en lugares de encuentro, confianza, escucha y cuidado colectivo.\n\nAprender a tocar juntos también significó aprender a llegar a tiempo, respetar acuerdos, cuidar los instrumentos, escuchar al compañero y comprender que ningún ritmo se construye de manera individual. La disciplina comenzó a trabajarse como una responsabilidad compartida y no como una imposición.\n\nPoco a poco, adolescentes y jóvenes dejaron de verse solamente como participantes de un taller: asumieron responsabilidades y se reconocieron como actores de sus comunidades.",
            accent: false,
        },
        {
            period: "2023–2024",
            title: "Expansión hacia nuevos barrios",
            text: "La experiencia llega a Socio Vivienda, Suburbio (Cisne 1 y 2), Sergio Toral 1 y 2, Nigeria, Trinipuerto, Guasmo, Mapasingue, Bastión Popular, Nueva Prosperina y Paraíso de la Flor, con presencias que varían según los periodos y las condiciones de cada sector.",
            accent: false,
        },
        {
            period: "2024",
            title: "El mundo empieza a escuchar",
            text: "El Resilience Fund de la Global Initiative Against Transnational Organized Crime selecciona a la Batucada entre diez iniciativas del mundo, de unas quinientas propuestas.",
            accent: true,
        },
        {
            period: "2025",
            title: "Comunicación popular y pensamiento propio",
            text: "Nace Radio Sin Paro y se fortalecen las campañas juveniles. ONU Mujeres integra a la Batucada entre las seis organizaciones de «Construimos Paz», y FLACSO acoge el conversatorio «Batucada Popular de Guayaquil: arte y violencia». La red territorial se acerca a las 300 personas.",
            accent: false,
        },
        {
            period: "2026",
            title: "Una metodología propia",
            text: "La Batucada Popular se consolida como metodología territorial de MINKAYNI: percusión, educación popular, liderazgo juvenil, comunicación comunitaria, formación en derechos y economía circular, con el ciclo DAARR como eje.",
            accent: false,
        },
        {
            period: "2026",
            title: "Presea de la ciudad",
            text: "El Municipio de Guayaquil otorga a la Batucada Popular la presea «Rosa Borja Febres-Cordero de Icaza» al Mérito en Servicio Social. En las calles, el mensaje se vuelve consigna: «Más tambores, menos armas».",
            accent: true,
        },
        {
            period: "Hoy",
            title: "Y el redoble sigue",
            text: "Más de 300 integrantes en 12 sectores, una red de liderazgos juveniles en formación y la proyección de conectar iniciativas de Colombia, Ecuador, Brasil, México y El Salvador: una red latinoamericana de barrios que previenen la violencia con arte y organización.",
            accent: false,
        },
    ],
    senseHeading: {
        eyebrow: "El sentido de esta historia",
        title: "El dolor se volvió organización colectiva.",
        body: "La violencia obligó a profundizar el propósito: los ensayos se convirtieron en espacios de protección; los grupos, en redes de cuidado; los instrumentos, en medios para ocupar el espacio público; y las juventudes, en protagonistas de una narrativa diferente sobre los barrios populares.",
    },
    senseHighlight: "Desde los barrios también se producen conocimientos, respuestas y caminos para defender la vida.",
    senseImage: null as CmsMedia,
    senseLocalImage: MarchPhoto as ImageMetadata | undefined,
    senseImageAlt: "Jóvenes de Batucada Popular marchando con sus tambores en una calle de Guayaquil",
    ctaHeading: {
        eyebrow: "Sigue el recorrido",
        title: "La batucada no suena sola.",
    },
    ctaPrimary: { text: "Conoce el ecosistema", href: "/projects/batucada-popular/ecosistema/" },
    ctaSecondary: { text: "Volver al proyecto", href: "/projects/batucada-popular/" },
};
