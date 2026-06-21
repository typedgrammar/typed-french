import type { Chapter } from "../types";

const chapter: Chapter = {
  id: "e04",
  level: "elementary",
  order: 4,
  titleEn: "être & avoir",
  titleZh: "être 与 avoir",
  summaryEn:
    "Two verbs carry more of French than any others: être (to be) and avoir (to have). You introduce yourself with être, you say what you own with avoir, and behind the scenes both act as the engines that build every compound past tense. They are wildly irregular — there is no stem to trust, you simply learn the six forms — so this chapter drills them one by one. Then comes a twist that surprises every English speaker: where you say \"I am twenty\" or \"I am hungry\", French says \"I have twenty years\" and \"I have hunger\". With avoir for age and hunger in your pocket, you can already say a great deal about yourself.",
  summaryZh:
    "有两个动词比其他任何动词都更撑得起法语：être（是）与 avoir（有）。你用 être 作自我介绍，用 avoir 说自己拥有什么，而在幕后，它们俩还是构建所有复合过去时的引擎。它们极不规则——没有可信赖的词干，你只能把六个形式逐一记下——所以本章会一个一个地操练它们。接着来一个让每个英语母语者都意外的转折：你说「我二十岁」「我饿了」，法语却说「我有二十年」「我有饥饿」。把表年龄和饥饿的 avoir 揣进口袋，你就已经能讲出关于自己的很多事情了。",
  points: [
    {
      id: "e04-1",
      titleEn: "être (to be): je suis, tu es, il est",
      titleZh: "être（是）：je suis、tu es、il est",
      bodyEn:
        "`être` means **to be**, and it is the first verb you reach for to say who or what something is: your name, your job, your nationality, how you feel. It is also completely irregular — knowing the `-er` pattern won't help you here. The six present forms simply have to be memorised: `je suis`, `tu es`, `il/elle est`, `nous sommes`, `vous êtes`, `ils/elles sont`.\n\nLook at how little they resemble one another — `suis`, `es`, `est`, `sommes`, `êtes`, `sont` share almost no letters. That's the price of being the most-used verb in the language: it gets worn down into shapes you just have to know by heart. The good news is that, because it appears in nearly every conversation, these forms stick fast.\n\nIn the code, `IrregularVerb<\"être\">` names the verb and `ConjugateVerb` (or `SubjectVerb`, which also glues the subject on) pulls out the right hand-written form for each person — no stem-plus-ending arithmetic involved.",
      bodyZh:
        "`être` 意思是**是**，它是你想说「某人/某物是谁、是什么」时最先抓取的动词：你的名字、职业、国籍、心情。它也是彻底不规则的——你会的 `-er` 模式在这里帮不上忙。现在时的六个形式只能硬记：`je suis`、`tu es`、`il/elle est`、`nous sommes`、`vous êtes`、`ils/elles sont`。\n\n看看它们彼此有多不像——`suis`、`es`、`est`、`sommes`、`êtes`、`sont` 几乎不共享任何字母。这就是身为语言中最高频动词所付出的代价：它被磨损成一些你只能凭记忆掌握的形状。好消息是，正因为它几乎出现在每段对话里，这些形式会记得格外牢。\n\n在代码里，`IrregularVerb<\"être\">` 给出动词，`ConjugateVerb`（或会顺带把主语黏上去的 `SubjectVerb`）会为每个人称取出对应的、手写好的形式——完全不需要「词干加词尾」的运算。",
      examples: [
        {
          fr: "Je suis étudiant.",
          en: "I am a student.",
          zh: "我是学生。",
          code: `import type { IrregularVerb, SubjectVerb, Sentence } from "typed-french";

// être is irregular: the je-form is the hand-written "suis"
type être = IrregularVerb<"être">;

type Phrase = Sentence<\`\${SubjectVerb<"je", être>} étudiant\`>;
`,
        },
        {
          fr: "Nous sommes français.",
          en: "We are French.",
          zh: "我们是法国人。",
          code: `import type { IrregularVerb, SubjectVerb, Sentence } from "typed-french";

// the nous-form of être is "sommes" — nothing predictable about it
type être = IrregularVerb<"être">;

type Phrase = Sentence<\`\${SubjectVerb<"nous", être>} français\`>;
`,
        },
      ],
    },
    {
      id: "e04-2",
      titleEn: "avoir (to have): j'ai, tu as, il a",
      titleZh: "avoir（有）：j'ai、tu as、il a",
      bodyEn:
        "`avoir` means **to have** — to own, to possess. Like `être`, it is irregular and high-frequency, and its present forms must be learned outright: `j'ai`, `tu as`, `il/elle a`, `nous avons`, `vous avez`, `ils/elles ont`.\n\nNotice the `je` form: `avoir`'s first-person is `ai`, which begins with a vowel, so `je` always elides to `j'` — you say `j'ai`, never `je ai`. Watch out, too, for the look-alikes: `il a` (he has) versus `il à`… no — `à` is a different word; `a` here is simply the verb. The plural `ils ont` (they have) sounds close to `ils sont` (they are) but the `s` of être makes the difference.\n\nWith `avoir` you can claim anything: pair it with an indefinite noun phrase to say you have a cat, a car, a house. In the code, `SubjectVerb<\"je\", avoir>` produces the elided `j'ai`, and an `IndefiniteNP` supplies the thing owned.",
      bodyZh:
        "`avoir` 意思是**有**——拥有、持有。和 `être` 一样，它不规则又高频，现在时形式必须直接背下来：`j'ai`、`tu as`、`il/elle a`、`nous avons`、`vous avez`、`ils/elles ont`。\n\n注意 `je` 这个形式：`avoir` 的第一人称是 `ai`，以元音开头，所以 `je` 总会省音成 `j'`——你说 `j'ai`，绝不说 `je ai`。也要当心那些长得像的：`il a`（他有）和 `il à`……不对——`à` 是另一个词；这里的 `a` 单纯就是动词。复数 `ils ont`（他们有）听起来很接近 `ils sont`（他们是），但 être 的那个 `s` 把两者区分开了。\n\n有了 `avoir`，你可以宣称拥有任何东西：把它和一个不定名词短语搭配，就能说你有一只猫、一辆车、一栋房子。在代码里，`SubjectVerb<\"je\", avoir>` 会生成省音后的 `j'ai`，而 `IndefiniteNP` 提供所拥有之物。",
      examples: [
        {
          fr: "J'ai un chat.",
          en: "I have a cat.",
          zh: "我有一只猫。",
          code: `import type {
  IrregularVerb,
  SubjectVerb,
  CommonNoun,
  IndefiniteNP,
  Sentence,
} from "typed-french";

// avoir's je-form is "ai" → starts with a vowel → je elides to j'ai
type avoir = IrregularVerb<"avoir">;
type chat = CommonNoun<"chat", "m">;

type Phrase = Sentence<\`\${SubjectVerb<"je", avoir>} \${IndefiniteNP<chat>}\`>;
`,
        },
        {
          fr: "Vous avez une voiture.",
          en: "You have a car.",
          zh: "您有一辆车。",
          code: `import type {
  IrregularVerb,
  SubjectVerb,
  CommonNoun,
  IndefiniteNP,
  Sentence,
} from "typed-french";

// the vous-form of avoir is "avez" — another shape you simply memorise
type avoir = IrregularVerb<"avoir">;
type voiture = CommonNoun<"voiture", "f">;

type Phrase = Sentence<\`\${SubjectVerb<"vous", avoir>} \${IndefiniteNP<voiture>}\`>;
`,
        },
      ],
    },
    {
      id: "e04-3",
      titleEn: "avoir for age and hunger: j'ai … ans, j'ai faim",
      titleZh: "用 avoir 表年龄和饥饿：j'ai … ans、j'ai faim",
      bodyEn:
        "Here is one of the first places French refuses to translate word-for-word. To give your **age**, French does not use `être` (\"to be\") but `avoir` (\"to have\"): literally, you *have* a number of years. `J'ai vingt ans` is \"I am twenty\" — word for word, \"I have twenty years\". Forgetting the `ans` (\"years\") is the classic beginner slip; `J'ai vingt` means nothing.\n\nThe same logic runs through a whole family of bodily states. Where English uses *to be* + adjective, French uses `avoir` + a noun: `j'ai faim` (\"I am hungry\", literally \"I have hunger\"), `j'ai soif` (\"I am thirsty\", \"I have thirst\"). There is no article — you say `j'ai faim`, not `j'ai une faim`. Mentally file these as fixed expressions built on `avoir`, and you will sound natural while your classmates are still saying *je suis faim* by mistake.\n\nIn the code these read straight off `avoir`: `SubjectVerb<\"je\", avoir>` gives `j'ai`, and the rest — the number with `ans`, or the bare noun `faim` — is plain text following the verb.",
      bodyZh:
        "这是法语最早一批拒绝逐字翻译的地方之一。说你的**年龄**，法语不用 `être`（「是」）而用 `avoir`（「有」）：字面上，你*拥有*若干年。`J'ai vingt ans` 是「我二十岁」——逐字看是「我有二十年」。漏掉 `ans`（「年」）是初学者的经典失误；`J'ai vingt` 什么也不是。\n\n同样的逻辑贯穿一整族身体状态。英语用 *be* + 形容词的地方，法语用 `avoir` + 名词：`j'ai faim`（「我饿了」，字面「我有饥饿」）、`j'ai soif`（「我渴了」，「我有口渴」）。这里没有冠词——你说 `j'ai faim`，不说 `j'ai une faim`。把这些当作建立在 `avoir` 上的固定短语记下来，你就会说得地道，而你的同学们还在错说 *je suis faim*。\n\n在代码里这些都直接从 `avoir` 读出：`SubjectVerb<\"je\", avoir>` 给出 `j'ai`，其余部分——带 `ans` 的数字，或光秃秃的名词 `faim`——都是跟在动词后面的纯文本。",
      examples: [
        {
          fr: "J'ai vingt ans.",
          en: "I am twenty (years old).",
          zh: "我二十岁。",
          code: `import type { IrregularVerb, SubjectVerb, Sentence } from "typed-french";

// age uses avoir, not être: literally "I have twenty years" — never omit "ans"
type avoir = IrregularVerb<"avoir">;

type Phrase = Sentence<\`\${SubjectVerb<"je", avoir>} vingt ans\`>;
`,
        },
        {
          fr: "J'ai faim.",
          en: "I am hungry.",
          zh: "我饿了。",
          code: `import type { IrregularVerb, SubjectVerb, Sentence } from "typed-french";

// a bodily state: avoir + a bare noun, no article — "I have hunger"
type avoir = IrregularVerb<"avoir">;

type Phrase = Sentence<\`\${SubjectVerb<"je", avoir>} faim\`>;
`,
        },
      ],
    },
  ],
};

export default chapter;
