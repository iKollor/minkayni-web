## Guía para agentes AI en este repositorio

Proyecto: sitio estático con Astro v5, React 19, GSAP 3 y TailwindCSS v4. Trabaja en `src/` y `public/`.

### Arquitectura y flujo clave
- Páginas: `src/pages/` (rutas por archivo). Layout global: `src/layouts/MainLayout.astro`.
- `MainLayout.astro` crea una capa de grano fija (`#grain-layer`) y envuelve el contenido en `#smooth-wrapper > #smooth-content`; incluye `/src/scripts/main.ts` al final del `<body>`.
- Animaciones: `src/scripts/main.ts` registra plugins GSAP (ScrollSmoother/ScrollTrigger/otros), aplica guard `window.__SMOOTH_CREATED__`, fuerza `overflow-x: hidden` y espera a que desaparezcan `#intro-overlay` y `html.no-scroll` antes de crear el smoother (fallback a 8s).
- Componentes animados (p. ej. `src/components/index/Tag.astro`) importan `gsap` desde `../../scripts/main` para reutilizar plugins y usan `data-initialized` para evitar doble init; respetan `prefers-reduced-motion`.

### Datos y contenido (Strapi GraphQL + Zod)
- Config de contenido: `src/content/config.ts` toma `STRAPI_URL` y `STRAPI_TOKEN` de `import.meta.env`, construye headers y valida la conexión (`validateStrapiConnection()`); si falla, se aborta el build.
- Loader: `src/utils/loaders/strapi-loader.ts` hace introspección GraphQL, genera selección mínima, pagina (hasta `MAX_PAGES`) y “bundlea” i18n por documento en `_i18n` con `_defaultLocale`. Modos `single` y `collection`; filtra por `PUBLISHED` cuando corresponde.
- Esquemas Zod generados en `srcschemas/strapi.graphql.zod.ts`. Refresca con:
  ```powershell
  pnpm run zod:gen
  # o
  pnpm run zod:gen:lazy
  ```

### Markdown/HTML post-procesado
- `astro.config.ts` integra React, `astro-icon` y `@astropub/md` con `rehype-modular` (`src/utils/rehype-modular`).
- Shortcode ejemplo: `{{odometer:150}}` → `<span id="odometer"><span class="current">150</span></span>`.
- Reglas `<a>`: añade `anchor-fx`; externos con `target="_blank" rel="noopener noreferrer"`; internos sin `target/rel`.

### Estilos y utilidades
- Tailwind v4 vía `@tailwindcss/vite`. CSS global en `src/styles/global.css`; SCSS puntual en `src/styles/Hamburguer.scss` (sass-embedded).
- Usa `astro:assets` para imágenes/favicons (ver `MainLayout.astro`). Si renombras assets, actualiza imports.

### Workflows de desarrollo
- Gestor: pnpm (ver `packageManager` en `package.json`). Comandos:
  ```powershell
  pnpm install
  pnpm run dev
  pnpm run build
  pnpm run preview
  ```
- Define `.env` con `STRAPI_URL` y `STRAPI_TOKEN` antes de `dev/build` para pasar la validación en `content/config.ts`.

### Convenciones y gotchas
- No cambies estos selectores sin actualizar scripts: `#smooth-wrapper`, `#smooth-content`, `#intro-overlay`, `#grain-layer`, `#tagReveal`.
- Al añadir animaciones: importa `gsap` desde `scripts/main`, marca `data-initialized`, respeta `prefers-reduced-motion` y estado final estable.
- `PageNavigation` existe pero se oculta en mobile por CSS global en `MainLayout.astro`.

¿Algo poco claro o incompleto? Pide ampliar (p. ej., codegen Zod, i18n en el loader o timing de ScrollSmoother) y lo ajustamos.
