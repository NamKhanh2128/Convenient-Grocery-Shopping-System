import { AxiosError } from "axios";

export function getErrorMessage(error: unknown, fallback = "Có lỗi xảy ra, vui lòng thử lại."): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
