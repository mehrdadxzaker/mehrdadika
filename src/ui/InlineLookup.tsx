import { ArrowUpLeft, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useAtlas, useEntry } from "../atlas/context";
import type { Atlas, WordRef } from "../atlas/types";
import { openWord } from "../lib/router";
import { stopAudio } from "../lib/audio";
import { useStore } from "../store/store";
import { Speak } from "./Speak";
import {
  lookupTokens,
  matchLookupWord,
  normalizeLookupWord,
} from "./inline-lookup-model";
import "../styles/inline-lookup.css";

const lexicons = new WeakMap<Atlas, Map<string, WordRef>>();
function lexiconFor(atlas: Atlas) {
  let lexicon = lexicons.get(atlas);
  if (!lexicon) {
    lexicon = new Map(
      atlas.words.map((word) => [normalizeLookupWord(word.word), word]),
    );
    lexicons.set(atlas, lexicon);
  }
  return lexicon;
}

interface Selection {
  word: WordRef;
  anchor: HTMLButtonElement;
}
export function InlineLookupText({ text }: { text: string }) {
  const atlas = useAtlas();
  const accent = useStore((state) => state.settings.accent);
  const lexicon = useMemo(() => lexiconFor(atlas), [atlas]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 300,
    ready: false,
  });
  const popup = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const { entry } = useEntry(selection?.word.id);

  const close = useCallback(
    (restoreFocus = true) => {
      const anchor = selection?.anchor;
      if (selection) stopAudio();
      setSelection(null);
      if (restoreFocus && anchor?.isConnected)
        requestAnimationFrame(() => anchor.focus({ preventScroll: true }));
    },
    [selection],
  );

  useLayoutEffect(() => {
    if (!selection) return;
    const align = () => {
      const bounds = selection.anchor.getBoundingClientRect();
      if (
        !selection.anchor.isConnected ||
        bounds.bottom < 0 ||
        bounds.top > window.innerHeight
      ) {
        close(false);
        return;
      }
      const width = Math.min(300, Math.max(0, window.innerWidth - 24));
      const height = popup.current?.getBoundingClientRect().height || 220;
      const below = bounds.bottom + 10;
      const top =
        below + height <= window.innerHeight - 12
          ? below
          : Math.max(
              12,
              Math.min(
                bounds.top - height - 10,
                window.innerHeight - height - 12,
              ),
            );
      const left = Math.max(
        12,
        Math.min(
          bounds.left + bounds.width / 2 - width / 2,
          window.innerWidth - width - 12,
        ),
      );
      setPosition({ top, left, width, ready: true });
    };
    align();
    const frame = requestAnimationFrame(() => {
      align();
      closeButton.current?.focus({ preventScroll: true });
    });
    window.addEventListener("resize", align);
    window.addEventListener("scroll", align, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", align);
      window.removeEventListener("scroll", align, true);
    };
  }, [selection, close, entry]);

  useEffect(() => {
    if (!selection) return;
    const outside = (event: PointerEvent) => {
      const target = event.target;
      if (
        !(target instanceof Node) ||
        popup.current?.contains(target) ||
        selection.anchor.contains(target)
      )
        return;
      close(false);
    };
    document.addEventListener("pointerdown", outside, true);
    return () => document.removeEventListener("pointerdown", outside, true);
  }, [selection, close]);

  const renderPopup =
    selection && typeof document !== "undefined"
      ? createPortal(
          <div
            id={dialogId}
            ref={popup}
            className="inline-lookup-popup"
            role="dialog"
            aria-modal="false"
            aria-label={`معنی ${selection.word.word}`}
            dir="rtl"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              visibility: position.ready ? "visible" : "hidden",
            }}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Escape") {
                event.preventDefault();
                close();
                return;
              }
              if (event.key === "Tab") {
                const elements = popup.current?.querySelectorAll<HTMLElement>(
                  'button:not([disabled]),[href],[tabindex="0"]',
                );
                if (!elements?.length) {
                  event.preventDefault();
                  return;
                }
                const first = elements[0];
                const last = elements[elements.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <button
              className="icon-btn inline-lookup-close"
              ref={closeButton}
              onClick={() => close()}
              aria-label="بستن معنی واژه"
            >
              <X size={16} />
            </button>
            <h3 lang="en" dir="ltr">
              {selection.word.word}
            </h3>
            <div className="inline-lookup-pron">
              <span className="ipa" lang="en" dir="ltr">
                {accent === "us"
                  ? entry?.us || selection.word.ipa
                  : entry?.uk || selection.word.ipa}
              </span>
              <Speak
                size="sm"
                url={atlas.audio(selection.word, accent)}
                text={selection.word.word}
                accent={accent}
              />
            </div>
            <ul>
              {entry?.senses.length ? (
                entry.senses.slice(0, 3).map((sense, index) => (
                  <li key={index}>
                    <small lang="en" dir="ltr">
                      {sense.pos}
                    </small>{" "}
                    {sense.fa}
                  </li>
                ))
              ) : (
                <li>{selection.word.fa}</li>
              )}
            </ul>
            <button
              className="btn btn-ghost inline-lookup-full"
              onClick={() => {
                const id = selection.word.lexicalId ?? selection.word.id;
                close(false);
                openWord(id);
              }}
            >
              دیدن کارت کامل <ArrowUpLeft size={15} />
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {lookupTokens(text).map((token, index) => {
        const word = matchLookupWord(token, lexicon);
        return word ? (
          <button
            className="inline-lookup-token"
            type="button"
            key={index}
            aria-label={`معنی ${token}`}
            aria-haspopup="dialog"
            aria-expanded={
              selection?.anchor.dataset.lookupIndex === String(index)
            }
            aria-controls={
              selection?.anchor.dataset.lookupIndex === String(index)
                ? dialogId
                : undefined
            }
            data-lookup-index={index}
            onClick={(event) => {
              event.stopPropagation();
              if (selection?.anchor === event.currentTarget) {
                close();
                return;
              }
              setPosition((current) => ({ ...current, ready: false }));
              setSelection({ word, anchor: event.currentTarget });
            }}
          >
            {token}
          </button>
        ) : (
          <span key={index}>{token}</span>
        );
      })}
      {renderPopup}
    </>
  );
}
