import { gsap, ScrollTrigger } from "../../scripts/main";
(() => {
    if (typeof window === "undefined") return;
    const $ = (s: string, r: ParentNode | Document = document) => r.querySelector(s) as HTMLElement | null,
        $$ = (s: string, r: ParentNode | Document = document) => Array.from(r.querySelectorAll(s)) as HTMLElement[];
    const rnd = gsap.utils.random,
        vib = (ms: number) => {
            try {
                navigator.vibrate?.(ms);
            } catch {}
        };
    const section = $(".team-hscroll");
    if (!section || (section as any)._init) return;
    (section as any)._init = true;
    const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || /iPad|iPhone|iPod/.test(navigator.platform || "") || (/Mac/.test(navigator.platform || "") && "ontouchend" in document),
        isMobile = () => matchMedia("(max-width: 767px)").matches;
    const startIdx = +(section.dataset.start || 0),
        cardsBox = $(".cards", section)!,
        track = $(".track", section)!,
        spacer = $(".hspacer")!,
        infoName = $("[data-info-name]", section)!,
        infoRole = $("[data-info-role]", section)!,
        dots = $$(".dot", $("[data-dots]", section) || section),
        aboutWrap = $("[data-about-wrap]", section),
        aboutEntries = aboutWrap ? $$(".about-entry", aboutWrap) : [];

    // Cards → layer absolute
    const cards = $$(".card", track);
    cards.forEach((c) => {
        c.style.cssText = "position:absolute;inset:0;";
        cardsBox.appendChild(c);
    });
    track.style.display = "none";

    // Text switcher
    const createTextSwitcher = (wrap?: HTMLElement | null) => {
        if (!wrap) return null;
        Object.assign(wrap.style, { position: "relative", display: "block", overflow: "hidden" });
        const layer = () => {
            const s = document.createElement("span");
            s.style.cssText = "position:absolute;inset:0;display:inline-block;opacity:0;transform:translateY(8px);will-change:opacity,transform";
            return s;
        };
        let a = layer(),
            b = layer(),
            cur = "";
        wrap.textContent = "";
        wrap.append(b, a);
        const measure = (samples: (string | undefined)[]) => {
            const p = document.createElement("div"),
                cs = getComputedStyle(wrap);
            Object.assign(p.style, { position: "absolute", visibility: "hidden", pointerEvents: "none", inset: 0, zIndex: -1, font: cs.font, letterSpacing: cs.letterSpacing, textTransform: cs.textTransform, lineHeight: cs.lineHeight, width: wrap.clientWidth + "px" });
            document.body.appendChild(p);
            let h = 0;
            for (const t of samples) {
                const s = document.createElement("span");
                s.style.display = "inline-block";
                s.textContent = t || "";
                p.appendChild(s);
                h = Math.max(h, s.getBoundingClientRect().height);
                p.innerHTML = "";
            }
            p.remove();
            return Math.ceil(h);
        };
        const show = (el: HTMLElement, txt?: string, inst?: boolean) => {
            cur = txt || "";
            el.textContent = cur;
            inst ? gsap.set(el, { opacity: 1, y: 0 }) : gsap.to(el, { opacity: 1, y: 0, duration: 0.18, ease: "power2.out" });
        };
        return {
            mount(init?: string, samples: (string | undefined)[] = []) {
                wrap.style.height = measure(samples.length ? samples : [init]) + "px";
                show(a, init, true);
                gsap.set(b, { opacity: 0, y: 8 });
            },
            swap(next?: string) {
                const n = next || "";
                if (n === cur) return;
                gsap.killTweensOf([a, b]);
                gsap.set(b, { opacity: 0, y: 8 });
                b.textContent = n;
                gsap.to(a, { opacity: 0, y: -6, duration: 0.1, ease: "power2.out" });
                gsap.to(b, {
                    opacity: 1,
                    y: 0,
                    duration: 0.16,
                    ease: "power2.out",
                    onComplete: () => {
                        [a, b] = [b, a];
                        gsap.set(b, { opacity: 0, y: 8 });
                        cur = n;
                    },
                });
            },
            remount(samples: (string | undefined)[]) {
                wrap.style.height = measure(samples) + "px";
            },
        };
    };
    const nameSamples = cards.map((c) => c.dataset.name || ""),
        roleSamples = cards.map((c) => c.dataset.role || ""),
        nameSw = createTextSwitcher(infoName),
        roleSw = createTextSwitcher(infoRole);

    let aboutCurrent = -1;
    const setAboutMinHeight = () => {
        if (!aboutWrap || !aboutEntries.length) return;
        const probe = aboutWrap.cloneNode(false) as HTMLElement;
        Object.assign(probe.style, { position: "absolute", visibility: "hidden", pointerEvents: "none", inset: 0, width: aboutWrap.clientWidth + "px", height: "auto", zIndex: -1 });
        document.body.appendChild(probe);
        let maxH = 0;
        for (const el of aboutEntries) {
            const clone = el.cloneNode(true) as HTMLElement;
            Object.assign(clone.style, { position: "static", opacity: 1, transform: "none", pointerEvents: "auto" });
            probe.appendChild(clone);
            maxH = Math.max(maxH, clone.scrollHeight);
            probe.innerHTML = "";
        }
        probe.remove();
        aboutWrap.style.minHeight = Math.ceil(maxH) + "px";
    };
    const showAbout = (i: number) => {
        if (!aboutEntries.length || i === aboutCurrent) return;
        const next = aboutEntries[i],
            prev = aboutCurrent >= 0 ? aboutEntries[aboutCurrent] : null;
        gsap.killTweensOf(aboutEntries);
        aboutEntries.forEach((el, k) => (el.style.zIndex = k === i ? "2" : "1"));
        if (prev)
            gsap.to(prev, {
                opacity: 0,
                y: 6,
                duration: 0.1,
                ease: "power2.out",
                onComplete: () => {
                    prev.style.pointerEvents = "none";
                },
            });
        gsap.set(next, { pointerEvents: "auto" });
        gsap.to(next, { opacity: 1, y: 0, duration: 0.16, ease: "power2.out" });
        aboutCurrent = i;
    };

    let currentIndex = -1;
    const setActive = (i: number) => {
        if (i === currentIndex) return;
        const el = cards[i];
        if (!el) return;
        if ((section as any)._isDesktop && (section as any)._desktopIntroPlaying) return;
        nameSw?.swap(el.dataset.name || "");
        roleSw?.swap(el.dataset.role || "");
        dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
        showAbout(i);
        currentIndex = i;
    };

    const baseInit = () => {
        setAboutMinHeight();
        aboutEntries.forEach((el, i) => gsap.set(el, { opacity: i === startIdx ? 1 : 0, y: i === startIdx ? 0 : 6, pointerEvents: i === startIdx ? "auto" : "none" }));
        const init = cards[startIdx];
        nameSw?.mount(init?.dataset.name || "", nameSamples);
        roleSw?.mount(init?.dataset.role || "", roleSamples);
        dots.forEach((d, i) => d.classList.toggle("is-active", i === startIdx));
        currentIndex = aboutCurrent = startIdx;
    };

    const initDesktop = () => {
        const spacing = 22,
            others = cards.slice(1),
            target = cards.map((_, i) => ({ rot: rnd(-4.5, 4.5, 0.1), dx: rnd(-10, 10, 0.1), dy: i * spacing + rnd(-5, 5, 0.1), scale: 1 - i * 0.003, z: 100 + i })),
            step = () => Math.max(560, Math.round(section.clientHeight * 0.95)),
            total = () => step() * Math.max(1, others.length),
            SWITCH_BIAS = 0.1;
        cards.forEach((c, i) => gsap.set(c, { rotation: target[i].rot, x: target[i].dx, y: target[i].dy, scale: target[i].scale, zIndex: target[i].z, opacity: 0, transformOrigin: "50% 60%", boxShadow: "0 18px 48px rgba(0,0,0,.14)" }));
        dots.forEach((d) => gsap.set(d, { scale: 1, transformOrigin: "50% 50%", opacity: 0 }));
        if (spacer) spacer.style.height = isIOS() ? "0px" : total() + "px";
        const stBase: Partial<ScrollTrigger.Vars> = {
            id: "cards-st",
            trigger: section,
            start: "top 1%",
            end: () => "+=" + total(),
            scrub: 0.15,
            pin: true,
            pinSpacing: false,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (st) => {
                const n = cards.length - 1,
                    p = st.progress;
                setActive(Math.min(n, Math.max(0, Math.ceil(p * n - SWITCH_BIAS))));
            },
            snap: { snapTo: 1 / (cards.length - 1), duration: 0.2, ease: "power1.out" },
        };
        if (isIOS()) Object.assign(stBase, { pinType: "transform", pinReparent: true, anticipatePin: 2, snap: 1, pinSpacing: true });
        gsap.fromTo(
            others,
            { x: () => innerWidth / 2 + 140, rotate: -90, opacity: 0, boxShadow: "0 6px 20px rgba(0,0,0,.06)" },
            {
                x: (i: number) => target[i + 1].dx,
                y: (i: number) => target[i + 1].dy,
                rotate: (i: number) => target[i + 1].rot,
                scale: (i: number) => target[i + 1].scale,
                opacity: 1,
                boxShadow: "0 18px 48px rgba(0,0,0,.14)",
                ease: "none",
                stagger: { each: 0.24, from: "start" },
                scrollTrigger: {
                    ...(stBase as ScrollTrigger.Vars),
                    onEnter: () => {
                        const f = others[0];
                        if (f) gsap.set(f, { opacity: 1 });
                    },
                    onLeaveBack: () => others.forEach((el, i) => gsap.set(el, { opacity: i === 0 ? 1 : 0 })),
                    onRefresh: () => {
                        const active = ScrollTrigger.getById("cards-st")?.isActive ?? false;
                        if (!active) others.forEach((el, i) => gsap.set(el, { opacity: i === 0 ? 1 : 0 }));
                    },
                },
            }
        );
        if (!(section as any)._fadeDesktop) {
            (section as any)._fadeDesktop = true;
            const textEls = [infoName, infoRole, aboutWrap].filter(Boolean) as HTMLElement[];
            const setInitial = () => {
                gsap.set(cards, { opacity: 0 });
                gsap.set(textEls, { opacity: 0, y: 20 });
                gsap.set(dots, { opacity: 0 });
            };
            setInitial();
            const introTl = gsap.timeline({
                paused: true,
                onStart: () => {
                    (section as any)._desktopFading = true;
                    (section as any)._desktopIntroPlaying = true;
                },
                onComplete: () => {
                    (section as any)._desktopFading = false;
                    (section as any)._desktopIntroPlaying = false;
                    const st = ScrollTrigger.getById("cards-st");
                    if (st) {
                        const n = cards.length - 1;
                        setActive(Math.min(n, Math.max(0, Math.ceil(st.progress * n - 0.18))));
                    }
                },
            });
            introTl.to(cards, { opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }).addLabel("cardsDone").to(textEls, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.08 }, "cardsDone+=0.1").to(dots, { opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.04 }, "cardsDone+=0.05");
            (section as any)._isDesktop = true;
            ScrollTrigger.create({
                trigger: section,
                start: "top 78%",
                end: "bottom top",
                onEnter: () => {
                    if ((section as any)._desktopIntroPlaying) return;
                    introTl.restart();
                },
                onLeaveBack: () => {
                    introTl.pause(0);
                    setInitial();
                    (section as any)._desktopFading = (section as any)._desktopIntroPlaying = false;
                },
            });
        }
        const rebuild = () => {
            if (!cards.length) return;
            const r = cards[0].getBoundingClientRect();
            if (spacer) spacer.style.height = isIOS() ? "0px" : total() + "px";
            Object.assign(cardsBox.style, { width: r.width + "px", height: r.height + "px" });
            setAboutMinHeight();
            nameSw?.remount(nameSamples);
            roleSw?.remount(roleSamples);
            isIOS() ? setTimeout(() => ScrollTrigger.refresh(), 50) : ScrollTrigger.refresh();
        };
        new ResizeObserver(rebuild).observe(section);
        if (aboutEntries.length) {
            const ro = new ResizeObserver(setAboutMinHeight);
            aboutEntries.forEach((el) => ro.observe(el));
        }
        addEventListener("load", () => {
            rebuild();
            setAboutMinHeight();
        });
        const wireDots = () => {
            const st = ScrollTrigger.getById("cards-st");
            if (!st) return;
            const n = cards.length - 1;
            dots.forEach((d, i) => d.addEventListener("click", () => gsap.to(st, { progress: n === 0 ? 0 : i / n, duration: 0.35, ease: "power3.inOut", onUpdate: () => st.update && st.update() })));
        };
        setTimeout(wireDots, 80);
    };

    const initMobile = () => {
        if (spacer) spacer.style.height = "0px";
        const SPACING_Y = 14,
            DECAY = 0.012,
            PREVIEW_MIN = 40,
            PREVIEW_FULL = 100,
            SWIPE_DX = 60,
            FLICK_VX = 0.55;
        cards.forEach((c, i) => {
            c.dataset.order = String(i);
            c.dataset.rot = String(rnd(-3, 3, 0.1));
            c.dataset.jx = String(rnd(-10, 10, 0.5));
            gsap.set(c, { rotation: 0, x: 0, y: 0, scale: 1, zIndex: 300 - i, transformOrigin: "50% 60%", boxShadow: "0 10px 30px rgba(0,0,0,0.12)", opacity: 0 });
        });
        const ordered = () => [...cards].sort((a, b) => Number(a.dataset.order || 0) - Number(b.dataset.order || 0));
        const relayout = (animate = true) =>
            ordered().forEach((c, i) => {
                const rot = +c.dataset.rot!;
                const jx = +c.dataset.jx!;
                const props = { x: jx, y: i * SPACING_Y, scale: 1 - i * DECAY, zIndex: 300 - i, rotation: rot };
                animate ? gsap.to(c, { ...props, duration: 0.3, ease: "power3.out" }) : gsap.set(c, props);
            });
        const bringFront = (card: HTMLElement) => {
            const list = ordered(),
                idx = list.indexOf(card);
            if (idx <= 0) return;
            [...list.slice(idx), ...list.slice(0, idx)].forEach((c, i) => (c.dataset.order = String(i)));
            relayout();
            setActive(+card.dataset.idx!);
        };
        let isAnimating = false,
            isEntering = true;
        const rotate = (dir: 1 | -1) => {
            if (isAnimating) return;
            const list = ordered();
            if (list.length <= 1) return;
            isAnimating = true;
            (dir === 1 ? [...list.slice(1), list[0]] : [list.at(-1)!, ...list.slice(0, -1)]).forEach((c, i) => (c.dataset.order = String(i)));
            relayout(true);
            const top = ordered()[0];
            if (top) setActive(+top.dataset.idx!);
            setTimeout(() => (isAnimating = false), 340);
        };
        let dragging: HTMLElement | null = null,
            startX = 0,
            initialIdx = startIdx,
            activePreview: "next" | "prev" | null = null,
            vX = 0,
            lastX = 0,
            lastT = 0;
        const pointerDown = (e: PointerEvent) => {
            if (isAnimating || isEntering) return;
            const list = ordered();
            const top = list[0];
            if (!(e.target instanceof Element) || !top.contains(e.target)) return;
            dragging = top;
            startX = lastX = e.clientX;
            lastT = performance.now();
            vX = 0;
            initialIdx = +top.dataset.idx!;
            activePreview = null;
            dragging.setPointerCapture(e.pointerId);
            gsap.to(dragging, { scale: 0.985, duration: 0.18, ease: "power3.out" });
        };
        const pointerMove = (e: PointerEvent) => {
            if (isAnimating || !dragging) return;
            const dx = e.clientX - startX,
                now = performance.now(),
                dt = now - lastT || 16;
            vX = (e.clientX - lastX) / dt;
            lastX = e.clientX;
            lastT = now;
            const list = ordered(),
                single = list.length === 1,
                eff = single && dx > 0 ? 0 : dx,
                next = list[1],
                prev = list.at(-1)!,
                ratio = (val: number) => gsap.utils.clamp(0, 1, Math.abs(val) / PREVIEW_FULL);
            if (eff > PREVIEW_MIN && next) {
                const rN = ratio(eff);
                gsap.to(next, { y: -10 * rN, scale: 1 - 0.02 * (1 - rN), duration: 0.18, overwrite: "auto" });
                if (activePreview === "next") {
                    next && gsap.to(next, { y: SPACING_Y, scale: 1 - DECAY, duration: 0.18, ease: "power2.out" });
                    activePreview = "next";
                    vib(8);
                }
            } else if (eff < PREVIEW_MIN && activePreview === "next") {
                next && gsap.to(next, { y: SPACING_Y, scale: 1 - DECAY, duration: 0.25, ease: "power2.out" });
                setActive(initialIdx);
                activePreview = null;
            }
            if (eff < -PREVIEW_MIN && list.length > 1) {
                const rP = ratio(eff);
                gsap.to(prev, { y: -14 * rP, scale: 1 + 0.04 * rP, duration: 0.16, overwrite: "auto" });
                if (activePreview !== "prev") {
                    setActive(+prev.dataset.idx!);
                    activePreview = "prev";
                    vib(8);
                }
            } else if (eff > -PREVIEW_MIN && activePreview === "prev") {
                prev && gsap.to(prev, { y: (list.length - 1) * SPACING_Y, scale: 1 - (list.length - 1) * DECAY, duration: 0.18, ease: "power2.out" });
                setActive(initialIdx);
                activePreview = null;
            }
        };
        const pointerUp = (e: PointerEvent) => {
            if (!dragging) return;
            if (isAnimating) {
                dragging.releasePointerCapture(e.pointerId);
                dragging = null;
                return;
            }
            const dx = e.clientX - startX,
                flickR = vX > FLICK_VX && dx > 20,
                flickL = vX < -FLICK_VX && dx < -20,
                list = ordered();
            if (list.length > 1 && (dx > SWIPE_DX || flickR)) {
                rotate(1);
                vib(10);
            } else if (list.length > 1 && (dx < -SWIPE_DX || flickL)) {
                rotate(-1);
                vib(10);
            } else {
                gsap.to(dragging, { scale: 1, duration: 0.22, ease: "power3.out" });
                if (activePreview) {
                    setActive(initialIdx);
                    activePreview = null;
                }
                const next = list[1],
                    prev = list.at(-1)!;
                next && gsap.to(next, { y: SPACING_Y, scale: 1 - DECAY, duration: 0.18, ease: "power2.out" });
                if (list.length > 1) prev && gsap.to(prev, { y: (list.length - 1) * SPACING_Y, scale: 1 - (list.length - 1) * DECAY, duration: 0.18, ease: "power2.out" });
            }
            dragging.releasePointerCapture(e.pointerId);
            dragging = null;
        };
        section.addEventListener("pointerdown", pointerDown);
        section.addEventListener("pointermove", pointerMove);
        section.addEventListener("pointerup", pointerUp);
        section.addEventListener("pointercancel", pointerUp);
        dots.forEach((d, idx) =>
            d.addEventListener("click", () => {
                if (dragging) return;
                const t = cards.find((c) => +c.dataset.idx! === idx);
                t && bringFront(t);
            })
        );
        const first = ordered()[0];
        first && setActive(+first.dataset.idx!);
        if (!(section as any)._enteredMobile) {
            (section as any)._enteredMobile = true;
            const uiEls = [infoName, infoRole, aboutWrap, ...dots].filter(Boolean) as HTMLElement[];
            const setInit = () => {
                const seq = ordered();
                gsap.killTweensOf([...seq, ...uiEls]);
                seq.forEach((c, i) => gsap.set(c, { opacity: 0, rotation: 0, x: 0, y: 0, scale: 1, zIndex: 300 - i }));
                gsap.set(uiEls, { opacity: 0, y: 18 });
                isEntering = true;
                (section as any)._mobileIntroPlaying = (section as any)._mobileDesaligned = false;
            };
            setInit();
            const runIntro = () => {
                const seq = ordered();
                if ((section as any)._mobileIntroPlaying) return;
                (section as any)._mobileIntroPlaying = true;
                isEntering = true;
                gsap.to(seq, { opacity: 1, duration: 0.4, ease: "power2.out" });
                gsap.to(uiEls, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", delay: 0.05, stagger: 0.06 });
                gsap.delayedCall(1, () => {
                    const list = ordered();
                    list.forEach((c, i) => {
                        const rot = +c.dataset.rot!,
                            jx = +c.dataset.jx!;
                        gsap.fromTo(c, { x: jx * 0.2, y: 0, rotation: rot * 0.3, scale: 1 }, { x: jx, y: i * 14, rotation: rot, scale: 1 - i * 0.012, duration: 0.7, ease: "back.out(1.6)", stagger: 1 });
                    });
                    gsap.delayedCall(0.2, () => {
                        isEntering = false;
                        (section as any)._mobileIntroPlaying = false;
                        (section as any)._mobileDesaligned = true;
                    });
                });
            };
            ScrollTrigger.create({
                trigger: section,
                start: "top 50%",
                end: "bottom top",
                onEnter: runIntro,
                onLeaveBack: () => {
                    if ((section as any)._mobileIntroPlaying) return;
                    const seq = ordered(),
                        fadeTargets = [...seq, ...uiEls];
                    gsap.killTweensOf(fadeTargets);
                    gsap.to(fadeTargets, { opacity: 0, y: (i, el) => (el.classList?.contains("dot") ? 18 : el.classList?.contains("card") ? 0 : 14), duration: 0.38, ease: "power2.inOut", stagger: { each: 0.04, from: "end" }, onComplete: () => setInit() });
                },
            });
        } else {
            relayout(false);
            gsap.set(cards, { opacity: 1 });
            isEntering = false;
        }
        const rebuild = () => {
            if (!cards.length) return;
            const r = cards[0].getBoundingClientRect();
            Object.assign(cardsBox.style, { width: r.width + "px", height: r.height + "px" });
            setAboutMinHeight();
            nameSw?.remount(nameSamples);
            roleSw?.remount(roleSamples);
            if ((section as any)._mobileDesaligned) relayout(false);
        };
        new ResizeObserver(rebuild).observe(section);
        addEventListener("load", rebuild);
    };

    baseInit();
    (isMobile() || isIOS() ? initMobile : initDesktop)();
    let lastMobile = isMobile();
    addEventListener("resize", () => {
        const now = isMobile();
        if (now !== lastMobile) location.reload();
        lastMobile = now;
    });
})();
