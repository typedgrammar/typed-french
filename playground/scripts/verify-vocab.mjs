/**
 * Guarantee that every content word used in the tutorial's Typed French
 * snippets indexes into the maintained vocabulary table. This is the
 * compiler-checked link between the course and src/vocab.
 *
 *   node scripts/verify-vocab.mjs            # summary, exits non-zero on gaps
 *   node scripts/verify-vocab.mjs --json     # { missing: [...] }
 *
 * Words are pulled from each example's `code` with the SAME extractor the UI
 * uses (src/vocab/extract.ts). The vocabulary keys come from
 * src/vocab/function-words.ts + src/vocab/entries/*.ts.
 */
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAYGROUND = path.resolve(__dirname, "..");
const VOCAB_DIR = path.join(PLAYGROUND, "src/vocab");
const CHAPTERS_DIR = path.join(PLAYGROUND, "src/tutorial/chapters");

function evalModule(file) {
  const src = fs.readFileSync(file, "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("module", "exports", "require", js)(mod, mod.exports, () => ({}));
  return mod.exports;
}

const { extractWords } = evalModule(path.join(VOCAB_DIR, "extract.ts"));

// --- collect vocabulary keys ---
const keys = new Set();
const addEntries = (arr) => {
  for (const e of arr || []) if (e?.word) keys.add(e.word);
};
addEntries(evalModule(path.join(VOCAB_DIR, "function-words.ts")).FUNCTION_WORDS);

const entriesDir = path.join(VOCAB_DIR, "entries");
if (fs.existsSync(entriesDir)) {
  for (const f of fs.readdirSync(entriesDir).filter((f) => f.endsWith(".ts"))) {
    const mod = evalModule(path.join(entriesDir, f));
    addEntries(mod.default || mod.entries);
  }
}

// --- collect required words from every chapter example's code ---
const required = new Map(); // word -> pos
if (fs.existsSync(CHAPTERS_DIR)) {
  for (const f of fs.readdirSync(CHAPTERS_DIR).filter((f) => f.endsWith(".ts") && f !== "index.ts")) {
    const ch = evalModule(path.join(CHAPTERS_DIR, f)).default;
    if (!ch?.points) continue;
    for (const pt of ch.points) {
      for (const ex of pt.examples || []) {
        for (const { word, pos } of extractWords(ex.code || "")) {
          if (!required.has(word)) required.set(word, pos);
        }
      }
    }
  }
}

const missing = [...required.entries()]
  .filter(([word]) => !keys.has(word))
  .map(([word, pos]) => ({ word, pos }));

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ totalRequired: required.size, vocabKeys: keys.size, missing }, null, 2));
} else {
  console.log(`Vocabulary keys: ${keys.size} | words used by course: ${required.size}`);
  if (missing.length === 0) {
    console.log("✓ Every course word is indexed in the vocabulary table.");
  } else {
    console.log(`✗ ${missing.length} word(s) missing from the table:\n`);
    for (const m of missing) console.log(`  ${m.word}  (${m.pos})`);
  }
}

process.exit(missing.length === 0 ? 0 : 1);
