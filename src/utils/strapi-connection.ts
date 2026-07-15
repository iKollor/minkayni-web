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

const TRANSIENT_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const PROBE_QUERY = `
  query ValidateConnection {
    posts(pagination: { page: 1, pageSize: 1 }, status: PUBLISHED) {
      documentId
    }
  }
`;

const wait = (delayMs: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, delayMs));

const redact = (value: unknown, token: string) => {
  const message = String(value ?? "");
  return token ? message.split(token).join("[REDACTED]") : message;
};

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

  const attemptLimit = Math.max(1, maxAttempts);

  for (let attempt = 1; attempt <= attemptLimit; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apollo-require-preflight": "true",
          "x-apollo-operation-name": "ValidateConnection",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          operationName: "ValidateConnection",
          query: PROBE_QUERY,
        }),
        signal: controller.signal,
      });

      const bodyText = await response.text();
      let payload: unknown;
      try {
        payload = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        if (TRANSIENT_STATUSES.has(response.status) && attempt < attemptLimit) {
          if (retryDelayMs > 0) await wait(retryDelayMs * attempt);
          continue;
        }

        return {
          ok: false,
          status: response.status,
          message: redact(
            `HTTP ${response.status}: ${bodyText.slice(0, 300)}`,
            accessToken
          ),
          elapsedMs: Date.now() - start,
          attempts: attempt,
        };
      }

      if (!payload || typeof payload !== "object") {
        return {
          ok: false,
          status: response.status,
          message: "Strapi devolvió una respuesta que no es JSON.",
          elapsedMs: Date.now() - start,
          attempts: attempt,
        };
      }

      const result = payload as {
        data?: { posts?: unknown };
        errors?: Array<{ message?: unknown }>;
      };

      if (result.errors?.length) {
        return {
          ok: false,
          status: response.status,
          message: redact(
            `GraphQL errors: ${result.errors
              .map((error) => String(error.message ?? "Error desconocido"))
              .join("; ")}`,
            accessToken
          ),
          elapsedMs: Date.now() - start,
          attempts: attempt,
        };
      }

      if (result.data && Object.hasOwn(result.data, "posts")) {
        return {
          ok: true,
          status: response.status,
          elapsedMs: Date.now() - start,
          attempts: attempt,
        };
      }

      return {
        ok: false,
        status: response.status,
        message: "Strapi devolvió una respuesta GraphQL inesperada.",
        elapsedMs: Date.now() - start,
        attempts: attempt,
      };
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      if (attempt < attemptLimit) {
        if (retryDelayMs > 0) await wait(retryDelayMs * attempt);
        continue;
      }

      return {
        ok: false,
        message: redact(
          isAbort
            ? `Timeout después de ${timeoutMs}ms.`
            : error instanceof Error
              ? error.message
              : error,
          accessToken
        ),
        elapsedMs: Date.now() - start,
        attempts: attempt,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    ok: false,
    message: "No se pudo conectar con Strapi.",
    elapsedMs: Date.now() - start,
    attempts: attemptLimit,
  };
}
