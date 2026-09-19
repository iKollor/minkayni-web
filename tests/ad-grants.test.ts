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

const RAIZ = path.join(import.meta.dirname, "..");
const DIST = path.join(RAIZ, "dist");
const DOMINIO = "https://www.minkayni.org";

/* ------------------------------- Presupuestos ------------------------------ */

const KB = 1024;
/** HTML sin comprimir de una sola página. Se sirve con brotli (~4:1).
    La que primero se acercará a este techo es /novedades, que crece una
    entrada por cada publicación nueva del CMS; cuando lo pase, la respuesta
    es paginarla, no subir el número. */
const MAX_HTML = 200 * KB;
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

test("cada página precarga las fuentes que pinta casi todo el texto", () => {
    /* Descubiertas solo desde el CSS de @font-face, el navegador no las pide
       hasta tener el árbol de estilos: el texto se pinta con la del sistema y
       salta al llegar la propia. */
    for (const archivo of paginasReales()) {
        const html = leer(archivo);
        const precargas = [...html.matchAll(/<link[^>]+rel="preload"[^>]+as="font"[^>]*>/gi)];
        assert.ok(precargas.length >= 3, `${rutaDe(archivo)} precarga ${precargas.length} fuentes, esperaba 3`);
        for (const [etiqueta] of precargas) {
            assert.match(etiqueta, /crossorigin/i, `precarga de fuente sin crossorigin en ${rutaDe(archivo)}`);
            assert.match(etiqueta, /\.subset\./, `precarga una fuente sin recortar en ${rutaDe(archivo)}`);
        }
    }
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
    const flojas = paginasReales()
        .filter((p) => !rutaDe(p).includes("404"))
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
