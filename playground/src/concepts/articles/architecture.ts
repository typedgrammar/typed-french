import type { ConceptArticle } from "../types";

const article: ConceptArticle = {
  id: "architecture",
  order: 1,
  titleEn: "The architecture of French",
  titleZh: "法语的架构",
  taglineEn: "Agreement, articles and word order — the load-bearing walls.",
  taglineZh: "一致、冠词与语序 —— 撑起整座建筑的承重墙。",
  introEn:
    "Before the syllabus, a map. French looks like English at a glance — same alphabet, many shared words — but it is built on a few structural ideas that English mostly dropped. If you see these ideas first, the grammar course stops feeling like a list of exceptions and starts feeling like one system repeating itself.",
  introZh:
    "在进入教学大纲之前，先看一张地图。法语乍看像英语——相同的字母、许多共享的词——但它建立在几条英语大多已经丢弃的结构性理念之上。如果你先看清这些理念，语法课程就不再像一长串例外，而开始像同一个系统在不断地自我重复。",
  sections: [
    {
      id: "gender",
      headingEn: "Every noun has a gender, and it spreads",
      headingZh: "每个名词都有性别，而且会扩散",
      blocks: [
        {
          kind: "define",
          term: "le genre",
          ipa: "/lə ʒɑ̃ʁ/",
          en: "Grammatical gender: every noun is masculine or feminine. It is a property of the word, not of meaning.",
          zh: "语法性别：每个名词非阳即阴。它是词本身的属性，与含义无关。",
        },
        {
          kind: "prose",
          en: "The single most important thing to absorb early: a noun's gender is not decoration — it **propagates**. The article, the adjective, and later the past participle all change shape to agree with it. Gender is the signal; agreement is everything downstream that has to match.",
          zh: "最该尽早吸收的一点：名词的性别不是装饰——它会**传播**。冠词、形容词，以及之后的过去分词，都会变形以与它保持一致。性别是信号；一致则是下游所有必须与之相配的东西。",
        },
        {
          kind: "compare",
          fr: "le petit chat / la petite voiture",
          en: "the little cat / the little car",
          zh: "小猫 / 小车",
          tsEn: `// Gender is a tag on the noun; the article and adjective read that
// tag and agree. Same idea as passing a type parameter everywhere.
type Noun = { word: "chat"; gender: "m" };
type Article = Noun["gender"] extends "m" ? "le" : "la"; // "le"`,
          tsZh: `// 性别是名词上的一个标签；冠词和形容词读取这个标签并保持一致。
// 就像把一个类型参数传递到每一处。
type Noun = { word: "chat"; gender: "m" };
type Article = Noun["gender"] extends "m" ? "le" : "la"; // "le"`,
          noteEn: "Masculine and feminine forms of the adjective (petit / petite) are computed from the same stem.",
          noteZh: "形容词的阳性与阴性形式（petit / petite）由同一个词干计算得出。",
        },
        { kind: "chapters", ids: ["e01"] },
      ],
    },
    {
      id: "elision",
      headingEn: "French smooths vowels: elision",
      headingZh: "法语会抹平元音：省音",
      blocks: [
        {
          kind: "prose",
          en: "French avoids two vowel sounds colliding. Whenever a short word ending in a vowel meets a word starting with one, the first vowel is dropped and an apostrophe takes its place: `le` + `homme` → `l'homme`, `je` + `aime` → `j'aime`, `ne` + `aime` → `n'aime`. It is one rule wearing many costumes — learn it once and you predict all of them.",
          zh: "法语避免两个元音相撞。每当一个以元音结尾的短词遇上一个以元音开头的词，前一个元音就被去掉，由一个撇号取而代之：`le` + `homme` → `l'homme`，`je` + `aime` → `j'aime`，`ne` + `aime` → `n'aime`。这是同一条规则换了许多身行头——学会一次，你就能预测它们全部。",
        },
        {
          kind: "example",
          fr: "J'habite à Paris.",
          en: "I live in Paris.",
          zh: "我住在巴黎。",
        },
        { kind: "chapters", ids: ["e01", "e02"] },
      ],
    },
    {
      id: "verbs",
      headingEn: "Verbs agree with the subject",
      headingZh: "动词与主语保持一致",
      blocks: [
        {
          kind: "prose",
          en: "Where English uses one verb form for almost everyone (I/you/we **speak**, only he **speaks**), French changes the ending for each person. The good news: the regular verbs fall into tidy groups (-er, -ir, -re), and within a group the endings are fixed. Conjugation is **stem + ending**, a lookup you can memorise as a small table.",
          zh: "英语对几乎所有人称用同一个动词形式（I/you/we **speak**，只有 he **speaks**），法语却为每个人称改变词尾。好消息是：规则动词分成整齐的几组（-er、-ir、-re），同一组内词尾固定。变位就是**词干 + 词尾**，一张你可以背下来的小表格。",
        },
        {
          kind: "breakdown",
          fr: "Nous ne parlons pas anglais.",
          en: "We don't speak English.",
          zh: "我们不说英语。",
          layers: [
            { fragment: "nous", en: "subject → selects the -ons ending", zh: "主语 → 选定 -ons 词尾" },
            { fragment: "parl·ons", depth: 1, en: "stem + ending (parler, present)", zh: "词干 + 词尾（parler，现在时）" },
            { fragment: "ne … pas", depth: 1, en: "negation frame wrapping the verb", zh: "包住动词的否定框架" },
            { fragment: "anglais", en: "object (the language spoken)", zh: "宾语（所说的语言）" },
          ],
        },
        { kind: "chapters", ids: ["e02"] },
      ],
    },
  ],
};

export default article;
