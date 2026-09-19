import { createRequire } from "node:module";

import { defineConfig, passthroughImageService, sharpImageService } from "astro/config";

import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

import react from "@astrojs/react";

import node from "@astrojs/node";
import type { AstroIntegration } from "astro";

import { unified } from "@astrojs/markdown-remark";
import { rehypePlugins } from "./src/utils/markdown-pipeline";
import { rutasRedirigidas } from "./src/data/redirects";

/* Servicio de imágenes declarado explícitamente y tolerante a fallos.

   Astro optimiza las imágenes con sharp, que es un módulo nativo: se instala
   como binario precompilado por plataforma (`@img/sharp-<os>-<arch>`). En la
   imagen de build (nixpacks + pnpm sobre Coolify) ese binario puede no llegar
   a instalarse —o no cargar—, y entonces `astro build` aborta con
   `MissingSharp` en la fase de imágenes, cuando ya ha escrito todo el HTML. Un
   despliegue no puede caerse por eso: sin optimizar, el sitio sigue siendo
   correcto; sólo pesa más.

   Por eso se comprueba sharp antes de construir: si carga, se usa; si no, se
   continúa con el servicio passthrough (no transforma nada) y se avisa en el
   log con el error real, que Astro se traga al envolverlo en `MissingSharp`.
   La comprobación usa `require` síncrono y no `import()` porque, además de
   resolver el paquete, fuerza la carga del binario nativo, que es justo lo que
   falla en el contenedor. */
const require = createRequire(import.meta.url);

function resolveImageService() {
    try {
        require("sharp");
        return sharpImageService();
    } catch (error) {
        const detalle = error instanceof Error ? error.message : String(error);
        /* A stderr: el aviso se emite al cargar la config, antes de que
           exista el logger de Astro, y así llega al log del despliegue. */
        process.stderr.write(
            `[imagenes] sharp no está disponible: ${detalle}\n` +
                "[imagenes] El build continúa SIN optimizar imágenes (passthrough). " +
                "Revisa la instalación de sharp en el entorno de build.\n",
        );
        return passthroughImageService();
    }
}

/* Build de vista previa de borradores (`PREVIEW_MODE=1`).

   Es la única excepción al estático puro de abajo, y no toca producción: se
   despliega como un servicio aparte con el adaptador de Node, y lo único que
   se genera en el momento es la ruta de vista previa del constructor, que el
   panel de Strapi abre en su iframe. Todo lo demás sigue prerenderizado igual
   que en producción. Ver src/utils/preview.ts. */
const previewMode = ["1", "true"].includes((process.env.PREVIEW_MODE ?? "").toLowerCase());

const previewRoutes = (): AstroIntegration => ({
    name: "minkayni-preview-routes",
    hooks: {
        "astro:config:setup": ({ injectRoute }) => {
            for (const pattern of ["/preview/page/[documentId]", "/en/preview/page/[documentId]"]) {
                injectRoute({ pattern, entrypoint: "./src/preview/draft.astro", prerender: false });
            }
        },
    },
});

// https://astro.build/config
export default defineConfig({
    /* Dominio público del sitio. Lo usan `Astro.site` (canonical, JSON-LD de
       la organización) y cualquier generador de sitemap/feed. Sin esto los
       verificadores externos no ven una URL canónica declarada.

       Va CON www porque es lo que sirve de verdad: `minkayni.org` responde una
       redirección hacia `www.minkayni.org`. Mientras esto dijo el dominio sin
       www, cada canonical, cada hreflang y las veinte URL del sitemap
       apuntaban a una dirección que redirige, que es justo la incoherencia que
       un revisor (o Googlebot) cuenta como salto de más. */
    site: "https://www.minkayni.org",
    /* Estático puro, declarado explícitamente en lugar de heredar el valor por
       defecto. Se evaluó pasar a adaptador Node (híbrido o servidor) y no
       compensa: no hay endpoints, formularios, cookies, sesión ni middleware,
       y todo el contenido de Strapi se resuelve en build vía content loaders.
       Un adaptador añadiría un proceso Node y TTFB de render donde hoy nginx
       sirve un fichero ya hecho, sin ganar nada en SEO: el HTML pre-renderizado
       ya es lo óptimo para los rastreadores. El coste real de este modelo es
       que un cambio en el CMS exige rebuild; se resuelve con un webhook de
       Strapi hacia el despliegue, no cambiando de modo de salida.

       Excepción: la build de vista previa (ver `previewMode` arriba) añade el
       adaptador de Node solo para generar borradores al vuelo, en un servicio
       aparte. En producción `adapter` queda sin definir. */
    output: "static",
    adapter: previewMode ? node({ mode: "standalone" }) : undefined,
    /* Dos idiomas, con el español sin prefijo: `/about` sigue siendo la URL
       de siempre y el inglés cuelga de `/en/about`. Prefijar también el
       español habría obligado a redirigir las once páginas ya indexadas sin
       ganar nada a cambio. Ver src/i18n/index.ts, que implementa la misma
       regla para los enlaces y los `hreflang`. */
    i18n: {
        defaultLocale: "es",
        locales: ["es", "en"],
        routing: {
            prefixDefaultLocale: false,
        },
    },
    /* Ver `resolveImageService`: sharp cuando está disponible, passthrough si no. */
    image: {
        service: resolveImageService(),
    },
    // Permite que herramientas (p. ej. previews) asignen puerto vía PORT
    server: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
    integrations: [
        ...(previewMode ? [previewRoutes()] : []),
        icon(),
        /* React vuelve, pero solo como islas: los componentes de menú, contador,
           logos, títulos y transición se hidratan uno a uno con `client:*`; el
           resto del sitio sigue siendo HTML sin runtime. */
        react(),
        sitemap({
            /* Las páginas `noindex` no pertenecen al sitemap: 404 no es un
               destino real y /transparencia se enlaza desde el footer. */
            filter: (page) => !page.includes("/404"),
            /* Con esto el sitemap emite `xhtml:link rel="alternate"` entre las
               dos versiones de cada página. Sin declararlo, un buscador trata
               /about y /en/about como páginas distintas sin relación y puede
               considerar una de ellas contenido duplicado. */
            i18n: {
                defaultLocale: "es",
                locales: {
                    es: "es-EC",
                    en: "en",
                },
            },
        }),
    ],
    /* La tabla vive en src/data/redirects.ts porque no la usa solo el build:
       `loadNavigation()` la aplica también al árbol del CMS, para que el menú
       enlace al destino real en vez de pasar por la página de redirección.
       Ver el comentario de cabecera de ese fichero. */
    redirects: rutasRedirigidas(),
    vite: {
        plugins: [tailwindcss()],
        assetsInclude: ["**/*.mov"],
        optimizeDeps: {
            include: ["gsap", "gsap/all", "gsap/ScrollTrigger", "gsap/SplitText", "leaflet"],
        },
    },
    markdown: {
        /* Astro 7 usa Sätteri por defecto; `rehype-modular` es un plugin
           rehype, así que el sitio se mantiene en el pipeline unified.
           Los plugins viven en src/utils/markdown-pipeline.ts para compartirlos
           con <Markdown /> (contenido de Strapi). */
        processor: unified({ rehypePlugins }),
    },
});
