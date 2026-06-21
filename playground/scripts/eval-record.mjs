/**
 * eval-record.mjs — persist one eval round's result.
 *
 *   node scripts/eval-record.mjs <result.json>
 *
 * Reads the cross-review workflow's result JSON and:
 *   - writes eval/history/round-NNN.json   (full result, archival)
 *   - appends a row to eval/scoreboard.md   (the quantifiable trend)
 *   - writes eval/findings/round-NNN.md     (per-item verdicts + proposals)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLAYGROUND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EVAL = path.join(PLAYGROUND, "eval");

const resultFile = process.argv[2];
if (!resultFile) { console.error("usage: eval-record.mjs <result.json> [scoreboard.md]"); process.exit(1); }
// Optional 2nd arg routes to a separate scoreboard (e.g. benchmark-scoreboard.md
// for the FIXED-benchmark KPI, kept apart from random exploration runs).
const SCOREBOARD = path.join(EVAL, process.argv[3] || "scoreboard.md");
const r = JSON.parse(fs.readFileSync(resultFile, "utf8"));
const round = r.round ?? 0;
const pad = String(round).padStart(3, "0");
const date = new Date().toISOString().slice(0, 16).replace("T", " ");
const pct = (x) => (x == null ? "—" : `${(x * 100).toFixed(1)}%`);
// Namespace history/findings by scoreboard so the fixed-benchmark loop ("bench-")
// doesn't collide with the retired random-sampling loop ("round-").
const prefix = path.basename(SCOREBOARD).includes("benchmark") ? "bench" : "round";

fs.mkdirSync(path.join(EVAL, "history"), { recursive: true });
fs.mkdirSync(path.join(EVAL, "findings"), { recursive: true });
fs.writeFileSync(path.join(EVAL, "history", `${prefix}-${pad}.json`), JSON.stringify(r, null, 2) + "\n");

// --- scoreboard (the metric trend) ---
const d = r.byDimension ?? {};
const row = `| ${pad} | ${date} | ${r.sampled ?? 0} | **${pct(r.roundScore ?? 0)}** | ${pct(d.D1)} | ${pct(d.D2)} | ${pct(d.D3)} | ${pct(d.D4)} | ${pct(d.D5)} | ${pct(d.D6)} | ${(r.proposals ?? []).length} |`;
if (!fs.existsSync(SCOREBOARD)) {
  fs.writeFileSync(SCOREBOARD, `# Typed Japanese parsing — eval scoreboard

Quantifiable parsing-conformance metric over time. Each round samples chapter
examples + fresh \`annotate\` output and cross-reviews them against \`rubric.md\`
with independent judges. **Conformance** = mean item score / 12. Dimensions
D1–D6 are normalized 0–100%. Higher = closer to correct, idiomatic analysis.

| round | date (UTC) | n | conformance | D1 POS | D2 decomp | D3 particle | D4 conj | D5 resolve | D6 idiom | proposals |
|------:|-----------|--:|------------:|-------:|----------:|------------:|--------:|-----------:|---------:|----------:|
`);
}
fs.appendFileSync(SCOREBOARD, row + "\n");

// --- findings ---
const lines = [`# Eval round ${pad} — findings (${date} UTC)`, "",
  `Conformance **${pct(r.roundScore ?? 0)}** over ${r.scored ?? 0}/${r.sampled ?? 0} items.`, "",
  "## Per-item", ""];
for (const it of r.perItem ?? []) {
  lines.push(`- \`${it.id}\` (${it.source}${it.chapter ? ` ${it.chapter}` : ""}) **${it.verdict}** ${it.total}/12 · ${it.issueCount} issue(s) — ${it.jp}`);
}
lines.push("", "## Proposed fixes (routed)", "");
for (const p of r.proposals ?? []) {
  lines.push(`### [${p.target}] ${p.title}  _(confidence: ${p.confidence}${p.frequency ? `, ${p.frequency} items` : ""})_`);
  lines.push(`- dimensions: ${(p.dimensions ?? []).join(", ")}`);
  lines.push(`- rationale: ${p.rationale}`);
  lines.push(`- change: ${p.change}`, "");
}
if (!(r.proposals ?? []).length) lines.push("_No fixes proposed this round._");
fs.writeFileSync(path.join(EVAL, "findings", `${prefix}-${pad}.md`), lines.join("\n") + "\n");

console.log(`recorded round ${pad}: conformance ${pct(r.roundScore ?? 0)}, ${(r.proposals ?? []).length} proposal(s)`);
console.log(`  → eval/history/${prefix}-${pad}.json, eval/findings/${prefix}-${pad}.md, eval/${path.basename(SCOREBOARD)}`);
