// filepath: c:\Users\isai_\Documents\minkayni-web\src\scripts\index\init.ts
import { initIntro } from "./intro";
import { prefersReducedMotion } from "../platform";

export const init = (): void => {
    const prefersReduced = prefersReducedMotion();
    initIntro(prefersReduced);
};
