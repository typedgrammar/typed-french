/**
 * eval-gate.mjs — the verify guardrail for the eval loop's auto-fix step.
 * Runs the three deterministic gates and prints JSON
 *   {snippets, vocab, typecheck, ok}
 * to stdout (booleans). Non-zero exit if any gate fails. Logging → stderr.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLAYGROUND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = (cmd) => {
  try { execSync(cmd, { cwd: PLAYGROUND, stdio: ["ignore", "ignore", "ignore"] }); return true; }
  catch { return false; }
};

const snippets = run("node scripts/verify-snippets.mjs");
const vocab = run("node scripts/verify-vocab.mjs");
const typecheck = run("npx tsc --noEmit");
// Also type-check the root project (src/ + src/examples/) — a library change can
// break example assertions the playground tsconfig doesn't see (caught the Masu
// migration leaving example-verb.ts stale).
const lib = run("npx tsc --noEmit -p ../tsconfig.json");
// annotate.ts is a bun script outside the tsc project. --print-prompt builds the
// full prompt (exercising every template literal in API_REFERENCE / hard-rules /
// few-shots) without calling a model, so a `${…}` interpolation bug — which would
// crash every real codex run — fails the gate instead of slipping through --help.
const annotate = run('bun scripts/annotate.ts "テスト" --print-prompt');
const ok = snippets && vocab && typecheck && lib && annotate;

process.stdout.write(JSON.stringify({ snippets, vocab, typecheck, lib, annotate, ok }));
console.error(`gate: snippets=${snippets} vocab=${vocab} typecheck=${typecheck} lib=${lib} annotate=${annotate} → ${ok ? "PASS" : "FAIL"}`);
process.exit(ok ? 0 : 1);
