/**
 * eval-bench.mjs — build the FIXED-benchmark review batch (the comparable KPI).
 *
 *   node scripts/eval-bench.mjs --round N > /tmp/bench_N.json
 *
 * Reads eval/benchmark.json ({id, jp} pairs) and extracts each example's CURRENT
 * `code` from the chapters, so the same items are scored every round and the
 * trend is comparable. Deterministic — no annotate, no randomness. stdout = the
 * batch JSON {round, items:[{id, source:"benchmark", chapter, jp, code}]}.
 * (Run scripts/eval-sample.mjs separately for random/annotate EXPLORATION.)
 */
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLAYGROUND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CH = path.join(PLAYGROUND, "src/tutorial/chapters");
const round = Number((process.argv.indexOf("--round") >= 0 && process.argv[process.argv.indexOf("--round") + 1]) || "1");

const bench = JSON.parse(fs.readFileSync(path.join(PLAYGROUND, "eval/benchmark.json"), "utf8")).items;

function examplesOf(file) {
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("module", "exports", "require", js)(mod, mod.exports, () => ({}));
  const out = {};
  for (const pt of mod.exports.default?.points ?? [])
    for (const ex of pt.examples ?? []) if (ex.jp) out[ex.jp] = ex.code;
  return out;
}

const cache = {};
const items = [];
for (let i = 0; i < bench.length; i++) {
  const { id, jp } = bench[i];
  cache[id] ||= examplesOf(path.join(CH, `${id}.ts`));
  const code = cache[id][jp];
  if (!code) { console.error(`  MISSING ${id} ${jp}`); continue; }
  items.push({ id: `b${round}-${i}`, source: "benchmark", chapter: id, jp, code });
}
console.error(`benchmark batch: ${items.length}/${bench.length} items (round ${round})`);
process.stdout.write(JSON.stringify({ round, items }, null, 2));
