# Fundación Minkayni — Sitio estático con Astro, React, GSAP y Tailwind

Este repositorio contiene el sitio de Fundación Minkayni construido con Astro v5, React 19, GSAP 3 y TailwindCSS v4. El contenido se obtiene desde Strapi vía GraphQL y se valida con esquemas Zod generados automáticamente. Además incluye un pipeline de Markdown/HTML con reglas personalizadas (rehype) y una arquitectura de animaciones basada en GSAP con ScrollSmoother/ScrollTrigger.

## Stack principal

- Astro 5 (render estático, `astro:assets`, integraciones)
- React 19 (componentes interactivos puntuales)
- TailwindCSS 4 vía `@tailwindcss/vite` (utilidades + estilos globales en `src/styles/global.css`)
- GSAP 3 (ScrollSmoother, ScrollTrigger, SplitText, Draggable, Inertia, etc.)
- Strapi GraphQL (contenido headless) + Zod (validación de tipos)
- Rehype modular (shortcodes y reglas de links)

Versiones relevantes (package.json): Astro ^5.13.x, React ^19.1.x, Tailwind ^4.1.x, GSAP ^3.13.x.

## Estructura del proyecto

Carpetas clave dentro de `src/`:

- `layouts/MainLayout.astro`: layout global. Crea la capa de grano fija `#grain-layer` (video con fallback GIF) y envuelve el contenido en `#smooth-wrapper > #smooth-content`. Importa `src/scripts/main.ts` al final del body. Define meta PWA mínimas y estilos globales para ocultar `PageNavigation` en mobile.
- `pages/`: páginas del sitio (routing por archivo). Ej.: `index.astro`.
- `components/`: componentes Astro/React. Ej.: `index/Tag.astro` (demo animación SVG con GSAP), `Navbar`, `Footer`, `Menu` y `index/PageNavigation.astro`.
- `scripts/`: scripts de animación/UX. `main.ts` registra plugins GSAP y gestiona ScrollSmoother; `index/` contiene la intro, helpers, odometer y animaciones específicas de la home.
- `content/`: configuración de contenido con `astro:content`. `content.ts` define colecciones con loaders Strapi y valida la conexión al iniciar.
- `utils/`: utilidades, incluyendo `loaders/strapi-loader.ts` (loader GraphQL-agnóstico para Strapi) y `rehype-modular.ts` (plugin rehype custom usado por Astro).
- `styles/`: estilos globales y SCSS puntual (`Hamburguer.scss`, compilado con `sass-embedded`).

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
- Capa de grano: `#grain-layer` muestra un video de ruido con fallback a GIF (clase `grain-gif-fallback` si el video no reproduce a tiempo). Puedes togglearlo en runtime con `window.toggleGrain()`.

## Contenido: Strapi GraphQL + Zod

- `src/content/config.ts`:
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

Configurado en `astro.config.ts` con `@astropub/md` y el plugin `rehype-modular`:

- Shortcodes en texto, p. ej. `{{odometer:150}}` →
  `<span id="odometer"><span class="current">150</span></span>`.
- Reglas para `<a>`:
  - Todos los anchors: clase `anchor-fx` (sin duplicar).
  - Externos (`href^="http"`): `target="_blank"` y `rel="noopener noreferrer"`.
  - Internos (`href^="/"`): limpia `target/rel` si existieran.

## Estilos

- Tailwind v4 via `@tailwindcss/vite` (sin postcss.config). Utilidades y resets en `src/styles/global.css`.
- SCSS puntual en `src/styles/Hamburguer.scss` (usa `sass-embedded`).
- Imágenes y favicons mediante `astro:assets` (ver `MainLayout.astro`). Si renombras assets, actualiza los imports que usan `getImage`/`Image`.

## Requisitos previos

- Node.js LTS (recomendado 18+)
- pnpm (el repo fija `packageManager: pnpm@10.x`)
- Variables de entorno para Strapi:
  - `STRAPI_URL=https://<tu-cms>/`
  - `STRAPI_TOKEN=<token_de_acceso>`

Crea un archivo `.env` en la raíz del proyecto con:

```bash
STRAPI_URL=https://cms.ejemplo.com
STRAPI_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
```

Importante: sin estas variables, `validateStrapiConnection()` fallará y no podrás ejecutar `dev/build`.

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

2) Evita dobles inicializaciones con un flag de dataset:

```ts
const el = document.getElementById("mi-comp");
if (!el || (el as any).dataset.initialized) return;
(el as any).dataset.initialized = "1";
```

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

- El sitio es estático (output en `dist/`).
- Asegúrate de definir `STRAPI_URL` y `STRAPI_TOKEN` en el entorno de build del proveedor (Vercel, Netlify, etc.), o el build fallará por la validación de Strapi.

## Solución de problemas

- Build/Dev falla con “Strapi connection is invalid”:
  - Verifica `.env` y que `STRAPI_URL` apunte al endpoint base (el loader añade `/graphql`).
  - Confirma que el token tiene permisos de lectura sobre los tipos consultados.
  - Revisa que el servidor responda JSON a `POST /graphql`.
- Animaciones no “suaves” en iOS o móvil:
  - ScrollSmoother se deshabilita en iOS y viewports <768px por diseño para evitar conflictos. Es esperado.
- Shortcode `{{odometer:...}}` no aparece:
  - Asegúrate de usar Markdown procesado por Astro y que el contenido del shortcode llegue sin escapar.

## Notas y convenciones

- No cambies los selectores: `#smooth-wrapper`, `#smooth-content`, `#intro-overlay`, `#grain-layer`, `#tagReveal` sin actualizar los scripts correspondientes.
- Importa `gsap` exclusivamente desde `src/scripts/main` en componentes animados.
- Si renombras assets gestionados por `astro:assets`, actualiza los imports en el layout.
- El `PageNavigation` se oculta en mobile por CSS global (consulta `MainLayout.astro`).

## Licencia

TODO: Declarar una licencia para este repositorio
