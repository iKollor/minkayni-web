/* ──────────────────────────────────────────────────────────────────────────
   Contadores del sitio: el odómetro de scripts/odometer.ts. Con
   `data-count-live` (la leyenda de la portada), al terminar sigue sumando de
   uno en uno mientras está a la vista.

   Las cifras ya vienen escritas en el HTML (`<span data-count>`), que es lo
   que leen los buscadores. Al montar, ese texto queda para los lectores de
   pantalla (sr-only) y la animación va en un hermano `aria-hidden`.

   Cuándo se monta cada cifra:
   - al entrar en pantalla;
   - las «manuales» (`data-count-manual`, la leyenda de la portada), cuando
     quien las revela lo pide con el evento `count:reveal`, o de inmediato si
     ya llegaron marcadas con `data-count-revealed`.
─────────────────────────────────────────────────────────────────────────── */
import { startOdometer } from "./odometer";
import { prefersReducedMotion } from "./platform";

/** Cada cuánto suma uno una cifra `data-count-live` ya contada. */
const LIVE_EVERY_SECONDS = 1;

const mounted = new WeakSet<HTMLElement>();

function mount(el: HTMLElement, separator: string): void {
    if (mounted.has(el)) return;
    const target = Number(el.dataset.count ?? "");
    if (!Number.isFinite(target) || target <= 0) return;
    mounted.add(el);

    const label = document.createElement("span");
    label.className = "sr-only";
    label.textContent = el.textContent?.trim() ?? "";

    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    const digits = document.createElement("span");
    visual.append(el.dataset.countPrefix ?? "", digits, el.dataset.countSuffix ?? "");

    el.replaceChildren(label, visual);

    startOdometer(digits, target, { separator, liveEverySeconds: "countLive" in el.dataset ? LIVE_EVERY_SECONDS : undefined });
}

/** Prepara todas las cifras de la página; devuelve la limpieza. */
export function initCountUp(): () => void {
    if (prefersReducedMotion()) return () => {};

    const separator = document.documentElement.lang.startsWith("en") ? "," : ".";
    const spans = Array.from(document.querySelectorAll<HTMLElement>("[data-count]"));

    /* La vista previa del constructor pinta sus cifras después y las anuncia
       con el mismo evento, así que el oyente existe aunque ahora no haya. */
    const onReveal = (event: Event) => {
        const el = (event as CustomEvent<{ el: HTMLElement }>).detail?.el;
        if (el) mount(el, separator);
    };
    window.addEventListener("count:reveal", onReveal);
    spans.filter((span) => "countRevealed" in span.dataset).forEach((span) => mount(span, separator));

    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                observer.unobserve(entry.target);
                mount(entry.target as HTMLElement, separator);
            }
        },
        { rootMargin: "0px 0px -12% 0px" }
    );
    spans.filter((span) => !("countManual" in span.dataset)).forEach((span) => observer.observe(span));

    return () => {
        observer.disconnect();
        window.removeEventListener("count:reveal", onReveal);
    };
}
