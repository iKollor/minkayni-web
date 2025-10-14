// src/rehype/rehype-modular.ts
import { selectAll } from "hast-util-select";
import { visit } from "unist-util-visit";
import type { Root, Element, Properties, Text, Parent } from "hast";

/* -------------------- tipos utilitarios -------------------- */
type Dict<T = any> = Record<string, T>;
const toArr = <T>(v?: T | T[]) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const uniq = <T>(xs: T[]) => Array.from(new Set(xs));

/* -------------------- reglas por atributo -------------------- */
export type AttrRule = {
    value?: any; // undefined/null => elimina atributo
    onlyIfMissing?: boolean; // aplica solo si no existe
    onlyIfExists?: boolean; // aplica solo si ya existe
    protect?: boolean; // no tocar si existe
};

/* -------------------- clases / estilos / dataset -------------------- */
export type ClassRule = {
    add?: string | string[];
    remove?: string | string[];
    replaceWith?: string | string[]; // si está, ignora add/remove
};

export type StyleRule = {
    set?: Dict<string | number | null | undefined>; // null/undef => elimina clave
    remove?: string | string[];
};

export type DataRule = {
    value?: string | number | boolean | null | undefined; // null/undef => elimina
    onlyIfMissing?: boolean;
    onlyIfExists?: boolean;
    protect?: boolean;
};

/* -------------------- mutación de elemento -------------------- */
export type ElementMutation = {
    rename?: string; // cambia tagName
    wrap?: { tagName: string; properties?: Properties }; // envuelve
    unwrap?: boolean; // “pseudo” unwrap (si único hijo element)
};

/* -------------------- reemplazos en nodos de texto -------------------- */
export type TextPatternRule = {
    /** RegExp: usa grupos de captura para extraer valores (p.ej. /{{\s*odometer\s*:\s*(\d{1,6})\s*}}/g ) */
    pattern: RegExp;
    /**
     * Reemplazo: recibe el match y retorna:
     *  - string  → texto plano
     *  - Element → un único elemento
     *  - Array<Text|Element> → secuencia de nodos
     */
    replace: (match: RegExpExecArray) => string | Element | Array<Text | Element>;
};

/* -------------------- regla principal por selector -------------------- */
export type SelectorRule = {
    selector: string;
    element?: ElementMutation;
    attributes?: Record<string, AttrRule>;
    classes?: ClassRule;
    style?: StyleRule;
    dataset?: Record<string, DataRule>;
    when?: (node: Element) => boolean;
};

/* -------------------- config del plugin -------------------- */
export type ModularConfig = {
    /** Reglas sobre elementos (por selector CSS) */
    rules?: SelectorRule[];
    /** Reglas de reemplazo aplicadas sobre nodos de texto */
    textPatterns?: TextPatternRule[];
};

/* -------------------- helpers de aplicación -------------------- */
function applyAttributes(props: Properties, rules?: Record<string, AttrRule>) {
    if (!rules) return;
    for (const [key, r] of Object.entries(rules)) {
        const exists = props[key as keyof Properties] != null;
        if (r.protect && exists) continue;
        if (r.onlyIfMissing && exists) continue;
        if (r.onlyIfExists && !exists) continue;

        if (r.value === undefined || r.value === null) delete (props as any)[key];
        else (props as any)[key] = r.value;
    }
}

function applyClasses(props: Properties, rule?: ClassRule) {
    if (!rule) return;
    if (rule.replaceWith !== undefined) {
        props.className = toArr(rule.replaceWith).map(String);
        return;
    }
    const cur = Array.isArray(props.className)
        ? props.className.map(String)
        : props.className
        ? String(props.className).split(/\s+/).filter(Boolean)
        : [];
    const add = toArr(rule.add).map(String);
    const rm = toArr(rule.remove).map(String);
    props.className = uniq(cur.filter((c) => !rm.includes(c)).concat(add));
}

function applyStyle(props: Properties, rule?: StyleRule) {
    if (!rule) return;
    const current: Dict<string | number> = typeof props.style === "object" && props.style ? (props.style as any) : {};

    if (rule.set) {
        for (const [k, v] of Object.entries(rule.set)) {
            if (v === undefined || v === null) delete current[k];
            else current[k] = v as any;
        }
    }
    for (const key of toArr(rule.remove)) delete current[key];

    if (Object.keys(current).length) props.style = current as any;
    else delete (props as any).style;
}

function applyDataset(props: Properties, rules?: Record<string, DataRule>) {
    if (!rules) return;
    for (const [k, r] of Object.entries(rules)) {
        const key = `data-${k}`;
        const exists = (props as any)[key] != null;
        if (r.protect && exists) continue;
        if (r.onlyIfMissing && exists) continue;
        if (r.onlyIfExists && !exists) continue;

        if (r.value === undefined || r.value === null) delete (props as any)[key];
        else (props as any)[key] = String(r.value);
    }
}

/* -------------------- reemplazo en nodos de texto -------------------- */
function applyTextPatterns(tree: Root, patterns: TextPatternRule[]) {
    if (!patterns?.length) return;

    visit(tree, "text", (node: Text, index: number | null | undefined, parent: Parent | null | undefined): number | void => {
        if (!parent || typeof index !== "number" || !node.value) return;

        let chunks: Array<Text | Element> = [{ type: "text", value: node.value }];

        for (const { pattern, replace } of patterns) {
            const newChunks: Array<Text | Element> = [];
            for (const chunk of chunks) {
                if (chunk.type !== "text") {
                    newChunks.push(chunk);
                    continue;
                }
                const text = chunk.value;
                let last = 0;
                let m: RegExpExecArray | null;

                // IMPORTANTE: asegúrate que pattern tenga el flag 'g' para múltiples matches
                const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");

                while ((m = re.exec(text)) !== null) {
                    const start = m.index;
                    const end = re.lastIndex;
                    if (start > last) newChunks.push({ type: "text", value: text.slice(last, start) });

                    const repl = replace(m);
                    if (typeof repl === "string") {
                        newChunks.push({ type: "text", value: repl });
                    } else if (Array.isArray(repl)) {
                        newChunks.push(...repl);
                    } else {
                        newChunks.push(repl);
                    }
                    last = end;
                }
                if (last < text.length) newChunks.push({ type: "text", value: text.slice(last) });
            }
            chunks = newChunks;
        }

        if (chunks.length) {
            parent.children.splice(index, 1, ...chunks);
            return index + chunks.length;
        }
    });
}

/* -------------------- plugin principal -------------------- */
export default function rehypeModular(config: ModularConfig = {}) {
    const { rules = [], textPatterns = [] } = config;

    return (tree: Root) => {
        // 1) Reglas de texto (shortcodes como {{odometer:150}})
        if (textPatterns.length) applyTextPatterns(tree, textPatterns);

        // 2) Reglas por selector (mutaciones de elementos)
        for (const rule of rules) {
            const nodes = selectAll(rule.selector, tree) as Element[];
            for (const node of nodes) {
                if (rule.when && !rule.when(node)) continue;

                // Mutaciones del elemento
                if (rule.element) {
                    const { rename, wrap, unwrap } = rule.element;
                    if (rename) node.tagName = rename;

                    if (wrap) {
                        const wrapper: Element = {
                            type: "element",
                            tagName: wrap.tagName,
                            properties: wrap.properties ?? {},
                            children: [{ ...node }],
                        };
                        node.tagName = wrapper.tagName;
                        node.properties = wrapper.properties;
                        node.children = wrapper.children as any;
                    }

                    if (unwrap) {
                        const child = node.children?.[0] as any;
                        if (child?.type === "element") {
                            node.tagName = child.tagName;
                            node.properties = child.properties ?? {};
                            node.children = child.children ?? [];
                        }
                    }
                }

                // Atributos / clases / estilos / dataset
                node.properties ||= {};
                applyAttributes(node.properties, rule.attributes);
                applyClasses(node.properties, rule.classes);
                applyStyle(node.properties, rule.style);
                applyDataset(node.properties, rule.dataset);
            }
        }
    };
}
