/* Fallback local del single type `donate-page` (página /donate).

   La cuenta bancaria está tomada del certificado del Banco del Pacífico
   (21 feb 2024) y del certificado de RUC del SRI. El código SWIFT es el del
   banco, necesario para transferencias desde el exterior.

   ⚠️ Cualquier cambio de cuenta se edita en Strapi (Contenido → Página ·
   Aporta) y se verifica contra el certificado del banco antes de publicar:
   un dígito equivocado devuelve la transferencia al donante. */

export const donateFallback = {
    intro: {
        eyebrow: "Aporta hoy",
        title: "Tu aporte suena\nen *todo el barrio*.",
        body: "Cada donación sostiene ensayos, instrumentos y procesos formativos para las juventudes de Guayaquil. Somos una fundación sin fines de lucro legalmente constituida en Ecuador: tu aporte se transfiere directamente a la cuenta institucional de la Fundación MINKAYNI y se respalda con un certificado de donación.",
    },

    accountsHeading: {
        eyebrow: "Transferencia bancaria",
        title: "Cuentas para donar",
        body: "Por ahora recibimos donaciones por transferencia o depósito directo. Después de hacerlo, envíanos el comprobante y te devolvemos el certificado de donación de la fundación.",
    },

    accounts: [
        {
            bank: "Banco del Pacífico S.A.",
            accountType: "Cuenta Corriente",
            accountNumber: "8335982",
            holder: "FUNDACIÓN MINKAYNI",
            taxId: "0993333182001",
            swift: "PACIECEG",
            note: "Cuenta institucional activa desde el 21 de febrero de 2024.",
        },
    ],

    transferNote: "Para transferencias desde el exterior usa el código SWIFT del banco junto con el número de cuenta y el nombre del titular. Si tu banco pide una dirección, usa la dirección oficial de la fundación publicada en /transparencia.",

    impactHeading: {
        eyebrow: "A dónde va tu aporte",
        title: "Nada se queda\nen el escritorio.",
        body: "",
    },

    impactCards: [
        { title: "Instrumentos y mantenimiento", description: "Tambores, parches, baquetas y arreglos: el material que hace posible cada ensayo en los sectores donde trabajamos." },
        { title: "Procesos formativos", description: "Talleres de liderazgo, derechos humanos, prevención de violencias y comunicación popular con jóvenes y sus familias." },
        { title: "Logística de los territorios", description: "Transporte, refrigerios y espacios seguros para que ningún joven deje de participar por no tener cómo llegar." },
    ],

    otherWaysHeading: {
        eyebrow: "Otras formas de sumarte",
        title: "No todo\n*se dona en dinero*.",
        body: "",
    },

    otherWays: [
        { title: "Donación en especie", description: "Instrumentos, equipos de sonido, material didáctico o insumos para los talleres." },
        { title: "Voluntariado", description: "Facilitación, comunicación, diseño, gestión de proyectos o acompañamiento técnico." },
        { title: "Alianzas institucionales", description: "Cooperación, financiamiento de programas y proyectos conjuntos con organizaciones y empresas." },
    ],

    contactButton: { href: "mailto:admin@minkayni.org", defaultText: "Enviar comprobante 💜", hoverText: "admin@minkayni.org ✨" },
    whatsappLink: { text: "Escríbenos por WhatsApp", href: "https://wa.me/593985261647" },

    legalNote: "Fundación MINKAYNI · RUC 0993333182001 · Organización sin fines de lucro con personería jurídica otorgada mediante Resolución No. MIES-CZ-8-DDG1-2020-0059-R. Consulta nuestros datos legales completos en la página de transparencia.",

    seo: {
        metaTitle: "Aporta hoy · Fundación Minkayni",
        metaDescription: "Dona a Fundación MINKAYNI: cuenta institucional del Banco del Pacífico, datos para transferencias nacionales e internacionales y otras formas de sumarte al proyecto en Guayaquil, Ecuador.",
    },
};

export type DonateContent = typeof donateFallback;
