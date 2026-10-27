import { ArrowLeft, ArrowRight, Check, RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { practiceScore } from "../reading/model";
import { updateReading, useReadingState } from "../reading/state";
import {
  DeviceSpeak,
  LookupText,
  ReadingEmpty,
  useReadingCatalog,
} from "../reading/shared";
import type { ConfusableGroup } from "../reading/types";
import "../styles/reading.css";

export function Confusables({ id }: { id?: string }) {
  const catalog = useReadingCatalog();
  const state = useReadingState();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [onlyNew, setOnlyNew] = useState(false);
  const group = catalog.confusables.find((item) => item.id === id);
  if (group) return <ConfusableDetail key={group.id} group={group} />;
  const isComplete = (item: ConfusableGroup) => {
    const score = practiceScore(
      state.practiceAnswers,
      `confuse:${item.id}`,
      item.questions,
    );
    return score.total > 0 && score.correct === score.total;
  };
  const filtered = catalog.confusables.filter(
    (item) =>
      (!level || item.level === level) &&
      (!onlyNew || !isComplete(item)) &&
      (!query ||
        `${item.words.map((word) => `${word.word} ${word.meaningFa}`).join(" ")} ${item.differenceFa}`
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase())),
  );
  return (
    <div className="page confuse-library">
      <a className="reading-back" href="#/practice">
        <ArrowRight size={17} /> تمرین
      </a>
      <header className="page-head">
        <p className="eyebrow">تمرین واژه‌های نزدیک و اشتباه‌برانگیز</p>
        <h1 className="display">شبیه‌اند؛ معنایشان فرق دارد.</h1>
        <p className="lede">
          واژه‌ها را کنار هم ببین، بعد کاربرد درست را تمرین کن.
        </p>
      </header>
      <label className="confuse-search">
        <Search size={19} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جست‌وجوی واژه یا معنی فارسی"
          aria-label="جست‌وجوی واژه‌های نزدیک"
          dir="auto"
        />
      </label>
      <div className="reading-toolbar">
        <div className="chips">
          <button
            className={`chip ${!level ? "is-on" : ""}`}
            onClick={() => setLevel("")}
          >
            همهٔ سطح‌ها
          </button>
          {[...new Set(catalog.confusables.map((item) => item.level))].map(
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
        <button
          className="btn btn-ghost"
          aria-pressed={onlyNew}
          onClick={() => setOnlyNew((value) => !value)}
        >
          {onlyNew ? "نمایش همه" : "فقط تمرین‌های ناتمام"}
        </button>
      </div>
      <p className="muted">
        {filtered.length.toLocaleString("fa-IR")} گروه ·{" "}
        {catalog.confusables.filter(isComplete).length.toLocaleString("fa-IR")}{" "}
        گروه با پاسخ‌های درست
      </p>
      {filtered.length ? (
        <div className="confuse-pairs">
          {filtered.map((item) => (
            <a
              className="panel confuse-pair"
              href={`#/confuse?id=${encodeURIComponent(item.id)}`}
              key={item.id}
            >
              <div className="reading-section-title">
                <h2 lang="en" dir="ltr">
                  {item.words.map((word) => word.word).join(" / ")}
                </h2>
                <span className="reading-level">{item.level}</span>
              </div>
              <p>{item.differenceFa}</p>
              <div className="reading-meta">
                <span>
                  {isComplete(item) ? (
                    <>
                      <Check size={15} /> تمرین شده
                    </>
                  ) : (
                    "مقایسه و آزمون کوتاه"
                  )}
                </span>
                <ArrowLeft size={18} />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <ReadingEmpty
          label={
            query || level || onlyNew
              ? "گروهی با این فیلتر پیدا نشد."
              : "گروه‌های تازه به‌تدریج منتشر می‌شوند."
          }
        />
      )}
    </div>
  );
}

function ConfusableDetail({ group }: { group: ConfusableGroup }) {
  const state = useReadingState();
  const scope = `confuse:${group.id}`;
  const first = group.questions.findIndex(
    (question) =>
      state.practiceAnswers[`${scope}:${question.id}`] === undefined,
  );
  const [index, setIndex] = useState(
    first < 0 ? group.questions.length : first,
  );
  const question = group.questions[index];
  const selected = question
    ? state.practiceAnswers[`${scope}:${question.id}`]
    : undefined;
  const score = practiceScore(state.practiceAnswers, scope, group.questions);
  const restart = () => {
    updateReading((current) => ({
      ...current,
      practiceAnswers: Object.fromEntries(
        Object.entries(current.practiceAnswers).filter(
          ([key]) => !key.startsWith(`${scope}:`),
        ),
      ),
    }));
    setIndex(0);
  };
  return (
    <div className="page confuse-detail">
      <a className="reading-back" href="#/confuse">
        <ArrowRight size={17} /> همهٔ گروه‌ها
      </a>
      <header className="page-head">
        <p className="eyebrow">{group.level} · مقایسهٔ واژه‌ها</p>
        <h1 className="display" lang="en" dir="ltr">
          {group.words.map((word) => word.word).join(" / ")}
        </h1>
        <p className="lede">{group.differenceFa}</p>
      </header>
      <div className="confuse-comparison">
        {group.words.map((word) => (
          <article className="panel" key={word.word}>
            <div className="reading-section-title">
              <h2 lang="en" dir="ltr">
                <LookupText text={word.word} />
              </h2>
              <DeviceSpeak text={word.word} />
            </div>
            <h3>{word.meaningFa}</h3>
            <p className="muted">{word.explanationFa}</p>
            <p className="confuse-example" dir="ltr" lang="en">
              {word.exampleEn}
            </p>
            <p>{word.exampleFa}</p>
            <div className="reading-voice-note">
              <span>شنیدن مثال با صدای دستگاه</span>
              <DeviceSpeak text={word.exampleEn} />
            </div>
          </article>
        ))}
      </div>
      <aside className="confuse-tip">
        <span aria-hidden="true">✦</span>
        <p>{group.tipFa}</p>
      </aside>
      <section className="panel confuse-quiz">
        <div className="reading-section-title">
          <div>
            <p className="eyebrow">
              آزمون کوتاه · {group.questions.length.toLocaleString("fa-IR")}{" "}
              پرسش
            </p>
            <h2>جای خالی را پر کن.</h2>
          </div>
          <span className="muted">
            {Math.min(index + 1, group.questions.length).toLocaleString(
              "fa-IR",
            )}{" "}
            / {group.questions.length.toLocaleString("fa-IR")}
          </span>
        </div>
        {question ? (
          <>
            <p className="confuse-cloze" dir="ltr" lang="en">
              {question.sentence}
            </p>
            <div className="language-options" dir="ltr">
              {group.words.map((word, wordIndex) => (
                <button
                  key={word.word}
                  disabled={selected !== undefined}
                  aria-pressed={selected === wordIndex}
                  className={
                    selected !== undefined && wordIndex === question.answer
                      ? "is-correct"
                      : selected === wordIndex
                        ? "is-wrong"
                        : ""
                  }
                  onClick={() =>
                    updateReading((current) =>
                      current.practiceAnswers[`${scope}:${question.id}`] !==
                      undefined
                        ? current
                        : {
                            ...current,
                            practiceAnswers: {
                              ...current.practiceAnswers,
                              [`${scope}:${question.id}`]: wordIndex,
                            },
                          },
                    )
                  }
                >
                  <span>{wordIndex + 1}</span>
                  <b>{word.word}</b>
                  {selected !== undefined && wordIndex === question.answer && (
                    <Check size={18} />
                  )}
                </button>
              ))}
            </div>
            {selected !== undefined && (
              <div
                className={`language-verdict ${selected === question.answer ? "is-correct" : "is-wrong"}`}
                role="status"
              >
                <p>{question.explanationFa}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setIndex((value) => value + 1)}
                >
                  ادامه <ArrowLeft size={17} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="confuse-quiz-summary">
            <Check size={28} />
            <h3>
              {score.correct.toLocaleString("fa-IR")} از{" "}
              {score.total.toLocaleString("fa-IR")} پاسخ درست
            </h3>
            <p className="muted">
              نتیجهٔ این تمرین از برنامهٔ مرور واژه‌ها جداست.
            </p>
            <button className="btn btn-ghost" onClick={restart}>
              <RotateCcw size={17} /> دوباره تمرین کن
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
