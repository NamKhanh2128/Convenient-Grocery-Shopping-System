// COPIED EXACTLY from src/shared/utils/storage.ts
export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string) {
    localStorage.removeItem(key);
  },
};

export function uid(prefix = "id") {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function wait(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const delay = wait;
