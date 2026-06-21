import type { Person } from "./verb-types";

/**
 * Subject pronouns and the mapping from the nine surface pronouns onto the six
 * conjugation persons (elle/on conjugate like il; elles like ils).
 */
export type SubjectPronoun =
  | "je"
  | "tu"
  | "il"
  | "elle"
  | "on"
  | "nous"
  | "vous"
  | "ils"
  | "elles";

/** Which conjugation person a subject pronoun (or `j'`) selects. */
export type PersonOf<P extends string> = P extends "je" | "j'"
  ? "je"
  : P extends "tu"
  ? "tu"
  : P extends "il" | "elle" | "on"
  ? "il"
  : P extends "nous"
  ? "nous"
  : P extends "vous"
  ? "vous"
  : P extends "ils" | "elles"
  ? "ils"
  : Extract<P, Person>;
