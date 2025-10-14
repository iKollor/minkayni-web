// scripts/strapi-codegen.ts
import "dotenv/config";
import { codegen } from "@graphql-codegen/core";
import { loadSchema } from "@graphql-tools/load";
import { UrlLoader } from "@graphql-tools/url-loader";
import { mapSchema, MapperKind, pruneSchema } from "@graphql-tools/utils";
import { GraphQLSchema, getNamedType, printSchema, parse, isListType, isNonNullType, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLUnionType, GraphQLEnumType, GraphQLScalarType, GraphQLInterfaceType, GraphQLInputObjectType, type GraphQLNamedType, type GraphQLOutputType } from "graphql";
import * as fs from "node:fs/promises";
import * as validationPlugin from "graphql-codegen-typescript-validation-schema";

const url = process.env.STRAPI_GRAPHQL_URL ?? process.env.STRAPI_URL?.replace(/\/$/, "") + "/graphql";
if (!url) throw new Error("Falta STRAPI_GRAPHQL_URL o STRAPI_URL");

const headers = process.env.STRAPI_TOKEN ? { Authorization: `Bearer ${process.env.STRAPI_TOKEN}` } : {};

const DEBUG = String(process.env.STRAPI_CODEGEN_DEBUG ?? "") === "1";

const banned = new Set(["localizations", "localizations_connection", "related", "parent", "children", "createdBy", "updatedBy"]);

/* ───────── helpers de tipos ───────── */

function isOutputNamedType(t: GraphQLNamedType): t is GraphQLObjectType | GraphQLUnionType | GraphQLEnumType | GraphQLScalarType | GraphQLInterfaceType {
    return t instanceof GraphQLObjectType || t instanceof GraphQLUnionType || t instanceof GraphQLEnumType || t instanceof GraphQLScalarType || t instanceof GraphQLInterfaceType;
}

function rebuildTypeLike(original: GraphQLOutputType, replacementOutput: GraphQLOutputType): GraphQLOutputType {
    if (isNonNullType(original)) {
        return new GraphQLNonNull(rebuildTypeLike(original.ofType as GraphQLOutputType, replacementOutput));
    }
    if (isListType(original)) {
        return new GraphQLList(rebuildTypeLike(original.ofType as GraphQLOutputType, replacementOutput));
    }
    return replacementOutput;
}

/* ───────── auto-detección de componentes ───────── */

const COMPONENT_PREFIXES = ["ComponentSections", "ComponentShared", "ComponentGlobal", "Component"];

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function singularizeBasic(s: string) {
    const l = s.toLowerCase();
    if (l.endsWith("ies")) return s.slice(0, -3) + "y"; // testimonies -> testimony
    if (l.endsWith("ses")) return s.slice(0, -2); // classes -> class
    if (l.endsWith("s") && !l.endsWith("ss")) return s.slice(0, -1); // teams -> team
    return s;
}

function nameCandidatesFromField(fieldName: string) {
    const forms = new Set<string>([fieldName, singularizeBasic(fieldName), capitalize(fieldName), capitalize(singularizeBasic(fieldName))]);
    const cands: string[] = [];
    for (const base of forms) {
        for (const pref of COMPONENT_PREFIXES) cands.push(`${pref}${base}`);
    }
    return Array.from(new Set(cands));
}

function buildComponentSet(schema: GraphQLSchema) {
    const typeMap = schema.getTypeMap();
    const set = new Set<string>();
    for (const name in typeMap) {
        const t = typeMap[name];
        if (t instanceof GraphQLObjectType) {
            if (COMPONENT_PREFIXES.some((p) => name.startsWith(p))) set.add(name);
        }
    }
    return set;
}

function autoApplyComponentOverrides(schema: GraphQLSchema): GraphQLSchema {
    const componentNames = buildComponentSet(schema);

    if (DEBUG) {
        const comps = Array.from(componentNames).sort();
        console.log(`[codegen] Tipos Component* detectados (${comps.length}):\n  - ${comps.join("\n  - ")}`);
        // Dump de campos de Homepage para ver sus tipos reales
        const homepage = schema.getType("Homepage");
        if (homepage && homepage instanceof GraphQLObjectType) {
            console.log("[codegen] Homepage fields:");
            for (const f of Object.values(homepage.getFields())) {
                const named = getNamedType(f.type);
                console.log(`  • ${f.name}: ${named.toString()}`);
            }
        } else {
            console.log("[codegen] No existe tipo 'Homepage' como objeto.");
        }
    }

    if (!componentNames.size) {
        console.warn("[codegen] No se detectaron tipos Component* en el schema.");
        return schema;
    }

    const remapped: string[] = [];

    const out = mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName, typeName) => {
            if (fieldName.endsWith("_connection") || banned.has(fieldName)) return fieldConfig;

            const named = getNamedType(fieldConfig.type);

            // ya es componente o DZ → no tocar
            if (named instanceof GraphQLUnionType || COMPONENT_PREFIXES.some((p) => named.name.startsWith(p))) {
                return fieldConfig;
            }

            const candidates = nameCandidatesFromField(fieldName).filter((n) => componentNames.has(n));
            if (candidates.length === 0) return fieldConfig;

            // prioridad: Sections > Shared > Global > Component
            const preferred = [...candidates].sort((a, b) => {
                const ra = COMPONENT_PREFIXES.findIndex((p) => a.startsWith(p));
                const rb = COMPONENT_PREFIXES.findIndex((p) => b.startsWith(p));
                return ra - rb || a.localeCompare(b);
            })[0];

            const replacement = schema.getType(preferred);
            if (!replacement || !isOutputNamedType(replacement)) {
                if (DEBUG) {
                    console.warn(`[codegen] Omitido (no OUTPUT): ${typeName}.${fieldName} -> ${String(replacement)}`);
                }
                return fieldConfig;
            }

            const newType = rebuildTypeLike(fieldConfig.type as GraphQLOutputType, replacement as unknown as GraphQLOutputType);
            remapped.push(`${typeName}.${fieldName}: ${named.toString()} -> ${preferred}`);
            return { ...fieldConfig, type: newType };
        },
    });

    if (DEBUG) {
        if (remapped.length) {
            console.log(`[codegen] Auto-mapping aplicado:\n  - ${remapped.join("\n  - ")}`);
        } else {
            console.log("[codegen] Auto-mapping: sin cambios.");
        }
    }

    return out;
}

/* ───────── main ───────── */

async function main() {
    // 1) carga schema remoto
    const original = (await loadSchema(url, {
        loaders: [new UrlLoader()],
        headers,
    })) as GraphQLSchema;

    // 2) filtro anti-ruido típico de Strapi
    const stripped = mapSchema(original, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName, typeName) => {
            if (fieldName.endsWith("_connection") || banned.has(fieldName)) return null;

            const named = getNamedType(fieldConfig.type) as any;
            const namedName = named?.name;
            if (!namedName) return fieldConfig;

            if (namedName === typeName) return null;

            if (typeof namedName === "string" && (namedName.endsWith("RelationResponseCollection") || namedName.endsWith("EntityResponseCollection"))) {
                return null;
            }

            return fieldConfig;
        },
        [MapperKind.OBJECT_TYPE]: (type) => {
            const name = type.name;
            if (name.endsWith("RelationResponseCollection") || name.endsWith("EntityResponseCollection")) return null;
            return undefined;
        },
    });

    // 3) auto-remapeo por convención (y diagnóstico si DEBUG)
    const overridden = autoApplyComponentOverrides(stripped);

    // 4) prune final
    const filtered = pruneSchema(overridden);

    // 5) generar Zod
    const output = await codegen({
        filename: "src/schemas/strapi.graphql.zod.ts",
        schema: parse(printSchema(filtered)),
        schemaAst: filtered,
        documents: [],
        plugins: [{ typescript: {} }, { "typescript-validation-schema": {} }],
        pluginMap: {
            typescript: await import("@graphql-codegen/typescript"),
            "typescript-validation-schema": validationPlugin as any,
        },
        config: {
            schema: "zod",
            enumsAsTypes: true,
            withObjectType: true,
            scalarSchemas: {
                ID: "z.string()",
                DateTime: "z.string().datetime()",
                JSON: "z.any()",
                Upload: "z.any()",
            },
            avoidOptionals: false,
            nonOptionalTypename: false,
        },
    });

    await fs.writeFile("src/schemas/strapi.graphql.zod.ts", output);
    console.log("✓ Zod generado en src/schemas/strapi.graphql.zod.ts");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
