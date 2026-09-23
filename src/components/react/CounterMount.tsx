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
import Counter, { type CounterTween } from './Counter';
import { APPLE_BEZIER } from '../../scripts/easing';

/* El conteo pasa por todas las cifras (1, 2, 3… 300) con la curva estándar de
   Apple: simétrica, así el arranque y la llegada se leen cifra a cifra y solo
   el tramo central va deprisa. Las cifras grandes tienen más recorrido y
   reciben más tiempo: 1,8 s hasta 10, unos 2,2 s en las centenas, 2,4 s en
   los miles y nunca más de 3 s. */
const countTween = (target: number): CounterTween => ({
  duration: Math.min(3, 1.5 + 0.3 * Math.log10(Math.max(10, target))),
  ease: APPLE_BEZIER,
});

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

function CountUp({ target, prefix, suffix, fontSize, lineHeight, separator }: { target: number; prefix: string; suffix: string; fontSize: number; lineHeight: number; separator: string }) {
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
        /* La altura de cada columna es el interlineado del texto que rodea al
           contador: así la cifra ocupa exactamente la caja de un carácter. */
        lineHeight={lineHeight}
        gap={0}
        borderRadius={0}
        horizontalPadding={0}
        gradientHeight={0}
        /* El contenedor alinea por línea base: la del primer dígito (Counter.tsx
           le da una real) coincide así con la del texto que lo rodea. */
        containerStyle={{ display: 'inline-flex', alignItems: 'baseline' }}
        tween={countTween(target)}
      />
      {suffix}
    </>
  );
}

export default function CounterMount() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const separator = document.documentElement.lang.startsWith('en') ? ',' : '.';
    /* Sin retorno temprano aunque ahora no haya cifras: la vista previa del
       constructor (BuilderPreview.tsx) las pinta después de hidratar esta isla
       y las anuncia con `count:reveal`, así que el oyente tiene que existir. */
    const spans = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'));

    const mount = (el: HTMLElement) => {
      if (ROOTS.has(el)) return;
      const target = Number(el.dataset.count ?? '');
      if (!Number.isFinite(target) || target <= 0) return;

      const style = getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize) || 48;
      /* `normal` no da un número: se aproxima a la proporción típica. */
      const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;
      const root = createRoot(el);
      ROOTS.set(el, root);
      root.render(
        <CountUp
          target={target}
          prefix={el.dataset.countPrefix ?? ''}
          suffix={el.dataset.countSuffix ?? ''}
          fontSize={fontSize}
          lineHeight={lineHeight}
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
    /* Si la cascada llegó antes de que esta isla hidratara, el span ya viene
       marcado como revelado: se monta ahora, sin esperar un evento que pasó. */
    spans.filter(span => 'countRevealed' in span.dataset).forEach(mount);

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
