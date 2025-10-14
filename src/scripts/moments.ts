import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    // evita doble inicialización
    if (!(window as any).__MOMENTS_ANIM__) {
        (window as any).__MOMENTS_ANIM__ = true;

        gsap.registerPlugin(ScrollTrigger);

        // selectores flexibles: ajusta si tu componente usa clases diferentes
        const containerSelector = "#moments section.my-24";
        const possibleTrackSelectors = [".moments-carousel", "[data-carousel]", ".carousel", ".carousel-track", ".slides"];
        const slideSelectors = [".slide", ".post", ".card", ".moment", ".item", ".moments-item", ".moment-item"];

        // helper: safe query
        const q = (sel: string, base: ParentNode = document) => base.querySelector<HTMLElement>(sel);

        // Inicializar tras paint/layout para evitar medir 0
        const init = () => {
            try {
                const root = document.getElementById("moments");
                const container = q(containerSelector, document) || root || document.querySelector<HTMLElement>("#moments");
                if (!container) return;

                let track: HTMLElement | null = null;
                for (const s of possibleTrackSelectors) {
                    const found = container.querySelector<HTMLElement>(s);
                    if (found) {
                        track = found;
                        break;
                    }
                }
                if (!track) track = container;

                let slides = Array.from(track.querySelectorAll<HTMLElement>(slideSelectors.join(",")));
                if (slides.length === 0) {
                    slides = Array.from(track.children) as HTMLElement[];
                }

                // helper para totalScroll con fallback si track === container
                const totalScroll = () => {
                    const trackWidth = track!.scrollWidth || 0;
                    const viewWidth = container!.clientWidth || window.innerWidth || 0;
                    return Math.max(0, trackWidth - viewWidth);
                };

                // limpiar posibles ScrollTriggers previos en este contenedor
                ScrollTrigger.getAll().forEach((st) => {
                    if (st.trigger === container || st.trigger === track) {
                        st.kill();
                    }
                });

                if (slides.length > 1) {
                    // forzar will-change para rendimiento (no modificamos estilos globales, sólo hint)
                    track!.style.willChange = "transform";

                    gsap.to(track!, {
                        x: () => `-${totalScroll()}px`,
                        ease: "none",
                        scrollTrigger: {
                            trigger: container,
                            start: "top top",
                            end: () => `+=${totalScroll()}`,
                            scrub: 0.7,
                            pin: true,
                            invalidateOnRefresh: true,
                        },
                    });

                    gsap.from(slides, {
                        y: 30,
                        opacity: 0,
                        duration: 0.7,
                        stagger: 0.12,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: container,
                            start: "top 85%",
                            toggleActions: "play none none reverse",
                        },
                    });
                } else {
                    gsap.from(container, {
                        y: 30,
                        opacity: 0,
                        duration: 0.8,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: container,
                            start: "top 85%",
                            toggleActions: "play none none reverse",
                        },
                    });
                }
            } catch (e) {
                // fail silently para no romper la página
                // console.error("moments init error", e);
            }
        };

        // Ejecutar en próxima raf y tras load para asegurar medidas correctas
        requestAnimationFrame(() => {
            // si ya cargó la página, init; si no, esperar load
            if (document.readyState === "complete") {
                init();
                ScrollTrigger.refresh();
            } else {
                window.addEventListener(
                    "load",
                    () => {
                        init();
                        ScrollTrigger.refresh();
                    },
                    { once: true }
                );
            }
        });

        // refrescar ScrollTrigger en resize para recalcular medidas
        window.addEventListener("resize", () => {
            ScrollTrigger.refresh();
        });
    }
}
