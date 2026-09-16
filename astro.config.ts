import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

import { unified } from "@astrojs/markdown-remark";
import { rehypePlugins } from "./src/utils/markdown-pipeline";

// https://astro.build/config
export default defineConfig({
    /* Dominio público del sitio. Lo usan `Astro.site` (canonical, JSON-LD de
       la organización) y cualquier generador de sitemap/feed. Sin esto los
       verificadores externos no ven una URL canónica declarada. */
    site: "https://minkayni.org",
    /* Estático puro, declarado explícitamente en lugar de heredar el valor por
       defecto. Se evaluó pasar a adaptador Node (híbrido o servidor) y no
       compensa: no hay endpoints, formularios, cookies, sesión ni middleware,
       y todo el contenido de Strapi se resuelve en build vía content loaders.
       Un adaptador añadiría un proceso Node y TTFB de render donde hoy nginx
       sirve un fichero ya hecho, sin ganar nada en SEO: el HTML pre-renderizado
       ya es lo óptimo para los rastreadores. El coste real de este modelo es
       que un cambio en el CMS exige rebuild; se resuelve con un webhook de
       Strapi hacia el despliegue, no cambiando de modo de salida. */
    output: "static",
    // Permite que herramientas (p. ej. previews) asignen puerto vía PORT
    server: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
    integrations: [
        react(),
        icon(),
        sitemap({
            /* Las páginas `noindex` no pertenecen al sitemap: 404 no es un
               destino real y /transparencia se enlaza desde el footer. */
            filter: (page) => !page.includes("/404"),
        }),
    ],
    redirects: {
        "/batucada-popular": "/projects/batucada-popular/",
    },
    vite: {
        plugins: [tailwindcss()],
        assetsInclude: ["**/*.mov"],
        optimizeDeps: {
            include: ["react", "react-dom", "react/jsx-runtime", "motion/react", "gsap", "gsap/all", "gsap/ScrollTrigger", "gsap/SplitText", "leaflet"],
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
