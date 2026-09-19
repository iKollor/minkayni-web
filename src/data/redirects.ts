/* Rutas viejas del sitio y su destino real, en un único sitio.
 *
 * Esta tabla la consumen dos cosas que antes no se hablaban:
 *
 * 1. `astro.config.ts`, que genera con ella las redirecciones del build (una
 *    página con `meta refresh` por cada ruta vieja, que es lo que Astro emite
 *    en modo estático).
 * 2. `loadNavigation()`, que la aplica al árbol que llega del CMS para que los
 *    enlaces del menú apunten DIRECTOS al destino.
 *
 * El punto 2 es el que importa: el plugin Navigation de Strapi guarda "Súmate"
 * apuntando a `/join`, una ruta que no existe. Quien pulsaba el ítem principal
 * del menú aterrizaba en una página en blanco con `meta refresh` y de ahí
 * rebotaba a `/about#contacto`. Con la tabla aplicada al menú, el enlace ya
 * lleva a `/about#contacto` y la redirección queda solo como red de seguridad
 * para enlaces antiguos que alguien haya compartido.
 *
 * Lo ideal sigue siendo corregir la URL en el admin de Strapi; mientras no se
 * haga, el sitio no enseña un enlace roto.
 *
 * Las claves van SIN prefijo de idioma: `rutasRedirigidas()` deriva las
 * inglesas anteponiendo `/en` a los dos lados.
 */

export const REDIRECCIONES: Readonly<Record<string, string>> = {
    "/batucada-popular": "/projects/batucada-popular/",
    "/join": "/about#contacto",
};

/** La tabla tal y como la espera `redirects` de Astro: los dos idiomas. */
export const rutasRedirigidas = (): Record<string, string> => {
    const salida: Record<string, string> = {};
    for (const [origen, destino] of Object.entries(REDIRECCIONES)) {
        salida[origen] = destino;
        /* Un enlace antiguo compartido por alguien no sabe de idiomas, y
           `/en/join` escrito a mano es una suposición razonable de quien
           navega en inglés. */
        salida[`/en${origen}`] = `/en${destino}`;
    }
    return salida;
};

/** Destino real de una ruta, o la misma ruta si no está redirigida.
    Acepta la ruta con o sin barra final. */
export const destinoReal = (ruta: string): string => {
    if (!ruta) return ruta;
    const sinBarra = ruta.length > 1 ? ruta.replace(/\/$/, "") : ruta;
    return REDIRECCIONES[sinBarra] ?? ruta;
};
