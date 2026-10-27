import { uiIntlLocale } from "../i18n/locale";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Pause,
  Play,
  Type,
  Volume2,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAtlas } from "../atlas/context";
import { stopAudio } from "../lib/audio";
import {
  chapterPosition,
  rememberParagraph,
  recordComprehension,
  sentenceList,
} from "../reading/model";
import {
  readingSaveError,
  readingSnapshot,
  updateReading,
  useReadingState,
} from "../reading/state";
import { observedParagraphPosition } from "../reading/position";
import { readingChapterCount, readingMinutes } from "../reading/labels";
import {
  DeviceSpeak,
  LookupText,
  ReadingEmpty,
  SaveNotice,
  useReadingCatalog,
} from "../reading/shared";
import type {
  BookChapter,
  ReadingBook,
  ReadingItem,
  ReadingRoute,
  Sentence,
  TruthAnswer,
} from "../reading/types";
import "../styles/reading.css";
import { CourseShelf } from "../courses/components";
import { courseLabels } from "../courses/labels";
import { currentUiLocale } from "../i18n/locale";

export type { ReadingRoute } from "../reading/types";
const truthLabels: [TruthAnswer, string, string][] = [
  ["true", "TRUE", "درست"],
  ["false", "FALSE", "نادرست"],
  ["not-given", "NOT GIVEN", "ذکر نشده"],
];

export function Reading({ route }: { route: ReadingRoute }) {
  const catalog = useReadingCatalog();
  const state = useReadingState();
  if (route.page === "books") {
    const book = catalog.books.find((item) => item.id === route.book);
    if (!book)
      return (
        <div className="page">
          <ReadingEmpty label="این کتاب هنوز منتشر نشده است." />
        </div>
      );
    const chapter = book.chapters.find((item) => item.number === route.chapter);
    return chapter ? (
      <ChapterReader key={chapter.id} book={book} chapter={chapter} />
    ) : (
      <BookOverview book={book} />
    );
  }
  const books = route.tab === "books";
  const courses = route.tab === "courses";
  const passage =
    catalog.passages.find((item) => item.id === route.id) ??
    catalog.passages.find((item) => item.id === state.lastPassage) ??
    catalog.passages[0];
  return (
    <div className="page reading-room">
      <header className="page-head">
        <h1 className="display">کتابخانه</h1>
        <p className="lede">در داستان‌ها، آرام بخوان و واژه‌ها را پیدا کن.</p>
      </header>
      <nav className="reading-tabs" aria-label="بخش‌های کتابخانه">
        <a
          className={!books && !courses ? "is-on" : ""}
          aria-current={!books && !courses ? "page" : undefined}
          href="#/read?tab=short"
        >
          متن‌های کوتاه
        </a>
        <a
          className={books ? "is-on" : ""}
          aria-current={books ? "page" : undefined}
          href="#/read?tab=books"
        >
          کتاب‌ها
        </a>
        <a
          className={courses ? "is-on" : ""}
          aria-current={courses ? "page" : undefined}
          href="#/read?tab=courses"
        >
          {courseLabels(currentUiLocale()).courses}
        </a>
      </nav>
      {courses ? (
        <CourseShelf />
      ) : books ? (
        <BookShelf books={catalog.books} />
      ) : passage ? (
        <>
          <ShortReading key={passage.id} passage={passage} />
          <PassageLibrary selected={passage.id} />
        </>
      ) : (
        <ReadingEmpty />
      )}
      <p className="reading-editorial-note">
        متن‌های آغازین، محتوای تألیفیِ آزمایشی مهردادیکا هستند. بررسی انسانی و
        گسترش مجموعه ادامه دارد.
      </p>
    </div>
  );
}

function ShortReading({ passage }: { passage: ReadingItem }) {
  const atlas = useAtlas();
  const state = useReadingState();
  const catalog = useReadingCatalog();
  const index = catalog.passages.findIndex((item) => item.id === passage.id);
  const next = catalog.passages[index + 1];
  useEffect(() => {
    updateReading((current) => ({ ...current, lastPassage: passage.id }));
  }, [passage.id]);
  return (
    <>
      <article className="short-reading">
        <header className="reading-title">
          <p className="eyebrow">متن کوتاه · {passage.level}</p>
          <h2 className="reading-english-title" dir="ltr" lang="en">
            {passage.titleEn}
          </h2>
          <p>{passage.titleFa}</p>
          <div className="reading-meta">
            <span>
              {atlas.topics.find(([id]) => id === passage.domainId)?.[1] ??
                "خواندن"}
            </span>
            <span>{passage.level}</span>
            <span>حدود {readingMinutes(passage.minutes)}</span>
          </div>
        </header>
        <TargetWords words={passage.targetWords} />
        <ReadingToolbar />
        <div
          className="reading-text"
          style={{ fontSize: `${state.fontScale * 1.12}rem` }}
        >
          {passage.paragraphs.map((paragraph) => (
            <div
              className="reading-paragraph"
              key={paragraph.id}
              id={paragraph.id}
            >
              <p className="reading-en" lang="en" dir="ltr">
                <LookupText
                  text={paragraph.sentences
                    .map((sentence) => sentence.en)
                    .join(" ")}
                />
              </p>
              {state.bilingual && (
                <p className="reading-fa" lang="fa" dir="rtl">
                  {paragraph.sentences.map((sentence) => sentence.fa).join(" ")}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="reading-voice-note">
          <Volume2 size={16} />
          <span>شنیدن جمله‌ها با صدای دستگاه</span>
          <DeviceSpeak
            text={sentenceList(passage)
              .map((sentence) => sentence.en)
              .join(" ")}
          />
        </div>
        <Comprehension passage={passage} />
      </article>
      {next && (
        <a
          className="reading-next panel"
          href={`#/read?id=${encodeURIComponent(next.id)}`}
        >
          <div>
            <span className="eyebrow">متن بعدی</span>
            <h3 dir="ltr" lang="en">
              {next.titleEn}
            </h3>
            <p>{next.titleFa}</p>
          </div>
          <ArrowLeft size={22} />
        </a>
      )}
      <SaveNotice visible={readingSaveError()} />
    </>
  );
}

function ReadingToolbar() {
  const state = useReadingState();
  return (
    <div className="reading-toolbar" aria-label="تنظیمات خواندن">
      <button
        className={`btn btn-ghost ${state.bilingual ? "is-on" : ""}`}
        aria-pressed={state.bilingual}
        onClick={() =>
          updateReading((current) => ({
            ...current,
            bilingual: !current.bilingual,
          }))
        }
      >
        <BookOpen size={17} /> انگلیسی و فارسی
      </button>
      <div className="reading-font-controls" aria-label="اندازهٔ متن">
        <button
          className="icon-btn"
          aria-label="کوچک کردن متن"
          onClick={() =>
            updateReading((current) => ({
              ...current,
              fontScale: current.fontScale - 0.1,
            }))
          }
        >
          A−
        </button>
        <span>
          {Math.round(state.fontScale * 100).toLocaleString(uiIntlLocale())}٪
        </span>
        <button
          className="icon-btn"
          aria-label="بزرگ کردن متن"
          onClick={() =>
            updateReading((current) => ({
              ...current,
              fontScale: current.fontScale + 0.1,
            }))
          }
        >
          A+
        </button>
      </div>
    </div>
  );
}

function TargetWords({ words }: { words: string[] }) {
  const atlas = useAtlas();
  return (
    <div className="reading-targets">
      <span className="muted">واژه‌های این متن</span>
      <div dir="ltr">
        {words.map((word) => {
          const ref = atlas.words.find(
            (item) => item.word.toLowerCase() === word.toLowerCase(),
          );
          return ref ? (
            <span className="reading-target" key={word}>
              <LookupText text={word} />
            </span>
          ) : (
            <span
              className="reading-target is-unavailable"
              key={word}
              lang="en"
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Comprehension({ passage }: { passage: ReadingItem }) {
  const state = useReadingState();
  if (!passage.questions.length) return null;
  const attempted = passage.questions.filter(
    (question) => state.answers[`${passage.id}:${question.id}`],
  ).length;
  const correct = passage.questions.filter(
    (question) =>
      state.answers[`${passage.id}:${question.id}`] === question.answer,
  ).length;
  return (
    <section
      className="reading-comprehension"
      aria-labelledby={`quiz-${passage.id}`}
    >
      <div className="reading-section-title">
        <div>
          <p className="eyebrow">
            درک مطلب · {passage.questions.length.toLocaleString(uiIntlLocale())}{" "}
            پرسش
          </p>
          <h3 id={`quiz-${passage.id}`}>متن را چقدر فهمیدی؟</h3>
        </div>
        {attempted === passage.questions.length && (
          <span className="reading-score" role="status">
            {correct.toLocaleString(uiIntlLocale())} از{" "}
            {attempted.toLocaleString(uiIntlLocale())} درست
          </span>
        )}
      </div>
      <p className="muted reading-quiz-help">
        درست: مطابق متن · نادرست: مخالف متن · ذکر نشده: اطلاعات کافی در متن
        نیست.
      </p>
      <ol>
        {passage.questions.map((question, index) => {
          const selected = state.answers[`${passage.id}:${question.id}`];
          return (
            <li key={question.id}>
              <p className="reading-question" dir="ltr" lang="en">
                <span>{index + 1}.</span> {question.statement}
              </p>
              <div className="reading-truth-options">
                {truthLabels.map(([value, english, persian]) => (
                  <button
                    key={value}
                    disabled={!!selected}
                    aria-pressed={selected === value}
                    className={`${selected === value ? (selected === question.answer ? "is-correct" : "is-wrong") : ""}`}
                    onClick={() =>
                      updateReading((current) =>
                        recordComprehension(
                          current,
                          passage,
                          question.id,
                          value,
                        ),
                      )
                    }
                  >
                    <span lang="en" dir="ltr">
                      {english}
                    </span>
                    <small>{persian}</small>
                    {selected === value &&
                      (selected === question.answer ? (
                        <Check size={16} />
                      ) : null)}
                  </button>
                ))}
              </div>
              {selected && (
                <p
                  className={`reading-feedback ${selected === question.answer ? "is-correct" : "is-wrong"}`}
                  role="status"
                >
                  {selected === question.answer
                    ? "درست بود. "
                    : "یک بار دیگر به متن نگاه کن. "}
                  {question.explanationFa}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function PassageLibrary({ selected }: { selected: string }) {
  const catalog = useReadingCatalog();
  const state = useReadingState();
  const [level, setLevel] = useState("");
  const passages = catalog.passages.filter(
    (passage) => !level || passage.level === level,
  );
  return (
    <section className="reading-library" aria-labelledby="short-library">
      <div className="reading-section-title">
        <div>
          <p className="eyebrow">متن‌های کوتاه</p>
          <h2 id="short-library">
            {catalog.passages.length.toLocaleString(uiIntlLocale())} متن ·{" "}
            {catalog.passages
              .filter((passage) => state.completed.includes(passage.id))
              .length.toLocaleString(uiIntlLocale())}{" "}
            تمرین‌شده
          </h2>
        </div>
      </div>
      <div className="chips" aria-label="سطح متن">
        <button
          className={`chip ${!level ? "is-on" : ""}`}
          onClick={() => setLevel("")}
        >
          همه
        </button>
        {[...new Set(catalog.passages.map((passage) => passage.level))].map(
          (value) => (
            <button
              key={value}
              className={`chip ${value === level ? "is-on" : ""}`}
              onClick={() => setLevel(value)}
            >
              {value}
            </button>
          ),
        )}
      </div>
      <div className="reading-passage-grid">
        {passages.map((passage, index) => (
          <a
            href={`#/read?id=${encodeURIComponent(passage.id)}`}
            className={`reading-passage-card ${passage.id === selected ? "is-current" : ""}`}
            key={passage.id}
          >
            <span className="reading-passage-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 dir="ltr" lang="en">
              {passage.titleEn}
            </h3>
            <p>{passage.titleFa}</p>
            <div className="reading-meta">
              <span>{passage.level}</span>
              <span>
                {state.completed.includes(passage.id)
                  ? "تمرین شده"
                  : passage.id === selected
                    ? "در حال خواندن"
                    : "آمادهٔ خواندن"}
              </span>
              <ArrowLeft size={16} />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function BookCover({
  book,
  large = false,
}: {
  book: ReadingBook;
  large?: boolean;
}) {
  return (
    <div className={`reading-book-cover ${large ? "is-large" : ""}`}>
      <span className="reading-book-author">MEHRDADIKA STORIES</span>
      <h3 lang="en" dir="ltr">
        {book.titleEn}
      </h3>
      <p>{book.titleFa}</p>
      <span className="reading-book-art" aria-hidden="true">
        <span className="reading-cover-window" />
        <span className="reading-cover-star">✦</span>
      </span>
      <span className="reading-book-imprint">مهردادیکا</span>
    </div>
  );
}

function BookShelf({ books }: { books: ReadingBook[] }) {
  if (!books.length)
    return <ReadingEmpty label="اولین کتاب در حال آماده‌سازی است." />;
  return (
    <>
      <div className="reading-bookshelf">
        {books.map((book) => (
          <article className="reading-book-feature" key={book.id}>
            <a
              href={`#/books/${book.id}`}
              aria-label={`باز کردن ${book.titleFa}`}
            >
              <BookCover book={book} />
            </a>
            <div>
              <p className="eyebrow">داستان تألیفی · {book.level}</p>
              <h2>{book.titleFa}</h2>
              <p className="reading-book-subtitle" dir="ltr" lang="en">
                {book.titleEn}
              </p>
              <p className="lede">{book.summaryFa}</p>
              <div className="reading-meta">
                <span>
                  {book.chapters.length.toLocaleString(uiIntlLocale())} فصل
                  منتشرشده
                </span>
                <span>متن انگلیسی و فارسی</span>
              </div>
              <a className="btn btn-primary" href={`#/books/${book.id}`}>
                شروع خواندن <ArrowLeft size={18} />
              </a>
            </div>
          </article>
        ))}
      </div>
      <section className="reading-upcoming">
        <span aria-hidden="true">✦</span>
        <h3>داستان‌های بیشتری در راه‌اند.</h3>
        <p className="muted">
          متن‌ها، ترجمه‌ها و تمرین‌ها به‌تدریج به کتابخانه اضافه می‌شوند.
        </p>
      </section>
    </>
  );
}

function BookOverview({ book }: { book: ReadingBook }) {
  const state = useReadingState();
  const completed = book.chapters.filter((chapter) =>
    state.completed.includes(chapter.id),
  );
  const resume =
    book.chapters.find(
      (chapter) =>
        chapter.id === state.lastBookChapters[book.id] &&
        !state.completed.includes(chapter.id),
    ) ??
    book.chapters.find((chapter) => !state.completed.includes(chapter.id)) ??
    book.chapters[0];
  const bookmarks = book.chapters.flatMap((chapter) =>
    chapter.paragraphs
      .filter((paragraph) => state.bookmarks.includes(paragraph.id))
      .map((paragraph) => ({ chapter, paragraph })),
  );
  return (
    <div className="page book-overview">
      <a className="reading-back" href="#/read?tab=books">
        <ArrowRight size={17} /> کتابخانه
      </a>
      <div className="book-overview-hero">
        <BookCover book={book} />
        <div>
          <p className="eyebrow">{book.author}</p>
          <h1 className="display">{book.titleFa}</h1>
          <p className="reading-book-subtitle" lang="en" dir="ltr">
            {book.titleEn}
          </p>
          <p className="lede">{book.summaryFa}</p>
          {resume && (
            <a
              className="btn btn-primary"
              href={`#/books/${book.id}/${resume.number}`}
            >
              {completed.length ? "ادامهٔ خواندن" : "باز کردن فصل اول"}{" "}
              <ArrowLeft size={18} />
            </a>
          )}
          <p className="muted">
            {readingChapterCount(book.chapters.length)} · {book.level}
          </p>
        </div>
      </div>
      <section className="book-constellation" aria-labelledby="chapter-map">
        <p className="eyebrow">از یک ستاره، به ستاره‌ای دیگر</p>
        <h2 id="chapter-map">مسیر این داستان</h2>
        <p className="muted">
          {completed.length.toLocaleString(uiIntlLocale())} از{" "}
          {book.chapters.length.toLocaleString(uiIntlLocale())} فصل خوانده‌شده
        </p>
        <ol>
          {book.chapters.map((chapter) => (
            <li
              key={chapter.id}
              className={
                state.completed.includes(chapter.id) ? "is-complete" : ""
              }
            >
              <a href={`#/books/${book.id}/${chapter.number}`}>
                <span className="chapter-star">
                  {state.completed.includes(chapter.id) ? (
                    <Check size={19} />
                  ) : (
                    "✦"
                  )}
                </span>
                <div>
                  <span className="eyebrow">
                    فصل {chapter.number.toLocaleString(uiIntlLocale())}
                  </span>
                  <h3>{chapter.titleFa}</h3>
                  <p lang="en" dir="ltr">
                    {chapter.titleEn}
                  </p>
                </div>
                <span className="muted">{readingMinutes(chapter.minutes)}</span>
                <ArrowLeft size={18} />
              </a>
            </li>
          ))}
        </ol>
      </section>
      <section className="panel reading-bookmarks">
        <h3>
          <Bookmark size={19} /> نشان‌های این کتاب
        </h3>
        {bookmarks.length ? (
          bookmarks.map(({ chapter, paragraph }) => (
            <a
              key={paragraph.id}
              href={`#/books/${book.id}/${chapter.number}`}
              onClick={() =>
                updateReading((current) =>
                  rememberParagraph(current, chapter, paragraph.id),
                )
              }
            >
              <span>{chapter.titleFa}</span>
              <p dir="ltr" lang="en">
                {paragraph.sentences[0]?.en}
              </p>
            </a>
          ))
        ) : (
          <p className="muted">
            کنار هر بند از داستان، نشان بگذار تا دوباره پیدایش کنی.
          </p>
        )}
      </section>
    </div>
  );
}

function useDeviceNarration(
  sentences: Sentence[],
  initial: number,
  onPosition: (position: number) => void,
) {
  const [index, setIndex] = useState(initial);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const available =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const pause = () => {
    generation.current++;
    stopAudio();
    setPlaying(false);
  };
  useEffect(
    () => () => {
      generation.current++;
      stopAudio();
    },
    [],
  );
  const select = (position: number) => {
    pause();
    const next = Math.max(0, Math.min(sentences.length - 1, position));
    setIndex(next);
    onPosition(next);
  };
  const start = (from = index) => {
    pause();
    if (!available || !sentences.length) {
      setError("صدای دستگاه در این مرورگر در دسترس نیست.");
      return;
    }
    const mine = ++generation.current;
    setPlaying(true);
    setError("");
    const speak = (position: number) => {
      if (generation.current !== mine || !sentences[position]) return;
      setIndex(position);
      onPosition(position);
      const utterance = new SpeechSynthesisUtterance(sentences[position].en);
      utterance.lang = "en-GB";
      utterance.rate = rate;
      utterance.onend = () => {
        if (generation.current !== mine) return;
        if (position + 1 < sentences.length) speak(position + 1);
        else setPlaying(false);
      };
      utterance.onerror = () => {
        if (generation.current === mine) {
          setPlaying(false);
          setError(
            "پخش صدا متوقف شد. می‌توانی دوباره تلاش کنی یا متن را بخوانی.",
          );
        }
      };
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        if (generation.current === mine) {
          setPlaying(false);
          setError("پخش صدا در این مرورگر ممکن نشد؛ متن همچنان در دسترس است.");
        }
      }
    };
    speak(from);
  };
  return {
    index,
    playing,
    rate,
    available,
    error,
    pause,
    start,
    select,
    locate(position: number) {
      const next = Math.max(0, Math.min(sentences.length - 1, position));
      setIndex(next);
      onPosition(next);
    },
    changeRate() {
      pause();
      setRate((value) => (value === 1 ? 1.25 : value === 1.25 ? 0.8 : 1));
    },
  };
}

function ChapterReader({
  book,
  chapter,
}: {
  book: ReadingBook;
  chapter: BookChapter;
}) {
  const state = useReadingState();
  const [listening, setListening] = useState(false);
  const [settings, setSettings] = useState(false);
  const sentences = useMemo(() => sentenceList(chapter), [chapter]);
  const narration = useDeviceNarration(
    sentences,
    chapterPosition(state, chapter),
    (position) =>
      updateReading((current) => ({
        ...current,
        positions: { ...current.positions, [chapter.id]: position },
        sentenceAnchors: {
          ...current.sentenceAnchors,
          [chapter.id]: sentences[position]?.id ?? "",
        },
      })),
  );
  const current = sentences[narration.index];
  const chapterIndex = book.chapters.findIndex(
    (item) => item.id === chapter.id,
  );
  const next = book.chapters[chapterIndex + 1];
  const previous = book.chapters[chapterIndex - 1];
  useLayoutEffect(() => {
    updateReading((currentState) => ({
      ...currentState,
      lastBookChapters: {
        ...currentState.lastBookChapters,
        [book.id]: chapter.id,
      },
    }));
    if (listening) return;
    const savedAnchor =
      sentences[chapterPosition(readingSnapshot(), chapter)]?.id;
    const paragraph = chapter.paragraphs.find((item) =>
      item.sentences.some((sentence) => sentence.id === savedAnchor),
    );
    if (!paragraph) return;
    // Restore the viewport before the observer can interpret the initial page
    // position as reading progress and overwrite the stored sentence anchor.
    document.getElementById(paragraph.id)?.scrollIntoView({ block: "start" });
  }, [book.id, chapter.id, chapter.paragraphs, sentences, listening]);
  useEffect(() => {
    if (listening || narration.playing || !("IntersectionObserver" in window))
      return;
    let active = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!active) return;
        const visible = entries.find((entry) => entry.isIntersecting);
        if (!visible) return;
        const position = observedParagraphPosition(
          chapter,
          visible.target.id,
          chapterPosition(readingSnapshot(), chapter),
        );
        if (position !== undefined) narration.locate(position);
      },
      { rootMargin: "-80px 0px -50% 0px", threshold: 0.1 },
    );
    chapter.paragraphs.forEach((paragraph) => {
      const element = document.getElementById(paragraph.id);
      if (element) observer.observe(element);
    });
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [chapter.id, chapter.paragraphs, sentences, listening, narration.playing]);
  const isComplete = state.completed.includes(chapter.id);
  const markRead = () =>
    updateReading((currentState) => ({
      ...currentState,
      completed: [...new Set([...currentState.completed, chapter.id])],
    }));
  const chapterHref = `#/books/${book.id}`;
  const atlas = useAtlas();
  const heroImage = atlas.words.find((word) =>
    ["library", "book", "window"].includes(word.word.toLowerCase()),
  );
  const hero = heroImage ? atlas.img(heroImage) : null;
  return (
    <div className={`book-reader ${listening ? "is-listening" : ""}`}>
      <header className="book-reader-bar">
        <a
          className="icon-btn"
          href={chapterHref}
          aria-label="بازگشت به فصل‌های کتاب"
        >
          <ArrowRight size={21} />
        </a>
        <a href={chapterHref}>
          فصل {chapter.number.toLocaleString(uiIntlLocale())} ·{" "}
          {chapter.titleFa}
        </a>
        <div>
          <button
            className="icon-btn"
            onClick={() => setSettings((value) => !value)}
            aria-label="تنظیمات خواندن"
            aria-expanded={settings}
          >
            <Type size={20} />
          </button>
          <button
            className="icon-btn"
            onClick={() => setListening((value) => !value)}
            aria-label={listening ? "رفتن به متن کتاب" : "حالت شنیدن"}
          >
            {listening ? <BookOpen size={20} /> : <Headphones size={20} />}
          </button>
        </div>
      </header>
      {settings && (
        <div className="book-settings">
          <ReadingToolbar />
          <p className="muted">
            خواندن با صدای دستگاه انجام می‌شود. صداهای نصب‌شده در مرورگر و
            دستگاه‌ها متفاوت‌اند.
          </p>
        </div>
      )}
      {listening ? (
        <section className="book-listening-scene">
          <div className="book-listening-art">
            {hero ? (
              <img src={hero} alt="تصویر کتابخانه برای همراهی با داستان" />
            ) : (
              <BookOpen size={80} strokeWidth={1} />
            )}
          </div>
          <p className="eyebrow">
            {book.titleFa} · فصل {chapter.number.toLocaleString(uiIntlLocale())}
          </p>
          <p className="book-listening-en" lang="en" dir="ltr">
            {current?.en}
          </p>
          {state.bilingual && (
            <p className="book-listening-fa">{current?.fa}</p>
          )}
          <button className="btn btn-ghost" onClick={() => setListening(false)}>
            برگشتن به متن <BookOpen size={17} />
          </button>
        </section>
      ) : (
        <>
          <header className="book-chapter-heading">
            {hero && <img src={hero} alt="تصویر همراه داستان" />}
            <p className="eyebrow" dir="ltr" lang="en">
              CHAPTER {chapter.number}
            </p>
            <h1>{chapter.titleFa}</h1>
            <p lang="en" dir="ltr">
              {chapter.titleEn}
            </p>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setListening(true);
                narration.start();
              }}
              disabled={!narration.available}
            >
              <Headphones size={18} /> شنیدن این فصل با صدای دستگاه
            </button>
          </header>
          <article
            className="reading-text book-chapter-text"
            style={{ fontSize: `${state.fontScale * 1.12}rem` }}
          >
            {chapter.paragraphs.map((paragraph) => (
              <section
                key={paragraph.id}
                className="reading-paragraph"
                id={paragraph.id}
              >
                <div className="book-paragraph-tools">
                  <button
                    className={`icon-btn ${state.bookmarks.includes(paragraph.id) ? "is-saved" : ""}`}
                    aria-label="نشان‌گذاری این بند"
                    aria-pressed={state.bookmarks.includes(paragraph.id)}
                    onClick={() =>
                      updateReading((currentState) => ({
                        ...currentState,
                        bookmarks: currentState.bookmarks.includes(paragraph.id)
                          ? currentState.bookmarks.filter(
                              (id) => id !== paragraph.id,
                            )
                          : [...currentState.bookmarks, paragraph.id],
                      }))
                    }
                  >
                    <Bookmark
                      size={17}
                      fill={
                        state.bookmarks.includes(paragraph.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label="شنیدن از این بند با صدای دستگاه"
                    disabled={!narration.available}
                    onClick={() =>
                      narration.start(
                        sentences.findIndex(
                          (sentence) =>
                            sentence.id === paragraph.sentences[0]?.id,
                        ),
                      )
                    }
                  >
                    <Volume2 size={17} />
                  </button>
                </div>
                <p className="reading-en" lang="en" dir="ltr">
                  <LookupText
                    text={paragraph.sentences
                      .map((sentence) => sentence.en)
                      .join(" ")}
                  />
                </p>
                {state.bilingual && (
                  <p className="reading-fa">
                    {paragraph.sentences
                      .map((sentence) => sentence.fa)
                      .join(" ")}
                  </p>
                )}
              </section>
            ))}
          </article>
          <section className="book-chapter-end">
            <span className="reading-empty-star" aria-hidden="true">
              ✦
            </span>
            <p>برای واژه‌ها، کمی فرصتِ ماندن بگذار.</p>
            <TargetWords words={chapter.targetWords} />
            <button
              className={`btn ${isComplete ? "btn-ghost" : "btn-primary"}`}
              onClick={markRead}
            >
              {isComplete ? (
                <>
                  <Check size={18} /> این فصل خوانده شده
                </>
              ) : (
                "این فصل را خواندم"
              )}
            </button>
            <nav aria-label="فصل‌های قبل و بعد">
              {previous && (
                <a href={`${chapterHref}/${previous.number}`}>
                  <ArrowRight size={17} /> فصل قبل
                </a>
              )}
              {next && (
                <a href={`${chapterHref}/${next.number}`}>
                  فصل بعد: {next.titleFa} <ArrowLeft size={17} />
                </a>
              )}
            </nav>
          </section>
        </>
      )}
      <div
        className="book-narration-bar"
        aria-label="خواندن فصل با صدای دستگاه"
      >
        <div className="book-narration-controls">
          <button
            className="icon-btn"
            onClick={() => narration.select(narration.index - 1)}
            disabled={narration.index <= 0}
            aria-label="جملهٔ قبل"
          >
            <ChevronLeft size={23} />
          </button>
          <button
            className="book-play"
            disabled={!narration.available}
            onClick={() =>
              narration.playing ? narration.pause() : narration.start()
            }
            aria-label={
              narration.playing ? "توقف خواندن" : "پخش با صدای دستگاه"
            }
          >
            {narration.playing ? (
              <Pause size={23} fill="currentColor" />
            ) : (
              <Play size={23} fill="currentColor" />
            )}
          </button>
          <button
            className="icon-btn"
            onClick={() => narration.select(narration.index + 1)}
            disabled={narration.index + 1 >= sentences.length}
            aria-label="جملهٔ بعد"
          >
            <ChevronRight size={23} />
          </button>
        </div>
        <div>
          <span dir="ltr">
            {narration.index + 1} / {sentences.length}
          </span>
          <small>
            {narration.playing ? "صدای دستگاه" : "ادامه از این جمله"}
          </small>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => setListening((value) => !value)}
        >
          {listening ? "متن" : "شنیدن"}
        </button>
        <button
          className="btn btn-ghost"
          dir="ltr"
          onClick={narration.changeRate}
          aria-label="تغییر سرعت خواندن"
        >
          {narration.rate}×
        </button>
      </div>
      {narration.error && (
        <p className="book-narration-error" role="status">
          {narration.error}
        </p>
      )}
      <SaveNotice visible={readingSaveError()} />
    </div>
  );
}
