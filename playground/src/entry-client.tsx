import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./monaco-setup"; // self-host Monaco + workers before anything renders
import App from "./App";
import { RouteProvider } from "./context/route";
import { LangProvider } from "./context/lang";
import { ThemeProvider } from "./context/theme";
import "./theme.css";

const tree = (
  <React.StrictMode>
    <RouteProvider>
      <ThemeProvider>
        <LangProvider>
          <App />
        </LangProvider>
      </ThemeProvider>
    </RouteProvider>
  </React.StrictMode>
);

const root = document.getElementById("root")!;
// Production HTML is prerendered (has element children) → hydrate.
// Dev serves an empty shell → fresh render.
if (root.firstElementChild) {
  hydrateRoot(root, tree);
} else {
  createRoot(root).render(tree);
}
