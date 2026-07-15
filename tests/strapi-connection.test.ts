import assert from "node:assert/strict";
import test from "node:test";
import { validateStrapiConnection } from "../src/utils/strapi-connection";

const endpoint = "https://cms.example.test/graphql";

test("probes protected content with the bearer token", async () => {
  const token = "read-only-token";
  let authorization = "";
  let requestBody = "";

  const result = await validateStrapiConnection({
    endpoint,
    token,
    fetchImpl: async (_input, init) => {
      authorization = new Headers(init?.headers).get("Authorization") ?? "";
      requestBody = String(init?.body ?? "");
      return Response.json({ data: { posts: [] } });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(authorization, `Bearer ${token}`);
  assert.match(requestBody, /posts/);
});

test("rejects GraphQL authorization errors and redacts the token", async () => {
  const token = "sensitive-read-only-token";
  const result = await validateStrapiConnection({
    endpoint,
    token,
    fetchImpl: async () =>
      Response.json({ errors: [{ message: `Forbidden ${token}` }] }),
  });

  assert.equal(result.ok, false);
  assert.match(result.message ?? "", /\[REDACTED\]/);
  assert.doesNotMatch(result.message ?? "", new RegExp(token));
});

test("retries a transient 503 response", async () => {
  let attempts = 0;
  const result = await validateStrapiConnection({
    endpoint,
    token: "read-only-token",
    maxAttempts: 2,
    retryDelayMs: 0,
    fetchImpl: async () => {
      attempts++;
      if (attempts === 1)
        return new Response("Service unavailable", { status: 503 });
      return Response.json({ data: { posts: [] } });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.attempts, 2);
  assert.equal(attempts, 2);
});

test("fails before fetching when configuration is incomplete", async () => {
  let called = false;
  const result = await validateStrapiConnection({
    endpoint: "",
    token: "",
    fetchImpl: async () => {
      called = true;
      return Response.json({ data: { posts: [] } });
    },
  });

  assert.equal(result.ok, false);
  assert.equal(called, false);
  assert.match(result.message ?? "", /configuración/i);
});
