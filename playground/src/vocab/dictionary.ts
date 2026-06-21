import type { VocabEntry } from "./types";
import { FUNCTION_WORDS } from "./function-words";

/**
 * The merged vocabulary table: hand-maintained grammar words plus all content
 * words authored under entries/. Keyed by headword. The compiler check in
 * scripts/verify-vocab.mjs guarantees every word the course uses is present.
 */
const entryModules = import.meta.glob<{ default: VocabEntry[] }>("./entries/*.ts", {
  eager: true,
});

const authored: VocabEntry[] = Object.values(entryModules).flatMap(
  (m) => m.default ?? []
);

export const VOCAB = new Map<string, VocabEntry>();
// Authored content words first; function words fill any gaps without overriding.
for (const entry of [...authored, ...FUNCTION_WORDS]) {
  if (entry?.word && !VOCAB.has(entry.word)) VOCAB.set(entry.word, entry);
}

export const VOCAB_LIST: VocabEntry[] = [...VOCAB.values()].sort((a, b) =>
  a.word.localeCompare(b.word, "fr")
);

export function lookup(word: string): VocabEntry | undefined {
  return VOCAB.get(word);
}
