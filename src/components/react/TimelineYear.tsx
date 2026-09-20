/* TimelineYear — el año grande del panel del timeline (ImmersiveTimeline),
   con el Counter de reactbits: al cambiar de hito, los dígitos ruedan del
   año anterior al nuevo en vez de sustituirse.

   El script del timeline (Astro + GSAP) manda el año con el evento
   `timeline:year`; por si llega antes de hidratar, también lo deja en
   `data-year` del contenedor y aquí se lee al montar. La tipografía es la
   del contenedor (`[data-tl-year]`): se mide su font-size real. */
import { useEffect, useState } from 'react';
import Counter from './Counter';

interface Props {
  initial: number;
  /** Tamaño con el que se renderiza en el servidor; en cliente se mide. */
  fontSize: number;
}

const PLACES = [1000, 100, 10, 1];

export default function TimelineYear({ initial, fontSize: serverFontSize }: Props) {
  const [year, setYear] = useState(initial);
  const [fontSize, setFontSize] = useState(serverFontSize);
  /* Interlineado real del contenedor; en el servidor, el mismo que el cuerpo
     (el título va con leading-none). */
  const [lineHeight, setLineHeight] = useState(serverFontSize);

  useEffect(() => {
    const host = document.querySelector<HTMLElement>('[data-tl-year]');
    const measure = () => {
      if (!host) return;
      const style = getComputedStyle(host);
      const size = parseFloat(style.fontSize);
      if (Number.isFinite(size) && size > 0) setFontSize(size);
      const lh = parseFloat(style.lineHeight);
      setLineHeight(Number.isFinite(lh) && lh > 0 ? lh : size);
    };
    const pending = Number(host?.dataset.year);
    if (Number.isFinite(pending) && pending > 0) setYear(pending);
    measure();

    const onYear = (event: Event) => {
      const next = Number((event as CustomEvent<{ year?: number }>).detail?.year);
      if (Number.isFinite(next) && next > 0) setYear(next);
    };
    window.addEventListener('timeline:year', onYear);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('timeline:year', onYear);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <Counter
      value={year}
      places={PLACES}
      fontSize={fontSize}
      lineHeight={lineHeight}
      gap={0}
      borderRadius={0}
      horizontalPadding={0}
      gradientHeight={0}
      spring={{ duration: 900, bounce: 0 }}
    />
  );
}
