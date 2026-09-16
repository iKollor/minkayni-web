import { gsap, waitForFontsReady } from "../main.ts";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);

export const animateParagraph = (prefersReduced: boolean): void => {
    const p = document.getElementById("foundation-text") as (HTMLElement & { _animated?: boolean }) | null;
    if (!p || p._animated) return;
    p._animated = true;
    p.style.visibility = "visible";

    const doSplit = () => {
        /* El contador (`[data-count]`) lo monta React por su cuenta: SplitText
           no debe entrar en él, o partiría sus dígitos en palabras. */
        const split = new SplitText(p, { type: "words", ignore: "[data-count]" });
        const words: HTMLElement[] = split.words as HTMLElement[];
        const ST = 0.03;

        gsap.set(p, { opacity: 1 });
        gsap.set(words, { opacity: 0, y: 12 });

        if (prefersReduced) {
            gsap.set(words, { opacity: 1, y: 0 });
            return;
        }

        gsap.timeline().to(words, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: ST }, 0);
    };

    waitForFontsReady(doSplit);
};
