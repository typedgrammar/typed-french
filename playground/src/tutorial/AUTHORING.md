# Chapter authoring contract

You are writing ONE chapter of a French grammar course for the Typed French
playground. Output exactly one file: `src/tutorial/chapters/<id>.ts`, default-
exporting a `Chapter`.

**Read first:** `src/tutorial/types.ts` (the schema) and
`src/tutorial/chapters/e01.ts` (the gold-standard example — copy its shape).

## Hard requirements

1. **Bilingual.** Every `titleEn/titleZh`, `summaryEn/summaryZh`,
   `bodyEn/bodyZh` is filled. English is natural English; Chinese is natural 简体中文.
   Bodies may use `\n\n` for paragraph breaks and `` `backticks` `` for inline code.
2. **3–5 grammar points**, each with **2–3 examples**.
3. Each example has `jp`, `ipa` (kana), `en`, `zh`, and `code`.
4. **`code` is self-contained Typed French** that type-checks against the
   library AND whose **last `type` alias resolves to exactly `jp`**. A verifier
   enforces both — if the resolved string ≠ `jp`, it fails.

## How to write `code`

Import what you use from `"typed-french"`. Define words as local `type`
aliases, then build the sentence. Prefer the named grammar constructors (richer
structure in the visualiser); glue the rest with **template literal types**
`` `${A}${B}` `` and string literals.

```ts
import type { ProperNoun, GodanVerb, ConjugateVerb, PhraseWithParticle } from "typed-french";
type 私 = ProperNoun<"私">;
type 飲む = GodanVerb & { stem: "飲"; ending: "む" };
// 私はコーヒーを飲みます  →  last alias must equal jp exactly
type 私はコーヒーを飲みます = `${PhraseWithParticle<私, "は">}コーヒーを${ConjugateVerb<飲む, "Masu">}ます`;
```

### Library surface (use ONLY these)

- `ProperNoun<"...">` — any noun/name → the string itself. Use it for nouns.
- Verbs: `GodanVerb & { stem; ending }` where ending ∈
  `う く ぐ す つ ぬ ぶ む る`; `IchidanVerb & { stem; ending: "る" }`;
  `IrregularVerb & { dictionary: "する" | "来る" | "くる" }`.
- `ConjugateVerb<V, Form>`, Form ∈ `Dictionary Masu Te Ta Nai Potential Passive
  Causative Volitional Imperative Conditional Hypothetical`.
- Adjectives: `IAdjective & { stem; ending: "い"; irregular?: true }`,
  `NaAdjective & { stem }`. `ConjugateAdjective<A, Form>`, Form ∈
  `Basic Polite Past Negative`.
- `PhraseWithParticle<Base extends string, P>` — appends a particle. P ∈
  `は が を に へ で と から まで よ ね か よね の も`.
- Copula (だ / です): `ConjugateCopula<Taigen, Form>` predicates a noun, Form ∈
  `Plain`(だ) `Polite`(です) `Past`(だった) `PolitePast`(でした) `Negative`(ではない)
  `PoliteNegative`(ではありません) `NegativePast`(ではなかった) `PoliteNegativePast`(ではありませんでした)
  `CasualNegative`(じゃない) `CasualPoliteNegative`(じゃありません) `Written`(である) `Te`(で).
  The copula is **not** a particle — use this instead of appending a bare
  `だ`/`です`/`ではありません` literal, so the predicate is type-checked.
- `ConnectedPhrases<A, B>` — joins with `、`.
- `ConditionalPhrase<Subject, CP, Result>` — CP ∈ `なら たら れば と`.
- `DemonstrativeAction<Demo, V, Form>` — e.g. `DemonstrativeAction<"そう", する, "Ta">`.
- `InterrogativePhrase<Adv, Subject, V, VForm, QP>`.

### ⚠️ Conjugation outputs are often *partial* — append the rest yourself

`ConjugateVerb` returns a stem for many forms. Complete it with a template literal:

| Form | `話す`(godan) returns | full word you build |
| --- | --- | --- |
| Dictionary | `話す` | `話す` (complete) |
| Te | `話して` | `話して` (complete) |
| Ta | `話した` | `話した` (complete) |
| Masu | `話し` | `` `${...}ます` `` → 話します (or ました/ません) |
| Nai | `話さ` | `` `${...}ない` `` → 話さない |
| Volitional | `話そ` | `` `${...}う` `` → 話そう |
| Potential | `話せ` | `` `${...}る` `` → 話せる |

For `する`: Masu→`し`(+ます=します), Ta→`した`, Te→`して`, Nai→`し`(+ない=しない).

**The verifier resolves your last alias and compares it to `jp`.** If a form's
output doesn't give natural French, build that part from literals instead —
correctness of the final string is non-negotiable. When in doubt, keep the
sentence short and spell tricky morphemes as literal text inside the template.

## Output

A single file `src/tutorial/chapters/<id>.ts`:

```ts
import type { Chapter } from "../types";
const chapter: Chapter = { id: "...", level: "...", order: N, titleEn: "...", /* … */ points: [ /* … */ ] };
export default chapter;
```

Do not import anything except the `Chapter` type. Do not edit other files.
