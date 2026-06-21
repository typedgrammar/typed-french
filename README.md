# ⚜️ Typed French

> Learn French grammar as TypeScript types — grammar you can verify.
> 用 TypeScript 类型学法语语法 —— 可被编译器验证的语法。

**Typed French** encodes French grammar — gender, articles, agreement, and verb
conjugation — as TypeScript types. A French sentence becomes a type expression
whose value the compiler *computes*: `Le chat est noir.` is not a string you
wrote, it's the result the type checker resolves. If the grammar is wrong, the
code doesn't compile.

It is the French sibling of
[`typed-japanese`](https://github.com/typedgrammar/typed-japanese), sharing the
same architecture and design-token system, dressed in a **Crème & Bleu de
France** theme.

## What's inside

| Part | Path | What it is |
| --- | --- | --- |
| **Grammar library** | [`src/`](./src) | The Typed French type DSL: nouns + gender, articles, adjective agreement, pronouns, and verb conjugation (3 groups + irregulars) — all resolved with template-literal + conditional types. |
| **Foundations** | playground · *Foundations* | Concept articles on the architecture of French (gender, elision, agreement). |
| **Grammar Course** | playground · *Grammar Course* | A bilingual (EN / 简体中文) chapter-by-chapter syllabus where every example is a self-contained, type-checked snippet. |
| **Glossary** | playground · *Glossary* | Every word the course uses, with gender, part of speech and meaning, cross-linked to the sentences that reference it. |
| **Playground** | playground · *Playground* | An in-browser Monaco editor: write a French sentence as a type and watch the compiler resolve and visualise its structure. |

## The idea in 30 seconds

```ts
import type {
  CommonNoun, DefiniteNP, Adjective, ConjugateAdjective,
  IrregularVerb, ConjugateVerb, Sentence,
} from "typed-french";

type chat = CommonNoun<"chat", "m">;   // a masculine noun
type être = IrregularVerb<"être">;
type noir = Adjective<"noir">;

// The compiler resolves this to the string "Le chat est noir."
type Phrase = Sentence<`${DefiniteNP<chat>} ${ConjugateVerb<être, "Present", "il">} ${ConjugateAdjective<noir, "m">}`>;
```

`DefiniteNP<chat>` reads the noun's gender and produces `le chat`; for a
feminine or vowel-initial noun it would produce `la …` or `l'…`. Conjugation and
adjective agreement work the same way — pure type-level computation.

## Develop

```bash
# the grammar library (type-checks the .d.ts DSL + examples)
pnpm install
pnpm test            # typecheck + lint

# the playground (Vite + React + Tailwind v4 + Monaco)
cd playground
pnpm install
pnpm dev             # http://localhost:5173
pnpm build           # static build → playground/dist (prerendered per route)
pnpm verify:snippets # every course snippet type-checks AND resolves to its sentence
pnpm verify:vocab    # every word the course uses is in the glossary
```

## Deployment

The playground is a statically prerendered SPA deployed to **GitHub Pages** via
[`.github/workflows/deploy-playground.yml`](./.github/workflows/deploy-playground.yml)
on every push to `main`. `VITE_BASE` is `/typed-french/`.

## Design

The theme — *Crème & Bleu de France* — is documented in
[`playground/DESIGN.md`](./playground/DESIGN.md). Tokens live as CSS custom
properties in `playground/src/theme.css` and are mapped into Tailwind v4 with
`@theme inline`; they are intended to be extracted into a shared design-token
package across the Typed Grammar family.

## License

MIT
