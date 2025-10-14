import { gsap } from "gsap";
import { ScrollSmoother, ScrollTrigger, TextPlugin, SplitText, DrawSVGPlugin, ScrollToPlugin, MotionPathPlugin, Draggable, InertiaPlugin } from "gsap/all";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger, TextPlugin, SplitText, DrawSVGPlugin, ScrollToPlugin, MotionPathPlugin, Draggable, InertiaPlugin);

// --- Eliminado injectNoOverflowXCSS: usar CSS global en su lugar ---
const enforceNoOverflowX = () => {
    // Refuerzo por si algún inline style futuro cambia algo
    gsap.set(["html", "body", "#smooth-wrapper", "#smooth-content"], { overflowX: "hidden" });
};

const isIOS = () => {
    const ua = navigator.userAgent || "";
    const platform = (navigator as any).platform || "";
    const iOSDevice = /iPad|iPhone|iPod/.test(ua) || /iPad|iPhone|iPod/.test(platform);
    const touchMac = /Mac/.test(platform) && "ontouchend" in document;
    return iOSDevice || touchMac;
};

const createSmoother = () => {
    if (ScrollSmoother.get()) return;

    // iOS Safari tiende a tener conflictos con smooth scrolling personalizado
    if (isIOS()) {
        console.info("[smooth] iOS detectado: ScrollSmoother deshabilitado");
        return;
    }

    // Evitar en mobile para prevenir doble scroll (wrapper + body)
    if (window.innerWidth <= 767) {
        console.info("[smooth] Mobile viewport detectado (<768px): ScrollSmoother omitido");
        return;
    }

    try {
        ScrollSmoother.create({
            wrapper: "#smooth-wrapper",
            content: "#smooth-content",
            smooth: 1.1,
            effects: true,
        });
        console.info("[smooth] ScrollSmoother creado");
        // --- NUEVO: aplicar refuerzo overflow-x tras creación ---
        enforceNoOverflowX();
    } catch (e) {
        console.error("[smooth] Error creando ScrollSmoother:", e);
    }
};

const waitForIntroAndInit = () => {
    const ready = !document.getElementById("intro-overlay") && !document.documentElement.classList.contains("no-scroll");
    if (ready) {
        createSmoother();
        return;
    }

    const obs = new MutationObserver(() => {
        const done = !document.getElementById("intro-overlay") && !document.documentElement.classList.contains("no-scroll");
        if (done) {
            obs.disconnect();
            createSmoother();
        }
    });
    obs.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
    });

    setTimeout(() => {
        if (!ScrollSmoother.get() && !isIOS()) {
            console.warn("[smooth] Fallback activado (timeout)");
            createSmoother();
        }
    }, 8000);
};

if (!window.__SMOOTH_CREATED__) {
    window.__SMOOTH_CREATED__ = true;
    document.addEventListener("DOMContentLoaded", () => {
        enforceNoOverflowX(); // Refuerzo inicial (CSS global debe contener overflow-x: hidden)
        waitForIntroAndInit();
    });
} else {
    console.debug("[smooth] Ya inicializado, se omite duplicado");
}

// Control grano (igual que antes)
const disableForReducedMotion = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.body.dataset.grain = "off";
    }
};

window.toggleGrain = () => {
    if (document.body.dataset.grain === "off") {
        delete document.body.dataset.grain;
    } else {
        document.body.dataset.grain = "off";
    }
};

disableForReducedMotion();

// Diagnóstico rápido
if (!document.getElementById("smooth-wrapper") || !document.getElementById("smooth-content")) {
    console.warn("[smooth] Falta wrapper o content en el DOM");
}

// NUEVO: volver a aplicar si cambia el layout
["resize", "orientationchange"].forEach((evt) => window.addEventListener(evt, enforceNoOverflowX, { passive: true }));

export { gsap, ScrollSmoother, ScrollTrigger, SplitText, DrawSVGPlugin, Draggable, InertiaPlugin };
