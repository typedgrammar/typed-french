import type {
  CommonNoun,
  DefiniteNP,
  IndefiniteNP,
  Adjective,
  ConjugateAdjective,
  ErVerb,
  IrregularVerb,
  ConjugateVerb,
  SubjectVerb,
  NegativeVerb,
  Clause,
  Sentence,
  Question,
  EstCeQue,
} from "../index";

// Nouns carry gender; the article surface is computed from it + the initial letter.
type chat = CommonNoun<"chat", "m">;
type femme = CommonNoun<"femme", "f">;
type homme = CommonNoun<"homme", "m">;

type leChat = DefiniteNP<chat>; // "le chat"
type laFemme = DefiniteNP<femme>; // "la femme"
type lHomme = DefiniteNP<homme>; // "l'homme"
type unChat = IndefiniteNP<chat>; // "un chat"
type lesChats = DefiniteNP<chat, "p">; // "les chats"

// Adjective agreement.
type noir = Adjective<"noir">;
type noire = ConjugateAdjective<noir, "f">; // "noire"
type heureux = Adjective<"heureux">;
type heureuse = ConjugateAdjective<heureux, "f">; // "heureuse"

// Whole sentences.
type être = IrregularVerb<"être">;
type parler = ErVerb<"parl">;

// "Le chat est noir."
type S1 = Sentence<`${DefiniteNP<chat>} ${ConjugateVerb<être, "Present", "il">} ${ConjugateAdjective<noir, "m">}`>;
// "Je parle français." (built via SubjectVerb)
type S2 = Sentence<`${SubjectVerb<"je", parler>} français`>;
// "Il ne parle pas."
type S3 = Sentence<NegativeVerb<"il", parler>>;
// "Est-ce que tu parles français ?"
type S4 = Question<EstCeQue<Clause<"tu", parler>>>;

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;
type Expect<T extends true> = T;

type _t =
  | Expect<Equal<leChat, "le chat">>
  | Expect<Equal<laFemme, "la femme">>
  | Expect<Equal<lHomme, "l'homme">>
  | Expect<Equal<unChat, "un chat">>
  | Expect<Equal<lesChats, "les chats">>
  | Expect<Equal<noire, "noire">>
  | Expect<Equal<heureuse, "heureuse">>
  | Expect<Equal<S1, "Le chat est noir.">>
  | Expect<Equal<S3, "Il ne parle pas.">>;
