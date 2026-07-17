# Leaflet and GSAP Console Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Execute this plan task-by-task in the current session; repository instructions prohibit unrequested subagent delegation.

**Goal:** Eliminate the Leaflet `Outdated Optimize Dep` failure and GSAP missing-target warnings without changing the approved visual design.

**Architecture:** Keep map initialization viewport-aware while making Leaflet a statically discovered page dependency, so Vite resolves it when the page module loads instead of through a stale late import. Keep the homepage intro API compatible, but return before any GSAP calls when its DOM shell is absent on interior pages.

**Tech Stack:** Astro 5, TypeScript, Vite, GSAP 3, Leaflet 1.9.

## Global Constraints

- Preserve existing routes, components, assets, visual composition, and public APIs.
- Keep initial HTML content visible and respect `prefers-reduced-motion`.
- Do not print or modify Strapi credentials.
- Preserve unrelated local changes.

---

### Task 1: Guard the homepage intro outside its DOM shell

**Files:**
- Modify: `src/scripts/index/intro.ts`

**Interfaces:**
- Consumes: `showContentNoIntro(opts?)` calls from `PageLayout.astro`.
- Produces: The same `showContentNoIntro(opts?): void` API, with a safe early return outside the homepage.

- [x] **Step 1: Add a DOM-shell guard**

Add this at the start of `showContentNoIntro`, before querying animation targets:

```ts
const hasIntroShell = Boolean(document.getElementById("app-content") || document.getElementById("intro-overlay") || document.querySelector(".bg__container, .bg__container__logo"));
if (!hasIntroShell) return;
```

- [x] **Step 2: Run the Astro type checker**

Run: `pnpm exec astro check`

Expected: no new errors in `src/scripts/index/intro.ts`.

### Task 2: Make Leaflet module resolution deterministic

**Files:**
- Modify: `src/scripts/batucada/map.ts`

**Interfaces:**
- Consumes: Leaflet's default ESM export and the existing `#bp-map` element.
- Produces: The unchanged `initBatucadaMap(): void` and `SECTORS` exports.

- [x] **Step 1: Replace the deferred module import with a static module import**

Use:

```ts
import L from "leaflet";
import "leaflet/dist/leaflet.css";
```

Then make `boot` synchronous and remove:

```ts
const L = (await import("leaflet")).default;
```

This leaves map and tile creation behind the existing `IntersectionObserver` while allowing Vite to discover Leaflet when it builds the page module.

- [x] **Step 2: Run the Astro type checker**

Run: `pnpm exec astro check`

Expected: no new errors in `src/scripts/batucada/map.ts`.

### Task 3: Verify production and browser behavior

**Files:**
- Verify: `/`, `/about`, `/impact`, `/projects`, `/projects/batucada-popular/`

**Interfaces:**
- Consumes: the built Astro site and browser console.
- Produces: a build with all routes and no reported GSAP missing-target or Leaflet dynamic-import errors.

- [x] **Step 1: Build the static site**

Run: `pnpm run build`

Expected: successful generation of the existing routes, including the Batucada project route.

- [x] **Step 2: Start the development server and inspect the affected page**

Run: `pnpm run dev`

Expected: `/projects/batucada-popular/` loads its map when approaching the section; interior pages do not log GSAP missing-target warnings.

- [x] **Step 3: Review the final diff**

Run: `git diff -- src/scripts/index/intro.ts src/scripts/batucada/map.ts`

Expected: only the DOM guard and Leaflet import strategy change; no design or content changes.
