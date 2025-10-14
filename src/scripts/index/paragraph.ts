import { gsap } from "../main.ts";
import SplitText from "gsap/SplitText";
import { startOdometer } from "./odometer";

gsap.registerPlugin(SplitText);

export const animateParagraph = (prefersReduced: boolean): void => {
    const p = document.getElementById("foundation-text") as (HTMLElement & { _animated?: boolean }) | null;
    if (!p || p._animated) return;
    p._animated = true;
    p.style.visibility = "visible";

    const html = p.innerHTML;
    const before = html.split(/<span id="odometer"/i)[0] || "";
    const wordsBefore = (
        before
            .replace(/<[^>]+>/g, " ")
            .trim()
            .match(/\S+/g) || []
    ).length;

    const split = new SplitText(p, { type: "words" });
    const words: HTMLElement[] = split.words as HTMLElement[];
    const odometer = document.getElementById("odometer") as HTMLElement | null;
    const ST = 0.03;

    gsap.set(p, { opacity: 1 });
    gsap.set(words, { opacity: 0, y: 12 });
    if (odometer) gsap.set(odometer, { opacity: 0, y: 12 });

    if (prefersReduced) {
        gsap.set(words, { opacity: 1, y: 0 });
        if (odometer) gsap.set(odometer, { opacity: 1, y: 0 });
        startOdometer();
        return;
    }

    const tl = gsap.timeline();
    tl.to(words, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: ST }, 0);

    if (odometer) {
        tl.to(
            odometer,
            {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: "power2.out",
                onStart: startOdometer,
            },
            wordsBefore * ST
        );
    }
};
