import type { Chapter } from "../types";

const chapter: Chapter = {
  id: "e06",
  level: "elementary",
  order: 6,
  titleEn: "-ir & -re verbs",
  titleZh: "-ir 与 -re 动词",
  summaryEn:
    "Beyond the vast -er family lie two smaller but everyday crowds: the second group, regular -ir verbs like finir (to finish), and the third group, regular -re verbs like vendre (to sell). They follow their own steady endings — and the -ir verbs hide a surprise consonant cluster, -iss-, that pops up in the plural. Learn these two patterns and you can already finish a meal, choose a dish, wait for a friend, and answer a question.",
  summaryZh:
    "在庞大的 -er 家族之外，还有两群规模较小却天天用到的动词：第二组，规则的 -ir 动词，比如 finir（完成）；第三组，规则的 -re 动词，比如 vendre（卖）。它们各有自己稳定的词尾——而 -ir 动词还藏着一个意外的辅音串 -iss-，会在复数里冒出来。学会这两个模式，你就已经能吃完一餐、挑一道菜、等一位朋友、回答一个问题了。",
  points: [
    {
      id: "e06-1",
      titleEn: "Second group: -ir verbs and the -iss- surprise",
      titleZh: "第二组：-ir 动词与 -iss- 惊喜",
      bodyEn:
        "Take a regular -ir verb like `finir` (to finish). Drop the `-ir` to get the **stem** `fin-`, then add the second-group endings: `-is` (je), `-is` (tu), `-it` (il/elle), `-issons` (nous), `-issez` (vous), `-issent` (ils/elles). So `je finis`, `tu finis`, `il finit`.\n\nThe surprise lives in the plural. Where -er verbs simply attach `-ons`/`-ez`/`-ent`, the second group inserts an extra `-iss-` first: not *finons* but `nous finissons`, not *finez* but `vous finissez`, not *finent* but `ils finissent`. That hissing `-iss-` is the unmistakable signature of a true second-group verb — `choisir` (to choose) behaves identically: `nous choisissons`.\n\nIn code, `IrVerb<\"fin\">` carries the stem `fin`, and `ConjugateVerb` (or `SubjectVerb`) supplies the right ending — including the `-iss-` when the person is plural.",
      bodyZh:
        "拿一个规则的 -ir 动词，比如 `finir`（完成）。去掉 `-ir` 得到**词干** `fin-`，再加上第二组的词尾：`-is`（je）、`-is`（tu）、`-it`（il/elle）、`-issons`（nous）、`-issez`（vous）、`-issent`（ils/elles）。于是 `je finis`、`tu finis`、`il finit`。\n\n惊喜藏在复数里。-er 动词只是简单地接上 `-ons`/`-ez`/`-ent`，而第二组会先插入一个额外的 `-iss-`：不是 *finons* 而是 `nous finissons`，不是 *finez* 而是 `vous finissez`，不是 *finent* 而是 `ils finissent`。那个带嘶音的 `-iss-` 是真正第二组动词的鲜明标志——`choisir`（选择）的表现完全一样：`nous choisissons`。\n\n在代码里，`IrVerb<\"fin\">` 携带词干 `fin`，`ConjugateVerb`（或 `SubjectVerb`）会提供正确的词尾——在主语为复数时，连那个 `-iss-` 也一并补上。",
      examples: [
        {
          fr: "Je finis le pain.",
          en: "I finish the bread.",
          zh: "我吃完了面包。",
          code: `import type {
  IrVerb,
  SubjectVerb,
  CommonNoun,
  DefiniteNP,
  Sentence,
} from "typed-french";

// finir → stem "fin"; the je-ending is "-is" → "je finis"
type finir = IrVerb<"fin">;
type pain = CommonNoun<"pain", "m">;

type Phrase = Sentence<\`\${SubjectVerb<"je", finir>} \${DefiniteNP<pain>}\`>;
`,
        },
        {
          fr: "Nous choisissons une pomme.",
          en: "We choose an apple.",
          zh: "我们挑一个苹果。",
          code: `import type {
  IrVerb,
  SubjectVerb,
  CommonNoun,
  IndefiniteNP,
  Sentence,
} from "typed-french";

// the nous-ending inserts -iss- → "nous choisissons"
type choisir = IrVerb<"chois">;
type pomme = CommonNoun<"pomme", "f">;

type Phrase = Sentence<\`\${SubjectVerb<"nous", choisir>} \${IndefiniteNP<pomme>}\`>;
`,
        },
      ],
    },
    {
      id: "e06-2",
      titleEn: "Third group: -re verbs and the silent il",
      titleZh: "第三组：-re 动词与沉默的 il",
      bodyEn:
        "Regular -re verbs like `vendre` (to sell) form the third group. Drop the `-re` for the stem `vend-`, then add: `-s` (je), `-s` (tu), **nothing** (il/elle), `-ons` (nous), `-ez` (vous), `-ent` (ils/elles). So `je vends`, `tu vends`, and — the oddity — `il vend` with no ending at all.\n\nThat bare third person is the quirk to remember: the stem already ends in `-d`, and French simply leaves it there. `il vend`, `elle attend` (she waits), `on répond` (one answers) — no `-t`, no `-e`, nothing. The `-d` does the work the ending would do elsewhere.\n\nThe plural is gentler than the second group: just `-ons`, `-ez`, `-ent`, with no `-iss-` in sight: `nous vendons`, `vous vendez`, `ils vendent`. Here `ReVerb<\"vend\">` carries the stem, and the type system knows to add an empty ending for `il`.",
      bodyZh:
        "像 `vendre`（卖）这样规则的 -re 动词构成第三组。去掉 `-re` 得到词干 `vend-`，再加上：`-s`（je）、`-s`（tu）、**什么都不加**（il/elle）、`-ons`（nous）、`-ez`（vous）、`-ent`（ils/elles）。于是 `je vends`、`tu vends`，以及那个怪处——`il vend`，完全没有词尾。\n\n这个光秃秃的第三人称正是要记住的特点：词干本来就以 `-d` 结尾，法语干脆就让它留在那儿。`il vend`、`elle attend`（她在等）、`on répond`（人们回答）——没有 `-t`，没有 `-e`，什么都没有。`-d` 做了别处由词尾来做的工作。\n\n复数比第二组温和：只有 `-ons`、`-ez`、`-ent`，看不到任何 `-iss-`：`nous vendons`、`vous vendez`、`ils vendent`。这里 `ReVerb<\"vend\">` 携带词干，类型系统知道要为 `il` 加上一个空词尾。",
      examples: [
        {
          fr: "Je vends la voiture.",
          en: "I sell the car.",
          zh: "我卖掉这辆车。",
          code: `import type {
  ReVerb,
  SubjectVerb,
  CommonNoun,
  DefiniteNP,
  Sentence,
} from "typed-french";

// vendre → stem "vend"; the je-ending is "-s" → "je vends"
type vendre = ReVerb<"vend">;
type voiture = CommonNoun<"voiture", "f">;

type Phrase = Sentence<\`\${SubjectVerb<"je", vendre>} \${DefiniteNP<voiture>}\`>;
`,
        },
        {
          fr: "La femme attend le chat.",
          en: "The woman waits for the cat.",
          zh: "这位女士在等那只猫。",
          code: `import type {
  ReVerb,
  Clause,
  CommonNoun,
  DefiniteNP,
  Sentence,
} from "typed-french";

// attendre, 3rd person: the stem ends in -d, so no ending → "attend"
type attendre = ReVerb<"attend">;
type femme = CommonNoun<"femme", "f">;
type chat = CommonNoun<"chat", "m">;

type Phrase = Sentence<\`\${Clause<DefiniteNP<femme>, attendre>} \${DefiniteNP<chat>}\`>;
`,
        },
      ],
    },
    {
      id: "e06-3",
      titleEn: "Putting them to work: questions and negation",
      titleZh: "投入使用：提问与否定",
      bodyEn:
        "These two groups slot into everything you already know. The negation frame `ne … pas` still wraps the conjugated verb — `je ne finis pas`, `il ne vend pas` — and `est-ce que` still fronts a clause to turn it into a question, eliding to `est-ce qu'` before a vowel.\n\nBecause the verb forms are regular, you can mix and match freely: `réfléchir` (to think it over) is a second-group verb, `répondre` (to answer) a third-group one, and both behave exactly like `finir` and `vendre`. Once the pattern is in your ear, every new -ir or -re verb is essentially free.\n\nThe snippets below build a full negative sentence with `NegativeVerb` and a yes/no question with `EstCeQue` — the same composition helpers from the -er chapter, now driven by `IrVerb` and `ReVerb`.",
      bodyZh:
        "这两组动词能嵌入你已经掌握的一切。否定框架 `ne … pas` 照样包住变位后的动词——`je ne finis pas`、`il ne vend pas`——而 `est-ce que` 照样放在小句前把它变成问句，在元音前省音为 `est-ce qu'`。\n\n因为动词形式是规则的，你可以自由组合：`réfléchir`（仔细考虑）是第二组动词，`répondre`（回答）是第三组动词，两者的表现都和 `finir`、`vendre` 一模一样。一旦这个模式进了你的耳朵，每个新的 -ir 或 -re 动词基本上都是免费赠送的。\n\n下面的代码片段用 `NegativeVerb` 造一个完整的否定句，用 `EstCeQue` 造一个是非问句——和 -er 那一章用的是同样的组合助手，只是现在由 `IrVerb` 和 `ReVerb` 来驱动。",
      examples: [
        {
          fr: "Je ne finis pas le café.",
          en: "I don't finish the coffee.",
          zh: "我没喝完这杯咖啡。",
          code: `import type {
  IrVerb,
  NegativeVerb,
  CommonNoun,
  DefiniteNP,
  Sentence,
} from "typed-french";

// NegativeVerb wraps the -ir verb: je + ne + finis + pas
type finir = IrVerb<"fin">;
type café = CommonNoun<"café", "m">;

type Phrase = Sentence<\`\${NegativeVerb<"je", finir>} \${DefiniteNP<café>}\`>;
`,
        },
        {
          fr: "Est-ce que tu vends la maison ?",
          en: "Are you selling the house?",
          zh: "你要卖掉这栋房子吗？",
          code: `import type {
  ReVerb,
  SubjectVerb,
  EstCeQue,
  CommonNoun,
  DefiniteNP,
  Question,
} from "typed-french";

// EstCeQue fronts the clause "tu vends la maison" to make a question
type vendre = ReVerb<"vend">;
type maison = CommonNoun<"maison", "f">;

type Phrase = Question<EstCeQue<\`\${SubjectVerb<"tu", vendre>} \${DefiniteNP<maison>}\`>>;
`,
        },
      ],
    },
  ],
};

export default chapter;
