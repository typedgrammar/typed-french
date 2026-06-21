import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CHAPTERS } from "../tutorial/chapters";
import { LEVEL_META } from "../tutorial/levels";
import { exampleAnchorId, type Chapter, type Example, type Level } from "../tutorial/types";
import { useLang } from "../context/lang";
import { useRoute } from "../context/route";
import { extractWords } from "../vocab/extract";
import VocabWord from "./VocabWord";
import styles from "./Tutorial.module.css";

// Monaco-backed; lazy so it stays out of the server prerender.
const Analyzer = lazy(() => import("./Analyzer"));

// Layout effects don't run on the server; fall back to useEffect there to avoid
// the SSR warning (this effect is client-only — it scrolls/flashes an example).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const LEVELS: Level[] = ["elementary", "intermediate", "advanced"];

/** Render text with `code` spans and paragraph breaks. */
function RichText({ text }: { text: string }): ReactNode {
  return (
    <>
      {text.split(/\n\s*\n/).map((para, i) => (
        <p key={i} className="my-2 leading-[1.7] text-ink-700">
          {para.split(/(`[^`]+`)/).map((seg, j) =>
            seg.startsWith("`") && seg.endsWith("`") ? (
              <code key={j} className="tj-code">
                {seg.slice(1, -1)}
              </code>
            ) : (
              <span key={j}>{seg}</span>
            )
          )}
        </p>
      ))}
    </>
  );
}

export default function Tutorial() {
  const { lang, t } = useLang();
  const { route, navigate } = useRoute();
  const [query, setQuery] = useState("");
  // The selected chapter is driven by the URL, so Back / Forward move between
  // chapters and a deep-link (Foundations / Glossary) lands on the right one.
  const activeId =
    route.chapter && CHAPTERS.some((c) => c.id === route.chapter)
      ? route.chapter
      : CHAPTERS[0]?.id ?? "";
  const [drawerExample, setDrawerExample] = useState<Example | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const pendingAnchor = useRef<string | null>(null);

  // The route can point at an example (a Glossary "used in" link). Capture the
  // anchor, then strip it from the URL so re-clicking the same link re-fires.
  useEffect(() => {
    if (!route.ex) return;
    pendingAnchor.current = route.ex;
    navigate({ ex: undefined }, { replace: true });
  }, [route.ex, navigate]);

  // After the target chapter has rendered, scroll the example into view and
  // flash it. Runs after every render until the anchor element exists.
  useIsoLayoutEffect(() => {
    const anchor = pendingAnchor.current;
    if (!anchor) return;
    const el = document.getElementById(anchor);
    if (!el) return;
    pendingAnchor.current = null;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlash(anchor);
    const timer = window.setTimeout(
      () => setFlash((f) => (f === anchor ? null : f)),
      1800
    );
    return () => window.clearTimeout(timer);
  });

  const byLevel = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups: Record<Level, Chapter[]> = {
      elementary: [],
      intermediate: [],
      advanced: [],
    };
    for (const c of CHAPTERS) {
      const hay = `${c.titleEn} ${c.titleZh} ${c.id}`.toLowerCase();
      if (!q || hay.includes(q)) groups[c.level].push(c);
    }
    for (const l of LEVELS)
      groups[l].sort((a, b) => a.order - b.order);
    return groups;
  }, [query]);

  const active = useMemo(
    () => CHAPTERS.find((c) => c.id === activeId) ?? CHAPTERS[0] ?? null,
    [activeId]
  );

  const openExample = (ex: Example) => {
    setDrawerExample(ex);
    setDrawerOpen(true);
  };

  if (CHAPTERS.length === 0) {
    return <p className="tj-subtle">No chapters found.</p>;
  }

  return (
    <div className="grid grid-cols-[268px_1fr] gap-5 items-start max-[900px]:grid-cols-1">
      {/* ---- sidebar ---- */}
      <aside className="sticky top-4 max-h-[calc(100vh-32px)] flex flex-col gap-3 overflow-hidden max-[900px]:static max-[900px]:max-h-none">
        <input
          className="tj-input flex-none"
          placeholder={t("Search chapters…", "搜索章节…")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <nav className="overflow-y-auto pr-1 flex flex-col gap-4 max-[900px]:max-h-[240px]">
          {LEVELS.map((level) => {
            const chapters = byLevel[level];
            if (chapters.length === 0) return null;
            const meta = LEVEL_META[level];
            return (
              <div key={level} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-[0.74rem] font-extrabold tracking-[0.04em] uppercase text-ink-500 px-2 py-1">
                  <span>{meta.emoji}</span>
                  {t(meta.en, meta.zh)}
                  <span className="fr ml-auto text-ink-300">{meta.fr}</span>
                </div>
                {chapters.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`flex items-baseline gap-[9px] text-left px-[9px] py-[7px] border-none rounded-field cursor-pointer text-[0.88rem] leading-[1.3] transition-[background,color] duration-[120ms] ${
                      c.id === activeId
                        ? "bg-azur-100 text-azur-600 font-bold"
                        : "bg-transparent text-ink-700 hover:bg-surface-2"
                    }`}
                    onClick={() => navigate({ chapter: c.id })}
                  >
                    <span className="flex-none font-mono text-[0.72rem] text-ink-300 min-w-[1.4em] text-right">{c.order}</span>
                    <span>{t(c.titleEn, c.titleZh)}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ---- chapter content ---- */}
      <article className="min-w-0 pb-10">
        {active && (
          <>
            <header className="mb-[22px]">
              <span className="tj-chip mb-2">
                {LEVEL_META[active.level].emoji} {t(LEVEL_META[active.level].en, LEVEL_META[active.level].zh)} · {active.order}
              </span>
              <h2 className="mt-1 mb-1.5 font-heading text-[1.7rem] font-extrabold text-ink-900">{t(active.titleEn, active.titleZh)}</h2>
              <p className="m-0 text-ink-500 text-[0.98rem] max-w-[70ch]">{t(active.summaryEn, active.summaryZh)}</p>
            </header>

            {active.id === CHAPTERS[0]?.id && (
              <button
                type="button"
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 w-full max-w-[72ch] mt-[18px] mb-1 px-4 py-[13px] text-left cursor-pointer bg-azur-50 border border-border-strong border-l-4 border-l-azur-400 rounded-field transition-[background,border-color,transform] duration-[120ms] hover:bg-azur-100 hover:border-azur-400 hover:-translate-y-px"
                onClick={() =>
                  navigate({ tab: "concepts", article: "architecture" })
                }
              >
                <span className="flex-[1_1_22ch] text-[0.92rem] leading-[1.55] text-ink-700">
                  {t(
                    "New to French? Read the Foundations primer first — it shows how a sentence is built, the way you'd learn a programming language.",
                    "刚接触法语？建议先读一遍《原理》—— 它会像学编程语言那样，讲清楚一句法语是怎么搭起来的。"
                  )}
                </span>
                <span className="flex-none text-[0.88rem] font-bold whitespace-nowrap text-azur-600">
                  {t("Open Foundations", "打开原理")} →
                </span>
              </button>
            )}

            {active.points.map((pt) => (
              <section key={pt.id} className="my-[26px] pt-[18px] border-t border-border">
                <h3 className="mt-0 mb-2 font-heading text-[1.2rem] font-bold text-azur-600">{t(pt.titleEn, pt.titleZh)}</h3>
                <div className="max-w-[72ch]">
                  <RichText text={t(pt.bodyEn, pt.bodyZh)} />
                </div>

                <div className="flex flex-col gap-2.5 mt-4">
                  {pt.examples.map((ex, i) => {
                    const anchor = exampleAnchorId(active.id, pt.id, i);
                    return (
                    <div
                      key={i}
                      id={anchor}
                      className={`tj-card flex flex-wrap items-baseline gap-x-[14px] gap-y-1.5 px-4 py-3 scroll-mt-4 ${flash === anchor ? styles.exampleFlash : ""}`}
                    >
                      <button
                        type="button"
                        className="fr text-[1.3rem] font-bold text-ink-900 bg-none border-none p-0 cursor-pointer text-left border-b-2 border-dashed border-border-strong transition-[color,border-color] duration-[120ms] hover:text-azur-600 hover:border-azur-400"
                        onClick={() => openExample(ex)}
                        title={t("Analyze in Typed French", "用 Typed French 解析")}
                      >
                        {ex.fr}
                      </button>
                      {ex.ipa && (
                        <span className="fr text-[0.9rem] text-ink-500">{ex.ipa}</span>
                      )}
                      <span className="basis-full text-[0.92rem] text-ink-700">{lang === "zh" ? ex.zh : ex.en}</span>
                      <button
                        type="button"
                        className="tj-btn ml-auto self-center flex-none text-[0.82rem] px-3 py-[5px]"
                        onClick={() => openExample(ex)}
                      >
                        🔬 {t("Analyze", "解析")}
                      </button>
                      <div className="basis-full flex flex-wrap items-center gap-1.5 mt-1.5 pt-2.5 border-t border-dashed border-border">
                        <span className="text-[0.68rem] font-extrabold tracking-[0.04em] uppercase text-ink-300 mr-0.5">{t("Words", "词汇")}</span>
                        {extractWords(ex.code).map((w, k) => (
                          <VocabWord key={k} word={w.word} />
                        ))}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </>
        )}
      </article>

      {/* ---- analyzer drawer ---- */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-scrim z-40" onClick={() => setDrawerOpen(false)} />
      )}
      <aside className={`fixed top-0 right-0 h-screen w-[min(760px,94vw)] bg-paper border-l border-border shadow-drawer z-[41] transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-border">
          <h3 className="tj-panel-title">{t("Structure", "结构解析")}</h3>
          <button type="button" className="tj-btn" onClick={() => setDrawerOpen(false)}>
            {t("Close", "关闭")} ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {drawerExample && (
            <Suspense fallback={<p className="tj-subtle">Loading…</p>}>
              <Analyzer
                code={drawerExample.code}
                gloss={lang === "zh" ? drawerExample.zh : drawerExample.en}
              />
            </Suspense>
          )}
        </div>
      </aside>
    </div>
  );
}
