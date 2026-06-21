# Regression check (A/B, fixed benchmark) — current HEAD vs pre-loop `main`

**Question:** the round-to-round headline fell 91.3% (r3) → 69.4% (r6). Real regression, or sampling noise?

**Method:** 12 fixed sentences, the SAME items scored on current working tree vs `git main`
(pre-everything), identical rubric, 3 judges/arm, median per arm. (Rounds 1–6 each sampled a
DIFFERENT random 8 — never comparable; that is the defect, not the code.)

**Result:**
- current mean **76.4%** vs main mean **37.5%** → **+39 points**, on identical items.
- **0 regressions. All 12 items improved** (Δ ≥ +1).
- Largest gains where the work landed: すぐ参ります 2→12, 行きますが遅れます 3→11,
  私は学生です 5→12, 本当のことを言うべきだ 2→9 (collapsed-phrase decompose), コーヒーを飲もう 5→10.
- Frozen-tail idioms low in BOTH arms (わけにはいきません 3 vs 2, なくてもいいです 5 vs 3,
  かけられた 6 vs 2): pre-existing chapter weakness, present on main too — not loop-caused.

**Verdict:** NO regression. The work nearly doubled corpus conformance. The 91→69 swing was
sampling variance over a bimodal corpus (clean ≈12, old template-literal idiom chapters ≈3–6):
r3 drew easy items, r6 drew four hard ones. **Do not revert.** Fix the measurement: evaluate a
FIXED benchmark every round so the trend is comparable (see benchmark.json + benchmark-scoreboard.md).
