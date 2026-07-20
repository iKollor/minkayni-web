/* Reveals compartidos de las páginas institucionales (about, impact,
   subpáginas del constructor).

   Correcciones frente a la versión duplicada por página:
   - Los elementos YA visibles al iniciar no se ocultan (antes se les hacía
     set(opacity:0) y el trigger disparaba en el mismo frame → parpadeo).
   - ScrollTrigger.refresh() al terminar de cargar la página y las imágenes
     (las posiciones se calculaban con el layout a medio cargar → saltos). */
import { gsap, ScrollTrigger } from "./main";

const isInView = (el: HTMLElement): boolean => {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
};

export const initReveals = (): void => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        if (el.dataset.revealReady) return;
        el.dataset.revealReady = "1";
        if (isInView(el)) return; // ya visible: no ocultar ni animar (evita el flash)
        gsap.set(el, { opacity: 0, y: 44 });
        ScrollTrigger.create({
            trigger: el,
            start: "top 88%",
            once: true,
            onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "power2.out", delay: parseFloat(el.dataset.revealDelay || "0") }),
        });
    });

    document.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((group) => {
        if (group.dataset.revealReady) return;
        group.dataset.revealReady = "1";
        if (isInView(group)) return;
        const kids = Array.from(group.children) as HTMLElement[];
        gsap.set(kids, { opacity: 0, y: 44 });
        ScrollTrigger.create({
            trigger: group,
            start: "top 85%",
            once: true,
            onEnter: () => gsap.to(kids, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", stagger: 0.12 }),
        });
    });

    document.querySelectorAll<HTMLElement>("[data-float]").forEach((el, i) => {
        if (el.dataset.floatReady) return;
        el.dataset.floatReady = "1";
        gsap.to(el, { y: -12, rotation: "+=4", duration: 2.8 + (i % 3) * 0.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
    });

    /* Los saltos bruscos vienen de posiciones calculadas antes de que carguen
       imágenes y fuentes: recalcular al cerrar el ciclo de carga. */
    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
    document.querySelectorAll<HTMLImageElement>("main img, #smooth-content img").forEach((img) => {
        if (!img.complete) img.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
    });
};

/* Odómetro compartido (impact, subpáginas): el HTML ya trae el valor final
   renderizado, el tween solo se crea al entrar en viewport. */
export const initCounters = (): void => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const fmt = new Intl.NumberFormat("es-EC");
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        if (el.dataset.countReady) return;
        el.dataset.countReady = "1";
        const target = Number(el.dataset.count ?? "");
        if (!Number.isFinite(target) || target <= 0) return;
        const prefix = el.dataset.countPrefix ?? "";
        const suffix = el.dataset.countSuffix ?? "";
        const state = { val: 0 };
        ScrollTrigger.create({
            trigger: el,
            start: "top 88%",
            once: true,
            onEnter: () => {
                gsap.to(state, {
                    val: target,
                    duration: 1.7,
                    ease: "power3.out",
                    onUpdate: () => {
                        el.textContent = prefix + fmt.format(Math.round(state.val)) + suffix;
                    },
                });
            },
        });
    });
};
