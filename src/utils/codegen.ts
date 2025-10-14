// src/codegen.ts
import "dotenv/config";
import type { CodegenConfig } from "@graphql-codegen/cli";

// Puedes definir STRAPI_GRAPHQL_URL directamente,
// o derivarla desde STRAPI_URL si no está presente.
const url = process.env.STRAPI_GRAPHQL_URL ?? process.env.STRAPI_URL?.replace(/\/$/, "") + "/graphql";
if (!url) throw new Error("Falta STRAPI_GRAPHQL_URL o STRAPI_URL");

const token =
    process.env.STRAPI_TOKEN ??
    process.env.STRAPI_TOKEN ?? // por si usas este nombre en tu proyecto
    "";

const headers: Record<string, string> = {};
if (token) headers.Authorization = `Bearer ${token}`;

const config: CodegenConfig = {
    schema: [{ [url]: { headers } }],
    generates: {
        "src/schemas/strapi.graphql.zod.ts": {
            plugins: ["typescript-validation-schema"],
            config: {
                schema: "zod",
                enumsAsTypes: true,
                withObjectType: true, // genera Zod para tipos de objeto (no Query/Mutation)
                scalarSchemas: {
                    ID: "z.string()",
                    DateTime: "z.string().datetime()",
                    JSON: "z.any()",
                    Upload: "z.any()",
                },
            },
        },
    },
    ignoreNoDocuments: true,
};
export default config;
