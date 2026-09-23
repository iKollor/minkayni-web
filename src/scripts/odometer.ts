/* ──────────────────────────────────────────────────────────────────────────
   Odómetro con GSAP, a partir del plugin Odometer de countUp.js
   (github.com/msoler75/odometer_countup.js, MIT).

   El movimiento es el del plugin: el valor sigue la curva de countUp
   (odometer-curve.ts) y, en cada cuadro en que una rueda recibe un carácter
   distinto, lo apila y persigue la posición nueva con una transición
   `ease-out` que se reinicia desde donde esté (gsap.quickTo). La rueda va
   siempre un poco por detrás del valor y se posa deslizándose: de ahí la
   suavidad.

   Lo que cambia frente al plugin:
   - Cada rueda es una posición fija (unidades, decenas, el «.» de los
     miles…) alineada por la derecha. El plugin repartía las celdas por la
     izquierda, y la que acababa siendo el «.» pasaba antes por dígitos.
   - El ancho de cada rueda se interpola entre los dos caracteres que muestra
     (las cifras de Aristotelica son proporcionales); una rueda nueva crece
     desde 0 mientras entra.
   - Solo se pintan los dos caracteres visibles de cada rueda (el plugin
     apilaba un <span> por cambio).
   - Persecución de 1,5 s y sin la espera del último dígito: con las dos del
     plugin (2,3 s + 2,3 s) el final se alargaba hasta casi 8 s.
   - Si se pide, al terminar sigue sumando de uno en uno (`liveEverySeconds`).
─────────────────────────────────────────────────────────────────────────── */
import { gsap } from "./main";
import { cubicBezier } from "./easing";
import { countUpValue } from "./odometer-curve";

/** `ease-out` de CSS, la de las transiciones del plugin. */
const ROLL_EASE = cubicBezier([0, 0, 0.58, 1]);

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
    private readonly roll: (position: number) => void;

    constructor(
        initial: Glyph,
        private readonly widths: Map<string, number>,
        rollSeconds: number
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
        this.roll = gsap.quickTo(this.state, "p", { duration: rollSeconds, ease: ROLL_EASE, onUpdate: () => this.draw() });
        this.draw();
    }

    set(glyph: Glyph): void {
        if (glyph === this.stack[this.stack.length - 1]) return;
        this.stack.push(glyph);
        this.roll(this.stack.length - 1);
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
        const w0 = this.width(from);
        this.el.style.width = `${w0 + (this.width(to) - w0) * f}px`;
    }
}

export type OdometerOptions = {
    separator: string;
    /** Duración del conteo. */
    countSeconds?: number;
    /** Lo que tarda cada rueda en alcanzar un carácter nuevo. */
    rollSeconds?: number;
    /** Después del conteo, seguir sumando uno cada tantos segundos. */
    liveEverySeconds?: number;
};

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
        const first = new Wheel("0", this.widths, rollSeconds);
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
                onUpdate: () => this.show(countUpValue(clock.ms, end, total)),
                onComplete: () => resolve(),
            });
        });
    }

    increment(): void {
        this.show(this.value + 1);
    }

    private show(value: number): void {
        if (value === this.value) return;
        this.value = value;
        const text = group(value, this.separator);
        /* Una cifra más larga que las ruedas (99 → 100, 999 → 1.000) añade
           las que falten por la izquierda, vacías: entran desde el hueco. */
        while (this.wheels.length < text.length) {
            const wheel = new Wheel(null, this.widths, this.rollSeconds);
            this.wheels.unshift(wheel);
            this.row.prepend(wheel.el);
        }
        const offset = this.wheels.length - text.length;
        this.wheels.forEach((wheel, i) => wheel.set(text[i - offset] ?? null));
    }
}

/** Odómetro en `host` que cuenta de 0 a `end` y, si se pide, sigue sumando. */
export function startOdometer(host: HTMLElement, end: number, { separator, countSeconds = 3, rollSeconds = 1.5, liveEverySeconds }: OdometerOptions): void {
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
