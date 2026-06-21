/**
 * eval-sample.mjs — build one review batch for the parsing eval loop.
 *
 *   node scripts/eval-sample.mjs --round N [--existing K] [--fresh M]
 *
 * Emits JSON {round, items:[{id, source, jp, chapter?, code, resolves}]} to
 * stdout. `existing` items are sampled from the tutorial chapters; `fresh` items
 * are generated live by `bun scripts/annotate.ts "<sentence>" --dry-run` over the
 * eval/sentences.txt pool (this is the "annotate keeps running" arm). All logging
 * goes to stderr so stdout stays pure JSON.
 */
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAYGROUND = path.resolve(__dirname, "..");
const CHAPTERS_DIR = path.join(PLAYGROUND, "src/tutorial/chapters");
const SENTENCES = path.join(PLAYGROUND, "eval/sentences.txt");
const log = (...a) => console.error(...a);

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const round = Number(arg("round", "1"));
const K = Number(arg("existing", "5"));
const M = Number(arg("fresh", "3"));

// Deterministic per-round PRNG so a round is reproducible (no Math.random).
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(0x9e3779b9 ^ round);
function sample(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function loadChapter(file) {
  const src = fs.readFileSync(file, "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("module", "exports", "require", js)(mod, mod.exports, () => ({}));
  return mod.exports.default;
}

// --- existing chapter examples ---
const existingAll = [];
for (const f of fs.readdirSync(CHAPTERS_DIR).filter((f) => f.endsWith(".ts") && f !== "index.ts")) {
  let ch;
  try { ch = loadChapter(path.join(CHAPTERS_DIR, f)); } catch { continue; }
  for (const pt of ch?.points ?? [])
    for (const ex of pt.examples ?? [])
      if (ex.code && ex.jp) existingAll.push({ chapter: ch.id, jp: ex.jp, code: ex.code });
}
const existing = sample(existingAll, Math.min(K, existingAll.length)).map((e, i) => ({
  id: `r${round}-c${i}`, source: "chapter", chapter: e.chapter, jp: e.jp, code: e.code, resolves: true,
}));
log(`sampled ${existing.length} existing example(s) from ${existingAll.length}`);

// --- fresh annotate output ---
const pool = fs.existsSync(SENTENCES)
  ? fs.readFileSync(SENTENCES, "utf8").split("\n").map((s) => s.trim()).filter((s) => s && !s.startsWith("#"))
  : [];
// rotate through the pool by round so successive rounds cover different sentences
const fresh = [];
for (let i = 0; i < Math.min(M, pool.length); i++) {
  const jp = pool[(round * M + i) % pool.length];
  try {
    log(`annotate --dry-run: ${jp}`);
    const out = execFileSync("bun", ["scripts/annotate.ts", jp, "--dry-run"], {
      cwd: PLAYGROUND, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], timeout: 180000,
    });
    // strip ANSI, take from the first `import type` onward as the snippet
    const clean = out.replace(/\x1b\[[0-9;]*m/g, "");
    const idx = clean.indexOf("import type");
    if (idx >= 0) {
      fresh.push({ id: `r${round}-a${i}`, source: "annotate", jp, code: clean.slice(idx).trim(), resolves: true });
    } else {
      log(`  (no snippet extracted for ${jp})`);
    }
  } catch (e) {
    log(`  annotate failed for ${jp}: ${String(e).split("\n")[0]}`);
  }
}
log(`generated ${fresh.length}/${M} fresh annotate item(s)`);

process.stdout.write(JSON.stringify({ round, items: [...existing, ...fresh] }, null, 2));
