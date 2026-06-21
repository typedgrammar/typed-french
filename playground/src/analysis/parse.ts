/**
 * Parse Typed French source with the real TypeScript Compiler API and turn the
 * nested type expression of a chosen type alias into a tree of grammar nodes.
 *
 * We only *parse* here (ts.createSourceFile) — no type checking, so no lib files
 * are needed. The resolved French value of each node is filled in separately
 * by ../analysis/resolve.ts, which asks Monaco's TypeScript worker.
 *
 * `typescript` is loaded lazily so it lands in its own chunk.
 */
import type * as TS from "typescript";
import { VOCAB } from "../vocab/dictionary";

let tsmod: typeof TS | null = null;
async function loadTs(): Promise<typeof TS> {
  tsmod ??= (await import("typescript")) as unknown as typeof TS;
  return tsmod;
}

export type GrammarCategory =
  | "phrase"
  | "conjugation"
  | "verb"
  | "adjective"
  | "noun"
  | "technical"
  | "whitespace"
  | "adverb"
  | "particle"
  | "copula"
  | "suffix"
  | "punctuation"
  | "form"
  | "demonstrative"
  | "interrogative"
  | "adnominal"
  | "numeral"
  | "literal"
  | "other";

export interface CompositionNode {
  id: string;
  /** alias name, constructor name, or quoted literal */
  label: string;
  /** base/constructor type name shown as a sub-tag (null for plain literals) */
  ctor: string | null;
  category: GrammarCategory;
  /** exact source text of this type expression — used to resolve its value */
  text: string;
  /** offset span in the original source, for editor highlighting */
  start: number;
  end: number;
  children: CompositionNode[];
  /** filled by the resolver: the French string this subtree evaluates to */
  resolved?: string | null;
}

export interface AliasSummary {
  name: string;
  start: number;
  end: number;
}

export interface Analysis {
  aliases: AliasSummary[];
  /** name of the alias we picked to visualise by default (the sentence) */
  defaultAlias: string | null;
}

// --- grammar vocabulary (mirrors the library's .d.ts unions) -----------------

const COMPOSITIONAL = new Set([
  "Sentence",
  "Question",
  "Exclamation",
  "Clause",
  "SubjectVerb",
  "NegativeVerb",
  "EstCeQue",
  "ConjugateVerb",
  "ConjugateAdjective",
  "DefiniteNP",
  "IndefiniteNP",
  "PartitiveNP",
]);

// Canonical wrapper list lives in the library (src/noun-types.d.ts +
// src/adverb-types.d.ts). This map is mirrored by apps/TypedTranslate/bridge/tree.ts
// (category) and by vocab/extract.ts + scripts/extract-words.mjs (POS) — add a
// wrapper there and update all four.
const CATEGORY_BY_NAME: Record<string, GrammarCategory> = {
  // sentence-level composition
  Sentence: "phrase",
  Question: "phrase",
  Exclamation: "phrase",
  Clause: "phrase",
  SubjectVerb: "phrase",
  NegativeVerb: "phrase",
  EstCeQue: "phrase",
  // conjugation / agreement
  ConjugateVerb: "conjugation",
  ConjugateAdjective: "conjugation",
  // determiner + noun
  DefiniteNP: "noun",
  IndefiniteNP: "noun",
  PartitiveNP: "noun",
  // lexical wrappers
  ErVerb: "verb",
  IrVerb: "verb",
  ReVerb: "verb",
  IrregularVerb: "verb",
  Verb: "verb",
  Adjective: "adjective",
  CommonNoun: "noun",
  ProperNoun: "noun",
  Pronoun: "noun",
  Adverb: "adverb",
};

// Tense / mood names and the six persons — shown as "form" chips in the tree.
const FORMS = new Set([
  "Present", "Imparfait", "FuturSimple", "Conditionnel", "Subjonctif",
  "PasseCompose", "Imperatif", "Infinitif", "PastParticiple",
  "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
  "m", "f", "s", "p",
]);
const PUNCTUATION = new Set([".", ",", "!", "?", ";", ":", "«", "»", "(", ")", "—", "…", "'"]);

function classifyLiteral(value: string): GrammarCategory {
  if (FORMS.has(value)) return "form";
  if (PUNCTUATION.has(value)) return "punctuation";
  return "literal";
}

// --- literal tokenization against the vocabulary table -----------------------
// A template literal's text between `${…}` interpolations (e.g. " à la ") can
// bundle several words. Split it into known words via longest-match over the
// vocabulary so each becomes its own, lookup-able node.

const SURFACES = new Set<string>(VOCAB.keys());

function posToCategory(pos: string): GrammarCategory {
  if (pos.startsWith("verb")) return "verb";
  if (pos === "adjective") return "adjective";
  if (pos === "adverb") return "adverb";
  if (pos === "noun" || pos === "proper-noun" || pos === "pronoun" || pos === "numeral" || pos === "expression")
    return "noun";
  // article, determiner, preposition, conjunction, negation, interjection
  return "particle";
}

function categorizeSurface(s: string): GrammarCategory {
  const c = classifyLiteral(s);
  if (c !== "literal") return c;
  const e = VOCAB.get(s);
  return e ? posToCategory(e.pos) : "literal";
}

interface Tok {
  surface: string;
  category: GrammarCategory;
}

// Atomize a literal chunk into words / whitespace / single punctuation marks.
// French words may contain accents, internal apostrophes (l'ami → kept whole)
// and hyphens (est-ce, peut-être).
const ATOM = /([A-Za-zÀ-ÿœŒæÆ]+(?:['’-][A-Za-zÀ-ÿœŒæÆ]+)*)|(\s+)|([^\sA-Za-zÀ-ÿœŒæÆ])/g;

/**
 * French is space-delimited, so tokenization is simple: atomize the text, then
 * greedily merge adjacent atoms into the longest known multi-word surface
 * ("de la", "est-ce que", "parce que") before falling back to single words.
 * Pure whitespace is dropped (it is just a separator, not a node).
 */
function tokenizeLiteral(text: string): Tok[] {
  const atoms: string[] = [];
  let m: RegExpExecArray | null;
  ATOM.lastIndex = 0;
  while ((m = ATOM.exec(text))) atoms.push(m[0]);

  const out: Tok[] = [];
  for (let i = 0; i < atoms.length; ) {
    let merged: { surface: string; consumed: number } | null = null;
    for (let take = Math.min(7, atoms.length - i); take >= 2; take--) {
      const slice = atoms.slice(i, i + take).join("");
      if (SURFACES.has(slice)) {
        merged = { surface: slice, consumed: take };
        break;
      }
    }
    if (merged) {
      out.push({ surface: merged.surface, category: categorizeSurface(merged.surface) });
      i += merged.consumed;
      continue;
    }
    const a = atoms[i]!;
    i += 1;
    if (/^\s+$/.test(a)) continue; // drop separators
    const entry = VOCAB.get(a);
    out.push({
      surface: a,
      category: entry ? posToCategory(entry.pos) : classifyLiteral(a),
    });
  }
  return out;
}

function literalNodes(
  text: string,
  idPrefix: string,
  start: number,
  end: number
): CompositionNode[] {
  return tokenizeLiteral(text).map((tok, k) => ({
    id: `${idPrefix}.${k}`,
    label: tok.category === "literal" ? `"${tok.surface}"` : tok.surface,
    ctor: null,
    category: tok.category,
    text: `"${tok.surface}"`,
    start,
    end,
    children: [],
  }));
}

// --- parsing -----------------------------------------------------------------

export async function analyze(code: string): Promise<Analysis> {
  const ts = await loadTs();
  const sf = ts.createSourceFile("main.ts", code, ts.ScriptTarget.Latest, true);
  const aliases: AliasSummary[] = [];
  sf.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      aliases.push({
        name: node.name.text,
        start: node.name.getStart(sf),
        end: node.name.getEnd(),
      });
    }
  });
  // Heuristic: the "sentence" is the last declared alias.
  const defaultAlias = aliases.length ? aliases[aliases.length - 1]!.name : null;
  return { aliases, defaultAlias };
}

/** Build the composition tree for a single alias by name. */
export async function buildTree(
  code: string,
  aliasName: string
): Promise<CompositionNode | null> {
  const ts = await loadTs();
  const sf = ts.createSourceFile("main.ts", code, ts.ScriptTarget.Latest, true);

  const aliasMap = new Map<string, TS.TypeAliasDeclaration>();
  sf.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node)) aliasMap.set(node.name.text, node);
  });

  const root = aliasMap.get(aliasName);
  if (!root) return null;

  function entityName(name: TS.EntityName): string {
    return ts.isIdentifier(name) ? name.text : name.right.text;
  }

  // Follow a bare alias reference (no type args) to its definition so the tree
  // shows the full composition, not an opaque alias name.
  function effective(node: TS.TypeNode): { node: TS.TypeNode; alias?: string } {
    if (ts.isTypeReferenceNode(node) && !node.typeArguments) {
      const nm = entityName(node.typeName);
      const decl = aliasMap.get(nm);
      if (decl) return { node: decl.type, alias: nm };
    }
    return { node };
  }

  function baseName(node: TS.TypeNode): string | null {
    if (ts.isTypeReferenceNode(node)) return entityName(node.typeName);
    if (ts.isIntersectionTypeNode(node)) {
      const ref = node.types.find((t) => ts.isTypeReferenceNode(t));
      return ref ? entityName((ref as TS.TypeReferenceNode).typeName) : null;
    }
    return null;
  }

  const PART_TYPES = new Set([
    "VerbPart",
    "AdjectivePart",
    "NounPart",
    "PronounPart",
    "ProperNounPart",
    "TechnicalTermPart",
    "WhitespacePart",
    "AdverbPart",
    "AdnominalPart",
    "NumeralPart",
    "CounterPart",
    "ParticlePart",
    "CopulaPart",
    "SuffixPart",
    "IntensifierPart",
    "ContractedPart",
    "NestedPhrasePart",
    "PunctuationPart",
  ]);

  const SCALAR_PART_TYPES = new Set([
    "NounPart",
    "PronounPart",
    "ProperNounPart",
    "TechnicalTermPart",
    "WhitespacePart",
    "AdverbPart",
    "AdnominalPart",
    "NumeralPart",
    "CounterPart",
    "ParticlePart",
    "CopulaPart",
    "SuffixPart",
    "IntensifierPart",
    "ContractedPart",
    "NestedPhrasePart",
    "PunctuationPart",
  ]);

  function stringLiteralArg(node: TS.TypeNode | undefined): string | null {
    return node &&
      ts.isLiteralTypeNode(node) &&
      ts.isStringLiteral(node.literal)
      ? node.literal.text
      : null;
  }

  function buildPartNode(
    name: string,
    node: TS.TypeReferenceNode,
    idPath: string,
    start: number,
    end: number,
    sourceText: string,
    alias?: string
  ): CompositionNode {
    const args = node.typeArguments ?? [];
    const firstLiteral = stringLiteralArg(args[0]);
    const lastLiteral = stringLiteralArg(args[args.length - 1]);
    const label =
      alias ??
      (name === "CopulaPart"
        ? "Copula"
        : name === "WhitespacePart"
        ? "space"
        : name === "ContractedPart" && lastLiteral
        ? lastLiteral
        : firstLiteral ?? name);
    const children = SCALAR_PART_TYPES.has(name)
      ? []
      : args.map((arg, i) => build(arg, `${idPath}.${i}`));

    return {
      id: idPath,
      label,
      ctor: name,
      category: CATEGORY_BY_NAME[name] ?? "other",
      text: `${sourceText}["value"]`,
      start,
      end,
      children,
    };
  }

  function build(node: TS.TypeNode, idPath: string): CompositionNode {
    // Unwrap parentheses so `(A & B)` etc. don't add a useless level.
    if (ts.isParenthesizedTypeNode(node)) return build(node.type, idPath);

    const start = node.getStart(sf);
    const end = node.getEnd();
    const text = node.getText(sf).trim();

    // String literal leaf. A standalone literal type-argument is a single,
    // deliberate token (a form name like "Te", a particle like "は") — classify
    // it as one node, never split it. (Multi-word glue lives in template chunks,
    // which ARE tokenized below.)
    if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) {
      const value = node.literal.text;
      return {
        id: idPath,
        label: `"${value}"`,
        ctor: null,
        category: categorizeSurface(value),
        text,
        start,
        end,
        children: [],
      };
    }

    // Tuple type inside Sentence<[...parts]>: show each part as a child.
    if (ts.isTupleTypeNode(node)) {
      return {
        id: idPath,
        label: "Parts",
        ctor: "[]",
        category: "phrase",
        text,
        start,
        end,
        children: node.elements.map((el, i) => build(el, `${idPath}.${i}`)),
      };
    }

    // Template literal type: `${A}いる` — the glue most real sentences use.
    // Decompose into its literal chunks and embedded type expressions.
    if (ts.isTemplateLiteralTypeNode(node)) {
      const kids: CompositionNode[] = [];
      let k = 0;
      const pushLiteral = (value: string) => {
        for (const n of literalNodes(value, `${idPath}.c${k}`, start, end)) kids.push(n);
        k += 1;
      };
      if (node.head.text) pushLiteral(node.head.text);
      node.templateSpans.forEach((span, i) => {
        kids.push(build(span.type, `${idPath}.${i}`));
        if (span.literal.text) pushLiteral(span.literal.text);
      });
      return {
        id: idPath,
        label: "Template",
        ctor: "`…`",
        category: "phrase",
        text,
        start,
        end,
        children: kids,
      };
    }

    const eff = effective(node);
    const name = baseName(eff.node);
    const category: GrammarCategory =
      (name && CATEGORY_BY_NAME[name]) || "other";

    let children: CompositionNode[] = [];

    if (name && PART_TYPES.has(name) && ts.isTypeReferenceNode(eff.node)) {
      return buildPartNode(name, eff.node, idPath, start, end, text, eff.alias);
    }

    if (name && COMPOSITIONAL.has(name) && ts.isTypeReferenceNode(eff.node)) {
      const args = eff.node.typeArguments ?? [];
      const tupleArg = args[0] && ts.isTupleTypeNode(args[0]) ? args[0] : null;
      if ((name === "Sentence" || name === "PhraseSequence") && tupleArg) {
        children = tupleArg.elements.map((arg, i) => build(arg, `${idPath}.${i}`));
      } else {
        children = args.map((arg, i) => build(arg, `${idPath}.${i}`));
      }
    }

    const label = eff.alias ?? name ?? text;
    const ctor = name && name !== label ? name : null;

    return { id: idPath, label, ctor, category, text, start, end, children };
  }

  return build(root.type, "0");
}

/** Flatten a tree into the list of unique source-text fragments to resolve. */
export function collectTexts(node: CompositionNode, out: Set<string> = new Set()): Set<string> {
  out.add(node.text);
  for (const c of node.children) collectTexts(c, out);
  return out;
}
