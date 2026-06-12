import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { getSession } from "@/shared/lib/mockDb";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const ACCESS_TOKEN_KEY = "nateat.token";
const REFRESH_TOKEN_KEY = "nateat.refreshToken";

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

function getAccessToken(): string | null {
  const session = getSession();
  return session?.token ?? localStorage.getItem(ACCESS_TOKEN_KEY);
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function clearSessionAndRedirect() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  // Avoid redirect loop if we're already on the login page.
  if (!window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
}

// Shared refresh promise so multiple concurrent 401s only trigger one refresh.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  try {
    // Bare axios call (no interceptors) to avoid recursion.
    const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    const newToken: string | undefined = res.data?.accessToken;
    if (!newToken) return null;
    localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
    return newToken;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Only attempt a refresh on the first 401 for a given request.
    if (status === 401 && original && !original._retry) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;

      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }

      // Refresh failed → session truly expired.
      clearSessionAndRedirect();
    }

    return Promise.reject(error);
  },
);

export function unwrapApiData<T>(response: AxiosResponse<ApiEnvelope<T>>): T {
  const body = response.data;
  if (!body?.success) {
    throw new Error(body?.message || "Yêu cầu API thất bại.");
  }
  return body.data;
}
