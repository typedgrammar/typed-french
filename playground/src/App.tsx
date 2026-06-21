import { lazy, Suspense, useEffect, useState } from "react";
import Concepts from "./components/Concepts";
import Tutorial from "./components/Tutorial";
import Playground from "./components/Playground";
import Glossary from "./components/Glossary";
import Eval from "./components/Eval";
import { useLang } from "./context/lang";
import { useTheme } from "./context/theme";
import { useRoute } from "./context/route";

// Client-only floating font panel — kept out of the server prerender.
const FontLab = lazy(() => import("./components/FontLab"));

const TAB_BASE =
  "inline-flex items-center gap-[7px] px-[18px] py-[9px] border rounded-full cursor-pointer text-[0.9rem] font-bold transition-all duration-[140ms]";
const tabState = (on: boolean) =>
  on
    ? "border-azur-500 bg-azur-500 text-on-accent shadow-pop"
    : "border-border bg-surface text-ink-500 hover:text-azur-600 hover:border-border-strong";

const LANG_BASE =
  "border-0 text-[0.8rem] font-bold px-3 py-1.5 cursor-pointer transition-[background,color] duration-[120ms]";
const langState = (on: boolean) =>
  on
    ? "bg-azur-500 text-on-accent"
    : "bg-surface text-ink-500 hover:text-azur-600";

export default function App() {
  const { lang, setLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { route, navigate } = useRoute();
  const tab = route.tab;
  // Mount the client-only font panel after hydration (never during prerender).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col min-h-full max-w-[1280px] mx-auto px-5">
      <header className="flex items-center justify-between gap-4 px-1 pt-[22px] pb-4">
        <div className="flex items-center gap-3.5">
          <span className="text-[2.4rem] leading-none [filter:drop-shadow(var(--shadow-md))]">
            ⚜️
          </span>
          <div>
            <h1 className="m-0 font-heading text-[1.4rem] font-extrabold tracking-[-0.01em] bg-[linear-gradient(120deg,var(--azur-600),var(--azur-400))] bg-clip-text text-transparent">
              Typed French
            </h1>
            <p className="mt-[3px] mb-0 text-[0.85rem] text-ink-500 max-w-[52ch]">
              {t(
                "Learn French grammar as TypeScript types.",
                "用 TypeScript 类型学法语语法。"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            className="flex border border-border-strong rounded-full overflow-hidden"
            role="group"
            aria-label="Language"
          >
            <button
              className={`${LANG_BASE} ${langState(lang === "en")}`}
              onClick={() => setLang("en")}
            >
              EN
            </button>
            <button
              className={`${LANG_BASE} ${langState(lang === "zh")}`}
              onClick={() => setLang("zh")}
            >
              中文
            </button>
          </div>
          <button
            className="flex-none inline-flex items-center justify-center w-[34px] h-[34px] border border-border-strong bg-surface text-ink-500 rounded-full cursor-pointer transition-[color,border-color,background] duration-150 hover:text-azur-600 hover:border-azur-400 hover:bg-surface-2"
            onClick={toggleTheme}
            aria-label={t("Toggle dark mode", "切换深色模式")}
            title={t("Toggle dark mode", "切换深色模式")}
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <a
            className="flex-none inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-azur-600 no-underline px-[13px] py-[7px] border border-border-strong rounded-full transition-[background] duration-150 hover:bg-surface-2"
            href="https://github.com/typedgrammar/typed-french"
            target="_blank"
            rel="noreferrer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </div>
      </header>

      <nav className="flex gap-2 mb-[18px]">
        <button
          className={`${TAB_BASE} ${tabState(tab === "concepts")}`}
          onClick={() => navigate({ tab: "concepts" })}
        >
          {t("Foundations", "原理")}
        </button>
        <button
          className={`${TAB_BASE} ${tabState(tab === "tutorial")}`}
          onClick={() => navigate({ tab: "tutorial" })}
        >
          {t("Grammar Course", "语法教程")}
        </button>
        <button
          className={`${TAB_BASE} ${tabState(tab === "glossary")}`}
          onClick={() => navigate({ tab: "glossary" })}
        >
          {t("Glossary", "词汇表")}
        </button>
        <button
          className={`${TAB_BASE} ${tabState(tab === "playground")}`}
          onClick={() => navigate({ tab: "playground" })}
        >
          {t("Playground", "演练场")}
        </button>
        <button
          className={`${TAB_BASE} ${tabState(tab === "eval")}`}
          onClick={() => navigate({ tab: "eval" })}
        >
          {t("Eval", "评测")}
        </button>
      </nav>

      <main className="flex-1 pt-1.5 pb-4">
        {tab === "concepts" && <Concepts />}
        {tab === "tutorial" && <Tutorial />}
        {tab === "glossary" && <Glossary />}
        {tab === "playground" && <Playground />}
        {tab === "eval" && <Eval />}
      </main>

      <footer className="px-1 pt-[18px] pb-[26px] text-center text-[0.78rem] text-ink-300">
        {t(
          "Conjugations resolved by TypeScript's type system — grammar you can verify.",
          "所有活用变形都由 TypeScript 类型系统推导 —— 可被编译器验证的语法。"
        )}
      </footer>

      {mounted && (
        <Suspense fallback={null}>
          <FontLab />
        </Suspense>
      )}
    </div>
  );
}
