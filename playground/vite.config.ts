import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The library's type-definition files live one level up in ../src.
// We import them as raw strings (see data/libSources.ts) so Monaco can load
// them as extra libs and type-check real Typed French code in the browser.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Absolute base (not "./") so prerendered pages in nested directories
  // (e.g. /en/course/e01/) resolve hashed assets correctly. Override via
  // VITE_BASE for a different mount point (e.g. the future /learn/french/).
  base: process.env.VITE_BASE ?? "/typed-french/",
  server: {
    fs: {
      // Allow importing the .d.ts sources from the parent package.
      allow: [".."],
    },
  },
});
