/* CounterMount — monta el Counter de reactbits sobre cada `[data-count]` del
   sitio.

   Los números animados ya existían como texto en el HTML (`<span data-count>`
   en Impacto, en los bloques del constructor y en la leyenda de la portada), y
   ese texto es lo que leen los buscadores. En vez de reescribir cada página
   para pasar el número por props, esta isla —una por layout— busca esos spans
   y monta el contador dentro de cada uno cuando entra en pantalla. La
   tipografía, el color y el tamaño se heredan del texto que ya estaba ahí:
   se mide el `font-size` calculado del span y se le pasa al Counter.

   Separador de miles: «1.200» en español, «1,200» en inglés. El original solo
   admitía el punto decimal; Counter.tsx acepta cualquier cadena en `places`. */
import { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Counter from './Counter';

const ROOTS = new WeakMap<Element, Root>();

const placesFor = (target: number, separator: string): Array<number | string> => {
  const digits = Math.max(1, String(Math.trunc(target)).length);
  const places: Array<number | string> = [];
  for (let i = digits - 1; i >= 0; i -= 1) {
    places.push(10 ** i);
    if (i > 0 && i % 3 === 0) places.push(separator);
  }
  return places;
};

function CountUp({ target, prefix, suffix, fontSize, separator }: { target: number; prefix: string; suffix: string; fontSize: number; separator: string }) {
  /* Arranca en cero con TODAS las columnas ya presentes (las `places` salen
     del objetivo, no del valor), así la anchura no cambia mientras rueda. */
  const [value, setValue] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setValue(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <>
      {prefix}
      <Counter
        value={value}
        places={placesFor(target, separator)}
        fontSize={fontSize}
        gap={0}
        borderRadius={0}
        horizontalPadding={0}
        gradientHeight={0}
        /* Los dígitos van centrados en una caja de 1em; para que asienten en la
           línea base del texto que los rodea, la caja baja un poco. */
        containerStyle={{ verticalAlign: '-0.14em' }}
        counterStyle={{ lineHeight: 1, alignItems: 'center' }}
      />
      {suffix}
    </>
  );
}

export default function CounterMount() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const separator = document.documentElement.lang.startsWith('en') ? ',' : '.';
    const spans = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'));
    if (!spans.length) return;

    const mount = (el: HTMLElement) => {
      if (ROOTS.has(el)) return;
      const target = Number(el.dataset.count ?? '');
      if (!Number.isFinite(target) || target <= 0) return;

      const fontSize = parseFloat(getComputedStyle(el).fontSize) || 48;
      const root = createRoot(el);
      ROOTS.set(el, root);
      root.render(
        <CountUp
          target={target}
          prefix={el.dataset.countPrefix ?? ''}
          suffix={el.dataset.countSuffix ?? ''}
          fontSize={fontSize}
          separator={separator}
        />
      );
    };

    /* Los contadores «manuales» (la leyenda de la portada) no se montan al
       entrar en pantalla: durante la intro contaban invisibles y al aparecer
       ya marcaban el total. Los monta quien los revela (paragraph.ts) con el
       evento `count:reveal`, en su turno dentro de la cascada del texto. */
    const onReveal = (event: Event) => {
      const el = (event as CustomEvent<{ el: HTMLElement }>).detail?.el;
      if (el) mount(el);
    };
    window.addEventListener('count:reveal', onReveal);

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          mount(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    spans.filter(span => !('countManual' in span.dataset)).forEach(span => observer.observe(span));

    return () => {
      observer.disconnect();
      window.removeEventListener('count:reveal', onReveal);
    };
  }, []);

  return null;
}
