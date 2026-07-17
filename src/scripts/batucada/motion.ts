import { gsap, ScrollTrigger, ScrollSmoother, waitForFontsReady } from "../main";

/* Clave son 3-2 en semicorcheas de 70ms: golpes en 0, 3, 6, 10, 12.
   Es el patrón de stagger de todas las entradas — el ritmo del tema,
   no un stagger uniforme. */
const CLAVE = [0, 3, 6, 10, 12].map((n) => n * 0.07);

const prefersReduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------
   Coreografía de scroll: una timeline por escena ([data-bp-scene]).
   Reglas de resiliencia:
   - Con prefers-reduced-motion no se crea ni oculta nada.
   - Solo se preoculta lo que está POR DEBAJO del viewport al iniciar:
     si el navegador restaura el scroll a mitad de página, lo visible
     nunca parpadea ni desaparece.
   - fromTo/to + clearProps deja el DOM limpio al terminar.
   ------------------------------------------------------------------ */
export const initBatucadaMotion = () => {
    if (document.documentElement.dataset.bpMotion === "ready") return;
    document.documentElement.dataset.bpMotion = "ready";
    if (prefersReduce()) return;

    /* Hero: un solo redoble de entrada tras cargar fuentes (evita el
       salto de métricas). Solo si la página abre arriba. */
    const heroItems = gsap.utils.toArray<HTMLElement>("[data-bp-hero]");
    if (heroItems.length && window.scrollY < 40) {
        gsap.set(heroItems, { y: 26, autoAlpha: 0 });
        waitForFontsReady(() => {
            gsap.to(heroItems, {
                y: 0,
                autoAlpha: 1,
                duration: 0.55,
                ease: "expo.out",
                stagger: (i) => CLAVE[i % CLAVE.length] * 0.85,
                clearProps: "all",
            });
        });
    }

    /* Odómetro (mismo principio que el contador del homepage): las cifras
       cuentan desde cero al entrar en viewport. El HTML ya trae el valor
       final, así que sin JS o con reduced-motion no se pierde nada. */
    document.querySelectorAll<HTMLElement>("[data-bp-count]").forEach((el) => {
        const target = Number(el.dataset.bpCount ?? "");
        if (!Number.isFinite(target) || target <= 0) return;
        const prefix = el.dataset.bpPrefix ?? "";
        const state = { val: 0 };
        ScrollTrigger.create({
            trigger: el,
            start: "top 88%",
            once: true,
            onEnter: () => {
                gsap.to(state, {
                    val: target,
                    duration: 1.7,
                    ease: "power3.out",
                    onUpdate: () => {
                        el.textContent = prefix + String(Math.round(state.val));
                    },
                });
            },
        });
    });

    document.querySelectorAll<HTMLElement>("[data-bp-scene]").forEach((scene) => {
        if (scene.getBoundingClientRect().top < window.innerHeight * 0.92) return;

        const hits = Array.from(scene.querySelectorAll<HTMLElement>("[data-bp-hit]"));
        const lists = Array.from(scene.querySelectorAll<HTMLElement>("[data-bp-clave]"));
        const beats = Array.from(scene.querySelectorAll<HTMLElement>("[data-bp-beats] i"));
        const photos = Array.from(scene.querySelectorAll<HTMLElement>("[data-bp-photo] img"));
        if (!hits.length && !lists.length) return;

        gsap.set(hits, { y: 28, autoAlpha: 0 });
        lists.forEach((list) => gsap.set(list.children, { y: 30, autoAlpha: 0 }));

        ScrollTrigger.create({
            trigger: scene,
            start: "top 78%",
            once: true,
            onEnter: () => {
                const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "expo.out" } });
                if (beats.length) {
                    tl.fromTo(
                        beats,
                        { scaleY: 0, transformOrigin: "bottom center" },
                        { scaleY: 1, duration: 0.28, ease: "back.out(1.9)", stagger: 0.06, clearProps: "transform" },
                        0,
                    );
                }
                if (hits.length) {
                    tl.to(hits, { y: 0, autoAlpha: 1, stagger: (i) => CLAVE[i % CLAVE.length], clearProps: "all" }, 0.05);
                }
                lists.forEach((list, li) => {
                    tl.to(list.children, { y: 0, autoAlpha: 1, stagger: (i) => CLAVE[i % CLAVE.length], clearProps: "all" }, 0.2 + li * 0.12);
                });
                if (photos.length) {
                    tl.fromTo(photos, { scale: 1.05 }, { scale: 1, duration: 0.9, clearProps: "transform" }, 0);
                }
            },
        });
    });

    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
};

/* ------------------------------------------------------------------
   Línea de pulso: loop horizontal infinito con el mismo principio del
   carrusel del homepage (dos tiras absolutas + gsap.ticker + quickSetter,
   envolviendo por ancho medido — sin saltos de keyframe). Se pausa
   fuera del viewport.
   ------------------------------------------------------------------ */
export const initPulseline = () => {
    document.querySelectorAll<HTMLElement>("[data-bp-pulseline]").forEach((root) => {
        if (root.dataset.ready) return;
        root.dataset.ready = "1";

        const strips = root.querySelectorAll<HTMLElement>("[data-bp-strip]");
        if (strips.length !== 2) return;
        const [s1, s2] = Array.from(strips);

        if (prefersReduce()) return; // tira estática, contenido visible

        /* Garantizar cobertura en pantallas anchas: cada tira debe medir
           al menos un viewport para que el par cubra sin huecos. */
        const ensureWidth = (strip: HTMLElement) => {
            let guard = 0;
            while (strip.scrollWidth < window.innerWidth && guard < 6) {
                strip.append(...Array.from(strip.children, (c) => c.cloneNode(true)));
                guard += 1;
            }
        };

        let x1 = 0;
        let x2 = 0;
        let W = 0;
        let tickerFn: ((...args: number[]) => void) | null = null;
        const setX1 = gsap.quickSetter(s1, "x", "px");
        const setX2 = gsap.quickSetter(s2, "x", "px");

        const setup = () => {
            if (tickerFn) {
                gsap.ticker.remove(tickerFn);
                tickerFn = null;
            }
            ensureWidth(s1);
            ensureWidth(s2);
            W = s1.scrollWidth;
            if (!W) return;

            x1 = 0;
            x2 = W;
            gsap.set([s1, s2], { force3D: true });
            setX1(x1);
            setX2(x2);

            const PX_PER_SEC = 55;
            tickerFn = () => {
                const dx = (gsap.ticker.deltaRatio() * PX_PER_SEC) / 60;
                x1 -= dx;
                x2 -= dx;
                if (x1 <= -W) x1 += 2 * W;
                if (x2 <= -W) x2 += 2 * W;
                setX1(x1);
                setX2(x2);
            };
            gsap.ticker.add(tickerFn);
        };

        let resizeCall: gsap.core.Tween | null = null;
        window.addEventListener(
            "resize",
            () => {
                resizeCall?.kill();
                resizeCall = gsap.delayedCall(0.15, setup);
            },
            { passive: true },
        );

        ScrollTrigger.create({
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => {
                if (self.isActive) {
                    if (!tickerFn) setup();
                } else if (tickerFn) {
                    gsap.ticker.remove(tickerFn);
                    tickerFn = null;
                }
            },
        });
    });
};

/* ------------------------------------------------------------------
   Anclas internas con offset por navbar fija (compartido entre páginas).
   ------------------------------------------------------------------ */
export const initBatucadaAnchors = () => {
    if (document.documentElement.dataset.bpAnchors === "ready") return;
    document.documentElement.dataset.bpAnchors = "ready";

    const anchorOffset = () => (window.innerWidth < 768 ? 92 : 116);

    const findHashTarget = (hash: string) => {
        if (!hash || hash === "#") return null;
        try {
            return document.getElementById(decodeURIComponent(hash.slice(1)));
        } catch {
            return null;
        }
    };

    const scrollToHash = (hash: string, animated: boolean) => {
        const target = findHashTarget(hash);
        if (!target) return;

        const offset = anchorOffset();
        const smoother = ScrollSmoother.get();
        const shouldAnimate = animated && !prefersReduce();

        if (smoother) {
            const destination = Math.max(0, smoother.offset(target, "top top") - offset);
            smoother.scrollTo(destination, shouldAnimate);
        } else {
            const destination = Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset);
            window.scrollTo({ top: destination, behavior: shouldAnimate ? "smooth" : "auto" });
        }
    };

    const queueCurrentHash = (animated: boolean) => {
        if (!window.location.hash) return;
        requestAnimationFrame(() => requestAnimationFrame(() => scrollToHash(window.location.hash, animated)));
    };

    document.addEventListener("click", (event) => {
        const origin = event.target;
        if (!(origin instanceof Element)) return;

        const link = origin.closest<HTMLAnchorElement>('a[href^="#"]');
        if (!link) return;

        const hash = link.getAttribute("href") ?? "";
        if (!findHashTarget(hash)) return;

        event.preventDefault();
        history.pushState(null, "", hash);
        scrollToHash(hash, true);
    });

    window.addEventListener("hashchange", () => queueCurrentHash(true));

    const settle = () => {
        queueCurrentHash(false);
        window.setTimeout(() => queueCurrentHash(false), 180);
    };

    if (document.readyState === "complete") settle();
    else window.addEventListener("load", settle, { once: true });
};
