#!/usr/bin/env bun
/**
 * annotate — turn a Japanese sentence into a verified Typed Japanese snippet and
 * install it into the playground gallery.
 *
 *   bun run annotate "話して"
 *   bun run annotate "いいよ、来いよ" --title "Connected" --retries 4
 *   bun scripts/annotate.ts "食べた" --model gpt-5 --dry-run
 *   bun scripts/annotate.ts "食べた" --engine claude --model claude-sonnet-4-6 --dry-run
 *
 * Pipeline:
 *   1. Load the live Typed Japanese library (../../src/*.d.ts) as the API the
 *      model must target — so output tracks the real types, not a stale copy.
 *   2. Ask `codex exec` (default) or `claude -p` for a snippet: a series of
 *      `type` aliases whose LAST alias resolves to exactly the input sentence.
 *      Output is a JSON {code,en,title}.
 *   3. Verify in-memory with the TypeScript compiler: it must type-check AND its
 *      last alias must resolve to the input string. A structure audit also
 *      rejects NounPhrase/template-literal shortcuts that hide particles or
 *      non-technical literals.
 *   4. On failure, feed the diagnostics back to the model and retry (up to --retries).
 *   5. On success, upsert the snippet into examples.generated.json; the playground
 *      picks it up via examples.generated.ts. On exhaustion, print the best attempt
 *      and its errors, write nothing, exit 1.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAYGROUND = path.resolve(__dirname, "..");
const REPO = path.resolve(PLAYGROUND, "..");
const GEN_JSON = path.join(PLAYGROUND, "src/data/examples.generated.json");

// Diagnostic codes the playground editor also suppresses ("declared but never
// used" and friends) — a snippet is a sketch, unused aliases are expected.
const IGNORE = new Set([6133, 6196, 6192, 6198, 6205]);

// --- args --------------------------------------------------------------------

interface Args {
  sentence: string;
  title?: string;
  en?: string;
  id?: string;
  retries: number;
  engine: "codex" | "claude";
  model?: string;
  dryRun: boolean;
  help: boolean;
  printPrompt: boolean;
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { sentence: "", retries: 3, engine: "codex", dryRun: false, help: false, printPrompt: false, json: false };
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    switch (a) {
      case "--title": out.title = argv[++i]; break;
      case "--en": out.en = argv[++i]; break;
      case "--id": out.id = argv[++i]; break;
      case "--retries": out.retries = Number(argv[++i]); break;
      case "--engine": {
        const engine = argv[++i];
        if (engine !== "codex" && engine !== "claude") die(`--engine must be "codex" or "claude"`);
        out.engine = engine;
        break;
      }
      case "--model": out.model = argv[++i]; break;
      case "--dry-run": out.dryRun = true; break;
      case "--print-prompt": out.printPrompt = true; break;
      case "--json": out.json = true; out.dryRun = true; break;
      case "-h":
      case "--help": out.help = true; break;
      default:
        if (a.startsWith("--")) die(`Unknown flag: ${a}`);
        positional.push(a);
    }
  }
  out.sentence = positional.join(" ").trim();
  if (!Number.isFinite(out.retries) || out.retries < 1) out.retries = 3;
  return out;
}

function die(msg: string): never {
  console.error(`\x1b[31m✗ ${msg}\x1b[0m`);
  process.exit(1);
}

const USAGE = `Usage: bun run annotate "<日本語の文>" [options]

  --title <s>     Gallery chip title (default: derived from the sentence)
  --en <s>        English gloss override (default: from the model)
  --id <s>        Stable id (default: derived; re-annotating a sentence updates it)
  --retries <n>   Max attempts, errors fed back each time (default: 3)
  --engine <s>    Model runner: codex or claude (default: codex)
  --model <s>     Model passed through to the selected runner
  --dry-run       Verify and print, but don't write to the gallery
`;

// --- library context ---------------------------------------------------------
// A hand-curated cheatsheet of the public API. The full .d.ts is mostly internal
// conjugation maps that only add noise; the model needs the exported signatures
// and the (English) form-name unions. Verification (which loads the REAL ../src
// via the paths mapping) is the source of truth, so this only has to be close.
const API_REFERENCE = `# Verbs — verb-types
GodanVerb    = { type:"godan";    stem:string; ending:"う"|"く"|"ぐ"|"す"|"つ"|"ぬ"|"ぶ"|"む"|"る" }
IchidanVerb  = { type:"ichidan";  stem:string; ending:"る" }
IrregularVerb= { type:"irregular"; dictionary:"する"|"来る"|"くる" }
SuruVerb<Noun extends string> = a noun + する compound verb, e.g. SuruVerb<"勉強"> resolves as 勉強する
ConjugateVerb<V extends Verb, F extends ConjugationForm>
ConjugationForm = "Dictionary"|"MasuStem"|"Masu"|"MasuPast"|"Masen"|"MasenDeshita"|"Te"|"Ta"|"Nai"|"Potential"|"Passive"|"Causative"|"Volitional"|"Imperative"|"Conditional"|"Hypothetical"
  // Polite paradigm is FULLY realized: Masu→話します, MasuPast→話しました, Masen→話しません, MasenDeshita→話しませんでした. MasuStem→話し is the bare 連用形 (use it only to mount たい/ましょう/お〜する/お〜になる/つつ, e.g. お待ちする = お + ConjugateVerb<待つ,"MasuStem"> + する).
  // declare a verb as an intersection: type 話す = GodanVerb & { stem:"話"; ending:"す" };

# Adjectives — adjective-types
IAdjective  = { type:"i-adjective";  stem:string; ending:"い"; irregular?:boolean }
NaAdjective = { type:"na-adjective"; stem:string }
ConjugateAdjective<A extends Adjective, F extends AdjectiveConjugationForm>
AdjectiveConjugationForm = "Basic"|"Polite"|"Past"|"Negative"|"Te"|"Adverbial"  // Adverbial 連用形: i-adj く (早く), na-adj に (上手に). 上手になる → AdjectivePart<上手,"Adverbial"> + VerbPart<なる,...>
  // いい is irregular: type いい = IAdjective & { stem:"い"; ending:"い"; irregular:true };

# Copula だ/です — copula-types (NOT a particle: it inflects)
ConjugateCopula<Taigen extends string, F extends CopulaForm = "Plain">   // = \`\${Taigen}\${Copula<F>}\`
Copula<F extends CopulaForm = "Plain">
CopulaForm = "Plain"(だ)|"Polite"(です)|"Past"(だった)|"PolitePast"(でした)|"Negative"(ではない)|"PoliteNegative"(ではありません)|"NegativePast"(ではなかった)|"PoliteNegativePast"(ではありませんでした)|"CasualNegative"(じゃない)|"CasualPoliteNegative"(じゃありません)|"Written"(である)|"Te"(で)

# Nouns / adverbs — noun-types, adverb-types
CommonNoun<Name extends string>   // = Name — 普通名詞: 猫, 机, 言い訳, 仕事 (the DEFAULT for ordinary nouns)
ProperNoun<Name extends string>   // = Name — 固有名詞: ONLY names of people/places/works/products (東京, ヒンメル, TypeScript)
Pronoun<Name extends string>      // = Name — 代名詞: これ, それ, あれ, ここ, 私, 彼, 誰
Adverb<Word extends string>       // = Word — 副詞 with NO adjective base only: 毎日, すぐ, また, とても, ずっと (NOT 早く/本当に — those are adjective 連用形, see rule below)
Adnominal<Word extends string>    // = Word — 連体詞: この, その, あの, どの (modifies a following noun)
InterrogativeAdverb = "なぜ"|"なんで"|"どうして"|"いつ"|"どこ"|"だれ"|"誰"|"何"|"なに"|"どんな"|"どれ"
Demonstrative = "こう"|"そう"|"ああ"|"どう"

# Phrase combinators — phrase-types
Particle = "は"|"が"|"を"|"に"|"へ"|"で"|"と"|"から"|"まで"|"よ"|"ね"|"か"|"よね"|"の"|"も"|"なら"|"たら"|"れば"|"でも"|"だけ"|"しか"|"ばかり"|"より"|"ほど"|"や"|"とか"|"って"|"こそ"|"さえ"|"くらい"|"ぐらい"|"ので"|"けど"|"のに"|"し"
ConditionalParticle = "なら"|"たら"|"れば"|"と"
PunctuationMark = "、"|"。"|"！"|"？"|"（"|"）"|"("|")"|"「"|"」"|"『"|"』"|"・"

// Preferred output shape for generated annotations:
Sentence<[
  ...PhrasePart[]
]> // joins each part's value with no separator and resolves to the final sentence
VerbPart<V, F>                 // value = ConjugateVerb<V,F>. For polite endings use the form directly (VerbPart<行く,"Masu"> = 行きます) — do NOT add a SuffixPart<"ます">. Past/neg: "MasuPast"/"Masen"/"MasenDeshita".
AdjectivePart<A, F>            // value = ConjugateAdjective<A,F>
NounPart<N extends string>     // one 普通名詞 (common noun) — the default
PronounPart<N extends string>  // a 代名詞: これ / それ / ここ / 私 / 誰
ProperNounPart<N extends string> // a 固有名詞 (name): 東京 / ヒンメル / TypeScript
TechnicalTermPart<T extends string> // filenames, code identifiers, ASCII product names, TODO, degraded, etc.
WhitespacePart<W extends string> // visible spacing between technical terms and Japanese grammar, normally WhitespacePart<" ">
AdverbPart<A extends string>   // one adverb such as まだ / もう / そう
AdnominalPart<A extends string> // one 連体詞 such as この / その / あの / どの
NumeralPart<N extends string>   // a bare numeral such as 三 / 百
CounterPart<Num extends string, Counter extends string> // a counter expression; value joins Num+Counter — 三つ = CounterPart<"三","つ">, 二人 = CounterPart<"二","人">, 一冊 = CounterPart<"一","冊">
ParticlePart<P extends Particle>
CopulaPart<F extends CopulaForm>
SuffixPart<S extends string>   // ONLY bound/grammatical morphemes with no other constructor: た, まま, どおり, ～的, ～化. NEVER a free content word (a な-adjective or noun is NOT a SuffixPart).
PunctuationPart<P extends PunctuationMark>

// Older combinators still exist, but do NOT use NounPhrase for generated long sentences.
NounPhrase<Noun extends string>                                  // = \`\${Noun}\`
PhraseWithParticle<Phrase extends string, P extends Particle>    // = \`\${Phrase}\${P}\`
DemonstrativeAction<Demo extends string, V extends Verb, F extends ConjugationForm = "Dictionary">  // = \`\${Demo}\${ConjugateVerb<V,F>}\`
ConditionalPhrase<Subject extends string, CP extends ConditionalParticle, Result extends string>    // = \`\${Subject}\${CP}\${Result}\`
ConnectedPhrases<P1 extends string, P2 extends string>           // = \`\${P1}、\${P2}\`  (inserts the comma 、 for you)
InterrogativePhrase<Adv extends InterrogativeAdverb, Subject extends string, V extends Verb, VForm extends ConjugationForm, QP extends Particle = "か">  // = \`\${Adv}\${Subject}\${ConjugateVerb<V,VForm>}\${QP}\``;

// Three known-good few-shots (verified against the current English-form API).
const FEWSHOT = `Example 1 — input "話して":
{"code":"import type { GodanVerb, Sentence, VerbPart } from \\"typed-japanese\\";\\n\\ntype 話す = GodanVerb & { stem: \\"話\\"; ending: \\"す\\" };\\ntype 話して = Sentence<[VerbPart<話す, \\"Te\\">]>;\\n","en":"\\u201cspeaking\\u201d \\u2014 the て-form of the godan verb 話す","title":"Verb · て-form"}

Example 2 — input "ヒンメルならそうした":
{"code":"import type { IrregularVerb, NounPart, ParticlePart, Sentence, VerbPart, AdverbPart } from \\"typed-japanese\\";\\n\\ntype する = IrregularVerb & { dictionary: \\"する\\" };\\ntype ヒンメルならそうした = Sentence<[\\n  NounPart<\\"ヒンメル\\">,\\n  ParticlePart<\\"なら\\">,\\n  AdverbPart<\\"そう\\">,\\n  VerbPart<する, \\"Ta\\">\\n]>;\\n","en":"\\u201cIf it were Himmel, he would have done so.\\u201d","title":"Conditional · Himmel"}

Example 3 — input "いいよ、来いよ":
{"code":"import type { IAdjective, IrregularVerb, AdjectivePart, ParticlePart, PunctuationPart, Sentence, VerbPart } from \\"typed-japanese\\";\\n\\ntype いい = IAdjective & { stem: \\"い\\"; ending: \\"い\\"; irregular: true };\\ntype 来る = IrregularVerb & { dictionary: \\"来る\\" };\\ntype いいよ来いよ = Sentence<[\\n  AdjectivePart<いい, \\"Basic\\">,\\n  ParticlePart<\\"よ\\">,\\n  PunctuationPart<\\"、\\">,\\n  VerbPart<来る, \\"Imperative\\">,\\n  ParticlePart<\\"よ\\">\\n]>;\\n","en":"\\u201cIt's fine \\u2014 come on!\\u201d","title":"Connected · いいよ来いよ"}`;

function buildPrompt(sentence: string, prior?: { code: string; errors: string[] }): string {
  const base = `You translate a Japanese sentence into "Typed Japanese": a TypeScript snippet built ONLY from the library below, in which a chain of \`type\` aliases composes the sentence and the LAST alias resolves (via the type system) to the EXACT input string.

# The library API (this is the entire available surface — use nothing else)
${API_REFERENCE}

# Hard rules
- Import the names you use from "typed-japanese".
- Conjugation/copula/adjective FORM names are the ENGLISH identifiers defined in the unions above (e.g. "Te", "Ta", "Masu", "Dictionary", "Imperative", "Basic", "Polite", "Past", "Negative", "Plain"). Never use Japanese form names like "て形".
- The final alias MUST use Sentence<[...parts]> or an alias that expands directly to Sentence<[...parts]>.
- Build the sentence as a flat, auditable part sequence. Every Japanese particle/助詞 in the input must be its own ParticlePart. Split particle-like compounds when useful: でも can be AdjectivePart<..., "Te"> + ParticlePart<"も">, and という can be ParticlePart<"と"> + VerbPart<いう, "Dictionary">.
- Every punctuation mark must be a PunctuationPart. Do not hide 、 。 「 」 （ ） inside noun strings. If the sentence ends with a punctuation mark (。！？」』）…), the LAST element of the tuple MUST be that PunctuationPart — dropping the sentence-final 。 is a hard error even when every preceding part resolves correctly.
- Inflectable Japanese words should use VerbPart, AdjectivePart, or CopulaPart whenever the type system can express them.
- Any noun+する compound (勉強する, 起動する, 確認する, 説明する) MUST be a single SuruVerb<"勉強"> inside one VerbPart — NEVER split into CommonNoun<"勉強"> + a separate IrregularVerb する.
- SuffixPart is ONLY for bound grammatical morphemes. A な-adjective (上手, 便利, 静か, 元気, 有名) is NEVER a SuffixPart and NEVER a NounPart — use AdjectivePart over a NaAdjective stem (上手になる → AdjectivePart<{type:"na-adjective";stem:"上手"},"Adverbial"> giving 上手に, then VerbPart<なる,...>). A common noun is never a SuffixPart either.
- A clause-connecting 接続助詞 after a Te-form (から in 洗ってから, けど, ので) MUST be its own ParticlePart — never glued into a literal after ConjugateVerb<V,"Te">.
- Negative te-forms come from the conjugator: 〜なくて(も) is ConjugateVerb<V,"Nakute"> (来なくて), then も as its own particle — never a frozen なくても literal.
- Stack particles individually: には/では/ても = nested PhraseWithParticle (e.g. PhraseWithParticle<PhraseWithParticle<X,"に">,"は">) or sequential ParticlePart; never write a bare particle literal between typed units.
- Classical auxiliaries (べき, ぬ, ざる) may stay as literals, but a FOLLOWING modern copula だ/です MUST be Copula<"Plain">/ConjugateCopula — write べき\${Copula<"Plain">}, never the literal べきだ.
- An adjective in its 連用形 (i-adjective く: 早く, 高く, よく; na-adjective に: 本当に, 上手に, 静かに) is NOT a lexical 副詞 — model it as AdjectivePart<A, "Adverbial"> (or ConjugateAdjective<A, "Adverbial">), NEVER Adverb/AdverbPart. Reserve Adverb for words with no adjective base (毎日, すぐ, また, とても).
- Choose a verb's class by its REAL conjugation type (godan/ichidan/irregular), NEVER by which class happens to make the target surface resolve. Reclassifying a godan verb as IchidanVerb (or vice versa) to force a form is a hard error even if it type-checks — sanity-check that the implied Dictionary form is a real word. If the library cannot produce a verb's correct surface (e.g. honorific -aru verbs おっしゃる/いらっしゃる/なさる, whose 連用形 is the irregular おっしゃい/いらっしゃい/なさい), declare the verb in its TRUE class and write the unmodelable inflected surface as a documented raw literal — do not fake the class.
- A SuffixPart string must NEVER contain a conjugatable verb stem. Negation ない / polite negative come from the conjugator: 得ない = VerbPart<得る,"Nai">, 行かない = VerbPart<行く,"Nai">, NOT VerbPart<…,"MasuStem"> + SuffixPart<"ない"> and NOT SuffixPart<"行かざる">. Expose the lexical verb as a VerbPart; only a genuinely unmodeled bound auxiliary (e.g. classical ざる) may be a trailing SuffixPart after that VerbPart. Likewise NEVER model plain negation as VerbPart<V,"Dictionary"> + a standalone ない (SuffixPart<"ない"> or AdjectivePart<ない,"Basic">): that double-counts the verb ending (足りる + ない = 足りるない, WRONG). The verb MUST be in its "Nai" form (ichidan → bare stem 足り, godan → a-row 飲ま), then ない is appended: 足りない = VerbPart<足りる,"Nai"> + SuffixPart<"ない">.
- The polite form of a POTENTIAL verb (可能形 + ます: 行けます, いただけます, 見られます, できます) is ONE VerbPart<V,"PotentialMasu"> on the verb that is actually capable — NEVER apply Potential to a preceding noun or する-compound, and NEVER use "Masu" (which gives the plain いただきます, not the potential いただけます). For お〜いただけます / 〜ていただけます keep the lexical verb いただく and use "PotentialMasu"; plain potential without ます stays "Potential".
- Pick the noun part by subclass: PronounPart for 代名詞 (これ/それ/ここ/私/誰), ProperNounPart for 固有名詞 (names), NounPart for ordinary 普通名詞. A demonstrative pronoun followed by a particle MUST split: ここで → PronounPart<"ここ"> + ParticlePart<"で">, never a literal ここで. Formal-noun grammar (わけ/はず/つもり/こと + に/は/が) MUST expose the formal noun (NounPart) and each particle as separate parts — never freeze わけにはいかない as one literal.
- When you declare a standalone noun alias, pick the right subclass: CommonNoun for ordinary nouns (the default), ProperNoun ONLY for actual names (people/places/works/products), Pronoun for これ/それ/彼/誰. Never wrap a whole phrase (e.g. 机の上, この本) or a non-noun (adverb, na-adjective) in a noun type — 机の上 is 机 + の + 上, この本 is Adnominal<"この"> + CommonNoun<"本">.
- NounPart is for NOUNS ONLY; never put a non-noun in it. A 連体詞 (この/その/あの/どの) MUST be an AdnominalPart<"その">, never a NounPart. A な-adjective (便利, 静か, 有名) is NOT a noun: attributively use AdjectivePart<NaAdjective, "Basic"> (→ 便利な); as a plain predicate (便利だ) use AdjectivePart<NaAdjective, "Basic"> only when な is wanted — for the bare-stem + copula predicate, model 便利 as the NaAdjective and だ as CopulaPart<"Plain">. Wrapping 便利 or その in NounPart is a hard error. Likewise a counter expression (三つ, 二人, 一冊, 五枚) is a 数詞, NOT a noun: use CounterPart<Num, Counter> (三つ → CounterPart<"三","つ">), and a bare numeral uses NumeralPart — never NounPart.
- Technical identifiers and English/code terms (filenames, env, TODO, degraded, pb_test_<slug>) should use TechnicalTermPart. Japanese lexical content words may use NounPart or AdverbPart, but a NounPart/AdverbPart must be ONE lexical unit, not a clause with particles inside it.
- Do not put leading/trailing spaces inside TechnicalTermPart. Use WhitespacePart<" "> for spaces around English/code terms, while spaces inside one technical expression such as "hello world" or "pb_test_<slug> + sim-users seed" must stay inside that one TechnicalTermPart.
- Do not use NounPhrase<"...">, template literal glue, or long raw string literals as a shortcut. Literal-looking content is allowed only for technical terms or one lexical content word wrapped in a typed part.
- The FINAL \`type\` alias must resolve to exactly: ${JSON.stringify(sentence)} — no more, no less. A trailing period/particle counts.
- If the sentence is richer than the library can express, still keep all particles and punctuation as typed parts; use SuffixPart for small grammatical endings/auxiliaries that are not otherwise modeled.
- Do not edit files, run commands, or explain your reasoning. Return the JSON object only.

# Output format
Respond with ONLY a single JSON object (no markdown fence, no prose) with exactly these string fields:
  {"code": "<the TypeScript snippet, newlines as \\n>", "en": "<short English gloss>", "title": "<short gallery title>"}

# Examples
${FEWSHOT}`;

  if (!prior) {
    return `${base}\n\n# Your task\nInput sentence: ${JSON.stringify(sentence)}\nRespond with the JSON object now.`;
  }
  return `${base}\n\n# Your previous attempt FAILED verification
Previous code:
\`\`\`typescript
${prior.code}
\`\`\`
Verification errors:
${prior.errors.map((e) => `- ${e}`).join("\n")}

Fix the snippet so it type-checks AND its last alias resolves to exactly ${JSON.stringify(sentence)}. Respond with the corrected JSON object now.`;
}

// --- model calls -------------------------------------------------------------

function callCodex(prompt: string, model?: string): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "typed-japanese-annotate-"));
  const outputFile = path.join(tmp, "last-message.txt");
  const schemaFile = path.join(tmp, "schema.json");
  fs.writeFileSync(
    schemaFile,
    JSON.stringify({
      type: "object",
      additionalProperties: false,
      required: ["code", "en", "title"],
      properties: {
        code: { type: "string" },
        en: { type: "string" },
        title: { type: "string" },
      },
    })
  );

  const args = [
    "exec",
    "--ephemeral",
    "--sandbox",
    "read-only",
    "--color",
    "never",
    "-C",
    REPO,
    "--output-schema",
    schemaFile,
    "-o",
    outputFile,
  ];
  if (model) args.push("--model", model);
  args.push("-");

  try {
    const res = spawnSync("codex", args, {
      input: prompt,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    if (res.error) {
      if ((res.error as NodeJS.ErrnoException).code === "ENOENT") {
        die("`codex` CLI not found on PATH. Install Codex CLI first.");
      }
      die(`Failed to run codex: ${res.error.message}`);
    }
    if (res.status !== 0) {
      die(`codex exited with code ${res.status}:\n${res.stderr || res.stdout}`);
    }
    if (fs.existsSync(outputFile)) return fs.readFileSync(outputFile, "utf8");
    return res.stdout;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function callClaude(prompt: string, model?: string): string {
  const args = ["-p", prompt, "--output-format", "text"];
  if (model) args.push("--model", model);
  const res = spawnSync("claude", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error) {
    if ((res.error as NodeJS.ErrnoException).code === "ENOENT") {
      die("`claude` CLI not found on PATH. Install Claude Code first.");
    }
    die(`Failed to run claude: ${res.error.message}`);
  }
  if (res.status !== 0) {
    die(`claude exited with code ${res.status}:\n${res.stderr || res.stdout}`);
  }
  return res.stdout;
}

function callModel(engine: Args["engine"], prompt: string, model?: string): string {
  return engine === "codex" ? callCodex(prompt, model) : callClaude(prompt, model);
}

interface ModelResult {
  code: string;
  en: string;
  title: string;
}

function parseResult(raw: string): ModelResult {
  let s = raw.trim();
  // Strip a stray ```json … ``` fence if the model added one.
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1]!.trim();
  // Fall back to the outermost { … } span.
  if (!s.startsWith("{")) {
    const a = s.indexOf("{");
    const b = s.lastIndexOf("}");
    if (a >= 0 && b > a) s = s.slice(a, b + 1);
  }
  let obj: unknown;
  try {
    obj = JSON.parse(s);
  } catch (e) {
    throw new Error(`model did not return valid JSON: ${(e as Error).message}\n--- raw ---\n${raw.slice(0, 800)}`);
  }
  const o = obj as Record<string, unknown>;
  if (typeof o.code !== "string" || !o.code.trim()) {
    throw new Error(`model JSON missing a "code" string`);
  }
  return {
    code: o.code,
    en: typeof o.en === "string" ? o.en : "",
    title: typeof o.title === "string" ? o.title : "",
  };
}

// --- verification (type-check + last-alias resolves to the input) ------------

interface CheckResult {
  ok: boolean;
  errors: string[];
  resolved: string | null;
}

const PART_TYPE_NAMES = new Set([
  "VerbPart",
  "AdjectivePart",
  "NounPart",
  "TechnicalTermPart",
  "WhitespacePart",
  "AdverbPart",
  "ParticlePart",
  "CopulaPart",
  "SuffixPart",
  "IntensifierPart",
  "ContractedPart",
  "NestedPhrasePart",
  "PunctuationPart",
]);
const SCALAR_PART_TYPE_NAMES = new Set([
  "NounPart",
  "TechnicalTermPart",
  "WhitespacePart",
  "AdverbPart",
  "ParticlePart",
  "CopulaPart",
  "SuffixPart",
  "IntensifierPart",
  "ContractedPart",
  "NestedPhrasePart",
  "PunctuationPart",
]);
const PARTICLE_LITERALS = new Set([
  "は", "が", "を", "に", "へ", "で", "と", "から", "まで", "よ", "ね", "か", "よね", "の", "も",
  "なら", "たら", "れば", "でも", "だけ", "しか", "ばかり", "より", "ほど", "や", "とか", "って",
  "こそ", "さえ", "くらい", "ぐらい", "ので", "けど", "のに", "し",
]);
const PUNCTUATION_LITERALS = new Set(["、", "。", "！", "？", "（", "）", "(", ")", "「", "」", "『", "』", "・"]);
const FORM_LITERALS = new Set([
  "Dictionary", "Masu", "Te", "Ta", "Nai", "Potential", "Passive", "Causative", "Volitional",
  "Imperative", "Conditional", "Hypothetical", "Basic", "Polite", "Past", "Negative", "Plain",
  "PolitePast", "PoliteNegative", "NegativePast", "PoliteNegativePast", "CasualNegative",
  "CasualPoliteNegative", "Written",
]);
const JAPANESE = /[\u3040-\u30ff\u3400-\u9fff]/u;
const JAPANESE_OR_TECH_BOUNDARY = /[\u3040-\u30ff\u3400-\u9fffA-Za-z0-9_>）」]/u;
const JAPANESE_PUNCTUATION = /[、。！？「」『』（）]/u;
const CASE_PARTICLES = new Set(["は", "が", "を", "に", "へ", "で", "と", "の", "も"]);

// Common 形式名詞 / pronouns conventionally written in kana that happen to *contain*
// a particle homograph (こと→と, もの→の, からだ→から, はず→は). They are single
// lexemes, so the buried-particle heuristic must not split them. We can't consult
// the playground's VOCAB table here: dictionary.ts is built with Vite's
// `import.meta.glob` (unavailable under bun) and, more to the point, these formal
// nouns aren't course vocabulary anyway. Open-class all-kana content words (やま,
// はな) are rare in generated output; add them here if they ever surface.
const KANA_LEXEME_EXCEPTIONS = new Set([
  "もの", "もん", "こと", "ところ", "とき", "はず", "からだ", "こども", "ひと",
  "もと", "とも", "つもり",
]);

function structuralAudit(code: string): string[] {
  const errors: string[] = [];
  const sf = ts.createSourceFile("__annotate_structure.ts", code, ts.ScriptTarget.Latest, true);
  const aliasMap = new Map<string, ts.TypeAliasDeclaration>();
  for (const stmt of sf.statements) {
    if (ts.isTypeAliasDeclaration(stmt)) aliasMap.set(stmt.name.text, stmt);
  }

  const aliases = sf.statements.filter(ts.isTypeAliasDeclaration);
  const last = aliases[aliases.length - 1];
  if (!last) return ["structure: snippet declares no final type alias"];

  const entityName = (name: ts.EntityName): string =>
    ts.isIdentifier(name) ? name.text : name.right.text;
  const typeRefName = (node: ts.TypeNode): string | null =>
    ts.isTypeReferenceNode(node) ? entityName(node.typeName) : null;

  function unwrapAlias(node: ts.TypeNode, seen = new Set<string>()): ts.TypeNode {
    if (!ts.isTypeReferenceNode(node) || node.typeArguments?.length) return node;
    const name = entityName(node.typeName);
    if (seen.has(name)) return node;
    const decl = aliasMap.get(name);
    if (!decl) return node;
    seen.add(name);
    return unwrapAlias(decl.type, seen);
  }

  function literalArg(node: ts.TypeNode | undefined): string | null {
    return node &&
      ts.isLiteralTypeNode(node) &&
      ts.isStringLiteral(node.literal)
      ? node.literal.text
      : null;
  }

  function isTechnicalTerm(value: string): boolean {
    return !JAPANESE.test(value) && /[A-Za-z0-9]/.test(value);
  }

  function hasBuriedParticle(value: string): string | null {
    const particles = [...PARTICLE_LITERALS].sort((a, b) => b.length - a.length);
    for (const particle of particles) {
      if (value === particle) return particle;
      let idx = value.indexOf(particle);
      while (idx >= 0) {
        const before = value[idx - 1] ?? "";
        const after = value[idx + particle.length] ?? "";
        const beforeBoundary = before === "" || JAPANESE_OR_TECH_BOUNDARY.test(before);
        const afterBoundary = after === "" || JAPANESE_OR_TECH_BOUNDARY.test(after);
        if (particle.length > 1 && beforeBoundary && afterBoundary) return particle;
        if (CASE_PARTICLES.has(particle) && beforeBoundary && afterBoundary) return particle;
        idx = value.indexOf(particle, idx + 1);
      }
    }
    return null;
  }

  function validateLexicalPart(kind: string, value: string): void {
    if (!value) errors.push(`structure: ${kind} must not be empty`);
    if (JAPANESE_PUNCTUATION.test(value)) {
      errors.push(`structure: ${kind}<${JSON.stringify(value)}> hides punctuation; use PunctuationPart`);
    }
    if (JAPANESE.test(value) && /[A-Za-z0-9_./:<>\-+]/.test(value)) {
      errors.push(`structure: ${kind}<${JSON.stringify(value)}> mixes technical text with Japanese; split TechnicalTermPart and Japanese parts`);
    }
    if (isTechnicalTerm(value) && kind !== "TechnicalTermPart") {
      errors.push(`structure: ${kind}<${JSON.stringify(value)}> looks technical; use TechnicalTermPart`);
    }
    // Only a noun realistically crams a case particle onto its tail (会社に). An
    // adverb / intensifier / nested phrase is an atomic or multi-word lexeme, so
    // splitting a particle homograph out of e.g. AdverbPart<"いつも"> (always) or
    // とても would be wrong — don't run the buried-particle check on those.
    const buried =
      kind === "NounPart" && !KANA_LEXEME_EXCEPTIONS.has(value)
        ? hasBuriedParticle(value)
        : null;
    if (buried) {
      errors.push(`structure: ${kind}<${JSON.stringify(value)}> hides particle ${JSON.stringify(buried)}; split it into ParticlePart`);
    }
  }

  function validatePart(name: string, node: ts.TypeReferenceNode): void {
    const args = node.typeArguments ?? [];
    if (name === "TechnicalTermPart") {
      const value = literalArg(args[0]);
      if (!value) errors.push("structure: TechnicalTermPart needs a string literal argument");
      else if (value.trim() !== value) {
        errors.push(`structure: TechnicalTermPart<${JSON.stringify(value)}> has leading/trailing whitespace; use WhitespacePart<" "> around it`);
      }
      else if (!isTechnicalTerm(value)) {
        errors.push(`structure: TechnicalTermPart<${JSON.stringify(value)}> should be reserved for non-Japanese code/technical terms`);
      }
      return;
    }
    if (name === "WhitespacePart") {
      const value = literalArg(args[0]);
      if (!value || !/^\s+$/.test(value)) {
        errors.push(`structure: WhitespacePart must contain only whitespace, got ${JSON.stringify(value)}`);
      }
      return;
    }
    if (name === "NounPart" || name === "AdverbPart" || name === "IntensifierPart" || name === "NestedPhrasePart") {
      const value = literalArg(args[0]);
      if (value) validateLexicalPart(name, value);
      return;
    }
    if (name === "SuffixPart" || name === "ContractedPart") {
      const value = literalArg(args[args.length - 1]);
      const buried = value && !KANA_LEXEME_EXCEPTIONS.has(value) && hasBuriedParticle(value);
      if (value && (JAPANESE_PUNCTUATION.test(value) || buried)) {
        errors.push(`structure: ${name}<${JSON.stringify(value)}> is too large; split particles/punctuation into their own parts`);
      }
      return;
    }
    if (name === "ParticlePart") {
      const value = literalArg(args[0]);
      if (!value || !PARTICLE_LITERALS.has(value)) {
        errors.push(`structure: ParticlePart must use a known particle literal, got ${JSON.stringify(value)}`);
      }
      return;
    }
    if (name === "PunctuationPart") {
      const value = literalArg(args[0]);
      if (!value || !PUNCTUATION_LITERALS.has(value)) {
        errors.push(`structure: PunctuationPart must use a known punctuation literal, got ${JSON.stringify(value)}`);
      }
      return;
    }
    if (name === "CopulaPart") {
      const value = literalArg(args[0]);
      if (value && !FORM_LITERALS.has(value)) {
        errors.push(`structure: CopulaPart must use an English copula form, got ${JSON.stringify(value)}`);
      }
    }
  }

  function visit(node: ts.TypeNode): void {
    const unwrapped = unwrapAlias(node);

    if (ts.isTemplateLiteralTypeNode(unwrapped)) {
      errors.push("structure: template literal glue hides components; use Sentence<[...parts]> instead");
      return;
    }
    if (ts.isTupleTypeNode(unwrapped)) {
      for (const element of unwrapped.elements) visit(element);
      return;
    }
    if (!ts.isTypeReferenceNode(unwrapped)) {
      return;
    }

    const name = typeRefName(unwrapped);
    if (name === "NounPhrase") {
      errors.push("structure: NounPhrase hides sentence structure; use Sentence<[NounPart/ParticlePart/...]> instead");
      return;
    }
    if (name && PART_TYPE_NAMES.has(name)) {
      validatePart(name, unwrapped);
      if (!SCALAR_PART_TYPE_NAMES.has(name)) {
        for (const arg of unwrapped.typeArguments ?? []) visit(arg);
      }
      return;
    }
    for (const arg of unwrapped.typeArguments ?? []) visit(arg);
  }

  const root = unwrapAlias(last.type);
  const rootName = typeRefName(root);
  if (rootName !== "Sentence") {
    errors.push("structure: final alias must be Sentence<[...parts]> so particles and literals are auditable");
  }
  visit(root);

  return [...new Set(errors)];
}

function verify(code: string, sentence: string): CheckResult {
  const fileName = path.join(PLAYGROUND, "__annotate_check.ts");
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    lib: ["lib.es2020.d.ts"],
    baseUrl: REPO,
    paths: { "typed-japanese": ["src/index"] },
  };

  const host = ts.createCompilerHost(options);
  const origGet = host.getSourceFile.bind(host);
  host.getSourceFile = (name, lang, ...rest) =>
    name === fileName
      ? ts.createSourceFile(name, code, lang)
      : origGet(name, lang, ...rest);
  const origRead = host.readFile.bind(host);
  host.readFile = (name) => (name === fileName ? code : origRead(name));
  const origExists = host.fileExists.bind(host);
  host.fileExists = (name) => name === fileName || origExists(name);

  const program = ts.createProgram([fileName], options, host);
  const diags = ts.getPreEmitDiagnostics(program).filter((d) => !IGNORE.has(d.code));
  const errors = diags.map((d) => `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);

  // Resolve the last type alias to its string-literal value.
  let resolved: string | null = null;
  const sf = program.getSourceFile(fileName);
  if (sf) {
    const aliases = sf.statements.filter(ts.isTypeAliasDeclaration);
    const last = aliases[aliases.length - 1];
    if (!last) {
      errors.push("snippet declares no `type` alias to use as the sentence");
    } else {
      try {
        const checker = program.getTypeChecker();
        const type = checker.getTypeFromTypeNode(last.type);
        const str = checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
        const m = str.match(/^"([\s\S]*)"$/);
        resolved = m ? m[1] : str;
      } catch (e) {
        errors.push(`could not resolve the last alias: ${(e as Error).message}`);
      }
    }
  }

  if (errors.length === 0 && resolved !== sentence) {
    errors.push(
      `last alias resolves to ${JSON.stringify(resolved)} but must resolve to ${JSON.stringify(sentence)}`
    );
  }
  errors.push(...structuralAudit(code));
  return { ok: errors.length === 0, errors, resolved };
}

// --- gallery store -----------------------------------------------------------

interface Snippet {
  id: string;
  title: string;
  jp: string;
  en: string;
  code: string;
}

function loadStore(): Snippet[] {
  if (!fs.existsSync(GEN_JSON)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(GEN_JSON, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveStore(entries: Snippet[]): void {
  fs.writeFileSync(GEN_JSON, JSON.stringify(entries, null, 2) + "\n");
}

function makeId(sentence: string, existing: Snippet[]): string {
  let n = 0;
  for (const s of sentence) n = (n * 31 + s.codePointAt(0)!) >>> 0;
  let id = `gen-${n.toString(36)}`;
  const taken = new Set(existing.map((e) => e.id));
  let id2 = id, k = 1;
  while (taken.has(id2)) id2 = `${id}-${k++}`;
  return id2;
}

// --- main --------------------------------------------------------------------

const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    process.exit(0);
  }
  // Smoke-check the prompt template literals without calling any model — the gate
  // runs this so a `${…}` bug in the prompt (which would crash every real run)
  // can't slip through `--help`.
  if (args.printPrompt) {
    const p = buildPrompt(args.sentence || "テスト");
    console.log(`prompt OK (${p.length} chars)`);
    process.exit(0);
  }
  if (!args.sentence) {
    console.log(USAGE);
    die("a Japanese sentence is required.");
  }

  console.log(`\n${cyan("◆ annotate")} ${args.sentence}`);

  let best: { result: ModelResult; check: CheckResult } | null = null;
  let prior: { code: string; errors: string[] } | undefined;
  let attemptsUsed = 0;

  for (let attempt = 1; attempt <= args.retries; attempt++) {
    attemptsUsed = attempt;
    console.log(dim(`  attempt ${attempt}/${args.retries} — asking ${args.engine}…`));
    const prompt = buildPrompt(args.sentence, prior);

    let result: ModelResult;
    try {
      result = parseResult(callModel(args.engine, prompt, args.model));
    } catch (e) {
      console.log(dim(`    ${(e as Error).message.split("\n")[0]}`));
      prior = { code: prior?.code ?? "", errors: [(e as Error).message] };
      continue;
    }

    const check = verify(result.code, args.sentence);
    best = { result, check };

    if (check.ok) {
      console.log(green(`  ✓ verified — resolves to "${check.resolved}"`));
      break;
    }
    console.log(`  ✗ ${check.errors.length} error(s):`);
    for (const e of check.errors.slice(0, 4)) console.log(dim(`      ${e}`));
    prior = { code: result.code, errors: check.errors };
  }

  // Machine-readable result (for the eval harness): the best attempt's resolved
  // value, code, and pass/fail — even on failure, so the harness can diff the
  // drift. Delimited so it survives the human progress logs on stdout.
  if (args.json) {
    const out = best
      ? { ok: best.check.ok, resolved: best.check.resolved ?? null, code: best.result.code, title: best.result.title ?? "", en: best.result.en ?? "", errors: best.check.errors ?? [], attempts: attemptsUsed }
      : { ok: false, resolved: null, code: null, title: "", en: "", errors: ["no model output"], attempts: attemptsUsed };
    process.stdout.write(`\n@@TJJSON@@${JSON.stringify(out)}@@END@@\n`);
    process.exit(0);
  }

  if (!best || !best.check.ok) {
    console.log(`\n${"\x1b[31m"}✗ Gave up after ${args.retries} attempt(s).\x1b[0m`);
    if (best) {
      console.log(dim("\nBest attempt (not installed):\n"));
      console.log(best.result.code);
    }
    process.exit(1);
  }

  if (args.dryRun) {
    console.log(dim("\n--dry-run: not writing to the gallery. Snippet:\n"));
    console.log(best.result.code);
    process.exit(0);
  }

  const store = loadStore();
  const existingIdx = store.findIndex((e) => e.jp === args.sentence);
  const id = args.id ?? (existingIdx >= 0 ? store[existingIdx]!.id : makeId(args.sentence, store));
  const entry: Snippet = {
    id,
    title: args.title || best.result.title || args.sentence,
    jp: args.sentence,
    en: args.en || best.result.en || "",
    code: best.result.code,
  };
  if (existingIdx >= 0) store[existingIdx] = entry;
  else store.push(entry);
  saveStore(store);

  console.log(green(`\n✓ Installed as "${entry.title}" (${id}).`));
  console.log(dim(`  ${existingIdx >= 0 ? "Updated" : "Added"} → ${path.relative(REPO, GEN_JSON)}`));
  console.log(dim(`  Run \`pnpm dev\` (in playground/) and open the Type Playground to see it.`));
}

// Run as a CLI when invoked directly; stay importable (structuralAudit/verify)
// for tests when loaded as a module.
if (import.meta.main) main();

export { structuralAudit, verify, buildPrompt, callModel, parseResult };
export type { ModelResult, CheckResult };
