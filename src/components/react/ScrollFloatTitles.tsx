/* ScrollFloatTitles — la animación de ScrollFloat
   (reactbits.dev/text-animations/scroll-float) aplicada a los títulos de
   sección del sitio.

   El original es un <h2> que recibe un texto plano y lo parte letra a letra.
   Aquí los títulos ya están en el HTML, en 24 archivos, y 68 de los 70 llevan
   marcado (una palabra en color, una cursiva, un salto de línea) que un
   `split('')` destruiría. Así que la isla —una por layout— busca los
   `h2[data-scroll-float]`, parte SOLO los nodos de texto en letras y deja
   intactos los elementos que los envuelven. El tween de GSAP es el del
   original, valor por valor.

   Dos cuidados que el original no tiene porque sus demos son cortas:
   - Cada palabra va en un `nowrap`: con las letras sueltas como
     inline-block, el navegador partía línea a mitad de palabra
     («neighbourh / oods»).
   - Un lector de pantalla leería las letras una a una, así que el h2 recibe
     `aria-label` con el texto completo y el contenido partido queda
     `aria-hidden`.

   Los títulos que aparecen DESPUÉS de cargar (la vista previa de borradores
   del constructor pinta el contenido tras pedirlo al CMS) se anuncian con el
   evento `scrollfloat:scan` y reciben la misma animación. */
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ANIMATION = {
  duration: 1,
  ease: 'back.inOut(2)',
  scrollStart: 'center bottom+=50%',
  scrollEnd: 'bottom bottom-=40%',
  stagger: 0.03
} as const;

const splitTextNodes = (root: HTMLElement): HTMLElement[] => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if ((node.nodeValue ?? '').trim()) textNodes.push(node as Text);
  }

  const chars: HTMLElement[] = [];
  for (const node of textNodes) {
    const fragment = document.createDocumentFragment();
    for (const token of (node.nodeValue ?? '').split(/(\s+)/)) {
      if (!token) continue;
      if (/^\s+$/.test(token)) {
        /* Un espacio normal entre palabras: ahí sí puede partir la línea. */
        fragment.appendChild(document.createTextNode(' '));
        continue;
      }
      const word = document.createElement('span');
      word.className = 'inline-block whitespace-nowrap';
      for (const char of token) {
        const span = document.createElement('span');
        span.className = 'inline-block';
        span.textContent = char;
        word.appendChild(span);
        chars.push(span);
      }
      fragment.appendChild(word);
    }
    node.parentNode?.replaceChild(fragment, node);
  }
  return chars;
};

/* Títulos aún sin tratar. */
const pendingHeadings = () =>
  Array.from(document.querySelectorAll<HTMLElement>('h2[data-scroll-float]')).filter(
    el => !el.dataset.scrollFloatReady && !el.classList.contains('sr-only') && (el.textContent ?? '').trim()
  );

const enhance = (headings: HTMLElement[]) =>
  gsap.context(() => {
    /* Todas las lecturas de diseño antes de la primera escritura. Leer
       `getComputedStyle(el).marginBottom` después de haber tocado el título
       anterior obligaba al navegador a recalcular el diseño de toda la página
       una vez por título: siete en la portada, 270 ms de reflows forzados
       según PageSpeed. Leídas de golpe cuesta un recálculo en total. */
    const margins = headings.map(el => getComputedStyle(el).marginBottom);

    headings.forEach((el, index) => {
      el.dataset.scrollFloatReady = '1';
      el.setAttribute('aria-label', (el.textContent ?? '').replace(/\s+/g, ' ').trim());

      const inner = document.createElement('span');
      inner.setAttribute('aria-hidden', 'true');
      inner.className = 'inline-block max-w-full';
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);

      /* El original recorta con overflow-hidden para que las letras suban
         desde fuera, pero eso recorta también a los lados y estos títulos se
         ajustan al ancho de su texto: con tracking-tight el último glifo se
         quedaba fuera (el signo de «…ally?», la ese de «Our Allies»).
         .clip-reveal recorta solo en vertical (ver global.css). El aire de
         abajo sigue haciendo falta: los interlineados son muy prietos y la
         tinta de Aristotelica mide 1,10 em. */
      el.classList.add('clip-reveal');
      el.style.paddingBottom = '0.14em';
      el.style.marginBottom = `calc(${margins[index]} - 0.14em)`;

      const chars = splitTextNodes(inner);
      if (!chars.length) return;

      gsap.fromTo(
        chars,
        { willChange: 'opacity, transform', opacity: 0, yPercent: 120, scaleY: 2.3, scaleX: 0.7, transformOrigin: '50% 0%' },
        {
          duration: ANIMATION.duration,
          ease: ANIMATION.ease,
          opacity: 1,
          yPercent: 0,
          scaleY: 1,
          scaleX: 1,
          stagger: ANIMATION.stagger,
          scrollTrigger: { trigger: el, start: ANIMATION.scrollStart, end: ANIMATION.scrollEnd, scrub: true }
        }
      );
    });
  });

export default function ScrollFloatTitles() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const contexts: gsap.Context[] = [];
    const scan = () => {
      const headings = pendingHeadings();
      if (headings.length) contexts.push(enhance(headings));
    };

    scan();
    window.addEventListener('scrollfloat:scan', scan);
    return () => {
      window.removeEventListener('scrollfloat:scan', scan);
      contexts.forEach(ctx => ctx.revert());
    };
  }, []);

  return null;
}
