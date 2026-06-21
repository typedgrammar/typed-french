import type { CompositionNode, GrammarCategory } from "../analysis/parse";
import { lookup } from "../vocab/dictionary";
import { useLang } from "../context/lang";

export const CATEGORY_META: Record<
  GrammarCategory,
  { fr: string; en: string; varName: string }
> = {
  phrase: { fr: "Phrase", en: "Phrase", varName: "--cat-phrase" },
  conjugation: { fr: "Conjugaison", en: "Conjugation", varName: "--cat-conjugation" },
  verb: { fr: "Verbe", en: "Verb", varName: "--cat-verb" },
  adjective: { fr: "Adjectif", en: "Adjective", varName: "--cat-adjective" },
  noun: { fr: "Nom", en: "Noun", varName: "--cat-noun" },
  technical: { fr: "Terme", en: "Technical", varName: "--cat-noun" },
  whitespace: { fr: "Espace", en: "Whitespace", varName: "--cat-literal" },
  adverb: { fr: "Adverbe", en: "Adverb", varName: "--cat-adverb" },
  particle: { fr: "Article/Prép.", en: "Particle", varName: "--cat-particle" },
  copula: { fr: "Copule", en: "Copula", varName: "--cat-conjugation" },
  suffix: { fr: "Suffixe", en: "Suffix", varName: "--cat-form" },
  punctuation: { fr: "Ponctuation", en: "Punctuation", varName: "--cat-literal" },
  form: { fr: "Forme", en: "Form", varName: "--cat-form" },
  demonstrative: { fr: "Démonstratif", en: "Demonstrative", varName: "--cat-demonstrative" },
  interrogative: { fr: "Interrogatif", en: "Interrogative", varName: "--cat-interrogative" },
  adnominal: { fr: "Déterminant", en: "Adnominal", varName: "--cat-adnominal" },
  numeral: { fr: "Numéral", en: "Numeral", varName: "--cat-numeral" },
  literal: { fr: "Littéral", en: "Literal", varName: "--cat-literal" },
  other: { fr: "Type", en: "Type", varName: "--cat-other" },
};

interface Props {
  node: CompositionNode;
  selectedId: string | null;
  onSelect: (node: CompositionNode) => void;
  showWhitespace?: boolean;
  depth?: number;
}

export default function CompositionTree({
  node,
  selectedId,
  onSelect,
  showWhitespace = false,
  depth = 0,
}: Props) {
  const { lang } = useLang();
  if (!showWhitespace && node.category === "whitespace") return null;

  const meta = CATEGORY_META[node.category];
  const color = `var(${meta.varName})`;
  const isLiteral = node.ctor === null && node.children.length === 0;
  const selected = selectedId === node.id;

  // Hide a resolved value that is identical to the literal label (redundant).
  const literalValue = isLiteral ? node.label.replace(/^"|"$/g, "") : null;
  const showResolved =
    node.resolved != null && node.resolved !== "" && node.resolved !== literalValue;

  // Look the word up in the vocabulary table to show its reading + meaning.
  const lookupKey = node.label.replace(/^"|"$/g, "");
  const entry = lookup(lookupKey);

  return (
    <div className="relative" style={{ ["--cat" as string]: color }}>
      <button
        type="button"
        className={`flex items-center gap-[9px] w-full text-left px-2.5 py-[7px] my-[3px] border border-[var(--border)] border-l-[3px] border-l-[var(--cat)] rounded-field bg-surface cursor-pointer transition-[background,box-shadow,transform] duration-[120ms] hover:bg-surface-2 max-[720px]:flex-wrap ${
          selected ? "bg-surface-2 shadow-[inset_0_0_0_2px_var(--cat),var(--shadow-sm)]" : ""
        }`}
        onClick={() => onSelect(node)}
        title={entry ? `${entry.ipa ?? ""} · ${lang === "zh" ? entry.zh : entry.en}` : node.text}
      >
        <span
          className="flex-none text-[0.68rem] font-bold text-on-accent px-[7px] py-0.5 rounded-full font-fr"
          style={{ background: color }}
        >
          {meta.fr}
        </span>
        <span className="fr text-[1.02rem] font-bold text-ink-900 whitespace-nowrap">{node.label}</span>
        {entry && entry.ipa && (
          <span className="fr text-[0.74rem] text-ink-500 whitespace-nowrap">{entry.ipa}</span>
        )}
        {node.ctor && (
          <span className="font-mono text-[0.74rem] text-ink-500 bg-surface-2 px-1.5 py-px rounded-[5px] whitespace-nowrap">
            {node.ctor}
          </span>
        )}
        {showResolved && (
          <span className="fr ml-auto text-[0.98rem] font-bold text-cat-phrase whitespace-nowrap max-[720px]:ml-0">
            <span className="mr-[3px] text-ink-300 font-normal">→</span>「{node.resolved}」
          </span>
        )}
      </button>

      {node.children.length > 0 && (
        <div className="ml-4 pl-3 border-l-2 border-dashed border-border-strong">
          {node.children
            .filter((child) => showWhitespace || child.category !== "whitespace")
            .map((child) => (
              <CompositionTree
                key={child.id}
                node={child}
                selectedId={selectedId}
                onSelect={onSelect}
                showWhitespace={showWhitespace}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}
