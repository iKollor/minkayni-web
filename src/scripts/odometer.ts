/* ──────────────────────────────────────────────────────────────────────────
   Odómetro con GSAP: réplica del conjunto countUp.js + plugin Odometer
   (github.com/msoler75/odometer_countup.js, MIT) sin cargar ninguno de los dos.

   Cómo se mueve, igual que el original:
   - El valor sigue la curva de countUp: easeOutExpo con su corrección
     1024/1023 y, por encima de 999, su «smart easing» (lineal hasta 333 antes
     del final durante la primera mitad y frenada en la segunda).
   - En cada cuadro el número se formatea y cada carácter va a su columna.
     Cada vez que una columna recibe un carácter distinto lo apila y persigue
     la nueva posición con una transición de 2,3 s y curva `ease-out` de CSS
     que se reinicia desde donde esté: eso es `gsap.quickTo`. Las columnas van
     siempre por detrás del valor y se posan con una cola larga; de ahí la
     suavidad.

   Diferencias deliberadas:
   - El plugin mete en el DOM un <span> por carácter apilado (en «300» son
     cientos) y los limpia segundos después. Aquí la pila es un array y solo
     se pintan los dos caracteres que caben en la ventana de 1em.
   - Cada columna mide lo que su carácter final, no lo que el dígito más
     ancho: las cifras de Aristotelica son proporcionales.
─────────────────────────────────────────────────────────────────────────── */
import { gsap } from "./main";
import { cubicBezier } from "./easing";
import { countUpValue } from "./odometer-curve";

/** `lastDigitDelay` del plugin, en ms: por debajo, un carácter espera al siguiente. */
const LAST_DIGIT_DELAY_MS = 250;
/** `ease-out` de CSS, la de las transiciones del plugin. */
const CSS_EASE_OUT = cubicBezier([0, 0, 0.58, 1]);

const group = (n: number, separator: string) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, separator);

/* Un carácter de la pila; `null` es la celda en blanco con la que entra una
   columna nueva (el plugin la pinta como un «0» transparente). */
type Glyph = string | null;

class Column {
    readonly el = document.createElement("span");
    private readonly slots = [document.createElement("span"), document.createElement("span")];
    private readonly stack: Glyph[];
    private current: Glyph;
    private readonly state = { p: 0 };
    private readonly roll: (value: number) => void;
    private readonly rollMs: number;
    private lastAdd = 0;
    private pending: Glyph | undefined;
    private pendingTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(first: Glyph, fromBlank: boolean, rollSeconds: number, finalGlyph: string) {
        /* Recorte solo vertical (como .clip-reveal de global.css): Aristotelica
           se sale de su caja, y un dígito más ancho que el final no se corta
           por los lados mientras pasa. */
        this.el.style.cssText = "position:relative;display:inline-flex;height:1em;clip-path:inset(0 -0.5em)";
        /* Referencia en flujo, invisible: el carácter en que acabará la
           columna. Le da su ancho y su línea base. El plugin usaba el ancho
           del dígito más ancho, que con cifras proporcionales como las de
           Aristotelica separaba «1 2» y ensanchaba «1 . 200». */
        const ref = document.createElement("span");
        ref.style.visibility = "hidden";
        ref.textContent = finalGlyph;
        this.el.append(ref);
        for (const slot of this.slots) {
            slot.style.cssText = "position:absolute;left:0;right:0;top:0;text-align:center;will-change:transform";
            this.el.append(slot);
        }

        this.rollMs = rollSeconds * 1000;
        this.stack = fromBlank ? [null, first] : [first];
        this.lastAdd = performance.now();
        this.current = first;
        this.roll = gsap.quickTo(this.state, "p", { duration: rollSeconds, ease: CSS_EASE_OUT, onUpdate: () => this.draw() });
        this.draw();
        if (fromBlank) this.roll(1);
    }

    /* Mismo reparto que `pushDigit` del plugin: con la columna ya cargada,
       un carácter que llega antes de tiempo espera; lo añade el siguiente
       cambio (que a su vez espera) o, si no llega ninguno, un temporizador. */
    push(glyph: Glyph): void {
        if (glyph === this.current) return;
        this.current = glyph;
        if (this.stack.length < 4) {
            this.append(glyph);
            return;
        }
        if (this.pending !== undefined) {
            this.append(this.pending);
            clearTimeout(this.pendingTimer);
            this.pending = undefined;
        }
        const since = performance.now() - this.lastAdd;
        if (since >= (LAST_DIGIT_DELAY_MS - since) * 1.05) {
            this.append(glyph);
        } else {
            this.pending = glyph;
            this.pendingTimer = setTimeout(() => {
                if (this.pending === undefined) return;
                this.append(this.pending);
                this.pending = undefined;
            }, this.rollMs);
        }
    }

    private append(glyph: Glyph): void {
        this.stack.push(glyph);
        this.lastAdd = performance.now();
        this.roll(this.stack.length - 1);
    }

    private paint(slot: HTMLElement, glyph: Glyph | undefined): void {
        slot.textContent = glyph ?? (glyph === null ? "0" : "");
        slot.style.color = glyph === null ? "transparent" : "";
    }

    private draw(): void {
        const i = Math.floor(this.state.p);
        const f = this.state.p - i;
        this.paint(this.slots[0], this.stack[i]);
        this.paint(this.slots[1], this.stack[i + 1]);
        this.slots[0].style.transform = `translateY(${-f}em)`;
        this.slots[1].style.transform = `translateY(${1 - f}em)`;
    }
}

export type OdometerOptions = {
    separator: string;
    /** Duración del conteo (countUp `duration`). */
    countSeconds?: number;
    /** Transición de cada columna (Odometer `duration`). */
    rollSeconds?: number;
};

/** Pinta en `host` un odómetro que cuenta de 0 a `end`. */
export function startOdometer(host: HTMLElement, end: number, { separator, countSeconds = 3, rollSeconds = 2.3 }: OdometerOptions): void {
    const row = document.createElement("span");
    /* line-height 1 y columnas de 1em, como `.odometer-numbers` del plugin. */
    row.style.cssText = "display:inline-flex;align-items:baseline;line-height:1";
    host.replaceChildren(row);

    const finalText = group(end, separator);
    const columns: Column[] = [];
    let firstFrame = true;
    const render = (text: string) => {
        for (let i = 0; i < Math.max(text.length, columns.length); i++) {
            const glyph = i < text.length ? text.charAt(i) : null;
            if (columns[i]) {
                columns[i].push(glyph);
            } else {
                /* Las columnas del primer cuadro ya están; las que aparecen al
                   crecer el número entran desde una celda en blanco. */
                const column = new Column(glyph, !firstFrame, rollSeconds, finalText.charAt(i) || (glyph ?? "0"));
                columns.push(column);
                row.append(column.el);
            }
        }
        firstFrame = false;
    };

    const total = countSeconds * 1000;
    const clock = { ms: 0 };
    let last = "";
    const tick = () => {
        const text = group(countUpValue(clock.ms, end, total), separator);
        if (text !== last) render((last = text));
    };
    tick();
    gsap.to(clock, { ms: total, duration: countSeconds, ease: "none", onUpdate: tick, onComplete: tick });
}
