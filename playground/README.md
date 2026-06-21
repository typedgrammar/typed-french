# ⚜️ Typed French Playground

**[Open the live playground →](https://typedgrammar.github.io/typed-french/)**

An interactive tool for the [Typed French](../README.md) type-level grammar
library, with several parts:

- **🏛 Foundations** — concept articles on the architecture of French (gender,
  elision, agreement), motivating the ideas before the syllabus drills them.
- **📖 Grammar Course** — a bilingual (English / 简体中文) French grammar course,
  elementary → advanced. Every example sentence is backed by a self-contained
  Typed French snippet; click any sentence to open it in the analyzer and see its
  grammatical structure. All snippets are verified to type-check **and** resolve
  to exactly the sentence shown (`pnpm verify:snippets`).
- **📚 Glossary** — a searchable vocabulary table (`src/vocab`) of every word the
  course uses: headword, gender, part of speech, IPA and bilingual meaning. Each
  example shows its words as clickable chips, cross-linked to the sentences that
  use them. A compiler check (`pnpm verify:vocab`) guarantees every word the
  course uses is indexed.
- **🛝 Playground** — a Monaco editor: write a French sentence as a TypeScript
  type and watch the compiler resolve and visualise its structure.

## Stack

Vite + React 18 + Tailwind v4 + Monaco. The app is server-rendered and
**prerendered to static HTML per route** (`scripts/prerender.mjs`) for SEO; the
client hydrates. The grammar library's `.d.ts` files are loaded into Monaco as
extra-libs (`src/data/libSources.ts`), so the in-browser TypeScript service
type-checks real Typed French code and resolves it on hover.

## Commands

```bash
pnpm install
pnpm dev               # dev server (http://localhost:5173)
pnpm build             # gen reverse-index → tsc → vite build → SSR → prerender
pnpm preview           # preview the static build
pnpm verify:snippets   # every course snippet type-checks AND resolves to its sentence
pnpm verify:vocab      # every word the course uses is in the glossary
```

## Authoring content

- **Course chapters** live in `src/tutorial/chapters/*.ts` (one `Chapter` per
  file). See `src/tutorial/AUTHORING.md`.
- **Foundations articles** live in `src/concepts/articles/*.ts`.
- **Vocabulary** lives in `src/vocab/entries/*.ts` (content words) and
  `src/vocab/function-words.ts` (articles, prepositions, pronouns…).

Every example's `code` must be self-contained Typed French whose **last** type
alias resolves to exactly the `fr` sentence — `pnpm verify:snippets` enforces it.

## Theme

*Crème & Bleu de France* — see [`DESIGN.md`](./DESIGN.md). Tokens live in
`src/theme.css` (CSS custom properties → Tailwind v4 via `@theme inline`).
