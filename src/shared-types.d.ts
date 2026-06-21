/**
 * Shared primitives for Typed French. Gender and number drive agreement across
 * articles, nouns and adjectives; the vowel test drives elision (le → l',
 * je → j', ne → n', de → d') and is the single most pervasive rule in French
 * surface morphology.
 */

/** Grammatical gender. Every French noun is masculine or feminine. */
export type Gender = "m" | "f";

/** Grammatical number. `s` singular, `p` plural. */
export type Numerus = "s" | "p";

/**
 * Letters that trigger elision / liaison when a word begins with them. We treat
 * a leading `h` as a vowel sound (l'homme, l'heure) — the minority of "aspirate
 * h" words (le héros) are the documented exception, not the rule.
 */
export type VowelSound =
  | "a" | "e" | "i" | "o" | "u" | "y" | "h"
  | "à" | "â" | "ä" | "é" | "è" | "ê" | "ë"
  | "î" | "ï" | "ô" | "ö" | "û" | "ù" | "ü"
  | "A" | "E" | "I" | "O" | "U" | "Y" | "H"
  | "É" | "È" | "Ê" | "À" | "Â" | "Î" | "Ô" | "Û";

/** True when `W` begins with a vowel sound — the precondition for elision. */
export type StartsWithVowel<W extends string> = W extends `${VowelSound}${string}`
  ? true
  : false;

/**
 * Pluralize a noun/adjective surface. Default adds `s`; words already ending in
 * `s`/`x`/`z` are invariant; `-al` → `-aux`, `-eau`/`-eu` → `+x`.
 */
export type Pluralize<W extends string> = W extends `${string}${"s" | "x" | "z"}`
  ? W
  : W extends `${infer P}al`
  ? `${P}aux`
  : W extends `${string}${"eau" | "eu"}`
  ? `${W}x`
  : `${W}s`;
