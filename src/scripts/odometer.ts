/* ──────────────────────────────────────────────────────────────────────────
   Odómetro con GSAP, a partir del plugin Odometer de countUp.js
   (github.com/msoler75/odometer_countup.js, MIT). Del original se conserva
   la curva del conteo (odometer-curve.ts, la de countUp) y el aspecto de
   ruedas que giran; la mecánica es la de un cuentakilómetros:

   - Cada rueda es una posición fija (unidades, decenas, el «.» de los
     miles…) alineada por la derecha. El plugin repartía las celdas por la
     izquierda, y la que acababa siendo el «.» pasaba antes por dígitos.
   - El número cambia por «eventos» (199 → 200). Todas las ruedas que cambian
     en un evento giran juntas, en el mismo tramo previo a él, como un
     acarreo: la cifra que se lee nunca retrocede. El tramo dura como mucho
     ROLL_SECONDS con la curva estándar de Apple; si el evento anterior está
     más cerca, se gira de corrido.
   - El conteo es determinista: sus eventos se calculan antes de empezar, a 30
     muestras por segundo. Así la rueda de las unidades avanza como mucho un
     dígito por muestra y en el arranque rueda sin volverse un parpadeo.
   - El ancho de cada rueda se interpola entre los dos caracteres que muestra
     (las cifras de Aristotelica son proporcionales); una rueda nueva crece
     desde 0 mientras entra.
   - Termina con el último cambio del conteo, sin la cola larga del plugin.
     Si se pide, luego sigue sumando de uno en uno (`live`).
─────────────────────────────────────────────────────────────────────────── */
import { gsap } from "./main";
import { apple } from "./easing";
import { countUpValue } from "./odometer-curve";

const SAMPLES_PER_SECOND = 30;
/** Lo más que tarda una rueda en pasar de un carácter al siguiente. */
const ROLL_SECONDS = 0.35;

/* Un carácter de la rueda; `null` es el hueco de una rueda que aún no ha
   entrado (ancho 0). */
type Glyph = string | null;
/** La rueda llega a `glyph` en `at`, girando durante los `roll` segundos previos. */
type Change = { at: number; roll: number; glyph: Glyph };

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
    private readonly changes: Change[];
    private next = 1;

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
        this.changes = [{ at: 0, roll: 0, glyph: initial }];
        this.draw(0);
    }

    get glyph(): Glyph {
        return this.changes[this.changes.length - 1].glyph;
    }

    add(change: Change): void {
        if (change.glyph !== this.glyph) this.changes.push(change);
    }

    /** Pinta la rueda en el instante `t` (segundos); el tiempo solo avanza. */
    draw(t: number): void {
        while (this.next < this.changes.length && this.changes[this.next].at <= t) this.next++;
        const from = this.changes[this.next - 1];
        const to = this.changes[this.next];
        let f = 0;
        if (to && to.roll > 0) {
            const x = Math.max(0, Math.min(1, (t - (to.at - to.roll)) / to.roll));
            f = to.roll === ROLL_SECONDS ? apple(x) : x;
        }

        this.slots[0].textContent = from.glyph ?? "";
        this.slots[1].textContent = f > 0 ? (to?.glyph ?? "") : "";
        this.slots[0].style.transform = `translateY(${-f}em)`;
        this.slots[1].style.transform = `translateY(${1 - f}em)`;
        const w0 = this.width(from.glyph);
        this.el.style.width = `${w0 + (this.width(to?.glyph) - w0) * f}px`;
    }

    private width(glyph: Glyph | undefined): number {
        return glyph ? (this.widths.get(glyph) ?? 0) : 0;
    }
}

export type OdometerOptions = {
    separator: string;
    /** Duración del conteo. */
    countSeconds?: number;
    /** Después del conteo, seguir sumando uno cada tantos segundos. */
    liveEverySeconds?: number;
};

export class Odometer {
    private readonly row = document.createElement("span");
    private readonly wheels: Wheel[] = [];
    private readonly widths: Map<string, number>;
    private readonly clock = { t: 0 };
    private lastEvent = 0;
    private value = 0;

    constructor(
        host: HTMLElement,
        private readonly separator: string
    ) {
        this.widths = measureGlyphs(host);
        this.row.style.cssText = "display:inline-flex;align-items:baseline;line-height:1";
        host.replaceChildren(this.row);
        this.show(0, 0, 0);
    }

    /** Cuenta de 0 a `end` con la curva de countUp; resuelve al terminar. */
    count(end: number, seconds: number): Promise<void> {
        const total = seconds * 1000;
        const samples = Math.ceil(seconds * SAMPLES_PER_SECOND);
        for (let n = 1; n <= samples; n++) {
            const at = (n / samples) * seconds;
            const value = countUpValue(at * 1000, end, total);
            if (value !== this.value) this.show(value, at, Math.min(ROLL_SECONDS, at - this.lastEvent));
        }
        return this.playTo(this.lastEvent);
    }

    /** Suma uno con un giro completo. */
    increment(): Promise<void> {
        const at = this.clock.t + ROLL_SECONDS;
        this.show(this.value + 1, at, ROLL_SECONDS);
        return this.playTo(at);
    }

    /** Programa que el número sea `value` en `at`, girando `roll` segundos antes. */
    private show(value: number, at: number, roll: number): void {
        const text = group(value, this.separator);
        /* Una cifra más larga que las ruedas (999 → 1.000) añade las que falten
           por la izquierda, vacías: entran girando desde el hueco. */
        while (this.wheels.length < text.length) {
            const wheel = new Wheel(null, this.widths);
            this.wheels.unshift(wheel);
            this.row.prepend(wheel.el);
        }
        const offset = this.wheels.length - text.length;
        this.wheels.forEach((wheel, i) => wheel.add({ at, roll, glyph: text[i - offset] ?? null }));
        this.value = value;
        this.lastEvent = at;
    }

    private playTo(t: number): Promise<void> {
        const duration = Math.max(0, t - this.clock.t);
        return new Promise((resolve) => {
            gsap.to(this.clock, {
                t,
                duration,
                ease: "none",
                onUpdate: () => this.wheels.forEach((wheel) => wheel.draw(this.clock.t)),
                onComplete: () => resolve(),
            });
        });
    }
}

/** Odómetro en `host` que cuenta de 0 a `end` y, si se pide, sigue sumando. */
export function startOdometer(host: HTMLElement, end: number, { separator, countSeconds = 2.6, liveEverySeconds }: OdometerOptions): void {
    const odometer = new Odometer(host, separator);
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
        if (visible && !document.hidden) void odometer.increment();
        gsap.delayedCall(seconds, tick);
    });
}
