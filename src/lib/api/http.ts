/**
 * Minimal typed fetch client. Used by repositories when a real API is present.
 * Kept intentionally tiny — swap for openapi-fetch / ky / tanstack-query if the
 * surface grows.
 */

const BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? '';

/** True when a backend base URL is configured — repositories branch on this. */
export const API_ENABLED = BASE_URL.length > 0;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiGet<T>(
  path: string,
  init?: RequestInit & { params?: Record<string, string | number | undefined> }
): Promise<T> {
  const url = new URL(path.replace(/^\//, ''), BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/');

  if (init?.params) {
    for (const [k, v] of Object.entries(init.params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  });

  if (!res.ok) {
    throw new ApiError(res.status, `GET ${url.pathname} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}
