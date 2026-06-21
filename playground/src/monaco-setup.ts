/**
 * Self-host Monaco and its language workers via Vite instead of loading them
 * from a CDN. The CDN default (used by @monaco-editor/react out of the box)
 * loads the TypeScript web worker cross-origin, which silently fails in many
 * browsers — leaving a syntax-only editor with no real type checking. Bundling
 * the workers locally makes the editor genuinely run TypeScript everywhere.
 *
 * Import this module once, before the app renders.
 */
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

// Hand @monaco-editor/react our locally-bundled monaco instance.
loader.config({ monaco });

/* Editor themes tinted to the "Washi & Sumi" palette (see DESIGN.md / theme.css)
   so the code surface belongs to the same world as the rest of the app. The
   Analyzer picks "azur-light" / "azur-dark" based on the active app theme. */
monaco.editor.defineTheme("azur-light", {
  base: "vs",
  inherit: true,
  rules: [
    { token: "comment", foreground: "ab9fa4", fontStyle: "italic" },
    { token: "keyword", foreground: "a8456a" },
    { token: "string", foreground: "1a8f63" },
    { token: "number", foreground: "c97a0a" },
    { token: "type", foreground: "3a7bd5" },
    { token: "type.identifier", foreground: "3a7bd5" },
    { token: "identifier", foreground: "463c42" },
    { token: "delimiter", foreground: "7a6f74" },
  ],
  colors: {
    "editor.background": "#fffdfb",
    "editor.foreground": "#463c42",
    "editorLineNumber.foreground": "#c3b5bb",
    "editorLineNumber.activeForeground": "#a8456a",
    "editor.selectionBackground": "#fbe3ea",
    "editor.lineHighlightBackground": "#f7eef0",
    "editorCursor.foreground": "#c95b7a",
    "editorIndentGuide.background1": "#efe2e6",
    "editorWidget.background": "#fffdfb",
    "editorWidget.border": "#efe2e6",
  },
});

monaco.editor.defineTheme("azur-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "7c6f76", fontStyle: "italic" },
    { token: "keyword", foreground: "f4a8c0" },
    { token: "string", foreground: "5cc79a" },
    { token: "number", foreground: "e0a857" },
    { token: "type", foreground: "7aa9ec" },
    { token: "type.identifier", foreground: "7aa9ec" },
    { token: "identifier", foreground: "d8cdd2" },
    { token: "delimiter", foreground: "a99ca3" },
  ],
  colors: {
    "editor.background": "#1f1a22",
    "editor.foreground": "#d8cdd2",
    "editorLineNumber.foreground": "#5a4e57",
    "editorLineNumber.activeForeground": "#f4a8c0",
    "editor.selectionBackground": "#3a2a3a",
    "editor.lineHighlightBackground": "#2a232d",
    "editorCursor.foreground": "#ef93b1",
    "editorIndentGuide.background1": "#322a35",
    "editorWidget.background": "#1f1a22",
    "editorWidget.border": "#322a35",
  },
});

export { monaco };
