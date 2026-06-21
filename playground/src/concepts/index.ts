import type { ConceptArticle } from "./types";

// Auto-collect every article module under articles/. Each file default-exports a
// ConceptArticle. Robust to articles being added or removed.
const modules = import.meta.glob<{ default: ConceptArticle }>(
  "./articles/*.ts",
  { eager: true }
);

export const ARTICLES: ConceptArticle[] = Object.values(modules)
  .map((m) => m.default)
  .filter((a): a is ConceptArticle => Boolean(a && a.id && a.sections))
  .sort((a, b) => a.order - b.order);
