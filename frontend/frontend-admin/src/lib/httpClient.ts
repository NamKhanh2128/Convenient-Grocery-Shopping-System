/**
 * httpClient.ts
 * Lightweight HTTP client for admin API calls to the real backend.
 * Automatically attaches Authorization header from localStorage session.
 */

/**
 * Normalize VITE_API_BASE_URL so paths like `/api/admin/...` never become `/api/api/...`.
 * Accepts `http://localhost:3000`, `http://localhost:3000/api`, or empty (Vite proxy).
 */
function normalizeBaseUrl(value?: string): string {
  if (!value) return "";
  return value.replace(/\/+$/, "").replace(/\/api$/i, "");
}

// In development with empty base URL, Vite proxy forwards /api/* and /auth/* to backend:3000.
// In production, set VITE_API_BASE_URL to the deployed backend origin (without trailing /api).
const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

function getToken(): string | null {
  try {
    const session = localStorage.getItem("nateat.session");
    if (session) {
      const parsed = JSON.parse(session) as { token?: string };
      return parsed?.token ?? null;
    }
    return localStorage.getItem("nateat.token");
  } catch {
    return null;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (json as { message?: string } | null)?.message ??
      `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return json as T;
}

export const http = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
