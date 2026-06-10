// Language store — COPIED EXACTLY from src/shared/store/languageStore.ts
import { create } from "zustand";
import { translations, type Lang, type TranslationKey } from "@/lib/i18n";

const LANG_KEY = "nateat.lang";

interface LanguageStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

export const useLanguageStore = create<LanguageStore>((set, get) => ({
  lang: (localStorage.getItem(LANG_KEY) as Lang | null) ?? "vi",
  setLang: (lang) => {
    localStorage.setItem(LANG_KEY, lang);
    set({ lang });
  },
  t: (key) => translations[get().lang][key] as string,
}));

/** Shorthand hook — returns only the `t` function, re-renders on lang change */
export function useT() {
  return useLanguageStore((s) => s.t);
}
