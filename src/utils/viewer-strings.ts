/* Textos del visor de fotos (src/scripts/batucada/viewer.ts), que no conoce
   idiomas: las plantillas con `{index}`/`{count}` viajan sin rellenar y las
   completa el visor. Los usan el mapa de Batucada y la galería de cada
   actividad. */
import type { ViewerStrings } from "../scripts/batucada/viewer";
import type { useTranslations } from "../i18n";

export const viewerStrings = (t: ReturnType<typeof useTranslations>): ViewerStrings => ({
    label: t("viewer.label"),
    close: t("viewer.close"),
    previous: t("viewer.previous"),
    next: t("viewer.next"),
    zoomIn: t("viewer.zoomIn"),
    zoomOut: t("viewer.zoomOut"),
    goTo: t("viewer.goTo"),
    position: t("viewer.position"),
});
