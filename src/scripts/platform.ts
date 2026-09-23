/* Consultas al entorno del navegador que comparten los scripts del sitio.
   Sin dependencias: lo importan tanto módulos con GSAP como scripts ligeros
   que no deben arrastrarlo. */

/** Corte móvil del sitio: coincide con el `md:` de Tailwind (768px). */
export const MOBILE_QUERY = "(max-width: 767px)";

export const prefersReducedMotion = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isMobileViewport = (): boolean => window.matchMedia(MOBILE_QUERY).matches;

/** iPhone/iPad, incluido el iPad que se anuncia como Mac con pantalla táctil. */
export const isIOS = (): boolean => {
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) || (/Mac/.test(ua) && "ontouchend" in document);
};

/** Ejecuta `cb` en un hueco libre del hilo principal, como mucho a los `timeout` ms. */
export function whenIdle(cb: () => void, timeout = 1000, fallbackMs = 200): void {
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => cb(), { timeout });
    else setTimeout(cb, fallbackMs);
}
