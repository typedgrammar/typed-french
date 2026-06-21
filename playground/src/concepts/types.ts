/**
 * Content model for "Foundations" (原理) — standalone concept articles that
 * explain the *architecture* of French rather than walking the grammar
 * syllabus. They are independent from the grammar Course, the Glossary and the
 * Playground, and they deep-link INTO the Course chapters where each idea is
 * drilled.
 *
 * Every string is bilingual (English + 简体中文). Prose supports inline `code`
 * spans (backticks) and **bold** spans.
 */

/** A block inside a section. Discriminated on `kind` so the renderer can switch. */
export type ConceptBlock =
  // A run of paragraphs (split on blank lines). Supports `code` and **bold**.
  | { kind: "prose"; en: string; zh: string }
  // A defined term — rendered as a callout so a beginner never meets a jargon
  // word (le genre, l'accord, le partitif …) without its definition right there.
  | {
      kind: "define";
      term: string;
      ipa?: string;
      en: string;
      zh: string;
    }
  // The core teaching unit: one thought shown three ways — the French, its
  // English counterpart, and a small piece of TypeScript that makes the
  // structural difference concrete. The TS is per-language so the comments are
  // in the reader's language; it is syntax-highlighted by the renderer.
  | {
      kind: "compare";
      fr: string;
      ipa?: string;
      en: string;
      zh: string;
      /** Lightweight, readable TypeScript with English comments. */
      tsEn: string;
      /** Same code, comments in 简体中文. */
      tsZh: string;
      noteEn?: string;
      noteZh?: string;
    }
  // Peel a complex sentence apart, layer by layer, to show the principles
  // composing. Each layer is a French fragment with a role gloss; `depth`
  // indents nested clauses.
  | {
      kind: "breakdown";
      fr: string;
      ipa?: string;
      en: string;
      zh: string;
      layers: { fragment: string; depth?: number; en: string; zh: string }[];
    }
  // A node-composition diagram: a clause is a verb (function) applied to tagged
  // arguments; a clause can itself be an argument of another, so it nests. See
  // {@link DiagramNode}.
  | {
      kind: "diagram";
      captionEn?: string;
      captionZh?: string;
      /** A composition tree (clause with nested args). */
      root?: DiagramNode;
      /** OR a flat row of independent chips (e.g. one verb in several forms). */
      row?: DiagramNode[];
    }
  // A plain French example line (display only).
  | { kind: "example"; fr: string; ipa?: string; en: string; zh: string }
  // "Where this is taught" — links into Course chapters by id (e.g. "e01").
  | { kind: "chapters"; ids: string[] };

/**
 * One node in a composition diagram.
 * - A **leaf** (no `args`) is a tagged argument — a noun chip plus its determiner.
 * - A **clause** (has `args`) is a box whose `label` is the verb that closes it;
 *   its `args` render inside, and an arg may itself be a clause — that's nesting.
 */
export interface DiagramNode {
  /** French surface: a noun for a leaf, or the verb for a clause. */
  label: string;
  /** Determiner / preposition attached to this node (le / une / à / de …), shown as a chip. */
  tag?: string;
  /** Short role gloss shown under the chip. */
  roleEn?: string;
  roleZh?: string;
  /** Argument nodes. Present ⇒ this node is a clause and `label` is its verb. */
  args?: DiagramNode[];
}

export interface ConceptSection {
  id: string;
  /** Section heading. The renderer prefixes an auto-numbered "Principle N". */
  headingEn: string;
  headingZh: string;
  /** Default true. Set false for non-principle sections (e.g. a closing path). */
  numbered?: boolean;
  blocks: ConceptBlock[];
}

export interface ConceptArticle {
  /** Stable id / slug, also the filename, e.g. "architecture". */
  id: string;
  /** Order in the Foundations list. */
  order: number;
  titleEn: string;
  titleZh: string;
  /** One-line hook for the list and header. */
  taglineEn: string;
  taglineZh: string;
  /** Lead paragraph(s) under the title. Supports `code` and **bold**. */
  introEn: string;
  introZh: string;
  sections: ConceptSection[];
}
