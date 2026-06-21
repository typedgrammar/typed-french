/**
 * Content model for the grammar tutorial. Each chapter file under
 * tutorial/chapters/ default-exports a `Chapter`. All explanatory prose is
 * bilingual (English + 简体中文). Every example carries a self-contained Typed
 * French `code` snippet whose last type alias resolves to the sentence — that
 * is what the Analyzer parses and decomposes.
 */
export type Level = "elementary" | "intermediate" | "advanced";

export interface Example {
  /** Full French sentence (display + selection target), e.g. "Le chat est noir." */
  fr: string;
  /** IPA pronunciation, optional. */
  ipa?: string;
  en: string;
  zh: string;
  /**
   * Self-contained Typed French: imports + word definitions + a final type
   * alias that resolves to `fr`. Parsed by the Analyzer into a structure tree.
   */
  code: string;
}

export interface GrammarPoint {
  id: string;
  titleEn: string;
  titleZh: string;
  /** Markdown-ish explanation (paragraphs separated by blank lines). */
  bodyEn: string;
  bodyZh: string;
  examples: Example[];
}

export interface Chapter {
  /** Stable id, also the filename, e.g. "e01". */
  id: string;
  level: Level;
  /** Order within the level. */
  order: number;
  titleEn: string;
  titleZh: string;
  summaryEn: string;
  summaryZh: string;
  points: GrammarPoint[];
}

/**
 * One occurrence of a vocab word in a tutorial example, as stored in the
 * build-time reverse index (tutorial/reverseIndex.generated.ts). Lets the
 * glossary answer "which example sentences reference this word?".
 */
export interface ExampleRef {
  chapterId: string;
  chapterTitleEn: string;
  chapterTitleZh: string;
  pointTitleEn: string;
  pointTitleZh: string;
  /** DOM id of the example card — see {@link exampleAnchorId}. */
  anchor: string;
  /** The French sentence, used as the link label. */
  fr: string;
}

/** Stable DOM id for an example card, shared by the renderer and the indexer. */
export const exampleAnchorId = (
  chapterId: string,
  pointId: string,
  index: number
): string => `ex-${chapterId}-${pointId}-${index}`;
