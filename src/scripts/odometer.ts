/* ──────────────────────────────────────────────────────────────────────────
   Odómetro con GSAP, a partir del plugin Odometer de countUp.js
   (github.com/msoler75/odometer_countup.js, MIT).

   El movimiento parte del plugin: el valor sigue la curva de countUp
   (odometer-curve.ts) y, en cada cuadro en que una rueda recibe un carácter
   distinto, lo apila y persigue la posición nueva con un tween que se
   reinicia desde donde esté. Aquí ese tween sigue un resorte físico
   (Springer) y las cifras se desvanecen y desenfocan mientras giran.

   Lo que cambia frente al plugin:
   - Cada rueda es una posición fija (unidades, decenas, el «.» de los
     miles…) alineada por la derecha. El plugin repartía las celdas por la
     izquierda, y la que acababa siendo el «.» pasaba antes por dígitos.
   - El ancho de cada rueda se interpola entre los dos caracteres que muestra
     (las cifras de Aristotelica son proporcionales); una rueda nueva crece
     desde 0 mientras entra.
   - Solo se pintan los dos caracteres visibles de cada rueda (el plugin
     apilaba un <span> por cambio).
   - Sin la espera del último dígito ni la transición de 2,3 s del plugin,
     que alargaban el final hasta casi 8 s.
   - Si se pide, al terminar sigue sumando de uno en uno (`liveEverySeconds`).
─────────────────────────────────────────────────────────────────────────── */
import * as springerModule from "springer";
import { gsap } from "./main";
import { apple } from "./easing";
import { countUpValue } from "./odometer-curve";

/* Springer se publica como CommonJS con `exports.default`, y según el
   empaquetador la función llega como el módulo, su `default` o el `default`
   de su `default` (Rolldown lo envuelve una vez más). */
type SpringerFn = typeof import("springer").default;
function resolveSpringer(mod: unknown): SpringerFn {
    let candidate = mod;
    for (let depth = 0; depth < 3 && typeof candidate !== "function"; depth++) {
        candidate = (candidate as { default?: unknown } | null)?.default;
    }
    if (typeof candidate !== "function") throw new Error("springer: no se encontró la función exportada");
    return candidate as SpringerFn;
}

/* Resorte físico de Springer (tension 0,5, wobble 0,5): llega al 90 % en el
   primer quinto del tiempo, se pasa un 2,5 % y se asienta hacia la mitad de
   la duración. Cada cambio reinicia el tween desde donde esté la rueda, así
   que en el conteo rápido persigue la pila y el resorte se ve al posarse.
   Springer devuelve su primer paso simulado en t = 0; se fija a 0 para que
   el tween no arranque con un salto. */
const spring = resolveSpringer(springerModule)(0.5, 0.5);
const SPRING = (t: number) => (t <= 0 ? 0 : spring(t));
/** Desenfoque máximo de la cifra a mitad de giro. */
const BLUR_EM = 0.0816;

/* Un carácter de la rueda; `null` es el hueco de una rueda que aún no ha
   entrado (ancho 0). */
type Glyph = string | null;

const group = (n: number, separator: string) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, separator);

/** Ancho de cada carácter en la tipografía de `host`. */
function measureGlyphs(host: HTMLElement): Map<string, number> {
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
    host.append(probe);
    const widths = new Map<string, number>();
    for (const ch of "0123456789.,") {
        probe.textContent = ch;
        widths.set(ch, probe.getBoundingClientRect().width);
    }
    probe.remove();
    return widths;
}

class Wheel {
    readonly el = document.createElement("span");
    private readonly slots = [document.createElement("span"), document.createElement("span")];
    private readonly stack: Glyph[];
    private readonly state = { p: 0 };

    constructor(
        initial: Glyph,
        private readonly widths: Map<string, number>
    ) {
        /* Recorte solo vertical (como .clip-reveal de global.css): Aristotelica
           se sale de su caja por los lados. El «0» invisible y sin ancho da a
           la rueda la línea base del texto. */
        this.el.style.cssText = "position:relative;display:inline-flex;height:1em;clip-path:inset(0 -0.2em)";
        const baseline = document.createElement("span");
        baseline.style.cssText = "visibility:hidden;width:0";
        baseline.textContent = "0";
        this.el.append(baseline, ...this.slots);
        for (const slot of this.slots) slot.style.cssText = "position:absolute;left:0;right:0;top:0;text-align:center";

        this.stack = [initial];
        this.draw();
    }

    /* Persigue la posición nueva desde donde esté: un tween que se reinicia
       en cada cambio, como la transición CSS del plugin. */
    set(glyph: Glyph, seconds: number): void {
        if (glyph === this.stack[this.stack.length - 1]) return;
        this.stack.push(glyph);
        gsap.to(this.state, { p: this.stack.length - 1, duration: seconds, ease: SPRING, overwrite: true, onUpdate: () => this.draw() });
    }

    private width(glyph: Glyph | undefined): number {
        return glyph ? (this.widths.get(glyph) ?? 0) : 0;
    }

    private draw(): void {
        const i = Math.floor(this.state.p);
        const f = this.state.p - i;
        const from = this.stack[i];
        const to = this.stack[i + 1];
        this.slots[0].textContent = from ?? "";
        this.slots[1].textContent = to ?? "";
        this.slots[0].style.transform = `translateY(${-f}em)`;
        this.slots[1].style.transform = `translateY(${1 - f}em)`;
        /* La que sale se desvanece y se desenfoca; la que entra, al revés. En
           los giros rápidos se lee como desenfoque de movimiento. */
        this.fadeBlur(this.slots[0], 1 - f);
        this.fadeBlur(this.slots[1], f);
        /* Pasado el último carácter (el resorte se pasa un poco) no hay
           siguiente: se mantiene el ancho del que se ve. */
        const w0 = this.width(from);
        this.el.style.width = `${to === undefined ? w0 : w0 + (this.width(to) - w0) * f}px`;
    }

    /* Opacidad y desenfoque siguen la curva simétrica de Apple, no el giro en
       lineal: la cifra sigue nítida al arrancar, se emborrona sobre todo a
       mitad del giro y se enfoca con suavidad al posarse. */
    private fadeBlur(slot: HTMLElement, visibility: number): void {
        const v = apple(Math.max(0, Math.min(1, visibility)));
        slot.style.opacity = v === 1 ? "" : v.toFixed(3);
        slot.style.filter = v === 1 ? "" : `blur(${((1 - v) * BLUR_EM).toFixed(4)}em)`;
    }
}

export type OdometerOptions = {
    separator: string;
    /** Duración del conteo. */
    countSeconds?: number;
    /** Lo que tarda cada rueda en alcanzar un carácter nuevo durante el conteo. */
    rollSeconds?: number;
    /** Después del conteo, seguir sumando uno cada tantos segundos. */
    liveEverySeconds?: number;
};

/** Giro de cada +1 del modo en vivo. Con el resorte, la cifra se posa hacia
    la mitad: ~0,5 s. */
const LIVE_ROLL_SECONDS = 1.0;

class Odometer {
    private readonly row = document.createElement("span");
    private readonly wheels: Wheel[] = [];
    private readonly widths: Map<string, number>;
    private value = 0;

    constructor(
        host: HTMLElement,
        private readonly separator: string,
        private readonly rollSeconds: number
    ) {
        this.widths = measureGlyphs(host);
        this.row.style.cssText = "display:inline-flex;align-items:baseline;line-height:1";
        host.replaceChildren(this.row);
        /* El «0» de partida ya está en su sitio, como en el plugin. */
        const first = new Wheel("0", this.widths);
        this.wheels.push(first);
        this.row.append(first.el);
    }

    /** Cuenta de 0 a `end` con la curva de countUp; resuelve al acabar el conteo. */
    count(end: number, seconds: number): Promise<void> {
        const total = seconds * 1000;
        const clock = { ms: 0 };
        return new Promise((resolve) => {
            gsap.to(clock, {
                ms: total,
                duration: seconds,
                ease: "none",
                onUpdate: () => this.show(countUpValue(clock.ms, end, total), this.rollSeconds),
                onComplete: () => resolve(),
            });
        });
    }

    increment(): void {
        this.show(this.value + 1, LIVE_ROLL_SECONDS);
    }

    private show(value: number, rollSeconds: number): void {
        if (value === this.value) return;
        this.value = value;
        const text = group(value, this.separator);
        /* Una cifra más larga que las ruedas (99 → 100, 999 → 1.000) añade
           las que falten por la izquierda, vacías: entran desde el hueco. */
        while (this.wheels.length < text.length) {
            const wheel = new Wheel(null, this.widths);
            this.wheels.unshift(wheel);
            this.row.prepend(wheel.el);
        }
        const offset = this.wheels.length - text.length;
        this.wheels.forEach((wheel, i) => wheel.set(text[i - offset] ?? null, rollSeconds));
    }
}

/** Odómetro en `host` que cuenta de 0 a `end` y, si se pide, sigue sumando. */
export function startOdometer(host: HTMLElement, end: number, { separator, countSeconds = 3, rollSeconds = 1.6, liveEverySeconds }: OdometerOptions): void {
    const odometer = new Odometer(host, separator, rollSeconds);
    void odometer.count(end, countSeconds).then(() => {
        if (liveEverySeconds) keepCounting(host, odometer, liveEverySeconds);
    });
}

/* Suma uno cada `seconds` mientras la cifra está en pantalla y la pestaña a
   la vista: fuera de ellas no hay nadie mirando y no se gasta un cuadro. */
function keepCounting(host: HTMLElement, odometer: Odometer, seconds: number): void {
    let visible = true;
    new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(host);
    gsap.delayedCall(seconds, function tick() {
        if (visible && !document.hidden) odometer.increment();
        gsap.delayedCall(seconds, tick);
    });
}
