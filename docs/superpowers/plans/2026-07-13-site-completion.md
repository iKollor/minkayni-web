# Minkayni Site Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recuperar la sección Batucada, completar las rutas públicas pendientes y entregar un sitio uniforme, rápido y revisado visualmente.

**Architecture:** Se conservarán Astro, los layouts y los tokens visuales actuales. Las páginas interiores se compondrán con secciones Astro estáticas y datos locales tipados; JavaScript quedará limitado a filtros y animaciones progresivas que no controlen la visibilidad base.

**Tech Stack:** Astro 5, TypeScript, Tailwind CSS 4, React 19 para islas existentes y GSAP 3.

## Global Constraints

- Preservar todos los cambios locales existentes que no pertenezcan al alcance.
- Mantener al 100% las secciones visuales existentes; diseñar solamente lo que falte dentro de la paleta, tipografías y lenguaje de formas ya acordados.
- No eliminar componentes o prototipos existentes; optimizarlos conservando archivo y API.
- Priorizar Batucada, Proyectos, Impacto y Conócenos, en ese orden después de `AGENTS.md`.
- No dejar contenido provisional, enlaces vacíos ni secciones invisibles si JavaScript falla.
- Verificar las cuatro rutas en escritorio y móvil con el servidor de desarrollo activo.

---

### Task 1: Repository Guidance and Baseline

**Files:**
- Create: `AGENTS.md`
- Create: `docs/superpowers/plans/2026-07-13-site-completion.md`

**Interfaces:**
- Consumes: `package.json`, `README.md`, layouts, rutas y estilos existentes.
- Produces: reglas operativas y checklist de entrega para todas las tareas siguientes.

- [ ] **Step 1: Document architecture and visual invariants**

Escribir comandos, rutas, tokens, selectores críticos, reglas de animación progresiva y protección del trabajo local en `AGENTS.md`.

- [ ] **Step 2: Record the current baseline**

Run: `git status --short` y `pnpm exec astro check`

Expected: el estado local queda conocido; cualquier error previo se separa de los errores introducidos.

- [ ] **Step 3: Review the documentation**

Run: `rg -n "Lorem|TODO|opacity: 0|client:" AGENTS.md docs/superpowers/plans/2026-07-13-site-completion.md`

Expected: no hay contenido provisional en `AGENTS.md`; las menciones del plan son restricciones explícitas.

### Task 2: Visible and Resilient Batucada Feature

**Files:**
- Modify: `src/components/index/Projects.astro`

**Interfaces:**
- Consumes: `LOGO_BATUCADA_2025.svg`, `FOTO_BATUCADA.webp`, `Button.astro`, tokens globales y GSAP compartido.
- Produces: sección `#featured-project` visible sin JavaScript, responsive y enlazada a `/projects`.

- [ ] **Step 1: Remove hidden initial states**

Mantener panel, imagen, logo, título, texto y CTA visibles en el HTML/CSS inicial; eliminar `autoAlpha: 0` como requisito de render.

- [ ] **Step 2: Stabilize the responsive layout**

Construir una cuadrícula de foto/panel a dos columnas en escritorio y una composición apilada en móvil con altura basada en contenido, radios orgánicos y contraste AA.

- [ ] **Step 3: Add progressive motion only**

Usar un único `gsap.context` con guard de inicialización para animar únicamente desplazamiento/escala. En `prefers-reduced-motion`, no crear timeline.

- [ ] **Step 4: Verify the feature in isolation**

Run: `pnpm exec astro check`

Expected: la sección compila sin tipos `any` nuevos y el CTA apunta a una ruta existente.

### Task 3: Complete the Projects Route Without Removing Prototypes

**Files:**
- Modify: `src/pages/projects.astro`
- Create: `src/components/projects/ProjectExplorer.astro`
- Preserve and optimize: `src/components/projects/ProjectsPage.tsx`
- Preserve and optimize: `src/components/projects/Filters.tsx`
- Preserve and optimize: `src/components/projects/FilterToggleButton.tsx`

**Interfaces:**
- Consumes: recursos de Batucada, tokens globales y tipos Astro.
- Produces: catálogo accesible con `data-project-card`, filtros por botones y un fallback completamente visible sin JavaScript.

- [ ] **Step 1: Model the current programs**

Definir en la frontmatter un arreglo tipado con título, categoría, resumen, estado y CTA. Evitar cifras no documentadas.

- [ ] **Step 2: Render a complete static catalog**

Crear encabezado introductorio, proyecto destacado y tarjetas uniformes con jerarquía tipográfica, etiquetas y estados de foco.

- [ ] **Step 3: Add minimal client filtering**

Los botones `[data-project-filter]` alternan `hidden`, `aria-pressed` y un contador con `aria-live`. Si JavaScript no carga, todas las tarjetas permanecen visibles.

- [ ] **Step 4: Preserve and optimize the React prototype**

Mantener los tres prototipos disponibles, reducir trabajo redundante y conservar sus contratos para futuras iteraciones.

- [ ] **Step 5: Verify projects behavior**

Run: `pnpm exec astro check`

Expected: cero errores y filtros navegables por teclado.

### Task 4: Complete the Impact Route

**Files:**
- Modify: `src/pages/impact.astro`

**Interfaces:**
- Consumes: `PageLayout.astro`, `MaskFlor.astro`, recursos locales y tokens globales.
- Produces: `/impact` con propuesta, indicadores verificables, metodología, resultados y CTA.

- [ ] **Step 1: Replace provisional content**

Eliminar todas las cadenas `lorem`, títulos de prueba y CTAs sin destino. Escribir contenido en español basado únicamente en hechos presentes en el repositorio.

- [ ] **Step 2: Build a coherent section sequence**

Orden: introducción, indicadores, cuatro ejes de impacto, proceso de acompañamiento, evidencia/seguimiento y CTA final.

- [ ] **Step 3: Keep the page responsive and light**

Usar HTML Astro, CSS/Tailwind y una sola imagen optimizada; no hidratar React ni crear carruseles automáticos.

- [ ] **Step 4: Verify impact page**

Run: `pnpm exec astro check`

Expected: contenido completo, sin `Lorem`, `href="#"` ni overflow horizontal.

### Task 5: Complete the About Route

**Files:**
- Modify: `src/pages/about.astro`
- Modify: `src/components/TimeLine.astro`

**Interfaces:**
- Consumes: `PageLayout.astro`, recursos de prensa existentes y datos de hitos locales.
- Produces: `/about` con historia, propósito, principios, reconocimiento y timeline accesible.

- [ ] **Step 1: Replace placeholder history**

Convertir los bloques repetidos en arreglos tipados e iteraciones Astro con años y textos concisos basados en la historia ya presente.

- [ ] **Step 2: Refactor timeline semantics**

Cambiar `tittle` por `title`, usar botones reales para hitos, leer el `interval` recibido y no iniciar intervalos cuando no existan pasos o el usuario prefiera movimiento reducido.

- [ ] **Step 3: Add purpose and principles**

Crear secciones de misión/visión y principios con el mismo sistema de tarjetas y espaciado usado en Impacto/Proyectos.

- [ ] **Step 4: Verify about page**

Run: `pnpm exec astro check`

Expected: sin placeholders, imágenes con alt descriptivo y timeline usable con teclado.

### Task 6: Shared UI and Performance Cleanup Without Visual Changes

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/layouts/lib/head.astro`
- Modify: `src/layouts/MainLayout.astro`
- Modify: `src/layouts/PageLayout.astro`
- Modify: `src/components/Navbar.astro`

**Interfaces:**
- Consumes: layouts y tokens compartidos.
- Produces: metadatos correctos, idioma español, tipografías locales, grano reutilizable y navegación visible de forma progresiva.

- [ ] **Step 1: Remove unused remote fonts**

Eliminar imports de Google Fonts no necesarios y actualizar el fallback del menú a la familia local.

- [ ] **Step 2: Correct document metadata**

Usar `lang="es"`, descripción por defecto y color-scheme coherente con el diseño claro.

- [ ] **Step 3: Deduplicate shared grain markup**

Extraer la capa visual y su script a un componente único consumido por ambos layouts, preservando `#grain-layer`.

- [ ] **Step 4: Make navigation fail-safe**

Evitar que la barra dependa de una clase `hidden` permanente y limitar `will-change`/listeners globales.

- [ ] **Step 5: Scan for unfinished UI**

Run: `rg -n -i "lorem|TODO|placeholder|href=\"#\"|asfasf" src`

Expected: no quedan textos provisionales en rutas públicas ni CTAs vacíos.

### Task 7: Full Build and Browser QA

**Files:**
- Modify: solo archivos que requieran correcciones detectadas durante QA.

**Interfaces:**
- Consumes: las cuatro rutas completas.
- Produces: build estático y revisión visual documentada.

- [ ] **Step 1: Run automated checks**

Run: `pnpm exec astro check`

Expected: `0 errors`.

- [ ] **Step 2: Run production build**

Run: `pnpm run build`

Expected: se generan `/index.html`, `/about/index.html`, `/impact/index.html` y `/projects/index.html`.

- [ ] **Step 3: Start development server**

Run: `pnpm run dev -- --host 127.0.0.1`

Expected: servidor saludable con una URL local.

- [ ] **Step 4: Review desktop routes**

Abrir `/`, `/about`, `/impact` y `/projects` a 1440 px. Comprobar hero, navegación, todas las secciones, CTAs, footer, consola y scroll horizontal.

- [ ] **Step 5: Review mobile routes**

Repetir a 390 px. Comprobar apilado, tamaños táctiles, legibilidad, timeline/filtros y ausencia de contenido recortado.

- [ ] **Step 6: Final regression check**

Run: `pnpm run build`

Expected: build final exitoso después de las correcciones de QA.
