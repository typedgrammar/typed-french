# Library-gap backlog

The eval's most valuable output isn't the pass-rate — it's **finding real
`ts-def` gaps**: forms the type library genuinely cannot express. Each round, a
case that `codex` never resolves across samples (capability = 0) is a candidate
gap. We classify each candidate as:

- **ts-def gap** → the library can't produce the correct surface. Fix it in
  `src/*.d.ts` (additive, gated against the full 384-snippet corpus). Durable win.
- **prompt gap** → the library *can*, but `codex` misuses it. Fix `annotate.ts`
  hard-rules (lower priority — non-deterministic, risks overfitting).
- **unmodelable** → inherently classical/idiomatic; correct handling is a
  literal (`SuffixPart`). Not a defect — excluded from the "modelable" KPI.

A fix is only applied if `node scripts/eval-gate.mjs` stays green (so an eval win
that breaks the course corpus is rejected), then confirmed by re-running the case.

---

## Fixed (closed gaps)

| gap | fix | round found → fixed |
|---|---|---|
| ichidan **Causative** lumped with Potential/Passive → `食べられ` instead of `食べさせ` | split `Causative → ${stem}させ` (verb-types.d.ts) | corpus sweep |
| ichidan **Hypothetical/Conditional** → `られ` instead of `れ` | split `→ ${stem}れ` | corpus sweep |
| **行く / いく** て・た irregular → `いいて` instead of `いって` | special-case `{stem:行|い, ending:く}` for Te/Ta → って/った | hard r2 → r3 |
| no **polite potential** (`いただけます`, `行けます`) in one part | added `PotentialMasu` form (= Potential stem + ます) | hard r2 → r3 |

## Won't-fix (unmodelable by design — keep as literals)

- Classical auxiliaries: `ぬ`, `ざる`, `べき`, `べからず`, `まじき`, `たる`, `ごとき`.
  Correct as `SuffixPart` literals; reported under the classical-literal bucket.
- Honorific -aru irregular 連用形: `おっしゃる→おっしゃい`, `いらっしゃる→いらっしゃい`,
  `なさる→なさい`. Declared in true class; the irregular ます-stem stays a literal.

## Open / watching

Filled by the loop as new capability=0 cases appear. Candidates so far (very-hard
tail, not yet confirmed as clean ts-def fixes — they tend to have multiple drift
points per sentence, so they need narrowing before a fix is worth it):

- deep keigo desiderative chains (`させていただきたく` + `お〜いただけます` in one sentence)
- long multi-clause sentences with several independent inflection points
- `〜てくる / 〜ていく` directional aux stacks mixed with benefactives

> Maintained alongside `hard-scoreboard.md`. When the loop stops finding new
> ts-def gaps, the eval has done its core job.
