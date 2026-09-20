/* Constantes de la memoria de visita (ver visita.ts). Viven aparte porque las
   necesitan dos sitios que no pueden compartir módulo: `visita.ts`, que corre
   en el bundle, y el script en línea de `head.astro`, que decide ANTES del
   primer pintado si la portada arranca con la intro o directamente con el
   contenido, y recibe estos valores por `define:vars`. */

/** Clave de localStorage con la marca de tiempo de la última actividad. */
export const CLAVE_VISITA = "minkayni:ultima-visita";

/** Inactividad a partir de la cual la intro vuelve a considerarse una
    bienvenida y no una repetición. */
export const CADUCIDAD_VISITA_MS = 2 * 60 * 60 * 1000;
