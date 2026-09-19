/* Memoria de visita: decide si la intro de la portada debe reproducirse.
 *
 * La intro dura cinco segundos con el scroll bloqueado. Verla una vez es el
 * saludo de la fundación; verla en cada clic a "Inicio" es un peaje. Así que
 * se guarda cuándo estuvo alguien por última vez en el sitio y la intro solo
 * vuelve a salir cuando ha pasado un rato sin actividad: quien navega ahora
 * mismo ya la vio, y quien vuelve por la tarde la recibe otra vez.
 *
 * Se mide INACTIVIDAD, no tiempo desde que se vio la intro. Por eso el sello
 * se refresca en cada carga de página —este módulo lo importa main.ts, que
 * corre en todas— y también al abandonar la pestaña, para que una lectura
 * larga no cuente como ausencia.
 *
 * `localStorage` puede lanzar (modo privado, cookies bloqueadas). Si falla,
 * se responde "visita nueva": ante la duda, la intro se ve. */

const CLAVE = "minkayni:ultima-visita";

/** Inactividad a partir de la cual la intro vuelve a considerarse una
    bienvenida y no una repetición. */
const CADUCIDAD_MS = 2 * 60 * 60 * 1000;

const sellar = (): void => {
    try {
        localStorage.setItem(CLAVE, String(Date.now()));
    } catch {
        /* Sin almacenamiento no hay nada que recordar; no es un error. */
    }
};

const leerSello = (): number | null => {
    try {
        const crudo = localStorage.getItem(CLAVE);
        if (!crudo) return null;
        const ts = Number(crudo);
        return Number.isFinite(ts) ? ts : null;
    } catch {
        return null;
    }
};

/* Se resuelve al cargar el módulo, ANTES de volver a sellar: si se sellara
   primero, la comparación siempre daría "acaba de estar aquí". */
const anterior = leerSello();
const transcurrido = anterior === null ? Number.POSITIVE_INFINITY : Date.now() - anterior;

/** `true` cuando nadie ha pasado por el sitio en las últimas dos horas (o
    cuando no hay forma de saberlo). Es el valor que consulta la intro. */
export const esVisitaNueva: boolean = transcurrido >= CADUCIDAD_MS;

sellar();

if (typeof document !== "undefined") {
    /* `pagehide` cubre el cierre y la navegación; `visibilitychange` cubre
       cambiar de pestaña. Entre los dos, una lectura larga no se confunde con
       haberse ido. Nada de temporizadores: solo eventos que ya ocurren. */
    addEventListener("pagehide", sellar);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) sellar();
    });
}
