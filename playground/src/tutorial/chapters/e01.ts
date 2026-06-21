import type { Chapter } from "../types";

const chapter: Chapter = {
  id: "e01",
  level: "elementary",
  order: 1,
  titleEn: "Gender & articles: le, la, un, une",
  titleZh: "阴阳性与冠词：le、la、un、une",
  summaryEn:
    "Imagine pointing at things in a Paris market: that cat, a house, the apple. Before you can say almost anything in French you have to do something English never asks of you — decide whether each noun is masculine or feminine, and pick the article that agrees with it. This chapter starts there: the gender that every noun carries, the definite articles le / la / l', the indefinite un / une, and how an adjective quietly changes shape to match.",
  summaryZh:
    "想象你在巴黎的集市上指着东西：那只猫、一栋房子、那个苹果。在你能用法语说出几乎任何话之前，得先做一件英语从不要求你做的事——判断每个名词是阳性还是阴性，并选出与之相配的冠词。本章就从这里开始：每个名词自带的「性」、定冠词 le / la / l'、不定冠词 un / une，以及形容词如何悄悄变形来与名词保持一致。",
  points: [
    {
      id: "e01-1",
      titleEn: "Every noun has a gender — le and la",
      titleZh: "每个名词都有性别 —— le 与 la",
      bodyEn:
        "In French, every noun is either **masculine** or **feminine**. This isn't about biology — a table (`la table`) is feminine and a book (`le livre`) is masculine for no reason you can feel; the gender is simply part of the word, like a hidden tag you must learn together with its meaning.\n\nThe definite article (English “the”) changes to match: `le` before a masculine noun, `la` before a feminine one. So `le chat` is “the cat” and `la voiture` is “the car”. Because the article announces the gender, native speakers hear `la` and already expect a feminine word to follow.\n\nThe practical advice every learner eventually accepts: never memorise a noun bare. Learn `le chat`, not `chat`; learn `la maison`, not `maison`. The article is the cheapest way to carry the gender with you.\n\nIn the code below, we tag the noun with its gender (`CommonNoun<\"chat\", \"m\">`) and let the type system pick the article. Hover the final type — the compiler resolves it to the full sentence.",
      bodyZh:
        "在法语里，每个名词非**阳性**即**阴性**。这与生物性别无关——桌子 `la table` 是阴性、书 `le livre` 是阳性，你感觉不到任何理由；性别就是这个词的一部分，像一个隐藏的标签，必须和词义一起记住。\n\n定冠词（英语的 “the”）会随之变化：阳性名词前用 `le`，阴性名词前用 `la`。于是 `le chat` 是「这只猫」，`la voiture` 是「这辆车」。因为冠词预告了性别，母语者一听到 `la`，就已经预期后面会跟一个阴性词。\n\n每个学习者最终都会接受的实用建议：永远不要孤零零地背名词。记 `le chat`，别记 `chat`；记 `la maison`，别记 `maison`。冠词是随身携带性别信息最省力的方式。\n\n在下面的代码里，我们给名词标注性别（`CommonNoun<\"chat\", \"m\">`），让类型系统挑选冠词。把鼠标悬停在最后一个类型上——编译器会把它求解成完整的句子。",
      examples: [
        {
          fr: "Le chat est noir.",
          en: "The cat is black.",
          zh: "这只猫是黑色的。",
          code: `import type {
  CommonNoun,
  DefiniteNP,
  IrregularVerb,
  ConjugateVerb,
  Adjective,
  ConjugateAdjective,
  Sentence,
} from "typed-french";

// chat is masculine → DefiniteNP resolves the article to "le"
type chat = CommonNoun<"chat", "m">;
type être = IrregularVerb<"être">;
type noir = Adjective<"noir">;

type Phrase = Sentence<\`\${DefiniteNP<chat>} \${ConjugateVerb<être, "Present", "il">} \${ConjugateAdjective<noir, "m">}\`>;
`,
        },
        {
          fr: "La voiture est grande.",
          en: "The car is big.",
          zh: "这辆车很大。",
          code: `import type {
  CommonNoun,
  DefiniteNP,
  IrregularVerb,
  ConjugateVerb,
  Adjective,
  ConjugateAdjective,
  Sentence,
} from "typed-french";

// voiture is feminine → the article becomes "la", and grand → grande
type voiture = CommonNoun<"voiture", "f">;
type être = IrregularVerb<"être">;
type grand = Adjective<"grand">;

type Phrase = Sentence<\`\${DefiniteNP<voiture>} \${ConjugateVerb<être, "Present", "il">} \${ConjugateAdjective<grand, "f">}\`>;
`,
        },
      ],
    },
    {
      id: "e01-2",
      titleEn: "Before a vowel: l'",
      titleZh: "元音前：l'",
      bodyEn:
        "French dislikes the little clash of two vowel sounds bumping together. So when a noun begins with a vowel (or most silent `h`), both `le` and `la` shrink to `l'` and attach directly to the word: not `le homme` but `l'homme`, not `la eau` but `l'eau`. This squeezing-together is called **elision**, and you'll meet it again and again (`je` → `j'`, `ne` → `n'`, `de` → `d'`).\n\nNotice that `l'` hides the gender — `l'enfant` could be masculine or feminine — which is exactly why carrying the article from the start matters: once a word elides, the article can no longer tell you its gender.\n\nThe type system applies the same rule automatically: give `DefiniteNP` a vowel-initial noun and it produces `l'…` with no space.",
      bodyZh:
        "法语不喜欢两个元音相撞的那种小冲突。所以当名词以元音（或大多数不发音的 `h`）开头时，`le` 和 `la` 都会缩成 `l'`，并直接黏在词上：不是 `le homme` 而是 `l'homme`，不是 `la eau` 而是 `l'eau`。这种挤压在一起的现象叫**省音 (élision)**，你会一次又一次地遇到它（`je` → `j'`、`ne` → `n'`、`de` → `d'`）。\n\n注意 `l'` 把性别藏了起来——`l'enfant` 可能是阳性也可能是阴性——这正是为什么一开始就把冠词带在身边很重要：一旦词发生省音，冠词就再也告诉不了你它的性别了。\n\n类型系统会自动套用同一条规则：给 `DefiniteNP` 一个以元音开头的名词，它就会生成不带空格的 `l'…`。",
      examples: [
        {
          fr: "L'enfant est petit.",
          en: "The child is small.",
          zh: "这个孩子很小。",
          code: `import type {
  CommonNoun,
  DefiniteNP,
  IrregularVerb,
  ConjugateVerb,
  Adjective,
  ConjugateAdjective,
  Sentence,
} from "typed-french";

// enfant starts with a vowel → le elides to l'enfant
type enfant = CommonNoun<"enfant", "m">;
type être = IrregularVerb<"être">;
type petit = Adjective<"petit">;

type Phrase = Sentence<\`\${DefiniteNP<enfant>} \${ConjugateVerb<être, "Present", "il">} \${ConjugateAdjective<petit, "m">}\`>;
`,
        },
      ],
    },
    {
      id: "e01-3",
      titleEn: "A, an: un and une",
      titleZh: "一个：un 与 une",
      bodyEn:
        "When you mean “a / an” — one unspecified thing rather than a known one — French uses the indefinite article: `un` for masculine, `une` for feminine. `un chat` is “a cat”; `une pomme` is “an apple”. Same gender split as `le` / `la`, just the indefinite flavour.\n\nThis is the difference between `le café` (“the coffee”, a specific one) and `un café` (“a coffee”, any one — what you order at the counter). Choosing between definite and indefinite is the same choice English makes with the/a; the only extra tax French charges is, once again, agreement for gender.\n\nAdjectives keep agreeing too: `rouge` already ends in `-e`, so it looks the same in masculine and feminine — a small mercy.",
      bodyZh:
        "当你想说「一个」——某个未指明的事物，而非已知的那个——法语用不定冠词：阳性用 `un`，阴性用 `une`。`un chat` 是「一只猫」，`une pomme` 是「一个苹果」。性别的区分和 `le` / `la` 一样，只是换成了不定的语气。\n\n这就是 `le café`（「那杯咖啡」，特指某一杯）和 `un café`（「一杯咖啡」，随便哪杯——你在柜台点的那种）之间的区别。在定与不定之间作选择，和英语用 the/a 作的选择是一样的；法语唯一多收的「税」，依然是性的一致。\n\n形容词也照样要一致：`rouge` 本来就以 `-e` 结尾，所以阳性阴性写法相同——算是一点小小的宽容。",
      examples: [
        {
          fr: "Une pomme est rouge.",
          en: "An apple is red.",
          zh: "一个苹果是红色的。",
          code: `import type {
  CommonNoun,
  IndefiniteNP,
  IrregularVerb,
  ConjugateVerb,
  Adjective,
  ConjugateAdjective,
  Sentence,
} from "typed-french";

// pomme is feminine → "une pomme"; rouge ends in -e, so it is invariant
type pomme = CommonNoun<"pomme", "f">;
type être = IrregularVerb<"être">;
type rouge = Adjective<"rouge">;

type Phrase = Sentence<\`\${IndefiniteNP<pomme>} \${ConjugateVerb<être, "Present", "il">} \${ConjugateAdjective<rouge, "f">}\`>;
`,
        },
      ],
    },
  ],
};

export default chapter;
