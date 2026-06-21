import { renderToString } from "react-dom/server";
import App from "./App";
import { RouteProvider, formatPath, LANGS, type Lang, type Route } from "./context/route";
import { LangProvider } from "./context/lang";
import { ThemeProvider } from "./context/theme";
import { CHAPTERS } from "./tutorial/chapters";
import { ARTICLES } from "./concepts";
import { VOCAB_LIST } from "./vocab/dictionary";

/** Public origin for canonical / sitemap URLs (override with VITE_SITE_ORIGIN). */
const ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN || "https://typedgrammar.github.io";
const BRAND = "Typed French";

/**
 * Render the app for one route to an HTML string. No DOM, no Monaco (the
 * Analyzer is lazy and absent from the initial tree).
 */
export function render(path: string): { html: string } {
  const html = renderToString(
    <RouteProvider ssrPath={path}>
      <ThemeProvider>
        <LangProvider>
          <App />
        </LangProvider>
      </ThemeProvider>
    </RouteProvider>
  );
  return { html };
}

/** Strip markdown/whitespace and clamp for a meta description. */
function metaText(s: string, max = 155): string {
  const clean = s
    .replace(/`+/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + "…" : clean;
}

export interface RouteMeta {
  /** Canonical path incl. base + trailing slash, e.g. /typed-japanese/en/course/e01/ */
  path: string;
  lang: Lang;
  title: string;
  description: string;
  /** Absolute canonical URL. */
  canonical: string;
  /** hreflang alternates (one per language) + x-default. */
  alternates: { hreflang: string; href: string }[];
  /** schema.org JSON-LD object. */
  jsonld: Record<string, unknown>;
}

/** Every prerendered page, with its SEO metadata, both languages. */
export function getRoutes(): RouteMeta[] {
  const out: RouteMeta[] = [];

  const make = (
    partial: Omit<Route, "lang">,
    titles: { en: string; zh: string },
    descs: { en: string; zh: string },
    schemaType: string
  ) => {
    for (const lang of LANGS) {
      const route: Route = { ...partial, lang };
      const path = formatPath(route);
      const title = `${lang === "zh" ? titles.zh : titles.en} · ${BRAND}`;
      const description = metaText(lang === "zh" ? descs.zh : descs.en);
      const canonical = ORIGIN + path;
      const alternates: { hreflang: string; href: string }[] = LANGS.map(
        (l) => ({
          hreflang: l as string,
          href: ORIGIN + formatPath({ ...route, lang: l }),
        })
      );
      alternates.push({
        hreflang: "x-default",
        href: ORIGIN + formatPath({ ...route, lang: "en" }),
      });
      out.push({
        path,
        lang,
        title,
        description,
        canonical,
        alternates,
        jsonld: {
          "@context": "https://schema.org",
          "@type": schemaType,
          name: lang === "zh" ? titles.zh : titles.en,
          description,
          inLanguage: lang,
          url: canonical,
          isPartOf: { "@type": "Course", name: BRAND, url: ORIGIN + "/typed-french/" },
        },
      });
    }
  };

  // Section landing pages
  make(
    { tab: "tutorial" },
    { en: "Grammar Course", zh: "语法教程" },
    {
      en: "A French grammar course where every sentence is a TypeScript type the compiler checks — articles, gender, agreement and conjugation, all resolved at the type level.",
      zh: "一门法语语法课程，每个句子都是 TypeScript 编译器可校验的类型 —— 冠词、阴阳性、一致与动词变位，全部在类型层面求解。",
    },
    "Course"
  );
  make(
    { tab: "concepts" },
    { en: "Foundations", zh: "原理" },
    {
      en: "The architecture of French, taught like a programming language — gender and agreement, articles, word order, conjugation.",
      zh: "像学编程语言一样理解法语的架构 —— 阴阳性与一致、冠词、语序、动词变位。",
    },
    "LearningResource"
  );
  make(
    { tab: "glossary" },
    { en: "Glossary", zh: "词汇表" },
    {
      en: `Every word used in the course — ${VOCAB_LIST.length} entries with gender, part of speech and meanings, cross-linked to the sentences that use them.`,
      zh: `课程用到的全部词语 —— ${VOCAB_LIST.length} 条，含阴阳性、词性与释义，并反向链接到使用它们的句子。`,
    },
    "DefinedTermSet"
  );
  make(
    { tab: "playground" },
    { en: "Playground", zh: "演练场" },
    {
      en: "An interactive playground: write a French sentence as a TypeScript type and watch the compiler resolve and visualise its structure.",
      zh: "交互式演练场：把法语句子写成 TypeScript 类型，看编译器求值并可视化它的结构。",
    },
    "WebApplication"
  );
  make(
    { tab: "eval" },
    { en: "Parsing Eval", zh: "解析评测" },
    {
      en: "A fixed benchmark of grammar examples scored each round by independent reviewers against a six-dimension rubric — the project's quantifiable, comparable parsing-accuracy metric over time.",
      zh: "一组固定的语法示例基准，每轮由独立评审依据六维评分标准打分 —— 项目随时间可量化、可比较的解析准确度指标。",
    },
    "Dataset"
  );

  // Course chapters
  for (const c of CHAPTERS) {
    make(
      { tab: "tutorial", chapter: c.id },
      { en: c.titleEn, zh: c.titleZh },
      { en: c.summaryEn, zh: c.summaryZh },
      "LearningResource"
    );
  }

  // Foundations articles
  for (const a of ARTICLES) {
    make(
      { tab: "concepts", article: a.id },
      { en: a.titleEn, zh: a.titleZh },
      { en: a.taglineEn, zh: a.taglineZh },
      "Article"
    );
  }

  return out;
}
