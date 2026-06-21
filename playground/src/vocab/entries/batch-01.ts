import type { VocabEntry } from "../types";

const entries: VocabEntry[] = [
  // nouns (with gender)
  { word: "chat", gender: "m", ipa: "/ʃa/", pos: "noun", en: "cat", zh: "猫" },
  { word: "chien", gender: "m", ipa: "/ʃjɛ̃/", pos: "noun", en: "dog", zh: "狗" },
  { word: "voiture", gender: "f", ipa: "/vwa.tyʁ/", pos: "noun", en: "car", zh: "汽车" },
  { word: "enfant", gender: "m", ipa: "/ɑ̃.fɑ̃/", pos: "noun", en: "child", zh: "孩子" },
  { word: "pomme", gender: "f", ipa: "/pɔm/", pos: "noun", en: "apple", zh: "苹果" },
  { word: "café", gender: "m", ipa: "/ka.fe/", pos: "noun", en: "coffee; café", zh: "咖啡；咖啡馆" },
  { word: "maison", gender: "f", ipa: "/mɛ.zɔ̃/", pos: "noun", en: "house", zh: "房子" },
  { word: "homme", gender: "m", ipa: "/ɔm/", pos: "noun", en: "man", zh: "男人" },
  { word: "femme", gender: "f", ipa: "/fam/", pos: "noun", en: "woman; wife", zh: "女人；妻子" },
  { word: "étudiant", gender: "m", ipa: "/e.ty.djɑ̃/", pos: "noun", en: "student", zh: "学生" },
  { word: "eau", gender: "f", ipa: "/o/", pos: "noun", en: "water", zh: "水" },
  { word: "pain", gender: "m", ipa: "/pɛ̃/", pos: "noun", en: "bread", zh: "面包" },
  { word: "français", gender: "m", ipa: "/fʁɑ̃.sɛ/", pos: "noun", en: "French (language)", zh: "法语" },
  { word: "anglais", gender: "m", ipa: "/ɑ̃.ɡlɛ/", pos: "noun", en: "English (language)", zh: "英语" },
  // adjectives (citation = masculine singular)
  { word: "noir", ipa: "/nwaʁ/", pos: "adjective", en: "black", zh: "黑色的" },
  { word: "grand", ipa: "/ɡʁɑ̃/", pos: "adjective", en: "big; tall", zh: "大的；高的" },
  { word: "petit", ipa: "/pə.ti/", pos: "adjective", en: "small", zh: "小的" },
  { word: "rouge", ipa: "/ʁuʒ/", pos: "adjective", en: "red", zh: "红色的" },
  { word: "heureux", ipa: "/ø.ʁø/", pos: "adjective", en: "happy", zh: "幸福的" },
  { word: "français", ipa: "/fʁɑ̃.sɛ/", pos: "adjective", en: "French", zh: "法国的" },
  // verbs (headword = infinitive)
  { word: "être", ipa: "/ɛtʁ/", pos: "verb-irregular", en: "to be", zh: "是" },
  { word: "avoir", ipa: "/a.vwaʁ/", pos: "verb-irregular", en: "to have", zh: "有" },
  { word: "aller", ipa: "/a.le/", pos: "verb-irregular", en: "to go", zh: "去" },
  { word: "faire", ipa: "/fɛʁ/", pos: "verb-irregular", en: "to do; to make", zh: "做" },
  { word: "parler", ipa: "/paʁ.le/", pos: "verb-er", en: "to speak", zh: "说" },
  { word: "aimer", ipa: "/e.me/", pos: "verb-er", en: "to like; to love", zh: "喜欢；爱" },
  { word: "manger", ipa: "/mɑ̃.ʒe/", pos: "verb-er", en: "to eat", zh: "吃" },
  { word: "habiter", ipa: "/a.bi.te/", pos: "verb-er", en: "to live (somewhere)", zh: "居住" },
  { word: "finir", ipa: "/fi.niʁ/", pos: "verb-ir", en: "to finish", zh: "完成" },
  { word: "vendre", ipa: "/vɑ̃dʁ/", pos: "verb-re", en: "to sell", zh: "卖" },
];

export default entries;
