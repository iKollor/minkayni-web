// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

import md from "@astropub/md";
import rehypeModular from "./src/utils/rehype-modular";

// https://astro.build/config
export default defineConfig({
    integrations: [react(), icon(), md()],
    vite: {
        plugins: [tailwindcss()],
        assetsInclude: ["**/*.mov"],
    },
    markdown: {
        remarkPlugins: [],
        rehypePlugins: [
            [
                rehypeModular,
                {
                    /* 1) SHORTCODES en texto: {{odometer:150}} → <span id="odometer"><span class="current">150</span></span> */
                    textPatterns: [
                        {
                            pattern: /{{\s*odometer\s*:\s*(\d{1,6})\s*}}/g,
                            replace: (m: RegExpExecArray) => {
                                const num = m[1];
                                return {
                                    type: "element",
                                    tagName: "span",
                                    properties: { id: "odometer", className: ["tabular-nums", "font-semibold"] },
                                    children: [
                                        {
                                            type: "element",
                                            tagName: "span",
                                            properties: { className: ["current"] },
                                            children: [{ type: "text", value: num }],
                                        },
                                    ],
                                };
                            },
                        },
                    ],

                    /* 2) REGLAS por selector para todos los anchors, externos/internos, etc. */
                    rules: [
                        // Todos los <a>: añade clases (sin duplicar)
                        { selector: "a", classes: { add: "anchor-fx" } },

                        // Externos: abre nueva pestaña + rel seguro
                        {
                            selector: 'a[href^="http"]',
                            attributes: {
                                target: { value: "_blank" },
                                rel: { value: "noopener noreferrer" },
                            },
                        },
                        // Internos: limpia target/rel si los hubiera
                        {
                            selector: 'a[href^="/"]',
                            attributes: {
                                target: { value: undefined },
                                rel: { value: undefined },
                            },
                        },
                    ],
                },
            ],
        ],
    },
});
