import { gsap, ScrollTrigger } from "../main";

type Cfg = {
    baseFontSize: string;
    activeFontSize: string;
    inactiveStrokeWidth: number;
    activeStrokeWidth: number;
    activeScale: number;
    activeStart: string;
    activeEnd: string;
    drawDuration: number;
    highlightIn: number;
    highlightOut: number;
    scrollDuration: number;
    scrollOffset: number;
    collapseThreshold: number;
};

const isIntroActive = () => document.documentElement.classList.contains("no-scroll") || document.body.dataset.intro === "pending";

const parseCfg = (el: HTMLElement): Cfg => {
    const raw = JSON.parse(el.dataset.config || "{}");
    return {
        baseFontSize: raw.baseFontSize ?? "2rem",
        activeFontSize: raw.activeFontSize ?? "2.25rem",
        inactiveStrokeWidth: raw.inactiveStrokeWidth ?? 2,
        activeStrokeWidth: raw.activeStrokeWidth ?? 1.25,
        activeScale: raw.activeScale ?? 1.06,
        activeStart: `top ${raw.activeStartPct ?? 70}%`,
        activeEnd: `bottom ${raw.activeEndPct ?? 30}%`,
        drawDuration: raw.drawDuration ?? 0.9,
        highlightIn: raw.highlightIn ?? 0.35,
        highlightOut: raw.highlightOut ?? 0.25,
        scrollDuration: raw.scrollDuration ?? 0.9,
        scrollOffset: raw.scrollOffset ?? 0,
        collapseThreshold: raw.collapseThreshold ?? 0,
    } as Cfg;
};

const waitForIntroEnd = async (timeoutMs = 8500) =>
    new Promise<void>((resolve) => {
        const tryResolve = () => {
            if (!isIntroActive()) {
                resolve();
                return true;
            }
            return false;
        };
        if (tryResolve()) return;
        const mo = new MutationObserver(() => {
            if (tryResolve()) mo.disconnect();
        });
        mo.observe(document.documentElement, { attributes: true, subtree: true });
        setTimeout(() => {
            tryResolve();
            mo.disconnect();
        }, timeoutMs);
    });

export const initPageNav = () => {
    const navs = document.querySelectorAll<HTMLElement>("nav.page-nav[data-page-nav]");
    navs.forEach((nav) => {
        if (nav.dataset.initialized === "1") return;
        nav.dataset.initialized = "1";

        const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const cfg = parseCfg(nav);

        const items = Array.from(nav.querySelectorAll<HTMLElement>(".nav-item"));
        const texts = items.map((li) => li.querySelector(".nav-text") as SVGTextElement | null).filter(Boolean) as SVGTextElement[];
        const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>(".nav-link"));
        const toggleBtn = nav.querySelector<HTMLButtonElement>(".page-nav-toggle");
        const footerEl = document.querySelector<HTMLElement>("#footer");

        // Estado inicial
        if (isIntroActive()) {
            // Durante intro: ocultar NAV completo para evitar FOUC. La intro controlará el reveal.
            gsap.set(nav, { autoAlpha: 0, y: 16, overwrite: "auto" });
            nav.style.pointerEvents = "none";
            const menuEl = nav.querySelector<HTMLElement>("ul");
            if (menuEl) menuEl.style.pointerEvents = "none";
        } else {
            // Sin intro: mostrar NAV completo inmediatamente (anula estilo inline SSR)
            gsap.set(nav, { autoAlpha: 1, y: 0, overwrite: "auto" });
            nav.style.pointerEvents = "auto";
            const menuEl = nav.querySelector<HTMLElement>("ul");
            if (menuEl) menuEl.style.pointerEvents = "auto";
        }

        // Helpers de animación
        const animMap = new WeakMap<HTMLElement, { start: () => void; stop: (reset?: boolean) => void }>();
        const len = (t: Element | null) => (t?.textContent || "").length;
        const zeros = (n: number) => Array(n).fill(0);
        const list = (a: number[]) => a.join(" ");
        const randArr = (n: number, min: number, max: number, p = 2) => Array.from({ length: n }, () => Number((min + Math.random() * (max - min)).toFixed(p)));

        // Scroll suave por ítem
        links.forEach((a) => {
            a.addEventListener("click", (e) => {
                const href = a.getAttribute("href");
                if (!href || !href.startsWith("#")) return;
                const target = document.querySelector<HTMLElement>(href);
                if (!target) return;
                e.preventDefault();
                const li = a.closest<HTMLElement>(".nav-item");
                const anchor = (li?.dataset?.scrollAnchor as "start" | "center" | "end") || "center";
                const rect = target.getBoundingClientRect();
                const vh = innerHeight;
                let yBase = rect.top + scrollY - vh / 2 + rect.height / 2;
                if (anchor === "start") yBase = rect.top + scrollY;
                if (anchor === "end") yBase = rect.top + scrollY - vh + rect.height;
                const rawItemOffset = li?.dataset?.scrollOffset;
                let itemOffset = rawItemOffset !== undefined ? parseFloat(rawItemOffset) : cfg.scrollOffset;
                if (!Number.isFinite(itemOffset)) itemOffset = cfg.scrollOffset;
                gsap.to(window, { duration: cfg.scrollDuration, ease: "power2.inOut", scrollTo: { y: yBase + itemOffset, autoKill: true } as any });
            });
        });

        // Hover loop y animaciones de texto
        items.forEach((li) => {
            const textEl = li.querySelector<SVGTextElement>(".nav-text");
            if (!textEl) return;
            let hovering = false;
            let looping = false;
            const shouldAnimate = () => hovering || li.classList.contains("is-active");
            const loop = () => {
                if (!shouldAnimate()) {
                    looping = false;
                    return;
                }
                const n = len(textEl);
                if (!n) {
                    looping = false;
                    return;
                }
                gsap.to(textEl, {
                    duration: 0.1 + Math.random() * 0.12,
                    ease: "steps(1)",
                    attr: { rotate: list(randArr(n, -5, 5, 0)), dx: list(randArr(n, -0.35, 0.35, 2)) } as any,
                    onComplete: loop,
                });
            };
            const start = () => {
                if (!looping) {
                    looping = true;
                    loop();
                }
            };
            const stop = (reset = false) => {
                looping = false;
                gsap.killTweensOf(textEl);
                if (reset) {
                    const n = len(textEl);
                    const z = zeros(n);
                    gsap.to(textEl, { duration: 0.12, ease: "steps(1)", attr: { rotate: list(z), dx: list(z) } as any, overwrite: "auto" });
                }
            };
            animMap.set(li, { start, stop });
            li.addEventListener("mouseenter", () => {
                hovering = true;
                gsap.to(textEl, { fillOpacity: 1, duration: 0.05, ease: "steps(1)" });
                start();
            });
            li.addEventListener("mouseleave", () => {
                hovering = false;
                if (!li.classList.contains("is-active")) {
                    stop(true);
                    gsap.to(textEl, { fillOpacity: 0, duration: 0.05, ease: "steps(1)" });
                }
            });
        });

        // ScrollTrigger para activar secciones
        const triggers = items
            .map((li) => {
                const href = li.getAttribute("data-href") || "";
                const section = document.querySelector(href);
                if (!section) return null;
                const textEl = li.querySelector<SVGTextElement>(".nav-text");
                const rawCollapse = li.getAttribute("data-collapse-threshold");
                const itemCollapseThreshold = rawCollapse !== null ? parseFloat(rawCollapse) : cfg.collapseThreshold;

                const activate = () => {
                    li.classList.add("is-active");
                    if (textEl) {
                        gsap.to(textEl, { fillOpacity: 1, strokeWidth: cfg.activeStrokeWidth, duration: cfg.highlightIn, ease: "power2.out", overwrite: "auto" });
                    }
                    gsap.to(li, { scale: cfg.activeScale, y: "-2px", duration: Math.min(cfg.highlightIn, 0.25), ease: "power2.out", transformOrigin: "left center", overwrite: "auto" });
                    animMap.get(li)?.start();
                    nav.dataset.currentCollapse = String(Number.isFinite(itemCollapseThreshold) ? itemCollapseThreshold : cfg.collapseThreshold);
                };

                const deactivate = () => {
                    li.classList.remove("is-active");
                    animMap.get(li)?.stop(false);
                    if (textEl) {
                        gsap.to(textEl, { fillOpacity: 0, strokeWidth: cfg.inactiveStrokeWidth, duration: cfg.highlightOut, ease: "power1.out", overwrite: "auto" });
                        const n = len(textEl);
                        if (n) gsap.to(textEl, { duration: Math.min(cfg.highlightOut, 0.18), ease: "steps(1)", attr: { rotate: list(zeros(n)), dx: list(zeros(n)) } as any, overwrite: "auto" });
                    }
                    gsap.to(li, { scale: 1, y: "0px", duration: Math.min(cfg.highlightOut, 0.2), ease: "power1.out", transformOrigin: "left center", overwrite: "auto" });
                    nav.dataset.currentCollapse = String(cfg.collapseThreshold);
                };

                return ScrollTrigger.create({ trigger: section, start: cfg.activeStart, end: cfg.activeEnd, onEnter: activate, onEnterBack: activate, onLeave: deactivate, onLeaveBack: deactivate });
            })
            .filter(Boolean);

        // Colapso del nav según scroll
        const toggleCollapse = () => {
            const raw = nav.dataset.currentCollapse;
            const currentThreshold = raw !== undefined ? parseFloat(raw) : cfg.collapseThreshold;
            if (currentThreshold && Number.isFinite(currentThreshold)) nav.classList.toggle("is-collapsed", scrollY > currentThreshold);
            else nav.classList.remove("is-collapsed");
        };
        toggleCollapse();
        addEventListener("scroll", toggleCollapse, { passive: true });

        // Visibilidad / toggle manual / solape con footer
        const hideDuration = prefersReduced ? 0 : 0.28;
        let overlapActive = false;
        let manualHidden = false;

        // Por defecto ocultamos SOLO la lista (<ul>) para el toggle manual; si es ocultado automático (solape), ocultamos TODO el <nav>
        const menuEl = nav.querySelector<HTMLElement>("ul");
        const setNavHidden = (hidden: boolean, immediate = false, scope: "menu" | "nav" = "menu") => {
            const animate = (el: HTMLElement, vars: gsap.TweenVars) => {
                if (immediate) gsap.set(el, vars);
                else gsap.to(el, { duration: hideDuration, overwrite: "auto", ...vars });
            };

            if (hidden) {
                if (scope === "nav") {
                    animate(nav, { autoAlpha: 0, y: 16, ease: "power2.out" });
                    nav.style.pointerEvents = "none";
                } else {
                    const target = menuEl || nav; // fallback defensivo
                    animate(target, { autoAlpha: 0, y: 16, ease: "power2.out" });
                    if (menuEl) menuEl.style.pointerEvents = "none";
                }
            } else {
                // Mostrar SIEMPRE el nav y el menú para recuperar tras ocultado automático
                animate(nav, { autoAlpha: 1, y: 0, ease: "power2.out" });
                if (menuEl) animate(menuEl, { autoAlpha: 1, y: 0, ease: "power2.out" });
                nav.style.pointerEvents = "auto";
                if (menuEl) menuEl.style.pointerEvents = "auto";
            }
        };
        const updateToggleUI = (hidden: boolean) => {
            if (!toggleBtn) return;
            const label = hidden ? "Mostrar navegación" : "Ocultar navegación";
            toggleBtn.setAttribute("aria-label", label);
            toggleBtn.setAttribute("aria-expanded", hidden ? "false" : "true");
            toggleBtn.setAttribute("data-nav-hidden", hidden ? "true" : "false");
            nav.setAttribute("data-nav-hidden", hidden ? "true" : "false");
            const tt = toggleBtn.querySelector(".tooltip");
            if (tt) tt.textContent = label;
        };
        const applyVisibility = (immediate = false) => {
            const hidden = manualHidden || overlapActive;
            // Si está oculto por control manual -> ocultamos solo el <ul>; si es por solape/automático -> ocultamos el <nav> completo
            const scope: "menu" | "nav" = manualHidden ? "menu" : overlapActive ? "nav" : "menu";
            setNavHidden(hidden, immediate, scope);
            updateToggleUI(hidden);
        };
        if (toggleBtn)
            toggleBtn.addEventListener("click", (e) => {
                e.preventDefault();
                manualHidden = !manualHidden;
                applyVisibility(false);
            });
        if (footerEl) {
            const bottomOffset = () => Math.max(0, Math.round(innerHeight - nav.getBoundingClientRect().bottom));
            const topOffset = () => Math.max(0, Math.round(innerHeight - nav.getBoundingClientRect().top));
            const footerST = ScrollTrigger.create({
                trigger: footerEl,
                start: () => `top bottom-=${bottomOffset()}`,
                end: () => `bottom bottom-=${topOffset()}`,
                onToggle: ({ isActive }) => {
                    overlapActive = !!isActive;
                    applyVisibility(false);
                },
            });
            // Estado inicial de solape
            // @ts-ignore
            if (typeof footerST.isActive === "boolean") overlapActive = footerST.isActive;
        }

        // Preparar textos al cargar si no hay intro; si hay intro, lo hará la intro
        addEventListener(
            "load",
            () => {
                if (!isIntroActive()) {
                    texts.forEach((t) => {
                        if (!t.getAttribute("stroke-dasharray")) {
                            const l = t.getComputedTextLength();
                            t.setAttribute("stroke-dasharray", String(l));
                            if (t.getAttribute("stroke-dashoffset") !== "0") t.setAttribute("stroke-dashoffset", String(l));
                        }
                        t.style.fontSize = cfg.baseFontSize;
                        t.style.setProperty("stroke-width", String(cfg.inactiveStrokeWidth));
                        const parent = t.closest<HTMLElement>(".nav-item");
                        if (parent) parent.style.willChange = "transform, opacity";
                    });
                    items.forEach((li) => (li.style.marginBottom = "var(--nav-margin)"));
                    ScrollTrigger.refresh();
                }
            },
            { once: true }
        );

        // Mostrar nav al terminar intro
        // Dejar el reveal post-intro en manos de intro.ts para evitar FOUC/adelantos
        waitForIntroEnd().then(() => {
            // no-op aquí; intro.ts invocará el reveal sincronizado con los strokes
        });

        // Estado inicial si no hay intro
        if (!isIntroActive()) applyVisibility(true);

        if (import.meta.hot) {
            import.meta.hot.dispose(() => {
                (triggers || []).forEach((st: any) => st?.kill && st.kill());
                removeEventListener("scroll", toggleCollapse);
                if (toggleBtn) toggleBtn.replaceWith(toggleBtn.cloneNode(true));
            });
        }
    });
};

if (document.readyState === "complete") initPageNav();
else addEventListener("load", initPageNav, { once: true });
