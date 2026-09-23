/* Directiva `client:lcp`: hidrata la isla cuando Chrome ya ha anotado el
   LCP (ver `trasLcp` en layouts/lib/head.astro), en vez de al primer hueco
   del hilo (`client:idle`), que en una visita nueva suele llegar antes.
   Con `client:idle` el runtime de React (75 KB) se pedía antes del LCP y
   el modelo de PageSpeed lo sumaba al LCP.

   Excepción: al llegar desde otra página del sitio con la cortina de
   píxeles echada (`html[data-curtain="covered"]`, la marca la pone un
   script en línea del <head>), se hidrata cuanto antes: la isla de la
   cortina es la que la retira, y con la página tapada no hay LCP que
   esperar. */
import type { ClientDirective } from "astro";

const lcp: ClientDirective = (load) => {
    const hidratar = async () => {
        const hydrate = await load();
        await hydrate();
    };
    if (document.documentElement.dataset.curtain === "covered") {
        void hidratar();
        return;
    }
    (window.trasLcp || ((fn: () => void) => fn()))(() => void hidratar());
};

export default lcp;
