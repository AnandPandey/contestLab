/** Error thrown for non-2xx API responses, carrying the server's error envelope. */
export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: { path: string; message: string }[] = [],
  ) {
    super(message);
  }

  /** Field-level messages keyed by dotted path, for inline form errors. */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const d of this.details) if (d.path && !out[d.path]) out[d.path] = d.message;
    return out;
  }
}

/** Browser-side JSON fetch against our own API routes. */
export async function apiFetch<T>(path: string, init: { method?: string; body?: unknown } = {}) {
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers: init.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error;
    throw new ApiClientError(
      res.status,
      err?.code ?? "http_error",
      err?.message ?? `Request failed (${res.status})`,
      Array.isArray(err?.details) ? err.details : [],
    );
  }
  return data as T;
}

export function errorMessage(err: unknown) {
  if (err instanceof ApiClientError) {
    const first = err.details[0];
    return first ? `${err.message}: ${first.path ? `${first.path} — ` : ""}${first.message}` : err.message;
  }
  return "Something went wrong. Check your connection and try again.";
}
