/* ──────────────────────────────────────────────────────────────────────────
   Anclas internas con offset por navbar fija.

   ScrollSmoother traslada el contenido con transform, así que el salto
   nativo del navegador a un `#id` no funciona en escritorio: hay que pedirle
   el destino al smoother. En móvil (<768px) el smoother no se crea y se cae
   al scroll nativo. Sin JS, el navegador salta al ancla por su cuenta: el
   contenido siempre es alcanzable.

   La usan la página de Batucada (navegación entre escenas) y /donate (salto
   entre los dos canales de donación).
─────────────────────────────────────────────────────────────────────────── */
import { ScrollSmoother } from "./main";
import { prefersReducedMotion } from "./platform";


export const initInPageAnchors = () => {
    if (document.documentElement.dataset.bpAnchors === "ready") return;
    document.documentElement.dataset.bpAnchors = "ready";

    const anchorOffset = () => (window.innerWidth < 768 ? 92 : 116);

    const findHashTarget = (hash: string) => {
        if (!hash || hash === "#") return null;
        try {
            return document.getElementById(decodeURIComponent(hash.slice(1)));
        } catch {
            return null;
        }
    };

    const scrollToHash = (hash: string, animated: boolean) => {
        const target = findHashTarget(hash);
        if (!target) return;

        const offset = anchorOffset();
        const smoother = ScrollSmoother.get();
        const shouldAnimate = animated && !prefersReducedMotion();

        if (smoother) {
            const destination = Math.max(0, smoother.offset(target, "top top") - offset);
            smoother.scrollTo(destination, shouldAnimate);
        } else {
            const destination = Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset);
            window.scrollTo({ top: destination, behavior: shouldAnimate ? "smooth" : "auto" });
        }
    };

    const queueCurrentHash = (animated: boolean) => {
        if (!window.location.hash) return;
        requestAnimationFrame(() => requestAnimationFrame(() => scrollToHash(window.location.hash, animated)));
    };

    document.addEventListener("click", (event) => {
        const origin = event.target;
        if (!(origin instanceof Element)) return;

        const link = origin.closest<HTMLAnchorElement>('a[href^="#"]');
        if (!link) return;

        const hash = link.getAttribute("href") ?? "";
        if (!findHashTarget(hash)) return;

        event.preventDefault();
        history.pushState(null, "", hash);
        scrollToHash(hash, true);
    });

    window.addEventListener("hashchange", () => queueCurrentHash(true));

    const settle = () => {
        queueCurrentHash(false);
        window.setTimeout(() => queueCurrentHash(false), 180);
    };

    if (document.readyState === "complete") settle();
    else window.addEventListener("load", settle, { once: true });
};
