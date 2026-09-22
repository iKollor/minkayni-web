/* ──────────────────────────────────────────────────────────────────────────
   El fondo de la portada, calculado en la GPU.

   Por qué existe: la versión en CSS (ver BubbleBackground.astro) se apoya en
   `filter: url(#bubble-goo)`, y un filtro SVG referenciado lo rasteriza
   Chrome por CPU, a pantalla completa y en cada cuadro. Medido con la CPU
   frenada: 7 cuadros por segundo. Aquí lo mismo sale de un `<canvas>` con un
   shader, que es trabajo para el hardware que existe justamente para esto.

   No es un fondo nuevo ni un componente de galería: es el MISMO fondo,
   rehecho. Cada mancha conserva su centro, su radio, su color, su opacidad y
   su órbita, leídos de la hoja de estilos de al lado. Lo que cambia es quién
   hace la cuenta.

   Cómo se traduce cada pieza:
   - Los `radial-gradient(circle at center, rgba(c,0.8) 0%, rgba(c,0) 50%)`
     son, en el shader, una caída lineal desde el centro hasta el radio donde
     la parada del 50% deja la opacidad en cero. El radio del gradiente CSS es
     el de «esquina más lejana», de ahí la media diagonal.
   - Las órbitas son rotaciones alrededor de un origen que CSS declara con
     `transform-origin`, en píxeles respecto al contenedor.
   - `mix-blend-mode: hard-light` entre manchas se calcula tal y como lo
     define la especificación de composición, incluido el peso por la opacidad
     de lo que ya hay debajo.
   - El filtro «goo» no es un desenfoque: es un umbral de opacidad (×18 −8).
     Como después venía un `blur(40px)` que lo suavizaba todo, aquí el umbral
     se aplica con un `smoothstep`, cuyos dos bordes están ajustados
     numéricamente contra capturas de la versión CSS.

   Degradación: si no hay WebGL, si el contexto se pierde o si el equipo pide
   menos movimiento, esto no se monta y manda el CSS de siempre. El fondo
   nunca depende de que esto funcione.
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
    /** Posición del puntero respecto al centro, en píxeles CSS. */
    puntero: (x: number, y: number) => void;
    destruir: () => void;
};

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

/* Todo el trabajo va en el fragmento. Las cuentas se hacen en píxeles CSS
   para poder copiar los valores de la hoja de estilos sin convertir nada. */
const FRAG = `
precision highp float;

uniform vec2  uTam;        // contenedor en píxeles CSS
uniform float uEscala;     // píxeles de lienzo por píxel CSS
uniform float uT;          // segundos desde el arranque
uniform vec2  uPuntero;    // desplazamiento del puntero desde el centro
uniform float uPunteroOn;  // 1 si la capa interactiva existe
uniform vec3  uC2, uC3, uC4, uC5, uC6;   // colores de las manchas (0..1)
uniform vec3  uBaseA, uBaseB;            // degradado de fondo
uniform vec2  uUmbral;     // bordes del smoothstep que sustituye al goo
uniform float uGanancia;   // recupera la intensidad que ponía la matriz
uniform float uRadio;      // ensancha las manchas como hacía el blur(40px)
uniform float uAlfa;       // diluye como hacía el blur(40px)
uniform float uDesenfoque; // radio del muestreo que sustituye al blur(40px)

const float TAU = 6.283185307;

vec2 girar(vec2 punto, vec2 origen, float ang) {
    float s = sin(ang), c = cos(ang);
    vec2 d = punto - origen;
    return origen + vec2(d.x * c - d.y * s, d.x * s + d.y * c);
}

/* hard-light tal y como lo define la especificación de composición. */
vec3 hardLight(vec3 fondo, vec3 capa) {
    vec3 doble = capa * 2.0;
    vec3 multiplicar = fondo * doble;
    vec3 trama = 1.0 - 2.0 * (1.0 - fondo) * (1.0 - capa);
    return mix(multiplicar, trama, step(vec3(0.5), capa));
}

/* Compone una mancha sobre lo acumulado: mezcla hard-light ponderada por la
   opacidad de debajo, y luego «source-over». Se lleva premultiplicado. */
void componer(inout vec3 pre, inout float acum, vec3 color, float alfa) {
    if (alfa <= 0.0) return;
    vec3 debajo = acum > 0.0 ? pre / acum : vec3(0.0);
    vec3 mezcla = mix(color, hardLight(debajo, color), acum);
    pre = mezcla * alfa + pre * (1.0 - alfa);
    acum = alfa + acum * (1.0 - alfa);
}

/* La caída de un 'radial-gradient(circle at ..., rgba(c,a) 0%, rgba(c,0) f%)':
   lineal desde el centro hasta 'f' por el radio de esquina más lejana. */
float caida(vec2 p, vec2 centro, float radio, float alfa) {
    /* El perfil no es el del CSS a secas: el que se ve en pantalla ya ha
       pasado por un blur(40px), que lo ensancha y lo suaviza en los bordes.
       Un smoothstep sobre un radio algo mayor reproduce eso sin desenfocar
       nada, que es lo que costaba dinero. */
    float t = distance(p, centro) / (radio * uRadio);
    return alfa * uAlfa * (1.0 - smoothstep(0.0, 1.0, clamp(t, 0.0, 1.0)));
}

/* El campo de manchas en un punto: composición, umbral incluido. Se llama
   varias veces por píxel (ver main), así que aquí no hay nada superfluo. */
void campo(vec2 p, out vec3 pre, out float alfa) {
    vec2 mitad = uTam * 0.5;
    float r80 = 0.5 * length(vec2(uTam.x * 0.4, uTam.y * 0.4)) * uRadio;
    float r160 = 0.5 * length(vec2(uTam.x * 0.8, uTam.y * 0.8)) * uRadio;

    pre = vec3(0.0);
    float acum = 0.0;

    vec2 cs = girar(mitad, vec2(mitad.x - 400.0, mitad.y), TAU * fract(uT / 20.0));
    componer(pre, acum, uC2, caida(p, cs, r80, 0.8));

    vec2 c3 = vec2(uTam.x * 0.9 - 500.0, uTam.y * 0.9 + 200.0);
    c3 = girar(c3, vec2(mitad.x + 400.0, mitad.y), TAU * fract(uT / 40.0));
    componer(pre, acum, uC3, caida(p, c3, r80, 0.8));

    vec2 c4 = vec2(mitad.x - 50.0 * cos(TAU * fract(uT / 40.0)), mitad.y);
    componer(pre, acum, uC4, caida(p, c4, r80, 0.8 * 0.7));

    vec2 c5 = girar(mitad, vec2(mitad.x - 800.0, mitad.y + 200.0), TAU * fract(uT / 20.0));
    componer(pre, acum, uC5, caida(p, c5, r160, 0.8));

    if (uPunteroOn > 0.5) {
        vec2 caja = uTam * 1.5;
        vec2 centro = mitad + uPuntero;
        float ang = TAU * fract(uT / 24.0);
        vec2 esc = vec2(1.0 + 0.12 * sin(ang), 1.0 - 0.10 * sin(ang));
        float rc = 0.5 * length(caja) * uRadio;
        vec2 q = p - centro;
        float sa = sin(-ang), ca = cos(-ang);
        q = vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca) / esc;
        componer(pre, acum, uC6, caida(q, (vec2(0.44, 0.40) - 0.5) * caja, rc * 0.46, 0.8 * 0.75));
        componer(pre, acum, uC6, caida(q, (vec2(0.63, 0.54) - 0.5) * caja, rc * 0.38, 0.62 * 0.75));
        componer(pre, acum, uC6, caida(q, (vec2(0.48, 0.64) - 0.5) * caja, rc * 0.35, 0.55 * 0.75));
    }

    /* El umbral de 'feColorMatrix': 18a - 8 recortado. Deja un núcleo opaco
       pequeño, y es el desenfoque de después el que lo convierte en halo. Se
       aplica con un smoothstep porque el blur(16) que iba delante ya llegaba
       aquí con el borde suavizado. */
    float goo = smoothstep(uUmbral.x, uUmbral.y, acum);
    alfa = clamp((acum + goo * (1.0 - acum)) * uAlfa, 0.0, 1.0);
    pre = acum > 0.0 ? (pre / acum) * alfa : vec3(0.0);
}

void main() {
    vec2 p = vec2(gl_FragCoord.x / uEscala, uTam.y - gl_FragCoord.y / uEscala);

    /* El 'blur(40px)' de la versión CSS, hecho a la manera barata: en vez de
       desenfocar una textura, se evalúa el campo —que es analítico— en trece
       puntos repartidos en dos anillos y se promedia con pesos gaussianos.
       Son unas cuantas distancias más por píxel, que para una GPU no es nada,
       y evita las pasadas de desenfoque que son lo que cuesta.

       Trece muestras bastan porque el campo ya es suave: lo único con borde
       duro es el umbral, y para eso están los dos anillos. */
    const int TAPS = 13;
    vec2 desvios[TAPS];
    float pesos[TAPS];
    desvios[0] = vec2(0.0);                                     pesos[0] = 0.24;
    float r1 = uDesenfoque * 0.62, r2 = uDesenfoque * 1.35;
    for (int i = 0; i < 6; i++) {
        float a = TAU * float(i) / 6.0;
        desvios[1 + i] = vec2(cos(a), sin(a)) * r1;             pesos[1 + i] = 0.0933;
        float a2 = a + TAU / 12.0;
        desvios[7 + i] = vec2(cos(a2), sin(a2)) * r2;           pesos[7 + i] = 0.0328;
    }

    vec3 pre = vec3(0.0);
    float alfa = 0.0;
    for (int i = 0; i < TAPS; i++) {
        vec3 pp; float aa;
        campo(p + desvios[i], pp, aa);
        pre += pp * pesos[i];
        alfa += aa * pesos[i];
    }

    vec3 color = alfa > 0.0 ? (pre / alfa) * uGanancia : vec3(0.0);

    /* Degradado base: 'to bottom right' proyecta sobre (alto, ancho). */
    vec2 mitad = uTam * 0.5;
    vec2 dir = normalize(vec2(uTam.y, uTam.x));
    float largo = 2.0 * uTam.x * uTam.y / length(uTam);
    float t = clamp(0.5 + dot(p - mitad, dir) / largo, 0.0, 1.0);
    vec3 base = mix(uBaseA, uBaseB, t);

    gl_FragColor = vec4(mix(base, color, clamp(alfa, 0.0, 1.0)), 1.0);
}
`;

/* Ajustados contra capturas de la versión CSS con las animaciones congeladas
   en el mismo segundo: no son gusto de nadie, son el resultado de minimizar
   el error de color entre los dos fondos. Ver el guion de ajuste. */
export const AJUSTE = { umbral: [0.3, 0.75] as [number, number], ganancia: 1, radio: 0.8, alfa: 0.8, desenfoque: 100 };

const compilar = (gl: WebGLRenderingContext, tipo: number, fuente: string): WebGLShader | null => {
    const sh = gl.createShader(tipo);
    if (!sh) return null;
    gl.shaderSource(sh, fuente);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
    }
    return sh;
};

/** "18,113,255" → [0.07, 0.44, 1.0] */
const aVec3 = (crudo: string): [number, number, number] => {
    const n = crudo.split(",").map((x) => parseFloat(x.trim()) / 255);
    return [n[0] || 0, n[1] || 0, n[2] || 0];
};

export function iniciarFondoGL(raiz: HTMLElement, colores: ColoresFondo, interactivo: boolean): FondoGL | null {
    const lienzo = document.createElement("canvas");
    lienzo.className = "bubble-bg__gl";
    lienzo.setAttribute("aria-hidden", "true");
    /* En línea, no en la hoja del componente: los estilos de Astro llevan un
       atributo de ámbito que solo tiene el marcado escrito en el .astro, y un
       elemento creado aquí no lo tiene. Sin esto el lienzo se queda en el
       flujo y empuja hacia abajo el logotipo de la portada. */
    lienzo.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%";

    const gl = (lienzo.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" }) ||
        lienzo.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return null;

    /* Si no hay GPU de verdad, esto es una trampa: el shader lo acabaría
       calculando la CPU píxel a píxel, y sale más caro que el filtro que
       veníamos a sustituir. Medido en una máquina sin GPU: 5 cuadros por
       segundo con el shader frente a 9,6 con el CSS. Mejor no montarlo y
       dejar que siga el camino de siempre, con su sonda. */
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const pintor = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || "") : "";
    if (/swiftshader|llvmpipe|software|basic render/i.test(pintor)) return null;

    const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
    const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    if (!prog) return null;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uTam = u("uTam"), uT = u("uT"), uPuntero = u("uPuntero"), uEscala = u("uEscala");

    gl.uniform3fv(u("uC2"), aVec3(colores.second));
    gl.uniform3fv(u("uC3"), aVec3(colores.third));
    gl.uniform3fv(u("uC4"), aVec3(colores.fourth));
    gl.uniform3fv(u("uC5"), aVec3(colores.fifth));
    gl.uniform3fv(u("uC6"), aVec3(colores.sixth));
    /* El degradado de `.bubble-bg`, ya resuelto a sRGB: oklch(0.38 0.19 294)
       y oklch(0.38 0.14 259), que es lo que pinta el navegador. */
    gl.uniform3fv(u("uBaseA"), [78 / 255, 22 / 255, 154 / 255]);
    gl.uniform3fv(u("uBaseB"), [6 / 255, 61 / 255, 139 / 255]);
    gl.uniform1f(u("uPunteroOn"), interactivo ? 1 : 0);
    /* Ajustados contra capturas de la versión CSS (ver el ensayo en pruebas). */
    gl.uniform2fv(u("uUmbral"), AJUSTE.umbral);
    gl.uniform1f(u("uGanancia"), AJUSTE.ganancia);
    gl.uniform1f(u("uRadio"), AJUSTE.radio);
    gl.uniform1f(u("uAlfa"), AJUSTE.alfa);
    gl.uniform1f(u("uDesenfoque"), AJUSTE.desenfoque);

    /* Un fondo desenfocado no necesita la densidad de la pantalla —ni
       siquiera uno por uno—. A la mitad, el navegador calcula la cuarta parte
       de los píxeles y el resultado no se distingue: lo que se está pintando
       ya venía de un desenfoque de 40 px. Es la mitad del ahorro. */
    const ESCALA = 0.5;
    let ancho = 0;
    let alto = 0;

    const medir = () => {
        const r = raiz.getBoundingClientRect();
        const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
        if (w === ancho && h === alto) return;
        ancho = w; alto = h;
        lienzo.width = Math.max(1, Math.round(w * ESCALA));
        lienzo.height = Math.max(1, Math.round(h * ESCALA));
        gl.viewport(0, 0, lienzo.width, lienzo.height);
        /* El tamaño va en píxeles CSS: las órbitas están escritas en esas
           unidades (400px, 800px…) copiadas de la hoja de estilos, y tienen
           que significar lo mismo pinte el lienzo a la resolución que pinte. */
        gl.uniform2f(uTam, w, h);
        gl.uniform1f(uEscala, ESCALA);
    };

    const ro = new ResizeObserver(medir);
    ro.observe(raiz);
    medir();

    raiz.insertBefore(lienzo, raiz.firstChild);
    raiz.dataset.gl = "1";

    let bucle = 0;
    let ajusteAplicado = "";
    let t0 = performance.now();
    let pausadoEn = 0;

    const dibujar = (ahora: number) => {
        /* `data-gl-tiempo` congela el reloj del fondo en un segundo concreto.
           Existe para poder comparar este fondo con el de CSS en el mismo
           instante —que es la única forma de comprobar que se parecen— y no
           lo escribe nadie en producción. */
        const fijo = raiz.dataset.glTiempo;
        gl.uniform1f(uT, fijo !== undefined ? parseFloat(fijo) || 0 : (ahora - t0) / 1000);

        /* `data-gl-ajuste` reescribe los parámetros de forma en caliente. Es
           la otra mitad del aparejo de calibración: los valores de AJUSTE se
           obtienen comparando este fondo con el de CSS DENTRO de la página,
           porque encima de los dos hay una capa de grano que los aclara por
           igual y que en un banco aparte no existiría. Tampoco lo escribe
           nadie en producción. */
        const crudo = raiz.dataset.glAjuste;
        if (crudo && crudo !== ajusteAplicado) {
            ajusteAplicado = crudo;
            try {
                const a = JSON.parse(crudo) as typeof AJUSTE;
                gl.uniform2fv(u("uUmbral"), a.umbral);
                gl.uniform1f(u("uGanancia"), a.ganancia);
                gl.uniform1f(u("uRadio"), a.radio);
                gl.uniform1f(u("uAlfa"), a.alfa);
                gl.uniform1f(u("uDesenfoque"), a.desenfoque);
            } catch {
                /* Ajuste mal escrito: se queda el de siempre. */
            }
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        bucle = requestAnimationFrame(dibujar);
    };

    const correr = (activo: boolean) => {
        if (activo && !bucle) {
            /* Se descuenta lo que estuvo parado: al volver, las manchas
               siguen donde estaban y no dan un salto. */
            if (pausadoEn) t0 += performance.now() - pausadoEn;
            pausadoEn = 0;
            bucle = requestAnimationFrame(dibujar);
        } else if (!activo && bucle) {
            cancelAnimationFrame(bucle);
            bucle = 0;
            pausadoEn = performance.now();
        }
    };

    /* Si el navegador se queda sin contexto (pestañas de más, GPU ocupada) se
       retira el lienzo y reaparece el fondo CSS: nadie se queda sin fondo. */
    const alPerderContexto = (e: Event) => {
        e.preventDefault();
        correr(false);
        delete raiz.dataset.gl;
        lienzo.remove();
    };
    lienzo.addEventListener("webglcontextlost", alPerderContexto);

    correr(true);

    return {
        correr,
        puntero: (x, y) => gl.uniform2f(uPuntero, x, y),
        destruir: () => {
            correr(false);
            ro.disconnect();
            lienzo.removeEventListener("webglcontextlost", alPerderContexto);
            delete raiz.dataset.gl;
            lienzo.remove();
        },
    };
}
