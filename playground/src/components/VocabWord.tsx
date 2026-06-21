import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { lookup } from "../vocab/dictionary";
import { POS_LABEL, GENDER_LABEL } from "../vocab/types";
import { useLang } from "../context/lang";

type Variant = "chip" | "plain";

interface Props {
  word: string;
  /** override the displayed surface (e.g. an inflected form); lookup still uses `word` */
  display?: string;
  variant?: Variant;
}

export default function VocabWord({ word, display, variant = "chip" }: Props) {
  const { lang, t } = useLang();
  const entry = lookup(word);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = display ?? word;
  if (!entry) {
    // No dictionary entry — render as inert text.
    return <span className={variant === "chip" ? "text-ink-500" : ""}>{label}</span>;
  }

  const toggle = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: r.left });
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={
          variant === "chip"
            ? "inline-flex flex-col items-start gap-0 leading-[1.15] px-[9px] py-1 border border-border rounded-field bg-surface cursor-pointer transition-[border-color,background] duration-[120ms] hover:border-azur-400 hover:bg-surface-2"
            : "border-none bg-transparent p-0 cursor-pointer text-inherit font-[inherit] border-b border-dotted border-border-strong hover:text-azur-600 hover:border-azur-400"
        }
        onClick={toggle}
        aria-expanded={open}
      >
        <span className="fr text-[0.95rem] font-bold text-ink-900">{label}</span>
        {variant === "chip" && entry.ipa && <span className="fr text-[0.68rem] text-ink-500">{entry.ipa}</span>}
      </button>

      {open &&
        pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
            <div
              className="fixed z-[61] min-w-[200px] max-w-[280px] bg-surface border border-border-strong rounded-card shadow-pop py-3 px-3.5"
              style={{ top: pos.top, left: pos.left }}
            >
              <div className="flex items-baseline gap-[9px]">
                <span className="fr text-[1.3rem] font-extrabold text-ink-900">{entry.word}</span>
                {entry.ipa && <span className="fr text-[0.95rem] text-azur-600 font-bold">{entry.ipa}</span>}
              </div>
              <div className="flex items-center gap-2 mt-1 mb-2">
                {entry.gender && <span className="italic text-[0.8rem] text-ink-500">{GENDER_LABEL[entry.gender].abbr}</span>}
                <span className="text-[0.68rem] font-bold text-azur-600 bg-surface-2 border border-border px-[7px] py-px rounded-full">
                  {t(POS_LABEL[entry.pos].en, POS_LABEL[entry.pos].zh)}
                </span>
              </div>
              <p className="m-0 text-[0.92rem] text-ink-900">{lang === "zh" ? entry.zh : entry.en}</p>
              <p className="mt-[3px] text-[0.82rem] text-ink-500">{lang === "zh" ? entry.en : entry.zh}</p>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
