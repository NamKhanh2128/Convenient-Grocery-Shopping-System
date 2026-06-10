// COPIED EXACTLY from src/shared/utils/date.ts
function localIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayIso() {
  return localIso(new Date());
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
