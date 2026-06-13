/**
 * httpClient.ts
 * Lightweight HTTP client for admin API calls to the real backend.
 * Automatically attaches Authorization header from localStorage session.
 *
 * On a 401 (expired access token) it transparently refreshes the access token
 * using the stored 7-day refresh token and retries the request once. If the
 * refresh fails (refresh token also expired/revoked), it clears the session and
 * redirects back to the login page.
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

const SESSION_KEY = "nateat.session";
const ACCESS_TOKEN_KEY = "nateat.token";
const REFRESH_TOKEN_KEY = "nateat.refreshToken";

function getToken(): string | null {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      const parsed = JSON.parse(session) as { token?: string };
      return parsed?.token ?? null;
    }
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  try {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      const parsed = JSON.parse(session) as Record<string, unknown>;
      parsed.token = token;
      localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
    }
  } catch {
    /* ignore malformed session */
  }
}

function clearSessionAndRedirect() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  if (!window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
}

// Shared refresh promise so multiple concurrent 401s trigger only one refresh.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as { accessToken?: string } | null;
    if (!data?.accessToken) return null;
    saveAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
  isRetry = false,
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

  // Access token expired — attempt a single refresh + retry. Never run this for
  // the auth-flow endpoints themselves (login/me/refresh/logout): a 401 there is
  // handled by the caller (login form, bootstrap), and triggering the global
  // refresh-redirect would wipe a session that was just being established.
  const isAuthEndpoint = path.startsWith("/auth/");
  if (response.status === 401 && !isRetry && !isAuthEndpoint) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      return request<T>(method, path, body, extraHeaders, true);
    }
    clearSessionAndRedirect();
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

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
