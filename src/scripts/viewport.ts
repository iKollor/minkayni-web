/* ──────────────────────────────────────────────────────────────────────────
   onWidthResize(): un `resize` que ignora la barra de direcciones del móvil.

   En iOS y Android, ocultar o mostrar la barra del navegador al desplazarse
   dispara `resize` aunque el ancho no haya cambiado: solo cambia el alto.
   Cualquier código que recalcule medidas en ese evento —marquesinas, refresh
   de ScrollTrigger, posiciones— se re-ejecuta en pleno scroll y produce el
   salto que el usuario ve como «la página se mueve sola».

   Un cambio de ancho sí es un cambio de layout real (rotar el teléfono,
   redimensionar la ventana) y ahí sí hay que recalcular. Por eso se compara
   el ancho, no el alto, y se agrupa con un pequeño retraso para no recalcular
   veinte veces mientras se arrastra el borde de una ventana.
─────────────────────────────────────────────────────────────────────────── */
export function onWidthResize(callback: () => void, delayMs = 150): () => void {
    let lastWidth = window.innerWidth;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const handler = () => {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        if (timer) clearTimeout(timer);
        timer = setTimeout(callback, delayMs);
    };

    window.addEventListener("resize", handler, { passive: true });
    window.addEventListener("orientationchange", handler, { passive: true });

    return () => {
        window.removeEventListener("resize", handler);
        window.removeEventListener("orientationchange", handler);
        if (timer) clearTimeout(timer);
    };
}
