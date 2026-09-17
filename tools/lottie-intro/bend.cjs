// Réplica de CC Bend It: la flexión se hornea como keyframes de trazado, fotograma a fotograma.
// Convención del efecto: con Start abajo y End arriba, Bend positivo dobla hacia la derecha.
const DEG_PER_BEND = 1.8; // Bend 100 = 180° de arco entre Start y End
const SIGN = 1;           // -1 invierte el lado hacia el que dobla

// ---- evaluación de propiedades Lottie ------------------------------------
function cubicBezierEase(x1, y1, x2, y2, x) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 40; i++) {
    t = (lo + hi) / 2;
    const bx = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
    if (bx < x) lo = t; else hi = t;
  }
  return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
}
const first = v => (Array.isArray(v) ? v[0] : v);
const lerp = (a, b, p) => a + (b - a) * p;
function lerpShape(a, b, p) {
  const mix = (A, B) => A.map((pt, i) => [lerp(pt[0], B[i][0], p), lerp(pt[1], B[i][1], p)]);
  return { c: a.c, v: mix(a.v, b.v), i: mix(a.i, b.i), o: mix(a.o, b.o) };
}
function evalProp(prop, f) {
  if (!prop) return null;
  if (!prop.a && !(Array.isArray(prop.k) && prop.k[0] && prop.k[0].t !== undefined)) return prop.k;
  const ks = prop.k;
  const val = k => (k.s[0] && k.s[0].v ? k.s[0] : k.s);
  if (f <= ks[0].t) return val(ks[0]);
  let last = ks.length - 1;
  while (last > 0 && ks[last].s === undefined) last--;
  if (f >= ks[ks.length - 1].t) return val(ks[last]);
  let n = 0;
  while (ks[n + 1].t <= f) n++;
  const k0 = ks[n], k1 = ks[n + 1];
  const a = val(k0), b = k1.s !== undefined ? val(k1) : (k0.e ? (k0.e[0] && k0.e[0].v ? k0.e[0] : k0.e) : a);
  if (k0.h) return a;
  const lin = (f - k0.t) / (k1.t - k0.t);
  const p = k0.o && k0.i ? cubicBezierEase(first(k0.o.x), first(k0.o.y), first(k0.i.x), first(k0.i.y), lin) : lin;
  if (a.v) return lerpShape(a, b, p);
  return a.map((x, i) => lerp(x, b[i], p));
}

// ---- matrices 2D [a b c d e f] --------------------------------------------
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const apply = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
function inv(m) {
  const det = m[0] * m[3] - m[1] * m[2];
  return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det];
}
function trsMatrix(ks, f) {
  const p = evalProp(ks.p, f) || [0, 0], a = evalProp(ks.a, f) || [0, 0], s = evalProp(ks.s, f) || [100, 100];
  const r = first(evalProp(ks.r || ks.rz, f) || 0) * Math.PI / 180;
  const c = Math.cos(r), sn = Math.sin(r), sx = s[0] / 100, sy = s[1] / 100;
  return mul([c * sx, sn * sx, -sn * sy, c * sy, p[0], p[1]], [1, 0, 0, 1, -a[0], -a[1]]);
}
function layerMatrix(layer, layers, f) {
  let m = trsMatrix(layer.ks, f);
  if (layer.parent) m = mul(layerMatrix(layers.find(l => l.ind === layer.parent), layers, f), m);
  return m;
}

// ---- la flexión ------------------------------------------------------------
function bendPoint(pt, start, end, bend, prestart) {
  const theta = SIGN * bend * DEG_PER_BEND * Math.PI / 180;
  if (Math.abs(theta) < 1e-7) return pt;
  const ax = end[0] - start[0], ay = end[1] - start[1], L = Math.hypot(ax, ay);
  const u = [ax / L, ay / L], n = [-u[1], u[0]];
  const dx = pt[0] - start[0], dy = pt[1] - start[1];
  const a = dx * u[0] + dy * u[1], b = dx * n[0] + dy * n[1];
  if (a < 0 && prestart !== 3) return pt; // Render Prestart = Static
  const k = theta / L, phi = k * a, sp = Math.sin(phi), cp = Math.cos(phi);
  const U = sp / k - b * sp, N = (1 - cp) / k + b * cp;
  return [start[0] + u[0] * U + n[0] * N, start[1] + u[1] * U + n[1] * N];
}

// ---- trazados --------------------------------------------------------------
function ellipseToShape(el) {
  const s = el.s.k, p = el.p.k, rx = s[0] / 2, ry = s[1] / 2, kx = rx * 0.5523, ky = ry * 0.5523;
  return {
    c: true,
    v: [[p[0], p[1] - ry], [p[0] + rx, p[1]], [p[0], p[1] + ry], [p[0] - rx, p[1]]],
    i: [[-kx, 0], [0, -ky], [kx, 0], [0, ky]],
    o: [[kx, 0], [0, ky], [-kx, 0], [0, -ky]],
  };
}
// cada tramo se parte en dos cúbicas para que una recta pueda curvarse
function toSegments(sh) {
  const n = sh.v.length, segs = [], count = sh.c ? n : n - 1;
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % n, p0 = sh.v[i], p3 = sh.v[j];
    let p1 = [p0[0] + sh.o[i][0], p0[1] + sh.o[i][1]], p2 = [p3[0] + sh.i[j][0], p3[1] + sh.i[j][1]];
    if (!sh.o[i][0] && !sh.o[i][1] && !sh.i[j][0] && !sh.i[j][1]) {
      p1 = [lerp(p0[0], p3[0], 1 / 3), lerp(p0[1], p3[1], 1 / 3)]; p2 = [lerp(p0[0], p3[0], 2 / 3), lerp(p0[1], p3[1], 2 / 3)];
    }
    const mid = (A, B) => [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const a = mid(p0, p1), b = mid(p1, p2), c = mid(p2, p3), d = mid(a, b), e = mid(b, c), m = mid(d, e);
    segs.push([p0, a, d, m], [m, e, c, p3]);
  }
  return segs;
}
function fromSegments(segs, closed) {
  const v = [], i = [], o = [];
  segs.forEach((s, n) => {
    v.push(s[0]); o.push([s[1][0] - s[0][0], s[1][1] - s[0][1]]);
    const prev = n > 0 ? segs[n - 1] : (closed ? segs[segs.length - 1] : null);
    i.push(prev ? [prev[2][0] - s[0][0], prev[2][1] - s[0][1]] : [0, 0]);
  });
  if (!closed) {
    const s = segs[segs.length - 1];
    v.push(s[3]); i.push([s[2][0] - s[3][0], s[2][1] - s[3][1]]); o.push([0, 0]);
  }
  const r = pts => pts.map(p => [+p[0].toFixed(3), +p[1].toFixed(3)]);
  return { c: closed, v: r(v), i: r(i), o: r(o) };
}

/**
 * Hornea en la capa de formas `layer` las flexiones `bends` para los fotogramas [from, to].
 * Cada flexión: { toSpace(f) -> matriz del espacio de la capa de formas al espacio del efecto,
 *                 params(f) -> {start, end, bend, prestart} }
 */
function bakeBends(layer, bends, from, to) {
  for (const group of layer.shapes.filter(s => s.ty === 'gr')) {
    const tr = group.it.find(s => s.ty === 'tr');
    const G = trsMatrix(tr, 0);
    group.it.forEach((item, idx) => {
      if (item.ty !== 'sh' && item.ty !== 'el') return;
      const source = item.ty === 'el' ? { a: 0, k: ellipseToShape(item) } : item.ks;
      const keys = [];
      for (let f = from; f <= to; f++) {
        const shape = evalProp(source, f);
        let segs = toSegments(shape);
        for (const b of bends) {
          const P = b.params(f);
          if (Math.abs(P.bend) < 1e-4) continue;
          const M = mul(b.toSpace(f), G), Mi = inv(M);
          segs = segs.map(s => s.map(p => apply(Mi, bendPoint(apply(M, p), P.start, P.end, P.bend, P.prestart))));
        }
        keys.push({ t: f, s: [fromSegments(segs, shape.c)], i: { x: 1, y: 1 }, o: { x: 0, y: 0 } });
      }
      // colapsa los tramos sin cambio para no inflar el archivo
      const slim = keys.filter((k, n) => n === 0 || n === keys.length - 1 ||
        JSON.stringify(k.s) !== JSON.stringify(keys[n - 1].s) || JSON.stringify(k.s) !== JSON.stringify(keys[n + 1].s));
      group.it[idx] = { ty: 'sh', ind: item.ind || 0, ix: item.ix || 1, nm: item.nm, mn: item.mn, hd: false, ks: { a: 1, k: slim } };
    });
  }
}

module.exports = { evalProp, layerMatrix, mul, bakeBends };
