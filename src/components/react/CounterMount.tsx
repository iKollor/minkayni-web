/* CounterMount — arranca los contadores `[data-count]` del sitio (countUp.js
   con el plugin Odometer, ver scripts/count-up.ts) cuando la isla hidrata,
   después del LCP (`client:lcp`). El script se importa dentro del efecto:
   countUp toca `window` al cargarse y la isla también se renderiza en el
   servidor. */
import { useEffect } from 'react';

export default function CounterMount() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    void import('../../scripts/count-up').then(({ initCountUp }) => {
      if (!cancelled) cleanup = initCountUp();
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
