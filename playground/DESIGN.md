# Design System — Crème & Bleu de France ⚜️

> Category: Education · Developer Tools
>
> An editorial design language for Typed French. Warm cream paper (papier crème),
> deep bleu-nuit ink, a single muted bleu-de-France accent, a touch of rouge and
> a filet doré (gold hairline) — the tricolore *en sourdine*. The same token
> architecture dresses the whole Typed Grammar family; only the palette changes.

This document is the source of truth. The canonical token implementation lives in
[`src/theme.css`](./src/theme.css) (CSS custom properties, light under `:root`, dark
under `:root[data-theme="dark"]`), mapped into Tailwind v4 with `@theme inline`.
Authored against the [Open Design](https://github.com/nexu-io/open-design) 9-section schema.

## 1. Color

The palette is three ideas: **crème** (paper) for surfaces, **encre bleu-nuit**
(ink) for text, and **bleu de France** as the one accent — a muted, editorial
blue, never the saturated flag. A **rouge** completes the tricolore as a second
accent (and the error colour), and a **filet doré** adds a discreet gilded note.

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Page | `--paper` | `#f7f4ec` | `#12161f` |
| Card surface | `--surface` | `#fffdf8` | `#1a1f2b` |
| Subtle fill | `--surface-2` | `#eef0f6` | `#232a39` |
| Hairline | `--border` / `--border-strong` | `#e7e2d4` / `#d8d0bd` | `#2c3340` / `#3d4656` |
| Text | `--ink-900` → `--ink-300` | `#1c2433` → `#9aa1b1` | `#eef1f7` → `#757d8d` |
| Accent | `--azur-500` | `#3b5ba5` | `#8fb0e6` |
| Accent deep / link | `--azur-600` | `#2f4a88` | `#aac4f0` |
| On-accent text | `--on-accent` | `#ffffff` | `#12161f` |
| Rouge / Gold | `--rouge` / `--gold` | `#b23a48` / `#b8922f` | `#f0788a` / `#d8b85f` |
| Success / error | `--ok` / `--err` | `#2f7d5b` / `#b23a48` | `#4cc08c` / `#f0788a` |

The azur ramp (`--azur-50` … `--azur-600`) **inverts** between modes: in light, 50
is the faintest wash and 600 the deepest link; in dark, 50 becomes the deepest fill
and 600 the brightest, with 500 staying the accent in both. This keeps semantic
usage (`background: --azur-100`, `color: --azur-600`) correct without per-component
dark rules.

Grammar-category accents (`--cat-*`, used by the composition tree) keep distinct
hues but ship a lightened/desaturated dark variant so they stay legible on bleu-nuit.

**Always reference tokens, never raw hex.** Text-on-accent uses `--on-accent` (it
flips to dark ink in dark mode, where the accent is a light azur). Soft status
backgrounds use `--ok-soft` / `--err-soft`.

## 2. Typography

- **UI** — `--font-ui`: EB Garamond + Noto Serif SC (for 简体中文). Warm, editorial.
- **French** — `--font-fr`: EB Garamond, applied automatically via `:lang(fr)` and
  `.fr`; example sentences render larger.
- **Headings** — `--font-heading`: Playfair Display — the Parisian display sheen.
- **Mono** — `--font-mono`: SF Mono / JetBrains Mono. Inline code (`.tj-code`) and the editor.

Weights: body 400, labels/UI 600–700, titles 800. Section labels 0.72rem, uppercase,
`letter-spacing: 0.04em`, `--ink-500`. Body line-height ~1.7 for prose.

## 3. Spacing

A soft 4px rhythm (gaps of 6/8/10/12/16/20px). Cards pad 12–20px; page gutters 20px;
max content width 1280px. Prose columns cap at ~72ch.

## 4. Layout

- App shell: centered column, 1280px max, 20px gutter (`.app`).
- Course: sticky 268px sidebar + fluid content; collapses to one column < 900px.
- Analyzer: editor | tree, two panes; opens in a right-side drawer over a `--scrim`.

## 5. Components

Shared primitives live as `.tj-*` utilities in `theme.css`:

- `.tj-card` — surface + hairline + `--shadow-sm`, `--radius` (14px).
- `.tj-btn` / `.tj-btn--primary` — pill buttons; primary fills `--azur-500` with `--on-accent`.
- `.tj-chip` — rounded tag, `--surface-2` fill, `--azur-600` text.
- `.tj-input` / `.tj-select` — focus shows `--azur-400` border + a 3px `--ring` halo.
- `.tj-label`, `.tj-subtle`, `.tj-result`, `.tj-code`.

Active/selected states fill `--azur-500`. Radii: 14px cards, 9px controls, 999px pills.

## 6. Motion

Restrained and short. Color/border transitions 0.12–0.2s ease. Drawer slides in
0.26s `cubic-bezier(0.4,0,0.2,1)`. Respect `prefers-reduced-motion`.

## 7. Voice

Calm, precise, encouraging — a good programming tutorial, not a textbook. Bilingual
EN / 简体中文 at equal depth. Concepts are motivated before mechanics. Let the type
checker make the claims.

## 8. Brand

The mark is the fleur-de-lis (⚜️). The wordmark "Typed French" / "TypedGrammar" uses
an azur-600 → azur-400 gradient on the title. The throughline: *grammar you can
verify* — every sentence is a type the compiler reads.

## 9. Anti-patterns

- ❌ Saturated flag blue/red — reads cheap. Bleu de France is muted, editorial.
- ❌ Raw hex / `rgba()` in component CSS — breaks dark mode. Use tokens.
- ❌ White text hardcoded on accents — use `--on-accent`.
- ❌ Heavy drop shadows or glows — keep elevation soft (`--shadow-sm` / `--shadow-md`).
- ❌ Theme set after mount (causes a flash) — resolve `data-theme` before first paint.
