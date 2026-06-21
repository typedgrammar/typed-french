# Eval scoreboard (real codex annotate pipeline)

Each round runs the REAL `codex exec` annotate pipeline (K samples/case) on every
sentence in `eval/eval-cases.json` (medium → very-hard). Two signals:
- **reliability** = mean of (passes / samples) per case — how often codex produces
  a snippet that type-checks AND resolves byte-identically. The codex-accuracy KPI.
- **capability** = fraction of cases codex resolved at least once — evidence the
  library CAN express the parse. Gaps here are the ts-def backlog (see gap-backlog.md).
- **modelable** = excluding classical-literal cases the library cannot fully express.

| round | date | cases | smp | maj-pass | reliability | capability | modelable | by-difficulty (med / hard / vhard) |
|---|---|---|---|---|---|---|---|---|
| 001 | 2026-06-21 06:50 | 25 | 1 | 21/25 | **84.0%** | 84.0% | 86.4% | — / 91% / 79% |
| 002 | 2026-06-21 07:19 | 25 | 1 | 21/25 | **84.0%** | 84.0% | 86.4% | — / 82% / 86% |
| 003 | 2026-06-21 08:12 | 25 | 1 | 21/25 | **84.0%** | 84.0% | 90.9% | — / 82% / 86% |
| 004 | 2026-06-21 09:23 | 43 | 1 | 43/43 | **100.0%** | 100.0% | 100.0% | 100% / 100% / 100% |

## Round 004 by category (capable / ran)

| category | capable |
|---|---|
| adjective-forms | 2/2 |
| aux-verb-chains | 3/3 |
| basic-predicate | 2/2 |
| causative-passive-keigo | 3/3 |
| classical-formal | 3/3 |
| comparatives | 2/2 |
| conditional-concessive | 3/3 |
| counters-time | 2/2 |
| keigo-chains | 3/3 |
| long-multiclause | 3/3 |
| nominalization-embedding | 2/2 |
| particle-basics | 2/2 |
| quotation-modality | 3/3 |
| relative-clause | 2/2 |
| simple-keigo | 2/2 |
| simple-relative | 2/2 |
| te-chains | 2/2 |
| verb-conjugation | 2/2 |
