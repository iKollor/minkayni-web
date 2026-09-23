/* ──────────────────────────────────────────────────────────────────────────
   El fondo de la portada, calculado en la GPU.

   Por qué existe: la versión en CSS (ver BubbleBackground.astro) se apoya en
   `filter: url(#bubble-goo)`, y un filtro SVG referenciado lo rasteriza
   Chrome por CPU, a pantalla completa y en cada cuadro. Aquí lo pinta un
   shader en un <canvas>.

   Se comporta como el de CSS, pieza a pieza: las mismas cuatro manchas con
   sus mismas órbitas, periodos, tamaños y opacidades, el vaivén de la cuarta,
   la del cursor con su caja del 150%, sus tres gradientes descentrados y su
   deformación en tres tramos, y el mismo umbral «goo» que las funde. Lo que
   cambia es quién hace la cuenta y cómo:

   - Una sola pasada, sin desenfocar nada: el blur(40px) del CSS se sustituye
     por un umbral suave cuyo ancho se mide en píxeles con fwidth, así que el
     borde es igual de blando en una mancha grande que en una pequeña.
   - Los ejes de giro del CSS están en píxeles de escritorio; en pantallas de
     menos de 1200 px se acortan en proporción para que las manchas no pasen
     casi todo el tiempo fuera del cuadro. En escritorio el recorrido es el
     mismo.
   - Un grano de un bit quita las bandas del degradado en pantallas grandes.

   Coste: un píxel de lienzo por píxel CSS (con tope de 1,2 millones de
   píxeles), a 30 cuadros por segundo mientras la mancha del cursor solo
   deriva y a 60 cuando se la mueve.

   Degradación: si no hay WebGL, si pinta por software, si el contexto se
   pierde o si el equipo pide menos movimiento, esto no se monta y manda el
   CSS de siempre. El fondo nunca depende de que esto funcione.
─────────────────────────────────────────────────────────────────────────── */

export type ColoresFondo = {
    second: string;
    third: string;
    fourth: string;
    fifth: string;
    sixth: string;
};

export type FondoGL = {
    /** Arranca o para el bucle (lo usa el IntersectionObserver del componente). */
    correr: (activo: boolean) => void;
    /** Posición de la mancha del cursor respecto al centro, en píxeles CSS. */
    puntero: (x: number, y: number) => void;
    destruir: () => void;
};

const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}";

const FRAG = `
precision highp float;

uniform vec2  uTam;        // contenedor, en píxeles CSS
uniform float uEscala;     // píxeles de lienzo por píxel CSS
uniform float uT;          // segundos
uniform vec2  uPuntero;    // mancha del cursor, desde el centro
uniform float uPunteroOn;
uniform vec3  uC2, uC3, uC4, uC5, uC6, uBaseA, uBaseB;

const float TAU = 6.2831853;

vec2 girar(vec2 q, vec2 o, float a) {
    float s = sin(a), c = cos(a);
    vec2 d = q - o;
    return o + vec2(d.x * c - d.y * s, d.x * s + d.y * c);
}

// hard-light, como el mix-blend-mode de las manchas en CSS
vec3 hardLight(vec3 b, vec3 s) {
    return mix(b * 2.0 * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(vec3(0.5), s));
}

void componer(inout vec3 pre, inout float acum, vec3 col, float a) {
    if (a <= 0.0) return;
    vec3 debajo = acum > 0.0 ? pre / acum : vec3(0.0);
    vec3 mezcla = mix(col, hardLight(debajo, col), acum);
    pre = mezcla * a + pre * (1.0 - a);
    acum = a + acum * (1.0 - a);
}

// radial-gradient(circle, rgba(c,a) 0%, rgba(c,0) r). La caída del CSS es
// lineal y acaba en seco en r; allí el blur(40px) tapaba el codo, pero sin él
// se ve un arco nítido. Con smoothstep llega a cero sin codo.
float caida(vec2 p, vec2 c, float r, float a) {
    return a * (1.0 - smoothstep(0.0, 1.0, distance(p, c) / r));
}

float grano(vec2 q) {
    return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453);
}

// ease-in-out de CSS, para los tramos de la deformación
float suave(float u) { return u * u * (3.0 - 2.0 * u); }

void main() {
    vec2 p = vec2(gl_FragCoord.x, uTam.y * uEscala - gl_FragCoord.y) / uEscala;
    vec2 m = uTam * 0.5;

    /* Los ejes de giro del CSS están en píxeles fijos (400, 500, 800) pensados
       para una pantalla de escritorio. En un teléfono mandaban las manchas
       fuera del cuadro casi todo el tiempo; por debajo de 1200 px de ancho se
       acortan en proporción. En escritorio es el mismo recorrido. */
    float k = min(1.0, uTam.x / 1200.0);

    // Radios: la parada del 50% del radio de esquina más lejana de cada caja.
    float r80 = 0.5 * length(0.4 * uTam);
    float r160 = 0.5 * length(0.8 * uTam);

    float t20 = TAU * fract(uT / 20.0);
    float t40 = TAU * fract(uT / 40.0);

    vec3 pre = vec3(0.0);
    float A = 0.0;

    // second: gira 20 s alrededor de (50% - 400px, 50%)
    componer(pre, A, uC2, caida(p, girar(m, m + vec2(-400.0, 0.0) * k, t20), r80, 0.8));

    // third: nace en (90% - 500px, 90% + 200px) y gira 40 s alrededor de (50% + 400px, 50%)
    vec2 c3 = vec2(uTam.x * 0.9 - 500.0 * k, uTam.y * 0.9 + 200.0 * k);
    componer(pre, A, uC3, caida(p, girar(c3, m + vec2(400.0, 0.0) * k, t40), r80, 0.8));

    // fourth: vaivén de ±50 px en 40 s, opacidad 0.7
    componer(pre, A, uC4, caida(p, m + vec2(-50.0 * cos(t40), 0.0), r80, 0.8 * 0.7));

    // fifth: caja del 160%, gira 20 s alrededor de (50% - 800px, 50% + 200px)
    componer(pre, A, uC5, caida(p, girar(m, m + vec2(-800.0, 200.0) * k, t20), r160, 0.8));

    // La del cursor: caja del 150%, tres gradientes descentrados, rotación y
    // escala en tres tramos de 8 s como los keyframes de bubble-morph.
    if (uPunteroOn > 0.5) {
        vec2 caja = uTam * 1.5;
        vec2 c = m + uPuntero;
        float f = fract(uT / 24.0) * 3.0;
        float tramo = floor(f);
        float e = suave(fract(f));
        float ang = TAU / 3.0 * (tramo + e);
        vec2 e0 = tramo < 0.5 ? vec2(1.0, 1.0) : (tramo < 1.5 ? vec2(1.12, 0.90) : vec2(0.92, 1.14));
        vec2 e1 = tramo < 0.5 ? vec2(1.12, 0.90) : (tramo < 1.5 ? vec2(0.92, 1.14) : vec2(1.0, 1.0));
        vec2 esc = mix(e0, e1, e);

        vec2 q = girar(p - c, vec2(0.0), -ang) / esc;

        vec3 lpre = vec3(0.0);
        float la = 0.0;
        for (int i = 0; i < 3; i++) {
            vec2 rel = i == 0 ? vec2(0.44, 0.40) : (i == 1 ? vec2(0.63, 0.54) : vec2(0.48, 0.64));
            float parada = i == 0 ? 0.46 : (i == 1 ? 0.38 : 0.35);
            float alfa = i == 0 ? 0.8 : (i == 1 ? 0.62 : 0.55);
            vec2 cg = (rel - 0.5) * caja;
            vec2 lejos = max(abs(cg + caja * 0.5), abs(cg - caja * 0.5));
            float a = caida(q, cg, length(lejos) * parada, alfa);
            lpre += uC6 * a * (1.0 - la);   // fondos apilados, sin mezcla
            la = a + la * (1.0 - la);
        }
        if (la > 0.0) componer(pre, A, lpre / la, la * 0.75);
    }

    /* El filtro goo: umbral de opacidad (18a - 8 recorta entre 0.44 y 0.5).
       Lo suaviza lo mismo que suavizaba el blur(40px) de después, y el propio
       gradiente se sigue viendo por encima como halo (feBlend source-over). */
    #ifdef CON_DERIVADAS
        /* Ancho del borde en píxeles de verdad: el blur(40px) del CSS difumina
           lo mismo una mancha grande que una pequeña. fwidth dice cuánto cambia
           la opacidad por píxel de lienzo; se abre la transición ~45 px CSS. */
        float w = clamp(fwidth(A) * 45.0 * uEscala, 0.02, 0.3);
        float goo = smoothstep(0.46 - w, 0.46 + w, A);
    #else
        float goo = smoothstep(0.38, 0.54, A);
    #endif
    float alfa = A + goo * (1.0 - A);
    vec3 color = A > 0.0 ? pre / A : vec3(0.0);

    // Degradado base, 'to bottom right'.
    vec2 dir = normalize(vec2(uTam.y, uTam.x));
    float largo = 2.0 * uTam.x * uTam.y / length(uTam);
    vec3 base = mix(uBaseA, uBaseB, clamp(0.5 + dot(p - m, dir) / largo, 0.0, 1.0));

    vec3 col = mix(base, color, clamp(alfa, 0.0, 1.0));
    col += (grano(gl_FragCoord.xy + fract(uT)) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
}

`;

const compilar = (gl: WebGLRenderingContext, tipo: number, fuente: string): WebGLShader | null => {
    const sh = gl.createShader(tipo);
    if (!sh) return null;
    gl.shaderSource(sh, fuente);
    gl.compileShader(sh);
    if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
    gl.deleteShader(sh);
    return null;
};

/** "18,113,255" → [0.07, 0.44, 1.0] */
const aVec3 = (crudo: string): number[] => crudo.split(",").map((x) => (parseFloat(x) || 0) / 255);

/** Tope de píxeles del lienzo: en pantallas enormes se pinta menos y se estira. */
const MAX_PIXELES = 1_200_000;
/** Cuadros entre dibujos cuando nadie mueve el ratón: 30 por segundo. */
const INTERVALO_REPOSO_MS = 32;
/** Por encima de esto por cuadro, la mancha del cursor se está moviendo de verdad. */
const MOVIMIENTO_PX = 1.5;

export function iniciarFondoGL(raiz: HTMLElement, colores: ColoresFondo, interactivo: boolean): FondoGL | null {
    const lienzo = document.createElement("canvas");
    lienzo.className = "bubble-bg__gl";
    lienzo.setAttribute("aria-hidden", "true");
    /* En línea, no en la hoja del componente: los estilos de Astro llevan un
       atributo de ámbito que un elemento creado aquí no tiene. */
    lienzo.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%;opacity:0;transition:opacity 280ms ease-out";

    const gl = lienzo.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
    });
    if (!gl) return null;

    /* Sin GPU de verdad, el shader lo calcularía la CPU píxel a píxel: no se
       monta y sigue el camino de CSS, con su propia sonda. */
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const pintor = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || "") : "";
    if (/swiftshader|llvmpipe|software|basic render/i.test(pintor)) return null;

    /* Las derivadas (fwidth) dan el borde en píxeles reales; están en casi
       todos los navegadores, pero si faltan se usa un borde fijo. */
    const derivadas = gl.getExtension("OES_standard_derivatives");
    const cabecera = derivadas ? "#extension GL_OES_standard_derivatives : enable\n#define CON_DERIVADAS\n" : "";
    const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
    const fs = compilar(gl, gl.FRAGMENT_SHADER, cabecera + FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return null;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    /* Un triángulo que cubre toda la pantalla: un vértice menos que un
       cuadrado y sin la diagonal que el rasterizador tendría que coser. */
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uTam = u("uTam");
    const uEscala = u("uEscala");
    const uT = u("uT");
    const uPuntero = u("uPuntero");

    gl.uniform3fv(u("uC2"), aVec3(colores.second));
    gl.uniform3fv(u("uC3"), aVec3(colores.third));
    gl.uniform3fv(u("uC4"), aVec3(colores.fourth));
    gl.uniform3fv(u("uC5"), aVec3(colores.fifth));
    gl.uniform3fv(u("uC6"), aVec3(colores.sixth));
    /* El degradado de `.bubble-bg` resuelto a sRGB: oklch(0.38 0.19 294) y
       oklch(0.38 0.14 259), que es lo que pinta el navegador. */
    gl.uniform3fv(u("uBaseA"), [78 / 255, 22 / 255, 154 / 255]);
    gl.uniform3fv(u("uBaseB"), [6 / 255, 61 / 255, 139 / 255]);
    gl.uniform1f(u("uPunteroOn"), interactivo ? 1 : 0);

    let ancho = 0;
    let alto = 0;
    const medir = () => {
        const r = raiz.getBoundingClientRect();
        const w = Math.max(1, Math.round(r.width));
        const h = Math.max(1, Math.round(r.height));
        if (w === ancho && h === alto) return;
        ancho = w;
        alto = h;
        const escala = Math.min(1, Math.sqrt(MAX_PIXELES / (w * h)));
        lienzo.width = Math.max(1, Math.round(w * escala));
        lienzo.height = Math.max(1, Math.round(h * escala));
        gl.viewport(0, 0, lienzo.width, lienzo.height);
        gl.uniform2f(uTam, w, h);
        gl.uniform1f(uEscala, lienzo.width / w);
        dibujarYa = true;
    };
    const ro = new ResizeObserver(medir);

    let bucle = 0;
    let t0 = performance.now();
    let pausadoEn = 0;
    let ultimoDibujo = 0;
    let dibujarYa = true;
    let px = 0;
    let py = 0;
    let movido = 0;

    const pintar = (ahora: number) => {
        gl.uniform1f(uT, (ahora - t0) / 1000);
        gl.uniform2f(uPuntero, px, py);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        ultimoDibujo = ahora;
        movido = 0;
        dibujarYa = false;
    };

    const cuadro = (ahora: number) => {
        bucle = requestAnimationFrame(cuadro);
        /* A 60 si la mancha del cursor se mueve de verdad; a 30 si solo deriva. */
        if (dibujarYa || movido > MOVIMIENTO_PX || ahora - ultimoDibujo >= INTERVALO_REPOSO_MS) pintar(ahora);
    };

    const correr = (activo: boolean) => {
        if (activo && !bucle) {
            /* Se descuenta lo que estuvo parado: al volver las manchas siguen
               donde estaban, sin salto. */
            if (pausadoEn) t0 += performance.now() - pausadoEn;
            pausadoEn = 0;
            bucle = requestAnimationFrame(cuadro);
        } else if (!activo && bucle) {
            cancelAnimationFrame(bucle);
            bucle = 0;
            pausadoEn = performance.now();
        }
    };

    /* Si el navegador se queda sin contexto (demasiadas pestañas, GPU
       reiniciada) se retira el lienzo y queda el fotograma estático. */
    const alPerderContexto = (e: Event) => {
        e.preventDefault();
        correr(false);
        ro.disconnect();
        delete raiz.dataset.gl;
        raiz.dataset.bubbleStatic = "1";
        lienzo.remove();
    };
    lienzo.addEventListener("webglcontextlost", alPerderContexto);

    medir();
    /* El primer cuadro se pinta ANTES de meter el lienzo en la página: así
       nunca se ve un lienzo vacío entre el fondo de CSS y el del shader. */
    pintar(performance.now());
    raiz.insertBefore(lienzo, raiz.firstChild);
    raiz.dataset.gl = "1";
    /* Entra con un fundido corto sobre el degradado base, que es lo único
       que se ve mientras tanto: el fondo «termina de asentarse» en vez de
       cambiar de golpe. */
    requestAnimationFrame(() => (lienzo.style.opacity = "1"));
    ro.observe(raiz);
    correr(true);

    return {
        correr,
        puntero: (x, y) => {
            movido += Math.abs(x - px) + Math.abs(y - py);
            px = x;
            py = y;
        },
        destruir: () => {
            correr(false);
            ro.disconnect();
            lienzo.removeEventListener("webglcontextlost", alPerderContexto);
            delete raiz.dataset.gl;
            lienzo.remove();
        },
    };
}
