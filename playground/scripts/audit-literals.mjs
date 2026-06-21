/**
 * Audit: find content words "buried" as raw literal text in example snippets —
 * kanji/katakana runs inside template-literal glue that are NOT in the
 * vocabulary (so they render as unreadable リテラル). These are the spots a
 * re-write must replace with typed constructors (ProperNoun / ConjugateVerb …).
 *
 *   node scripts/audit-literals.mjs           # per-chapter summary
 *   node scripts/audit-literals.mjs --json    # { chapters: { id: [{jp, buried}] } }
 */
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PG = path.resolve(__dirname, "..");
const CH = path.join(PG, "src/tutorial/chapters");
const VOCAB = path.join(PG, "src/vocab");

function evalMod(f) {
  const js = ts.transpileModule(fs.readFileSync(f, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const m = { exports: {} };
  new Function("module", "exports", "require", js)(m, m.exports, () => ({}));
  return m.exports;
}

const keys = new Set();
for (const e of evalMod(path.join(VOCAB, "function-words.ts")).FUNCTION_WORDS) keys.add(e.word);
for (const f of fs.readdirSync(path.join(VOCAB, "entries")).filter((f) => f.endsWith(".ts")))
  for (const e of evalMod(path.join(VOCAB, "entries", f)).default || []) keys.add(e.word);
const MAXLEN = Math.max(...[...keys].map((k) => k.length), 1);

const KANJI = /[㐀-鿿々〆ヶ]/;
const KATA = /[ァ-ヺー]/;

function buriedIn(text) {
  const out = [];
  for (let i = 0; i < text.length; ) {
    if (KANJI.test(text[i])) {
      let j = i;
      while (j < text.length && KANJI.test(text[j])) j++;
      const run = text.slice(i, j);
      if (!keys.has(run)) out.push(run);
      i = j;
    } else if (KATA.test(text[i])) {
      let j = i;
      while (j < text.length && KATA.test(text[j])) j++;
      const run = text.slice(i, j);
      if (run.length > 1 && !keys.has(run)) out.push(run);
      i = j;
    } else {
      let m = null;
      for (let L = Math.min(MAXLEN, text.length - i); L >= 1; L--) {
        const s = text.slice(i, i + L);
        if (keys.has(s) && !KANJI.test(s[0])) { m = s; break; }
      }
      i += m ? m.length : 1;
    }
  }
  return out;
}

function walk(node, acc) {
  if (node.kind === ts.SyntaxKind.TemplateLiteralType) {
    if (node.head.text) acc.push(...buriedIn(node.head.text));
    for (const sp of node.templateSpans) if (sp.literal.text) acc.push(...buriedIn(sp.literal.text));
  }
  ts.forEachChild(node, (c) => walk(c, acc));
}

const chapters = {};
let totalEx = 0, badEx = 0;
for (const f of fs.readdirSync(CH).filter((f) => f.endsWith(".ts") && f !== "index.ts")) {
  const ch = evalMod(path.join(CH, f)).default;
  if (!ch?.points) continue;
  for (const pt of ch.points)
    for (const ex of pt.examples || []) {
      totalEx++;
      const acc = [];
      const sf = ts.createSourceFile("x.ts", ex.code || "", ts.ScriptTarget.Latest, true);
      walk(sf, acc);
      if (acc.length) {
        badEx++;
        (chapters[ch.id] ||= []).push({ jp: ex.jp, buried: [...new Set(acc)] });
      }
    }
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ totalEx, badEx, chapters }, null, 2));
} else {
  console.log(`Examples with buried content words: ${badEx}/${totalEx}`);
  const ids = Object.keys(chapters).sort();
  console.log(`Affected chapters (${ids.length}): ${ids.join(" ")}`);
  for (const id of ids) {
    console.log(`\n[${id}] ${chapters[id].length} example(s)`);
    for (const e of chapters[id]) console.log(`   ${e.jp}  ⟶ buried: ${e.buried.join(" ")}`);
  }
}
process.exit(badEx === 0 ? 0 : 1);
