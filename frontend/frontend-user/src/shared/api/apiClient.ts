import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { getSession } from "@/shared/lib/mockDb";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const session = getSession();
  const token = session?.token ?? localStorage.getItem("nateat.token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function unwrapApiData<T>(response: AxiosResponse<ApiEnvelope<T>>): T {
  const body = response.data;
  if (!body?.success) {
    throw new Error(body?.message || "Yêu cầu API thất bại.");
  }
  return body.data;
}
