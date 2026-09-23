/* Curva de valor de countUp.js (su easeOutExpo por defecto y su «smart
   easing»), aparte del odómetro para poder probarla sin navegador. */

const SMART_THRESHOLD = 999;
const SMART_AMOUNT = 333;
const easeOutExpo = (t: number, b: number, c: number, d: number) => (c * (-Math.pow(2, -10 * t / d) + 1) * 1024) / 1023 + b;

/** Valor de countUp a los `ms` milisegundos de un conteo de 0 a `end` en `total` ms. */
export function countUpValue(ms: number, end: number, total: number): number {
    const t = Math.min(Math.max(ms, 0), total);
    if (end > SMART_THRESHOLD) {
        const half = total / 2;
        const mid = end - SMART_AMOUNT;
        if (t < half) return Math.round((mid * t) / half);
        return Math.round(Math.min(end, easeOutExpo(t - half, mid, end - mid, half)));
    }
    return Math.round(Math.min(end, easeOutExpo(t, 0, end, total)));
}
