/* SiteMenu — el panel del Staggered Menu de reactbits
   (reactbits.dev/components/staggered-menu) con los colores y las formas de
   la marca.

   Qué se conserva del original: las capas previas que barren antes del panel,
   el panel que entra desde la derecha, la entrada escalonada de los ítems
   (yPercent 140 y 10° de giro → 0), la numeración que se enciende después y
   los sociales al pie; tiempos, easings y escalonados idénticos.

   Qué se adapta:
   - Colores: capas celeste y ámbar, panel morado, tinta crema.
   - Forma: el panel y las capas llevan el borde izquierdo redondeado
     (3rem), que es la identidad del sitio; el original es un rectángulo.
   - «Proyectos» no es un enlace sino un acordeón: al pulsarlo se despliegan
     todos los proyectos del CMS con su propio escalonado. El primero de la
     lista lleva a la página de proyectos.
   - Idiomas en el pie del panel, junto a los sociales.
   - El botón vive aparte (MenuToggle.tsx) y se comunica por eventos. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import type { MenuData } from './menu-types';

const OFFSCREEN = 100;

export default function SiteMenu({ items, projectsHref, projects, languages, socials, secondary, labels }: MenuData) {
  const [open, setOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const openRef = useRef(false);
  const busyRef = useRef(false);

  const panelRef = useRef<HTMLElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const projectsListRef = useRef<HTMLUListElement | null>(null);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);

  const layers = useCallback(() => Array.from(preLayersRef.current?.querySelectorAll<HTMLElement>('.sm-prelayer') ?? []), []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      if (!panel) return;
      gsap.set([panel, ...layers()], { xPercent: OFFSCREEN, opacity: 1 });
      if (preLayersRef.current) gsap.set(preLayersRef.current, { xPercent: 0, opacity: 1 });
    });
    return () => ctx.revert();
  }, [layers]);

  const resetItems = useCallback((panel: HTMLElement) => {
    const itemEls = panel.querySelectorAll<HTMLElement>('.sm-panel-itemLabel');
    const numberEls = panel.querySelectorAll<HTMLElement>('.sm-panel-list[data-numbering] .sm-panel-item');
    const socialTitle = panel.querySelector<HTMLElement>('.sm-socials-title');
    const socialLinks = panel.querySelectorAll<HTMLElement>('.sm-socials-link');
    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { ['--sm-num-opacity' as string]: 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
  }, []);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return null;
    openTlRef.current?.kill();
    closeTweenRef.current?.kill();
    closeTweenRef.current = null;

    const itemEls = Array.from(panel.querySelectorAll<HTMLElement>('.sm-panel-itemLabel'));
    const numberEls = Array.from(panel.querySelectorAll<HTMLElement>('.sm-panel-list[data-numbering] .sm-panel-item'));
    const socialTitle = panel.querySelector<HTMLElement>('.sm-socials-title');
    const socialLinks = Array.from(panel.querySelectorAll<HTMLElement>('.sm-socials-link'));
    const layerEls = layers();

    resetItems(panel);

    const tl = gsap.timeline({ paused: true });
    layerEls.forEach((el, i) => {
      tl.fromTo(el, { xPercent: OFFSCREEN }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });
    const lastTime = layerEls.length ? (layerEls.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerEls.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(panel, { xPercent: OFFSCREEN }, { xPercent: 0, duration: panelDuration, ease: 'power4.out' }, panelInsertTime);

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(itemEls, { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: { each: 0.1, from: 'start' } }, itemsStart);
      if (numberEls.length) {
        tl.to(numberEls, { duration: 0.6, ease: 'power2.out', ['--sm-num-opacity' as string]: 1, stagger: { each: 0.08, from: 'start' } }, itemsStart + 0.1);
      }
    }
    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart);
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: { each: 0.08, from: 'start' }, onComplete: () => gsap.set(socialLinks, { clearProps: 'opacity' }) },
          socialsStart + 0.04
        );
      }
    }
    openTlRef.current = tl;
    return tl;
  }, [layers, resetItems]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (!tl) {
      busyRef.current = false;
      return;
    }
    tl.eventCallback('onComplete', () => {
      busyRef.current = false;
    });
    tl.play(0);
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    const panel = panelRef.current;
    if (!panel) return;
    closeTweenRef.current?.kill();
    closeTweenRef.current = gsap.to([...layers(), panel], {
      xPercent: OFFSCREEN,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        resetItems(panel);
        busyRef.current = false;
      }
    });
  }, [layers, resetItems]);

  const setState = useCallback(
    (next: boolean) => {
      if (openRef.current === next) return;
      openRef.current = next;
      setOpen(next);
      if (next) playOpen();
      else {
        playClose();
        setProjectsOpen(false);
      }
      window.dispatchEvent(new CustomEvent('site-menu:state', { detail: { open: next } }));
      /* Compatibilidad con scripts que escuchaban al menú anterior. */
      window.dispatchEvent(new CustomEvent('menu:state', { detail: { open: next } }));
    },
    [playOpen, playClose]
  );

  useEffect(() => {
    const onToggle = () => setState(!openRef.current);
    window.addEventListener('site-menu:toggle', onToggle);
    return () => window.removeEventListener('site-menu:toggle', onToggle);
  }, [setState]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setState(false);
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current && !panelRef.current.contains(target) && !(target as Element).closest?.('[aria-controls="site-menu-panel"]')) setState(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, setState]);

  /* Acordeón de proyectos: mismo lenguaje que los ítems del panel, a escala. */
  const toggleProjects = useCallback(() => {
    const list = projectsListRef.current;
    const next = !projectsOpen;
    setProjectsOpen(next);
    if (!list) return;
    const labelEls = list.querySelectorAll<HTMLElement>('.sm-sub-itemLabel');
    if (next) {
      gsap.set(list, { height: 'auto' });
      gsap.fromTo(list, { height: 0 }, { height: 'auto', duration: 0.5, ease: 'power4.out', clearProps: 'height' });
      gsap.fromTo(labelEls, { yPercent: 120, rotate: 6, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.7, ease: 'power4.out', stagger: { each: 0.05, from: 'start' } });
    } else {
      gsap.to(list, { height: 0, duration: 0.3, ease: 'power3.in' });
    }
  }, [projectsOpen]);

  const isProjects = (href: string) => href.replace(/\/$/, '') === projectsHref.replace(/\/$/, '');

  return (
    <div className="sm-scope pointer-events-none fixed inset-0 z-40 overflow-hidden" data-open={open || undefined} aria-hidden={!open}>
      <div ref={preLayersRef} className="sm-prelayers pointer-events-none absolute bottom-0 right-0 top-0 z-[5] w-[clamp(280px,42vw,520px)] max-lg:w-full" aria-hidden="true">
        {['var(--secondary)', 'var(--accent)'].map((c, i) => (
          <div key={i} className="sm-prelayer absolute right-0 top-0 h-full w-full rounded-l-[3rem]" style={{ background: c }} />
        ))}
      </div>

      <aside
        id="site-menu-panel"
        ref={panelRef}
        className="sm-panel pointer-events-auto absolute right-0 top-0 z-10 flex h-full w-[clamp(280px,42vw,520px)] flex-col overflow-y-auto rounded-l-[3rem] bg-primary px-[clamp(1.5rem,4vw,3rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(90px+clamp(1.5rem,4vh,3rem))] text-[var(--bg-white)] max-lg:w-full"
        aria-label={labels.navigation}
      >
        <div className="flex flex-1 flex-col gap-6">
          <ul className="sm-panel-list m-0 flex list-none flex-col gap-2 p-0" role="list" data-numbering="true">
            {items.map((it, idx) => (
              <li className="sm-panel-itemWrap relative overflow-hidden leading-none" key={it.href + idx}>
                {isProjects(it.href) ? (
                  <>
                    <button
                      type="button"
                      className="sm-panel-item relative inline-flex cursor-pointer items-center gap-4 border-0 bg-transparent p-0 pr-[1.4em] text-left font-display text-[clamp(2rem,6.5vw,3.6rem)] font-[800] leading-none tracking-[-0.02em] text-[var(--bg-white)] transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                      aria-expanded={projectsOpen}
                      aria-controls="site-menu-projects"
                      onClick={toggleProjects}
                      data-index={idx + 1}
                    >
                      <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                        {it.label}
                        <svg aria-hidden="true" width="0.5em" height="0.5em" viewBox="0 0 10 10" className={`ml-3 inline-block align-middle transition-transform duration-300 ${projectsOpen ? 'rotate-180' : ''}`}>
                          <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                    <ul id="site-menu-projects" ref={projectsListRef} className="m-0 mt-2 flex list-none flex-col gap-1 overflow-hidden p-0 pl-[3.5rem]" style={{ height: 0 }} role="list">
                      <li className="overflow-hidden">
                        <a href={projectsHref} className="sm-sub-item block py-1.5 font-display text-[1.05rem] font-bold text-[var(--bg-white)] hover:text-accent">
                          <span className="sm-sub-itemLabel inline-block">{labels.allProjects} ↗</span>
                        </a>
                      </li>
                      {projects.map(p => (
                        <li key={p.href + p.title} className="overflow-hidden">
                          <a href={p.href} className="sm-sub-item block py-1.5 font-display text-[1.05rem] font-bold text-[var(--bg-white)]/75 transition-colors hover:text-accent">
                            <span className="sm-sub-itemLabel inline-block">{p.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <a
                    className={`sm-panel-item relative inline-block cursor-pointer pr-[1.4em] font-display text-[clamp(2rem,6.5vw,3.6rem)] font-[800] leading-none tracking-[-0.02em] text-[var(--bg-white)] no-underline transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current ${it.current ? 'opacity-50' : ''}`}
                    href={it.href}
                    aria-current={it.current ? 'page' : undefined}
                    data-index={idx + 1}
                  >
                    <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">{it.label}</span>
                  </a>
                )}
              </li>
            ))}
          </ul>

          <div className="sm-socials mt-auto flex flex-col gap-4 border-t border-white/15 pt-6" aria-label={labels.socials}>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <h3 className="sm-socials-title m-0 text-[0.68rem] font-bold uppercase tracking-[0.3em] text-accent">{labels.socials}</h3>
              <ul className="sm-socials-list m-0 flex list-none flex-row flex-wrap items-center gap-4 p-0" role="list">
                {socials.map((s, i) => (
                  <li key={s.href + i}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="sm-socials-link relative inline-block py-[2px] font-display text-[1rem] font-bold text-[var(--bg-white)]/80 no-underline transition-[color,opacity] duration-300 hover:text-accent">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <ul className="m-0 flex list-none items-center gap-4 p-0" aria-label={labels.changeLanguage} role="list">
                {languages.map(l =>
                  l.current ? (
                    <li key={l.code}>
                      <span aria-current="true" className="sm-socials-link font-display text-[0.9rem] font-bold uppercase tracking-[0.18em] text-[var(--bg-white)] underline decoration-accent decoration-2 underline-offset-[6px]">
                        {l.label}
                      </span>
                    </li>
                  ) : (
                    <li key={l.code}>
                      <a href={l.href} hrefLang={l.code} lang={l.code} className="sm-socials-link font-display text-[0.9rem] font-bold uppercase tracking-[0.18em] text-[var(--bg-white)]/60 no-underline transition-colors hover:text-accent">
                        {l.label}
                      </a>
                    </li>
                  )
                )}
              </ul>
              <ul className="m-0 flex list-none flex-wrap items-center gap-4 p-0" role="list">
                {secondary.map(s => (
                  <li key={s.href}>
                    <a href={s.href} className="sm-socials-link font-display text-[0.9rem] font-bold text-[var(--bg-white)]/70 underline-offset-4 transition-colors hover:text-accent hover:underline">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </aside>

      <style>{`
.sm-scope .sm-panel-list[data-numbering] { counter-reset: smItem; }
.sm-scope .sm-panel-list[data-numbering] .sm-panel-item::after { counter-increment: smItem; content: counter(smItem, decimal-leading-zero); position: absolute; top: 0.1em; right: 0.35em; font-size: 0.32em; font-weight: 400; color: var(--accent); letter-spacing: 0; pointer-events: none; user-select: none; opacity: var(--sm-num-opacity, 0); }
.sm-scope .sm-socials-list:hover .sm-socials-link:not(:hover) { opacity: 0.4; }
.sm-scope .sm-socials-list .sm-socials-link:hover { opacity: 1; }
      `}</style>
    </div>
  );
}
