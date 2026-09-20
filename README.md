# Fundación Minkayni — Sitio estático con Astro, GSAP y Tailwind

Este repositorio contiene el sitio de Fundación Minkayni construido con Astro v7, GSAP 3 y TailwindCSS v4. El contenido se obtiene desde Strapi vía GraphQL y se valida con esquemas Zod generados automáticamente. Además incluye un pipeline de Markdown/HTML con reglas personalizadas (rehype) y una arquitectura de animaciones basada en GSAP con ScrollSmoother/ScrollTrigger.

## Stack principal

- Astro 7 (render estático, `astro:assets`, integraciones)
- TailwindCSS 4 vía `@tailwindcss/vite` (utilidades + estilos globales en `src/styles/global.css`)
- GSAP 3 (ScrollSmoother, ScrollTrigger, SplitText, Draggable, Inertia, etc.)
- Strapi GraphQL (contenido headless) + Zod (validación de tipos)
- Rehype modular (shortcodes y reglas de links)

Versiones relevantes (package.json): Astro ^7.3.x, Tailwind ^4.3.x, GSAP ^3.15.x, Zod ^4.6.x.

No hay framework de UI: el sitio no hidrata ningún island. El fondo animado de
la portada (`components/index/BubbleBackground.astro`) se resolvió con CSS más
un script mínimo, en lugar de los ~364 KB que costaba React + `motion`.

## Estructura del proyecto

Carpetas clave dentro de `src/`:

- `layouts/MainLayout.astro`: layout global. Crea la capa de grano fija `#grain-layer` (video con fallback GIF) y envuelve el contenido en `#smooth-wrapper > #smooth-content`. Importa `src/scripts/main.ts` al final del body. Define meta PWA mínimas y estilos globales para ocultar `PageNavigation` en mobile.
- `pages/`: páginas del sitio (routing por archivo). Ej.: `index.astro`.
- `components/`: componentes Astro. Ej.: `index/Tag.astro` (demo animación SVG con GSAP), `Navbar`, `Footer`, `Menu` y `index/PageNavigation.astro`.
- `scripts/`: scripts de animación/UX. `main.ts` registra plugins GSAP y gestiona ScrollSmoother; `index/` contiene la intro, helpers, odometer y animaciones específicas de la home.
- `content.config.ts`: configuración de contenido con `astro:content`; define las colecciones con loaders de Strapi y valida la conexión al iniciar.
- `utils/`: utilidades, incluyendo `loaders/strapi-loader.ts` (loader GraphQL-agnóstico para Strapi) y `rehype-modular.ts` (plugin rehype custom usado por Astro).
- `styles/`: estilos globales (`global.css`).

Públicos/estáticos:

- `public/`: favicons y estáticos directos.
- `src/assets/`: fuentes, imágenes, SVG y videos usados vía `astro:assets` (por ejemplo, favicons generados en el layout).

## Animaciones y ScrollSmoother

- `src/scripts/main.ts` registra los plugins GSAP usados en el sitio y controla la creación única de ScrollSmoother:
  - Usa guard `window.__SMOOTH_CREATED__` para evitar inicializaciones duplicadas.
  - Fuerza `overflow-x: hidden` en `html`, `body`, `#smooth-wrapper`, `#smooth-content` como refuerzo (además de CSS global).
  - Espera a que desaparezcan `#intro-overlay` y la clase `html.no-scroll` antes de crear el smoother (con fallback a 8s).
  - Deshabilita ScrollSmoother en iOS y en viewport móvil (<768px) para evitar doble scroll.
- Convenciones para animaciones en componentes:
  - Importa `gsap` desde `src/scripts/main` para reutilizar registro de plugins.
  - Usa un flag `data-initialized` para evitar inicializaciones múltiples (ver `components/index/Tag.astro`).
  - Respeta `prefers-reduced-motion`: garantiza estados finales estables sin animación si el usuario lo prefiere.
  - No cambies los selectores críticos sin actualizar los scripts: `#smooth-wrapper`, `#smooth-content`, `#intro-overlay`, `#grain-layer`, `#tagReveal`.
- Capa de grano: `#grain-layer` muestra un vídeo de ruido (~15 KB) con fallback a una imagen estática (clase `grain-still-fallback` si el vídeo no reproduce a tiempo). Puedes togglearlo en runtime con `window.toggleGrain()`.

## Contenido: Strapi GraphQL + Zod

- `src/content.config.ts`:
  - Lee `STRAPI_URL` y `STRAPI_TOKEN` desde `import.meta.env` y construye headers de autenticación.
  - Ejecuta `validateStrapiConnection()` en tiempo de carga; si falla, aborta el build (útil para detectar mal configurado .env).
  - Define colecciones con loaders:
    - `posts` (mode `collection`)
    - `homepage` (mode `single` con `idResolver` → "homepage")
    - `footer` (mode `single`)
    - `navigationHeader` (Strapi Navigation, loader dedicado `strapi-navigation-loader.ts`)
  - Esquemas Zod importados desde `src/schemas/strapi.graphql.zod.ts` y `src/schemas/navigation.ts`.
- Loader GraphQL (`src/utils/loaders/strapi-loader.ts`):
  - Hace introspección del esquema GraphQL y construye una selección mínima útil para cada tipo, con profundidad configurable (`depth`, por defecto 2) y bloqueando campos globales como `related/localizations` cuando procede.
  - Soporta modos `single` y `collection`.
  - Paginación automática (hasta `MAX_PAGES = 200`), detecta `data/meta` o `nodes/pageInfo` según el servidor, y reintenta por tamaño de página cuando no hay `pageCount`.
  - Filtrado de estado de publicación (`PUBLISHED` vs `DRAFT`/`PREVIEW`).
  - i18n bundle: detecta `locale` en el CT; agrupa por documento un objeto `_i18n` con todas las variantes y fija `_defaultLocale` (según `preferredLocale` o la primera disponible).
  - Para contenidos sin i18n (sin campo `locale`), evita iterar locales y guarda bajo `default`.
  - Id estable por documento (`documentId`/`id` o `idResolver`).

## Markdown/HTML post-procesado (rehype)

Desde Astro 7 el procesador por defecto es Sätteri; el sitio se mantiene en el
pipeline `unified()` de `@astrojs/markdown-remark` porque `rehype-modular` es un
plugin rehype. Los plugins se declaran una sola vez en
`src/utils/markdown-pipeline.ts` y los comparten `astro.config.ts` (ficheros `.md`)
y `src/components/Markdown.astro` (texto enriquecido que llega de Strapi):

- Shortcodes en texto, p. ej. `{{odometer:150}}` →
  `<span id="odometer"><span class="current">150</span></span>`.
- Reglas para `<a>`:
  - Todos los anchors: clase `anchor-fx` (sin duplicar).
  - Externos (`href^="http"`): `target="_blank"` y `rel="noopener noreferrer"`.
  - Internos (`href^="/"`): limpia `target/rel` si existieran.

## Estilos

- Tailwind v4 via `@tailwindcss/vite` (sin postcss.config). Utilidades y resets en `src/styles/global.css`.
- Imágenes y favicons mediante `astro:assets` (ver `MainLayout.astro`). Si renombras assets, actualiza los imports que usan `getImage`/`Image`.

## Requisitos previos

- Node.js 22.12 o superior (lo exige Astro 7; ver `.nvmrc`)
- pnpm (el repo fija `packageManager: pnpm@9.15.9`)
- Variables de entorno para Strapi:
  - `STRAPI_URL=https://<tu-cms>/`
  - `STRAPI_TOKEN=<token_de_acceso>`

Crea un archivo `.env` en la raíz del proyecto con:

```bash
STRAPI_URL=https://cms.ejemplo.com
STRAPI_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
```

Sin estas variables el sitio compila igualmente: cada página cae a su fallback
local de `src/data/pages/*`. El build sólo aborta si defines `STRAPI_STRICT=true`
(recomendado en producción, ver Despliegue). Lista completa de variables en
`.env.example`.

## Scripts de desarrollo

Usa pnpm para todos los comandos.

- Instalar dependencias:
  - `pnpm install`
- Desarrollo (servidor en http://localhost:4321):
  - `pnpm run dev`
- Build de producción (carpeta `dist/`):
  - `pnpm run build`
- Preview local de la build:
  - `pnpm run preview`
- CLI de Astro:
  - `pnpm run astro -- <comando>` (por ejemplo `check`, `add`)
- Generación de Zod desde GraphQL (codegen):
  - `pnpm run zod:gen` (codegen completo)
  - `pnpm run zod:gen:lazy` (variación “lazy”)

## Guía rápida de contribución de animaciones

1) Importa gsap desde el bootstrap común para compartir plugins:

```ts
import { gsap, ScrollTrigger } from "../../scripts/main";
```

2) Evita dobles inicializaciones con un flag de dataset. Tipa el elemento en la
   consulta; `dataset` existe en `HTMLElement`, así que no hace falta castear:

```ts
const el = document.getElementById("mi-comp");
if (!(el instanceof HTMLElement) || el.dataset.initialized) return;
el.dataset.initialized = "1";
```

   Si necesitas guardar más de una bandera, declara una interfaz para el estado
   y haz un único cast con nombre (ver `scripts/components/CustomSlider.ts`) en
   lugar de repartir `as any` por el fichero.

3) Respeta `prefers-reduced-motion` y deja un estado final estable sin animación:

```ts
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduce) { /* set() estado final y return */ }
```

4) Si usas ScrollSmoother/ScrollTrigger, no renombres `#smooth-wrapper` ni `#smooth-content`. Si necesitas cambiarlos, actualiza `src/scripts/main.ts`.
5) Evita animar propiedades que generen layout shifts sin estabilizar su estado final (usa `gsap.set(...)` apropiadamente).

## Page Navigation e Intro

- `PageNavigation` existe pero se oculta en mobile por CSS global definido en `MainLayout.astro`.
- La intro (video/overlay) vive en `src/scripts/index/intro.ts`:
  - Añade `html.no-scroll` mientras corre y la retira al finalizar.
  - Muestra/oculta `#intro-overlay` y anima navegación y párrafo principal con GSAP.
  - Aplica un mínimo visible, fallback si el video no reproduce y respeta `prefers-reduced-motion`.

## Despliegue

### Por qué estático y no adaptador Node

`astro.config.ts` declara `output: "static"` de forma explícita. Se evaluó pasar
a adaptador Node (híbrido o servidor) y no compensa: el sitio no tiene
endpoints, formularios, cookies, sesión ni middleware, y todo el contenido de
Strapi se resuelve en build mediante content loaders. Un adaptador añadiría un
proceso Node y TTFB de render donde hoy Nginx entrega un fichero ya generado,
sin ganar nada en SEO —el HTML pre-renderizado ya es lo óptimo para los
rastreadores—.

El único coste de este modelo es que **un cambio en el CMS no se ve hasta que
se reconstruye**. Eso se resuelve con un webhook, no cambiando el modo de salida.

### Webhook de Strapi → rebuild

Para que publicar en Strapi regenere el sitio:

1. En Coolify, en el recurso del frontend, genera una URL de despliegue por
   webhook (Settings → Webhooks).
2. En el admin de Strapi, **Settings → Webhooks → Create new webhook**, apunta a
   esa URL con método `POST` y marca los eventos `entry.publish`,
   `entry.unpublish` y `entry.delete`.

Sin esto, cada cambio editorial exige lanzar el redeploy a mano.

### Variables de entorno del build

- `STRAPI_URL` y `STRAPI_TOKEN` son obligatorias en el entorno de build del
  proveedor. Sin ellas el sitio compila igualmente, pero con el contenido de
  respaldo de `src/data/pages/*` en lugar del del CMS.
- `CARTO_KEY` alimenta las teselas del mapa de sectores; sin ella CARTO añade
  una marca de agua «API key required».
- **`STRAPI_STRICT=true` es recomendable en producción**: hace fallar el build
  si Strapi no responde. Por defecto el build continúa con los fallbacks, lo
  que es lo correcto en local pero significa que un CMS caído publicaría
  contenido desactualizado sin avisar.
- `astro.config.ts` declara `site: "https://minkayni.org"`. De ahí salen la URL
  canónica de cada página y la `url` del JSON-LD de la organización; si el
  dominio cambia, hay que actualizarlo ahí.
- **Página 404**: la build genera `dist/404.html`, pero un servidor estático no
  la usa por su cuenta —devuelve 404 vacío o, peor, 200 con el index—. El
  archivo `nginx.conf` de la raíz trae la configuración correcta (`error_page
  404 /404.html` + `try_files` sin fallback a index). En Coolify se aplica en la
  configuración personalizada de Nginx del recurso del frontend. Para
  comprobarlo tras desplegar:

  ```bash
  curl -I https://minkayni.org/esta-ruta-no-existe
  ```

  Debe responder `HTTP/2 404` (no 200 ni 403).

## Medios de Strapi

El frontend permanece estático en Astro 7. Los medios remotos se emiten como
`https://www.minkayni.org/media/<archivo>` (`src/utils/media-url.ts`): Nginx
reenvía `/media/<archivo>` a `<STRAPI_URL>/media/uploads/<archivo>` y lo guarda
en caché (bloque `location /media/` de `nginx.conf`), y Strapi lo sirve desde
`s3-media-edge`. El `uploads/` es la carpeta interna del almacén de Strapi y
no aparece en ninguna URL pública.
Así el visitante —y los proxies de imágenes de Gmail, WhatsApp o Google— solo
ven el dominio de la web. El navegador no conoce `CDN_BASE_URL`, Garage ni
`IMAGOR_SECRET`. `PUBLIC_MEDIA_ORIGIN` permite emitir otro origen (p. ej. en un
entorno de pruebas sin ese proxy).

Para comprobarlo tras desplegar:

```bash
curl -sI https://www.minkayni.org/media/<un-fichero-del-cms> | grep -i -E "^(HTTP|x-cache|cache-control)"
```

La primera petición responde `X-Cache: MISS` y la siguiente `HIT`.

Variables de build del frontend en Coolify:

```env
STRAPI_URL=https://strapi.minkayni.org
STRAPI_TOKEN=<token de solo lectura>
```

El CMS, no este frontend, debe tener como variable de runtime:

```env
CDN_BASE_URL=https://img.minkayni.org
```

Después de cambiar estas variables se requiere un redeploy completo, porque el
contenido de Strapi se obtiene durante el build estático.

## Google Ad Grants: qué exige el sitio y cómo se comprueba

La [política de sitios web de Ad Grants](https://support.google.com/grants/answer/1657899)
pide, en resumen, que el sitio cargue rápido, se navegue con facilidad y
tenga contenido abundante y actualizado con llamadas a la acción. La
activación se rechazó dos veces por eso, y `tests/ad-grants.test.ts` audita
la build (`pnpm build && pnpm test`) contra cada reproche: presupuestos de
peso (HTML, fuentes, JavaScript, imágenes enlazadas), nada de fuentes de
terceros, portada y menú visibles en el HTML, enlaces internos y anclas sin
roturas, sin páginas de demostración publicadas, título/descripción/`h1` en
cada página, enlace a aportes y a contacto desde todas, canónicas y
`hreflang` coherentes, sitemap y `robots.txt`. Si un cambio legítimo rompe un
presupuesto, se sube el número y se documenta el porqué en el propio test.

Convenciones que salen de ahí:

- **Nada oculto en el HTML.** Todo lo que revela una animación viene visible
  en el documento y solo se esconde bajo `html[data-js]` (hay JavaScript) o
  `html[data-intro="pending"]` (la intro de la portada va a reproducirse).
  Los dos atributos los escribe un script en línea de `src/layouts/lib/head.astro`
  antes del primer pintado, y cada regla que oculta algo lleva una animación
  de seguridad que lo destapa pasados unos segundos por si el script falla.
- **Fuentes propias.** Todas viven en `src/assets/fonts/`, recortadas
  (`.subset.woff2`). Nada de `fonts.googleapis.com`: cada hoja externa era
  una petición bloqueante antes del primer pintado.
- **Intro de la portada.** Solo se reproduce en visitas nuevas (dos horas de
  inactividad, ver `src/scripts/visita.ts`), y nunca con
  `prefers-reduced-motion`, ahorro de datos, red 2G/3G, equipo lento o una
  URL con ancla. `PUBLIC_HOME_INTRO=off` en el entorno de build la apaga del
  todo: es la palanca si la revisión vuelve a reprochar la carga de la portada.
- **Llamadas a la acción.** La página de aportes (`/donate`) y el contacto
  (`/about#contacto`) se enlazan desde el pie, el panel del menú y la sección
  «Cómo puedes ayudar» de la portada, además de los CTA propios de cada
  página. El árbol del CMS puede cambiar; esos enlaces no dependen de él.
- **Medición.** `PUBLIC_GA_MEASUREMENT_ID` / `PUBLIC_ADS_CONVERSION_ID` activan
  la etiqueta (ver `src/components/Analytics.astro`); sin ellas no se carga
  nada. Ad Grants exige seguimiento de conversiones para mantener la cuenta.

Para medir en local como lo hace Google (móvil con red y CPU limitadas):
`pnpm build`, servir `dist/` y pasar Lighthouse sobre `/`, `/about/`,
`/donate/` y `/novedades/`. Un perfil limpio equivale a una visita nueva: la
portada reproduce la intro, así que mide también con la intro apagada para
separar lo que cuesta la animación de lo que cuesta la página.

## Solución de problemas

- Build/Dev falla con “Strapi connection is invalid”:
  - Verifica `.env` y que `STRAPI_URL` apunte al endpoint base (el loader añade `/graphql`).
  - Confirma que el token tiene permisos de lectura sobre los tipos consultados.
  - Revisa que el servidor responda JSON a `POST /graphql`.
- Animaciones no “suaves” en iOS o móvil:
  - ScrollSmoother se deshabilita en iOS y viewports <768px por diseño para evitar conflictos. Es esperado.
- Shortcode `{{odometer:...}}` no aparece:
  - Asegúrate de usar Markdown procesado por Astro y que el contenido del shortcode llegue sin escapar.
- El build del proveedor falla con `MissingSharp: Could not find Sharp`:
  - Sharp es un módulo nativo: cada plataforma usa su propio binario
    (`@img/sharp-<os>-<arch>`). pnpm sólo instala el de la máquina donde corre
    la instalación, así que un lockfile generado en Windows o macOS puede dejar
    al contenedor Linux sin binario; el build muere al generar las imágenes, con
    todo el HTML ya escrito.
  - `package.json` declara `pnpm.supportedArchitectures` con `linux` (glibc y
    musl, x64 y arm64) además de la plataforma actual, para que
    `pnpm install --frozen-lockfile` baje siempre los binarios del entorno de
    build. No altera el lockfile: esos paquetes opcionales ya estaban en él.
  - Como red de seguridad, `astro.config.ts` comprueba sharp antes de construir
    y, si no carga, usa `passthroughImageService()`: el despliegue no se cae,
    pero las imágenes van sin optimizar. Se ve en el log como
    `[imagenes] sharp no está disponible: ...`; si eso aparece en producción hay
    que arreglar la instalación de sharp, no ignorarlo.

## Notas y convenciones

- No cambies los selectores: `#smooth-wrapper`, `#smooth-content`, `#intro-overlay`, `#grain-layer`, `#tagReveal` sin actualizar los scripts correspondientes.
- Importa `gsap` exclusivamente desde `src/scripts/main` en componentes animados.
- Si renombras assets gestionados por `astro:assets`, actualiza los imports en el layout.
- El `PageNavigation` se oculta en mobile por CSS global (consulta `MainLayout.astro`).

## Licencia

TODO: Declarar una licencia para este repositorio
