import assert from "node:assert/strict";
import test from "node:test";
import { countUpValue } from "../src/scripts/odometer-curve";

test("empieza en 0 y termina exactamente en la cifra", () => {
  assert.equal(countUpValue(0, 300, 3000), 0);
  assert.equal(countUpValue(3000, 300, 3000), 300);
  assert.equal(countUpValue(9999, 300, 3000), 300);
});

test("sigue el easeOutExpo de countUp: casi todo el recorrido en el primer tercio", () => {
  const v = countUpValue(1000, 300, 3000);
  assert.ok(v > 270 && v < 300, `a 1 s va en ${v}`);
});

test("nunca retrocede", () => {
  for (const end of [12, 300, 1200]) {
    let prev = 0;
    for (let ms = 0; ms <= 3000; ms += 16) {
      const v = countUpValue(ms, end, 3000);
      assert.ok(v >= prev, `${end}: retrocede en ${ms} ms`);
      prev = v;
    }
  }
});

test("por encima de 999 aplica el smart easing: lineal hasta 333 antes del final a mitad de tiempo", () => {
  assert.equal(countUpValue(750, 1200, 3000), Math.round(867 / 2));
  assert.equal(countUpValue(1500, 1200, 3000), 867);
  assert.equal(countUpValue(3000, 1200, 3000), 1200);
});
