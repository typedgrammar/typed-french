import type { Gender, PartOfSpeech } from "./types";

/**
 * Pull the content words (nouns, verbs, adjectives, pronouns) out of an
 * example's Typed French snippet. The snippets follow a consistent shape, so
 * lightweight regexes are reliable here — and synchronous, so cards can render
 * word lists without invoking the compiler.
 *
 * Verbs are stored under their infinitive: an `ErVerb<"parl">` surfaces as the
 * headword "parler" (stem + group ending), matching the dictionary.
 */
export interface ExtractedWord {
  word: string;
  pos: PartOfSpeech;
  gender?: Gender;
}

export function extractWords(code: string): ExtractedWord[] {
  const found: ExtractedWord[] = [];
  const seen = new Set<string>();
  const push = (word: string, pos: PartOfSpeech, gender?: Gender) => {
    if (word && !seen.has(word)) {
      seen.add(word);
      found.push(gender ? { word, pos, gender } : { word, pos });
    }
  };

  // Nouns carry gender: CommonNoun<"chat", "m">
  for (const m of code.matchAll(/CommonNoun<\s*"([^"]+)"\s*,\s*"([mf])"\s*>/g))
    push(m[1]!, "noun", m[2] as Gender);
  // CommonNoun<"X"> with no gender given
  for (const m of code.matchAll(/CommonNoun<\s*"([^"]+)"\s*>/g)) push(m[1]!, "noun");
  for (const m of code.matchAll(/ProperNoun<\s*"([^"]+)"\s*>/g)) push(m[1]!, "proper-noun");
  for (const m of code.matchAll(/Pronoun<\s*"([^"]+)"\s*>/g)) push(m[1]!, "pronoun");
  for (const m of code.matchAll(/Adjective<\s*"([^"]+)"\s*>/g)) push(m[1]!, "adjective");
  for (const m of code.matchAll(/Adverb<\s*"([^"]+)"\s*>/g)) push(m[1]!, "adverb");

  // Verbs — reconstruct the infinitive from stem + group.
  for (const m of code.matchAll(/ErVerb<\s*"([^"]+)"\s*>/g)) push(`${m[1]!}er`, "verb-er");
  for (const m of code.matchAll(/IrVerb<\s*"([^"]+)"\s*>/g)) push(`${m[1]!}ir`, "verb-ir");
  for (const m of code.matchAll(/ReVerb<\s*"([^"]+)"\s*>/g)) push(`${m[1]!}re`, "verb-re");
  for (const m of code.matchAll(/IrregularVerb<\s*"([^"]+)"\s*>/g)) push(m[1]!, "verb-irregular");

  return found;
}
