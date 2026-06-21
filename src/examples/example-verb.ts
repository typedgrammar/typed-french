import type {
  ErVerb,
  IrVerb,
  ReVerb,
  IrregularVerb,
  ConjugateVerb,
} from "../index";

/**
 * Conjugation walk-through. Each alias resolves to a concrete surface string;
 * the `Expect`/`Equal` assertions below make TypeScript itself the test runner —
 * if a conjugation rule were wrong, this file would fail to compile.
 */
type parler = ErVerb<"parl">;
type finir = IrVerb<"fin">;
type vendre = ReVerb<"vend">;
type être = IrregularVerb<"être">;
type aller = IrregularVerb<"aller">;

type parle = ConjugateVerb<parler, "Present", "je">; // "parle"
type parlons = ConjugateVerb<parler, "Present", "nous">; // "parlons"
type finissent = ConjugateVerb<finir, "Present", "ils">; // "finissent"
type vend = ConjugateVerb<vendre, "Present", "il">; // "vend"
type parlait = ConjugateVerb<parler, "Imparfait", "il">; // "parlait"
type finiraFutur = ConjugateVerb<finir, "FuturSimple", "il">; // "finira"
type aiParlé = ConjugateVerb<parler, "PasseCompose", "je">; // "ai parlé"
type est = ConjugateVerb<être, "Present", "il">; // "est"
type vont = ConjugateVerb<aller, "Present", "ils">; // "vont"

// --- type-level assertions ---------------------------------------------------
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;
type Expect<T extends true> = T;

type _t =
  | Expect<Equal<parle, "parle">>
  | Expect<Equal<parlons, "parlons">>
  | Expect<Equal<finissent, "finissent">>
  | Expect<Equal<vend, "vend">>
  | Expect<Equal<parlait, "parlait">>
  | Expect<Equal<finiraFutur, "finira">>
  | Expect<Equal<aiParlé, "ai parlé">>
  | Expect<Equal<est, "est">>
  | Expect<Equal<vont, "vont">>;
