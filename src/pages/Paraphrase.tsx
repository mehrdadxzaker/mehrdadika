import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Sparkles,
  Star,
} from "lucide-react";
import { useState } from "react";
import { practiceScore } from "../reading/model";
import { updateReading, useReadingState } from "../reading/state";
import { ReadingEmpty, useReadingCatalog } from "../reading/shared";
import type { ParaphraseLevel } from "../reading/types";
import "../styles/reading.css";

export function Paraphrase({ id }: { id?: string }) {
  const catalog = useReadingCatalog();
  const level = catalog.paraphrases.find((item) => item.id === id);
  if (level) return <ParaphraseRound key={level.id} level={level} />;
  return (
    <div className="page paraphrase-map">
      <a className="reading-back" href="#/practice">
        <ArrowRight size={17} /> تمرین
      </a>
      <header className="page-head">
        <p className="eyebrow">تمرینِ بیان‌های هم‌معنا</p>
        <h1 className="display">یک معنا، با بیانی دیگر.</h1>
        <p className="lede">عبارت هم‌معنا را در بافت جمله پیدا کن.</p>
      </header>
      {catalog.paraphrases.length ? (
        <div className="paraphrase-levels">
          {catalog.paraphrases.map((level, index) => (
            <ParaphraseLevelCard key={level.id} level={level} index={index} />
          ))}
        </div>
      ) : (
        <ReadingEmpty />
      )}
      <p className="reading-editorial-note">
        نتیجهٔ این تمرین جداگانه ثبت می‌شود و برنامهٔ مرور واژه‌ها را تغییر
        نمی‌دهد.
      </p>
    </div>
  );
}

function ParaphraseLevelCard({
  level,
  index,
}: {
  level: ParaphraseLevel;
  index: number;
}) {
  const state = useReadingState();
  const score = practiceScore(
    state.practiceAnswers,
    `paraphrase:${level.id}`,
    level.questions,
  );
  const stars =
    score.answered === score.total && score.total > 0
      ? score.correct === score.total
        ? 3
        : score.correct >= score.total / 2
          ? 2
          : 1
      : 0;
  return (
    <article className="panel paraphrase-level">
      <div className="reading-section-title">
        <span className="paraphrase-level-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="reading-level">{level.level}</span>
      </div>
      <h2>{level.titleFa}</h2>
      <p className="muted">
        {level.questions.length.toLocaleString("fa-IR")} پرسش در بافت جمله
      </p>
      <div className="paraphrase-stars" aria-label={`${stars} ستاره از ۳`}>
        {[1, 2, 3].map((star) => (
          <Star
            key={star}
            size={20}
            fill={star <= stars ? "currentColor" : "none"}
          />
        ))}
      </div>
      <a
        className="btn btn-primary"
        href={`#/paraphrase?id=${encodeURIComponent(level.id)}`}
      >
        {score.answered
          ? score.answered === score.total
            ? "دیدن نتیجه"
            : "ادامهٔ تمرین"
          : "شروع تمرین"}
        <ArrowLeft size={18} />
      </a>
    </article>
  );
}

function ParaphraseRound({ level }: { level: ParaphraseLevel }) {
  const state = useReadingState();
  const scope = `paraphrase:${level.id}`;
  const firstUnanswered = level.questions.findIndex(
    (question) =>
      state.practiceAnswers[`${scope}:${question.id}`] === undefined,
  );
  const [index, setIndex] = useState(
    firstUnanswered < 0 ? level.questions.length : firstUnanswered,
  );
  const score = practiceScore(state.practiceAnswers, scope, level.questions);
  const question = level.questions[index];
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
  if (!question)
    return (
      <div className="page language-round">
        <a className="reading-back" href="#/paraphrase">
          <ArrowRight size={17} /> نقشهٔ تمرین‌ها
        </a>
        <section className="panel language-summary">
          <Sparkles size={38} strokeWidth={1.3} />
          <h1>این مرحله تمام شد.</h1>
          <p className="language-summary-score">
            {score.correct.toLocaleString("fa-IR")}{" "}
            <span>از {score.total.toLocaleString("fa-IR")} پاسخ درست</span>
          </p>
          <p className="muted">پاسخ اول هر پرسش در نتیجه ثبت شده است.</p>
          <div className="reading-button-row">
            <button className="btn btn-primary" onClick={restart}>
              <RotateCcw size={17} /> دوباره تمرین کن
            </button>
            <a className="btn btn-ghost" href="#/paraphrase">
              بازگشت به مرحله‌ها
            </a>
          </div>
        </section>
      </div>
    );
  const selected = state.practiceAnswers[`${scope}:${question.id}`];
  const at = question.source.indexOf(question.target);
  return (
    <div className="page language-round">
      <div className="language-round-bar">
        <a className="icon-btn" aria-label="خروج از تمرین" href="#/paraphrase">
          <ArrowRight size={21} />
        </a>
        <progress value={index} max={level.questions.length} />
        <span>
          {(index + 1).toLocaleString("fa-IR")} /{" "}
          {level.questions.length.toLocaleString("fa-IR")}
        </span>
      </div>
      <p className="eyebrow">
        {level.titleFa} · {level.level}
      </p>
      <h1>کدام عبارت همان معنا را دارد؟</h1>
      <div className="paraphrase-source">
        <span className="eyebrow">جملهٔ اصلی</span>
        <p dir="ltr" lang="en">
          {at < 0 ? (
            question.source
          ) : (
            <>
              {question.source.slice(0, at)}
              <mark>{question.target}</mark>
              {question.source.slice(at + question.target.length)}
            </>
          )}
        </p>
      </div>
      <div className="paraphrase-prompt">
        <span className="eyebrow">بیان دیگر</span>
        <p dir="ltr" lang="en">
          {question.prompt}
        </p>
      </div>
      <div className="language-options" dir="ltr">
        {question.options.map((option, optionIndex) => (
          <button
            key={option}
            disabled={selected !== undefined}
            aria-pressed={selected === optionIndex}
            className={
              selected !== undefined && optionIndex === question.answer
                ? "is-correct"
                : selected === optionIndex
                  ? "is-wrong"
                  : ""
            }
            onClick={() =>
              updateReading((current) =>
                current.practiceAnswers[`${scope}:${question.id}`] !== undefined
                  ? current
                  : {
                      ...current,
                      practiceAnswers: {
                        ...current.practiceAnswers,
                        [`${scope}:${question.id}`]: optionIndex,
                      },
                    },
              )
            }
          >
            <span>{optionIndex + 1}</span>
            <b lang="en">{option}</b>
            {selected !== undefined && optionIndex === question.answer && (
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
          <h3>
            {selected === question.answer
              ? "درست پیدا کردی."
              : "پاسخ درست را مقایسه کن."}
          </h3>
          <p>{question.explanationFa}</p>
          <button
            className="btn btn-primary"
            onClick={() => setIndex((value) => value + 1)}
          >
            ادامه <ArrowLeft size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
