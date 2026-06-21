/**
 * eval-codex.mjs — the HARD eval: run the REAL codex annotate pipeline on each
 * case and measure how reliably codex nails it.
 *
 *   node scripts/eval-codex.mjs --round N [--samples K] [--concurrency 4] [--cases eval/hard-cases.json]
 *
 * For every case it runs `bun scripts/annotate.ts "<jp>" --json` (which calls the
 * real `codex exec`) K times. A sample "passes" iff codex's snippet type-checks
 * AND resolves byte-identically to the target. Reporting:
 *   - reliability (per case) = passes / samples   — the codex-accuracy signal
 *   - capable    (per case)  = passed at least once — the library-capability signal
 *   - drift (per failing sample) = auto-located diff of resolved vs target
 *
 * stdout = JSON {round, samples, ran, passed, passRate, capabilityRate, byCategory,
 * items:[...]}. All progress logging goes to stderr.
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const PLAYGROUND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const log = (...a) => console.error(...a);
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const round = Number(arg("round", "1"));
const SAMPLES = Math.max(1, Number(arg("samples", "1")));
const concurrency = Number(arg("concurrency", "4"));
const casesFile = path.resolve(PLAYGROUND, arg("cases", "eval/eval-cases.json"));

const cases = JSON.parse(fs.readFileSync(casesFile, "utf8")).cases;
log(`eval-codex round ${round}: ${cases.length} case(s) × ${SAMPLES} sample(s), concurrency ${concurrency}`);

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");

/** Run the real annotate→codex pipeline once; returns {ok, resolved, code, attempts}. */
function annotateOnce(jp) {
  return new Promise((resolve) => {
    const child = spawn("bun", ["scripts/annotate.ts", jp, "--json"], { cwd: PLAYGROUND, env: process.env });
    let out = "";
    // Generous per-attempt cap: long multi-clause sentences can take minutes for
    // one codex pass; too tight a cap turns latency into spurious "failures".
    const killer = setTimeout(() => child.kill("SIGKILL"), 600000);
    child.stdout.on("data", (d) => (out += d));
    child.on("error", () => { clearTimeout(killer); resolve({ ok: false, resolved: null, code: null, attempts: 0 }); });
    child.on("close", () => {
      clearTimeout(killer);
      const m = stripAnsi(out).match(/@@TJJSON@@([\s\S]*?)@@END@@/);
      if (!m) return resolve({ ok: false, resolved: null, code: null, attempts: 0 });
      try { resolve(JSON.parse(m[1])); }
      catch { resolve({ ok: false, resolved: null, code: null, attempts: 0 }); }
    });
  });
}

/** Locate where a resolved string drifts from the target (common prefix/suffix). */
function drift(resolved, target) {
  if (resolved == null) return { kind: "unresolved" };
  if (resolved === target) return null;
  let i = 0;
  while (i < resolved.length && i < target.length && resolved[i] === target[i]) i++;
  let j = 0;
  while (j < resolved.length - i && j < target.length - i &&
         resolved[resolved.length - 1 - j] === target[target.length - 1 - j]) j++;
  return {
    kind: "drift",
    at: i,
    context: target.slice(Math.max(0, i - 6), i),
    got: resolved.slice(i, resolved.length - j),
    want: target.slice(i, target.length - j),
  };
}

async function runCase(c) {
  const samples = [];
  for (let s = 0; s < SAMPLES; s++) {
    const t0 = Date.now();
    const r = await annotateOnce(c.jp);
    const secs = Math.round((Date.now() - t0) / 1000);
    const passed = !!r.ok;
    samples.push({ passed, resolved: r.resolved ?? null, code: r.code ?? null, attempts: r.attempts ?? 0,
                   drift: passed ? null : drift(r.resolved ?? null, c.jp) });
    log(`  ${passed ? "pass" : "FAIL"} [${c.category}] ${c.jp.slice(0, 26)}…  (s${s + 1}/${SAMPLES}, ${secs}s)`);
  }
  const passCount = samples.filter((s) => s.passed).length;
  const passing = samples.find((s) => s.passed);
  // representative snippet: a passing one if any, else the last failing attempt
  const rep = passing ?? [...samples].reverse().find((s) => s.code) ?? samples[samples.length - 1];
  const repDrift = samples.find((s) => !s.passed && s.drift)?.drift ?? null;
  return {
    id: c.id, jp: c.jp, reading: c.reading, en: c.en, zh: c.zh,
    category: c.category, modelability: c.modelability, difficulty: c.difficulty,
    samples: SAMPLES,
    passCount,
    reliability: +(passCount / SAMPLES).toFixed(3),
    capable: passCount > 0,
    passed: passCount * 2 >= SAMPLES, // majority verdict (for a single sample, == passed)
    attempts: rep?.attempts ?? 0,
    resolved: rep?.resolved ?? null,
    code: rep?.code ?? null,
    drift: passing ? null : repDrift,
  };
}

const results = new Array(cases.length);
let next = 0;
async function worker() { while (next < cases.length) { const i = next++; results[i] = await runCase(cases[i]); } }
await Promise.all(Array.from({ length: Math.min(concurrency, cases.length) }, worker));

const byCategory = {};
for (const r of results) {
  byCategory[r.category] ??= { ran: 0, passed: 0, capable: 0 };
  byCategory[r.category].ran++;
  if (r.passed) byCategory[r.category].passed++;
  if (r.capable) byCategory[r.category].capable++;
}
const meanReliability = results.length ? results.reduce((a, r) => a + r.reliability, 0) / results.length : 0;
const out = {
  round, samples: SAMPLES, ran: results.length,
  passed: results.filter((r) => r.passed).length,
  passRate: +meanReliability.toFixed(4),
  capabilityRate: results.length ? +(results.filter((r) => r.capable).length / results.length).toFixed(4) : 0,
  byCategory, items: results,
};
log(`\nround ${round}: passed(majority) ${out.passed}/${out.ran}, mean-reliability ${(out.passRate * 100).toFixed(1)}%, capability ${(out.capabilityRate * 100).toFixed(1)}%`);
process.stdout.write(JSON.stringify(out, null, 2));
