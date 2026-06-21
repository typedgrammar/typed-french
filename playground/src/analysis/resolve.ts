/**
 * Resolve the French value of each composition-tree node using the *real*
 * TypeScript type checker running in Monaco's worker.
 *
 * Trick: Monaco's `getQuickInfoAtPosition` only instantiates generics for a
 * symbol declaration, not for an arbitrary sub-expression. So for every unique
 * type fragment (e.g. `ConjugateVerb<IrregularVerb<"être">, "Present", "il">`)
 * we append a throwaway alias `type __TJ_n = <fragment>;` to a hidden analysis
 * model, then read the resolved type of `__TJ_n`. The worker reports it
 * instantiated — `type __TJ_n = "est"` — which is exactly the value we want.
 */
import type { monaco as Monaco } from "../monaco-setup";

type MonacoNS = typeof Monaco;

const ANALYSIS_URI = "file:///__tj_analysis.ts";

interface QuickInfo {
  displayParts?: Array<{ text: string }>;
}

/** Pull the resolved French out of a `type X = "…"` quick-info string. */
function extractStringLiteral(quickInfo: string): string | null {
  const eq = quickInfo.indexOf("=");
  if (eq < 0) return null;
  const rhs = quickInfo.slice(eq + 1).trim();
  const m = rhs.match(/^"([\s\S]*)"$/);
  return m ? m[1]! : null;
}

/**
 * @param monaco   the monaco namespace
 * @param userCode the editor's current source (defines the imports + aliases)
 * @param texts    unique type-expression fragments to evaluate
 * @returns map from fragment text → resolved French (or null if it isn't a
 *          plain string literal type, e.g. a verb object type)
 */
export async function resolveValues(
  monaco: MonacoNS,
  userCode: string,
  texts: string[]
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  if (texts.length === 0) return result;

  let src = userCode;
  const positions: number[] = [];
  texts.forEach((t, i) => {
    src += "\n";
    positions[i] = src.length + "type ".length; // offset of the identifier
    src += `type __TJ_${i} = ${t};`;
  });

  const uri = monaco.Uri.parse(ANALYSIS_URI);
  const existing = monaco.editor.getModel(uri);
  const model = existing ?? monaco.editor.createModel(src, "typescript", uri);
  if (existing) existing.setValue(src);

  try {
    const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
    const worker = await getWorker(model.uri);
    const fileName = model.uri.toString();

    await Promise.all(
      texts.map(async (t, i) => {
        const pos = positions[i]!;
        let info = (await worker.getQuickInfoAtPosition(fileName, pos)) as
          | QuickInfo
          | undefined;
        // The worker can lag right after a model edit; retry once.
        if (!info) {
          await new Promise((r) => setTimeout(r, 60));
          info = (await worker.getQuickInfoAtPosition(fileName, pos)) as
            | QuickInfo
            | undefined;
        }
        const text = info?.displayParts?.map((p) => p.text).join("") ?? "";
        result.set(t, extractStringLiteral(text));
      })
    );
  } finally {
    model.dispose();
  }

  return result;
}
