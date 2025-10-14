// interactive-gradient.ts

/**
 * Opciones de comportamiento y rendimiento del gradiente interactivo.
 *
 * Todas las unidades de posición internas (follow / wander) se interpretan como desplazamientos en %
 * respecto al tamaño del contenedor (0–100). Los valores se combinan y luego se limitan a 3%–97%
 * para evitar que los blobs se "peguen" a los bordes.
 */
type Opts = {
    /**
     * Intensidad con la que los blobs siguen al puntero.
     *  - Valor bajo (5–15): movimiento suave y sutil.
     *  - Valor medio (20–40): respuesta marcada.
     *  - Valor alto (60+): blobs casi pegados al cursor (puede sentirse brusco).
     * Rango recomendado: 8–60.
     * Impacto: valores muy altos hacen más visible cualquier pequeño jitter del mouse.
     */
    follow?: number;

    /**
     * Amplitud de la deriva autónoma (oscillación orgánica) en ausencia de movimiento de usuario.
     *  - Simula “vida” incluso sin interacción.
     *  - Afecta cada blob de forma pseudo-independiente (con diferentes fases/frecuencias).
     * Rango típico: 2–10. Sobre 12 puede verse errático.
     * Performance: barato; sólo ajusta la magnitud de un seno.
     */
    wander?: number;

    /**
     * Suavizado (lerp) del puntero. Qué tan rápido la posición suavizada (smx/smy) alcanza al cursor real.
     *  - 0   = no sigue (quedará inmóvil).
     *  - 0.1 = muy amortiguado / lento.
     *  - 0.3 = natural.
     *  - 0.5+ = muy reactivo (casi instantáneo).
     * Rango útil: 0.15–0.4. Valores >0.6 pierden sensación de suavidad.
     */
    mouseEase?: number;

    /**
     * Límite máximo de FPS efectivos para el loop de animación.
     *  - Reduce consumo de CPU/GPU en fondos animados que no requieren 60fps.
     *  - 30–45 ofrece buena fluidez percibida para este tipo de morphing.
     * Rango recomendado: 24–60. Menos de 24 se nota entrecortado.
     * Nota: Se usa un “accumulator” para saltar frames sin distorsionar el tiempo.
     */
    maxFps?: number;

    /**
     * Velocidad base de la deriva (avance de fase de los senos).
     *  - Afecta qué tan rápido cambian las posiciones autónomas.
     *  - Valores demasiado altos generan parpadeo / vibración.
     * Rango típico: 0.03–0.1. Default: 0.06.
     */
    driftSpeed?: number;

    /**
     * Lista de IDs de blobs (variables CSS --xN / --yN) a animar.
     *  - Permite limitar la cantidad si hay muchos (optimización progresiva).
     *  - Ej: [1,2,3] sólo animará esos tres blobs.
     * Performance: menos blobs = menos cálculos por frame.
     */
    blobs?: number[];
};

export function makeInteractiveGradient(el: HTMLElement, opts: Opts = {}) {
    if (!el) return () => {};
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

    // Evita inicializaciones duplicadas que crean múltiples RAF loops y provocan "glitches" visuales
    // Guardado ligero vía data-atributo + referencia de cleanup en el propio elemento
    const anyEl = el as HTMLElement & { __interactiveGradientCleanup?: () => void };
    if (el.dataset.gradientInit === "1") {
        return anyEl.__interactiveGradientCleanup || (() => {});
    }
    el.dataset.gradientInit = "1";

    const wander = opts.wander ?? 6;
    const maxFps = opts.maxFps ?? 36;
    const driftSpeed = opts.driftSpeed ?? 0.06;
    const blobs = opts.blobs ?? [1, 2, 3, 4, 5, 6];
    const n = blobs.length;

    el.classList.add("interactive-gradient");
    // Si el elemento tenía la animación CSS en marcha, quítala inmediatamente
    // para evitar conflictos entre la animación por keyframes y el loop JS
    // (esto previene glitches cuando el script toma el control).
    el.classList.remove("animate-gradient");
    // Forzar inline 'animation: none !important' para evitar que reglas externas
    // vuelvan a activar la animación y provoquen parpadeo al hacer el control JS.
    try {
        el.style.setProperty("animation", "none", "important");
    } catch (e) {
        // fallback: asignación normal si el navegador no permite third arg
        try {
            // @ts-ignore
            el.style.animation = "none";
        } catch {}
    }

    // Sugerencias de renderizado para minimizar parpadeos en cambios de background
    try {
        el.style.setProperty("will-change", "background");
        el.style.setProperty("contain", "paint");
        // activación de capa de composición en algunos navegadores
        (el.style as any).webkitTransform = "translateZ(0)";
        el.style.transform = "translateZ(0)";
        (el.style as any).webkitBackfaceVisibility = "hidden";
        el.style.backfaceVisibility = "hidden";
    } catch {}

    // Computed style una sola vez
    const cs = getComputedStyle(el);

    // Typed arrays para cero GC durante animación
    const baseX = new Float32Array(n);
    const baseY = new Float32Array(n);
    const curX = new Float32Array(n);
    const curY = new Float32Array(n);
    const phaseX = new Float32Array(n);
    const phaseY = new Float32Array(n);
    const freqX = new Float32Array(n); // ya incluye +0.5
    const freqY = new Float32Array(n);
    const amp = new Float32Array(n);

    // Init
    for (let i = 0; i < n; i++) {
        const id = blobs[i];
        const bx = parseFloat(cs.getPropertyValue(`--x${id}`)) || 50;
        const by = parseFloat(cs.getPropertyValue(`--y${id}`)) || 50;
        baseX[i] = curX[i] = bx;
        baseY[i] = curY[i] = by;
        freqX[i] = 0.5 + rand(0.12, 0.28);
        freqY[i] = 0.5 + rand(0.12, 0.28);
        phaseX[i] = rand(0, Math.PI * 2);
        phaseY[i] = rand(0, Math.PI * 2);
        amp[i] = id === 5 ? wander * 1.25 : wander;
    }

    // FPS limiting
    const frameTime = 1000 / maxFps;
    let last = performance.now();
    let acc = 0;
    let rafId = 0;

    // Variables temporales fuera del loop para reducir GC
    let i = 0,
        dx = 0,
        dy = 0,
        tx = 0,
        ty = 0;

    const loop = (t: number) => {
        rafId = requestAnimationFrame(loop);
        const dt = t - last;
        last = t;
        acc += dt;
        if (acc < frameTime) return;
        // conserva el remanente de tiempo para un pacing más uniforme
        acc -= frameTime;

        // Factor de tiempo relativo a ~60fps para que driftSpeed sea estable
        const tScale = Math.min(dt, 48) / (1000 / 60);

        for (i = 0; i < n; i++) {
            phaseX[i] += driftSpeed * freqX[i] * tScale;
            phaseY[i] += driftSpeed * freqY[i] * tScale;

            dx = Math.sin(phaseX[i]) * amp[i];
            dy = Math.sin(phaseY[i]) * amp[i];

            tx = baseX[i] + dx;
            ty = baseY[i] + dy;

            // clamp manual (evita llamada a función)
            if (tx < 3) tx = 3;
            else if (tx > 97) tx = 97;
            if (ty < 3) ty = 3;
            else if (ty > 97) ty = 97;

            curX[i] += (tx - curX[i]) * 0.28;
            curY[i] += (ty - curY[i]) * 0.28;

            // Actualiza variables CSS de forma directa (sin crecer cssText)
            el.style.setProperty(`--x${blobs[i]}`, `${curX[i].toFixed(2)}%`);
            el.style.setProperty(`--y${blobs[i]}`, `${curY[i].toFixed(2)}%`);
        }
    };

    rafId = requestAnimationFrame(loop);

    const vis = () => {
        if (document.hidden) {
            cancelAnimationFrame(rafId);
        } else {
            last = performance.now();
            acc = 0;
            rafId = requestAnimationFrame(loop);
        }
    };
    document.addEventListener("visibilitychange", vis);

    const cleanup = () => {
        cancelAnimationFrame(rafId);
        document.removeEventListener("visibilitychange", vis);
    };
    anyEl.__interactiveGradientCleanup = cleanup;
    return cleanup;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
