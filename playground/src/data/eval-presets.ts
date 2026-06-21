/**
 * Hard-eval presets for the Type Playground. Each entry is one sentence from
 * eval/hard-cases.json that the REAL codex annotate pipeline successfully parsed
 * (the snippet type-checks AND resolves byte-identically to the target). Written
 * by `node scripts/eval-codex-record.mjs <result.json>` after a hard-eval round;
 * the data lives in the sibling eval-presets.json. Don't edit by hand — re-run
 * the hard eval (scripts/eval-codex.mjs) instead.
 */
import type { Snippet } from "./examples";
import data from "./eval-presets.json";

export const EVAL_PRESETS = data as ReadonlyArray<Snippet>;
