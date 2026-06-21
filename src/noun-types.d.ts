import type {
  Gender,
  Numerus,
  Pluralize,
  StartsWithVowel,
} from "./shared-types";

/**
 * Nouns and the determiners that introduce them. A French noun carries its
 * gender as part of its identity (le genre is not predictable from meaning), so
 * `CommonNoun` stores it; the article surface is then *computed* from gender,
 * number and the noun's initial letter.
 */

/** A common noun, e.g. `CommonNoun<"chat", "m">` (le chat). */
export type CommonNoun<W extends string = string, G extends Gender = Gender> = {
  type: "noun";
  word: W;
  gender: G;
};

/** A proper noun, e.g. `ProperNoun<"Marie">`. */
export type ProperNoun<W extends string = string> = {
  type: "proper-noun";
  word: W;
};

/** A bare pronoun token, e.g. `Pronoun<"je">`, `Pronoun<"elle">`. */
export type Pronoun<W extends string = string> = {
  type: "pronoun";
  word: W;
};

/** An adverb token, e.g. `Adverb<"vite">` (quickly), `Adverb<"souvent">`. */
export type Adverb<W extends string = string> = {
  type: "adverb";
  word: W;
};

type AnyNoun = CommonNoun | ProperNoun;

// ---- determiner surfaces ----------------------------------------------------

/** le / la / l' / les — the definite article. */
export type DefiniteSurface<
  W extends string,
  G extends Gender,
  N extends Numerus
> = N extends "p"
  ? "les"
  : StartsWithVowel<W> extends true
  ? "l'"
  : G extends "m"
  ? "le"
  : "la";

/** un / une / des — the indefinite article. */
export type IndefiniteSurface<
  G extends Gender,
  N extends Numerus
> = N extends "p" ? "des" : G extends "m" ? "un" : "une";

/** du / de la / de l' / des — the partitive article ("some"). */
export type PartitiveSurface<
  W extends string,
  G extends Gender,
  N extends Numerus
> = N extends "p"
  ? "des"
  : StartsWithVowel<W> extends true
  ? "de l'"
  : G extends "m"
  ? "du"
  : "de la";

// ---- noun phrases (determiner + noun, with elision + pluralization) ---------

type Surface<Noun, N extends Numerus> = Noun extends {
  word: infer W extends string;
}
  ? N extends "p"
    ? Pluralize<W>
    : W
  : never;

/** Join a determiner to a noun, dropping the space after an elided `l'`/`de l'`. */
type Join<Det extends string, Word extends string> = Det extends `${string}'`
  ? `${Det}${Word}`
  : `${Det} ${Word}`;

/** "le chat" / "l'homme" / "les chats". */
export type DefiniteNP<
  Noun extends AnyNoun,
  N extends Numerus = "s"
> = Noun extends CommonNoun<infer W, infer G>
  ? Join<DefiniteSurface<W, G, N>, Surface<Noun, N>>
  : never;

/** "un chat" / "une femme" / "des chats". */
export type IndefiniteNP<
  Noun extends AnyNoun,
  N extends Numerus = "s"
> = Noun extends CommonNoun<infer _W, infer G>
  ? `${IndefiniteSurface<G, N>} ${Surface<Noun, N>}`
  : never;

/** "du pain" / "de la confiture" / "de l'eau" / "des fruits". */
export type PartitiveNP<
  Noun extends AnyNoun,
  N extends Numerus = "s"
> = Noun extends CommonNoun<infer W, infer G>
  ? Join<PartitiveSurface<W, G, N>, Surface<Noun, N>>
  : never;
