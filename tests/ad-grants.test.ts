/* Auditoría de la build contra la política de sitios web de Google Ad Grants.
 *
 * El 17 de septiembre de 2026 Google rechazó la activación de la cuenta con
 * tres reproches: que el sitio cargara más rápido, que se navegara con
 * facilidad y que tuviera contenido abundante y llamadas a la acción. Las
 * causas concretas eran medibles —620 KB de fuentes sin recortar, una página
 * de demostración indexada, canónicas que redirigían, un ítem del menú sin
 * destino— y por eso están aquí: para que ninguna vuelva a colarse sin que
 * salte una prueba.
 *
 * La segunda ronda (20 de septiembre) añadió lo que Lighthouse seguía
 * señalando: cuatro hojas de fuentes de Google bloqueando el primer pintado,
 * la portada y el menú escondidos en el HTML hasta que corría el script, un
 * WebP de 680 KB como `src` de respaldo, logotipos SVG de 300 KB y ninguna
 * página —salvo el 404— que enlazara a la de aportes.
 *
 * Se ejecuta sobre `dist/`, así que exige haber construido el sitio antes:
 *
 *     pnpm build && pnpm test
 *
 * Los presupuestos de peso van holgados respecto a lo que mide hoy la build.
 * No son una marca a batir: son el techo a partir del cual conviene mirar qué
 * se ha añadido. Si un cambio legítimo los supera, se sube el número y se
 * escribe por qué.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { moduleEntries, transitiveImports } from "../src/integrations/modulepreload";

const RAIZ = path.join(import.meta.dirname, "..");
const DIST = path.join(RAIZ, "dist");
const DOMINIO = "https://www.minkayni.org";

/* ------------------------------- Presupuestos ------------------------------ */

const KB = 1024;
/** HTML sin comprimir de una sola página. Se sirve con brotli (~4:1).
    Lleva dentro todo el CSS del sitio (unos 130 KB sin comprimir, ver
    `build.inlineStylesheets` en astro.config.ts), que es la mitad del techo.
    La que primero se acercará a él es /novedades, que crece una entrada por
    cada publicación nueva del CMS; cuando lo pase, la respuesta es
    paginarla, no subir el número. */
const MAX_HTML = 320 * KB;
/** Todas las fuentes de la build juntas. Sin recortar eran 1.222 KB. */
const MAX_FUENTES_TOTAL = 420 * KB;
/** Un peso suelto. Sin recortar, cada uno rondaba los 70 KB. */
const MAX_FUENTE = 30 * KB;
/** Todo el JavaScript emitido. No se carga entero en ninguna página, pero
    sirve de alarma cuando entra una dependencia pesada. */
const MAX_JS_TOTAL = 1100 * KB;

/** Mínimo de palabras visibles para que una página cuente como contenido. */
const MIN_PALABRAS = 300;

/* --------------------------------- Utilidades ------------------------------ */

const listar = (dir: string, filtro: (p: string) => boolean): string[] => {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const completo = path.join(dir, e.name);
        return e.isDirectory() ? listar(completo, filtro) : filtro(completo) ? [completo] : [];
    });
};

const relativo = (p: string) => path.relative(DIST, p).split(path.sep).join("/");

const leer = (p: string) => fs.readFileSync(p, "utf8");

/** Quita `<script>` y `<style>`: su contenido no es ni texto ni marcado. */
const sinCodigo = (html: string) => html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");

const paginas = () => listar(DIST, (p) => p.endsWith(".html"));

/** Las páginas que Astro emite por cada `redirects`: no son contenido. */
const esRedireccion = (html: string) => /<meta\s+http-equiv="refresh"/i.test(html);

const texto = (html: string) =>
    sinCodigo(html)
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z]+;|&#\d+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

const paginasReales = () => paginas().filter((p) => !esRedireccion(leer(p)));

/** `dist/about/index.html` -> `/about/`; `dist/404.html` -> `/404.html`. */
const rutaDe = (archivo: string) => {
    const rel = relativo(archivo);
    if (rel === "index.html") return "/";
    if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
    return `/${rel}`;
};

const esNoindex = (html: string) => /<meta name="robots"[^>]+noindex/i.test(html);

test("la build existe", () => {
    assert.ok(fs.existsSync(DIST), "no hay dist/: ejecuta `pnpm build` antes de las pruebas");
    assert.ok(paginas().length >= 20, `solo ${paginas().length} páginas en dist/`);
});

/* ------------------------- «que cargue más rápido» ------------------------- */

test("ninguna página supera el presupuesto de HTML", () => {
    const excedidas = paginas()
        .map((p) => ({ ruta: relativo(p), bytes: fs.statSync(p).size }))
        .filter((x) => x.bytes > MAX_HTML)
        .sort((a, b) => b.bytes - a.bytes);

    assert.deepEqual(
        excedidas,
        [],
        `HTML por encima de ${MAX_HTML / KB} KB:\n` +
            excedidas.map((x) => `  ${x.ruta}: ${Math.round(x.bytes / KB)} KB`).join("\n"),
    );
});

test("todas las fuentes están recortadas y dentro de su presupuesto", () => {
    const fuentes = listar(DIST, (p) => /\.(woff2?|ttf|otf)$/i.test(p));
    assert.ok(fuentes.length > 0, "la build no emitió ninguna fuente");

    const sinRecortar = fuentes.filter((p) => !path.basename(p).includes(".subset."));
    assert.deepEqual(
        sinRecortar.map(relativo),
        [],
        "hay fuentes sin recortar en la build; regenera con `python tools/fonts/subset.py`",
    );

    const formatoViejo = fuentes.filter((p) => !p.endsWith(".woff2"));
    assert.deepEqual(formatoViejo.map(relativo), [], "solo se sirve woff2; sobra la caída a woff/ttf/otf");

    const gordas = fuentes
        .map((p) => ({ ruta: relativo(p), bytes: fs.statSync(p).size }))
        .filter((x) => x.bytes > MAX_FUENTE);
    assert.deepEqual(gordas, [], `fuentes por encima de ${MAX_FUENTE / KB} KB`);

    const total = fuentes.reduce((suma, p) => suma + fs.statSync(p).size, 0);
    assert.ok(
        total <= MAX_FUENTES_TOTAL,
        `las fuentes suman ${Math.round(total / KB)} KB, por encima de ${MAX_FUENTES_TOTAL / KB} KB`,
    );
});

test("el JavaScript emitido no se dispara", () => {
    const total = listar(DIST, (p) => p.endsWith(".js")).reduce((s, p) => s + fs.statSync(p).size, 0);
    assert.ok(
        total <= MAX_JS_TOTAL,
        `${Math.round(total / KB)} KB de JavaScript, por encima de ${MAX_JS_TOTAL / KB} KB`,
    );
});

test("ninguna página precarga fuentes: Chrome retiene el pintado esperándolas", () => {
    /* Se precargaban tres variantes para evitar el salto de fuente, pero una
       fuente precargada bloquea el primer cuadro hasta que llega (o vence su
       plazo): en PageSpeed la portada estuvo en blanco 2,7 s en escritorio.
       Con el CSS dentro del HTML las @font-face se descubren igual de pronto
       sin retener nada. Ver layouts/lib/head.astro. */
    for (const archivo of paginasReales()) {
        const html = leer(archivo);
        assert.doesNotMatch(html, /<link[^>]+rel="preload"[^>]+as="font"/i, `${rutaDe(archivo)}: precarga una fuente`);
    }
});

test("las @font-face de las fuentes propias no van en el CSS crítico", () => {
    /* Las declara FontFaces.astro tras el primer cuadro: en el CSS del <head>
       solo pueden quedar las caras locales de respaldo (`local(...)`). Si una
       @font-face con `url(` vuelve al CSS, el navegador la pide antes del
       primer pintado y PageSpeed la suma al LCP. */
    for (const archivo of paginasReales()) {
        const html = leer(archivo);
        const ruta = rutaDe(archivo);
        /* El <noscript> sí lleva las @font-face completas: es el camino sin JavaScript. */
        const sinNoscript = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, "");
        const hojas = [...sinNoscript.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
        for (const hoja of hojas) {
            for (const [cara] of hoja.matchAll(/@font-face\{[^}]*\}/g)) {
                assert.doesNotMatch(cara, /url\(/, `${ruta}: @font-face con url() en el CSS crítico`);
            }
        }
        assert.match(html, /window\.fontsDeclared/, `${ruta}: sin FontFaces (las fuentes propias no se declaran)`);
        assert.match(html, /<noscript><style>[^<]*@font-face/, `${ruta}: sin @font-face para navegadores sin JavaScript`);
    }
});

test("ninguna página ni hoja de estilos pide fuentes a terceros", () => {
    /* global.css importaba cuatro hojas de fonts.googleapis.com (tres de
       familias que ninguna regla usaba). Cada una era una petición
       bloqueante a otro dominio antes del primer pintado: unos 800 ms en
       móvil. Todas las fuentes se sirven ahora desde el propio dominio. */
    const externas: string[] = [];
    for (const archivo of [...paginas(), ...listar(DIST, (p) => p.endsWith(".css"))]) {
        const contenido = leer(archivo);
        if (/fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit|fonts\.bunny/.test(contenido)) externas.push(relativo(archivo));
    }
    assert.deepEqual(externas, [], "hay fuentes de terceros");
});

test("ninguna imagen que enlaza una página pesa más de la cuenta", () => {
    /* La foto de la Batucada salía en `src` a 6000 px (680 KB) aunque el
       srcset ofreciera variantes de 720 a 1920 px; los logotipos SVG venían
       sin optimizar (300 KB). Presupuesto por archivo referenciado desde el
       HTML como imagen, en cualquiera de sus variantes. */
    const MAX_IMAGEN = 250 * KB;
    const gordas = new Map<string, number>();
    for (const archivo of paginas()) {
        const html = sinCodigo(leer(archivo));
        const urls = new Set<string>();
        for (const [, src] of html.matchAll(/<img[^>]+src="(\/[^"]+)"/g)) urls.add(src);
        for (const [, srcset] of html.matchAll(/<img[^>]+srcset="([^"]+)"/g)) {
            for (const parte of srcset.split(",")) {
                const url = parte.trim().split(/\s+/)[0];
                if (url?.startsWith("/")) urls.add(url);
            }
        }
        for (const url of urls) {
            const fichero = path.join(DIST, url.split(/[?#]/)[0]);
            if (!fs.existsSync(fichero)) continue;
            const bytes = fs.statSync(fichero).size;
            if (bytes > MAX_IMAGEN) gordas.set(url, bytes);
        }
    }
    assert.deepEqual(
        [...gordas.entries()].map(([u, b]) => `${u}: ${Math.round(b / KB)} KB`),
        [],
        `imágenes enlazadas por encima de ${MAX_IMAGEN / KB} KB`,
    );
});

test("la intro pesada no se precarga desde el HTML", () => {
    /* La animación solo se reproduce en la primera visita (src/scripts/visita.ts),
       así que pedir su JSON desde el `<head>` gastaba 55 KB en el resto. */
    const portada = leer(path.join(DIST, "index.html"));
    assert.doesNotMatch(portada, /<link[^>]+rel="preload"[^>]+logo_intro/i, "la portada vuelve a precargar el Lottie");
});

/* --------------------- «que se navegue con facilidad» ---------------------- */

const resuelve = (ruta: string): boolean => {
    const limpia = ruta.split(/[?#]/)[0];
    const base = path.join(DIST, limpia.replace(/^\//, ""));
    if (fs.existsSync(base)) {
        if (fs.statSync(base).isFile()) return true;
        if (fs.existsSync(path.join(base, "index.html"))) return true;
    }
    return fs.existsSync(`${base.replace(/[\\/]$/, "")}.html`);
};

test("ningún enlace interno apunta a una página que no existe", () => {
    const rotos: string[] = [];
    for (const archivo of paginas()) {
        const html = sinCodigo(leer(archivo));
        for (const [, href] of html.matchAll(/href="(\/[^"]*)"/g)) {
            if (href.startsWith("/_astro/")) continue;
            if (!resuelve(href)) rotos.push(`${rutaDe(archivo)} -> ${href}`);
        }
    }
    assert.deepEqual([...new Set(rotos)], [], "enlaces internos rotos");
});

test("ninguna ancla apunta a un id que no está en su página", () => {
    const rotas: string[] = [];
    for (const archivo of paginasReales()) {
        const html = sinCodigo(leer(archivo));
        const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
        const nombres = new Set([...html.matchAll(/<a[^>]+name="([^"]+)"/g)].map((m) => m[1]));
        for (const [, ancla] of html.matchAll(/href="#([^"]+)"/g)) {
            if (ancla.startsWith("ai:")) continue; // ids internos de astro-icon
            if (!ids.has(ancla) && !nombres.has(ancla)) rotas.push(`${rutaDe(archivo)} -> #${ancla}`);
        }
    }
    assert.deepEqual([...new Set(rotas)], [], "anclas sin destino");
});

test("el menú no enlaza a ninguna página de redirección", () => {
    /* Una página con `meta refresh` es una pantalla en blanco que rebota. Vale
       como red de seguridad para un enlace antiguo; no como ítem del menú. */
    const redirecciones = new Set(paginas().filter((p) => esRedireccion(leer(p))).map(rutaDe));
    const culpables: string[] = [];
    for (const archivo of paginasReales()) {
        const html = sinCodigo(leer(archivo));
        for (const [, href] of html.matchAll(/href="(\/[^"?#]*)"/g)) {
            const conBarra = href.endsWith("/") ? href : `${href}/`;
            if (redirecciones.has(href) || redirecciones.has(conBarra)) culpables.push(`${rutaDe(archivo)} -> ${href}`);
        }
    }
    assert.deepEqual([...new Set(culpables)], [], "hay enlaces que pasan por una página de rebote");
});

test("las páginas de redirección no se indexan", () => {
    for (const archivo of paginas().filter((p) => esRedireccion(leer(p)))) {
        assert.ok(esNoindex(leer(archivo)), `${rutaDe(archivo)} sin noindex`);
    }
});

/* ------------- «contenido abundante y llamadas a la acción» ---------------- */

test("cada página tiene contenido propio suficiente", () => {
    /* Las páginas `noindex` (404, vista previa de borradores) no son destinos
       de la campaña ni del buscador: no cuentan. Tampoco se juzga una página
       cuyo cuerpo viene del CMS y esta build no lo recibió (`data-cms-empty`,
       ver Novedades.astro): eso es una build local sin Strapi, no una página
       pobre. Se avisa para que no pase inadvertido. */
    const sinCms = paginasReales().filter((p) => /\sdata-cms-empty(=""|\s|>)/.test(leer(p)));
    if (sinCms.length) console.warn(`[ad-grants] sin contenido del CMS en esta build: ${sinCms.map(rutaDe).join(", ")}`);

    const flojas = paginasReales()
        .filter((p) => !esNoindex(leer(p)) && !sinCms.includes(p))
        .map((p) => ({ ruta: rutaDe(p), palabras: texto(leer(p)).split(" ").filter(Boolean).length }))
        .filter((x) => x.palabras < MIN_PALABRAS);

    assert.deepEqual(flojas, [], `páginas por debajo de ${MIN_PALABRAS} palabras`);
});

test("no queda ninguna página de demostración o relleno publicada", () => {
    /* La activación se rechazó con `/ejemplo-constructor` indexada: una página
       del constructor de Strapi con textos tipo «Tres tarjetas de colores». */
    const sospechosas = paginasReales().filter((archivo) => {
        const ruta = rutaDe(archivo);
        if (/(ejemplo|demo|prueba|lorem|placeholder|sample)/i.test(ruta)) return true;
        return /lorem ipsum|texto de relleno|contenido de ejemplo/i.test(texto(leer(archivo)));
    });

    assert.deepEqual(
        sospechosas.map(rutaDe),
        [],
        "hay páginas de demostración publicadas; despublícalas en Strapi y reconstruye",
    );
});

test("cada página tiene título, descripción y un solo h1", () => {
    for (const archivo of paginasReales()) {
        const html = leer(archivo);
        const ruta = rutaDe(archivo);

        const titulo = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
        assert.ok(titulo && titulo.length >= 10, `${ruta}: título ausente o demasiado corto`);

        const descripcion = html.match(/<meta name="description" content="([^"]*)"/i)?.[1]?.trim();
        assert.ok(descripcion && descripcion.length >= 50, `${ruta}: meta description ausente o pobre`);

        const h1 = [...sinCodigo(html).matchAll(/<h1[\s>]/gi)];
        assert.equal(h1.length, 1, `${ruta}: ${h1.length} elementos h1, debe haber exactamente uno`);
    }
});

test("cada página ofrece una llamada a la acción", () => {
    /* Ad Grants lo pide explícitamente. Basta con que se pueda donar o
       contactar desde cualquier punto del sitio. */
    const sinCta = paginasReales().filter((archivo) => {
        const html = sinCodigo(leer(archivo));
        return !/href="[^"]*\/donate/.test(html) && !/href="mailto:/.test(html) && !/href="[^"]*#contacto/.test(html);
    });
    assert.deepEqual(sinCta.map(rutaDe), [], "páginas sin ninguna llamada a la acción");
});

test("desde cualquier página se llega a la de aportes y a contacto", () => {
    /* En la primera revisión la página de aportes solo se enlazaba desde el
       404 y desde Novedades. Ahora la enlazan el pie y el panel del menú, así
       que tiene que aparecer en todas; lo mismo con el contacto. */
    const faltan: string[] = [];
    for (const archivo of paginasReales()) {
        const html = sinCodigo(leer(archivo));
        const ruta = rutaDe(archivo);
        const donate = ruta.startsWith("/en/") ? /href="\/en\/donate\/?"/ : /href="\/donate\/?"/;
        if (!donate.test(html)) faltan.push(`${ruta} -> aportes`);
        if (!/href="[^"]*#contacto"/.test(html) && !/href="mailto:/.test(html)) faltan.push(`${ruta} -> contacto`);
    }
    assert.deepEqual(faltan, [], "páginas sin enlace a aportes o a contacto");
});

test("la portada y el menú vienen visibles en el HTML", () => {
    /* La portada escondía todo el contenido (`opacity-0`) y el menú
       (`hidden`) hasta que el script los revelaba: un rastreador o un
       navegador sin JavaScript veían una página en blanco, y Lighthouse
       medía el primer pintado de contenido al terminar la intro. Ahora solo
       se ocultan bajo `html[data-js]` / `html[data-intro]`, que escribe un
       script en línea antes del primer pintado y solo si hay JavaScript. */
    for (const archivo of paginasReales()) {
        const html = leer(archivo);
        const ruta = rutaDe(archivo);
        assert.doesNotMatch(html, /id="app-content"[^>]*class="[^"]*\bopacity-0\b/, `${ruta}: #app-content oculto en el HTML`);
        assert.doesNotMatch(html, /class="[^"]*\bhidden\b[^"]*"[^>]*id="nav-container"/, `${ruta}: #nav-container oculto en el HTML`);
        assert.match(html, /<div[^>]+id="nav-container"/, `${ruta}: sin navbar`);
        /* Y tampoco escondido por CSS hasta que llegue el script: solo la
           intro (`html[data-intro]`) puede taparlo. */
        assert.doesNotMatch(html, /html\[data-js\][^{]*#nav-container/, `${ruta}: #nav-container oculto hasta el JS`);
    }
});

test("el CSS va dentro del HTML: ninguna hoja externa bloquea el pintado", () => {
    /* `build.inlineStylesheets: "always"` en astro.config.ts. Una hoja
       externa en el <head> detiene el primer pintado hasta que llega. */
    for (const archivo of paginasReales()) {
        const html = leer(archivo);
        assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"/i, `${rutaDe(archivo)}: hoja de estilo externa`);
    }
});

test("los scripts de módulo van en prioridad baja y sin modulepreload", async () => {
    /* Ver src/integrations/modulepreload.ts: un script de prioridad alta
       cuenta como bloqueante del primer pintado para PageSpeed, y un trozo
       precargado que baja antes del LCP se suma al LCP. */
    for (const archivo of paginasReales()) {
        const html = leer(archivo);
        const entradas = moduleEntries(html);
        if (!entradas.length) continue;
        assert.doesNotMatch(html, /<script type="module" src=/, `${rutaDe(archivo)}: script de módulo sin fetchpriority="low"`);
        assert.doesNotMatch(html, /rel="modulepreload"/, `${rutaDe(archivo)}: modulepreload`);
        /* Y los trozos que importan existen: una ruta rota es un 404 en cada visita. */
        for (const dep of await transitiveImports(DIST, entradas)) {
            assert.ok(fs.existsSync(path.join(DIST, dep)), `${rutaDe(archivo)}: import roto: ${dep}`);
        }
    }
});

test("la leyenda de la portada no espera al JavaScript", () => {
    /* En móvil es el LCP: si una regla bajo `html[data-js]` la esconde hasta
       que el script la revela, PageSpeed mide el LCP al final de la cascada. */
    for (const archivo of paginasReales().filter((a) => /\/(en\/)?index\.html$/.test(a))) {
        const html = leer(archivo);
        assert.doesNotMatch(html, /html\[data-js\][^{]*#foundation-text/, `${rutaDe(archivo)}: #foundation-text oculto hasta el JS`);
    }
});

test("cada página lleva la etiqueta de medición que Ad Grants exige", () => {
    /* La política de Ad Grants pide seguimiento de conversiones: una cuenta
       que no puede demostrar qué hace la gente al llegar acaba suspendida. */
    for (const archivo of paginasReales()) {
        const html = leer(archivo);
        assert.match(html, /googletagmanager\.com\/gtag\/js\?id=G-/, `${rutaDe(archivo)}: sin etiqueta de Analytics`);
    }
});

test("el consentimiento se declara antes de cargar la etiqueta", () => {
    /* Las señales del modo de consentimiento tienen que estar puestas cuando
       gtag arranca: si se declaran después, el primer envío de cada visita
       sale sin ellas y Google ya guardó lo que no debía. */
    for (const archivo of paginasReales()) {
        const html = leer(archivo);
        const ruta = rutaDe(archivo);
        const consentimiento = html.indexOf('"consent", "default"');
        const configuracion = html.indexOf('"config"');
        const etiqueta = html.indexOf("googletagmanager.com/gtag/js");
        assert.ok(consentimiento > -1, `${ruta}: no se declara el consentimiento`);
        assert.ok(consentimiento < configuracion, `${ruta}: se configura Analytics antes de declarar el consentimiento`);
        assert.ok(configuracion < etiqueta, `${ruta}: gtag.js se carga antes de declarar el consentimiento`);
        /* Y de partida, denegado: solo se concede si hay una respuesta
           guardada que lo diga. Lo contrario sería medir sin preguntar. */
        assert.match(html, /granted"\s*:\s*"denied/, `${ruta}: el consentimiento no parte de denegado`);
    }
});

test("cada página lleva el aviso de cookies, oculto hasta que haga falta", () => {
    /* Es propio, no de una plataforma de terceros: ver CookieConsent.astro.
       Viene oculto para que quien ya respondió no vea un parpadeo. */
    for (const archivo of paginasReales()) {
        const html = leer(archivo);
        const ruta = rutaDe(archivo);
        const inicio = html.indexOf('id="aviso-cookies"');
        assert.ok(inicio > -1, `${ruta}: sin aviso de cookies`);
        assert.match(html.slice(inicio, inicio + 400), /\shidden(\s|>)/, `${ruta}: el aviso no viene oculto`);
        assert.match(html, /data-cookie-accept/, `${ruta}: el aviso no deja aceptar`);
        assert.match(html, /data-cookie-reject/, `${ruta}: el aviso no deja rechazar`);
        assert.match(html, /data-cookie-prefs/, `${ruta}: no se puede cambiar de opinión`);
    }
});

/* ----------------------- Coherencia de dominio y SEO ----------------------- */

test("cada canónica apunta a su propia ruta, con www", () => {
    for (const archivo of paginasReales()) {
        const html = leer(archivo);
        const ruta = rutaDe(archivo);
        if (esNoindex(html)) continue;

        const canonica = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
        assert.ok(canonica, `${ruta}: sin canónica`);
        assert.ok(
            canonica!.startsWith(`${DOMINIO}/`),
            `${ruta}: la canónica es ${canonica}; el dominio sin www responde una redirección`,
        );
        assert.equal(new URL(canonica!).pathname, ruta, `${ruta}: la canónica apunta a otra página`);
    }
});

test("los hreflang forman pareja y usan el mismo dominio", () => {
    for (const archivo of paginasReales()) {
        const html = leer(archivo);
        if (esNoindex(html)) continue;
        const alternos = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/gi)];
        const idiomas = alternos.map((m) => m[1]);

        assert.ok(idiomas.includes("x-default"), `${rutaDe(archivo)}: falta hreflang x-default`);
        assert.equal(idiomas.filter((l) => l !== "x-default").length, 2, `${rutaDe(archivo)}: esperaba dos idiomas`);
        for (const [, , href] of alternos) {
            assert.ok(href.startsWith(`${DOMINIO}/`), `${rutaDe(archivo)}: hreflang fuera de ${DOMINIO}: ${href}`);
        }
    }
});

test("el sitemap solo lista páginas reales de este dominio", () => {
    const indice = path.join(DIST, "sitemap-index.xml");
    assert.ok(fs.existsSync(indice), "no se generó el sitemap");
    assert.ok(leer(indice).includes(DOMINIO), "el índice del sitemap no usa el dominio con www");

    const urls = listar(DIST, (p) => /sitemap-\d+\.xml$/.test(p)).flatMap((p) =>
        [...leer(p).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]),
    );

    assert.ok(urls.length >= 18, `el sitemap solo tiene ${urls.length} URL`);

    const fuera = urls.filter((u) => !u.startsWith(`${DOMINIO}/`));
    assert.deepEqual(fuera, [], "URL del sitemap fuera del dominio canónico");

    const rutasReales = new Set(paginasReales().map(rutaDe));
    const fantasma = urls.map((u) => new URL(u).pathname).filter((p) => !rutasReales.has(p));
    assert.deepEqual(fantasma, [], "el sitemap lista páginas que no existen o que solo redirigen");

    const demo = urls.filter((u) => /(ejemplo|demo|prueba|lorem|placeholder)/i.test(u));
    assert.deepEqual(demo, [], "el sitemap ofrece páginas de demostración a Google");
});

test("robots.txt permite el rastreo y apunta al sitemap con www", () => {
    const robots = leer(path.join(DIST, "robots.txt"));
    assert.match(robots, /^User-agent:\s*\*/m, "robots.txt sin regla general");
    assert.doesNotMatch(robots, /^Disallow:\s*\/\s*$/m, "robots.txt bloquea el sitio entero");
    assert.ok(
        robots.includes(`Sitemap: ${DOMINIO}/sitemap-index.xml`),
        "el sitemap declarado en robots.txt no usa www",
    );
});
