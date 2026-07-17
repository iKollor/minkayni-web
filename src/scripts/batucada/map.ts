import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Sectores de la Batucada Popular en Guayaquil.
   Coordenadas de OpenStreetMap (Nominatim, julio 2026); donde el sector
   no existe como lugar nombrado en OSM (Trinipuerto, Cisne 1) se usa el
   punto aproximado del barrio — los pines señalan sectores, no direcciones. */
export const SECTORS = [
    { name: "Socio Vivienda", lat: -2.1321, lng: -79.9697 },
    { name: "Mapasingue", lat: -2.1536, lng: -79.9239 },
    { name: "Trinipuerto", lat: -2.252, lng: -79.911 },
    { name: "Nigeria", lat: -2.229, lng: -79.9198 },
    { name: "Sergio Toral 1", lat: -2.1142, lng: -79.9884 },
    { name: "Sergio Toral 2", lat: -2.1098, lng: -79.9897 },
    { name: "Bastión Popular, Bloque 2", lat: -2.0933, lng: -79.9257 },
    { name: "Suburbio, Cisne 1", lat: -2.215, lng: -79.907 },
    { name: "Suburbio, Cisne 2", lat: -2.2217, lng: -79.9188 },
    { name: "Guasmo Sur", lat: -2.2673, lng: -79.8927 },
    { name: "Nueva Prosperina", lat: -2.1201, lng: -79.9806 },
    { name: "Paraíso de la Flor", lat: -2.1016, lng: -79.9556 },
] as const;

/* Mapa Leaflet con teselas CARTO (base OpenStreetMap). Se inicializa
   perezosamente cuando la sección se acerca al viewport.
   Interacción: clic en un sector (lista o pin) vuela al barrio y abre su
   popup con enlace "Cómo llegar"; el botón [data-bp-map-reset] devuelve
   la vista de los 12; hover sincronizado en ambos sentidos. */
export const initBatucadaMap = () => {
    const el = document.getElementById("bp-map");
    const status = document.querySelector<HTMLElement>("[data-bp-map-status]");
    if (!el || el.dataset.state === "loading" || el.dataset.state === "ready") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setState = (state: "loading" | "ready" | "error", message?: string) => {
        el.dataset.state = state;
        el.setAttribute("aria-busy", String(state === "loading"));
        if (message && status) status.textContent = message;
    };

    const boot = () => {
        setState("loading", "Cargando mapa de los sectores…");

        try {
            const map = L.map(el, {
                scrollWheelZoom: false, // el scroll de página manda; zoom con controles, doble clic o pellizco
                attributionControl: true,
                zoomControl: true,
            });

            L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: "abcd",
                maxZoom: 18,
                minZoom: 10,
            }).addTo(map);

            const bounds = L.latLngBounds(SECTORS.map((sector) => [sector.lat, sector.lng]));

            /* Pin rombo en utilidades Tailwind (los .ts entran en la detección
               de contenido). El número va en span interno con display:block —
               los transforms no aplican a inline. El estado activo se conmuta
               INTERCAMBIANDO clases (nunca apilando bg-* en conflicto). */
            const PIN_IDLE = ["bg-bp-blue"];
            const PIN_ACTIVE = ["bg-accent", "scale-125"];
            const PIN =
                "bp-pin grid place-items-center w-full h-full rotate-45 bg-bp-blue border-2 border-black text-black font-black text-[0.68rem] shadow-[2px_2px_0_rgba(10,8,1,0.35)] transition-[scale,background-color] duration-[180ms] ease-bp-rebound group-hover:scale-125 group-hover:bg-accent motion-reduce:transition-none cursor-pointer";

            const markers = SECTORS.map((sector, index) => {
                const icon = L.divIcon({
                    className: "group",
                    html: `<span class="${PIN}"><span class="block -rotate-45">${String(index + 1).padStart(2, "0")}</span></span>`,
                    iconSize: [26, 26],
                    iconAnchor: [13, 13],
                });
                return L.marker([sector.lat, sector.lng], { icon, title: sector.name, alt: sector.name }).addTo(map);
            });

            /* Tarjeta polaroid de hover PROPIA (no un tooltip de Leaflet):
               vive en el wrap del mapa, fuera del overflow:hidden del
               .leaflet-container, así que puede desbordar el marco sin
               cortarse. Posición con la propiedad `translate` (la animación
               usa `transform` en el figure interno: no compiten). */
            const HOVER_PHOTOS = ["/batucada/hover-1.webp", "/batucada/hover-2.webp", "/batucada/hover-3.webp"];
            const wrap = el.parentElement as HTMLElement;
            const card = document.createElement("div");
            card.className = "bp-hover-card pointer-events-none absolute z-[5] hidden w-[200px] [translate:-50%_calc(-100%_-_14px)]";
            card.innerHTML =
                `<figure class="m-0 border-2 border-black bg-white text-black shadow-[4px_4px_0_rgba(10,8,1,0.35)] overflow-hidden">` +
                `<img src="${HOVER_PHOTOS[0]}" alt="" width="200" height="120" class="block w-full aspect-[5/3] max-w-none object-cover" decoding="async">` +
                `<figcaption class="px-3 py-2 text-[0.72rem] font-black uppercase tracking-[0.08em]"></figcaption>` +
                `</figure>`;
            wrap.appendChild(card);
            const cardFigure = card.querySelector("figure") as HTMLElement;
            const cardImg = card.querySelector("img") as HTMLImageElement;
            const cardCaption = card.querySelector("figcaption") as HTMLElement;

            const showCard = (index: number) => {
                const sector = SECTORS[index];
                cardImg.src = HOVER_PHOTOS[index % HOVER_PHOTOS.length];
                cardCaption.textContent = `${String(index + 1).padStart(2, "0")} · ${sector.name}`;
                const point = map.latLngToContainerPoint([sector.lat, sector.lng]);
                card.style.left = `${point.x}px`;
                card.style.top = `${point.y}px`;
                card.classList.remove("hidden");
                /* reiniciar la animación de entrada en cada hover */
                cardFigure.classList.remove("bp-tip");
                void cardFigure.offsetWidth;
                cardFigure.classList.add("bp-tip");
            };
            const hideCard = () => card.classList.add("hidden");
            map.on("movestart zoomstart", hideCard);

            /* Galería por sector: al hacer CLIC se vuela al barrio y, solo al
               aterrizar en ese nivel de zoom, aparecen varias polaroids
               dispersas alrededor del pin. Cualquier pan o cambio de zoom del
               usuario las desmonta (movestart/zoomstart). Pueden desbordar el
               marco igual que la tarjeta de hover. */
            const gallery = document.createElement("div");
            gallery.className = "bp-map-gallery pointer-events-none absolute inset-0 z-[4] hidden";
            wrap.appendChild(gallery);

            /* 4 polaroids sin leyenda (la leyenda del sector solo vive en la
               tarjeta de hover) dispersas alrededor del pin en las 4
               esquinas — separadas lo suficiente para no pisarse entre sí
               ni con el pin central. */
            const GALLERY_SPOTS = [
                { x: -170, y: -100, rot: "-rotate-3", delay: 0 },
                { x: 150, y: -130, rot: "rotate-2", delay: 120 },
                { x: -150, y: 110, rot: "rotate-1", delay: 240 },
                { x: 165, y: 95, rot: "-rotate-2", delay: 360 },
            ];

            const showGallery = (index: number) => {
                const point = map.latLngToContainerPoint([SECTORS[index].lat, SECTORS[index].lng]);
                /* dos delays: entrada (rebote) y flotado continuo que arranca
                   cuando la entrada ya terminó — ambos animan transform, así
                   que el flotado no puede solaparse con la entrada */
                gallery.innerHTML = GALLERY_SPOTS.map(
                    (spot, i) =>
                        `<figure class="bp-tip absolute m-0 w-[170px] ${spot.rot} overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0_rgba(10,8,1,0.35)] [translate:-50%_-50%]" style="left:${point.x + spot.x}px; top:${point.y + spot.y}px; animation-delay:${spot.delay}ms,${spot.delay + 450}ms">` +
                        `<img src="${HOVER_PHOTOS[(index + i) % HOVER_PHOTOS.length]}" alt="" width="170" height="102" class="block aspect-[5/3] w-full max-w-none object-cover" decoding="async">` +
                        `</figure>`,
                ).join("");
                gallery.classList.remove("hidden");
            };
            const hideGallery = () => {
                gallery.classList.add("hidden");
                gallery.innerHTML = "";
            };
            map.on("movestart zoomstart", hideGallery);

            const showAll = () => {
                hideCard();
                map.flyToBounds(bounds, { padding: [36, 36], duration: 0.8, animate: !reduceMotion });
            };

            const focusSector = (index: number) => {
                const sector = SECTORS[index];
                const target = L.latLng(sector.lat, sector.lng);
                /* si ya estamos aterrizados en este sector, mostrar directo:
                   sin movimiento no habría moveend y el once() quedaría colgado */
                if (map.getZoom() === 15 && map.getCenter().distanceTo(target) < 40) {
                    showGallery(index);
                    return;
                }
                map.flyTo(target, 15, { duration: 0.9, animate: !reduceMotion });
                map.once("moveend", () => showGallery(index));
            };

            const fitMap = () => {
                map.invalidateSize({ animate: false, pan: false });
                map.fitBounds(bounds, { padding: [36, 36] });
                setState("ready");
            };
            requestAnimationFrame(fitMap);
            window.addEventListener("load", fitMap, { once: true });

            /* Sincronía lista ↔ mapa en ambos sentidos + clic para volar. */
            const items = Array.from(document.querySelectorAll<HTMLElement>("[data-bp-sector]"));
            const pinOf = (index: number) => markers[index]?.getElement()?.querySelector(".bp-pin");
            const activate = (index: number) => {
                const item = items[index];
                if (item) item.dataset.active = "";
                pinOf(index)?.classList.remove(...PIN_IDLE);
                pinOf(index)?.classList.add(...PIN_ACTIVE);
            };
            const deactivate = (index: number) => {
                const item = items[index];
                if (item) delete item.dataset.active;
                pinOf(index)?.classList.remove(...PIN_ACTIVE);
                pinOf(index)?.classList.add(...PIN_IDLE);
            };

            items.forEach((item, index) => {
                const marker = markers[index];
                if (!marker) return;
                item.addEventListener("mouseenter", () => {
                    activate(index);
                    showCard(index);
                });
                item.addEventListener("mouseleave", () => {
                    deactivate(index);
                    hideCard();
                });
                item.addEventListener("focusin", () => {
                    activate(index);
                    showCard(index);
                });
                item.addEventListener("focusout", () => {
                    deactivate(index);
                    hideCard();
                });
                item.addEventListener("click", () => focusSector(index));
            });

            markers.forEach((marker, index) => {
                marker.on("mouseover", () => {
                    activate(index);
                    showCard(index);
                });
                marker.on("mouseout", () => {
                    deactivate(index);
                    hideCard();
                });
                marker.on("click", () => focusSector(index));
            });

            document.querySelectorAll<HTMLElement>("[data-bp-map-reset]").forEach((button) => {
                button.addEventListener("click", showAll);
            });
        } catch (error) {
            console.error("[batucada-map] No se pudo inicializar Leaflet", error);
            setState("error", "No pudimos cargar el mapa. Los 12 sectores siguen disponibles en la lista.");
        }
    };

    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                io.disconnect();
                boot();
            },
            { rootMargin: "600px 0px" },
        );
        io.observe(el);
    } else {
        boot();
    }
};
