// src/schemas/navigation.ts
import { z, type ZodType, type ZodTypeDef } from "zod";

/** SALIDA (lo que usa tu app) */
export type NavItem = {
    title: string;
    type?: "INTERNAL" | "EXTERNAL" | "WRAPPER";
    menuAttached?: boolean;
    path?: string; // salida: nunca null
    slug?: string;
    uiRouterKey?: string;
    external?: boolean;
    related?: unknown;
    audience?: unknown[];
    items?: NavItem[];

    /** objeto con tus custom fields (selects, flags, etc.) */
    additionalFields?: Record<string, string | number | boolean | string[] | number[] | boolean[]>;
};

/** ENTRADA (desde Strapi; puede traer nulls) */
export type NavItemInput = Omit<NavItem, "path" | "items" | "additionalFields"> & {
    path?: string | null;
    items?: NavItemInput[];
    // valores pueden venir null
    additionalFields?: Record<string, string | number | boolean | (string | number | boolean)[] | null> | null;
};

export type NavTree = NavItem[];
type NavTreeInput = NavItemInput[];

/* primitivos permitidos */
const Prim = z.union([z.string(), z.number(), z.boolean()]);

/** additionalFields:
 *  - input: Record<string, Prim | Prim[] | null> | null | undefined
 *  - output: Record<string, Prim | Prim[]> | undefined (filtra keys con null)
 */
const AdditionalFieldsSchema: ZodType<Record<string, string | number | boolean | string[] | number[] | boolean[]> | undefined, ZodTypeDef, Record<string, string | number | boolean | (string | number | boolean)[] | null> | null | undefined> = z
    .record(z.string(), z.union([Prim, z.array(Prim), z.null()]))
    .nullable()
    .optional()
    .transform((obj) => {
        if (!obj) return undefined;
        const out: Record<string, string | number | boolean | string[] | number[] | boolean[]> = {};
        for (const [k, v] of Object.entries(obj)) {
            if (v === null) continue; // quitamos claves con null
            out[k] = v as any; // v es Prim o Prim[]
        }
        return Object.keys(out).length ? out : undefined;
    });

/** Schema recursivo principal */
export const NavItemSchema: ZodType<NavItem, ZodTypeDef, NavItemInput> = z.lazy(() =>
    z
        .object({
            title: z.string().min(1),
            type: z.enum(["INTERNAL", "EXTERNAL", "WRAPPER"]).optional(),
            menuAttached: z.boolean().optional(),

            // ENTRADA: string | null | undefined  →  SALIDA: string | undefined
            path: z
                .string()
                .nullable()
                .optional()
                .transform((v) => v ?? undefined),

            slug: z.string().optional(),
            uiRouterKey: z.string().optional(),
            external: z.boolean().optional(),
            related: z.unknown().optional(),
            audience: z.array(z.unknown()).optional(),

            items: z
                .array(z.lazy(() => NavItemSchema))
                .optional()
                .default([]),

            // ✅ objeto additionalFields con valores primitivos (filtra nulls, nunca undefined en values)
            additionalFields: AdditionalFieldsSchema,
        })
        // Si el plugin te “plana” algunos fields extra al nivel raíz, los aceptamos como primitivos o arrays
        .catchall(z.union([Prim, z.array(Prim)]))
        .passthrough()
        .refine((i) => i.type !== "EXTERNAL" || i.external === true, {
            message: "Los items EXTERNAL deben marcarse con external=true",
        })
        .refine((i) => i.type !== "WRAPPER" || Array.isArray(i.items), {
            message: "WRAPPER debería tener items (puede ser array vacío)",
        })
);

/** Árbol tipado */
export const NavigationTreeSchema: ZodType<NavTree, ZodTypeDef, NavTreeInput> = z.array(NavItemSchema);

export type NavigationTree = NavTree;
