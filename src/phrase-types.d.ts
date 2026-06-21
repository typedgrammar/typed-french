import type { ConjugateVerb, Tense, Verb } from "./verb-types";
import type { StartsWithVowel, VowelSound } from "./shared-types";
import type { PersonOf } from "./pronoun-types";

/**
 * Sentence-level composition. These types weave conjugated verbs, subjects and
 * noun phrases into a surface string, applying the three pervasive sandhi rules
 * of written French: je-elision (je → j'), ne-elision (ne → n'), and final
 * capitalization + punctuation.
 */

/** "je parle" / "j'aime" — subject pronoun + verb, eliding je before a vowel. */
export type SubjectVerb<
  Subj extends string,
  V extends Verb,
  T extends Tense = "Present"
> = ConjugateVerb<V, T, PersonOf<Subj>> extends infer Form extends string
  ? Subj extends "je"
    ? Form extends `${VowelSound}${string}`
      ? `j'${Form}`
      : `je ${Form}`
    : `${Subj} ${Form}`
  : never;

/** Glue a (already-built) subject string to a 3rd-person verb: "le chat dort". */
export type Clause<
  Subject extends string,
  V extends Verb,
  T extends Tense = "Present"
> = `${Subject} ${ConjugateVerb<V, T, "il">}`;

/** Wrap a clause in ne … pas, eliding ne → n' before a vowel: "je ne parle pas" / "il n'aime pas". */
export type NegativeVerb<
  Subj extends string,
  V extends Verb,
  T extends Tense = "Present"
> = ConjugateVerb<V, T, PersonOf<Subj>> extends infer Form extends string
  ? `${Subj} ${Form extends `${VowelSound}${string}` ? "n'" : "ne "}${Form} pas`
  : never;

/** Front a clause with est-ce que (→ est-ce qu' before a vowel) to form a question. */
export type EstCeQue<Clause extends string> = StartsWithVowel<Clause> extends true
  ? `est-ce qu'${Clause}`
  : `est-ce que ${Clause}`;

/** Finish a statement: capitalize and add a period — "Le chat est noir." */
export type Sentence<S extends string> = `${Capitalize<S>}.`;
/** Finish a question: capitalize and add "?" — "Tu parles français ?" (French spaces the ?). */
export type Question<S extends string> = `${Capitalize<S>} ?`;
/** Finish an exclamation: capitalize and add "!" */
export type Exclamation<S extends string> = `${Capitalize<S>} !`;
