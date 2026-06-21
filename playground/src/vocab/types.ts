/**
 * Vocabulary table schema. The dictionary is the single source of truth for how
 * every word in the tutorial is spelled, its gender (for nouns), and what it
 * means. A compiler check (scripts/verify-vocab.mjs) guarantees every word used
 * in the course's Typed French snippets indexes into this table.
 */
export type PartOfSpeech =
  | "noun"
  | "proper-noun"
  | "pronoun"
  | "article"
  | "determiner"
  | "verb-er"
  | "verb-ir"
  | "verb-re"
  | "verb-irregular"
  | "adjective"
  | "adverb"
  | "preposition"
  | "conjunction"
  | "interjection"
  | "numeral"
  | "negation"
  | "expression";

export type Gender = "m" | "f";

export interface VocabEntry {
  /** Headword — the exact surface used in the tutorial (citation form). */
  word: string;
  /** Grammatical gender, for nouns. */
  gender?: Gender;
  /** IPA pronunciation, optional. */
  ipa?: string;
  pos: PartOfSpeech;
  en: string;
  zh: string;
}

export const POS_LABEL: Record<PartOfSpeech, { en: string; zh: string }> = {
  noun: { en: "noun", zh: "名词" },
  "proper-noun": { en: "proper noun", zh: "专有名词" },
  pronoun: { en: "pronoun", zh: "代词" },
  article: { en: "article", zh: "冠词" },
  determiner: { en: "determiner", zh: "限定词" },
  "verb-er": { en: "-er verb", zh: "第一组动词 (-er)" },
  "verb-ir": { en: "-ir verb", zh: "第二组动词 (-ir)" },
  "verb-re": { en: "-re verb", zh: "第三组动词 (-re)" },
  "verb-irregular": { en: "irregular verb", zh: "不规则动词" },
  adjective: { en: "adjective", zh: "形容词" },
  adverb: { en: "adverb", zh: "副词" },
  preposition: { en: "preposition", zh: "介词" },
  conjunction: { en: "conjunction", zh: "连词" },
  interjection: { en: "interjection", zh: "感叹词" },
  numeral: { en: "numeral", zh: "数词" },
  negation: { en: "negation", zh: "否定词" },
  expression: { en: "expression", zh: "短语" },
};

export const GENDER_LABEL: Record<Gender, { en: string; zh: string; abbr: string }> = {
  m: { en: "masculine", zh: "阳性", abbr: "m." },
  f: { en: "feminine", zh: "阴性", abbr: "f." },
};
