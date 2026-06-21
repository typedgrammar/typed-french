import { useMemo, type ReactNode } from "react";
import { ARTICLES } from "../concepts";
import type {
  ConceptArticle,
  ConceptBlock,
  DiagramNode,
} from "../concepts/types";
import { CHAPTERS } from "../tutorial/chapters";
import { LEVEL_META } from "../tutorial/levels";
import { useLang } from "../context/lang";
import { useRoute } from "../context/route";
import styles from "./Concepts.module.css";

/** Render a run of paragraphs with inline `code` and **bold** spans. */
function RichText({ text }: { text: string }): ReactNode {
  return (
    <>
      {text.split(/\n\s*\n/).map((para, i) => (
        <p key={i} className={styles.para}>
          {renderInline(para)}
        </p>
      ))}
    </>
  );
}

/** Inline markup: `code` and **bold**, in one pass. */
function renderInline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((seg, j) => {
    if (seg.startsWith("`") && seg.endsWith("`")) {
      return (
        <code key={j} className="tj-code">
          {seg.slice(1, -1)}
        </code>
      );
    }
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return <strong key={j}>{seg.slice(2, -2)}</strong>;
    }
    return <span key={j}>{seg}</span>;
  });
}

// --- tiny TypeScript/JS highlighter -----------------------------------------
// The snippets are deliberately simple (comments, strings, a few keywords), so a
// small left-to-right scanner is enough — no dependency. French only ever
// appears inside strings or comments, which are matched before anything else.
const KEYWORDS = new Set([
  "const", "let", "type", "interface", "extends", "return", "import", "from",
  "as", "true", "false", "null",
]);

function classifyWord(
  word: string,
  nextNonSpace: string
): string | null | undefined {
  if (KEYWORDS.has(word)) return "text-cat-particle font-semibold";
  if (/^[A-Z]/.test(word)) return "text-cat-verb";
  if (nextNonSpace === "(") return "text-cat-phrase";
  return null;
}

function highlightLine(line: string, lineKey: string): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let n = 0;
  const push = (cls: string | null | undefined, text: string) =>
    out.push(
      cls ? (
        <span key={`${lineKey}-${n++}`} className={cls}>
          {text}
        </span>
      ) : (
        <span key={`${lineKey}-${n++}`}>{text}</span>
      )
    );

  while (i < line.length) {
    const rest = line.slice(i);
    if (rest.startsWith("//")) {
      push("text-ink-500 italic", rest);
      break;
    }
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') j++;
      push("text-cat-noun", line.slice(i, Math.min(j + 1, line.length)));
      i = j + 1;
      continue;
    }
    const word = /^[A-Za-z_$][\w$]*/.exec(rest);
    if (word) {
      const w = word[0];
      let k = i + w.length;
      while (k < line.length && line[k] === " ") k++;
      push(classifyWord(w, line[k] ?? ""), w);
      i += w.length;
      continue;
    }
    const num = /^\d+/.exec(rest);
    if (num) {
      push("text-cat-conjugation", num[0]);
      i += num[0].length;
      continue;
    }
    const space = /^\s+/.exec(rest);
    if (space) {
      push(null, space[0]);
      i += space[0].length;
      continue;
    }
    const punct = /^[^\w\s"]+/.exec(rest);
    if (punct) {
      push("text-ink-500", punct[0]);
      i += punct[0].length;
      continue;
    }
    push(null, line[i] ?? "");
    i += 1;
  }
  return out;
}

function CodeBlock({ code }: { code: string }): ReactNode {
  const lines = code.split("\n");
  return (
    <pre className="m-0 px-4 py-3.5 bg-code-bg font-mono text-[0.86rem] leading-[1.6] text-ink-700 overflow-x-auto whitespace-pre [tab-size:2]">
      <code>
        {lines.map((ln, idx) => (
          <span key={idx}>
            {highlightLine(ln, String(idx))}
            {idx < lines.length - 1 ? "\n" : null}
          </span>
        ))}
      </code>
    </pre>
  );
}

export default function Concepts() {
  const { lang, t } = useLang();
  const { route, navigate } = useRoute();

  const chapterById = useMemo(
    () => new Map(CHAPTERS.map((c) => [c.id, c])),
    []
  );

  const active = useMemo(
    () =>
      ARTICLES.find((a) => a.id === route.article) ?? ARTICLES[0] ?? null,
    [route.article]
  );

  if (ARTICLES.length === 0) {
    return <p className="tj-subtle">No articles yet.</p>;
  }

  /** "Where this is taught" — chips deep-linking into the Grammar Course. */
  function ChapterLinks({ ids }: { ids: string[] }): ReactNode {
    const chapters = ids
      .map((id) => chapterById.get(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
    if (chapters.length === 0) return null;
    return (
      <div className="max-w-[72ch] mt-4 mb-1 flex flex-col gap-2">
        <span className="text-[0.72rem] font-extrabold tracking-[0.05em] uppercase text-ink-500">
          {t("Learn it in the Course", "在教程里学")}
        </span>
        <div className="flex flex-wrap gap-2">
          {chapters.map((c) => (
            <button
              key={c.id}
              type="button"
              className={styles.chapterChip}
              onClick={() => navigate({ tab: "tutorial", chapter: c.id })}
              title={t("Open this chapter", "打开该章节")}
            >
              <span className="text-[0.95rem]">
                {LEVEL_META[c.level].emoji}
              </span>
              <span>{t(c.titleEn, c.titleZh)}</span>
              <span className={styles.chapterChipArrow}>→</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /** Recursively render a composition diagram node (clause = box, leaf = chip). */
  function renderDia(node: DiagramNode, key: string): ReactNode {
    const role =
      node.roleEn || node.roleZh
        ? t(node.roleEn ?? "", node.roleZh ?? "")
        : null;
    if (node.args && node.args.length) {
      return (
        <div key={key} className={styles.diaClause}>
          {role && (
            <span className="text-[0.68rem] font-extrabold tracking-[0.03em] uppercase text-azur-600">
              {role}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {node.args.map((a, i) => renderDia(a, `${key}.${i}`))}
            <span className="font-mono text-ink-300 font-bold">→</span>
            <span className={`inline-flex flex-col items-center gap-[3px] ${styles.diaVerb}`}>
              <span className={`fr ${styles.diaWord}`}>{node.label}</span>
            </span>
            {node.tag && (
              <span className="fr text-[0.82rem] font-bold text-azur-600">
                {node.tag}
              </span>
            )}
          </div>
        </div>
      );
    }
    return (
      <span key={key} className="inline-flex flex-col items-center gap-[3px]">
        <span className="inline-flex items-baseline gap-[3px] px-[9px] py-[5px] border border-border-strong rounded-full bg-surface">
          <span className={`fr ${styles.diaWord}`}>{node.label}</span>
          {node.tag && (
            <span className="fr text-[0.82rem] font-bold text-azur-600">
              {node.tag}
            </span>
          )}
        </span>
        {role && (
          <span className="text-[0.7rem] text-ink-500 text-center">{role}</span>
        )}
      </span>
    );
  }

  function Block({ block }: { block: ConceptBlock }): ReactNode {
    switch (block.kind) {
      case "prose":
        return <RichText text={t(block.en, block.zh)} />;
      case "define":
        return (
          <div className="max-w-[72ch] my-3.5 px-[18px] py-3.5 bg-code-bg border border-border-strong border-l-4 border-l-azur-400 rounded-field">
            <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mb-1.5">
              <span className="fr text-[1.35rem] font-extrabold text-ink-900">{block.term}</span>
              {block.ipa && (
                <span className="fr text-[0.92rem] text-ink-500">
                  {block.ipa}
                </span>
              )}
            </div>
            <p className="m-0 leading-[1.65] text-ink-700 text-[0.95rem]">{renderInline(t(block.en, block.zh))}</p>
          </div>
        );
      case "compare":
        return (
          <div className="max-w-[72ch] my-4 border border-border-strong rounded-card overflow-hidden bg-surface">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 px-4 pt-3 pb-2">
              <span className="fr text-[1.4rem] font-bold text-ink-900">{block.fr}</span>
              {block.ipa && (
                <span className="fr text-[0.9rem] text-ink-500">
                  {block.ipa}
                </span>
              )}
            </div>
            <div className="px-4 pb-3 text-[0.95rem] text-ink-500 border-b border-border">{t(block.en, block.zh)}</div>
            <CodeBlock code={lang === "zh" ? block.tsZh : block.tsEn} />
            {(block.noteEn || block.noteZh) && (
              <p className="m-0 px-4 pt-[11px] pb-[13px] text-[0.9rem] leading-[1.6] text-ink-700 bg-surface-2 border-t border-border">
                {renderInline(t(block.noteEn ?? "", block.noteZh ?? ""))}
              </p>
            )}
          </div>
        );
      case "breakdown":
        return (
          <div className="max-w-[72ch] my-4 border border-border-strong rounded-card overflow-hidden bg-surface">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 px-4 py-3.5 bg-surface-2 border-b border-border">
              <span className="fr text-[1.45rem] font-extrabold text-ink-900">{block.fr}</span>
              {block.ipa && (
                <span className="fr text-[0.9rem] text-ink-500">
                  {block.ipa}
                </span>
              )}
              <span className="basis-full text-[0.92rem] text-ink-500 leading-[1.5]">{t(block.en, block.zh)}</span>
            </div>
            <div className="flex flex-col py-2">
              {block.layers.map((ly, k) => (
                <div
                  key={k}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-[7px] border-l-2 border-border-strong my-0.5"
                  style={{ marginLeft: `${(ly.depth ?? 0) * 22}px` }}
                >
                  <span className="fr text-[1.12rem] font-bold text-azur-600 min-w-[8ch]">
                    {ly.fragment}
                  </span>
                  <span className="text-[0.9rem] text-ink-700 leading-[1.5]">
                    {renderInline(t(ly.en, ly.zh))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      case "example":
        return (
          <div className="max-w-[72ch] my-3.5 px-4 py-3 bg-surface border border-border rounded-field flex flex-wrap items-baseline gap-x-[14px] gap-y-1.5">
            <span className="fr text-[1.3rem] font-bold text-ink-900">{block.fr}</span>
            {block.ipa && (
              <span className="fr text-[0.9rem] text-ink-500">
                {block.ipa}
              </span>
            )}
            <span className="basis-full text-[0.92rem] text-ink-500 leading-[1.55]">
              {renderInline(t(block.en, block.zh))}
            </span>
          </div>
        );
      case "diagram":
        return (
          <div className="max-w-[72ch] my-4 p-4 border border-border-strong rounded-card bg-surface">
            {(block.captionEn || block.captionZh) && (
              <div className="text-[0.9rem] text-ink-500 leading-[1.55] mb-3">
                {renderInline(t(block.captionEn ?? "", block.captionZh ?? ""))}
              </div>
            )}
            <div className="overflow-x-auto">
              {block.row ? (
                <div className="flex flex-wrap items-center gap-2">
                  {block.row.map((n, i) => renderDia(n, `d${i}`))}
                </div>
              ) : block.root ? (
                renderDia(block.root, "d")
              ) : null}
            </div>
          </div>
        );
      case "chapters":
        return <ChapterLinks ids={block.ids} />;
    }
  }

  return (
    <div className="grid grid-cols-[268px_1fr] gap-5 items-start max-[760px]:grid-cols-1">
      {/* ---- sidebar: article list ---- */}
      <aside className="sticky top-4 flex flex-col gap-2.5 max-[760px]:static">
        <div className="text-[0.74rem] font-extrabold tracking-[0.04em] uppercase text-ink-500 px-2 py-1">{t("Foundations", "原理")}</div>
        <nav className="flex flex-col gap-1">
          {ARTICLES.map((a: ConceptArticle) => (
            <button
              key={a.id}
              type="button"
              className={`flex items-center gap-2.5 text-left px-[11px] py-2.5 border rounded-field cursor-pointer transition-all duration-[120ms] ${
                a.id === active?.id
                  ? "bg-azur-100 border-border-strong text-azur-600"
                  : "border-transparent bg-transparent text-ink-700 hover:bg-surface-2"
              }`}
              onClick={() => navigate({ article: a.id })}
            >
              <span className="text-[0.9rem] font-bold leading-[1.25]">
                {t(a.titleEn, a.titleZh)}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ---- article ---- */}
      <article className="min-w-0 pb-12">
        {active && (
          <>
            <header className="mb-2">
              <h2 className="mt-1 mb-2 text-[1.9rem] font-extrabold text-ink-900 leading-[1.2]">
                {t(active.titleEn, active.titleZh)}
              </h2>
              <p className="mt-0 mb-[18px] text-azur-600 text-[1.02rem] font-semibold max-w-[64ch]">
                {t(active.taglineEn, active.taglineZh)}
              </p>
              <div className={styles.intro}>
                <RichText text={t(active.introEn, active.introZh)} />
              </div>
            </header>

            {(() => {
              let n = 0;
              return active.sections.map((sec) => {
                const numbered = sec.numbered !== false;
                if (numbered) n += 1;
                return (
                  <section key={sec.id} className="my-[30px] pt-[22px] border-t border-border">
                    <h3 className="mt-0 mb-3 flex flex-col gap-2 items-start">
                      {numbered && (
                        <span className="inline-block text-[0.7rem] font-extrabold tracking-[0.06em] uppercase text-on-accent bg-azur-500 px-2.5 py-[3px] rounded-full">
                          {t("Principle", "原理")} {n}
                        </span>
                      )}
                      <span className="text-[1.3rem] font-extrabold text-ink-900 leading-[1.3]">
                        {t(sec.headingEn, sec.headingZh)}
                      </span>
                    </h3>
                    {sec.blocks.map((b, i) => (
                      <Block key={i} block={b} />
                    ))}
                  </section>
                );
              });
            })()}
          </>
        )}
      </article>
    </div>
  );
}
