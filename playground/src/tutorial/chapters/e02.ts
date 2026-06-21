import type { Chapter } from "../types";

const chapter: Chapter = {
  id: "e02",
  level: "elementary",
  order: 2,
  titleEn: "The present tense of -er verbs",
  titleZh: "-er 动词的现在时",
  summaryEn:
    "Most French verbs — and almost every new one you'll ever meet — end in -er, and they all bend the same way. Learn this one pattern and you can already say what you do, like, and speak. We take the verb's stem, attach an ending that agrees with the subject (je, tu, il…), and meet two everyday tools: the je → j' elision and the ne … pas frame that wraps a verb to make it negative.",
  summaryZh:
    "大多数法语动词——以及你今后遇到的几乎每一个新动词——都以 -er 结尾，而它们的变位方式完全相同。学会这一个模式，你就已经能说出自己做什么、喜欢什么、说什么了。我们取动词的词干，接上与主语（je、tu、il……）一致的词尾，并认识两个日常工具：je → j' 的省音，以及把动词包起来构成否定的 ne … pas 框架。",
  points: [
    {
      id: "e02-1",
      titleEn: "Stem + ending: je parle, nous parlons",
      titleZh: "词干 + 词尾：je parle，nous parlons",
      bodyEn:
        "Take an -er verb like `parler` (to speak). Drop the `-er` to get the **stem** `parl-`, then add the ending for the subject: `-e` (je), `-es` (tu), `-e` (il/elle), `-ons` (nous), `-ez` (vous), `-ent` (ils/elles). So `je parle`, `tu parles`, `nous parlons`. The whole first group conjugates exactly like this — once you've done one, you've done thousands.\n\nA quirk worth hearing now: `-e`, `-es`, and `-ent` are all silent. `je parle`, `tu parles`, and `ils parlent` sound identical out loud; only the written ending tells them apart. So the subject pronoun isn't optional padding — it's what your ear relies on.\n\nIn code, `ErVerb<\"parl\">` is the verb and `SubjectVerb` glues the subject to the conjugated form (handling the je → j' elision for you).",
      bodyZh:
        "拿一个 -er 动词，比如 `parler`（说）。去掉 `-er` 得到**词干** `parl-`，然后加上与主语相配的词尾：`-e`（je）、`-es`（tu）、`-e`（il/elle）、`-ons`（nous）、`-ez`（vous）、`-ent`（ils/elles）。于是 `je parle`、`tu parles`、`nous parlons`。整个第一组动词都完全这样变位——会了一个，就等于会了几千个。\n\n一个现在就值得听一听的小特点：`-e`、`-es`、`-ent` 都不发音。`je parle`、`tu parles`、`ils parlent` 读出来一模一样；只有书写的词尾能区分它们。所以主语代词并不是可有可无的填充——它正是你耳朵所依赖的东西。\n\n在代码里，`ErVerb<\"parl\">` 是这个动词，`SubjectVerb` 把主语和变好位的形式黏在一起（并替你处理 je → j' 的省音）。",
      examples: [
        {
          fr: "Je parle français.",
          en: "I speak French.",
          zh: "我说法语。",
          code: `import type { ErVerb, SubjectVerb, Sentence } from "typed-french";

// parler → stem "parl"; SubjectVerb adds the je-ending "-e"
type parler = ErVerb<"parl">;

type Phrase = Sentence<\`\${SubjectVerb<"je", parler>} français\`>;
`,
        },
        {
          fr: "Nous aimons le café.",
          en: "We like coffee.",
          zh: "我们喜欢咖啡。",
          code: `import type {
  ErVerb,
  SubjectVerb,
  CommonNoun,
  DefiniteNP,
  Sentence,
} from "typed-french";

// the nous-ending is "-ons" → "nous aimons"
type aimer = ErVerb<"aim">;
type café = CommonNoun<"café", "m">;

type Phrase = Sentence<\`\${SubjectVerb<"nous", aimer>} \${DefiniteNP<café>}\`>;
`,
        },
      ],
    },
    {
      id: "e02-2",
      titleEn: "j' before a vowel",
      titleZh: "元音前的 j'",
      bodyEn:
        "The same elision you saw with `le`/`la` applies to `je`. Before a verb starting with a vowel sound, `je` becomes `j'` and attaches: not `je aime` but `j'aime`, not `je habite` but `j'habite`. It's automatic and obligatory — French simply never leaves `je` sitting before a vowel.\n\nThis only affects `je`; the other subject pronouns (`tu`, `il`, `nous`…) don't elide here. `SubjectVerb` checks the conjugated form and applies the contraction only when it's needed.",
      bodyZh:
        "你在 `le`/`la` 上看到的省音，同样适用于 `je`。在以元音开头的动词前，`je` 变成 `j'` 并黏上去：不是 `je aime` 而是 `j'aime`，不是 `je habite` 而是 `j'habite`。这是自动且强制的——法语绝不会让 `je` 停在一个元音前面。\n\n这只影响 `je`；其他主语代词（`tu`、`il`、`nous`……）在这里不省音。`SubjectVerb` 会检查变位后的形式，仅在需要时才施加这个缩合。",
      examples: [
        {
          fr: "J'aime le chat.",
          en: "I like the cat.",
          zh: "我喜欢这只猫。",
          code: `import type {
  ErVerb,
  SubjectVerb,
  CommonNoun,
  DefiniteNP,
  Sentence,
} from "typed-french";

// aimer starts with a vowel after conjugation → je elides to j'aime
type aimer = ErVerb<"aim">;
type chat = CommonNoun<"chat", "m">;

type Phrase = Sentence<\`\${SubjectVerb<"je", aimer>} \${DefiniteNP<chat>}\`>;
`,
        },
      ],
    },
    {
      id: "e02-3",
      titleEn: "Negation: ne … pas",
      titleZh: "否定：ne … pas",
      bodyEn:
        "French negates a verb by wrapping it in two pieces: `ne` goes before the verb and `pas` after it. `je parle` (“I speak”) becomes `je ne parle pas` (“I don't speak”). Think of `ne … pas` as a pair of brackets that close around the conjugated verb.\n\nElision strikes once more: before a vowel, `ne` becomes `n'`. So `il aime` negates to `il n'aime pas`. In casual speech the `ne` is often dropped entirely (`je parle pas`), but in writing and careful speech both halves stay.\n\n`NegativeVerb` builds the whole frame for you — subject, `ne`/`n'`, the verb, and `pas`.",
      bodyZh:
        "法语用两个部件把动词包起来构成否定：`ne` 放在动词前，`pas` 放在动词后。`je parle`（「我说」）变成 `je ne parle pas`（「我不说」）。可以把 `ne … pas` 想成一对括号，从两边合拢住变位后的动词。\n\n省音再次出现：在元音前，`ne` 变成 `n'`。于是 `il aime` 否定为 `il n'aime pas`。在随意的口语里 `ne` 常被完全省略（`je parle pas`），但在书面和正式表达中两半都保留。\n\n`NegativeVerb` 会替你搭好整个框架——主语、`ne`/`n'`、动词，以及 `pas`。",
      examples: [
        {
          fr: "Tu ne parles pas anglais.",
          en: "You don't speak English.",
          zh: "你不说英语。",
          code: `import type { ErVerb, NegativeVerb, Sentence } from "typed-french";

type parler = ErVerb<"parl">;

// NegativeVerb wraps the verb: tu + ne + parles + pas
type Phrase = Sentence<\`\${NegativeVerb<"tu", parler>} anglais\`>;
`,
        },
        {
          fr: "Il n'aime pas le café.",
          en: "He doesn't like coffee.",
          zh: "他不喜欢咖啡。",
          code: `import type {
  ErVerb,
  NegativeVerb,
  CommonNoun,
  DefiniteNP,
  Sentence,
} from "typed-french";

// aime starts with a vowel → ne elides to n'
type aimer = ErVerb<"aim">;
type café = CommonNoun<"café", "m">;

type Phrase = Sentence<\`\${NegativeVerb<"il", aimer>} \${DefiniteNP<café>}\`>;
`,
        },
      ],
    },
  ],
};

export default chapter;
