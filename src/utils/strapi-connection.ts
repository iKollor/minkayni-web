import { excerpt, graphqlHeaders, redact, strapiFetch } from "./strapi-client";

export type ValidateResult = {
  ok: boolean;
  status?: number;
  message?: string;
  elapsedMs: number;
  attempts: number;
};

type ValidateOptions = {
  endpoint: string;
  token: string;
  timeoutMs?: number;
  maxAttempts?: number;
  retryDelayMs?: number;
  fetchImpl?: typeof fetch;
};

const PROBE_QUERY = `
  query ValidateConnection {
    posts(pagination: { page: 1, pageSize: 1 }, status: PUBLISHED) {
      documentId
    }
  }
`;

export async function validateStrapiConnection({
  endpoint,
  token,
  timeoutMs = 8_000,
  maxAttempts = 3,
  retryDelayMs = 250,
  fetchImpl = fetch,
}: ValidateOptions): Promise<ValidateResult> {
  const start = Date.now();
  const url = endpoint.trim();
  const accessToken = token.trim();

  if (!url.startsWith("http") || !accessToken) {
    return {
      ok: false,
      message: "Configuración de Strapi incompleta o inválida.",
      elapsedMs: Date.now() - start,
      attempts: 0,
    };
  }

  const fail = (message: string, attempts: number, status?: number): ValidateResult => ({
    ok: false,
    status,
    message: redact(message, accessToken),
    elapsedMs: Date.now() - start,
    attempts,
  });

  let response;
  try {
    response = await strapiFetch(url, {
      headers: graphqlHeaders("ValidateConnection", { Authorization: `Bearer ${accessToken}` }),
      body: JSON.stringify({ operationName: "ValidateConnection", query: PROBE_QUERY }),
      timeoutMs,
      maxAttempts,
      retryDelayMs,
      secret: accessToken,
      fetchImpl,
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error), Math.max(1, maxAttempts));
  }

  const { status, attempts, text } = response;
  if (!response.ok) return fail(`HTTP ${status}: ${excerpt(text, accessToken)}`, attempts, status);

  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  if (!payload || typeof payload !== "object")
    return fail("Strapi devolvió una respuesta que no es JSON.", attempts, status);

  const result = payload as {
    data?: { posts?: unknown };
    errors?: Array<{ message?: unknown }>;
  };

  if (result.errors?.length)
    return fail(
      `GraphQL errors: ${result.errors.map((error) => String(error.message ?? "Error desconocido")).join("; ")}`,
      attempts,
      status
    );

  if (result.data && Object.hasOwn(result.data, "posts"))
    return { ok: true, status, elapsedMs: Date.now() - start, attempts };

  return fail("Strapi devolvió una respuesta GraphQL inesperada.", attempts, status);
}
