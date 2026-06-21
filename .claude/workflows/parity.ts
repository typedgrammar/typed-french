export const meta = {
  name: "typed-french-parity",
  description:
    "Generate Typed French course chapters (+ their vocab) toward feature parity, then verify every snippet type-checks and resolves to its sentence.",
  whenToUse:
    "Run to add grammar-course chapters to typed-french. Pass args.chapters (a list of {id, level, order, titleEn, titleZh, topicEn, topicZh}); defaults to an elementary batch.",
  phases: [
    { title: "Author", detail: "one agent per chapter writes chapters/<id>.ts + entries/<id>.ts" },
    { title: "Verify & fix", detail: "run verify:snippets + verify:vocab, fix until both pass" },
  ],
};

// ---------------------------------------------------------------------------
// Typed French DSL cheat-sheet handed to every authoring agent. Keep in sync
// with src/*.d.ts.
// ---------------------------------------------------------------------------
const DSL = `TYPED FRENCH DSL — import from "typed-french":
NOUNS (gender is required for common nouns):
  CommonNoun<"chat","m"> | CommonNoun<"femme","f"> ; ProperNoun<"Marie"> ; Pronoun<"je"> ; Adverb<"vite">
DETERMINER + NOUN (article surface auto-computed from gender / elision / number):
  DefiniteNP<Noun[, "p"]>   -> "le chat" / "la femme" / "l'homme" / "les chats"
  IndefiniteNP<Noun[, "p"]> -> "un chat" / "une femme" / "des chats"
  PartitiveNP<Noun[, "p"]>  -> "du pain" / "de la confiture" / "de l'eau" / "des fruits"
ADJECTIVE agreement:
  Adjective<"noir"> ; ConjugateAdjective<Adj, "m"|"f"[, "s"|"p"]>
  (noir/noire/noirs/noires ; heureux->heureuse ; cher->chère ; grand->grande ; rouge invariant)
VERBS:
  ErVerb<"parl"> (parler) ; IrVerb<"fin"> (finir) ; ReVerb<"vend"> (vendre)
  IrregularVerb<"être">  — FULLY supported across tenses: être, avoir, aller, faire.
  IrregularVerb<"venir"|"pouvoir"|"vouloir"|"prendre"|"voir"|"dire"> — Present, PasseCompose, Infinitif, PastParticiple only.
  ConjugateVerb<Verb, Tense, Person="il">
  Tense = "Present"|"Imparfait"|"FuturSimple"|"Conditionnel"|"Subjonctif"|"PasseCompose"|"Imperatif"|"Infinitif"|"PastParticiple"
  Person = "je"|"tu"|"il"|"nous"|"vous"|"ils"   (il also serves elle/on; ils serves elles)
COMPOSITION:
  SubjectVerb<"je", Verb[, Tense]>     -> "je parle" / "j'aime"   (elides je->j')
  Clause<SubjectString, Verb[, Tense]> -> "<subject> <verb in 3rd person>"   (e.g. a DefiniteNP subject)
  NegativeVerb<Subj, Verb[, Tense]>    -> "il ne parle pas" / "il n'aime pas"
  EstCeQue<ClauseString>               -> "est-ce que ..." / "est-ce qu'..."
  Sentence<S>   -> Capitalize(S) + "."
  Question<S>   -> Capitalize(S) + " ?"   (French puts a space before ? ! :)
  Exclamation<S>-> Capitalize(S) + " !"

HARD RULES:
- Every example's code is self-contained and imports only from "typed-french".
- The LAST 'type' alias in the snippet must resolve to EXACTLY the example's 'fr' string
  (including the leading capital and trailing "." / " ?" — use Sentence/Question/Exclamation).
- The regular -er conjugator does NOT do orthographic changes. AVOID with "nous":
  -ger verbs (manger->mangeons), -cer verbs (commencer->commençons), and stem-changers
  (préférer, acheter, appeler). Stick to clean stems (parler, aimer, habiter, regarder,
  travailler, chercher, donner, écouter, jouer) or use the supported irregulars.
- Do NOT invent wrappers or tenses beyond the list above.`;

const SCHEMA = `FILE 1 — playground/src/tutorial/chapters/<id>.ts  (default-export a Chapter):
import type { Chapter } from "../types";
const chapter: Chapter = {
  id: "<id>", level: "elementary"|"intermediate"|"advanced", order: <n>,
  titleEn, titleZh, summaryEn, summaryZh,   // summaries: 2-4 sentences, immersive, scenario-led
  points: [
    { id: "<id>-1", titleEn, titleZh,
      bodyEn, bodyZh,   // bilingual teaching prose, paragraphs separated by \\n\\n; motivate the idea before mechanics; use inline \`code\` and **bold**
      examples: [ { fr, en, zh, code, ipa? } ]   // 1-2 per point; fr = display sentence WITH capital + punctuation
    },
    // 2-3 points total
  ],
};
export default chapter;

FILE 2 — playground/src/vocab/entries/<id>.ts  (default-export VocabEntry[]):
import type { VocabEntry } from "../types";
const entries: VocabEntry[] = [
  { word, gender?: "m"|"f", ipa?, pos, en, zh }, // include EVERY content word your snippets use that is not already in batch-01
];
export default entries;
pos = "noun"|"proper-noun"|"pronoun"|"adjective"|"adverb"|"verb-er"|"verb-ir"|"verb-re"|"verb-irregular"|"preposition"|"conjunction"|"interjection"|"numeral"|"expression"
Verb headword = the INFINITIVE (parler, finir, être). Noun headword = the singular noun; give its gender.`;

// ---------------------------------------------------------------------------
// Syllabus: use args.chapters when provided, else a default elementary batch.
// ---------------------------------------------------------------------------
const DEFAULT_CHAPTERS = [
  { id: "e03", level: "elementary", order: 3, titleEn: "Plural nouns & des", titleZh: "复数名词与 des",
    topicEn: "Forming the plural of nouns and the plural articles les / des; agreement of adjectives in the plural.",
    topicZh: "名词复数的构成与复数冠词 les / des；形容词的复数一致。" },
  { id: "e04", level: "elementary", order: 4, titleEn: "être & avoir", titleZh: "être 与 avoir",
    topicEn: "The two essential irregular verbs être (to be) and avoir (to have) in the present, and the idiom 'avoir' for age/hunger.",
    topicZh: "两个最重要的不规则动词 être（是）与 avoir（有）的现在时，以及 avoir 表年龄/饥饿的惯用法。" },
  { id: "e05", level: "elementary", order: 5, titleEn: "Asking questions", titleZh: "提问",
    topicEn: "Yes/no questions with est-ce que and rising intonation; the difference from English inversion.",
    topicZh: "用 est-ce que 和升调提一般疑问句；与英语倒装的区别。" },
  { id: "e06", level: "elementary", order: 6, titleEn: "-ir & -re verbs", titleZh: "-ir 与 -re 动词",
    topicEn: "The present tense of regular second-group (-ir, finir) and third-group (-re, vendre) verbs.",
    topicZh: "规则第二组（-ir，finir）与第三组（-re，vendre）动词的现在时。" },
];

const chapters = (args && args.chapters) || DEFAULT_CHAPTERS;
const PG = "playground (run node from /Users/evan/code/typed-french/playground)";

log(`Authoring ${chapters.length} chapter(s): ${chapters.map((c) => c.id).join(", ")}`);

// ---- Phase 1: author each chapter + its vocab in parallel -----------------
phase("Author");
await parallel(
  chapters.map((c) => () =>
    agent(
      `Author Typed French grammar-course chapter "${c.id}" (level ${c.level}, order ${c.order}).
Topic — EN: ${c.topicEn}
Topic — 中文: ${c.topicZh}
Suggested titles: titleEn="${c.titleEn}", titleZh="${c.titleZh}" (improve if you like).

Write TWO files (use the Write tool, absolute paths under /Users/evan/code/typed-french/):
  1. playground/src/tutorial/chapters/${c.id}.ts
  2. playground/src/vocab/entries/${c.id}.ts   (only the NEW content words your snippets use)

${DSL}

${SCHEMA}

QUALITY BAR: match the voice and depth of the existing chapters — read
playground/src/tutorial/chapters/e01.ts and e02.ts first as the template, and
playground/src/vocab/entries/batch-01.ts for vocab style + which words already exist
(do NOT redefine words already in batch-01.ts). Bilingual EN/简体中文 at equal depth.

VERIFY YOUR OWN WORK before finishing: from the playground directory run
  node scripts/verify-snippets.mjs --json
and read the JSON. Your chapter's examples must NOT appear in the failures list
(each must type-check AND resolve to exactly its 'fr'). Fix and re-run until your
chapter is clean. (Other chapters being authored concurrently may show failures —
ignore those; only ensure YOUR ${c.id} examples pass.) Then also confirm the words
you used are covered (node scripts/verify-vocab.mjs --json — your words must not be 'missing').

Return a one-line status: "${c.id}: OK" or "${c.id}: <problem>".`,
      { label: `author:${c.id}`, phase: "Author" }
    )
  )
);

// ---- Phase 2: one capable agent makes BOTH gates green --------------------
phase("Verify & fix");
const verdict = await agent(
  `You are the verification gate for the Typed French course. Working dir for commands:
/Users/evan/code/typed-french/playground  (${PG}).

Run these and make BOTH pass:
  1. node scripts/gen-reverse-index.mjs        (regenerates the vocab↔example index)
  2. node scripts/verify-snippets.mjs          (every example type-checks AND its last alias resolves to exactly its 'fr')
  3. node scripts/verify-vocab.mjs             (every content word used by the course is in the glossary)
  4. node_modules/.bin/tsc --noEmit            (the playground still type-checks)

For any failure, FIX the offending file(s) under playground/src/tutorial/chapters/ and
playground/src/vocab/entries/ (and add missing vocab words with correct gender/pos).
Use the DSL rules below. Re-run until all four are clean.

${DSL}

Common fixes: a snippet whose last alias resolves to a slightly different string than 'fr'
(adjust the 'fr' field OR the code so they match EXACTLY, capital + punctuation included);
a missing vocab word (add it to the relevant entries/<id>.ts with gender + pos); a -ger/-cer
or stem-changing verb used with "nous" (rewrite the example to a clean verb).

When everything passes, run: node scripts/verify-snippets.mjs (human output) and report the
final counts. Return a short summary: which chapters are now in the course, total examples
checked, and confirmation that all four checks pass.`,
  { label: "verify+fix", phase: "Verify & fix" }
);

log("Parity batch complete.");
return { chapters: chapters.map((c) => c.id), verdict };
