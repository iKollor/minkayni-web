/* ──────────────────────────────────────────────────────────────────────────
   Visor de fotos a pantalla completa del mapa de Batucada.

   Se abre al tocar una polaroid: la foto grande, la tira de miniaturas para
   saltar entre ellas, y el contador. Teclado (flechas, Inicio/Fin, Escape),
   gestos (deslizar a los lados para cambiar, hacia abajo para cerrar) y foco
   atrapado mientras está abierto, que se devuelve a la polaroid al cerrar.

   El DOM se construye una sola vez, la primera vez que alguien abre el visor,
   y se reutiliza: quien nunca toca una foto no paga nada.

   Los textos llegan traducidos desde la página (ver `data-bp-strings` en
   batucada-popular.astro): este módulo no conoce idiomas. Los estilos son
   utilidades de Tailwind escritas aquí como literales —el escáner las lee— y
   las tres animaciones viven en el <style is:global> de la página, junto a
   las del resto del mapa. */
import { ScrollSmoother } from "../main";
import type { ViewerPhoto } from "../../utils/sector-photos";

export type ViewerStrings = {
    /** Nombre accesible del diálogo. */
    label: string;
    close: string;
    previous: string;
    next: string;
    /** Con `{index}`: ir a esa miniatura. */
    goTo: string;
    /** Con `{index}` y `{count}`: «2 de 4». */
    position: string;
};

type OpenOptions = {
    photos: readonly ViewerPhoto[];
    /** Foto por la que se abre. */
    index?: number;
    /** Pie de foto: el sector al que pertenecen. */
    caption?: string;
    strings: ViewerStrings;
    /** Elemento al que devolver el foco al cerrar. */
    trigger?: HTMLElement | null;
};

const format = (template: string, params: Record<string, string | number>): string =>
    template.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));

/* Botón rombo: el mismo gesto gráfico que los pines del mapa y los números
   de la lista de sectores. El contenido se gira al revés para leerse recto. */
const DIAMOND =
    "grid h-11 w-11 shrink-0 cursor-pointer place-items-center rotate-45 border-2 border-black bg-accent text-black shadow-[3px_3px_0_rgba(10,8,1,0.55)] transition-[scale,background-color] duration-[180ms] ease-bp-rebound hover:scale-110 hover:bg-bp-blue focus-visible:outline-[3px] focus-visible:outline-offset-[6px] focus-visible:outline-white disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none";

/** Distancia mínima de un gesto para que cuente como deslizar. */
const SWIPE_X = 45;
const SWIPE_DOWN = 90;

let root: HTMLElement | null = null;
let stage: HTMLElement;
let frameEl: HTMLElement;
let image: HTMLImageElement;
let captionEl: HTMLElement;
let positionEl: HTMLElement;
let thumbsEl: HTMLElement;
let prevButton: HTMLButtonElement;
let nextButton: HTMLButtonElement;

let photos: readonly ViewerPhoto[] = [];
let current = 0;
let strings: ViewerStrings | null = null;
let caption = "";
let lastFocused: HTMLElement | null = null;
let previousOverflow = "";
let pausedSmoother: { paused: (value?: boolean) => boolean } | null = null;

const isOpen = () => Boolean(root && !root.classList.contains("hidden"));

const build = (): HTMLElement => {
    const node = document.createElement("div");
    node.className = "bp-viewer fixed inset-0 z-[120] hidden";
    node.setAttribute("role", "dialog");
    node.setAttribute("aria-modal", "true");
    node.innerHTML =
        /* Fondo opaco, no translúcido: con un 5 % de transparencia la página
           seguía leyéndose por detrás de la foto (texto claro sobre morado) y
           el visor parecía un velo. El grano es el mismo del campo de tinta. */
        `<div class="absolute inset-0 bg-black [background-image:var(--bp-noise)] [background-blend-mode:soft-light]" data-viewer-close aria-hidden="true"></div>` +
        `<div class="relative mx-auto flex h-full w-full max-w-[1480px] flex-col gap-3 p-4 sm:gap-4 sm:p-6">` +
        `<div class="flex shrink-0 items-center justify-between gap-4">` +
        `<p class="text-[0.78rem] font-black uppercase tracking-[0.16em] text-white" data-viewer-position></p>` +
        `<button type="button" class="${DIAMOND}" data-viewer-close><span class="-rotate-45 text-[1.1rem] leading-none" aria-hidden="true">✕</span></button>` +
        `</div>` +
        `<div class="relative flex min-h-0 flex-1 touch-none items-center justify-center" data-viewer-stage>` +
        `<button type="button" class="${DIAMOND} absolute left-0 top-1/2 z-[2] -translate-y-1/2" data-viewer-prev><span class="-rotate-45 text-[1.1rem] leading-none" aria-hidden="true">←</span></button>` +
        /* Marco blanco y eco azul: sobre el campo de tinta, un borde negro
           desaparece y la foto queda flotando sin recortar. Es el mismo par
           —marco claro, sombra dura de color— que el resto de fotos del
           proyecto sobre fondo oscuro. */
        `<figure class="bp-viewer__frame m-0 flex max-h-full min-h-0 flex-col border-[3px] border-white bg-white shadow-[10px_10px_0_var(--color-bp-blue)]">` +
        `<img class="bp-viewer__image block h-auto max-h-full w-full object-contain" data-viewer-image alt="" decoding="async">` +
        `<figcaption class="shrink-0 border-t-[3px] border-black px-4 py-[0.6rem] text-[0.72rem] font-black uppercase tracking-[0.08em] text-black" data-viewer-caption></figcaption>` +
        `</figure>` +
        `<button type="button" class="${DIAMOND} absolute right-0 top-1/2 z-[2] -translate-y-1/2" data-viewer-next><span class="-rotate-45 text-[1.1rem] leading-none" aria-hidden="true">→</span></button>` +
        `</div>` +
        `<div class="flex shrink-0 touch-pan-x justify-start gap-2 overflow-x-auto overscroll-none px-1 pb-1 sm:justify-center" data-viewer-thumbs></div>` +
        `</div>`;

    document.body.appendChild(node);

    stage = node.querySelector("[data-viewer-stage]") as HTMLElement;
    frameEl = node.querySelector(".bp-viewer__frame") as HTMLElement;
    image = node.querySelector("[data-viewer-image]") as HTMLImageElement;
    captionEl = node.querySelector("[data-viewer-caption]") as HTMLElement;
    positionEl = node.querySelector("[data-viewer-position]") as HTMLElement;
    thumbsEl = node.querySelector("[data-viewer-thumbs]") as HTMLElement;
    prevButton = node.querySelector("[data-viewer-prev]") as HTMLButtonElement;
    nextButton = node.querySelector("[data-viewer-next]") as HTMLButtonElement;

    node.querySelectorAll("[data-viewer-close]").forEach((button) => button.addEventListener("click", close));
    prevButton.addEventListener("click", () => step(-1));
    nextButton.addEventListener("click", () => step(1));
    thumbsEl.addEventListener("click", (event) => {
        const thumb = (event.target as HTMLElement).closest<HTMLElement>("[data-viewer-index]");
        if (thumb) show(Number(thumb.dataset.viewerIndex));
    });

    /* Gestos. El `pointerdown` se escucha en la escena entera, así que un
       deslizamiento que empiece sobre un botón también cuenta; un toque sin
       recorrido sigue siendo un clic normal del botón. */
    let startX = 0;
    let startY = 0;
    let tracking = false;
    stage.addEventListener("pointerdown", (event) => {
        tracking = true;
        startX = event.clientX;
        startY = event.clientY;
    });
    stage.addEventListener("pointerup", (event) => {
        if (!tracking) return;
        tracking = false;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (Math.abs(dx) > SWIPE_X && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
        else if (dy > SWIPE_DOWN && dy > Math.abs(dx)) close();
    });
    stage.addEventListener("pointercancel", () => {
        tracking = false;
    });

    return node;
};

/* Tope de ampliación. La foto crece hasta llenar el hueco, pero no más de
   dos veces y media su tamaño real: pasado eso ya no se ve una foto grande,
   se ve una foto deshecha. Las tres genéricas del proyecto miden 400 px, así
   que se quedan cortas hasta que el CMS tenga las del barrio. */
const MAX_UPSCALE = 2.5;

/** Da al marco el tamaño de la foto dentro del hueco disponible. */
const fitFrame = (): void => {
    if (!isOpen()) return;
    const photo = photos[current];
    const width = image.naturalWidth || photo?.width || 0;
    const height = image.naturalHeight || photo?.height || 0;
    if (!width || !height) return;

    const room = stage.getBoundingClientRect();
    /* 6 px: los bordes de 3 px del marco a cada lado. */
    const free = { width: room.width - 6, height: room.height - captionEl.offsetHeight - 6 };
    if (free.width <= 0 || free.height <= 0) return;

    const scale = Math.min(free.width / width, free.height / height, MAX_UPSCALE);
    frameEl.style.width = `${Math.round(width * scale)}px`;
};

/** Salta a una foto concreta. */
const show = (next: number): void => {
    if (!root || !photos.length) return;
    current = Math.min(Math.max(next, 0), photos.length - 1);
    const photo = photos[current];

    /* La foto entra con un fundido corto: sin él, cambiar de foto en una red
       lenta deja el marco vacío de golpe. */
    image.classList.add("is-loading");
    image.src = photo.full;
    if (photo.srcset) image.srcset = photo.srcset;
    else image.removeAttribute("srcset");
    image.alt = photo.alt;
    if (photo.width) image.width = photo.width;
    if (photo.height) image.height = photo.height;
    const done = () => {
        image.classList.remove("is-loading");
        fitFrame();
    };
    fitFrame();
    if (image.complete) done();
    else image.addEventListener("load", done, { once: true });
    image.addEventListener("error", done, { once: true });

    /* El contador vive arriba; el pie, debajo de la foto, dice de qué barrio
       es. Repetir «1 de 3» en los dos sitios solo hacía más ruido. */
    const position = format(strings!.position, { index: current + 1, count: photos.length });
    positionEl.textContent = position;
    captionEl.textContent = caption || position;
    captionEl.hidden = !captionEl.textContent;

    const single = photos.length < 2;
    prevButton.disabled = single || current === 0;
    nextButton.disabled = single || current === photos.length - 1;
    prevButton.hidden = single;
    nextButton.hidden = single;

    thumbsEl.querySelectorAll<HTMLElement>("[data-viewer-index]").forEach((thumb, index) => {
        if (index === current) thumb.dataset.active = "";
        else delete thumb.dataset.active;
        thumb.setAttribute("aria-current", index === current ? "true" : "false");
        if (index === current) thumb.scrollIntoView({ block: "nearest", inline: "nearest" });
    });

    /* Adelantar las vecinas: al pasar de foto ya están en la caché. */
    for (const neighbour of [photos[current - 1], photos[current + 1]]) {
        if (!neighbour) continue;
        const preload = new Image();
        if (neighbour.srcset) preload.srcset = neighbour.srcset;
        preload.src = neighbour.full;
    }
};

const step = (delta: number): void => {
    if (photos.length < 2) return;
    show(current + delta);
};

const renderThumbs = (): void => {
    if (photos.length < 2) {
        thumbsEl.innerHTML = "";
        thumbsEl.hidden = true;
        return;
    }
    thumbsEl.hidden = false;
    thumbsEl.innerHTML = photos
        .map(
            (photo, index) =>
                `<button type="button" class="relative h-14 w-20 shrink-0 cursor-pointer overflow-hidden border-2 border-black bg-white opacity-55 transition-[opacity,scale] duration-[180ms] ease-bp-rebound hover:opacity-100 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-white data-[active]:border-accent data-[active]:opacity-100 motion-reduce:transition-none" data-viewer-index="${index}">` +
                `<img src="${photo.thumb}" alt="" class="block h-full w-full object-cover" loading="lazy" decoding="async">` +
                `</button>`,
        )
        .join("");
    thumbsEl.querySelectorAll<HTMLElement>("[data-viewer-index]").forEach((thumb, index) => {
        thumb.setAttribute("aria-label", format(strings!.goTo, { index: index + 1 }));
    });
};

const focusables = (): HTMLElement[] =>
    root ? Array.from(root.querySelectorAll<HTMLElement>("button:not([disabled]):not([hidden])")) : [];

const onKeydown = (event: KeyboardEvent): void => {
    if (!isOpen()) return;
    switch (event.key) {
        case "Escape":
            event.preventDefault();
            close();
            break;
        case "ArrowRight":
            event.preventDefault();
            step(1);
            break;
        case "ArrowLeft":
            event.preventDefault();
            step(-1);
            break;
        case "Home":
            event.preventDefault();
            show(0);
            break;
        case "End":
            event.preventDefault();
            show(photos.length - 1);
            break;
        case "Tab": {
            /* Foco atrapado: el tabulador no puede salirse a la página de
               detrás, que está tapada y no se puede usar. */
            const items = focusables();
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement as HTMLElement | null;
            if (event.shiftKey && (active === first || !root!.contains(active))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
            break;
        }
        default:
            break;
    }
};

const onResize = (): void => fitFrame();

const lockPage = (): void => {
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    /* En escritorio el scroll lo mueve ScrollSmoother con transformaciones,
       así que `overflow: hidden` no lo detiene: hay que pausarlo. */
    const smoother = ScrollSmoother.get?.();
    if (smoother && !smoother.paused()) {
        smoother.paused(true);
        pausedSmoother = smoother;
    }
};

const unlockPage = (): void => {
    document.documentElement.style.overflow = previousOverflow;
    pausedSmoother?.paused(false);
    pausedSmoother = null;
};

export const close = (): void => {
    if (!isOpen()) return;
    root!.classList.add("hidden");
    unlockPage();
    document.removeEventListener("keydown", onKeydown, true);
    window.removeEventListener("resize", onResize);
    /* Devolver el foco a la polaroid desde la que se abrió: quien navega con
       teclado vuelve justo donde estaba, no al principio de la página. */
    lastFocused?.focus({ preventScroll: true });
    lastFocused = null;
};

export const openViewer = ({ photos: list, index = 0, caption: label = "", strings: texts, trigger }: OpenOptions): void => {
    if (!list.length) return;

    photos = list;
    strings = texts;
    caption = label;
    lastFocused = trigger ?? (document.activeElement as HTMLElement | null);

    root ??= build();
    root.setAttribute("aria-label", texts.label);
    root.querySelectorAll("[data-viewer-close]").forEach((node) => {
        if (node instanceof HTMLButtonElement) node.setAttribute("aria-label", texts.close);
    });
    prevButton.setAttribute("aria-label", texts.previous);
    nextButton.setAttribute("aria-label", texts.next);

    renderThumbs();
    /* La animación de entrada del marco se reinicia en cada apertura. */
    const frame = root.querySelector(".bp-viewer__frame") as HTMLElement;
    frame.classList.remove("bp-viewer__frame");
    void frame.offsetWidth;
    frame.classList.add("bp-viewer__frame");

    root.classList.remove("hidden");
    lockPage();
    show(index);
    document.addEventListener("keydown", onKeydown, true);
    window.addEventListener("resize", onResize);
    /* El foco entra en el visor por el botón de cerrar: es la salida, y desde
       ahí el tabulador recorre el resto de controles. */
    (root.querySelector("[data-viewer-close]") as HTMLElement | null)?.focus({ preventScroll: true });
};
