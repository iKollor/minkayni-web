// filepath: c:\Users\isai_\Documents\minkayni-web\src\scripts\index\init.ts
import { initIntro } from "./intro";

export const init = (): void => {
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    initIntro(prefersReduced);
};
