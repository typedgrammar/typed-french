import { lazy, Suspense, useState } from "react";
import { SNIPPETS } from "../data/examples";
import { GENERATED_SNIPPETS } from "../data/examples.generated";
import { EVAL_PRESETS } from "../data/eval-presets";

// Monaco (and the whole Analyzer) is client-only and heavy — load it lazily so
// it is never pulled into the server prerender.
const Analyzer = lazy(() => import("./Analyzer"));

// Hand-curated examples, then AI-generated ones (appended by `bun run annotate`),
// then the hard-eval presets — sentences the real codex pipeline parsed in the
// hard eval (see scripts/eval-codex.mjs). All index into one flat list.
const ALL = [...SNIPPETS, ...GENERATED_SNIPPETS, ...EVAL_PRESETS];
const CURATED_COUNT = SNIPPETS.length;
const GENERATED_END = SNIPPETS.length + GENERATED_SNIPPETS.length;

export default function Playground() {
  const [index, setIndex] = useState(0);
  const active = ALL[index] ?? ALL[0]!;

  const chip = (start: number, end: number) =>
    ALL.slice(start, end).map((s, i) => {
      const real = start + i;
      return (
        <button
          key={s.id}
          type="button"
          className={`tj-chip cursor-pointer border border-border ${real === index ? "bg-azur-500 text-on-accent border-azur-500" : ""}`}
          onClick={() => setIndex(real)}
          title={s.fr}
        >
          {s.title}
        </button>
      );
    });

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="tj-label">Examples</span>
        <div className="flex gap-[7px] flex-wrap">{chip(0, CURATED_COUNT)}</div>
      </div>

      {GENERATED_SNIPPETS.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="tj-label">✨ Generated</span>
          <div className="flex gap-[7px] flex-wrap">
            {chip(CURATED_COUNT, GENERATED_END)}
          </div>
        </div>
      )}

      {EVAL_PRESETS.length > 0 && (
        <div className="flex items-start gap-3 flex-wrap">
          <span className="tj-label" title="Hard sentences parsed by the real codex annotate pipeline — see the Eval tab">
            Eval (hard)
          </span>
          <div className="flex gap-[7px] flex-wrap">
            {chip(GENERATED_END, ALL.length)}
          </div>
        </div>
      )}

      <Suspense
        fallback={<p className="tj-subtle">Loading the analyzer…</p>}
      >
        <Analyzer code={active.code} gloss={active.en} />
      </Suspense>

      <p className="tj-subtle text-center m-0">
        Edit the code — the structure re-parses live. Click any node to highlight
        the source it came from. Every value is computed by the TypeScript
        compiler running in your browser.
      </p>
    </div>
  );
}
