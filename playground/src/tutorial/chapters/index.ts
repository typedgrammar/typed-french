import type { Chapter } from "../types";

// Auto-collect every chapter module under chapters/. Each file default-exports a
// Chapter. Robust to chapters being added or removed.
const modules = import.meta.glob<{ default: Chapter }>("./*.ts", {
  eager: true,
});

export const CHAPTERS: Chapter[] = Object.values(modules)
  .map((m) => m.default)
  .filter((c): c is Chapter => Boolean(c && c.id && c.points))
  .sort((a, b) => a.order - b.order);
