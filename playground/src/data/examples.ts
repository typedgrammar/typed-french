/**
 * Starter sentences for the composer. Each snippet is real, self-contained
 * Typed French: it type-checks against the library's .d.ts files loaded into
 * Monaco, and its *last* type alias is a sentence/phrase that resolves to a
 * concrete French string the visualiser can decompose.
 */
export interface Snippet {
  id: string;
  title: string;
  fr: string;
  en: string;
  code: string;
}

export const SNIPPETS: ReadonlyArray<Snippet> = [
  {
    id: "etre-adjective",
    title: "Noun phrase + adjective",
    fr: "Le chat est noir.",
    en: "“The cat is black.” — article, gender, and adjective agreement",
    code: `import type {
  CommonNoun,
  DefiniteNP,
  Adjective,
  ConjugateAdjective,
  IrregularVerb,
  ConjugateVerb,
  Sentence,
} from "typed-french";

// chat is masculine → the article resolves to "le"
type chat = CommonNoun<"chat", "m">;
type noir = Adjective<"noir">;
type être = IrregularVerb<"être">;

// Hover the result: TypeScript computes "Le chat est noir."
type Phrase = Sentence<\`\${DefiniteNP<chat>} \${ConjugateVerb<être, "Present", "il">} \${ConjugateAdjective<noir, "m">}\`>;
`,
  },
  {
    id: "er-present",
    title: "-er verb · present",
    fr: "Je parle français.",
    en: "“I speak French.” — a regular -er verb in the present tense",
    code: `import type { ErVerb, SubjectVerb, Sentence } from "typed-french";

// parler (to speak) → stem "parl"
type parler = ErVerb<"parl">;

// SubjectVerb conjugates and joins the subject (eliding je → j' before a vowel)
type Phrase = Sentence<\`\${SubjectVerb<"je", parler>} français\`>;
`,
  },
  {
    id: "negation",
    title: "Negation · ne … pas",
    fr: "Il ne mange pas.",
    en: "“He is not eating.” — the ne … pas frame around the verb",
    code: `import type { ErVerb, NegativeVerb, Sentence } from "typed-french";

type manger = ErVerb<"mang">;

// NegativeVerb wraps the conjugated verb in ne … pas (n' before a vowel)
type Phrase = Sentence<NegativeVerb<"il", manger>>;
`,
  },
  {
    id: "passe-compose",
    title: "Passé composé",
    fr: "J'ai mangé une pomme.",
    en: "“I ate an apple.” — the compound past with avoir",
    code: `import type {
  ErVerb,
  ConjugateVerb,
  CommonNoun,
  IndefiniteNP,
  Sentence,
} from "typed-french";

type manger = ErVerb<"mang">;
type pomme = CommonNoun<"pomme", "f">;

// PasseCompose resolves "ai mangé"; pomme is feminine → "une pomme"
type Phrase = Sentence<\`j'\${ConjugateVerb<manger, "PasseCompose", "je">} \${IndefiniteNP<pomme>}\`>;
`,
  },
  {
    id: "question",
    title: "Question · est-ce que",
    fr: "Est-ce que tu parles français ?",
    en: "“Do you speak French?” — forming a yes/no question",
    code: `import type { ErVerb, SubjectVerb, EstCeQue, Question } from "typed-french";

type parler = ErVerb<"parl">;

type Phrase = Question<EstCeQue<\`\${SubjectVerb<"tu", parler>} français\`>>;
`,
  },
];
