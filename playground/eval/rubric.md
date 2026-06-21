# Typed French parsing rubric

The standard a Typed French snippet is cross-reviewed against. A snippet takes
a French sentence and composes it from the library's typed constructors so the
final `type` alias resolves to *exactly* that sentence. This rubric judges
whether the composition reflects **correct, idiomatic French grammatical
analysis** — not merely whether it type-checks.

Each item is scored on six dimensions, **0 / 1 / 2**:
- **2** — conforms; a French teacher would accept the analysis.
- **1** — defensible but imperfect (suboptimal granularity, a borderline label).
- **0** — wrong; misrepresents the grammar or misleads a learner.

Item score = Σ(dimensions) / 12 → percentage. A dimension that cannot apply to a
sentence (e.g. no verb to conjugate) is scored **2** (vacuously satisfied) and
noted, so it neither rewards nor penalizes.

---

## D1 · POS accuracy (词类准确)
Every content word is wrapped in the linguistically-correct constructor.
- `CommonNoun` 普通名詞 (猫, 机), `ProperNoun` 固有名詞 — **names only** (東京, ヒンメル,
  TypeScript), `Pronoun` 代名詞 (これ, 私, 誰), `Adverb` 副詞 (すぐ, 毎日),
  `Adnominal` 連体詞 (この, その), `NaAdjective`/`IAdjective`, the verb classes.
- **0** if a common noun is tagged `ProperNoun`, a な-adjective/adverb is tagged as
  a noun, or a conjugated form is frozen into a noun wrapper.

## D2 · Phrase decomposition (短语分解)
Multi-morpheme spans are broken into morphemes; no chunk hides internal structure.
- 机の上 → 机 + の + 上; この本 → この + 本; 子供の頃 → 子供 + の + 頃.
- **0** if a whole phrase/clause is collapsed into one leaf (the classic
  `ProperNoun<"机の上">` bug). **1** if granularity is slightly off but no
  structure is hidden.

## D3 · Particle integrity (助词完整)
Every 助詞 (は・が・を・に・の・で・と・も・…) is its own visible unit.
- **0** if any particle is buried inside a noun/word string rather than appearing
  as a `ParticlePart`/`PhraseWithParticle`/explicit glue.

## D4 · Conjugation correctness (活用正确)
Verbs, adjectives and the copula use the correct form **name** and the surface
result is genuinely correct French.
- Right verb class (godan/ichidan/irregular); right form (Te/Ta/Masu/Nai/…);
  い/な-adjective and copula forms correct.
- **0** if the conjugation is wrong French even if it happens to type-check.

## D5 · Resolution fidelity (还原一致)
The snippet's last alias resolves to **exactly** the target sentence — no missing
or extra characters, particles, or punctuation.
- **0** if it does not resolve to the target (this is also gate-checked
  mechanically; judges confirm and explain any drift).

## D6 · Idiomatic analysis (符合语言学分析)
The segmentation matches how a French grammarian/teacher would actually analyze
the sentence: sensible granularity, fixed expressions kept whole when that is the
honest analysis, inflections expressed through the conjugator rather than spelled
as raw literals when the library *can* express them.
- **1** if a modellable inflection is spelled as a raw literal unnecessarily, or a
  fixed expression is over-split. **0** if the analysis actively misleads.

---

## Output contract for a judge
For each item return: per-dimension score (0/1/2) with a one-line reason, an
overall verdict (`conforms` if every dimension ≥ 1 and total ≥ 10, else
`needs-work`), and a list of concrete issues each tagged with the dimension and,
where possible, **whether the root cause is a TS-definition gap or an
annotate-prompt gap** (so fixes can be routed).
