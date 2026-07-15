# Strapi Read-only Token Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Astro use the configured read-only Strapi token reliably without allowing a transient preflight failure to disable every content loader.

**Architecture:** Move the connection probe into a focused utility that performs an authenticated content query, retries transient failures, and redacts credentials from diagnostics. In content configuration, use the probe only for strict CI mode; otherwise enable each loader whenever configuration exists and let its existing isolated error handling preserve cached content.

**Tech Stack:** Astro 5, TypeScript, Strapi GraphQL/REST, Node test runner via `tsx`.

## Global Constraints

- Never print, copy, or commit `STRAPI_TOKEN`.
- Keep initial HTML and cached content usable when Strapi or one loader fails.
- Use `pnpm`; do not create another lockfile.
- Preserve the existing visual UI and public component APIs.

---

### Task 1: Authenticated Strapi connection probe

**Files:**
- Create: `src/utils/strapi-connection.ts`
- Create: `tests/strapi-connection.test.ts`

**Interfaces:**
- Consumes: Strapi GraphQL endpoint, token, timeout/retry options, injectable `fetch`.
- Produces: `validateStrapiConnection(options): Promise<ValidateResult>`.

- [ ] **Step 1: Write failing tests**

Cover authorization header delivery, rejection of GraphQL authorization errors, retry after HTTP 503, and token redaction from returned diagnostics.

- [ ] **Step 2: Run the focused test**

Run: `pnpm exec tsx --test tests/strapi-connection.test.ts`

Expected: FAIL because `src/utils/strapi-connection.ts` does not exist.

- [ ] **Step 3: Implement the minimal probe**

Send a small authenticated `posts` query, apply a per-attempt timeout, retry only transient HTTP/network failures, parse JSON defensively, and redact the token from all messages.

- [ ] **Step 4: Run the focused test again**

Run: `pnpm exec tsx --test tests/strapi-connection.test.ts`

Expected: all connection-probe tests pass.

### Task 2: Decouple content loaders from transient preflight failures

**Files:**
- Modify: `src/content/config.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `validateStrapiConnection` from Task 1 and `STRAPI_STRICT`.
- Produces: independent loader activation based on valid endpoint/token configuration.

- [ ] **Step 1: Replace the inline `__typename` probe**

Import the tested utility and run it only when `STRAPI_STRICT=true`; throw on missing configuration or a failed authenticated probe in that mode.

- [ ] **Step 2: Enable loaders independently in normal mode**

Use GraphQL loaders whenever endpoint and token exist. Keep navigation isolated so its plugin-specific `403` cannot disable GraphQL collections.

- [ ] **Step 3: Add the test script**

Add `test:strapi` using `tsx --test tests/strapi-connection.test.ts`.

- [ ] **Step 4: Validate the repository**

Run: `pnpm run test:strapi`, `pnpm exec astro check`, and `pnpm run build`.

Expected: tests and Astro checks pass; `/`, `/about`, `/impact`, and `/projects` build successfully; GraphQL loaders sync independently of navigation.
