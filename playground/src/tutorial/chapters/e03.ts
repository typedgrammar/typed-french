import type { Chapter } from "../types";

const chapter: Chapter = {
  id: "e03",
  level: "elementary",
  order: 3,
  titleEn: "Plural nouns & des",
  titleZh: "复数名词与 des",
  summaryEn:
    "One cat becomes two cats; a friend becomes some friends. To go from one to many, French does what English does — it usually adds a silent `-s` to the noun — but it also swaps the article: `le`, `la`, and `l'` all collapse into a single plural `les`, while `un` and `une` become `des`. And because everything must agree, the adjective pluralizes too. This chapter walks from singular to plural: the regular `-s` (and its exceptions), the articles `les` and `des`, and the plural agreement of adjectives.",
  summaryZh:
    "一只猫变成两只猫；一个朋友变成一些朋友。从「一」到「多」，法语做的事和英语很像——通常给名词加一个不发音的 `-s`——但它还会换掉冠词：`le`、`la`、`l'` 全都合并成唯一的复数形式 `les`，而 `un`、`une` 则变成 `des`。又因为一切都要保持一致，形容词也要变复数。本章带你从单数走到复数：规则的 `-s`（及其例外）、冠词 `les` 与 `des`，以及形容词的复数一致。",
  points: [
    {
      id: "e03-1",
      titleEn: "Add -s, and one article for all: les",
      titleZh: "加 -s，一个冠词通吃：les",
      bodyEn:
        "To make most French nouns plural you add an `-s`, exactly like English: `chat` → `chats`, `livre` → `livres`. The catch for the ear: this plural `-s` is **silent**. `le chat` and `les chats` sound almost the same — what tells a listener you mean *several* is not the noun but the article in front of it.\n\nAnd here French is kinder than the singular. In the singular you had to choose between `le`, `la`, and `l'`; in the plural all three merge into one form: **`les`**, regardless of gender. So `le livre` → `les livres`, `la voiture` → `les voitures`, `l'enfant` → `les enfants`. One article, no gender decision.\n\nA few nouns don't take a plain `-s`. Words ending in `-al` change to `-aux` (`le journal` → `les journaux`), and words already ending in `-s`, `-x`, or `-z` don't change at all. The type system knows these patterns: feed `DefiniteNP` the plural flag `\"p\"` and it both pluralizes the noun and selects `les`.",
      bodyZh:
        "要把大多数法语名词变复数，就加一个 `-s`，和英语一模一样：`chat` → `chats`，`livre` → `livres`。但对耳朵有个陷阱：这个复数 `-s` **不发音**。`le chat` 和 `les chats` 听起来几乎一样——告诉听者你指的是*好几个*的，不是名词本身，而是它前面的冠词。\n\n而这里法语比单数时更宽厚。单数时你得在 `le`、`la`、`l'` 之间作选择；复数时三者合并成一个形式：**`les`**，不分阴阳。于是 `le livre` → `les livres`，`la voiture` → `les voitures`，`l'enfant` → `les enfants`。一个冠词，无需再判断性别。\n\n少数名词不加单纯的 `-s`。以 `-al` 结尾的词变成 `-aux`（`le journal` → `les journaux`），而本来就以 `-s`、`-x`、`-z` 结尾的词则完全不变。类型系统懂得这些规律：给 `DefiniteNP` 加上复数标记 `\"p\"`，它会同时把名词变复数并选出 `les`。",
      examples: [
        {
          fr: "Les livres sont petits.",
          en: "The books are small.",
          zh: "这些书很小。",
          code: `import type {
  CommonNoun,
  DefiniteNP,
  IrregularVerb,
  ConjugateVerb,
  Adjective,
  ConjugateAdjective,
  Sentence,
} from "typed-french";

// "p" pluralizes the noun (livre → livres) and selects the article "les"
type livre = CommonNoun<"livre", "m">;
type être = IrregularVerb<"être">;
type petit = Adjective<"petit">;

type Phrase = Sentence<\`\${DefiniteNP<livre, "p">} \${ConjugateVerb<être, "Present", "ils">} \${ConjugateAdjective<petit, "m", "p">}\`>;
`,
        },
        {
          fr: "Les journaux sont français.",
          en: "The newspapers are French.",
          zh: "这些报纸是法国的。",
          code: `import type {
  CommonNoun,
  DefiniteNP,
  IrregularVerb,
  ConjugateVerb,
  Adjective,
  ConjugateAdjective,
  Sentence,
} from "typed-french";

// -al → -aux: journal → journaux; français already ends in -s, so it is invariant
type journal = CommonNoun<"journal", "m">;
type être = IrregularVerb<"être">;
type français = Adjective<"français">;

type Phrase = Sentence<\`\${DefiniteNP<journal, "p">} \${ConjugateVerb<être, "Present", "ils">} \${ConjugateAdjective<français, "m", "p">}\`>;
`,
        },
      ],
    },
    {
      id: "e03-2",
      titleEn: "Some: des",
      titleZh: "一些：des",
      bodyEn:
        "Just as `le`/`la`/`l'` collapse into `les`, the indefinite pair `un`/`une` collapses into a single plural: **`des`**. Where the singular `un chat` is “a cat”, the plural `des chats` is “some cats” — an unspecified handful rather than the known set.\n\nEnglish often leaves this article out entirely: we say “I see cats”, not “I see some cats”. French does **not** allow that bare plural — the article is obligatory. `Je vois des chats` is the only correct form; dropping `des` would be ungrammatical. This is one of the most common mistakes English speakers make, so it's worth fixing early: a plural count noun almost always needs `les` or `des` in front of it.\n\nThe choice between them is the familiar definite-vs-indefinite contrast: `les amis` is “the friends” (specific, known), while `des amis` is “some friends” (any, unspecified). `IndefiniteNP<Noun, \"p\">` builds the `des …` form.",
      bodyZh:
        "正如 `le`/`la`/`l'` 合并成 `les`，不定冠词对 `un`/`une` 也合并成唯一的复数形式：**`des`**。单数的 `un chat` 是「一只猫」，复数的 `des chats` 就是「一些猫」——不确定的若干个，而非已知的那一组。\n\n英语常常干脆省掉这个冠词：我们说 “I see cats”，而不是 “I see some cats”。但法语**不允许**这种光秃秃的复数——冠词是强制的。`Je vois des chats` 是唯一正确的形式；省掉 `des` 就不合语法了。这是英语母语者最常犯的错误之一，所以值得尽早纠正：一个可数复数名词前面几乎总要有 `les` 或 `des`。\n\n二者之间的选择，就是熟悉的「定」与「不定」之分：`les amis` 是「那些朋友」（特指、已知），而 `des amis` 是「一些朋友」（任意、不确定）。`IndefiniteNP<Noun, \"p\">` 会构造出 `des …` 的形式。",
      examples: [
        {
          fr: "Des amis sont heureux.",
          en: "Some friends are happy.",
          zh: "一些朋友很幸福。",
          code: `import type {
  CommonNoun,
  IndefiniteNP,
  IrregularVerb,
  ConjugateVerb,
  Adjective,
  ConjugateAdjective,
  Sentence,
} from "typed-french";

// un/une → des in the plural: ami → des amis
type ami = CommonNoun<"ami", "m">;
type être = IrregularVerb<"être">;
type heureux = Adjective<"heureux">;

type Phrase = Sentence<\`\${IndefiniteNP<ami, "p">} \${ConjugateVerb<être, "Present", "ils">} \${ConjugateAdjective<heureux, "m", "p">}\`>;
`,
        },
      ],
    },
    {
      id: "e03-3",
      titleEn: "Adjectives agree in the plural too",
      titleZh: "形容词在复数里也要一致",
      bodyEn:
        "Agreement doesn't stop at the article. An adjective describing a plural noun must itself become plural — usually by adding `-s` to whatever form it already has. So `noir` (masculine singular) → `noirs`, and the feminine `noire` → `noires`. Gender is decided first, number second: you take the right gendered form, then pluralize it.\n\nThe same small exceptions return. An adjective already ending in `-s` or `-x` doesn't change in the masculine plural — `heureux` stays `heureux`, `français` stays `français` — and `-al` becomes `-aux`. Invariant `-e` adjectives like `rouge` simply add `-s`: `rouges`.\n\nWhen the noun is feminine plural, both moves happen at once: `grand` → feminine `grande` → plural `grandes`. In code you pass the gender **and** the `\"p\"` flag to `ConjugateAdjective`, and it walks the same two steps for you.",
      bodyZh:
        "一致并不止于冠词。修饰复数名词的形容词，自己也必须变成复数——通常是在它已有的形式上再加 `-s`。于是 `noir`（阳性单数）→ `noirs`，阴性的 `noire` → `noires`。先定性别，再定数：先取对应性别的形式，再把它变复数。\n\n同样的小例外又回来了。本来就以 `-s` 或 `-x` 结尾的形容词，在阳性复数里不变——`heureux` 还是 `heureux`，`français` 还是 `français`——而 `-al` 变成 `-aux`。像 `rouge` 这种不变的 `-e` 形容词只需加 `-s`：`rouges`。\n\n当名词是阴性复数时，两步一次完成：`grand` → 阴性 `grande` → 复数 `grandes`。在代码里你把性别**和** `\"p\"` 标记一起传给 `ConjugateAdjective`，它就替你走完这同样的两步。",
      examples: [
        {
          fr: "Les chats sont noirs.",
          en: "The cats are black.",
          zh: "这些猫是黑色的。",
          code: `import type {
  CommonNoun,
  DefiniteNP,
  IrregularVerb,
  ConjugateVerb,
  Adjective,
  ConjugateAdjective,
  Sentence,
} from "typed-french";

// masculine plural: noir → noirs (just add -s to the masculine form)
type chat = CommonNoun<"chat", "m">;
type être = IrregularVerb<"être">;
type noir = Adjective<"noir">;

type Phrase = Sentence<\`\${DefiniteNP<chat, "p">} \${ConjugateVerb<être, "Present", "ils">} \${ConjugateAdjective<noir, "m", "p">}\`>;
`,
        },
        {
          fr: "Les voitures sont grandes.",
          en: "The cars are big.",
          zh: "这些汽车很大。",
          code: `import type {
  CommonNoun,
  DefiniteNP,
  IrregularVerb,
  ConjugateVerb,
  Adjective,
  ConjugateAdjective,
  Sentence,
} from "typed-french";

// feminine plural: grand → grande → grandes (gender first, then number)
type voiture = CommonNoun<"voiture", "f">;
type être = IrregularVerb<"être">;
type grand = Adjective<"grand">;

type Phrase = Sentence<\`\${DefiniteNP<voiture, "p">} \${ConjugateVerb<être, "Present", "ils">} \${ConjugateAdjective<grand, "f", "p">}\`>;
`,
        },
      ],
    },
  ],
};

export default chapter;
