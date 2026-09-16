/* ──────────────────────────────────────────────────────────────────────────
   Barra de desplazamiento propia (SiteScrollbar.astro).

   No sustituye al scroll: la rueda, el táctil, el teclado y «buscar en la
   página» siguen siendo los nativos del navegador. Solo se oculta la barra
   nativa (html[data-site-scrollbar-active]) y esta la refleja:

   - El pulgar sigue la posición que ve ScrollTrigger (con ScrollSmoother,
     la suavizada, así va a la par del contenido) y se mueve con quickTo.
   - Se puede arrastrar; pulsar la pista salta una pantalla hacia ahí, como
     la barra nativa; con el foco en el pulgar (role="scrollbar") responden
     las flechas, RePág/AvPág, Inicio y Fin, y aria-valuenow lleva el
     porcentaje.
   - En reposo se atenúa; al desplazarse, pasar por encima, arrastrar o
     enfocar, vuelve a plena opacidad.
   - Solo con puntero fino: en táctil las barras nativas ya son superpuestas
     y no estorban.
─────────────────────────────────────────────────────────────────────────── */
import { gsap, ScrollSmoother, ScrollTrigger } from "./main";

const IDLE_ALPHA = 0.45;
const IDLE_DELAY_MS = 1400;
const ROW_STEP_PX = 48;
const MIN_THUMB_PX = 44;

export const initSiteScrollbar = (root: HTMLElement): void => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const track = root.querySelector<HTMLElement>(".site-scrollbar__track");
    const thumb = root.querySelector<HTMLElement>(".site-scrollbar__thumb");
    if (!track || !thumb) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.setAttribute("data-site-scrollbar-active", "");

    let trackH = 0;
    let thumbH = 0;
    let maxScroll = 0;
    let progress = 0;
    let dragging = false;
    let idleTimer = 0;

    const moveThumb = gsap.quickTo(thumb, "y", { duration: reduced ? 0 : 0.22, ease: "power3.out" });
    const pageStep = () => window.innerHeight * 0.9;
    const currentScroll = () => ScrollSmoother.get()?.scrollTop() ?? window.scrollY;

    const scrollTo = (y: number, smooth: boolean) => {
        const target = gsap.utils.clamp(0, maxScroll, y);
        const smoother = ScrollSmoother.get();
        if (smoother) smoother.scrollTo(target, smooth && !reduced);
        else window.scrollTo({ top: target, behavior: smooth && !reduced ? "smooth" : "auto" });
    };

    const render = (instant = false) => {
        const y = (trackH - thumbH) * progress;
        if (instant) gsap.set(thumb, { y });
        else moveThumb(y);
        thumb.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    };

    /* Tamaño del pulgar: proporción visible del documento, con un mínimo. */
    const measure = () => {
        maxScroll = ScrollTrigger.maxScroll(window);
        trackH = track.clientHeight;
        const ratio = maxScroll > 0 ? window.innerHeight / (window.innerHeight + maxScroll) : 1;
        thumbH = Math.max(MIN_THUMB_PX, Math.round(trackH * ratio));
        thumb.style.height = `${thumbH}px`;
        root.toggleAttribute("hidden", maxScroll <= 0);
        render(true);
    };

    const isEngaged = () => dragging || root.matches(":hover") || document.activeElement === thumb;
    const rest = () => {
        if (isEngaged()) {
            idleTimer = window.setTimeout(rest, IDLE_DELAY_MS);
            return;
        }
        root.classList.remove("is-active");
        gsap.to(root, { opacity: IDLE_ALPHA, duration: 0.35, overwrite: true });
    };
    const wake = () => {
        root.classList.add("is-active");
        gsap.to(root, { opacity: 1, duration: 0.18, overwrite: true });
        window.clearTimeout(idleTimer);
        idleTimer = window.setTimeout(rest, IDLE_DELAY_MS);
    };

    /* Fuente de verdad: un ScrollTrigger de página completa. Con
       ScrollSmoother su progreso es el suavizado, el mismo del contenido. */
    ScrollTrigger.create({
        start: 0,
        end: () => ScrollTrigger.maxScroll(window),
        onUpdate: (self) => {
            progress = self.progress;
            render();
            wake();
        },
        onRefresh: measure,
    });

    /* Arrastre del pulgar: el desplazamiento del puntero se traduce en la
       misma proporción de documento. */
    thumb.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        dragging = true;
        root.classList.add("is-dragging");
        /* Un puntero sintético (pruebas) no se puede capturar; el arrastre
           real sí, y así el pulgar sigue al ratón aunque salga de la barra. */
        try {
            thumb.setPointerCapture(event.pointerId);
        } catch {
            /* sin captura: el arrastre sigue funcionando mientras el puntero esté encima */
        }
        const startY = event.clientY;
        const startProgress = progress;
        const onMove = (move: PointerEvent) => {
            const delta = (move.clientY - startY) / Math.max(1, trackH - thumbH);
            scrollTo((startProgress + delta) * maxScroll, false);
        };
        const onUp = (up: PointerEvent) => {
            dragging = false;
            root.classList.remove("is-dragging");
            if (thumb.hasPointerCapture(up.pointerId)) thumb.releasePointerCapture(up.pointerId);
            thumb.removeEventListener("pointermove", onMove);
            thumb.removeEventListener("pointerup", onUp);
            thumb.removeEventListener("pointercancel", onUp);
            wake();
        };
        thumb.addEventListener("pointermove", onMove);
        thumb.addEventListener("pointerup", onUp);
        thumb.addEventListener("pointercancel", onUp);
        wake();
    });

    /* Pista: una pantalla hacia el lado pulsado, como la barra nativa. */
    track.addEventListener("pointerdown", (event) => {
        if (event.target === thumb || event.button !== 0) return;
        event.preventDefault();
        const thumbTop = track.getBoundingClientRect().top + (trackH - thumbH) * progress;
        scrollTo(currentScroll() + (event.clientY < thumbTop ? -pageStep() : pageStep()), true);
        wake();
    });

    thumb.addEventListener("keydown", (event) => {
        const steps: Record<string, number> = {
            ArrowDown: ROW_STEP_PX,
            ArrowUp: -ROW_STEP_PX,
            PageDown: pageStep(),
            PageUp: -pageStep(),
        };
        if (event.key === "Home") scrollTo(0, true);
        else if (event.key === "End") scrollTo(maxScroll, true);
        else if (event.key in steps) scrollTo(currentScroll() + steps[event.key], true);
        else return;
        event.preventDefault();
        wake();
    });

    root.addEventListener("pointerenter", wake);
    thumb.addEventListener("focus", wake);
    thumb.addEventListener("blur", rest);

    gsap.set(root, { opacity: IDLE_ALPHA });
    measure();
};
