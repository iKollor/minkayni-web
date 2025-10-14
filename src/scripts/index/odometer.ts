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
    const oldStr = [...c.querySelectorAll(".digit .current")].map((s) => s.textContent || "").join("");
    for (let i = newStr.length - 1; i >= 0; i--) {
        if (newStr[i] !== oldStr[i]) animateDigitSlide(c.children[i] as HTMLElement, newStr[i]);
        else break;
    }
};

export const startOdometer = (): void => {
    const c = document.getElementById("odometer") as (HTMLElement & { _started?: boolean }) | null;
    if (!c || c._started) return;
    c._started = true;

    const TARGET = 150;
    const STEP = 1;
    const INTERVAL = 2000;
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
        setNumberInstant(TARGET);
        let v = TARGET;
        setInterval(() => {
            v += STEP;
            setNumberInstant(v);
        }, INTERVAL);
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
            let v = TARGET;
            setInterval(() => {
                v += STEP;
                animateIncrement(v);
            }, INTERVAL);
        },
    });
};
