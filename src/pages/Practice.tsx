import { Headphones, Keyboard, RotateCcw, Type } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { prefetch, useLearningAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { play, stopAudio } from "../lib/audio";
import { cue } from "../lib/sound";
import { hashSeed, shuffle } from "../lib/text";
import {
  clean,
  correctCharacterCount,
  same,
  typingDelta,
  typingMetrics,
} from "../lib/typing";
import { store, useStore } from "../store/store";
import { AmbiencePicker } from "../ui/Ambience";
import { Illustration } from "../ui/Illustration";
import { CourseShelf } from "../courses/components";

type Mode = "word" | "sentence" | "dictation";
type Source = "recent" | "mistakes" | "saved" | "path";

const MODES: [Mode, string, string, typeof Type][] = [
  ["word", "واژه", "واژه را از روی تصویر بنویسید", Type],
  ["sentence", "جمله", "با رونویسی، روان‌تر تایپ کنید", Keyboard],
  ["dictation", "دیکته", "گوش کنید و جمله را بنویسید", Headphones],
];
const SOURCES: [Source, string][] = [
  ["recent", "تازه‌آموخته‌ها"],
  ["mistakes", "موارد دشوار"],
  ["saved", "نشان‌شده‌ها"],
  ["path", "مسیر یادگیری"],
];

export function Practice() {
  const atlas = useLearningAtlas();
  const progress = useStore((s) => s.progress);
  const startLevel = useStore((s) => s.settings.startLevel);
  const selectedTopic = useStore((s) => s.settings.topic);
  const [mode, setMode] = useState<Mode>("word");
  const [source, setSource] = useState<Source>(() =>
    Object.keys(progress.cards).length ? "recent" : "path",
  );
  const [round, setRound] = useState<{
    entries: Entry[];
    key: number;
    mode: Mode;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const request = useRef(0);
  const busy = useRef(false);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );

  const pool = useMemo(() => {
    const learned = Object.entries(progress.cards)
      .sort((a, b) => (b[1].last ?? 0) - (a[1].last ?? 0))
      .map(([id]) => id);
    const ids =
      source === "recent"
        ? learned
        : source === "mistakes"
          ? progress.mistakes
          : source === "saved"
            ? atlas.words
                .filter(
                  (w) =>
                    progress.bookmarks.includes(w.id) ||
                    progress.bookmarks.includes(w.lexicalId ?? w.id),
                )
                .map((w) => w.id)
            : atlas.words
                .filter(
                  (w) =>
                    w.cefr >= startLevel &&
                    (selectedTopic === "all" ||
                      w.domainIds?.includes(selectedTopic)),
                )
                .slice(0, 400)
                .map((w) => w.id);
    return ids.filter((id) => atlas.byId.has(id));
  }, [
    atlas,
    progress.cards,
    progress.mistakes,
    progress.bookmarks,
    source,
    startLevel,
    selectedTopic,
  ]);

  const start = async () => {
    if (busy.current) return;
    busy.current = true;
    const token = ++request.current;
    setLoading(true);
    setLoadError("");
    const ids = shuffle(pool.slice(0, 60), hashSeed(String(Date.now()))).slice(
      0,
      10,
    );
    const entries = (await prefetch(atlas, ids)).filter(
      (e): e is Entry => !!e && (mode === "word" || e.ex.length > 0),
    );
    if (token !== request.current) return;
    busy.current = false;
    setLoading(false);
    if (entries.length) setRound({ entries, key: Date.now(), mode });
    else
      setLoadError(
        "دریافت مطالب تمرین ممکن نشد. اتصال یا بستهٔ آفلاین را بررسی و دوباره تلاش کنید.",
      );
  };

  if (round)
    return (
      <TypingRound
        key={round.key}
        mode={round.mode}
        entries={round.entries}
        onExit={() => setRound(null)}
        onAgain={start}
      />
    );

  const best = progress.typing
    .filter((t) => t.mode === mode)
    .reduce((m, t) => Math.max(m, t.wpm), 0);
  return (
    <div className="page practice">
      <CourseShelf compact />
      <div className="special-practice">
        <a className="panel" href="#/paraphrase">
          <b>بازگویی و هم‌معنی‌ها</b>
          <span>یک معنا، چند بیان متفاوت ←</span>
        </a>
        <a className="panel" href="#/confuse">
          <b>واژه‌های شبیه، کاربردهای متفاوت</b>
          <span>مقایسه کنید، سپس خودتان را بسنجید ←</span>
        </a>
      </div>
      <header className="page-head">
        <p className="eyebrow">تمرین · نوشتن و شنیدن</p>
        <h1 className="display">با دست‌هایتان هم یاد بگیرید.</h1>
        <p className="lede">
          نتیجهٔ این تمرین جدا ثبت می‌شود و زمان مرور واژه‌ها را تغییر نمی‌دهد.
        </p>
      </header>
      <div className="practice-grid">
        <section className="panel">
          <h3 className="eyebrow">نوع تمرین</h3>
          <div className="mode-cards">
            {MODES.map(([k, name, desc, Icon]) => (
              <button
                key={k}
                className={`mode-card ${mode === k ? "is-on" : ""}`}
                onClick={() => setMode(k)}
                aria-pressed={mode === k}
              >
                <Icon size={22} strokeWidth={1.7} />
                <b>{name}</b>
                <small>{desc}</small>
              </button>
            ))}
          </div>
          <h3 className="eyebrow">انتخاب واژه‌ها</h3>
          <div className="segmented segmented-wide">
            {SOURCES.map(([k, label]) => (
              <button
                key={k}
                className={source === k ? "is-on" : ""}
                onClick={() => setSource(k)}
                aria-pressed={source === k}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="muted">
            {pool.length
              ? source === "path"
                ? "در هر نوبت تا ۱۰ مورد از مسیر انتخاب‌شده تمرین می‌شود."
                : `${pool.length} معنی آماده است؛ در هر نوبت تا ۱۰ مورد.`
              : "هنوز موردی در این بخش نیست؛ منبع دیگری انتخاب کنید یا ابتدا چند واژه یاد بگیرید."}
          </p>
          <button
            className="btn btn-primary btn-xl"
            onClick={start}
            disabled={!pool.length || loading}
          >
            {loading ? "در حال دریافت…" : "شروع تمرین"}
          </button>
          {loadError && <p role="alert">{loadError}</p>}
        </section>
        <section className="panel practice-side">
          <img
            src={`${import.meta.env.BASE_URL}brand/${mode === "dictation" ? "listen" : "typing"}.webp`}
            alt=""
          />
          <dl className="mini-stats">
            <div>
              <dt>بهترین سرعت</dt>
              <dd>
                {best}
                <small>WPM</small>
              </dd>
            </div>
            <div>
              <dt>نوبت‌های کامل‌شده</dt>
              <dd>{progress.typing.length}</dd>
            </div>
          </dl>
          <p className="muted">
            سرعت بر اساس هر پنج نویسهٔ درست، یک واژه در دقیقه محاسبه می‌شود.
          </p>
        </section>
      </div>
    </div>
  );
}

function TypingRound({
  mode,
  entries,
  onExit,
  onAgain,
}: {
  mode: Mode;
  entries: Entry[];
  onExit: () => void;
  onAgain: () => void;
}) {
  const atlas = useLearningAtlas();
  const settings = useStore((s) => s.settings);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  // Running totals live in a ref so every keystroke is counted exactly once.
  const totalsRef = useRef({ typed: 0, correct: 0, accepted: 0, ms: 0 });
  const [totals, setTotals] = useState(totalsRef.current);
  const [done, setDone] = useState(false);
  const started = useRef<number | null>(null);
  const advancing = useRef(false);
  const advanceTimer = useRef<number | undefined>(undefined);
  const input = useRef<HTMLInputElement>(null);
  const e = entries[i];
  const target = mode === "word" ? e.w : e.ex[0].en;

  useEffect(() => {
    setValue("");
    started.current = null;
    advancing.current = false;
    input.current?.focus();
    if (mode === "dictation")
      void play(atlas.audio(e, "ex"), e.ex[0].en, settings.accent);
    if (mode === "word" && settings.autoplay)
      void play(atlas.audio(e, settings.accent), e.w, settings.accent);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(
    () => () => {
      stopAudio();
      if (advanceTimer.current !== undefined)
        window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  const onChange = (next: string) => {
    if (done || advancing.current) return;
    if (started.current === null && next) started.current = performance.now();
    const d = typingDelta(value, next, target);
    if (settings.sfx && d.total > 0) void cue("key");
    const t = totalsRef.current;
    totalsRef.current = {
      ...t,
      typed: t.typed + d.total,
      correct: t.correct + d.correct,
    };
    setTotals(totalsRef.current);
    setValue(next);
    if (
      clean(next).length >= clean(target).length &&
      same(next.trimEnd(), target)
    )
      finishItem(next);
  };

  const finishItem = (final: string) => {
    if (advancing.current) return;
    advancing.current = true;
    const ms = started.current ? performance.now() - started.current : 0;
    const accepted = correctCharacterCount(final, target);
    if (settings.sfx) void cue("correct");
    const t = totalsRef.current;
    const nt = { ...t, accepted: t.accepted + accepted, ms: t.ms + ms };
    totalsRef.current = nt;
    setTotals(nt);
    if (i + 1 >= entries.length) {
      setDone(true);
      const m = typingMetrics(nt.correct, nt.typed, nt.accepted, nt.ms);
      store.progress((p) => ({
        ...p,
        typing: [
          ...p.typing,
          {
            at: Date.now(),
            mode,
            items: entries.length,
            wpm: m.wpm,
            accuracy: m.accuracy,
          },
        ].slice(-500),
      }));
    } else advanceTimer.current = window.setTimeout(() => setI(i + 1), 260);
  };

  const m = typingMetrics(
    totals.correct,
    totals.typed,
    totals.accepted,
    totals.ms,
  );
  const chars = Array.from(target);
  const typed = Array.from(value);

  if (done)
    return (
      <div className="page practice">
        <div className="special-practice">
          <a className="panel" href="#/paraphrase">
            <b>بازگویی و هم‌معنی‌ها</b>
            <span>یک معنا، چند بیان متفاوت ←</span>
          </a>
          <a className="panel" href="#/confuse">
            <b>واژه‌های شبیه، کاربردهای متفاوت</b>
            <span>مقایسه کنید، سپس خودتان را بسنجید ←</span>
          </a>
        </div>
        <section className="panel typing-done">
          <p className="eyebrow">تمرین کامل شد</p>
          <h1 className="display">
            {m.wpm} <small>WPM</small>
          </h1>
          <p className="lede">
            درستی {m.accuracy}٪ · {entries.length} مورد
          </p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              بازگشت
            </button>
            <button
              className="btn btn-primary btn-xl"
              onClick={onAgain}
              autoFocus
            >
              <RotateCcw size={18} /> یک نوبت دیگر
            </button>
          </div>
        </section>
      </div>
    );

  return (
    <div className="page practice typing">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>
          پایان
        </button>
        <AmbiencePicker />
        <div className="learn-progress">
          <span style={{ width: `${(i / entries.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          <b>{m.wpm}</b> WPM · <b>{m.accuracy}%</b>
        </span>
      </header>
      <section className="typing-stage" onClick={() => input.current?.focus()}>
        {mode === "word" && (
          <div className="typing-cue">
            <Illustration src={atlas.img(e)} word={e.w} topic={0} eager />
            <p>
              <span className="pos">{e.senses[0].pos}</span> {e.senses[0].fa}
            </p>
          </div>
        )}
        {mode !== "word" && (
          <p className="typing-fa">
            {mode === "dictation" && (
              <button
                className="link"
                onClick={() =>
                  play(atlas.audio(e, "ex"), e.ex[0].en, settings.accent)
                }
              >
                دوباره گوش کنید
              </button>
            )}
            {e.ex[0].fa}
          </p>
        )}
        <p
          className={`typing-text ${mode === "word" ? "is-word" : ""} ${mode === "dictation" ? "is-hidden" : ""}`}
          lang="en"
          dir="ltr"
          aria-hidden="true"
        >
          {chars.map((ch, k) => {
            const t = typed[k];
            const cls =
              t === undefined
                ? k === typed.length
                  ? "is-caret"
                  : ""
                : same(t, ch)
                  ? "is-ok"
                  : "is-bad";
            const show =
              mode === "dictation" && t === undefined
                ? ch === " "
                  ? " "
                  : /[A-Za-z]/.test(ch)
                    ? "·"
                    : ch
                : ch;
            return (
              <span key={k} className={cls}>
                {show}
              </span>
            );
          })}
        </p>
        <input
          ref={input}
          className="typing-input"
          dir="ltr"
          lang="en"
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="پاسخ انگلیسی را اینجا بنویسید"
        />
        <p className="muted typing-help">
          {mode === "dictation"
            ? "برای شنیدن دوباره، «دوباره گوش کنید» را بزنید."
            : "شروع به نوشتن کنید؛ پس از پاسخ درست، مورد بعدی نمایش داده می‌شود."}{" "}
          مورد {i + 1} از {entries.length}
        </p>
      </section>
    </div>
  );
}
