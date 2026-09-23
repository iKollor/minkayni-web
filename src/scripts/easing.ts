/* ──────────────────────────────────────────────────────────────────────────
   Curvas de movimiento del sitio: las mismas que usa apple.com.

   - APPLE: cubic-bezier(0.4, 0, 0.6, 1). La curva estándar de Apple para
     transiciones de interfaz (hover, menús, desplazamientos, salidas).
   - APPLE_OUT: cubic-bezier(0, 0, 0.2, 1). La que Apple usa para las
     entradas: arranca con velocidad y se posa despacio. Es la de los reveals
     y los contadores; con una curva simétrica una entrada de casi un segundo
     empieza tan lenta que parece que no pasa nada y después «salta».

   Se exportan como funciones (las acepta GSAP en `ease`) y como arrays
   (los acepta motion en `ease`). Sin dependencias: sirve igual a módulos con
   GSAP que a islas de React que no cargan main.ts. En CSS son las variables
   `--ease-apple` y `--ease-apple-out` de global.css.
─────────────────────────────────────────────────────────────────────────── */

type Bezier = readonly [number, number, number, number];

export const APPLE_BEZIER: Bezier = [0.4, 0, 0.6, 1];
export const APPLE_OUT_BEZIER: Bezier = [0, 0, 0.2, 1];

/** Resuelve y(x) de una cúbica de Bézier como hace el navegador con `cubic-bezier()`. */
export function cubicBezier([x1, y1, x2, y2]: Bezier): (t: number) => number {
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
    const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
    const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

    const solveT = (x: number): number => {
        let t = x;
        for (let i = 0; i < 8; i++) {
            const err = sampleX(t) - x;
            if (Math.abs(err) < 1e-6) return t;
            const d = slopeX(t);
            if (Math.abs(d) < 1e-6) break;
            t -= err / d;
        }
        let lo = 0;
        let hi = 1;
        t = x;
        while (lo < hi) {
            const v = sampleX(t);
            if (Math.abs(v - x) < 1e-6) return t;
            if (x > v) lo = t;
            else hi = t;
            t = (lo + hi) / 2;
            if (hi - lo < 1e-7) break;
        }
        return t;
    };

    return (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : sampleY(solveT(x)));
}

export const apple = cubicBezier(APPLE_BEZIER);
export const appleOut = cubicBezier(APPLE_OUT_BEZIER);

export const APPLE_CSS = `cubic-bezier(${APPLE_BEZIER.join(", ")})`;
export const APPLE_OUT_CSS = `cubic-bezier(${APPLE_OUT_BEZIER.join(", ")})`;
