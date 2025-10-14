import { gsap } from "../main.ts";

export const $ = <T extends Element = HTMLElement>(selector: string, root: Document | Element = document): T | null => root.querySelector(selector) as T | null;

export const on = (el: Element | Document | Window | null, evts: string[], fn: (e: Event) => void, opt?: boolean | AddEventListenerOptions): void => {
    if (!el) return;
    evts.forEach((evt) => el.addEventListener(evt, fn as EventListener, opt));
};

export const setHeights = (h: string): void => {
    gsap.set(".bg__container, .bg__container__logo", { height: h });
};

export const setRadius = (r: string | null): void => {
    gsap.set(".bg__container", r ? { borderBottomLeftRadius: r, borderBottomRightRadius: r } : { clearProps: "borderRadius" });
};
