/* ──────────────────────────────────────────────────────────────────────────
   El fondo de la portada, calculado en la GPU.

   Por qué existe: la versión en CSS (ver BubbleBackground.astro) se apoya en
   `filter: url(#bubble-goo)`, y un filtro SVG referenciado lo rasteriza
   Chrome por CPU, a pantalla completa y en cada cuadro. Aquí lo pinta un
   shader en un <canvas>, que es trabajo para el hardware hecho para esto.

   Se comporta como el de CSS —manchas de color que derivan despacio sobre el
   degradado violeta-azul y una que sigue al cursor con muelle— pero no lo
   copia: está hecho como se hacen hoy estos fondos (el «mesh gradient»),
   que se ve mejor y cuesta menos.

   - Una sola pasada. Cada mancha es una gaussiana analítica: nace suave, así
     que no hace falta desenfocar nada después. Siete exponenciales por píxel
     y ningún bucle.
   - Las manchas del ambiente se mezclan una sobre otra con `mix`, como en un
     degradado de malla: colores limpios, sin el velo gris del hard-light.
   - Siguen órbitas de Lissajous DENTRO del cuadro. Las del CSS giraban
     alrededor de puntos a 400 y 800 px del centro y pasaban la mayor parte
     del tiempo fuera de pantalla; por eso aquel fondo se veía casi plano.
   - La del cursor es una metabola: cuatro lóbulos que giran a ritmos distintos
     y se funden con un umbral suave. Borde definido, silueta que cambia sin
     repetirse y, sobre todo, UNA sola forma: con lóbulos sueltos se leían
     como dos manchas persiguiendo el ratón.
   - Un grano de un bit de amplitud quita las bandas que un degradado de 8
     bits dibuja en pantallas grandes.

   Coste: a un píxel de lienzo por píxel CSS (con un tope de 1,2 millones de
   píxeles para pantallas enormes) y a 30 cuadros por segundo mientras nadie
   mueve el ratón —la deriva es lenta y no se nota—; a 60 cuando se le sigue.

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

float gauss(vec2 p, vec2 c, float r) {
    vec2 d = (p - c) / r;
    return exp(-dot(d, d));
}

float grano(vec2 q) {
    return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 p = vec2(gl_FragCoord.x, uTam.y * uEscala - gl_FragCoord.y) / uEscala;
    vec2 m = uTam * 0.5;
    float corto = min(uTam.x, uTam.y);
    float medio = 0.5 * (uTam.x + uTam.y);
    float T = uT;

    // Degradado base, 'to bottom right' como el de CSS.
    vec2 dir = normalize(vec2(uTam.y, uTam.x));
    float largo = 2.0 * uTam.x * uTam.y / length(uTam);
    vec3 col = mix(uBaseA, uBaseB, clamp(0.5 + dot(p - m, dir) / largo, 0.0, 1.0));

    // Manchas del ambiente: órbitas de Lissajous lentas, siempre a la vista.
    vec2 c2 = m + uTam * vec2(0.32 * sin(T * 0.21),        0.26 * cos(T * 0.17));
    vec2 c3 = m + uTam * vec2(0.30 * cos(T * 0.13 + 1.3), 0.30 * sin(T * 0.19 + 0.4));
    vec2 c4 = m + uTam * vec2(0.24 * sin(T * 0.16 + 2.1), 0.22 * sin(T * 0.14 + 2.7));
    vec2 c5 = m + uTam * vec2(0.34 * cos(T * 0.11 + 4.0), 0.28 * cos(T * 0.23 + 1.1));

    col = mix(col, uC5, 0.55 * gauss(p, c5, medio * 0.46));
    col = mix(col, uC3, 0.50 * gauss(p, c3, medio * 0.36));
    col = mix(col, uC2, 0.60 * gauss(p, c2, medio * 0.34));
    col = mix(col, uC4, 0.55 * gauss(p, c4, medio * 0.28));

    // La del cursor: metabola de cuatro lóbulos.
    if (uPunteroOn > 0.5) {
        vec2 c = m + uPuntero;
        float r = corto * 0.12;
        float a = T * 0.5;
        /* Cada lóbulo recorre una elipse propia, con frecuencias distintas en
           x y en y: la silueta nunca vuelve a ser la misma, y los lóbulos van
           lo bastante lejos del centro como para que el contorno se abolle. */
        vec2 o1 = vec2(cos(a),               sin(a * 1.10))        * r * 0.75;
        vec2 o2 = vec2(cos(a * 1.37 + 2.1),  sin(a * 1.21 + 2.1))  * r * 0.85;
        vec2 o3 = vec2(cos(-a * 0.83 + 4.2), sin(-a * 0.91 + 4.2)) * r * 0.70;
        vec2 o4 = vec2(cos(a * 0.61 + 1.0),  sin(-a * 0.73 + 5.0)) * r * 0.95;
        float f = gauss(p, c + o1, r) + gauss(p, c + o2, r * 0.82)
                + gauss(p, c + o3, r * 0.70) + gauss(p, c + o4, r * 0.55);

        /* Volumen: más clara hacia arriba a la izquierda, como una gota con
           luz. Sin esto se leía como un disco plano. */
        vec2 d = (p - c) / (r * 2.2);
        float luz = clamp(0.5 - 0.5 * (d.x + d.y), 0.0, 1.0);
        vec3 cuerpo = mix(uC6, vec3(1.0), 0.06 + 0.24 * luz);

        col = mix(col, uC6, 0.34 * smoothstep(0.0, 0.7, f));      // halo
        col = mix(col, cuerpo, 0.86 * smoothstep(0.46, 0.8, f)); // cuerpo, borde definido
    }

    col += (grano(gl_FragCoord.xy + fract(T)) - 0.5) / 255.0;
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

    const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
    const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
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
       reiniciada) se retira el lienzo y reaparecen las capas de CSS. */
    const alPerderContexto = (e: Event) => {
        e.preventDefault();
        correr(false);
        ro.disconnect();
        delete raiz.dataset.gl;
        raiz.dataset.cssFondo = "1";
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
