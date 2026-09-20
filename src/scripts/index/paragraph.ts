import { gsap, waitForFontsReady } from "../main.ts";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);

export const animateParagraph = (prefersReduced: boolean): void => {
    const p = document.getElementById("foundation-text") as (HTMLElement & { _animated?: boolean }) | null;
    if (!p || p._animated) return;
    p._animated = true;
    p.style.visibility = "visible";

    const doSplit = () => {
        /* El contador (`[data-count]`) lo monta React: SplitText no debe entrar
           en él, o partiría sus dígitos en palabras. Pero sí entra en la
           cascada, en su posición dentro del texto, y al llegarle el turno se
           avisa a CounterMount para que arranque a contar justo entonces. */
        /* `aria: "none"`: por defecto SplitText pone `aria-hidden` en cada
           palabra y un `aria-label` en el párrafo, y los enlaces de la leyenda
           («Fundación Minkayni», «Batucada Popular») se quedaban sin texto
           accesible (PageSpeed: «Links do not have a discernible name»). */
        const split = new SplitText(p, { type: "words", ignore: "[data-count]", aria: "none" });
        const words: HTMLElement[] = split.words as HTMLElement[];
        const counters = Array.from(p.querySelectorAll<HTMLElement>("[data-count]"));
        const sequence = [...words, ...counters].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
        const reveal = (el: HTMLElement) => {
            /* La marca queda en el DOM por si CounterMount hidrata después. */
            el.dataset.countRevealed = "1";
            window.dispatchEvent(new CustomEvent("count:reveal", { detail: { el } }));
        };
        const ST = 0.03;

        gsap.set(p, { opacity: 1 });
        gsap.set(sequence, { opacity: 0, y: 12 });

        if (prefersReduced) {
            gsap.set(sequence, { opacity: 1, y: 0 });
            counters.forEach(reveal);
            return;
        }

        const tl = gsap.timeline();
        sequence.forEach((el, i) => {
            const isCounter = counters.includes(el);
            tl.to(el, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", onStart: isCounter ? () => reveal(el) : undefined }, i * ST);
        });
    };

    waitForFontsReady(doSplit);
};
