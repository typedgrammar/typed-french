/**
 * French verb conjugation, resolved entirely in the type system. A regular verb
 * is a stem plus a group tag (-er / -ir / -re); the surface form is the stem
 * concatenated with an ending looked up by (group, tense, person). Irregular
 * verbs short-circuit to a hand-written table keyed by their infinitive.
 *
 *   ConjugateVerb<ErVerb<"parl">, "Present", "nous">  // "parlons"
 *   ConjugateVerb<IrregularVerb<"être">, "Present", "il">  // "est"
 */

/** Grammatical person. `il` also serves elle/on; `ils` also serves elles. */
export type Person = "je" | "tu" | "il" | "nous" | "vous" | "ils";

/** Tenses / moods we resolve. PasséComposé picks its own auxiliary per verb. */
export type Tense =
  | "Present" // présent
  | "Imparfait" // imparfait
  | "FuturSimple" // futur simple
  | "Conditionnel" // conditionnel présent
  | "Subjonctif" // subjonctif présent
  | "PasseCompose" // passé composé
  | "Imperatif" // impératif (tu / nous / vous only)
  | "Infinitif" // infinitif
  | "PastParticiple"; // participe passé

// ---- verb shapes ------------------------------------------------------------

/** 1st group: infinitive in -er (parler → stem "parl"). The vast majority. */
export type ErVerb<S extends string = string> = { type: "er"; stem: S };
/** 2nd group: regular -ir with -iss- (finir → stem "fin"). */
export type IrVerb<S extends string = string> = { type: "ir"; stem: S };
/** 3rd group, regular -re (vendre → stem "vend"). */
export type ReVerb<S extends string = string> = { type: "re"; stem: S };
/** Irregular verb, resolved from {@link IrregularMap} by infinitive. */
export type IrregularVerb<Inf extends string = string> = {
  type: "irregular";
  infinitive: Inf;
};

export type RegularVerb = ErVerb | IrVerb | ReVerb;
export type Verb = RegularVerb | IrregularVerb;
type Group = "er" | "ir" | "re";

// ---- regular ending tables --------------------------------------------------

type PresentEnd = {
  er: { je: "e"; tu: "es"; il: "e"; nous: "ons"; vous: "ez"; ils: "ent" };
  ir: { je: "is"; tu: "is"; il: "it"; nous: "issons"; vous: "issez"; ils: "issent" };
  re: { je: "s"; tu: "s"; il: ""; nous: "ons"; vous: "ez"; ils: "ent" };
};
// Imparfait & conditionnel share these endings (different stems).
type AisEnd = { je: "ais"; tu: "ais"; il: "ait"; nous: "ions"; vous: "iez"; ils: "aient" };
type FuturEnd = { je: "ai"; tu: "as"; il: "a"; nous: "ons"; vous: "ez"; ils: "ont" };
type SubjEnd = { je: "e"; tu: "es"; il: "e"; nous: "ions"; vous: "iez"; ils: "ent" };
type AvoirPresent = { je: "ai"; tu: "as"; il: "a"; nous: "avons"; vous: "avez"; ils: "ont" };

// imparfait/subjonctif stem: -ir verbs carry -iss-; futur stem keeps the
// infinitive (minus the final -e for -re verbs).
type ImpStem<G extends Group, S extends string> = G extends "ir" ? `${S}iss` : S;
type FutStem<G extends Group, S extends string> = G extends "er"
  ? `${S}er`
  : G extends "ir"
  ? `${S}ir`
  : `${S}r`;
type PastPart<G extends Group, S extends string> = G extends "er"
  ? `${S}é`
  : G extends "ir"
  ? `${S}i`
  : `${S}u`;
type Inf<G extends Group, S extends string> = G extends "er"
  ? `${S}er`
  : G extends "ir"
  ? `${S}ir`
  : `${S}re`;

type RegularConjugate<
  G extends Group,
  S extends string,
  T extends Tense,
  P extends Person
> = T extends "Infinitif"
  ? Inf<G, S>
  : T extends "PastParticiple"
  ? PastPart<G, S>
  : T extends "Present"
  ? `${S}${PresentEnd[G][P]}`
  : T extends "Imparfait"
  ? `${ImpStem<G, S>}${AisEnd[P]}`
  : T extends "FuturSimple"
  ? `${FutStem<G, S>}${FuturEnd[P]}`
  : T extends "Conditionnel"
  ? `${FutStem<G, S>}${AisEnd[P]}`
  : T extends "Subjonctif"
  ? `${ImpStem<G, S>}${SubjEnd[P]}`
  : T extends "PasseCompose"
  ? `${AvoirPresent[P]} ${PastPart<G, S>}`
  : T extends "Imperatif"
  ? P extends "tu"
    ? `${S}${G extends "er" ? "e" : G extends "ir" ? "is" : "s"}`
    : P extends "nous"
    ? `${S}${PresentEnd[G]["nous"]}`
    : P extends "vous"
    ? `${S}${PresentEnd[G]["vous"]}`
    : never
  : never;

// ---- irregular table --------------------------------------------------------
// Hand-written surfaces for the high-frequency irregular verbs. être & avoir
// (the auxiliaries), aller & faire are complete across tenses; the rest cover
// the présent + compound forms a beginner course needs.

type Six<A, B, C, D, E, F> = { je: A; tu: B; il: C; nous: D; vous: E; ils: F };

interface IrregularMap {
  être: {
    Present: Six<"suis", "es", "est", "sommes", "êtes", "sont">;
    Imparfait: Six<"étais", "étais", "était", "étions", "étiez", "étaient">;
    FuturSimple: Six<"serai", "seras", "sera", "serons", "serez", "seront">;
    Conditionnel: Six<"serais", "serais", "serait", "serions", "seriez", "seraient">;
    Subjonctif: Six<"sois", "sois", "soit", "soyons", "soyez", "soient">;
    PasseCompose: Six<"ai été", "as été", "a été", "avons été", "avez été", "ont été">;
    Imperatif: Six<never, "sois", never, "soyons", "soyez", never>;
    Infinitif: Six<"être", "être", "être", "être", "être", "être">;
    PastParticiple: Six<"été", "été", "été", "été", "été", "été">;
  };
  avoir: {
    Present: Six<"ai", "as", "a", "avons", "avez", "ont">;
    Imparfait: Six<"avais", "avais", "avait", "avions", "aviez", "avaient">;
    FuturSimple: Six<"aurai", "auras", "aura", "aurons", "aurez", "auront">;
    Conditionnel: Six<"aurais", "aurais", "aurait", "aurions", "auriez", "auraient">;
    Subjonctif: Six<"aie", "aies", "ait", "ayons", "ayez", "aient">;
    PasseCompose: Six<"ai eu", "as eu", "a eu", "avons eu", "avez eu", "ont eu">;
    Imperatif: Six<never, "aie", never, "ayons", "ayez", never>;
    Infinitif: Six<"avoir", "avoir", "avoir", "avoir", "avoir", "avoir">;
    PastParticiple: Six<"eu", "eu", "eu", "eu", "eu", "eu">;
  };
  aller: {
    Present: Six<"vais", "vas", "va", "allons", "allez", "vont">;
    Imparfait: Six<"allais", "allais", "allait", "allions", "alliez", "allaient">;
    FuturSimple: Six<"irai", "iras", "ira", "irons", "irez", "iront">;
    Conditionnel: Six<"irais", "irais", "irait", "irions", "iriez", "iraient">;
    Subjonctif: Six<"aille", "ailles", "aille", "allions", "alliez", "aillent">;
    // aller takes être as its auxiliary (agreement shown in the masculine).
    PasseCompose: Six<"suis allé", "es allé", "est allé", "sommes allés", "êtes allés", "sont allés">;
    Imperatif: Six<never, "va", never, "allons", "allez", never>;
    Infinitif: Six<"aller", "aller", "aller", "aller", "aller", "aller">;
    PastParticiple: Six<"allé", "allé", "allé", "allé", "allé", "allé">;
  };
  faire: {
    Present: Six<"fais", "fais", "fait", "faisons", "faites", "font">;
    Imparfait: Six<"faisais", "faisais", "faisait", "faisions", "faisiez", "faisaient">;
    FuturSimple: Six<"ferai", "feras", "fera", "ferons", "ferez", "feront">;
    Conditionnel: Six<"ferais", "ferais", "ferait", "ferions", "feriez", "feraient">;
    Subjonctif: Six<"fasse", "fasses", "fasse", "fassions", "fassiez", "fassent">;
    PasseCompose: Six<"ai fait", "as fait", "a fait", "avons fait", "avez fait", "ont fait">;
    Imperatif: Six<never, "fais", never, "faisons", "faites", never>;
    Infinitif: Six<"faire", "faire", "faire", "faire", "faire", "faire">;
    PastParticiple: Six<"fait", "fait", "fait", "fait", "fait", "fait">;
  };
  venir: {
    Present: Six<"viens", "viens", "vient", "venons", "venez", "viennent">;
    PasseCompose: Six<"suis venu", "es venu", "est venu", "sommes venus", "êtes venus", "sont venus">;
    Infinitif: Six<"venir", "venir", "venir", "venir", "venir", "venir">;
    PastParticiple: Six<"venu", "venu", "venu", "venu", "venu", "venu">;
  };
  pouvoir: {
    Present: Six<"peux", "peux", "peut", "pouvons", "pouvez", "peuvent">;
    PasseCompose: Six<"ai pu", "as pu", "a pu", "avons pu", "avez pu", "ont pu">;
    Infinitif: Six<"pouvoir", "pouvoir", "pouvoir", "pouvoir", "pouvoir", "pouvoir">;
    PastParticiple: Six<"pu", "pu", "pu", "pu", "pu", "pu">;
  };
  vouloir: {
    Present: Six<"veux", "veux", "veut", "voulons", "voulez", "veulent">;
    PasseCompose: Six<"ai voulu", "as voulu", "a voulu", "avons voulu", "avez voulu", "ont voulu">;
    Infinitif: Six<"vouloir", "vouloir", "vouloir", "vouloir", "vouloir", "vouloir">;
    PastParticiple: Six<"voulu", "voulu", "voulu", "voulu", "voulu", "voulu">;
  };
  prendre: {
    Present: Six<"prends", "prends", "prend", "prenons", "prenez", "prennent">;
    PasseCompose: Six<"ai pris", "as pris", "a pris", "avons pris", "avez pris", "ont pris">;
    Infinitif: Six<"prendre", "prendre", "prendre", "prendre", "prendre", "prendre">;
    PastParticiple: Six<"pris", "pris", "pris", "pris", "pris", "pris">;
  };
  voir: {
    Present: Six<"vois", "vois", "voit", "voyons", "voyez", "voient">;
    PasseCompose: Six<"ai vu", "as vu", "a vu", "avons vu", "avez vu", "ont vu">;
    Infinitif: Six<"voir", "voir", "voir", "voir", "voir", "voir">;
    PastParticiple: Six<"vu", "vu", "vu", "vu", "vu", "vu">;
  };
  dire: {
    Present: Six<"dis", "dis", "dit", "disons", "dites", "disent">;
    PasseCompose: Six<"ai dit", "as dit", "a dit", "avons dit", "avez dit", "ont dit">;
    Infinitif: Six<"dire", "dire", "dire", "dire", "dire", "dire">;
    PastParticiple: Six<"dit", "dit", "dit", "dit", "dit", "dit">;
  };
}

type IrregularConjugate<
  Inf extends string,
  T extends Tense,
  P extends Person
> = Inf extends keyof IrregularMap
  ? T extends keyof IrregularMap[Inf]
    ? P extends keyof IrregularMap[Inf][T]
      ? IrregularMap[Inf][T][P] extends string
        ? IrregularMap[Inf][T][P]
        : never
      : never
    : never
  : never;

/** Resolve any verb to its surface for a tense and person (default 3rd sing). */
export type ConjugateVerb<
  V extends Verb,
  T extends Tense,
  P extends Person = "il"
> = V extends IrregularVerb<infer Inf>
  ? IrregularConjugate<Inf, T, P>
  : V extends { type: infer G extends Group; stem: infer S extends string }
  ? RegularConjugate<G, S, T, P>
  : never;
