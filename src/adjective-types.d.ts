import type { Gender, Numerus } from "./shared-types";

/**
 * Adjective agreement. The stored stem is the masculine singular (the citation
 * form); feminine and plural surfaces are derived from it. The common patterns
 * are handled here — the long tail of irregular feminines (beau → belle,
 * vieux → vieille) can be modelled as fixed-string adjectives when needed.
 */
export type Adjective<S extends string = string> = { type: "adjective"; stem: S };

/**
 * Masculine → feminine. The frequent patterns, checked most-specific first:
 *   -e invariant (rouge), -eux → -euse (heureux), -er → -ère (cher),
 *   -f → -ve (neuf), -el → -elle, -on → -onne, -en → -enne, -et → -ette,
 *   otherwise +e (petit → petite, noir → noire).
 */
export type Feminine<S extends string> = S extends `${string}e`
  ? S
  : S extends `${infer P}eux`
  ? `${P}euse`
  : S extends `${infer P}er`
  ? `${P}ère`
  : S extends `${infer P}f`
  ? `${P}ve`
  : S extends `${string}${"el" | "on" | "en" | "et"}`
  ? `${S}${S extends `${string}el` ? "le" : S extends `${string}et` ? "te" : "ne"}`
  : `${S}e`;

type PluralizeAdj<W extends string> = W extends `${string}${"s" | "x"}`
  ? W
  : W extends `${infer P}al`
  ? `${P}aux`
  : W extends `${string}eau`
  ? `${W}x`
  : `${W}s`;

/** Agree an adjective with a gender and number: `ConjugateAdjective<noir, "f", "p">` → "noires". */
export type ConjugateAdjective<
  A extends Adjective,
  G extends Gender,
  N extends Numerus = "s"
> = A extends { stem: infer S extends string }
  ? G extends "f"
    ? N extends "p"
      ? PluralizeAdj<Feminine<S>>
      : Feminine<S>
    : N extends "p"
    ? PluralizeAdj<S>
    : S
  : never;
