# Batucada Popular Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear una ruta dedicada a Batucada Popular que traduzca su identidad gráfica y presente su propósito, metodología y presencia territorial con contenido verificable.

**Architecture:** La ruta se implementará como una página Astro estática dentro del sistema existente. Reutilizará `PageLayout.astro` para conservar navegación, pie, scroll y metadatos, añadiendo una opción compatible para omitir únicamente el hero genérico en esta ruta. Los activos visuales serán locales, procesados por `astro:assets` y derivados de los PDFs y SVG entregados por el usuario.

**Tech Stack:** Astro 5, Tailwind CSS 4, CSS aislado en Astro, `astro:assets`, TypeScript estricto.

## Global Constraints

- Conservar el diseño y API pública de los componentes existentes.
- Todo contenido principal debe estar visible sin depender de JavaScript.
- Respetar `prefers-reduced-motion`, foco visible, textos alternativos y enlaces reales.
- No introducir cifras no confirmadas; usar 13 territorios y 2020 según el PDF entregado.
- No exponer `STRAPI_TOKEN` ni copiar `.env`.

---

### Task 1: Identidad y activos

**Files:**
- Create: `docs/batucada-popular/brand-spec.md`
- Create: `docs/batucada-popular/product-facts.md`
- Create: `src/assets/batucada-popular/logo-batucada-popular.svg`
- Create: `src/assets/batucada-popular/comunidad.webp`
- Create: `src/assets/batucada-popular/marcha.webp`

**Interfaces:**
- Consumes: PDFs y SVG entregados por el usuario.
- Produces: activos locales importables desde Astro y tokens de marca documentados.

- [ ] **Step 1: Documentar hechos y fuentes**

Registrar nombre, inicio en 2020, presencia en 13 territorios, metodología DAARR y enfoque de derechos, indicando qué PDF respalda cada dato.

- [ ] **Step 2: Documentar el sistema visual**

Definir `--bp-orange: #f5a508`, `--bp-black: #080808`, `--bp-cream: #f6eee7`, uso del logo nuevo, textura impresa, tipografía condensada y fotografía documental.

- [ ] **Step 3: Preparar activos web**

Copiar el logo nuevo sin redibujarlo y convertir las fotografías seleccionadas a WebP con nombres semánticos.

- [ ] **Step 4: Verificar activos**

Run: `magick identify src/assets/batucada-popular/*`

Expected: imágenes legibles, sin dimensiones cero ni errores de decodificación.

### Task 2: Integración del layout

**Files:**
- Modify: `src/layouts/PageLayout.astro`

**Interfaces:**
- Consumes: prop opcional `showHero?: boolean`.
- Produces: comportamiento actual por defecto y capacidad de hero propio para la nueva ruta.

- [ ] **Step 1: Añadir prop compatible**

Agregar `showHero?: boolean` y asignar `true` por defecto.

- [ ] **Step 2: Condicionar el hero existente**

Renderizar `<Hero text={title} />` únicamente cuando `showHero` sea verdadero, sin alterar las rutas existentes.

- [ ] **Step 3: Validar tipos**

Run: `pnpm exec astro check`

Expected: cero errores nuevos en `PageLayout.astro`.

### Task 3: Página editorial de Batucada Popular

**Files:**
- Create: `src/pages/batucada-popular.astro`

**Interfaces:**
- Consumes: `PageLayout`, logo y fotografías locales.
- Produces: ruta estática `/batucada-popular/`.

- [ ] **Step 1: Construir hero de marca**

Crear un hero negro/naranja con logo real, fotografía protagonista, etiqueta `Guayaquil · Desde 2020`, titular y enlace a la historia.

- [ ] **Step 2: Construir narrativa**

Añadir secciones de propósito, percusión transformadora, metodología DAARR, acción comunitaria y enfoque de derechos usando exclusivamente texto del PDF.

- [ ] **Step 3: Construir cierre accionable**

Añadir CTA de colaboración y enlace a Instagram con foco visible y etiquetas accesibles.

- [ ] **Step 4: Resolver responsive y reducción de movimiento**

Usar grids que colapsen a una columna, tamaños fluidos, objetivos táctiles de 44 px y desactivar animaciones con `prefers-reduced-motion`.

### Task 4: Validación integral

**Files:**
- Test: `src/pages/batucada-popular.astro`

**Interfaces:**
- Consumes: ruta terminada.
- Produces: evidencia de build y revisión visual.

- [ ] **Step 1: Ejecutar revisión Astro**

Run: `pnpm exec astro check`

Expected: sin errores introducidos por la nueva página.

- [ ] **Step 2: Ejecutar build**

Run: `pnpm run build`

Expected: `/batucada-popular/index.html` y las rutas existentes generadas.

- [ ] **Step 3: Revisar en navegador**

Abrir `/batucada-popular/` en 1440x900 y 390x844; comprobar consola, navegación, enlaces, pie y ausencia de scroll horizontal.

- [ ] **Step 4: Revisar movimiento reducido**

Emular `prefers-reduced-motion: reduce` y confirmar que todo el contenido permanece visible y usable.

