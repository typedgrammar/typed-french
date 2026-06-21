/**
 * Path-based routing (History API). The URL is the single source of truth, so
 * every section, chapter/article, and the UI language is a real, crawlable URL
 * with Back/Forward support — which is what lets the site be prerendered to
 * static HTML per page for SEO.
 *
 * URL shape:  <base>/<lang>/<section>[/<sub>][/?ex=<anchor>]
 *   /en/course            /en/course/e01            /en/course/e01/?ex=ex-e01-…
 *   /zh/foundations       /zh/foundations/architecture
 *   /en/glossary          /en/playground
 *
 * `<base>` is Vite's BASE_URL (e.g. "/typed-japanese/"). The provider accepts an
 * `ssrPath` so the prerenderer can render any route on the server with no DOM.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Tab = "concepts" | "tutorial" | "glossary" | "playground" | "eval";
export type Lang = "en" | "zh";

export interface Route {
  tab: Tab;
  /** Foundations: selected article id. */
  article?: string;
  /** Course: selected chapter id. */
  chapter?: string;
  /** Course: an example anchor to scroll to (from a Glossary "used in" link). */
  ex?: string;
  /** UI language — also the first URL segment. */
  lang: Lang;
}

export type RoutePatch = Partial<Route>;

interface RouteCtx {
  route: Route;
  navigate: (patch: RoutePatch, opts?: { replace?: boolean }) => void;
}

const Ctx = createContext<RouteCtx | null>(null);
const BASE = import.meta.env.BASE_URL || "/";

const TAB_TO_SEG: Record<Tab, string> = {
  concepts: "foundations",
  tutorial: "course",
  glossary: "glossary",
  playground: "playground",
  eval: "eval",
};
const SEG_TO_TAB: Record<string, Tab> = {
  foundations: "concepts",
  course: "tutorial",
  glossary: "glossary",
  playground: "playground",
  eval: "eval",
};

export const LANGS: Lang[] = ["en", "zh"];

/**
 * Parse a full href (pathname[?search]) into a Route. Pure and deterministic
 * (no localStorage) so the server prerender and the client agree on hydration —
 * the language lives in the URL. A path with no language segment defaults to en.
 */
export function parseHref(href: string): Route {
  const [rawPath = "/", search = ""] = href.split("?");
  let p = rawPath;
  const baseNoSlash = BASE.replace(/\/$/, "");
  if (baseNoSlash && p.startsWith(baseNoSlash)) p = p.slice(baseNoSlash.length);
  const segs = p.split("/").filter(Boolean);

  let i = 0;
  let lang: Lang = "en";
  if (segs[0] === "en" || segs[0] === "zh") {
    lang = segs[0];
    i = 1;
  }
  const tab = SEG_TO_TAB[segs[i] ?? ""] ?? "tutorial";
  const sub = segs[i + 1];

  const route: Route = { tab, lang };
  if (tab === "concepts" && sub) route.article = decodeURIComponent(sub);
  if (tab === "tutorial" && sub) route.chapter = decodeURIComponent(sub);
  const ex = new URLSearchParams(search).get("ex");
  if (ex && tab === "tutorial") route.ex = ex;
  return route;
}

/** Canonical URL (with base + trailing slash) for a route. */
export function formatPath(r: Route): string {
  const segs = [r.lang, TAB_TO_SEG[r.tab]];
  if (r.tab === "concepts" && r.article) segs.push(encodeURIComponent(r.article));
  if (r.tab === "tutorial" && r.chapter) segs.push(encodeURIComponent(r.chapter));
  const qs = r.tab === "tutorial" && r.ex ? `?ex=${encodeURIComponent(r.ex)}` : "";
  return `${BASE}${segs.join("/")}/${qs}`;
}

export function RouteProvider({
  children,
  ssrPath,
}: {
  children: ReactNode;
  /** Render-target path on the server; client reads location instead. */
  ssrPath?: string;
}) {
  const [route, setRoute] = useState<Route>(() =>
    parseHref(
      ssrPath ??
        (typeof location !== "undefined"
          ? location.pathname + location.search
          : "/")
    )
  );
  const ref = useRef(route);
  ref.current = route;

  // Normalize the URL on first client load (e.g. "/" → "/en/course/") and keep
  // state in sync with Back/Forward.
  useEffect(() => {
    const canonical = formatPath(ref.current);
    if (location.pathname + location.search !== canonical) {
      history.replaceState(null, "", canonical);
    }
    const onPop = () =>
      setRoute(parseHref(location.pathname + location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback(
    (patch: RoutePatch, opts?: { replace?: boolean }) => {
      const prev = ref.current;
      const tabChanged = patch.tab !== undefined && patch.tab !== prev.tab;
      const next: Route = { ...prev, ...patch };
      if (tabChanged) {
        if (!("article" in patch)) next.article = undefined;
        if (!("chapter" in patch)) next.chapter = undefined;
        if (!("ex" in patch)) next.ex = undefined;
      }
      const url = formatPath(next);
      if (typeof window !== "undefined") {
        if (url === location.pathname + location.search) {
          setRoute(next);
        } else if (opts?.replace) {
          history.replaceState(null, "", url);
          setRoute(next);
        } else {
          history.pushState(null, "", url);
          setRoute(next);
        }
      } else {
        setRoute(next);
      }
    },
    []
  );

  return <Ctx.Provider value={{ route, navigate }}>{children}</Ctx.Provider>;
}

export function useRoute(): RouteCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRoute must be used within RouteProvider");
  return ctx;
}
