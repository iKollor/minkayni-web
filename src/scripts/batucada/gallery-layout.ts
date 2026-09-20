/* ──────────────────────────────────────────────────────────────────────────
   Dónde se colocan las polaroids que salen al tocar un sector del mapa.

   Antes las posiciones eran cuatro desplazamientos fijos en píxeles respecto
   al pin (±170 en horizontal, ±130 en vertical) con tarjetas de 170 px. En un
   teléfono el mapa mide unos 372×304, así que esas tarjetas salían del marco
   por los cuatro lados: se comían la lista de sectores de arriba y se cortaban
   contra el borde de la pantalla.

   Este módulo devuelve la colocación a partir del tamaño REAL del contenedor,
   con dos disposiciones:

   - Contenedor ancho → collage alrededor del pin, como estaba pensado, con un
     desborde lateral corto (el encanto de que la foto se salga del marco) pero
     nunca vertical, que es el que pisaba el texto.
   - Contenedor estrecho (un teléfono) → tira de miniaturas apoyada en el borde
     inferior, dentro del marco y por encima del botón «ver los N sectores».
     Es una vista previa: la foto grande vive en el visor.

   Todo son números; no toca el DOM. Así se puede probar sin navegador. */

/** Una polaroid colocada: centro, tamaño, giro y retardo de entrada. */
export type GallerySpot = {
    /** Centro de la tarjeta, en píxeles del contenedor. */
    x: number;
    y: number;
    width: number;
    height: number;
    /** Grados. El collage las inclina; la tira, casi nada. */
    rotate: number;
    /** Milisegundos de retardo de la animación de entrada. */
    delay: number;
};

/** Tarjetas como mucho: más no caben sin pisarse ni en el collage ni en la tira. */
export const MAX_SPOTS = 4;

/** Por debajo de este ancho de contenedor se usa la tira. */
const STRIP_MAX_WIDTH = 560;

/** Proporción de la tarjeta (la misma que ya tenían: 5:3). */
const RATIO = 3 / 5;

/** Desborde lateral permitido sobre el marco del mapa. Vertical: ninguno. */
const SPILL_X = 32;

/** Aire entre la tira y los bordes del mapa, y entre tarjetas. */
const STRIP_EDGE = 10;
const STRIP_GAP = 8;

/** Hueco que la tira deja libre abajo para el botón «ver los N sectores». */
const CONTROLS_CLEARANCE = 46;

const DELAY_STEP = 120;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Encaja un centro dentro del contenedor; si la tarjeta no cabe, la centra. */
const fit = (center: number, size: number, limit: number, spill: number): number => {
    const min = size / 2 - spill;
    const max = limit - size / 2 + spill;
    return min > max ? limit / 2 : clamp(center, min, max);
};

const ROTATIONS = [-3, 2.5, 1.5, -2];
const CORNERS: readonly (readonly [number, number])[] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
];

const scatter = (width: number, height: number, pinX: number, pinY: number, count: number): GallerySpot[] => {
    const card = clamp(Math.round(width * 0.24), 120, 170);
    const tall = Math.round(card * RATIO);
    /* Radios atados al contenedor: en un mapa pequeño el collage se cierra en
       vez de salirse. El tope reproduce la separación original. */
    const radiusX = Math.min(width * 0.34, 178);
    const radiusY = Math.min(height * 0.34, 124);

    return Array.from({ length: count }, (_, index) => {
        const [dx, dy] = CORNERS[index];
        return {
            x: Math.round(fit(pinX + dx * radiusX, card, width, SPILL_X)),
            y: Math.round(fit(pinY + dy * radiusY, tall, height, 0)),
            width: card,
            height: tall,
            rotate: ROTATIONS[index],
            delay: index * DELAY_STEP,
        };
    });
};

const strip = (width: number, height: number, count: number): GallerySpot[] => {
    const free = width - 2 * STRIP_EDGE - (count - 1) * STRIP_GAP;
    const card = clamp(Math.floor(free / count), 56, 150);
    const tall = Math.round(card * RATIO);
    const row = count * card + (count - 1) * STRIP_GAP;
    const first = (width - row) / 2 + card / 2;
    /* Apoyada abajo, por encima del botón del mapa; si el mapa fuese tan bajo
       que no cupiera, `fit` la devuelve al centro en vez de sacarla del marco. */
    const y = fit(height - STRIP_EDGE - CONTROLS_CLEARANCE - tall / 2, tall, height, 0);

    return Array.from({ length: count }, (_, index) => ({
        x: Math.round(first + index * (card + STRIP_GAP)),
        y: Math.round(y),
        width: card,
        height: tall,
        rotate: index % 2 ? 1.2 : -1.2,
        delay: index * DELAY_STEP,
    }));
};

/**
 * Colocación de las polaroids de un sector.
 *
 * @param container Tamaño del marco del mapa, en píxeles.
 * @param pin       Centro del pin dentro de ese marco.
 * @param count     Fotos disponibles (se usan como mucho `MAX_SPOTS`).
 */
export function galleryLayout(
    container: { width: number; height: number },
    pin: { x: number; y: number },
    count: number,
): GallerySpot[] {
    const total = Math.min(Math.max(Math.trunc(count), 0), MAX_SPOTS);
    if (total === 0 || container.width <= 0 || container.height <= 0) return [];

    return container.width < STRIP_MAX_WIDTH
        ? strip(container.width, container.height, total)
        : scatter(container.width, container.height, pin.x, pin.y, total);
}

/** `true` cuando la colocación es la tira de miniaturas (pantalla estrecha). */
export const isStripLayout = (containerWidth: number): boolean => containerWidth < STRIP_MAX_WIDTH;

/**
 * Coloca la tarjeta de hover sobre el pin sin salirse del marco.
 *
 * Devuelve el centro horizontal (la tarjeta se centra con `translate`) y si
 * tiene que caer por debajo del pin: pegada arriba se comía el texto de la
 * sección cuando el pin quedaba cerca del borde superior.
 */
export function hoverCardPlacement(
    container: { width: number; height: number },
    pin: { x: number; y: number },
    card: { width: number; height: number },
): { x: number; y: number; below: boolean } {
    const below = pin.y - card.height - 14 < 0 && pin.y + card.height + 14 <= container.height;
    return {
        x: Math.round(fit(pin.x, card.width, container.width, SPILL_X)),
        y: Math.round(pin.y),
        below,
    };
}
