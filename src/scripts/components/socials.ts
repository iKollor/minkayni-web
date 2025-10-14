import type { Footer } from "../../schemas/strapi.graphql.zod";

// Mapa de iconos por red social (reutilizable)
export const SOCIAL_ICON_BY_NETWORK = {
    facebook: "mdi:facebook",
    instagram: "mdi:instagram",
    twitter: "mdi:twitter",
    tiktok: "ic:baseline-tiktok",
} as const;

export type SocialNetwork = keyof typeof SOCIAL_ICON_BY_NETWORK;

export interface SocialItem {
    href: string;
    icon: (typeof SOCIAL_ICON_BY_NETWORK)[SocialNetwork];
    label: string;
}

/**
 * Construye la lista de elementos sociales a partir de Footer.Socials
 * Filtra redes sin URL y normaliza las etiquetas (Twitter -> X (Twitter))
 */
export function buildSocialItems(socials: Footer["Socials"] | undefined | null): SocialItem[] {
    if (!socials) return [];

    const networks: ReadonlyArray<SocialNetwork> = ["facebook", "instagram", "twitter", "tiktok"] as const;

    return networks
        .filter((net) => Boolean((socials as any)[net]))
        .map((net) => {
            const href = String((socials as any)[net]);
            const icon = SOCIAL_ICON_BY_NETWORK[net];
            const label = net === "twitter" ? "X (Twitter)" : net.charAt(0).toUpperCase() + net.slice(1);
            return { href, icon, label } satisfies SocialItem;
        });
}
