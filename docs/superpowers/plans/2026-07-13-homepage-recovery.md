# Homepage Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recuperar la portada al estado inmediatamente anterior al commit `8a6ca740f9bb1fb2b0a6923bfdd18366f2a5ac5c`, conservando sin cambios la sección de proyecto destacado.

**Architecture:** La recuperación se limita a los archivos modificados por el último commit que pertenecen exclusivamente a la ruta `/`: la página, su layout exclusivo y la inicialización de Momentos. Los componentes compartidos con páginas interiores permanecen en su versión actual para no deshacer `/about`, `/impact` ni `/projects`; `src/components/index/Projects.astro` queda expresamente excluido.

**Tech Stack:** Astro 5, TypeScript, Tailwind CSS 4 y GSAP 3.

## Global Constraints

- Usar `HEAD^` como única fuente del estado anterior.
- Mantener intacto `src/components/index/Projects.astro` y sus dependencias actuales.
- No modificar cambios locales ajenos; el árbol de trabajo estaba limpio antes de iniciar.
- No imprimir ni copiar `STRAPI_TOKEN`.
- No crear commits ni cambiar de rama.

---

### Task 1: Restore the homepage composition

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/layouts/MainLayout.astro`

**Interfaces:**
- Consumes: componentes existentes de portada, datos remotos de Strapi y `src/components/index/Projects.astro` actual.
- Produces: ruta `/` con la composición y el layout de `HEAD^`, manteniendo `<Projects />` conectado al componente destacado actual.

- [ ] **Step 1: Restore `src/pages/index.astro` from the parent commit**

Aplicar el contenido de `git show HEAD^:src/pages/index.astro` sin alterar la importación ni el render de `Projects.astro`.

- [ ] **Step 2: Restore the homepage-only layout**

Aplicar el contenido de `git show HEAD^:src/layouts/MainLayout.astro`; no restaurar `PageLayout.astro`, Navbar, Footer ni estilos globales porque son compartidos con las páginas interiores.

- [ ] **Step 3: Confirm the featured project exclusion**

Run: `git diff --exit-code HEAD -- src/components/index/Projects.astro`

Expected: salida vacía y código de salida `0`.

### Task 2: Restore Moments behavior and verify the recovery

**Files:**
- Modify: `src/components/index/momentsInit.ts`
- Test: `src/pages/index.astro`

**Interfaces:**
- Consumes: GSAP, Draggable e InertiaPlugin registrados en `src/scripts/main.ts`.
- Produces: comportamiento de Momentos equivalente a `HEAD^` y una portada compilable.

- [ ] **Step 1: Restore the two GSAP defaults changed by the last commit**

En `horizontalLoop`, volver a usar `repeat: config.repeat` y `paused: config.paused` como en `HEAD^`.

- [ ] **Step 2: Review the scoped diff**

Run: `git diff -- src/pages/index.astro src/layouts/MainLayout.astro src/components/index/momentsInit.ts src/components/index/Projects.astro`

Expected: los tres primeros archivos revierten los cambios del último commit y `Projects.astro` no presenta diferencias locales.

- [ ] **Step 3: Run Astro validation**

Run: `pnpm exec astro check`

Expected: cero errores introducidos por la recuperación.

- [ ] **Step 4: Build all public routes**

Run: `pnpm run build`

Expected: build exitoso con `/`, `/about`, `/impact` y `/projects` generadas.

- [ ] **Step 5: Inspect repository status**

Run: `git status --short`

Expected: solo aparecen el plan y los tres archivos restaurados; `src/components/index/Projects.astro` permanece limpio.
