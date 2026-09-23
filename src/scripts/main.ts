import { gsap } from "gsap";
import { ScrollSmoother, ScrollTrigger, SplitText, DrawSVGPlugin, ScrollToPlugin, Draggable, InertiaPlugin } from "gsap/all";

/* Solo los plugins que algún componente usa de verdad. Ojo: un plugin se usa
   por la PROPIEDAD del tween, no por su import —`drawSVG:` en BurgerIcon.astro
   (la hamburguesa del menú) y `scrollTo:` en ImmersiveTimeline.astro no
   importan nada de gsap/all—. Sin DrawSVG registrado la hamburguesa se pinta
   con sus trazos completos y no anima. TextPlugin y MotionPath sí sobran:
   ninguna animación del sitio usa `text:` ni `motionPath:`. */
gsap.registerPlugin(ScrollSmoother, ScrollTrigger, SplitText, DrawSVGPlugin, ScrollToPlugin, Draggable, InertiaPlugin);

/* Sella el paso por el sitio en CADA página: la intro de la portada mide
   inactividad, no tiempo desde que se vio. Importado por efecto, sin API. */
import "./visita";
import { isIOS, isMobileViewport, prefersReducedMotion, whenIdle } from "./platform";
import { onWidthResize } from "./viewport";

/* En móvil, ocultar la barra de direcciones dispara `resize` sin que cambie el
   ancho. Sin esto, ScrollTrigger recalcula TODAS sus posiciones en pleno
   desplazamiento y cada animación anclada al scroll da un salto. Es el ajuste
   que GSAP documenta justo para este caso; el resize «real» (rotar, cambiar
   el tamaño de la ventana) sigue refrescando con normalidad. */
ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: "visibilitychange,load,resize" });

/* Un solo `ScrollTrigger.refresh()` por cuadro. Cada componente pide el suyo
   al arrancar (navbar, intro, momentos, testimonios, carrusel, nav lateral…):
   en la portada eran siete u ocho seguidos, y cada uno vuelve a medir todos
   los disparadores contra un DOM recién escrito —PageSpeed los veía como
   tareas largas de GSAP de 200–300 ms en escritorio—. Aquí se agrupan en
   uno en el siguiente cuadro; ningún llamador lee posiciones justo después.
   El refresco automático de DOMContentLoaded sobra por lo mismo: el de
   `load` (ya con imágenes y fuentes) es el que deja las posiciones buenas. */
const refreshOriginal = ScrollTrigger.refresh.bind(ScrollTrigger);
let refreshPendiente = false;
let refreshSeguro = true;
ScrollTrigger.refresh = ((safe?: boolean) => {
    refreshSeguro = refreshSeguro && safe !== false;
    if (refreshPendiente) return;
    refreshPendiente = true;
    requestAnimationFrame(() => {
        refreshPendiente = false;
        const seguro = refreshSeguro;
        refreshSeguro = true;
        refreshOriginal(seguro);
    });
}) as typeof ScrollTrigger.refresh;

// Solicitar primero las variantes que usa SplitText. `document.fonts.ready`
// por sí solo puede resolverse antes de que el contenido oculto pida su fuente.
const fontsReady: Promise<void> = (async () => {
    if (typeof document === "undefined" || !document.fonts) return;
    /* Las @font-face las declara FontFaces.astro tras el primer cuadro; hasta
       entonces `document.fonts.load` no encontraría ninguna cara que cargar. */
    await window.fontsDeclared;

    const descriptors = [
        '400 16px "Aristotelica Pro Text"',
        '700 16px "Aristotelica Pro Text"',
        '400 16px "Aristotelica Pro Display"',
        '700 16px "Aristotelica Pro Display"',
        '900 16px "Aristotelica Pro Display"',
        '400 16px "Sao Torpes"',
    ];

    await Promise.allSettled(descriptors.map((descriptor) => document.fonts.load(descriptor)));
    await document.fonts.ready;
})().catch(() => void 0);

const waitForFontsReady = (cb: () => void) => {
    fontsReady.then(() => {
        requestAnimationFrame(() => requestAnimationFrame(cb));
    });
};

const enforceNoOverflowX = () => {
    gsap.set(["html", "body", "#smooth-wrapper", "#smooth-content"], { overflowX: "hidden" });
};

const introFinished = () => !document.getElementById("intro-overlay") && !document.documentElement.classList.contains("no-scroll");

const createSmoother = () => {
    if (ScrollSmoother.get()) return;
    /* iOS Safari choca con el scroll suavizado propio, y en móvil el wrapper
       y el body acabarían desplazándose los dos. Ahí se queda el nativo. */
    if (isIOS() || isMobileViewport()) return;

    try {
        ScrollSmoother.create({
            wrapper: "#smooth-wrapper",
            content: "#smooth-content",
            smooth: 1.1,
            effects: true,
        });
        enforceNoOverflowX();
    } catch (e) {
        console.error("[smooth] Error creando ScrollSmoother:", e);
    }
};

const waitForIntroAndInit = () => {
    if (introFinished()) {
        createSmoother();
        return;
    }

    const obs = new MutationObserver(() => {
        if (!introFinished()) return;
        obs.disconnect();
        createSmoother();
    });
    obs.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
    });

    /* Seguro por si la intro no llega a retirarse: sin él, el observador
       seguiría mirando cada span que crean SplitText y ScrollFloat. */
    setTimeout(() => {
        obs.disconnect();
        createSmoother();
    }, 8000);
};

/* El smoother se crea en un hueco libre del hilo principal, no en el mismo
   tirón que el resto de scripts: crearlo cuesta unos 100 ms (recorre todos
   los ScrollTrigger y mide la página) y PageSpeed lo sumaba a la tarea larga
   de arranque (TBT). Como mucho al segundo; hasta entonces el scroll es el
   nativo, que es exactamente lo que ve el móvil e iOS siempre. */
if (!window.__SMOOTH_CREATED__) {
    window.__SMOOTH_CREATED__ = true;
    document.addEventListener("DOMContentLoaded", () => {
        enforceNoOverflowX();
        whenIdle(waitForIntroAndInit);
    });
    onWidthResize(enforceNoOverflowX);
}

if (prefersReducedMotion()) document.body.dataset.grain = "off";

window.toggleGrain = () => {
    if (document.body.dataset.grain === "off") {
        delete document.body.dataset.grain;
    } else {
        document.body.dataset.grain = "off";
    }
};

export { gsap, ScrollSmoother, ScrollTrigger, SplitText, DrawSVGPlugin, Draggable, InertiaPlugin };
export { fontsReady, waitForFontsReady };
