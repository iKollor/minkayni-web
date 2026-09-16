import { gsap } from "../main.ts";

const initDigits = (value: number): void => {
    const c = document.getElementById("odometer");
    if (!c) return;
    c.innerHTML = "";
    String(value)
        .split("")
        .forEach((ch, i) => {
            const wrap = document.createElement("span");
            wrap.className = "digit";
            const span = document.createElement("span");
            span.className = "current";
            span.dataset.index = String(i);
            span.textContent = ch;
            wrap.appendChild(span);
            c.appendChild(wrap);
        });
};

const rebuildIfLengthChanged = (value: number): void => {
    const c = document.getElementById("odometer");
    if (!c) return;
    if (c.querySelectorAll(".digit").length !== String(value).length) {
        initDigits(value);
    }
};

const setNumberInstant = (value: number): void => {
    rebuildIfLengthChanged(value);
    const c = document.getElementById("odometer");
    if (!c) return;
    String(value)
        .split("")
        .forEach((ch, i) => {
            const cur = c.querySelector(`.digit:nth-child(${i + 1}) .current`) as HTMLElement | null;
            if (cur) cur.textContent = ch;
        });
};

const animateDigitSlide = (digitWrap: HTMLElement, newChar: string): void => {
    const span = digitWrap.querySelector(".current") as HTMLElement | null;
    if (!span || span.textContent === newChar) return;
    gsap.to(span, {
        y: -20,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
            span.textContent = newChar;
            gsap.set(span, { y: 20, opacity: 0 });
            gsap.to(span, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" });
        },
    });
};

const animateIncrement = (newValue: number): void => {
    rebuildIfLengthChanged(newValue);
    const c = document.getElementById("odometer");
    if (!c) return;

    const newStr = String(newValue);
    const currents = Array.from(c.querySelectorAll<HTMLElement>(".digit .current"));
    const oldStr = currents.map((s) => s.textContent || "").join("");

    for (let i = newStr.length - 1; i >= 0; i--) {
        if (newStr[i] !== oldStr[i]) {
            const wrap = c.children[i] as HTMLElement | undefined;
            if (wrap) animateDigitSlide(wrap, newStr[i]);
        } else {
            break;
        }
    }
};

/* Cifra de destino: la que el CMS dejó escrita en el HTML mediante el
   shortcode {{odometer:N}} de la leyenda. Antes estaba fijada a 150 en este
   fichero, así que cambiar el valor en Strapi no tenía ningún efecto. */
const readTarget = (fallback: number): number => {
    const c = document.getElementById("odometer");
    const digits = (c?.textContent ?? "").replace(/\D/g, "");
    const value = Number(digits);
    return digits && Number.isFinite(value) && value > 0 ? value : fallback;
};

export const startOdometer = (): void => {
    const c = document.getElementById("odometer") as (HTMLElement & { _started?: boolean }) | null;
    if (!c || c._started) return;
    c._started = true;

    /* Se lee ANTES de initDigits(0), que vacía el contenedor. */
    const TARGET = readTarget(150);
    /* Tras alcanzar la cifra del CMS el contador sigue creciendo, para que la
       portada transmita un proceso vivo. Ojo: a partir de ahí lo que se ve deja
       de coincidir con Strapi (+1 cada 2 s). Si en algún momento la cifra debe
       ser exacta, basta con no arrancar este intervalo. */
    const STEP = 1;
    const INTERVAL = 2000;
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const keepCounting = (from: number, animated: boolean) => {
        let v = from;
        setInterval(() => {
            v += STEP;
            if (animated) animateIncrement(v);
            else setNumberInstant(v);
        }, INTERVAL);
    };

    if (prefersReduced) {
        setNumberInstant(TARGET);
        keepCounting(TARGET, false);
        return;
    }

    const state = { val: 0 };
    initDigits(0);
    gsap.to(state, {
        val: TARGET,
        duration: 2,
        ease: "power3.out",
        onUpdate: () => setNumberInstant(Math.round(state.val)),
        onComplete: () => {
            setNumberInstant(TARGET);
            keepCounting(TARGET, true);
        },
    });
};
