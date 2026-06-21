import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useRoute, type Lang } from "./route";

export type { Lang };

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** pick the right string for the current language */
  t: (en: string, zh: string) => string;
}

const Ctx = createContext<LangCtx | null>(null);
const STORAGE_KEY = "tf-lang";

/**
 * Language lives in the route (the URL), so switching it is a navigable action
 * with Back / Forward support and is shareable. We mirror the choice to
 * localStorage so a fresh visit (no `lang` in the URL) restores the last pick.
 */
export function LangProvider({ children }: { children: ReactNode }) {
  const { route, navigate } = useRoute();
  const lang = route.lang;

  const setLang = useCallback(
    (l: Lang) => {
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, l);
      navigate({ lang: l });
    },
    [navigate]
  );

  const t = useCallback(
    (en: string, zh: string) => (lang === "zh" ? zh : en),
    [lang]
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
