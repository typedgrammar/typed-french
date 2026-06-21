/**
 * AI-generated playground snippets, kept separate from the hand-curated SNIPPETS
 * in ./examples.ts. Entries are appended by the annotate workflow:
 *
 *   cd playground && bun run annotate "<phrase française>"
 *
 * Each entry has been verified to type-check against the library AND to have its
 * last `type` alias resolve to exactly its `jp` sentence. The data lives in the
 * sibling examples.generated.json (the script's store); this module just types
 * and re-exports it. Don't edit the JSON by hand — re-run annotate instead.
 */
import type { Snippet } from "./examples";
import data from "./examples.generated.json";

export const GENERATED_SNIPPETS = data as ReadonlyArray<Snippet>;
