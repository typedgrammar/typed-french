import type { PartOfSpeech, VocabEntry } from "./types";

/**
 * Hand-maintained grammar vocabulary: articles, prepositions, subject pronouns,
 * conjunctions and the negation frame. These give meanings for the grammatical
 * glue in sentences (le, une, ne … pas, est-ce que …), complementing the content
 * words authored under entries/.
 */
const e = (
  word: string,
  pos: PartOfSpeech,
  en: string,
  zh: string
): VocabEntry => ({ word, pos, en, zh });

export const FUNCTION_WORDS: VocabEntry[] = [
  // definite / indefinite / partitive articles
  e("le", "article", "the (m.sg)", "（阳性单数）定冠词"),
  e("la", "article", "the (f.sg)", "（阴性单数）定冠词"),
  e("l'", "article", "the (before a vowel)", "（元音前）定冠词"),
  e("les", "article", "the (pl)", "（复数）定冠词"),
  e("un", "article", "a / an (m.sg)", "（阳性）不定冠词"),
  e("une", "article", "a / an (f.sg)", "（阴性）不定冠词"),
  e("des", "article", "some (pl)", "（复数）不定/部分冠词"),
  e("du", "article", "some (m.sg, partitive)", "（阳性）部分冠词"),
  e("de la", "article", "some (f.sg, partitive)", "（阴性）部分冠词"),
  // subject pronouns
  e("je", "pronoun", "I", "我"),
  e("tu", "pronoun", "you (informal sg)", "你"),
  e("il", "pronoun", "he / it (m)", "他／它（阳）"),
  e("elle", "pronoun", "she / it (f)", "她／它（阴）"),
  e("on", "pronoun", "one / we (informal)", "人们／我们（口语）"),
  e("nous", "pronoun", "we", "我们"),
  e("vous", "pronoun", "you (formal / pl)", "您／你们"),
  e("ils", "pronoun", "they (m)", "他们"),
  e("elles", "pronoun", "they (f)", "她们"),
  // prepositions
  e("à", "preposition", "to / at", "到／在"),
  e("de", "preposition", "of / from", "的／从"),
  e("en", "preposition", "in", "在……（里）"),
  e("dans", "preposition", "in / inside", "在……里面"),
  e("sur", "preposition", "on", "在……上"),
  e("sous", "preposition", "under", "在……下"),
  e("avec", "preposition", "with", "和……一起"),
  e("pour", "preposition", "for", "为了"),
  e("chez", "preposition", "at the place of", "在……家／处"),
  // conjunctions
  e("et", "conjunction", "and", "和"),
  e("ou", "conjunction", "or", "或者"),
  e("mais", "conjunction", "but", "但是"),
  e("parce que", "conjunction", "because", "因为"),
  e("que", "conjunction", "that", "（引导从句）"),
  // negation frame
  e("ne", "negation", "not (first half of ne … pas)", "否定框架前半"),
  e("n'", "negation", "not (before a vowel)", "否定框架前半（元音前）"),
  e("pas", "negation", "not (second half of ne … pas)", "否定框架后半"),
  // interrogatives
  e("est-ce que", "expression", "(question marker)", "（疑问标记）"),
  e("qui", "pronoun", "who", "谁"),
  e("quoi", "pronoun", "what", "什么"),
  e("où", "adverb", "where", "哪里"),
  e("quand", "adverb", "when", "什么时候"),
  e("comment", "adverb", "how", "怎么样"),
  e("pourquoi", "adverb", "why", "为什么"),
];
