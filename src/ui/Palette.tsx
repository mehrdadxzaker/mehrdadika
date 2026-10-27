import { uiIntlLocale } from "../i18n/locale";
import { CornerDownLeft, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Atlas, WordRef } from "../atlas/types";
import { useAtlas } from "../atlas/context";
import { normalizeSearch } from "../i18n";
import { openWord } from "../lib/router";
import { Illustration } from "./Illustration";

export function searchAtlas(atlas: Atlas, raw: string, limit = 40): WordRef[] {
  const q = normalizeSearch(raw);
  if (!q) return [];
  const compact = q.replace(/\s/g, "");
  const hits: [number, WordRef][] = [];
  for (const word of atlas.words) {
    const head = normalizeSearch(word.word);
    const fa = normalizeSearch(word.fa);
    const entry = atlas.peek(word.id);
    const aliases =
      (entry as typeof entry & { aliases?: string[] })?.aliases ?? [];
    const terms = [...aliases, ...(entry?.senses.map((s) => s.fa) ?? [])].map(
      normalizeSearch,
    );
    let score =
      head === q
        ? 1000
        : head.startsWith(q)
          ? 500 - head.length
          : head.includes(q)
            ? 200 - head.indexOf(q)
            : 0;
    if (fa.includes(q)) score = Math.max(score, 300 - fa.indexOf(q));
    else if (fa.replace(/\s/g, "").includes(compact))
      score = Math.max(score, 240);
    for (const term of terms) {
      if (term.includes(q))
        score = Math.max(score, term === q ? 600 : 280 - term.indexOf(q));
      else if (term.replace(/\s/g, "").includes(compact))
        score = Math.max(score, 240);
    }
    if (score > 0) hits.push([score, word]);
  }
  hits.sort((a, b) => b[0] - a[0] || a[1].order - b[1].order);
  return hits.slice(0, limit).map((hit) => hit[1]);
}

export function Palette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const atlas = useAtlas();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchAtlas(atlas, q, 30), [atlas, q]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    setQ("");
    setSel(0);
    const frame = requestAnimationFrame(() => input.current?.focus());
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = input.current
        ?.closest(".palette")
        ?.querySelectorAll<HTMLElement>("input,button:not([disabled])");
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", trap);
      previous?.focus({ preventScroll: true });
    };
  }, [open]);
  useEffect(() => setSel(0), [q]);
  if (!open) return null;
  const pick = (w: WordRef) => {
    onClose();
    openWord(w.id);
  };
  return (
    <div
      className="palette-root"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="جست‌وجوی واژه"
      >
        <label className="palette-input">
          <Search size={20} />
          <input
            ref={input}
            value={q}
            placeholder="جست‌وجو به فارسی یا انگلیسی؛ مثلاً recipe یا دستور غذا"
            dir="auto"
            role="combobox"
            aria-expanded="true"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((s) => Math.min(results.length - 1, s + 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((s) => Math.max(0, s - 1));
              }
              if (e.key === "Enter" && results[sel]) pick(results[sel]);
            }}
            aria-controls="palette-list"
            aria-activedescendant={
              results[sel] ? `pal-${results[sel].id}` : undefined
            }
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="بستن جست‌وجو"
          >
            <X size={18} />
          </button>
          <kbd>Esc</kbd>
        </label>
        <ul id="palette-list" className="palette-list" role="listbox">
          {results.map((w, i) => (
            <li
              key={w.id}
              id={`pal-${w.id}`}
              role="option"
              aria-selected={i === sel}
              className={i === sel ? "is-sel" : ""}
              onMouseEnter={() => setSel(i)}
              onClick={() => pick(w)}
            >
              <Illustration
                src={atlas.img(w, "thumb")}
                word={w.word}
                topic={w.topic}
                className="palette-thumb"
              />
              <span className="palette-word" lang="en" dir="ltr">
                {w.word}
              </span>
              <span className="palette-fa">{w.fa}</span>
              {i === sel && (
                <CornerDownLeft size={15} className="palette-enter" />
              )}
            </li>
          ))}
          {q && !results.length && (
            <li className="palette-empty">برای «{q}» واژه‌ای پیدا نشد</li>
          )}
          {!q && (
            <li className="palette-hint">
              {atlas.count.toLocaleString(uiIntlLocale())} واژه · جست‌وجوی انگلیسی،
              فارسی و معادل‌ها · <kbd>↑</kbd>
              <kbd>↓</kbd> انتخاب <kbd>↵</kbd> باز کردن
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
