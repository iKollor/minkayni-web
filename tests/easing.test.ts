import assert from "node:assert/strict";
import test from "node:test";
import { apple, appleOut, cubicBezier } from "../src/scripts/easing";

test("las curvas empiezan en 0 y acaban en 1", () => {
  for (const ease of [apple, appleOut]) {
    assert.equal(ease(0), 0);
    assert.equal(ease(1), 1);
  }
});

test("la curva estándar de Apple es simétrica", () => {
  assert.ok(Math.abs(apple(0.5) - 0.5) < 1e-4);
  assert.ok(Math.abs(apple(0.25) + apple(0.75) - 1) < 1e-4);
});

test("la curva de entrada arranca rápido: a mitad de tiempo va muy por delante", () => {
  assert.ok(appleOut(0.5) > 0.8);
});

test("las curvas son monótonas: nada retrocede ni salta", () => {
  for (const ease of [apple, appleOut]) {
    let prev = 0;
    for (let i = 1; i <= 200; i++) {
      const v = ease(i / 200);
      assert.ok(v >= prev - 1e-9, `retrocede en t=${i / 200}`);
      assert.ok(v - prev < 0.05, `salta en t=${i / 200}`);
      prev = v;
    }
  }
});

test("una cúbica lineal devuelve la identidad", () => {
  const linear = cubicBezier([0, 0, 1, 1]);
  for (const t of [0.1, 0.33, 0.5, 0.9]) assert.ok(Math.abs(linear(t) - t) < 1e-5);
});
