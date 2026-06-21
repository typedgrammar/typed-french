/**
 * Raw text of the Typed French library's .d.ts files, imported as strings so
 * the Type Playground can register them as Monaco extra-libs. This is what lets
 * the in-browser TypeScript service actually resolve types like
 * `ConjugateVerb<IrregularVerb<"être">, "Present", "il">` to their string
 * literal results on hover.
 *
 * We rewrite the relative imports (`./verb-types`) to a virtual module path so
 * Monaco resolves them against the files we add.
 */
import sharedTypes from "../../../src/shared-types.d.ts?raw";
import nounTypes from "../../../src/noun-types.d.ts?raw";
import adjectiveTypes from "../../../src/adjective-types.d.ts?raw";
import pronounTypes from "../../../src/pronoun-types.d.ts?raw";
import verbTypes from "../../../src/verb-types.d.ts?raw";
import phraseTypes from "../../../src/phrase-types.d.ts?raw";

const ROOT = "file:///node_modules/typed-french";

export interface LibFile {
  /** Virtual URI Monaco uses to resolve the module. */
  path: string;
  contents: string;
}

export const LIB_FILES: ReadonlyArray<LibFile> = [
  { path: `${ROOT}/shared-types.d.ts`, contents: sharedTypes },
  { path: `${ROOT}/noun-types.d.ts`, contents: nounTypes },
  { path: `${ROOT}/adjective-types.d.ts`, contents: adjectiveTypes },
  { path: `${ROOT}/pronoun-types.d.ts`, contents: pronounTypes },
  { path: `${ROOT}/verb-types.d.ts`, contents: verbTypes },
  { path: `${ROOT}/phrase-types.d.ts`, contents: phraseTypes },
  {
    // Barrel that re-exports everything, importable as "typed-french".
    path: `${ROOT}/index.d.ts`,
    contents: [
      'export * from "./shared-types";',
      'export * from "./noun-types";',
      'export * from "./adjective-types";',
      'export * from "./pronoun-types";',
      'export * from "./verb-types";',
      'export * from "./phrase-types";',
    ].join("\n"),
  },
];

/** The import path users write in the playground editor. */
export const LIB_IMPORT = "typed-french";
