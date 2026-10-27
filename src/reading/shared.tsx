import { ArrowUpLeft, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAtlas, useEntry } from "../atlas/context";
import type { Atlas, WordRef } from "../atlas/types";
import { play, stopAudio } from "../lib/audio";
import { openWord } from "../lib/router";
import { Sheet } from "../ui/Sheet";
import { toast } from "../ui/Toast";
import { emptyReadingCatalog, type ReadingCatalog } from "./types";

const dictionaries = new WeakMap<Atlas, Map<string, WordRef>>();
function dictionaryFor(atlas: Atlas) {
  let dictionary = dictionaries.get(atlas);
  if (!dictionary) {
    dictionary = new Map(
      atlas.words.map((word) => [word.word.toLocaleLowerCase("en"), word]),
    );
    dictionaries.set(atlas, dictionary);
  }
  return dictionary;
}

export function useReadingCatalog() {
  const atlas = useAtlas();
  return (
    (atlas as Atlas & { readings?: ReadingCatalog }).readings ??
    emptyReadingCatalog
  );
}

export function DeviceSpeak({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);
  const mounted = useRef(false);
  const playback = useRef(0);
  const available =
    typeof window !== "undefined" && "speechSynthesis" in window;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      playback.current++;
      stopAudio();
    };
  }, []);
  return (
    <button
      className={`icon-btn ${playing ? "is-playing" : ""}`}
      disabled={!available}
      aria-label={playing ? "توقف صدا" : `شنیدن با صدای دستگاه: ${text}`}
      title={
        available ? "صدای دستگاه" : "صدای دستگاه در این مرورگر در دسترس نیست"
      }
      onClick={() => {
        const run = ++playback.current;
        if (playing) {
          stopAudio();
          setPlaying(false);
          return;
        }
        setPlaying(true);
        void play(null, text)
          .then(
            (result) => {
              if (
                mounted.current &&
                playback.current === run &&
                result === "unsupported"
              )
                toast("صدای دستگاه در این مرورگر پخش نشد.", "warn");
            },
            () => {
              if (mounted.current && playback.current === run)
                toast("پخش صدا ممکن نشد؛ دوباره تلاش کنید.", "warn");
            },
          )
          .finally(() => {
            if (mounted.current && playback.current === run) setPlaying(false);
          });
      }}
    >
      <Volume2 size={18} />
    </button>
  );
}

export function LookupText({ text }: { text: string }) {
  const atlas = useAtlas();
  const [selected, setSelected] = useState<WordRef | null>(null);
  const dictionary = useMemo(() => dictionaryFor(atlas), [atlas]);
  const tokens = text.split(/([A-Za-z]+(?:['’][A-Za-z]+)?(?:-[A-Za-z]+)*)/);
  return (
    <>
      <span dir="ltr" lang="en">
        {tokens.map((token, index) => {
          const lower = token.toLocaleLowerCase("en");
          const ref =
            dictionary.get(lower) ??
            (lower.endsWith("s")
              ? dictionary.get(lower.slice(0, -1))
              : undefined);
          return ref ? (
            <button
              type="button"
              className="reading-word"
              key={index}
              onClick={() => setSelected(ref)}
              aria-label={`معنی ${token}`}
            >
              {token}
            </button>
          ) : (
            <span key={index}>{token}</span>
          );
        })}
      </span>
      <LookupPanel word={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function LookupPanel({
  word,
  onClose,
}: {
  word: WordRef | null;
  onClose: () => void;
}) {
  const { entry, error } = useEntry(word?.id);
  return (
    <Sheet
      open={!!word}
      onClose={onClose}
      label={word ? `معنی ${word.word}` : "معنی واژه"}
      className="reading-lookup"
    >
      {word && (
        <>
          <div className="reading-lookup-heading">
            <h2 lang="en" dir="ltr">
              {word.word}
            </h2>
            <DeviceSpeak text={word.word} />
          </div>
          <p className="muted" lang="en" dir="ltr">
            {word.ipa}
          </p>
          {entry ? (
            <ul className="reading-lookup-senses">
              {entry.senses.map((sense, index) => (
                <li key={index}>
                  <span lang="en" dir="ltr">
                    {sense.pos}
                  </span>{" "}
                  {sense.fa}
                </li>
              ))}
            </ul>
          ) : (
            <p>{error || word.fa}</p>
          )}
          <button
            className="btn btn-primary"
            onClick={() => {
              onClose();
              openWord(word.id);
            }}
          >
            دیدن کارت کامل <ArrowUpLeft size={17} />
          </button>
        </>
      )}
    </Sheet>
  );
}

export function ReadingEmpty({
  label = "این بخش در حال آماده‌سازی است.",
}: {
  label?: string;
}) {
  return (
    <section className="panel reading-empty">
      <span className="reading-empty-star" aria-hidden="true">
        ✦
      </span>
      <h2>{label}</h2>
      <p className="muted">
        محتوای تازه پس از آماده‌سازی در همین‌جا منتشر می‌شود.
      </p>
      <a className="btn btn-primary" href="#/atlas">
        گشت‌وگذار در اطلس
      </a>
    </section>
  );
}

export function SaveNotice({ visible }: { visible: boolean }) {
  return visible ? (
    <p className="reading-save-error" role="status">
      <X size={16} /> ذخیره‌سازی مرورگر در دسترس نیست؛ پیش از بستن صفحه، فضای
      ذخیره‌سازی را بررسی کنید.
    </p>
  ) : null;
}
