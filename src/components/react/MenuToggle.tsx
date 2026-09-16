/* MenuToggle — el botón del Staggered Menu de reactbits
   (reactbits.dev/components/staggered-menu), separado del panel.

   En el original, botón y panel viven en el mismo árbol. Aquí el botón tiene
   que estar DENTRO del navbar —que es quien decide cuándo se ve y con qué
   tinta— y el panel FUERA, porque el navbar se desplaza con `transform` y un
   elemento fijo dentro de un ancestro transformado queda recortado. Los dos
   se hablan por eventos: `site-menu:toggle` hacia el panel y
   `site-menu:state` de vuelta. La animación del texto («Menú» ↔ «Cerrar»
   rodando) y del icono (+ → ×) es la del original, línea por línea. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface Props {
  openLabel: string;
  closeLabel: string;
}

export default function MenuToggle({ openLabel, closeLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [textLines, setTextLines] = useState<string[]>([openLabel, closeLabel]);
  const textInnerRef = useRef<HTMLSpanElement | null>(null);
  const plusHRef = useRef<HTMLSpanElement | null>(null);
  const plusVRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const spinTweenRef = useRef<gsap.core.Timeline | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (plusHRef.current) gsap.set(plusHRef.current, { transformOrigin: '50% 50%', rotate: 0 });
      if (plusVRef.current) gsap.set(plusVRef.current, { transformOrigin: '50% 50%', rotate: 90 });
      if (iconRef.current) gsap.set(iconRef.current, { rotate: 0, transformOrigin: '50% 50%' });
      if (textInnerRef.current) gsap.set(textInnerRef.current, { yPercent: 0 });
    });
    return () => ctx.revert();
  }, []);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    const h = plusHRef.current;
    const v = plusVRef.current;
    if (!icon || !h || !v) return;
    spinTweenRef.current?.kill();
    if (opening) {
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      spinTweenRef.current = gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .to(h, { rotate: 45, duration: 0.5 }, 0)
        .to(v, { rotate: -45, duration: 0.5 }, 0);
    } else {
      spinTweenRef.current = gsap
        .timeline({ defaults: { ease: 'power3.inOut' } })
        .to(h, { rotate: 0, duration: 0.35 }, 0)
        .to(v, { rotate: 90, duration: 0.35 }, 0)
        .to(icon, { rotate: 0, duration: 0.001 }, 0);
    }
  }, []);

  const animateText = useCallback(
    (opening: boolean) => {
      const inner = textInnerRef.current;
      if (!inner) return;
      textCycleAnimRef.current?.kill();

      const currentLabel = opening ? openLabel : closeLabel;
      const targetLabel = opening ? closeLabel : openLabel;
      const cycles = 3;
      const seq: string[] = [currentLabel];
      let last = currentLabel;
      for (let i = 0; i < cycles; i++) {
        last = last === openLabel ? closeLabel : openLabel;
        seq.push(last);
      }
      if (last !== targetLabel) seq.push(targetLabel);
      seq.push(targetLabel);

      setTextLines(seq);
      gsap.set(inner, { yPercent: 0 });
      const lineCount = seq.length;
      const finalShift = ((lineCount - 1) / lineCount) * 100;
      textCycleAnimRef.current = gsap.to(inner, { yPercent: -finalShift, duration: 0.5 + lineCount * 0.07, ease: 'power4.out' });
    },
    [openLabel, closeLabel]
  );

  /* El panel confirma cada cambio de estado (también los cierres por clic
     fuera o Escape), así que el icono nunca se queda desincronizado. */
  useEffect(() => {
    const onState = (event: Event) => {
      const next = Boolean((event as CustomEvent<{ open: boolean }>).detail?.open);
      setOpen(prev => {
        if (prev === next) return prev;
        animateIcon(next);
        animateText(next);
        return next;
      });
    };
    window.addEventListener('site-menu:state', onState);
    return () => window.removeEventListener('site-menu:state', onState);
  }, [animateIcon, animateText]);

  return (
    <button
      type="button"
      className="relative inline-flex cursor-pointer items-center gap-[0.45rem] rounded-full border-0 bg-transparent px-1 py-2 font-display text-[0.95rem] font-bold leading-none text-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
      aria-label={open ? closeLabel : openLabel}
      aria-expanded={open}
      aria-controls="site-menu-panel"
      onClick={() => window.dispatchEvent(new CustomEvent('site-menu:toggle'))}
    >
      <span className="relative inline-block h-[1em] overflow-hidden whitespace-nowrap" aria-hidden="true">
        <span ref={textInnerRef} className="flex flex-col leading-none">
          {textLines.map((line, i) => (
            <span className="block h-[1em] leading-none" key={i}>
              {line}
            </span>
          ))}
        </span>
      </span>
      <span ref={iconRef} className="relative inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center [will-change:transform]" aria-hidden="true">
        <span ref={plusHRef} className="absolute left-1/2 top-1/2 h-[2px] w-full -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-current [will-change:transform]" />
        <span ref={plusVRef} className="absolute left-1/2 top-1/2 h-[2px] w-full -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-current [will-change:transform]" />
      </span>
    </button>
  );
}
