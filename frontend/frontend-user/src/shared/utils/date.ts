function localIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayIso() {
  return localIso(new Date());
}

/** Chuẩn hóa plan_date từ API (DATE hoặc ISO timestamp) về yyyy-MM-dd theo giờ local. */
export function normalizePlanDate(value?: string | null): string {
  if (!value) return todayIso();
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return todayIso();
  return localIso(parsed);
}

export function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localIso(date);
}

export function daysUntil(dateIso: string) {
  const start = new Date(todayIso()).getTime();
  const end = new Date(dateIso).getTime();
  return Math.ceil((end - start) / 86400000);
}

export function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat("vi-VN").format(new Date(dateIso));
}

export function relativeTime(dateIso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(dateIso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  return `${hours} giờ trước`;
}
