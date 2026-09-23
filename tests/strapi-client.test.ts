import assert from "node:assert/strict";
import test from "node:test";
import { strapiFetch } from "../src/utils/strapi-client";

const url = "https://cms.example.test/graphql";

test("reintenta un fallo de red y devuelve el intento que sí respondió", async () => {
  let calls = 0;
  const res = await strapiFetch(url, {
    timeoutMs: 1000,
    maxAttempts: 2,
    retryDelayMs: 0,
    fetchImpl: async () => {
      calls++;
      if (calls === 1) throw new TypeError("fetch failed");
      return new Response("{}", { status: 200 });
    },
  });
  assert.equal(res.ok, true);
  assert.equal(res.attempts, 2);
});

test("no reintenta un 401: repetir no arregla un token inválido", async () => {
  let calls = 0;
  const res = await strapiFetch(url, {
    timeoutMs: 1000,
    maxAttempts: 3,
    retryDelayMs: 0,
    fetchImpl: async () => {
      calls++;
      return new Response("Unauthorized", { status: 401 });
    },
  });
  assert.equal(res.ok, false);
  assert.equal(res.status, 401);
  assert.equal(calls, 1);
});

test("el error final nunca incluye el token", async () => {
  const secret = "super-secret-token";
  await assert.rejects(
    strapiFetch(url, {
      timeoutMs: 1000,
      secret,
      fetchImpl: async () => {
        throw new Error(`connect refused with ${secret}`);
      },
    }),
    (error: Error) => !error.message.includes(secret) && error.message.includes("[REDACTED]")
  );
});

test("un tiempo agotado se informa como timeout", async () => {
  await assert.rejects(
    strapiFetch(url, {
      timeoutMs: 10,
      fetchImpl: (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    }),
    /Timeout después de 10ms/
  );
});
