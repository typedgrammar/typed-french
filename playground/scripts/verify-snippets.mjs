/**
 * Verify that every tutorial/generated example's `code` snippet type-checks
 * against the real Typed French library. Run from the playground/ directory:
 *
 *   node scripts/verify-snippets.mjs            # human summary
 *   node scripts/verify-snippets.mjs --json     # machine-readable failures
 *
 * Loads each chapter module, extracts example snippets, and type-checks them in
 * a single in-memory TypeScript program where `typed-french` maps to ../src.
 * Exits non-zero if any snippet fails (ignoring "unused" diagnostics, which the
 * playground editor also suppresses).
 */
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAYGROUND = path.resolve(__dirname, "..");
const REPO = path.resolve(PLAYGROUND, "..");
const CHAPTERS_DIR = path.join(PLAYGROUND, "src/tutorial/chapters");
const GENERATED_JSON = path.join(PLAYGROUND, "src/data/examples.generated.json");
const IGNORE = new Set([6133, 6196, 6192, 6198, 6205]);

const jsonOut = process.argv.includes("--json");

// --- load chapter modules (type-only imports erase, leaving a plain object) ---
function loadChapter(file) {
  const src = fs.readFileSync(file, "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("module", "exports", "require", js)(mod, mod.exports, () => ({}));
  return mod.exports.default;
}

const chapterFiles = fs
  .readdirSync(CHAPTERS_DIR)
  .filter((f) => f.endsWith(".ts") && f !== "index.ts")
  .sort();

const examples = []; // { id, file, fr, code }
for (const f of chapterFiles) {
  let chapter;
  try {
    chapter = loadChapter(path.join(CHAPTERS_DIR, f));
  } catch (e) {
    examples.push({ id: f, file: `${f}::LOAD`, fr: "", code: "", loadError: String(e) });
    continue;
  }
  if (!chapter?.points) continue;
  chapter.points.forEach((pt, pi) =>
    (pt.examples || []).forEach((ex, ei) => {
      examples.push({
        id: chapter.id,
        file: `${chapter.id}/${pt.id ?? pi}/${ei}`,
        fr: ex.fr,
        code: ex.code ?? "",
      });
    })
  );
}

if (fs.existsSync(GENERATED_JSON)) {
  const generated = JSON.parse(fs.readFileSync(GENERATED_JSON, "utf8"));
  if (Array.isArray(generated)) {
    generated.forEach((ex, i) => {
      examples.push({
        id: "generated",
        file: `generated/${ex.id ?? i}`,
        fr: ex.fr ?? "",
        code: ex.code ?? "",
      });
    });
  }
}

// --- build one in-memory program over all snippets ---
const virtual = new Map(); // fileName -> source
const rootNames = [];
examples.forEach((ex, i) => {
  if (ex.loadError) return;
  const name = path.join(PLAYGROUND, `__ex_${i}.ts`);
  virtual.set(name, ex.code);
  ex._name = name;
  rootNames.push(name);
});

const options = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  skipLibCheck: true,
  noEmit: true,
  lib: ["lib.es2020.d.ts"],
  baseUrl: REPO,
  paths: { "typed-french": ["src/index"] },
};

const host = ts.createCompilerHost(options);
const origGet = host.getSourceFile.bind(host);
const origRead = host.readFile.bind(host);
const origExists = host.fileExists.bind(host);
host.getSourceFile = (fileName, lang, ...rest) =>
  virtual.has(fileName)
    ? ts.createSourceFile(fileName, virtual.get(fileName), lang)
    : origGet(fileName, lang, ...rest);
host.readFile = (fileName) => (virtual.has(fileName) ? virtual.get(fileName) : origRead(fileName));
host.fileExists = (fileName) => virtual.has(fileName) || origExists(fileName);

const program = ts.createProgram(rootNames, options, host);
const diags = ts.getPreEmitDiagnostics(program).filter((d) => !IGNORE.has(d.code));

const failures = new Map(); // _name -> [messages]
for (const d of diags) {
  const name = d.file?.fileName;
  if (!name) continue;
  const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
  if (!failures.has(name)) failures.set(name, []);
  failures.get(name).push(`TS${d.code}: ${msg}`);
}

// --- also check each snippet's last alias resolves to exactly example.fr ---
const checker = program.getTypeChecker();
function resolvedString(ex) {
  const sf = program.getSourceFile(ex._name);
  if (!sf) return null;
  const aliases = sf.statements.filter(ts.isTypeAliasDeclaration);
  const last = aliases[aliases.length - 1];
  if (!last) return null;
  try {
    const type = checker.getTypeFromTypeNode(last.type);
    const str = checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
    const m = str.match(/^"([\s\S]*)"$/);
    return m ? m[1] : str;
  } catch {
    return null;
  }
}

const report = [];
for (const ex of examples) {
  if (ex.loadError) {
    report.push({ chapter: ex.id, where: ex.file, fr: ex.fr, errors: [ex.loadError] });
    continue;
  }
  const errs = failures.get(ex._name) ? [...failures.get(ex._name)] : [];
  if (errs.length === 0) {
    const got = resolvedString(ex);
    if (got !== ex.fr) {
      errs.push(`resolves to "${got}" but example.fr is "${ex.fr}"`);
    }
  }
  if (errs.length > 0) {
    report.push({ chapter: ex.id, where: ex.file, fr: ex.fr, errors: errs });
  }
}

if (jsonOut) {
  console.log(JSON.stringify({ total: examples.length, failed: report.length, report }, null, 2));
} else {
  console.log(`Checked ${examples.length} example snippets across ${chapterFiles.length} chapters plus generated snippets.`);
  if (report.length === 0) {
    console.log("✓ All snippets type-check against the library.");
  } else {
    console.log(`✗ ${report.length} snippet(s) failed:\n`);
    for (const r of report) {
      console.log(`  [${r.where}] ${r.fr}`);
      for (const e of r.errors.slice(0, 3)) console.log(`     ${e.split("\n")[0]}`);
    }
  }
}

process.exit(report.length === 0 ? 0 : 1);
