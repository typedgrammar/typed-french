/**
 * Static-site generation. Runs after the client build (dist/) and the SSR build
 * (dist-server/entry-server.js). For every route returned by getRoutes() it:
 *   1. server-renders the React app to HTML,
 *   2. injects per-page <title>, meta, canonical, hreflang, Open Graph + JSON-LD,
 *   3. writes dist/<lang>/<section>/<sub>/index.html.
 * Then it emits sitemap.xml, robots.txt, and a 404.html SPA fallback.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const BASE = process.env.VITE_BASE || "/typed-french/";
const ORIGIN = process.env.SITE_ORIGIN || "https://typedgrammar.github.io";

const template = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
const { render, getRoutes } = await import(
  pathToFileURL(path.join(ROOT, "dist-server", "entry-server.js")).href
);

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function headFor(meta) {
  const ogType = meta.path.includes("/foundations/") ? "article" : "website";
  const tags = [
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${esc(meta.canonical)}" />`,
    ...meta.alternates.map(
      (a) =>
        `<link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}" />`
    ),
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(meta.canonical)}" />`,
    `<meta property="og:site_name" content="Typed French" />`,
    `<meta property="og:locale" content="${meta.lang === "zh" ? "zh_CN" : "en_US"}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<script type="application/ld+json">${JSON.stringify(meta.jsonld)}</script>`,
  ];
  return tags.join("\n    ");
}

function pageHtml(meta, appHtml) {
  return template
    .replace('<html lang="ja">', `<html lang="${meta.lang}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace("<!--app-head-->", headFor(meta))
    .replace("<!--app-html-->", appHtml);
}

const routes = getRoutes();
let written = 0;
for (const meta of routes) {
  const { html } = render(meta.path);
  const rel = meta.path.slice(BASE.length).replace(/\/$/, ""); // en/course/e01
  const dir = path.join(DIST, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), pageHtml(meta, html));
  written++;
}

// Root: serve the English course as the landing page, canonical → /en/course/.
const rootMeta = routes.find((r) => r.path === `${BASE}en/course/`);
if (rootMeta) {
  const { html } = render(rootMeta.path);
  fs.writeFileSync(path.join(DIST, "index.html"), pageHtml(rootMeta, html));
}

// sitemap.xml (with hreflang alternates per URL)
const urlEntries = routes
  .map((r) => {
    const links = r.alternates
      .filter((a) => a.hreflang !== "x-default")
      .map(
        (a) =>
          `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}" />`
      )
      .join("\n");
    return `  <url>\n    <loc>${esc(r.canonical)}</loc>\n${links}\n  </url>`;
  })
  .join("\n");
fs.writeFileSync(
  path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlEntries}\n</urlset>\n`
);

// robots.txt
fs.writeFileSync(
  path.join(DIST, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}${BASE}sitemap.xml\n`
);

// 404.html — GitHub Pages SPA fallback for any non-prerendered path; the client
// reads location and renders the right route.
fs.writeFileSync(
  path.join(DIST, "404.html"),
  template.replace("<!--app-head-->", "").replace("<!--app-html-->", "")
);

console.log(
  `Prerendered ${written} pages + index, sitemap.xml (${routes.length} URLs), robots.txt, 404.html.`
);
