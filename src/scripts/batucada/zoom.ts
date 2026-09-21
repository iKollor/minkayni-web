/* ──────────────────────────────────────────────────────────────────────────
   Aritmética del zoom del visor: ampliar hacia un punto y no dejar que la
   foto se escape del marco.

   La foto se pinta con `translate(offset) scale(escala)` y su origen en el
   centro del marco. Todas las coordenadas de aquí son relativas a ese
   centro, en píxeles de pantalla. No se toca el DOM: así se puede probar. */

export type Point = { x: number; y: number };

/**
 * Desplazamiento tras cambiar de escala manteniendo quieto el punto que hay
 * bajo el dedo (o el cursor).
 *
 * Con la foto centrada, un punto de la imagen se ve en
 * `punto = desplazamiento + escala · puntoDeLaFoto`. Para que ese mismo
 * punto de la foto siga bajo el dedo al cambiar la escala, el
 * desplazamiento nuevo sale de despejar esa igualdad.
 */
export function offsetAfterZoom(pointer: Point, offset: Point, from: number, to: number): Point {
    if (from <= 0) return offset;
    const ratio = to / from;
    return {
        x: pointer.x - ratio * (pointer.x - offset.x),
        y: pointer.y - ratio * (pointer.y - offset.y),
    };
}

/**
 * Recorta el desplazamiento para que no se vea marco vacío por ningún lado.
 *
 * A escala 1 la foto llena el marco justo, así que el margen que se puede
 * arrastrar es la mitad de lo que crece al ampliar. Si no ha crecido, no hay
 * nada que arrastrar y vuelve al centro.
 */
export function clampOffset(offset: Point, scale: number, frame: { width: number; height: number }): Point {
    const limit = { x: Math.max(0, (frame.width * scale - frame.width) / 2), y: Math.max(0, (frame.height * scale - frame.height) / 2) };
    return {
        x: Math.min(Math.max(offset.x, -limit.x), limit.x),
        y: Math.min(Math.max(offset.y, -limit.y), limit.y),
    };
}

/** Ampliación mínima y máxima que se permite a un toque. */
const MIN_ZOOM = 1.8;
const MAX_ZOOM = 4;

/**
 * Hasta dónde se puede ampliar esta foto.
 *
 * El tope natural es su resolución real: ampliar más allá de 1:1 solo
 * agranda los píxeles. Pero una foto pequeña —las genéricas del proyecto
 * miden 400 px— se quedaría sin zoom, y el gesto parecería roto, así que
 * siempre se permite un mínimo. Y un tope duro, porque a partir de cierto
 * punto ya no se ve la foto, se ve el grano.
 */
export function maxZoom(naturalWidth: number, displayedWidth: number): number {
    if (!naturalWidth || !displayedWidth) return MIN_ZOOM;
    const oneToOne = naturalWidth / displayedWidth;
    return Math.min(Math.max(oneToOne, MIN_ZOOM), MAX_ZOOM);
}

/** Distancia entre dos dedos, para el pellizco. */
export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Punto medio entre dos dedos: es hacia donde amplía el pellizco. */
export const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
