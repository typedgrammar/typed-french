import type { Chapter } from "../types";

const chapter: Chapter = {
  id: "e05",
  level: "elementary",
  order: 5,
  titleEn: "Asking questions: est-ce que & rising intonation",
  titleZh: "提问：est-ce que 与升调",
  summaryEn:
    "You're in a café and you want to ask: do you speak English? In English you'd flip the words around — \"do you…\", \"are you…\". French almost never makes you do that. Instead it offers two effortless moves: just say the statement with your voice rising at the end, or paste the little ready-made tag est-ce que in front of it. This chapter shows both, and why the English habit of inverting (and adding \"do\") is exactly what you should *unlearn* here.",
  summaryZh:
    "你在咖啡馆里，想问一句：你会说英语吗？换成英语，你得把词序整个翻过来——「do you…」「are you…」。法语几乎从不要求你这么做。它给了你两个毫不费力的办法：把陈述句照原样说出来、只让句末的语调上扬；或者在句子前面贴上现成的小标签 est-ce que。本章把两者都讲清楚，并说明英语那种「倒装 + 加 do」的习惯，正是你在这里需要*忘掉*的。",
  points: [
    {
      id: "e05-1",
      titleEn: "Just raise your voice: the intonation question",
      titleZh: "只需提高声调：升调疑问句",
      bodyEn:
        "The easiest yes/no question in French is no question at all — grammatically, it's a plain statement. You take the declarative sentence `tu parles français` (\"you speak French\") and, without touching a single word, let your voice **rise** at the end. In writing, that rise becomes a question mark: `Tu parles français ?`\n\nThis is the everyday spoken form — what you'll actually hear in a café or on the street. There is no \"do\", no swapping of subject and verb, no extra machinery. The word order is *identical* to the statement; only the melody (and the printed `?`) changes. Compare English, where \"you speak French\" must become \"**do** you speak French?\" — French spares you that whole operation.\n\nNotice the French typographic habit: a thin space sits **before** the `?` (and before `!` and `:`). Our `Question` wrapper adds that space and the question mark for you, so the snippet below is literally the statement `tu parles français` finished with `Question<…>`.",
      bodyZh:
        "法语里最简单的一般疑问句，其实根本不算「问句」——从语法上看，它就是一个普通的陈述句。你拿来陈述句 `tu parles français`（「你说法语」），一个字都不动，只在句末让声音**上扬**。落到书面上，这个上扬就变成一个问号：`Tu parles français ?`\n\n这是日常口语的形式——你在咖啡馆、在街上真正会听到的那种。没有 「do」，没有主谓对调，没有任何额外的机关。词序和陈述句*完全一样*；变的只是旋律（以及印出来的 `?`）。对比英语：「you speak French」必须变成「**do** you speak French?」——法语替你省去了这一整套操作。\n\n留意法语的排版习惯：`?` 前面要留一个窄空格（`!` 和 `:` 前也一样）。我们的 `Question` 包装器会替你加上这个空格和问号，所以下面的代码字面上就是陈述句 `tu parles français` 再用 `Question<…>` 收尾。",
      examples: [
        {
          fr: "Tu parles français ?",
          en: "Do you speak French? / You speak French?",
          zh: "你说法语吗？",
          ipa: "/ty paʁl fʁɑ̃.sɛ/",
          code: `import type { ErVerb, SubjectVerb, Question } from "typed-french";

// Same word order as the statement "tu parles français" —
// Question just capitalizes and adds the (space +) "?".
type parler = ErVerb<"parl">;

type Phrase = Question<\`\${SubjectVerb<"tu", parler>} français\`>;
`,
        },
        {
          fr: "Vous habitez ici ?",
          en: "Do you live here?",
          zh: "您住在这里吗？",
          ipa: "/vu.za.bi.te i.si/",
          code: `import type { ErVerb, SubjectVerb, Question } from "typed-french";

// No inversion, no "do": the vous-statement, finished with a rising "?".
type habiter = ErVerb<"habit">;

type Phrase = Question<\`\${SubjectVerb<"vous", habiter>} ici\`>;
`,
        },
      ],
    },
    {
      id: "e05-2",
      titleEn: "The all-purpose tag: est-ce que",
      titleZh: "万能标签：est-ce que",
      bodyEn:
        "The second move is just as mechanical, and it works in writing and careful speech where a bare intonation question might feel too casual. You keep the statement exactly as it is and bolt the fixed phrase **`est-ce que`** onto the front. `Tu parles français` → `Est-ce que tu parles français ?`\n\nThink of `est-ce que` as a single unbreakable signal that means \"a yes/no question is coming\" — literally it's \"is-it-that…\", but you should *not* translate it word by word. It's the French equivalent of the English \"do/does\" or \"are\", except it never changes form for person or tense: one tag fits `je`, `tu`, `nous`, everybody. Behind it, the clause stays in normal statement order, which is the whole point — you never rearrange the sentence.\n\nElision shows up here too: before a vowel sound, `est-ce que` contracts to **`est-ce qu'`** (`est-ce qu'il`, `est-ce qu'elle`). The `EstCeQue` wrapper applies that automatically; wrap it in `Question` to add the final `?`.",
      bodyZh:
        "第二个办法同样机械，而且适用于书面和较正式的口语——在那些场合，光靠升调的疑问句可能显得太随便。你把陈述句原封不动地留着，在它前面装上固定短语 **`est-ce que`**。`Tu parles français` → `Est-ce que tu parles français ?`\n\n把 `est-ce que` 当成一个不可拆分的整体信号，意思是「接下来是一般疑问句」——它字面上是「是-它-那……」，但你*不该*逐字去翻。它相当于英语的 「do/does」或 「are」，只是它从不随人称或时态变形：一个标签通吃 `je`、`tu`、`nous`，谁都适用。在它后面，从句保持正常的陈述语序——这正是关键所在：你永远不必重排句子。\n\n这里也会出现省音：在元音前，`est-ce que` 缩成 **`est-ce qu'`**（`est-ce qu'il`、`est-ce qu'elle`）。`EstCeQue` 包装器会自动处理；再套上 `Question` 来加末尾的 `?`。",
      examples: [
        {
          fr: "Est-ce que tu parles anglais ?",
          en: "Do you speak English?",
          zh: "你会说英语吗？",
          ipa: "/ɛs.kə ty paʁl ɑ̃.ɡlɛ/",
          code: `import type { ErVerb, SubjectVerb, EstCeQue, Question } from "typed-french";

// Front the statement with the fixed tag; the word order never moves.
type parler = ErVerb<"parl">;

type Phrase = Question<EstCeQue<\`\${SubjectVerb<"tu", parler>} anglais\`>>;
`,
        },
        {
          fr: "Est-ce qu'il aime le café ?",
          en: "Does he like coffee?",
          zh: "他喜欢咖啡吗？",
          ipa: "/ɛs.kil ɛm lə ka.fe/",
          code: `import type {
  ErVerb,
  SubjectVerb,
  CommonNoun,
  DefiniteNP,
  EstCeQue,
  Question,
} from "typed-french";

// Before a vowel (il), est-ce que contracts to est-ce qu'.
type aimer = ErVerb<"aim">;
type café = CommonNoun<"café", "m">;

type Phrase = Question<EstCeQue<\`\${SubjectVerb<"il", aimer>} \${DefiniteNP<café>}\`>>;
`,
        },
      ],
    },
    {
      id: "e05-3",
      titleEn: "What NOT to do: the English inversion habit",
      titleZh: "不要做的事：英语的倒装习惯",
      bodyEn:
        "English builds a yes/no question by *moving things*: it lifts an auxiliary to the front (\"**Are** you…\", \"**Have** you…\") or, when there's no auxiliary, it conjures one out of thin air — the dummy \"**do**\" — and inverts it (\"**Do** you speak…\"). That \"do\" has no meaning; it exists only to carry the question.\n\nFrench has nothing like dummy \"do\". The instinct to translate \"Do you…\" as a word and stick it in front (`Do tu parles…` ✗) is the single most common beginner reflex, and it produces something no French speaker would say. The fix is to *delete* that instinct: there is no word for the question-\"do\". Either raise your intonation, or prepend `est-ce que`. Both leave the verb conjugated normally and the subject in its usual place.\n\n(French *does* have a true inversion — `Parles-tu français ?` — but it's the formal, written register, a later chapter. For everyday questions, the two tools in this chapter are all you need, and they keep the sentence in plain statement order. Below, the very same clause becomes a question two ways, with no \"do\" and no reordering.)",
      bodyZh:
        "英语靠*搬动词语*来构成一般疑问句：它把助动词提到句首（「**Are** you…」「**Have** you…」）；要是没有助动词，它就凭空变出一个——那个虚词 「**do**」——再把它倒装到前面（「**Do** you speak…」）。这个 「do」没有意义，它的存在只是为了承载疑问。\n\n法语里根本没有虚词 「do」这种东西。把 「Do you…」当成一个词翻出来、塞到句首（`Do tu parles…` ✗），是初学者最常见的本能反应，而它造出的句子任何法语母语者都不会说。纠正的办法就是*删掉*这个本能：疑问的 「do」压根没有对应的词。要么提升语调，要么在前面加 `est-ce que`。两种办法都让动词照常变位、主语待在它平常的位置。\n\n（法语*确实*有真正的倒装——`Parles-tu français ?`——但那属于正式、书面的语域，留待以后的章节。日常提问，本章的两个工具就够用了，而且它们都让句子保持纯粹的陈述语序。下面，同一个从句以两种方式变成疑问句，既没有 「do」，也没有任何重排。）",
      examples: [
        {
          fr: "Tu aimes le chat ?",
          en: "Do you like the cat? (intonation only — no \"do\")",
          zh: "你喜欢这只猫吗？（只用升调——没有「do」）",
          ipa: "/ty ɛm lə ʃa/",
          code: `import type {
  ErVerb,
  SubjectVerb,
  CommonNoun,
  DefiniteNP,
  Question,
} from "typed-french";

// English would force "Do you like…"; French keeps statement order + a rising "?".
type aimer = ErVerb<"aim">;
type chat = CommonNoun<"chat", "m">;

type Phrase = Question<\`\${SubjectVerb<"tu", aimer>} \${DefiniteNP<chat>}\`>;
`,
        },
        {
          fr: "Est-ce que tu aimes le chat ?",
          en: "Do you like the cat? (same meaning, with the est-ce que tag)",
          zh: "你喜欢这只猫吗？（同样的意思，用 est-ce que 标签）",
          ipa: "/ɛs.kə ty ɛm lə ʃa/",
          code: `import type {
  ErVerb,
  SubjectVerb,
  CommonNoun,
  DefiniteNP,
  EstCeQue,
  Question,
} from "typed-french";

// The identical clause, now tagged — still no inversion, still no "do".
type aimer = ErVerb<"aim">;
type chat = CommonNoun<"chat", "m">;

type Phrase = Question<EstCeQue<\`\${SubjectVerb<"tu", aimer>} \${DefiniteNP<chat>}\`>>;
`,
        },
      ],
    },
  ],
};

export default chapter;
