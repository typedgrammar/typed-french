/**
 * eval-codex-record.mjs — turn an eval-codex result into the durable record +
 * playground presets.
 *
 *   node scripts/eval-codex-record.mjs /tmp/hard_roundN.json
 *
 * Writes:
 *   eval/history/hard-NNN.json     full per-case result (snapshot, incl. samples/drift)
 *   eval/hard-scoreboard.md        the KPI table: mean-reliability (codex accuracy)
 *                                  + capability (library can express it) per round
 *   src/data/eval-presets.json     resolving cases as playground Snippets, clickable
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLAYGROUND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resultFile = process.argv[2];
if (!resultFile) {
  console.error("usage: node scripts/eval-codex-record.mjs <result.json>");
  process.exit(1);
}
const r = JSON.parse(fs.readFileSync(resultFile, "utf8"));
const round = r.round;
const pad = String(round).padStart(3, "0");
const items = r.items;

// 1. snapshot
const histDir = path.join(PLAYGROUND, "eval/history");
fs.mkdirSync(histDir, { recursive: true });
fs.writeFileSync(path.join(histDir, `hard-${pad}.json`), JSON.stringify(r, null, 2) + "\n");

// 2. scoreboard
const sbPath = path.join(PLAYGROUND, "eval/hard-scoreboard.md");
const header =
  `# Eval scoreboard (real codex annotate pipeline)\n\n` +
  `Each round runs the REAL \`codex exec\` annotate pipeline (K samples/case) on every\n` +
  `sentence in \`eval/eval-cases.json\` (medium → very-hard). Two signals:\n` +
  `- **reliability** = mean of (passes / samples) per case — how often codex produces\n` +
  `  a snippet that type-checks AND resolves byte-identically. The codex-accuracy KPI.\n` +
  `- **capability** = fraction of cases codex resolved at least once — evidence the\n` +
  `  library CAN express the parse. Gaps here are the ts-def backlog (see gap-backlog.md).\n` +
  `- **modelable** = excluding classical-literal cases the library cannot fully express.\n\n` +
  `| round | date | cases | smp | maj-pass | reliability | capability | modelable | by-difficulty (med / hard / vhard) |\n` +
  `|---|---|---|---|---|---|---|---|---|\n`;
const rate = (p, n) => (n ? `${((p / n) * 100).toFixed(1)}%` : "—");
const capable = items.filter((x) => x.capable ?? x.passed);

// Rebuild the whole table from every history snapshot, so old (single-sample)
// and new (N-sample) rounds render in one consistent format (the column set
// changed, so appending would misalign).
function rowFor(j, fileMtime) {
  const its = j.items;
  const ran = j.ran ?? its.length;
  const smp = j.samples ?? 1;
  const passed = j.passed ?? its.filter((x) => x.passed).length;
  const rel = j.passRate ?? (ran ? passed / ran : 0);
  const cap = its.filter((x) => x.capable ?? x.passed).length;
  const mod = its.filter((x) => x.modelability !== "classical-literal");
  const modcap = mod.filter((x) => x.capable ?? x.passed).length;
  const byd = (d) => {
    const s = its.filter((x) => x.difficulty === d);
    return s.length ? `${((s.reduce((a, x) => a + (x.reliability ?? (x.passed ? 1 : 0)), 0) / s.length) * 100).toFixed(0)}%` : "—";
  };
  const date = new Date(fileMtime).toISOString().slice(0, 16).replace("T", " ");
  return `| ${String(j.round).padStart(3, "0")} | ${date} | ${ran} | ${smp} | ${passed}/${ran} | ` +
    `**${(rel * 100).toFixed(1)}%** | ${rate(cap, ran)} | ${rate(modcap, mod.length)} | ` +
    `${byd("medium")} / ${byd("hard")} / ${byd("very-hard")} |`;
}
const rounds = fs.readdirSync(histDir)
  .filter((f) => /^hard-\d+\.json$/.test(f))
  .map((f) => ({ j: JSON.parse(fs.readFileSync(path.join(histDir, f), "utf8")), mtime: fs.statSync(path.join(histDir, f)).mtime }))
  .sort((a, b) => a.j.round - b.j.round);
let table = header + rounds.map((x) => rowFor(x.j, x.mtime)).join("\n");

// per-category breakdown (capability) — categories derived from the data
const cats = [...new Set(items.map((x) => x.category))].sort();
let breakdown = `## Round ${pad} by category (capable / ran)\n\n| category | capable |\n|---|---|\n`;
for (const c of cats) {
  const b = r.byCategory[c];
  if (b) breakdown += `| ${c} | ${b.capable ?? b.passed}/${b.ran} |\n`;
}
fs.writeFileSync(sbPath, table + "\n\n" + breakdown);

// 3. playground presets — every case codex resolved (has a valid, resolving snippet)
const presets = items
  .filter((x) => (x.capable ?? x.passed) && x.code)
  .map((x) => ({
    id: `eval-${x.id}`,
    title: x.jp.length > 16 ? x.jp.slice(0, 15) + "…" : x.jp,
    jp: x.jp,
    en: x.en,
    code: x.code,
  }));
fs.writeFileSync(
  path.join(PLAYGROUND, "src/data/eval-presets.json"),
  JSON.stringify(presets, null, 2) + "\n"
);

console.error(
  `recorded hard-${pad}: reliability ${(r.passRate * 100).toFixed(1)}%, capability ${rate(capable.length, r.ran)}, ` +
  `${presets.length} preset(s)`
);
