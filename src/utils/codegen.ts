import "dotenv/config";
import type { CodegenConfig } from "@graphql-codegen/cli";

// STRAPI_GRAPHQL_URL directa, o derivada de STRAPI_URL.
const resolveGraphqlUrl = (): string => {
    const strapiUrl = process.env.STRAPI_URL?.trim().replace(/\/+$/, "");
    const url = process.env.STRAPI_GRAPHQL_URL ?? (strapiUrl ? `${strapiUrl}/graphql` : undefined);
    if (!url) throw new Error("Falta STRAPI_GRAPHQL_URL o STRAPI_URL");
    return url;
};
const url = resolveGraphqlUrl();

const token = process.env.STRAPI_TOKEN ?? "";

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
