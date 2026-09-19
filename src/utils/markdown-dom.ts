/**
 * Aplica las reglas de `markdown-rules.ts` sobre un árbol DOM ya construido.
 *
 * Es la versión de navegador de `rehype-modular`: mismo objeto de
 * configuración, mismas semánticas, pero sobre elementos DOM en vez de nodos
 * hast. Solo cubre lo que las reglas del sitio usan (patrones de texto,
 * atributos, clases, estilos y dataset); las mutaciones de elemento
 * (rename/wrap/unwrap) no están implementadas porque ninguna regla las usa.
 *
 * Además reproduce el `id` que Astro pone a cada encabezado (rehypeHeadingIds,
 * con github-slugger), para que los enlaces de ancla funcionen igual.
 */
import GithubSlugger from "github-slugger";
import type { AttrRule, ClassRule, DataRule, ModularConfig, StyleRule, TextPatternRule } from "./rehype-modular";

type HastLike = { type: "element"; tagName: string; properties?: Record<string, unknown>; children?: HastLike[] } | { type: "text"; value: string };

const toArr = <T>(v?: T | T[]): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

/* Un descriptor hast (el que devuelven los `replace` de las reglas) → DOM. */
function hastToDom(node: HastLike): Node {
    if (node.type === "text") return document.createTextNode(node.value);
    const el = document.createElement(node.tagName);
    for (const [key, value] of Object.entries(node.properties ?? {})) {
        if (value === undefined || value === null || value === false) continue;
        if (key === "className") el.setAttribute("class", toArr(value as string | string[]).join(" "));
        else el.setAttribute(key, value === true ? "" : String(value));
    }
    for (const child of node.children ?? []) el.appendChild(hastToDom(child));
    return el;
}

function applyTextPatterns(root: Node, patterns: TextPatternRule[]) {
    for (const { pattern, replace } of patterns) {
        const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const texts: Text[] = [];
        for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n as Text);

        for (const node of texts) {
            const text = node.nodeValue ?? "";
            if (!text) continue;
            const fragment = document.createDocumentFragment();
            let last = 0;
            let m: RegExpExecArray | null;
            re.lastIndex = 0;
            while ((m = re.exec(text)) !== null) {
                if (m.index > last) fragment.appendChild(document.createTextNode(text.slice(last, m.index)));
                const repl = replace(m);
                for (const piece of typeof repl === "string" ? [{ type: "text" as const, value: repl }] : toArr(repl)) fragment.appendChild(hastToDom(piece as HastLike));
                last = re.lastIndex;
            }
            if (last === 0) continue; // sin coincidencias: se deja tal cual
            if (last < text.length) fragment.appendChild(document.createTextNode(text.slice(last)));
            node.parentNode?.replaceChild(fragment, node);
        }
    }
}

function applyAttributes(el: Element, rules?: Record<string, AttrRule>) {
    if (!rules) return;
    for (const [key, r] of Object.entries(rules)) {
        const exists = el.hasAttribute(key);
        if (r.protect && exists) continue;
        if (r.onlyIfMissing && exists) continue;
        if (r.onlyIfExists && !exists) continue;
        if (r.value === undefined || r.value === null) el.removeAttribute(key);
        else el.setAttribute(key, Array.isArray(r.value) ? r.value.join(" ") : String(r.value));
    }
}

function applyClasses(el: Element, rule?: ClassRule) {
    if (!rule) return;
    if (rule.replaceWith !== undefined) {
        el.setAttribute("class", toArr(rule.replaceWith).join(" "));
        return;
    }
    el.classList.remove(...toArr(rule.remove));
    el.classList.add(...toArr(rule.add));
}

function applyStyle(el: Element, rule?: StyleRule) {
    if (!rule || !(el instanceof HTMLElement)) return;
    for (const [k, v] of Object.entries(rule.set ?? {})) {
        if (v === undefined || v === null) el.style.removeProperty(k);
        else el.style.setProperty(k, String(v));
    }
    for (const k of toArr(rule.remove)) el.style.removeProperty(k);
    if (!el.getAttribute("style")) el.removeAttribute("style");
}

function applyDataset(el: Element, rules?: Record<string, DataRule>) {
    if (!rules) return;
    for (const [k, r] of Object.entries(rules)) {
        const key = `data-${k}`;
        const exists = el.hasAttribute(key);
        if (r.protect && exists) continue;
        if (r.onlyIfMissing && exists) continue;
        if (r.onlyIfExists && !exists) continue;
        if (r.value === undefined || r.value === null) el.removeAttribute(key);
        else el.setAttribute(key, String(r.value));
    }
}

/** Mismo criterio que rehypeHeadingIds: slug de GitHub del texto, sin pisar
    un id que ya venga en el HTML. */
function applyHeadingIds(root: ParentNode) {
    const slugger = new GithubSlugger();
    for (const h of root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6")) {
        if (h.id) continue;
        h.id = slugger.slug((h.textContent ?? "").trim());
    }
}

export function applyMarkdownRules(root: ParentNode & Node, config: ModularConfig): void {
    if (config.textPatterns?.length) applyTextPatterns(root, config.textPatterns);
    for (const rule of config.rules ?? []) {
        for (const el of root.querySelectorAll(rule.selector)) {
            if (rule.when && !rule.when(el as never)) continue;
            applyAttributes(el, rule.attributes);
            applyClasses(el, rule.classes);
            applyStyle(el, rule.style);
            applyDataset(el, rule.dataset);
        }
    }
    applyHeadingIds(root);
}
