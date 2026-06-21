import type { VocabEntry } from "../types";

// New content words first used in chapter e04. Words already defined in
// batch-01 (être, avoir, chat, voiture, étudiant, français) are not redefined.
const entries: VocabEntry[] = [
  // nouns (with gender) — "ans" is the plural of the masculine "an"
  { word: "an", gender: "m", ipa: "/ɑ̃/", pos: "noun", en: "year", zh: "年；岁" },
  { word: "faim", gender: "f", ipa: "/fɛ̃/", pos: "noun", en: "hunger", zh: "饥饿" },
  { word: "soif", gender: "f", ipa: "/swaf/", pos: "noun", en: "thirst", zh: "口渴" },
  // numeral
  { word: "vingt", ipa: "/vɛ̃/", pos: "numeral", en: "twenty", zh: "二十" },
];

export default entries;
