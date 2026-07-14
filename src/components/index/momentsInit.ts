import { gsap, Draggable, InertiaPlugin } from "../../scripts/main";
export const init = () => {
    const wrapperEl = document.querySelector<HTMLDivElement>(".wrapper");
    if (!wrapperEl) {
        throw new Error('No se encontró el elemento con selector ".wrapper".');
    }

    const MARGIN_RIGHT_PX = 40;

    const boxes = gsap.utils.toArray<HTMLElement>(wrapperEl.querySelectorAll(".post-card"));
    if (boxes.length === 0) {
        console.error('No se encontraron elementos con selector ".post-card".');
    }

    if (boxes.length) gsap.set(boxes[boxes.length - 1], { marginRight: `${MARGIN_RIGHT_PX}px` });

    // Loop horizontal (pausado y arrastrable)
    // Builder para poder reconstruir el loop en resize; usamos paddingRight fijo (MARGIN_RIGHT_PX)
    let activeEl: HTMLElement | null = null;
    const buildLoop = (): HorizontalLoopTimeline => {
        return horizontalLoop(boxes, {
            paused: true,
            draggable: true,
            paddingRight: MARGIN_RIGHT_PX,
            repeat: -1,
            center: true,
            onChange: (el: HTMLElement) => {
                if (activeEl) activeEl.classList.remove("active");
                el.classList.add("active");
                activeEl = el;
            },
        });
    };

    let loop: HorizontalLoopTimeline = buildLoop();

    // Control por viewport: pausa/reanuda al entrar/salir
    let isInView = false;
    const onEnterView = () => {
        isInView = true;
        loop.play();
    };
    const onExitView = () => {
        isInView = false;
        loop.pause();
    };
    const io = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? onEnterView() : onExitView())), { threshold: 0.2 });
    io.observe(wrapperEl);

    // Pausar el carousel al hacer hover (pointer enter) y restaurar al salir.
    // Guardamos si estaba reproduciéndose para restaurar correctamente.
    let wasPlayingOnHover = false;
    const onHoverEnter = () => {
        if (!loop) return;
        wasPlayingOnHover = !loop.paused();
        loop.pause();
    };
    const onHoverLeave = () => {
        if (!loop) return;
        if (wasPlayingOnHover && isInView && !document.hidden) {
            loop.play();
        }
    };
    wrapperEl.addEventListener("pointerenter", onHoverEnter);
    wrapperEl.addEventListener("pointerleave", onHoverLeave);

    // Click en cada caja: centrar ese box (toIndex directo)
    boxes.forEach((box, i) => box.addEventListener("click", () => loop.toIndex(i, { duration: 0.8, ease: "power1.inOut" })));

    // Rebuild en resize (compacto)
    let rTO: number | undefined;
    const rebuild = () => {
        loop.draggable?.kill();
        loop.kill?.();
        loop = buildLoop();
        if (!document.hidden && isInView) {
            loop.play();
        }
    };
    window.addEventListener("resize", () => {
        window.clearTimeout(rTO);
        rTO = window.setTimeout(rebuild, 150);
    });

    // Pausar cuando la pestaña no está visible
    const onVisibility = () => {
        if (document.hidden) {
            loop.pause();
        } else if (isInView) {
            loop.play();
        }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Limpieza en navegación/cierre
    const cleanup = () => {
        try {
            io.disconnect();
        } catch {}
        document.removeEventListener("visibilitychange", onVisibility);
        wrapperEl.removeEventListener("pointerenter", onHoverEnter);
        wrapperEl.removeEventListener("pointerleave", onHoverLeave);
        loop.draggable?.kill();
        loop.kill?.();
    };
    window.addEventListener("beforeunload", cleanup);

    /** ================== Tipos auxiliares ================== */

    interface HorizontalLoopConfig {
        paused?: boolean;
        repeat?: number;
        draggable?: boolean;
        speed?: number; // 1 => ~100px/s
        reversed?: boolean;
        paddingRight?: number | string;
        // false => sin snap; number => incremento; function => función de snap personalizada
        snap?: false | number | ((v: number) => number);
        center?: boolean;
        onChange?: (el: HTMLElement, index: number) => void;
    }

    type HorizontalLoopTimeline = gsap.core.Timeline & {
        next: (vars?: gsap.TweenVars) => gsap.core.Tween | undefined;
        previous: (vars?: gsap.TweenVars) => gsap.core.Tween | undefined;
        toIndex: (index: number, vars?: gsap.TweenVars) => gsap.core.Tween;
        current: () => number;
        updateIndex: () => number;
        times: number[];
        draggable?: Draggable;
    };

    /* ================== Core: horizontalLoop ================== */
    /*
    Anima un grupo de elementos a lo largo del eje X en un loop fluido y responsivo.
    Devuelve un Timeline con helpers: next, previous, toIndex, current y times.
    */
    function horizontalLoop(itemsInput: gsap.DOMTarget, config: HorizontalLoopConfig = {}): HorizontalLoopTimeline {
        const items = gsap.utils.toArray<HTMLElement>(itemsInput);
        if (items.length === 0) {
            console.error("horizontalLoop: no hay elementos que animar.");
        }

        const tl = gsap.timeline({
            repeat: config.repeat,
            paused: config.paused,
            defaults: { ease: "none" },
            onReverseComplete: () => {
                tl.totalTime(tl.rawTime() + tl.duration() * 100);
            },
        }) as gsap.core.Timeline;

        const length = items.length;
        const startX = items[0].offsetLeft;

        const times: number[] = [];
        const widths: number[] = [];
        const xPercents: number[] = [];
        let curIndex = 0;
        let indexIsDirty = false;
        const pixelsPerSecond = (config.speed ?? 1) * 100;
        const onChange = config.onChange;

        // Definición de "snap"
        let snapFn: (v: number) => number;
        if (config.snap === false) {
            snapFn = (v) => v;
        } else if (typeof config.snap === "function") {
            snapFn = config.snap;
        } else {
            snapFn = gsap.utils.snap(config.snap ?? 1);
        }

        const populateWidths = (): void => {
            items.forEach((el, i) => {
                const w = Number(gsap.getProperty(el, "width", "px"));
                widths[i] = Number.isFinite(w) ? w : el.getBoundingClientRect().width;
                const xPx = Number(gsap.getProperty(el, "x", "px"));
                const xPct = Number(gsap.getProperty(el, "xPercent"));
                xPercents[i] = snapFn((xPx / widths[i]) * 100 + xPct);
            });
        };

        let spaceBefore0 = 0; // distancia desde el borde izquierdo del contenedor al inicio del primer ítem (gap/padding)

        const getTotalWidth = (): number => {
            const last = items[length - 1];
            const padRight = typeof config.paddingRight === "string" ? parseFloat(config.paddingRight) : config.paddingRight ?? 0;

            const lastScaleX = Number(gsap.getProperty(last, "scaleX")) || 1;

            return last.offsetLeft + (xPercents[length - 1] / 100) * widths[length - 1] - startX + last.offsetWidth * lastScaleX + padRight + spaceBefore0;
        };

        populateWidths();
        gsap.set(items, { xPercent: (i: number) => xPercents[i] });
        gsap.set(items, { x: 0 });

        // calcular espacio inicial antes del primer ítem
        {
            const containerRect = (items[0].parentElement as HTMLElement).getBoundingClientRect();
            const firstRect = items[0].getBoundingClientRect();
            spaceBefore0 = firstRect.left - containerRect.left;
        }

        let totalWidth = getTotalWidth();

        for (let i = 0; i < length; i++) {
            const item = items[i];
            const scaleX = Number(gsap.getProperty(item, "scaleX")) || 1;

            const curX = (xPercents[i] / 100) * widths[i];
            const distanceToStart = item.offsetLeft + curX - startX + spaceBefore0;
            const distanceToLoop = distanceToStart + widths[i] * scaleX;

            tl.to(
                item,
                {
                    xPercent: snapFn(((curX - distanceToLoop) / widths[i]) * 100),
                    duration: distanceToLoop / pixelsPerSecond,
                },
                0
            )
                .fromTo(
                    item,
                    {
                        xPercent: snapFn(((curX - distanceToLoop + totalWidth) / widths[i]) * 100),
                    },
                    {
                        xPercent: xPercents[i],
                        duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
                        immediateRender: false,
                    },
                    distanceToLoop / pixelsPerSecond
                )
                .add(`label${i}`, distanceToStart / pixelsPerSecond);

            times[i] = distanceToStart / pixelsPerSecond;
        }

        const timeWrap = gsap.utils.wrap(0, tl.duration()) as (v: number) => number;

        // Si center está activo, ajusta los tiempos para alinear el centro del item con el centro del contenedor
        if (config.center) {
            const containerEl = (items[0].parentElement as HTMLElement) || document.body;
            const timeOffset = (tl.duration() * (containerEl.offsetWidth / 2)) / totalWidth;
            times.forEach((_t, i) => {
                const labelTime = tl.labels["label" + i] as number;
                times[i] = timeWrap(labelTime + (tl.duration() * widths[i]) / 2 / totalWidth - timeOffset);
            });
        }

        // onUpdate: avisar cuando cambie el índice activo
        if (typeof onChange === "function") {
            let lastIndex = 0;
            tl.eventCallback("onUpdate", () => {
                const i = getClosest(times, tl.time(), tl.duration());
                if (lastIndex !== i) {
                    lastIndex = i;
                    onChange(items[i], i);
                }
            });
        }

        const toIndex = (index: number, vars: gsap.TweenVars = {}): gsap.core.Tween => {
            if (Math.abs(index - curIndex) > length / 2) {
                index += index > curIndex ? -length : length; // camina por el camino más corto
            }

            const newIndex = gsap.utils.wrap(0, length, index) as number;
            let time = times[newIndex];

            if (time > tl.time() !== index > curIndex) {
                // si hay wrap del playhead, ajusta con un "modifier" de tiempo
                vars.modifiers = { time: (v: number) => timeWrap(v) };
                time += tl.duration() * (index > curIndex ? 1 : -1);
            }

            curIndex = newIndex;
            vars.overwrite = true;
            return tl.tweenTo(time, vars);
        };

        // Métodos públicos añadidos al timeline
        const ext = tl as HorizontalLoopTimeline;

        // Helpers públicos
        ext.current = () => (indexIsDirty ? getClosest(times, tl.time(), tl.duration()) : curIndex);
        ext.toIndex = (index: number, vars?: gsap.TweenVars) => toIndex(index, vars ?? {});
        ext.next = (vars?: gsap.TweenVars) => toIndex(ext.current() + 1, vars ?? {});
        ext.previous = (vars?: gsap.TweenVars) => toIndex(ext.current() - 1, vars ?? {});
        ext.updateIndex = () => (curIndex = Math.round(tl.progress() * items.length));
        ext.times = times;

        // Pre-render para rendimiento
        tl.progress(1, true).progress(0, true);

        // Soporte "reversed"
        const onRev = (tl.vars as { onReverseComplete?: () => void }).onReverseComplete;
        if (config.reversed) {
            onRev?.();
            tl.reverse();
        }

        // Utilidad: índice más cercano dado un tiempo
        function getClosest(values: number[], value: number, wrap: number) {
            let i = values.length,
                closest = 1e10,
                index = 0,
                d;
            while (i--) {
                d = Math.abs(values[i] - value);
                if (d > wrap / 2) d = wrap - d;
                if (d < closest) {
                    closest = d;
                    index = i;
                }
            }
            return index;
        }

        // Arrastrable (requiere Draggable + InertiaPlugin)
        if (config.draggable && typeof (Draggable as unknown) === "function") {
            const proxy = document.createElement("div");
            const wrap01 = gsap.utils.wrap(0, 1);
            let ratio = 0;
            let startProgress = 0;
            let draggable!: Draggable;
            let lastSnap = 0;
            let initChangeX = 0;
            let wasPlaying = false;

            const align = () => tl.progress(wrap01(startProgress + (draggable.startX - draggable.x) * ratio));

            const syncIndex = (setDirty = false) => {
                const idx = getClosest(times, tl.time(), tl.duration());
                curIndex = idx;
                indexIsDirty = setDirty;
            };

            if (typeof (InertiaPlugin as unknown) === "undefined") {
                // eslint-disable-next-line no-console
                console.warn("InertiaPlugin es necesario para inercia y snapping. https://greensock.com/club");
            }

            draggable = Draggable.create(proxy, {
                trigger: items[0].parentNode as Element,
                type: "x",
                onPressInit() {
                    const x = (this as any).x as number;
                    gsap.killTweensOf(tl);
                    wasPlaying = !tl.paused();
                    tl.pause();
                    startProgress = tl.progress();
                    // refrescamos medidas
                    populateWidths();
                    totalWidth = getTotalWidth();
                    ratio = 1 / totalWidth;
                    initChangeX = startProgress / -ratio - x;
                    gsap.set(proxy, { x: startProgress / -ratio });
                },
                onDrag: () => {
                    align();
                },
                onThrowUpdate: () => {
                    align();
                },
                inertia: true,
                overshootTolerance: 0,
                snap(value: number) {
                    // Corregir caso de release durante throw (velocidad alta)
                    if (Math.abs(startProgress / -ratio - (this as any).x) < 10) {
                        return lastSnap + initChangeX;
                    }
                    const time = -(value * ratio) * tl.duration();
                    const wrappedTime = timeWrap(time);
                    const snapTime = times[getClosest(times, wrappedTime, tl.duration())];
                    let dif = snapTime - wrappedTime;
                    if (Math.abs(dif) > tl.duration() / 2) {
                        dif += dif < 0 ? tl.duration() : -tl.duration();
                    }
                    lastSnap = (time + dif) / tl.duration() / -ratio;
                    return lastSnap;
                },
                onRelease: () => {
                    syncIndex(true);
                },
                onThrowComplete: () => {
                    gsap.set(proxy, { x: 0 });
                    syncIndex();
                    if (wasPlaying && !document.hidden) tl.play();
                },
            })[0];

            ext.draggable = draggable;
        }

        return ext;
    }
};
