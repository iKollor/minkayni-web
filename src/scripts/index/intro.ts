import { gsap, ScrollTrigger } from "../main.ts";
import { $, on, setHeights, setRadius } from "./helpers";
import { animateParagraph } from "./paragraph";

const NAV_STROKE_MULTIPLIER = 1.2;

export const initIntro = (prefersReduced: boolean): void => {
    document.body.dataset.intro = "pending";

    const navContainer = $("#nav-container") as HTMLElement | null;
    if (navContainer) navContainer.style.display = "block";

    const navTexts = document.querySelectorAll(".page-nav .nav-text");
    const overlay = $("#intro-overlay") as HTMLElement | null;
    const stackedEl = document.querySelector("#intro-stacked") as HTMLElement | null;
    const video = (stackedEl?.querySelector("video") || null) as HTMLVideoElement | null;
    const content = $("#app-content") as HTMLElement | null;
    const skipBtn = $("#skip-intro");

    const MIN_VISIBLE_MS = 650;
    let startedAt: number | null = null;
    let finished = false;

    const showPageNav = (): void => {
        const pageNav = document.querySelector(".page-nav") as HTMLElement | null;
        if (!pageNav) return;
        pageNav.style.removeProperty("display");
        pageNav.style.visibility = "visible";
        pageNav.style.opacity = "1";
        pageNav.style.pointerEvents = "auto";
        pageNav.style.transform = "translateY(0)";
        const ul = pageNav.querySelector("ul") as HTMLElement | null;
        if (ul) ul.style.pointerEvents = "auto";
        pageNav.setAttribute("data-nav-hidden", "false");
        const toggleBtn = pageNav.querySelector(".page-nav-toggle") as HTMLElement | null;
        if (toggleBtn) {
            toggleBtn.setAttribute("aria-expanded", "true");
            toggleBtn.setAttribute("data-nav-hidden", "false");
        }
        const links = pageNav.querySelectorAll<HTMLAnchorElement>(".nav-link");
        links.forEach((a) => (a.style.pointerEvents = "auto"));
    };

    const waitFontsReady = (cb: () => void): void => {
        // @ts-ignore
        const fonts = (document as any).fonts;
        if (fonts?.ready && typeof fonts.ready.then === "function") {
            fonts.ready.then(() => requestAnimationFrame(cb));
        } else {
            requestAnimationFrame(cb);
        }
    };

    const prepareNavStrokes = (): void => {
        navTexts.forEach((t) => {
            const svgText = t as SVGTextElement;
            const len = svgText.getComputedTextLength() * NAV_STROKE_MULTIPLIER;
            svgText.setAttribute("stroke-dasharray", String(len));
            svgText.setAttribute("stroke-dashoffset", String(len));
            svgText.style.setProperty("fill-opacity", "0");
        });
    };

    const animateNavAndParagraph = (prefersReduced: boolean, navTexts: NodeListOf<Element>): void => {
        const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
        tl.add(() => showPageNav(), 3)
            .to(
                navTexts,
                {
                    strokeDashoffset: 0,
                    duration: 5,
                    ease: "power2.out",
                    stagger: 0.05,
                },
                3
            )
            .call(animateParagraph, [prefersReduced], 1);
    };

    const finalizeImmediate = (): void => {
        if (finished) return;
        finished = true;
        document.body.removeAttribute("data-intro");
        overlay?.remove();
        content?.classList.replace("opacity-0", "opacity-100");
        setHeights("70svh");
        setRadius("30px");
        document.documentElement.classList.remove("no-scroll");
        document.body.classList.remove("no-scroll");
        (document.documentElement as HTMLElement).style.removeProperty("overflow-y");
        document.body.style.removeProperty("overflow-y");

        waitFontsReady(() => {
            prepareNavStrokes();
            content?.style.removeProperty("clip-path");
            gsap.set("#navBase > *", { opacity: 1, y: 0 });
            animateNavAndParagraph(prefersReduced, navTexts);
            requestAnimationFrame(() => ScrollTrigger?.refresh());
        });
    };

    const runPostIntro = (): void => {
        content?.classList.replace("opacity-0", "opacity-100");
        document.body.removeAttribute("data-intro");
        setHeights("100svh");
        setRadius(null);
        try {
            video?.pause();
        } catch {}

        prepareNavStrokes();

        gsap.set(content, { webkitMaskSize: "0% 0%", maskSize: "0% 0%" });

        const navItems = document.querySelectorAll("#navBase .animate, #navBase .animate > *");
        gsap.set(navItems, { y: 40, opacity: 0 });

        gsap.timeline({ defaults: { overwrite: "auto" } })
            .to(
                content,
                {
                    clipPath: "circle(150% at 50% 50%)",
                    duration: 5,
                    ease: "power1.out",
                    onStart: () => {
                        if (overlay) {
                            overlay.style.zIndex = "auto";
                            overlay.style.pointerEvents = "none";
                        }
                    },
                },
                0
            )
            .to(
                ".bg__container, .bg__container__logo",
                {
                    height: "70svh",
                    duration: 1,
                    ease: "bounce.out",
                    onStart: () => {
                        overlay?.remove();
                        document.documentElement.classList.remove("no-scroll");
                        document.body.classList.remove("no-scroll");
                        (document.documentElement as HTMLElement).style.removeProperty("overflow-y");
                        document.body.style.removeProperty("overflow-y");
                    },
                },
                1
            )
            .to(
                ".bg__container",
                {
                    borderBottomLeftRadius: "30px",
                    borderBottomRightRadius: "30px",
                    duration: 0.8,
                    ease: "power2.out",
                },
                2
            )
            .to(
                navItems,
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: "power4.out",
                    stagger: 0.08,
                },
                2
            )
            .call(animateNavAndParagraph, [prefersReduced, navTexts], 0)
            .add(() => {
                content?.style.removeProperty("clip-path");
                const logoFallback = document.getElementById("intro-fallback-logo") as HTMLElement | null;
                window.dispatchEvent(new CustomEvent("intro:finished"));
                if (logoFallback) logoFallback.style.opacity = "0";
            });
    };

    const finish = (): void => {
        if (finished) return;
        finished = true;
        const elapsed = startedAt ? performance.now() - startedAt : MIN_VISIBLE_MS;
        setTimeout(runPostIntro, Math.max(0, MIN_VISIBLE_MS - elapsed));
    };

    const runStaticIntro = (): void => {
        if (finished) return;
        overlay?.classList.remove("intro-hidden");
        const logoFallback = document.getElementById("intro-fallback-logo") as HTMLElement | null;
        if (logoFallback) logoFallback.style.opacity = "1";
        finished = true;
        setTimeout(runPostIntro, 900);
    };

    document.documentElement.classList.add("no-scroll");

    if (scrollY > 50 || prefersReduced) {
        finalizeImmediate();
        return;
    }

    if (!stackedEl || !video) {
        runStaticIntro();
        return;
    }

    try {
        video.setAttribute("playsinline", "");
        // @ts-ignore
        video.setAttribute("webkit-playsinline", "");
        video.setAttribute("autoplay", "");
        video.muted = true;
        // @ts-ignore
        (video as any).playsInline = true;
        video.preload = "auto";
        video.style.visibility = "hidden";
    } catch {}

    overlay?.classList.remove("intro-hidden");

    on(video, ["playing"], () => {
        if (startedAt == null) startedAt = performance.now();
        video.style.visibility = "visible";
    });

    on(video, ["ended"], () => finish(), { once: true });
    on(video, ["error"], () => runStaticIntro(), { once: true });
    on(video, ["stalled", "waiting", "suspend"], () => {}, { once: false });

    on(skipBtn, ["click"], () => {
        try {
            video.pause();
        } catch {}
        finish();
    });

    let playTimeout: number | undefined;
    const scheduleFallback = (): void => {
        if (playTimeout) return;
        playTimeout = window.setTimeout(() => {
            if (!finished) runStaticIntro();
        }, 6000);
    };

    const tryPlay = (): void => {
        try {
            const p = video.play();
            if (p && typeof (p as any).then === "function") {
                (p as Promise<void>)
                    .then(() => {
                        if (startedAt == null) startedAt = performance.now();
                        video.style.visibility = "visible";
                        if (playTimeout) clearTimeout(playTimeout);
                    })
                    .catch(() => {
                        scheduleFallback();
                    });
            } else {
                video.style.visibility = "visible";
            }
        } catch {
            scheduleFallback();
        }
    };

    on(video, ["canplay", "canplaythrough"], () => tryPlay());

    const unlock = () => {
        tryPlay();
        window.removeEventListener("touchstart", unlock as any, { capture: false } as any);
        window.removeEventListener("pointerdown", unlock as any, { capture: false } as any);
        window.removeEventListener("click", unlock as any, { capture: false } as any);
    };
    window.addEventListener("touchstart", unlock as any, { once: true, passive: true } as any);
    window.addEventListener("pointerdown", unlock as any, { once: true } as any);
    window.addEventListener("click", unlock as any, { once: true } as any);
    tryPlay();
};
