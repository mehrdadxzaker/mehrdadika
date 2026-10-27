import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplets,
  Feather,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AtlasContext, useAtlas } from "../atlas/context";
import type { Atlas } from "../atlas/types";
import { currentUiLocale } from "../i18n/locale";
import { href, openWord } from "../lib/router";
import { DeviceSpeak, LookupText } from "../reading/shared";
import { loadCourseCatalog } from "../courses/data";
import {
  courseAsset,
  isCurrentCourseComplete,
  nextCourseLesson,
} from "../courses/components";
import { courseLabels } from "../courses/labels";
import {
  beginCourseLesson,
  completeCourseLesson,
  courseLessonKey,
  courseSaveError,
  recordCourseAnswer,
  updateCourseLesson,
  useCourseState,
} from "../courses/state";
import { canCompleteCourseLesson } from "../courses/model";
import { resolveCourseAtlas, startCourseReview } from "../courses/review";
import type {
  CourseActivity,
  CourseLesson,
  LessonSupport,
  LocalizedCourse,
} from "../courses/types";
import "../styles/reading.css";
import "../styles/courses.css";

export function Course({
  courseId,
  lessonId,
  onAtlas,
}: {
  courseId: string;
  lessonId?: string;
  onAtlas?: (atlas: Atlas) => void;
}) {
  const atlas = useAtlas();
  const locale = currentUiLocale();
  const state = useCourseState();
  const saved = lessonId
    ? state.lessons[courseLessonKey(courseId, lessonId)]
    : undefined;
  const manifestHash =
    saved?.binding.manifestHash ?? atlas.release?.manifestHash;
  const [loaded, setLoaded] = useState<{
    atlas: Atlas;
    item: LocalizedCourse;
  } | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const labels = courseLabels(locale);
  useEffect(() => {
    let live = true;
    setLoaded(null);
    setError(false);
    void (async () => {
      const source = await resolveCourseAtlas(atlas, saved?.binding);
      const catalog = await loadCourseCatalog(source, locale);
      const item = catalog.find((value) => value.course.id === courseId);
      if (
        !item ||
        (lessonId &&
          !item.course.lessons.some((lesson) => lesson.id === lessonId))
      )
        throw new Error("Course unavailable");
      if (live) {
        onAtlas?.(source);
        setLoaded({ atlas: source, item });
      }
    })().catch(() => {
      if (live) setError(true);
    });
    return () => {
      live = false;
    };
    // The manifest identity stays stable while answers and drafts change.
  }, [atlas, locale, courseId, lessonId, manifestHash, attempt, onAtlas]);
  if (error)
    return (
      <div className="page course-empty">
        <Droplets size={38} />
        <h1>{labels.noCourse}</h1>
        <p>{labels.loadError}</p>
        <button
          className="btn"
          onClick={() => setAttempt((value) => value + 1)}
        >
          {labels.retry}
        </button>
        <a className="link" href={href({ page: "read", tab: "courses" })}>
          {labels.library}
        </a>
      </div>
    );
  if (!loaded)
    return (
      <div className="page course-loading" role="status">
        <span className="spinner" />
        <p>{labels.loading}</p>
      </div>
    );
  const lesson = loaded.item.course.lessons.find(
    (value) => value.id === lessonId,
  );
  return (
    <AtlasContext.Provider value={loaded.atlas}>
      {lesson ? (
        <LessonRunner
          key={`${loaded.item.sourceHash}:${lesson.id}`}
          item={loaded.item}
          lesson={lesson}
        />
      ) : (
        <CourseOverview item={loaded.item} />
      )}
    </AtlasContext.Provider>
  );
}

function CourseOverview({ item }: { item: LocalizedCourse }) {
  const { course, support } = item;
  const state = useCourseState();
  const labels = courseLabels();
  const completed = course.lessons.filter((lesson) =>
    isCurrentCourseComplete(
      item,
      state.lessons[courseLessonKey(course.id, lesson.id)],
    ),
  ).length;
  const next = nextCourseLesson(item, state) ?? course.lessons[0];
  const started = course.lessons.some(
    (lesson) => state.lessons[courseLessonKey(course.id, lesson.id)],
  );
  return (
    <div className="page course-overview">
      <a className="reading-back" href={href({ page: "read", tab: "courses" })}>
        <ArrowLeft size={16} />
        {labels.library}
      </a>
      <section className="course-cover">
        <div className="course-cover-art">
          <img src={courseAsset(course.cover)} alt="" />
          <span className="course-cover-stamp" lang="en" dir="ltr">
            A FIELD GUIDE
            <br />
            TO EVERYDAY SCIENCE
          </span>
        </div>
        <div className="course-cover-copy">
          <p className="eyebrow">
            <Droplets size={15} />
            {labels.course}
          </p>
          <h1 lang="en" dir="ltr">
            {course.title}
          </h1>
          <p className="course-cover-native" data-native-copy>
            {support.title}
          </p>
          <p data-native-copy>{support.subtitle}</p>
          <div className="course-overview-meta">
            <span lang="en" dir="ltr">
              {course.level}
            </span>
            <span>
              {course.lessons.length} {labels.lessons}
            </span>
            <span>8–12 {labels.minutes}</span>
          </div>
          <a
            className="btn btn-primary btn-xl"
            href={href({ page: "course", course: course.id, lesson: next.id })}
          >
            {started ? labels.continue : labels.start}
            <ArrowRight size={18} />
          </a>
          <p className="course-cover-note">{labels.support}</p>
        </div>
      </section>
      <div className="course-overview-progress">
        <span>{labels.progress}</span>
        <span>
          {completed} / {course.lessons.length} {labels.complete}
        </span>
        <div className="course-progress-track" aria-hidden="true">
          <i
            style={{ width: `${(completed / course.lessons.length) * 100}%` }}
          />
        </div>
      </div>
      <ol className="course-lesson-list">
        {course.lessons.map((lesson, index) => {
          const progress = state.lessons[courseLessonKey(course.id, lesson.id)];
          const done = isCurrentCourseComplete(item, progress);
          const earlier =
            progress && progress.binding.sourceHash !== item.sourceHash;
          return (
            <li key={lesson.id}>
              <a
                href={href({
                  page: "course",
                  course: course.id,
                  lesson: lesson.id,
                })}
              >
                <span
                  className={`course-lesson-number ${done ? "is-complete" : ""}`}
                >
                  {done ? (
                    <Check size={18} />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>
                <img src={courseAsset(lesson.image)} alt="" loading="lazy" />
                <div>
                  <h2 lang="en" dir="ltr">
                    {lesson.title}
                  </h2>
                  <p data-native-copy>{support.lessons[lesson.id].title}</p>
                  <span>
                    {lesson.minutes} {labels.minutes} ·{" "}
                    {earlier
                      ? labels.previousVersion
                      : done
                        ? labels.complete
                        : support.lessons[lesson.id].englishGoal}
                  </span>
                </div>
                <ArrowRight className="course-list-arrow" size={19} />
              </a>
            </li>
          );
        })}
      </ol>
      {(course.review.status === "preview" ||
        support.review.status === "preview") && (
        <p className="course-preview-note">
          <span>{labels.preview}</span>
          {labels.previewNote}
        </p>
      )}
    </div>
  );
}

function LessonRunner({
  item,
  lesson,
}: {
  item: LocalizedCourse;
  lesson: CourseLesson;
}) {
  const atlas = useAtlas();
  const state = useCourseState();
  const labels = courseLabels();
  const support = item.support.lessons[lesson.id];
  const key = courseLessonKey(item.course.id, lesson.id);
  const progress = state.lessons[key];
  const [bound, setBound] = useState(true);
  const [reviewError, setReviewError] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const step = progress?.step ?? 0;
  const stages = [
    labels.look,
    labels.read,
    labels.language,
    labels.practice,
    labels.write,
    labels.summary,
  ];
  useEffect(() => {
    setBound(beginCourseLesson(item, lesson, atlas));
  }, [item, lesson, atlas]);
  useEffect(() => {
    window.scrollTo(0, 0);
    title.current?.focus({ preventScroll: true });
  }, [lesson.id, step]);
  const patch = (value: Parameters<typeof updateCourseLesson>[2]) =>
    updateCourseLesson(item.course.id, lesson.id, value);
  const helpUsed = () => patch({ helpUsed: true });
  const nextLesson =
    item.course.lessons[
      item.course.lessons.findIndex((value) => value.id === lesson.id) + 1
    ];
  if (!bound)
    return (
      <div className="page course-empty">
        <p>{labels.loadError}</p>
        <a
          className="btn"
          href={href({ page: "course", course: item.course.id })}
        >
          {labels.back}
        </a>
      </div>
    );
  if (!progress)
    return (
      <div className="page course-loading" role="status">
        {labels.loading}
      </div>
    );
  const ready = canCompleteCourseLesson(progress, lesson);
  return (
    <div className="page course-reader">
      <div className="course-reader-top">
        <a
          className="reading-back"
          href={href({ page: "course", course: item.course.id })}
        >
          <ArrowLeft size={16} />
          {labels.back}
        </a>
        <span className="course-reader-count" lang="en" dir="ltr">
          {String(item.course.lessons.indexOf(lesson) + 1).padStart(2, "0")} /{" "}
          {String(item.course.lessons.length).padStart(2, "0")}
        </span>
      </div>
      <nav className="course-stages" aria-label={labels.lesson}>
        {stages.map((name, index) => (
          <button
            key={name}
            className={index === step ? "is-on" : ""}
            aria-current={index === step ? "step" : undefined}
            onClick={() => patch({ step: index as 0 | 1 | 2 | 3 | 4 | 5 })}
          >
            <span>{index + 1}</span>
            <b>{name}</b>
          </button>
        ))}
      </nav>
      <header className="course-lesson-heading">
        <p className="eyebrow">{stages[step]}</p>
        <h1 ref={title} tabIndex={-1} lang="en" dir="ltr">
          {lesson.title}
        </h1>
        <p data-native-copy>{support.title}</p>
      </header>
      {courseSaveError() && (
        <p role="alert" className="course-save-error">
          {labels.saveError}
        </p>
      )}
      {step === 0 && (
        <section className="course-look">
          <figure className="course-diagram">
            <img src={courseAsset(lesson.image)} alt={support.imageAlt} />
            <figcaption>{labels.simplified}</figcaption>
          </figure>
          <h2 lang="en" dir="ltr">
            {lesson.question}
          </h2>
          <p className="course-native-help" data-native-copy>
            {support.question}
          </p>
          <div className="course-goals">
            <article>
              <Feather size={20} />
              <h3>{labels.englishGoal}</h3>
              <p lang="en" dir="ltr">
                {lesson.englishGoal}
              </p>
              <small data-native-copy>{support.englishGoal}</small>
            </article>
            <article>
              <Droplets size={20} />
              <h3>{labels.scienceGoal}</h3>
              <p lang="en" dir="ltr">
                {lesson.scienceGoal}
              </p>
              <small data-native-copy>{support.scienceGoal}</small>
            </article>
          </div>
        </section>
      )}
      {step === 1 && (
        <ReadingStep
          lesson={lesson}
          support={support}
          translated={progress.translations ?? []}
          onTranslations={(translations) =>
            patch({ translations, helpUsed: true })
          }
        />
      )}
      {step === 2 && (
        <section className="course-language">
          <div className="course-pattern panel">
            <p className="eyebrow">
              <Sparkles size={15} />
              {labels.pattern}
            </p>
            <h2 lang="en" dir="ltr">
              {lesson.pattern}
            </h2>
            <p lang="en" dir="ltr">
              <LookupText text={lesson.patternExample} />
            </p>
            <p className="course-native-help" data-native-copy>
              {support.patternTip}
            </p>
          </div>
          <Vocabulary lesson={lesson} />
          <div className="course-writing-invitation">
            <Feather size={22} />
            <p lang="en" dir="ltr">
              {lesson.production.starter}
            </p>
          </div>
        </section>
      )}
      {step === 3 && (
        <section className="course-practice">
          <figure className="course-diagram course-practice-diagram">
            <img src={courseAsset(lesson.image)} alt={support.imageAlt} />
            <figcaption>{labels.simplified}</figcaption>
          </figure>
          {lesson.activities.map((activity, index) => (
            <Activity
              key={activity.id}
              activity={activity}
              native={support.activities[activity.id]}
              index={index}
              result={progress.answers[activity.id]}
              onAnswer={(value, help) =>
                recordCourseAnswer(
                  item.course.id,
                  lesson.id,
                  activity,
                  value,
                  help,
                )
              }
              onHelp={helpUsed}
            />
          ))}
        </section>
      )}
      {step === 4 && (
        <section className="course-write">
          <div className="course-prompt">
            <Feather size={22} />
            <h2 lang="en" dir="ltr">
              {lesson.production.prompt}
            </h2>
            <p data-native-copy>{support.production.prompt}</p>
          </div>
          <label className="course-input-label" htmlFor="course-explanation">
            {labels.yourWords}
            <span>{labels.saved}</span>
          </label>
          <textarea
            id="course-explanation"
            className="course-writing-input"
            lang="en"
            dir="ltr"
            value={progress.draft}
            maxLength={6000}
            placeholder={labels.writePlaceholder}
            onChange={(event) =>
              patch({ draft: event.target.value, reviewed: false })
            }
          />
          <details
            className="course-help"
            open={!!progress.helpOpen}
            onToggle={(event) => {
              if (event.currentTarget.open !== !!progress.helpOpen)
                patch({ helpOpen: event.currentTarget.open, helpUsed: true });
            }}
          >
            <summary>
              <HelpCircle size={16} />
              {labels.starter}
            </summary>
            <p lang="en" dir="ltr">
              {lesson.production.starter}
            </p>
            <p data-native-copy>{support.production.starterTip}</p>
          </details>
          <details
            className="course-models"
            onToggle={(event) => {
              if (event.currentTarget.open) helpUsed();
            }}
          >
            <summary>{labels.models}</summary>
            <div>
              {lesson.production.models.map((model, i) => (
                <blockquote key={model} lang="en" dir="ltr">
                  <span>0{i + 1}</span>
                  {model}
                </blockquote>
              ))}
            </div>
          </details>
          <fieldset className="course-checklist">
            <legend>{labels.checklist}</legend>
            {lesson.production.checklist.map((criterion, index) => (
              <label key={criterion}>
                <input
                  type="checkbox"
                  checked={!!progress.checklist[index]}
                  onChange={(event) => {
                    const checks = [...progress.checklist];
                    checks[index] = event.target.checked;
                    patch({ checklist: checks, reviewed: false });
                  }}
                />
                <span>
                  <span lang="en" dir="ltr">
                    {criterion}
                  </span>
                  <small data-native-copy>
                    {support.production.checklist[index]}
                  </small>
                </span>
              </label>
            ))}
            <label className="course-review-confirm">
              <input
                type="checkbox"
                checked={progress.reviewed}
                disabled={progress.draft.trim().length < 10}
                onChange={(event) => patch({ reviewed: event.target.checked })}
              />
              <span>{labels.reviewed}</span>
            </label>
          </fieldset>
          {progress.draft.trim().length < 10 && (
            <p className="muted course-writing-hint">{labels.required}</p>
          )}
        </section>
      )}
      {step === 5 && (
        <section className="course-summary">
          <div className="course-summary-mark">
            <CheckCircle2 size={40} />
          </div>
          <h2>{progress.completed ? labels.lessonFinished : labels.summary}</h2>
          <p className="course-summary-pattern" lang="en" dir="ltr">
            {lesson.pattern}
          </p>
          <div className="course-summary-stats">
            <div>
              <b>
                {
                  lesson.activities.filter(
                    (activity) => progress.answers[activity.id],
                  ).length
                }{" "}
                / 4
              </b>
              <span>{labels.answered}</span>
            </div>
            <div>
              <b>{progress.reviewed ? <Check size={21} /> : "—"}</b>
              <span>{labels.selfReview}</span>
            </div>
          </div>
          <p>{labels.completionNote}</p>
          <Vocabulary lesson={lesson} />
          {!progress.completed ? (
            <>
              <button
                className="btn btn-primary btn-xl"
                disabled={!ready}
                onClick={() => completeCourseLesson(item.course.id, lesson)}
              >
                <Check size={18} />
                {labels.finish}
              </button>
              {!ready && (
                <p className="course-finish-help">{labels.finishHelp}</p>
              )}
            </>
          ) : (
            <div className="course-complete-actions">
              <button
                className="btn"
                disabled={reviewing}
                onClick={() => {
                  setReviewing(true);
                  void startCourseReview(atlas, item, lesson)
                    .then((result) => {
                      if (result === "unavailable") setReviewError(true);
                    })
                    .catch(() => setReviewError(true))
                    .finally(() => setReviewing(false));
                }}
              >
                <RotateCcw size={17} />
                {labels.reviewWords}
              </button>
              {nextLesson ? (
                <a
                  className="btn btn-primary"
                  href={href({
                    page: "course",
                    course: item.course.id,
                    lesson: nextLesson.id,
                  })}
                >
                  {labels.nextLesson}
                  <ArrowRight size={17} />
                </a>
              ) : (
                <a
                  className="btn btn-primary"
                  href={href({ page: "course", course: item.course.id })}
                >
                  {labels.allDone}
                </a>
              )}
            </div>
          )}
          {reviewError && <p role="alert">{labels.reviewError}</p>}
        </section>
      )}
      <footer className="course-step-actions">
        <button
          className="btn"
          disabled={step === 0}
          onClick={() =>
            patch({ step: Math.max(0, step - 1) as 0 | 1 | 2 | 3 | 4 | 5 })
          }
        >
          <ArrowLeft size={17} />
          {labels.previous}
        </button>
        <span>{step + 1} / 6</span>
        {step < 5 && (
          <button
            className="btn btn-primary"
            onClick={() => patch({ step: (step + 1) as 1 | 2 | 3 | 4 | 5 })}
          >
            {labels.next}
            <ArrowRight size={17} />
          </button>
        )}
      </footer>
      {(item.course.review.status === "preview" ||
        item.support.review.status === "preview") && (
        <p className="course-preview-note">
          <span>{labels.preview}</span>
          {labels.previewNote}
        </p>
      )}
    </div>
  );
}

function ReadingStep({
  lesson,
  support,
  translated,
  onTranslations,
}: {
  lesson: CourseLesson;
  support: LessonSupport;
  translated: string[];
  onTranslations: (ids: string[]) => void;
}) {
  const labels = courseLabels();
  return (
    <section className="course-reading">
      <div className="course-reading-toolbar">
        <span>
          <BookOpen size={15} />
          {labels.read}
        </span>
        <div>
          <span>{labels.deviceVoice}</span>
          <DeviceSpeak
            text={lesson.sentences.map((sentence) => sentence.en).join(" ")}
          />
        </div>
      </div>
      {lesson.sentences.map((sentence) => {
        const showing = translated.includes(sentence.id);
        return (
          <article key={sentence.id} className="course-reading-sentence">
            <p lang="en" dir="ltr">
              <LookupText text={sentence.en} />
            </p>
            <button
              className="course-translation-toggle"
              aria-expanded={showing}
              onClick={() => {
                onTranslations(
                  showing
                    ? translated.filter((id) => id !== sentence.id)
                    : [...translated, sentence.id],
                );
              }}
            >
              {showing ? labels.hideTranslation : labels.showTranslation}
              <ChevronDown size={14} />
            </button>
            {showing && (
              <p className="course-translation" data-native-copy>
                {support.sentences[sentence.id]}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}

function Vocabulary({ lesson }: { lesson: CourseLesson }) {
  const atlas = useAtlas();
  const labels = courseLabels();
  const learning = atlas.learning ?? atlas;
  return (
    <section className="course-vocabulary">
      <h3>{labels.vocabulary}</h3>
      <div>
        {lesson.targetSenseIds.map((id) => {
          const word = learning.byId.get(id);
          const lexical =
            word?.lexicalId ?? atlas.senseToLexical?.get(id) ?? id;
          return word ? (
            <button
              key={id}
              lang="en"
              dir="ltr"
              className="reading-target"
              onClick={() => openWord(lexical)}
            >
              {word.word}
              <ArrowUpRight size={12} />
            </button>
          ) : null;
        })}
      </div>
    </section>
  );
}

type Answer = ReturnType<
  typeof useCourseState
>["lessons"][string]["answers"][string];
function Activity({
  activity,
  native,
  index,
  result,
  onAnswer,
  onHelp,
}: {
  activity: CourseActivity;
  native: LessonSupport["activities"][string];
  index: number;
  result?: Answer;
  onAnswer: (value: string[], help: boolean) => void;
  onHelp: () => void;
}) {
  const labels = courseLabels();
  const sequence = activity.kind === "sequence";
  const initial = activity.choices.map((choice) => choice.id);
  if (sequence && initial.join("|") === activity.answer.join("|"))
    initial.push(initial.shift()!);
  const [value, setValue] = useState<string[]>(
    result?.value ?? (sequence ? initial : []),
  );
  const [editing, setEditing] = useState(!result);
  const [help, setHelp] = useState(result?.helpUsed ?? false);
  const move = (index: number, direction: number) =>
    setValue((current) => {
      const next = [...current];
      [next[index], next[index + direction]] = [
        next[index + direction],
        next[index],
      ];
      return next;
    });
  return (
    <article
      className={`course-activity ${result && !editing ? (result.correct ? "is-correct" : "is-incorrect") : ""}`}
    >
      <div className="course-activity-meta">
        <span>
          {labels.question} {index + 1} / 4
        </span>
        <span>
          {activity.checks === "english"
            ? labels.englishCheck
            : labels.scienceCheck}
        </span>
      </div>
      <h2 lang="en" dir="ltr">
        {activity.prompt}
      </h2>
      {sequence ? (
        <ol className="course-sequence" dir="ltr" lang="en">
          {value.map((id, i) => (
            <li key={id}>
              <span className="course-sequence-index">{i + 1}</span>
              <span>
                {activity.choices.find((choice) => choice.id === id)?.text}
              </span>
              <div>
                <button
                  aria-label={`${labels.moveUp}: ${activity.choices.find((choice) => choice.id === id)?.text}`}
                  disabled={!editing || i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ChevronUp size={17} />
                </button>
                <button
                  aria-label={`${labels.moveDown}: ${activity.choices.find((choice) => choice.id === id)?.text}`}
                  disabled={!editing || i === value.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ChevronDown size={17} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="course-answer-options" lang="en" dir="ltr">
          {activity.choices.map((choice, i) => (
            <button
              key={choice.id}
              className={value[0] === choice.id ? "is-selected" : ""}
              aria-pressed={value[0] === choice.id}
              disabled={!editing}
              onClick={() => setValue([choice.id])}
            >
              <span>{String.fromCharCode(65 + i)}</span>
              {choice.text}
              {value[0] === choice.id && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
      <details
        className="course-help"
        onToggle={(event) => {
          if (event.currentTarget.open) {
            setHelp(true);
            onHelp();
          }
        }}
      >
        <summary>
          <HelpCircle size={15} />
          {labels.help}
        </summary>
        <p data-native-copy>{native.prompt}</p>
      </details>
      {editing ? (
        <button
          className="btn btn-primary"
          disabled={!value.length}
          onClick={() => {
            onAnswer(value, help);
            setEditing(false);
          }}
        >
          {labels.check}
          <Check size={16} />
        </button>
      ) : (
        result && (
          <div className="course-answer-feedback" role="status">
            <h3>
              <CheckCircle2 size={18} />
              {result.correct ? labels.correct : labels.incorrect}
            </h3>
            <p lang="en" dir="ltr">
              {activity.explanation}
            </p>
            <p data-native-copy>{native.explanation}</p>
            <div className="course-attempt-note">
              <span>
                {labels.firstAttempt}:{" "}
                {result.firstCorrect ? labels.correct : labels.incorrect}
              </span>
              {result.helpUsed && <span>{labels.assisted}</span>}
            </div>
            {!result.correct && (
              <button className="btn" onClick={() => setEditing(true)}>
                <RotateCcw size={15} />
                {labels.retry}
              </button>
            )}
          </div>
        )
      )}
    </article>
  );
}
