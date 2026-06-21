import { useEffect, useState } from "react";

/**
 * FontLab — a dev-only floating panel for trying out tutorial fonts.
 *
 * It overrides three CSS custom properties live on :root:
 *   --font-ui      Latin + Chinese prose (the bulk of the explanation text)
 *   --font-fr      French example sentences / kana / kanji
 *   --font-heading the big titles (app title, chapter title, point title)
 *
 * Each preset bundles a coordinated CN + JP + heading stack so switching gives
 * a cohesive look rather than a Frankenstein mix. Mounted only when
 * import.meta.env.DEV is true, so production never loads the web fonts.
 */

type Preset = {
  id: string;
  name: string;
  note: string;
  /** swatch: a short French sample shown in --font-fr */
  ui: string;
  jp: string;
  heading: string;
};

const PRESETS: Preset[] = [
  {
    id: "default",
    name: "黑体 Gothic",
    note: "无衬线，技术文档感",
    ui: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    jp: '"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif',
    heading: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  {
    id: "system-mincho",
    name: "系统宋体／明朝",
    note: "macOS 自带，无需联网",
    ui: '"Songti SC", "STSong", "SimSun", serif',
    jp: '"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP", serif',
    heading: '"Songti SC", "Hiragino Mincho ProN", "Yu Mincho", serif',
  },
  {
    id: "noto-serif",
    name: "思源宋体 · Noto Serif",
    note: "CN/JP 协调的经典衬线",
    ui: '"Noto Serif SC", "Noto Serif JP", serif',
    jp: '"Noto Serif JP", "Noto Serif SC", serif',
    heading: '"Noto Serif JP", "Noto Serif SC", serif',
  },
  {
    id: "shippori",
    name: "しっぽり明朝 · Shippori",
    note: "纤细优雅的日系明朝",
    ui: '"Noto Serif SC", "Shippori Mincho", serif',
    jp: '"Shippori Mincho", "Noto Serif JP", serif',
    heading: '"Shippori Mincho", "Noto Serif SC", serif',
  },
  {
    id: "zen-old",
    name: "Zen Old Mincho",
    note: "沉静古典，留白感强",
    ui: '"Noto Serif SC", "Zen Old Mincho", serif',
    jp: '"Zen Old Mincho", "Noto Serif JP", serif',
    heading: '"Zen Old Mincho", "Noto Serif SC", serif',
  },
  {
    id: "lxgw",
    name: "霞鹜文楷 · LXGW WenKai",
    note: "当前默认 · 楷体，CN+JP 一体",
    ui: '"LXGW WenKai Screen", "Noto Serif SC", serif',
    jp: '"LXGW WenKai Screen", "Noto Serif JP", serif',
    heading: '"LXGW WenKai Screen", serif',
  },
  {
    id: "klee",
    name: "Klee One · 教科書体",
    note: "日本教科书手写感",
    ui: '"LXGW WenKai Screen", "Klee One", "Noto Serif SC", serif',
    jp: '"Klee One", "LXGW WenKai Screen", serif',
    heading: '"Klee One", "LXGW WenKai Screen", serif',
  },
  {
    id: "zen-maru",
    name: "Zen Maru Gothic · 圆体",
    note: "圆润亲切，仍属黑体",
    ui: '"Zen Maru Gothic", "PingFang SC", system-ui, sans-serif',
    jp: '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", sans-serif',
    heading: '"Zen Maru Gothic", sans-serif',
  },
];

// The default textbook fonts (Klee One, LXGW WenKai Screen, Noto Serif
// SC/JP) are already loaded in index.html. These are the *extra* families
// only this panel offers; injected lazily the first time the panel opens so
// they never weigh on normal page load. Google Fonts subsets CJK by
// unicode-range, so only the glyphs in view get downloaded.
const FONT_LINKS = [
  "https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&family=Shippori+Mincho:wght@400;600;700&family=Zen+Old+Mincho:wght@400;600;700&family=Zen+Maru+Gothic:wght@400;500;700&display=swap",
];

const STORAGE_KEY = "fontlab-preset";

function applyPreset(p: Preset) {
  const root = document.documentElement;
  root.style.setProperty("--font-ui", p.ui);
  root.style.setProperty("--font-fr", p.jp);
  root.style.setProperty("--font-heading", p.heading);
}

// The live default (see theme.css) is the LXGW WenKai stack — i.e. the
// "lxgw" preset. With no stored override that is what the page renders, and
// its webfont is loaded eagerly in index.html.
const DEFAULT_ID = "lxgw";

// Pull the extra preview fonts (everything except the eagerly-loaded
// default). Idempotent — the querySelector guard dedupes.
function injectFonts() {
  FONT_LINKS.forEach((href) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  });
}

export default function FontLab() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>(DEFAULT_ID);

  // Inject the preview fonts the first time the panel opens, so visitors who
  // never touch the switcher pay nothing for them.
  useEffect(() => {
    if (open) injectFonts();
  }, [open]);

  // Restore last choice — and load its font too, since the selection is
  // applied before the panel is ever opened.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const p = PRESETS.find((x) => x.id === saved);
    if (p) {
      if (p.id !== DEFAULT_ID) injectFonts();
      applyPreset(p);
      setActive(p.id);
    }
  }, []);

  function choose(p: Preset) {
    applyPreset(p);
    localStorage.setItem(STORAGE_KEY, p.id);
    setActive(p.id);
  }

  return (
    <>
      <button
        className="fixed right-[18px] bottom-[18px] z-[60] border border-border-strong bg-surface text-ink-700 text-[0.85rem] font-bold px-3.5 py-[9px] rounded-full shadow-pop cursor-pointer transition-[transform,color] duration-[120ms] hover:text-azur-600 hover:-translate-y-px"
        onClick={() => setOpen((o) => !o)}
        title="切换字体"
      >
        Aa 字体
      </button>

      {open && (
        <div className="fixed right-[18px] bottom-16 z-[60] w-[min(360px,calc(100vw-36px))] max-h-[min(72vh,680px)] flex flex-col bg-paper border border-border rounded-card shadow-drawer overflow-hidden">
          <div className="flex items-center gap-2 px-3.5 py-3 border-b border-border">
            <strong>切换字体</strong>
            <span className="text-[0.6rem] font-extrabold tracking-[0.08em] text-on-accent bg-azur-400 px-1.5 py-px rounded-[5px]">
              DEV
            </span>
            <button
              className="ml-auto border-none bg-transparent text-ink-500 text-[1.3rem] leading-none cursor-pointer px-1 py-0 hover:text-ink-900"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="overflow-y-auto p-2 flex flex-col gap-1.5">
            {PRESETS.map((p) => {
              const isActive = active === p.id;
              return (
                <button
                  key={p.id}
                  className={`flex flex-col gap-2 text-left px-3 py-2.5 border rounded-field cursor-pointer transition-[border-color,background] duration-[120ms] ${
                    isActive
                      ? "border-azur-400 bg-azur-50"
                      : "border-border bg-surface hover:border-border-strong"
                  }`}
                  onClick={() => choose(p)}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[0.85rem] font-bold text-ink-900">
                      {p.name}
                    </span>
                    <span className="text-[0.68rem] text-ink-500 flex-none">
                      {p.note}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[3px] pt-1.5 border-t border-dashed border-border">
                    <span
                      className="text-[1.05rem] font-bold text-ink-900"
                      style={{ fontFamily: p.heading }}
                    >
                      存在句：あります
                    </span>
                    <span
                      className="text-[0.86rem] text-ink-700"
                      style={{ fontFamily: p.ui }}
                    >
                      想象你身处一个陌生的街区，
                    </span>
                    <span
                      className="text-base text-azur-600"
                      style={{ fontFamily: p.jp }}
                    >
                      場所 に 事物 が あります。
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
