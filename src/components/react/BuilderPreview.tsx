/* ──────────────────────────────────────────────────────────────────────────
   BuilderPreview — la vista previa de borradores del constructor, para el
   botón «Vista previa» del panel de Strapi.

   El sitio es estático: una subpágina solo existe si estaba publicada al
   construir. Para ver un borrador sin servidor propio, esta isla lo pide al
   CMS desde el navegador y lo pinta con BuilderBlocks, el mismo renderizador
   de las páginas publicadas.

   Quién puede verlo: la URL la genera el propio panel (config/admin.js del
   CMS) con un token firmado que caduca a los quince minutos y solo vale para
   ese documento, idioma y estado. El CMS lo comprueba en una ruta propia
   (`/api/preview/page/:id`); sin token válido no devuelve nada.

   Diferencias con la página publicada, asumidas: el Markdown se convierte
   con `marked` en vez del pipeline de build (los atajos propios del sitio no
   se ven), y las animaciones de entrada arrancan después de pintar.
─────────────────────────────────────────────────────────────────────────── */
import { useEffect, useState } from "react";
import BuilderBlocks from "./builder/BuilderBlocks";
import { normalizeBlocks, type Block } from "./builder/normalize";
import { withFallback } from "@/utils/content";
import { localizeLinks } from "@/utils/localize-links";
import type { Locale } from "@/i18n";

interface Labels {
    badge: string;
    loading: string;
    errorAuth: string;
    errorNotFound: string;
    errorNetwork: string;
}

interface Props {
    strapiUrl: string;
    locale: Locale;
    labels: Labels;
}

type Page = { title?: string | null; sections?: unknown };
type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; title: string; blocks: Block[] };

export default function BuilderPreview({ strapiUrl, locale, labels }: Props) {
    const [state, setState] = useState<State>({ kind: "loading" });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get("id") ?? "";
        const token = params.get("t") ?? "";
        const status = params.get("status") === "published" ? "published" : "draft";
        if (!id || !token) {
            setState({ kind: "error", message: labels.errorAuth });
            return;
        }

        const controller = new AbortController();
        (async () => {
            try {
                const url = `${strapiUrl.replace(/\/$/, "")}/api/preview/page/${encodeURIComponent(id)}?locale=${locale}&status=${status}&t=${encodeURIComponent(token)}`;
                const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
                if (response.status === 401 || response.status === 403) return setState({ kind: "error", message: labels.errorAuth });
                if (response.status === 404) return setState({ kind: "error", message: labels.errorNotFound });
                if (!response.ok) return setState({ kind: "error", message: labels.errorNetwork });

                const payload = (await response.json()) as { data?: Page | null; base?: Page | null };
                if (!payload.data) return setState({ kind: "error", message: labels.errorNotFound });

                /* Misma mezcla que las páginas publicadas: en inglés, lo que
                   falte sale en español y los enlaces internos llevan /en. */
                const merged = payload.base ? withFallback(payload.base, payload.data) : payload.data;
                const page = localizeLinks(merged, locale);

                const { marked } = await import("marked");
                const blocks = normalizeBlocks(page.sections).map((block) =>
                    block.type === "richText" && block.body ? { ...block, bodyHtml: marked.parse(block.body, { async: false }) as string } : block
                );
                setState({ kind: "ready", title: page.title ?? "", blocks });
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("[vista previa]", error);
                    setState({ kind: "error", message: labels.errorNetwork });
                }
            }
        })();
        return () => controller.abort();
    }, [strapiUrl, locale, labels]);

    /* Ya pintado: los mismos arranques que una página publicada, para que
       reveals, botones y contadores se comporten igual. Los contadores los
       monta CounterMount al recibir `count:reveal` por cada cifra. */
    useEffect(() => {
        if (state.kind !== "ready") return;
        if (state.title) {
            document.title = `${state.title} · ${labels.badge}`;
            const heroTitle = document.querySelector<HTMLElement>("#hero h1");
            if (heroTitle) heroTitle.textContent = state.title;
        }
        let cancelled = false;
        Promise.all([import("@/scripts/reveals"), import("@/scripts/magic-button")]).then(([reveals, buttons]) => {
            if (cancelled) return;
            reveals.initReveals();
            buttons.initMagicButtons();
            document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => window.dispatchEvent(new CustomEvent("count:reveal", { detail: { el } })));
        });
        return () => {
            cancelled = true;
        };
    }, [state, labels.badge]);

    return (
        <>
            <p className="pointer-events-none fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-black/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-lg backdrop-blur" role="status">
                {labels.badge}
            </p>
            {state.kind === "loading" && <p className="mx-auto w-[90%] max-w-[1280px] py-24 text-center text-lg text-black/60">{labels.loading}</p>}
            {state.kind === "error" && (
                <p className="mx-auto w-[90%] max-w-[60ch] py-24 text-center text-lg leading-relaxed text-black/70" role="alert">
                    {state.message}
                </p>
            )}
            {state.kind === "ready" && <BuilderBlocks blocks={state.blocks} strapiUrl={strapiUrl} />}
        </>
    );
}
