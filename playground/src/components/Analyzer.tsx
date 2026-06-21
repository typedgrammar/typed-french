import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import type { Monaco, OnMount } from "@monaco-editor/react";
import { LIB_FILES } from "../data/libSources";
import {
  analyze,
  buildTree,
  collectTexts,
  type AliasSummary,
  type CompositionNode,
} from "../analysis/parse";
import { resolveValues } from "../analysis/resolve";
import CompositionTree from "./CompositionTree";
import { useTheme } from "../context/theme";
import styles from "./Analyzer.module.css";

type StandaloneEditor = ReturnType<Monaco["editor"]["create"]>;
type Disposable = ReturnType<Monaco["editor"]["onDidChangeMarkers"]>;
type Decorations = ReturnType<StandaloneEditor["createDecorationsCollection"]>;

const MODEL_PATH = "file:///main.ts";

interface MonacoMarker {
  message: string;
  severity: number;
  startLineNumber: number;
}
interface MonacoUri {
  toString(): string;
}
interface Diag {
  message: string;
  line: number;
  isError: boolean;
}

interface Props {
  /** Self-contained Typed French source. Its last alias is visualised. */
  code: string;
  /** English/Chinese gloss shown beside the resolved sentence. */
  gloss?: string;
  /** Start with the TypeScript editor collapsed (still mounted, so the structure
   *  tree resolves) — used when the analyzer is shown read-only, e.g. the Eval
   *  modal where the parse tree is the focus. */
  defaultCodeCollapsed?: boolean;
}

function applyResolved(
  node: CompositionNode,
  map: Map<string, string | null>
): CompositionNode {
  return {
    ...node,
    resolved: map.get(node.text) ?? null,
    children: node.children.map((c) => applyResolved(c, map)),
  };
}

function findNode(node: CompositionNode, id: string): CompositionNode | null {
  if (node.id === id) return node;
  for (const c of node.children) {
    const hit = findNode(c, id);
    if (hit) return hit;
  }
  return null;
}

export default function Analyzer({ code, gloss, defaultCodeCollapsed = false }: Props) {
  const { theme } = useTheme();
  const [codeOpen, setCodeOpen] = useState(!defaultCodeCollapsed);
  const [aliases, setAliases] = useState<AliasSummary[]>([]);
  const [selectedAlias, setSelectedAlias] = useState<string | null>(null);
  const [tree, setTree] = useState<CompositionNode | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diag[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [ready, setReady] = useState(false);

  const editorRef = useRef<StandaloneEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const markerSubRef = useRef<Disposable | null>(null);
  const decorationsRef = useRef<Decorations | null>(null);
  const selectedAliasRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef(0);
  const loadedCodeRef = useRef<string>(code);

  const refreshDiagnostics = useCallback(() => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;
    const markers: MonacoMarker[] = monaco.editor.getModelMarkers({
      resource: model.uri,
    });
    setDiagnostics(
      markers
        .map((m) => ({
          message: m.message,
          line: m.startLineNumber,
          isError: m.severity === monaco.MarkerSeverity.Error,
        }))
        .sort((a, b) => a.line - b.line)
    );
  }, []);

  const runAnalysis = useCallback(async (forceDefault = false) => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;
    const token = ++tokenRef.current;
    const src = ed.getValue();

    const a = await analyze(src);
    if (token !== tokenRef.current) return;
    setAliases(a.aliases);

    const current = selectedAliasRef.current;
    const alias =
      !forceDefault && current && a.aliases.some((x) => x.name === current)
        ? current
        : a.defaultAlias;
    selectedAliasRef.current = alias;
    setSelectedAlias(alias);
    if (!alias) {
      setTree(null);
      return;
    }

    let built: CompositionNode | null = null;
    try {
      built = await buildTree(src, alias);
    } catch {
      built = null;
    }
    if (token !== tokenRef.current) return;
    if (!built) {
      setTree(null);
      return;
    }
    // Show the structure immediately. Value resolution runs through Monaco's TS
    // worker, which can lag or throw (especially on first load); it must never
    // blank the diagram — it only enriches each node with its resolved string.
    setTree(built);
    try {
      const texts = Array.from(collectTexts(built));
      const map = await resolveValues(monaco, src, texts);
      if (token !== tokenRef.current) return;
      setTree(applyResolved(built, map));
    } catch {
      /* keep the unresolved structure on screen */
    }
  }, []);

  const scheduleAnalysis = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runAnalysis(), 350);
  }, [runAnalysis]);

  const handleMount: OnMount = useCallback(
    (ed, monaco) => {
      editorRef.current = ed;
      monacoRef.current = monaco;
      decorationsRef.current = ed.createDecorationsCollection();

      const ts = monaco.languages.typescript;
      ts.typescriptDefaults.setCompilerOptions({
        target: ts.ScriptTarget.ES2020,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        module: ts.ModuleKind.ESNext,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        allowNonTsExtensions: true,
        skipLibCheck: true,
      });
      ts.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        diagnosticCodesToIgnore: [6133, 6196, 6192, 6198, 6205],
      });
      for (const f of LIB_FILES) ts.typescriptDefaults.addExtraLib(f.contents, f.path);

      markerSubRef.current?.dispose();
      markerSubRef.current = monaco.editor.onDidChangeMarkers(
        (uris: readonly MonacoUri[]) => {
          const model = ed.getModel();
          if (model && uris.some((u) => u.toString() === model.uri.toString())) {
            refreshDiagnostics();
          }
        }
      );

      setReady(true);
      void runAnalysis(true);
    },
    [refreshDiagnostics, runAnalysis]
  );

  // Load new external code (e.g. when a tutorial example is selected).
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    if (code === loadedCodeRef.current && ed.getValue() === code) return;
    loadedCodeRef.current = code;
    selectedAliasRef.current = null;
    setSelectedNodeId(null);
    decorationsRef.current?.clear();
    ed.setValue(code);
    void runAnalysis(true);
  }, [code, runAnalysis]);

  const pickAlias = useCallback(
    (name: string) => {
      selectedAliasRef.current = name;
      setSelectedAlias(name);
      setSelectedNodeId(null);
      decorationsRef.current?.clear();
      void runAnalysis();
    },
    [runAnalysis]
  );

  const handleSelectNode = useCallback((node: CompositionNode) => {
    setSelectedNodeId(node.id);
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    const model = ed?.getModel();
    if (!ed || !monaco || !model) return;
    const s = model.getPositionAt(node.start);
    const e = model.getPositionAt(node.end);
    const range = new monaco.Range(s.lineNumber, s.column, e.lineNumber, e.column);
    ed.revealRangeInCenterIfOutsideViewport(range);
    decorationsRef.current?.set([
      { range, options: { inlineClassName: styles.hl, className: styles.hlLine } },
    ]);
  }, []);

  const errorCount = useMemo(
    () => diagnostics.filter((d) => d.isError).length,
    [diagnostics]
  );
  const selectedNode = useMemo(
    () => (tree && selectedNodeId ? findNode(tree, selectedNodeId) : null),
    [tree, selectedNodeId]
  );

  useEffect(() => {
    if (!showWhitespace && selectedNode?.category === "whitespace") {
      setSelectedNodeId(null);
      decorationsRef.current?.clear();
    }
  }, [selectedNode, showWhitespace]);

  return (
    <div className="flex flex-col gap-4">
      {/* Sentence structure — visualization on top */}
      <section className="tj-card flex flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between gap-2.5 px-4 py-3 border-b border-border">
          <h2 className="tj-panel-title">Sentence structure</h2>
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            <label className="flex items-center gap-1.5 text-[0.78rem] font-bold text-ink-600 cursor-pointer select-none">
              <input
                type="checkbox"
                className="accent-azur-500"
                checked={showWhitespace}
                onChange={(e) => setShowWhitespace(e.target.checked)}
              />
              <span>Espaces</span>
            </label>
            {aliases.length > 1 && (
              <select
                className="tj-select w-auto max-w-[230px] px-2.5 py-[5px] font-fr text-[0.86rem]"
                value={selectedAlias ?? ""}
                onChange={(e) => pickAlias(e.target.value)}
                aria-label="Type to visualise"
              >
                {aliases.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-0.5 pt-3.5 px-4 pb-2">
          <span className="fr text-[1.7rem] font-extrabold text-azur-600 leading-[1.25]">
            {tree?.resolved ? `「${tree.resolved}」` : "—"}
          </span>
          {gloss && <span className="text-[0.84rem] text-ink-500">{gloss}</span>}
        </div>

        <div className="overflow-auto pt-1 px-3.5 pb-3.5 max-h-[460px]">
          {tree ? (
            <CompositionTree
              node={tree}
              selectedId={selectedNodeId}
              onSelect={handleSelectNode}
              showWhitespace={showWhitespace}
            />
          ) : (
            <p className="tj-subtle">
              Define a <code className="tj-code">type</code> alias whose value is a
              phrase, and its structure appears here.
            </p>
          )}
        </div>

        {selectedNode && (
          <div className="flex items-center gap-3 flex-wrap px-4 py-2.5 border-t border-border bg-surface-2">
            <code className="tj-code text-[0.78rem] max-w-full overflow-auto whitespace-nowrap">{selectedNode.text}</code>
            {selectedNode.resolved && (
              <span className="fr text-[1.05rem] font-bold text-azur-600 ml-auto">「{selectedNode.resolved}」</span>
            )}
          </div>
        )}
      </section>

      {/* TypeScript — code below (collapsible; the editor stays mounted even when
          collapsed so the structure tree above keeps resolving). */}
      <section className="tj-card flex flex-col overflow-hidden p-0">
        <button
          type="button"
          className="flex items-center justify-between gap-2.5 px-4 py-3 border-b border-border bg-transparent cursor-pointer text-left w-full"
          onClick={() => setCodeOpen((v) => !v)}
          aria-expanded={codeOpen}
        >
          <span className="flex items-center gap-2">
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-ink-300 transition-transform duration-150 ${codeOpen ? "rotate-90" : ""}`}
              aria-hidden="true"
            >
              <polyline points="9 6 15 12 9 18" />
            </svg>
            <span className="tj-panel-title">TypeScript</span>
          </span>
          {ready &&
            (errorCount === 0 ? (
              <span className="text-[0.74rem] font-bold px-2.5 py-[3px] rounded-full text-ok bg-ok-soft">✓ Type-checks</span>
            ) : (
              <span className="text-[0.74rem] font-bold px-2.5 py-[3px] rounded-full text-err bg-err-soft">
                {errorCount} error{errorCount === 1 ? "" : "s"}
              </span>
            ))}
        </button>
        <div style={{ height: codeOpen ? 420 : 0 }} className="overflow-hidden transition-[height] duration-200">
          <Editor
            className="h-full"
            theme={theme === "dark" ? "azur-dark" : "azur-light"}
            language="typescript"
            path={MODEL_PATH}
            defaultValue={code}
            onMount={handleMount}
            onChange={scheduleAnalysis}
            loading={<div className="p-5 text-ink-500 text-[0.9rem]">Loading TypeScript…</div>}
            options={{
              fontSize: 13.5,
              fontFamily: "var(--font-mono)",
              minimap: { enabled: false },
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              lineNumbersMinChars: 3,
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>
        {codeOpen && diagnostics.length > 0 && (
          <ul className="list-none m-0 px-3 py-2 max-h-[130px] overflow-auto border-t border-border bg-surface-2">
            {diagnostics.map((d, i) => (
              <li
                key={i}
                className={`flex gap-2 font-mono text-[0.76rem] py-0.5 ${d.isError ? "text-err" : "text-ink-700"}`}
              >
                <span className="flex-none opacity-70">L{d.line}</span>
                {d.message}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
