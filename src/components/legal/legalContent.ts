/* ──────────────────────────────────────────────────────────────────────────
   Datos de transparencia legal: leen el single type `legal-transparency`
   de Strapi y lo mezclan sobre el fallback local (src/data/pages/legal.ts).

   Lo usan las dos presentaciones del bloque:
   - Opción A: components/legal/LegalFooterBand.astro  (franja del footer)
   - Opción B: pages/transparencia.astro               (página dedicada)
─────────────────────────────────────────────────────────────────────────── */
import { legalFallback, type LegalContent } from "@/data/pages/legal";
import { loadPageContent } from "@/utils/page-content";
import { strapiMediaUrl } from "@/utils/media-url";

export type LegalRow = { label: string; value: string };

export async function getLegalContent(): Promise<LegalContent> {
    return loadPageContent("legalTransparency", legalFallback);
}

/** Dirección oficial en una sola línea (la que leen los verificadores). */
export function formatAddress(d: LegalContent): string {
    return [d.addressStreet, d.addressLocality, d.addressRegion, d.addressCountry].map((part) => (part ?? "").trim()).filter(Boolean).join(", ");
}

/** Identidad legal mínima: lo que exigen Goodstack, TechSoup, Google y Microsoft. */
export function coreRows(d: LegalContent): LegalRow[] {
    return [
        { label: "Nombre legal", value: d.legalName },
        { label: "RUC", value: d.ruc },
        { label: "Personería jurídica", value: d.ministryResolution },
        { label: "Registro SUIOS", value: d.suiosCode },
    ].filter((row): row is LegalRow => Boolean(row.value));
}

/** Identidad legal ampliada (página dedicada). */
export function fullRows(d: LegalContent): LegalRow[] {
    const extra = (d.records ?? []).map((r) => ({ label: r?.label ?? "", value: r?.value ?? "" }));
    return [
        ...coreRows(d),
        { label: "Naturaleza jurídica", value: d.legalForm },
        { label: "Estado de la organización", value: d.legalStatus },
        { label: "Fecha de constitución", value: d.incorporationDate },
        { label: "Representante legal", value: d.legalRepresentative },
        { label: "Directiva registrada", value: d.boardRegistration },
        { label: "Actividad económica (CIIU)", value: d.economicActivity },
        ...extra,
    ].filter((row): row is LegalRow => Boolean(row.label && row.value));
}

/** URL pública de un PDF subido al CMS (o del asset local si ya es absoluta). */
export function documentUrl(url: string | null | undefined): string {
    return strapiMediaUrl(url, import.meta.env.STRAPI_URL ?? "", 0);
}

/** Organización en JSON-LD (schema.org/NGO) para los bots de verificación. */
export function organizationJsonLd(d: LegalContent, siteUrl: string) {
    const address = {
        "@type": "PostalAddress",
        streetAddress: d.addressStreet,
        addressLocality: d.addressLocality,
        addressRegion: d.addressRegion,
        addressCountry: "EC",
    };

    return {
        "@context": "https://schema.org",
        "@type": "NGO",
        name: d.legalName,
        alternateName: d.tradeName || undefined,
        legalName: d.legalName,
        url: d.website || siteUrl,
        email: d.email || undefined,
        telephone: d.phone || undefined,
        taxID: d.ruc || undefined,
        vatID: d.ruc || undefined,
        nonprofitStatus: "NonprofitANBI",
        foundingDate: "2020-06-30",
        address,
        location: { "@type": "Place", address },
        identifier: [
            d.ruc ? { "@type": "PropertyValue", name: "RUC (SRI Ecuador)", value: d.ruc } : null,
            d.suiosCode ? { "@type": "PropertyValue", name: "Registro SUIOS", value: d.suiosCode.split("—")[0].trim() } : null,
            d.ministryResolution ? { "@type": "PropertyValue", name: "Resolución MIES", value: d.ministryResolution } : null,
        ].filter(Boolean),
        contactPoint: d.email
            ? [{ "@type": "ContactPoint", contactType: "legal", email: d.email, areaServed: "EC", availableLanguage: ["es", "en"] }]
            : undefined,
    };
}
