/* ──────────────────────────────────────────────────────────────────────────
   Respuesta al aviso de cookies: dónde se guarda y qué se le dice a Google.

   Una sola fuente para las dos mitades del asunto —el aviso que pregunta
   (components/CookieConsent.astro) y la etiqueta que mide
   (components/Analytics.astro)—, para que no puedan decir cosas distintas.

   Las señales son las del modo de consentimiento de Google. Las cuatro que
   dependen de la respuesta son las que la versión 2 exige para medir y para
   anunciarse; `security_storage` va siempre concedida porque es lo que
   protege la propia petición, y `functionality_storage` también: no hay nada
   que personalizar aquí, pero negarla rompería funciones sin ganar nada. */

export type Consentimiento = "concedido" | "denegado";

/** Clave en `localStorage`. No es una cookie: no viaja a ningún servidor. */
export const CLAVE_CONSENTIMIENTO = "minkayni-consentimiento";

/** Señales que cambian con la respuesta. */
export const SENALES_VARIABLES = ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"] as const;

/** Regiones donde las señales parten DENEGADAS hasta que la persona responda:
    el Espacio Económico Europeo, Reino Unido y Suiza, donde la ley exige
    consentimiento previo para medir con cookies. En el resto del mundo —el
    Ecuador y quien nos visita desde América, sobre todo— parten concedidas y
    el aviso deja apagarlas. Tenerlas denegadas para todo el planeta hacía que
    Google viera un 0% de consentimiento fuera de Europa y lo marcara como un
    problema crítico de la propiedad: sin señales, ni informes de audiencia
    ni exportación de conversiones a Google Ads, que es para lo que está. */
export const REGIONES_CONSENTIMIENTO_PREVIO = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
    "IS", "LI", "NO",
    "GB", "CH",
] as const;

/** Señales que valen lo mismo se responda lo que se responda. */
export const SENALES_FIJAS = { functionality_storage: "granted", security_storage: "granted" } as const;

/** El paquete completo de señales para una respuesta. */
export function senales(respuesta: Consentimiento): Record<string, "granted" | "denied"> {
    const valor = respuesta === "concedido" ? "granted" : "denied";
    return {
        ...Object.fromEntries(SENALES_VARIABLES.map((senal) => [senal, valor])),
        ...SENALES_FIJAS,
    };
}

/** La respuesta guardada, o `null` si todavía no hay ninguna. */
export function leerConsentimiento(): Consentimiento | null {
    try {
        const guardado = localStorage.getItem(CLAVE_CONSENTIMIENTO);
        return guardado === "concedido" || guardado === "denegado" ? guardado : null;
    } catch {
        /* Navegación privada, almacenamiento bloqueado: se pregunta otra vez,
           que es lo prudente cuando no se puede recordar la respuesta. */
        return null;
    }
}
