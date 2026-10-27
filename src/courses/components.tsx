import { ArrowUpRight, BookOpen, Check, Clock, Droplets } from "lucide-react";
import { useEffect, useState } from "react";
import { useAtlas } from "../atlas/context";
import { currentUiLocale } from "../i18n/locale";
import { href } from "../lib/router";
import { loadCourseCatalog } from "./data";
import { courseLabels } from "./labels";
import {
  courseLessonKey,
  courseSaveError,
  useCourseState,
  type CourseLessonProgress,
  type CourseState,
} from "./state";
import type { LocalizedCourse } from "./types";
import "../styles/courses.css";

export const courseAsset = (path: string) =>
  `${import.meta.env?.BASE_URL ?? "/"}${path.replace(/^\//, "")}`;

export function isCurrentCourseComplete(
  item: LocalizedCourse,
  progress?: CourseLessonProgress,
) {
  return (
    progress?.binding.sourceHash === item.sourceHash && !!progress.completed
  );
}

export function nextCourseLesson(item: LocalizedCourse, state: CourseState) {
  const remembered =
    state.last?.courseId === item.course.id
      ? item.course.lessons.find(
          (lesson) =>
            lesson.id === state.last?.lessonId &&
            !isCurrentCourseComplete(
              item,
              state.lessons[courseLessonKey(item.course.id, lesson.id)],
            ),
        )
      : undefined;
  return (
    remembered ??
    item.course.lessons.find(
      (lesson) =>
        !isCurrentCourseComplete(
          item,
          state.lessons[courseLessonKey(item.course.id, lesson.id)],
        ),
    )
  );
}

export function useCurrentCourses() {
  const atlas = useAtlas();
  const locale = currentUiLocale();
  const [courses, setCourses] = useState<LocalizedCourse[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setCourses(null);
    setError(false);
    loadCourseCatalog(atlas, locale).then(
      (items) => {
        if (live) setCourses(items);
      },
      () => {
        if (live) setError(true);
      },
    );
    return () => {
      live = false;
    };
  }, [atlas, locale, attempt]);
  return { courses, error, retry: () => setAttempt((value) => value + 1) };
}

export function CourseCard({
  item,
  compact = false,
}: {
  item: LocalizedCourse;
  compact?: boolean;
}) {
  const labels = courseLabels();
  const state = useCourseState();
  const { course, support } = item;
  const count = course.lessons.filter((lesson) =>
    isCurrentCourseComplete(
      item,
      state.lessons[courseLessonKey(course.id, lesson.id)],
    ),
  ).length;
  return (
    <a
      className={`course-card ${compact ? "course-card-compact" : ""}`}
      href={href({ page: "course", course: course.id })}
    >
      <div className="course-card-art">
        <img src={courseAsset(course.cover)} alt="" loading="lazy" />
        <span className="course-art-tag" lang="en" dir="ltr">
          FIELD NOTES / 01
        </span>
      </div>
      <div className="course-card-body">
        <div className="course-card-meta">
          <span>
            <Droplets size={14} />
            {labels.course}
          </span>
          <span lang="en" dir="ltr">
            {course.level}
          </span>
        </div>
        <h2 lang="en" dir="ltr">
          {course.title}
        </h2>
        <p className="course-native-title" data-native-copy>
          {support.title}
        </p>
        {!compact && (
          <p className="course-card-description" data-native-copy>
            {support.subtitle}
          </p>
        )}
        {(course.review.status === "preview" ||
          support.review.status === "preview") && (
          <span className="course-card-preview">{labels.preview}</span>
        )}
        <div className="course-card-foot">
          <span>
            <BookOpen size={14} />
            {course.lessons.length} {labels.lessons}
          </span>
          <span>
            {count} / {course.lessons.length} {labels.complete}
          </span>
          <ArrowUpRight size={18} />
        </div>
        <div className="course-progress-track" aria-hidden="true">
          <i style={{ width: `${(count / course.lessons.length) * 100}%` }} />
        </div>
      </div>
    </a>
  );
}

export function CourseShelf({ compact = false }: { compact?: boolean }) {
  const { courses, error, retry } = useCurrentCourses();
  const labels = courseLabels();
  if (error)
    return (
      <div className="course-empty panel">
        <p>{labels.loadError}</p>
        <button className="btn" onClick={retry}>
          {labels.retry}
        </button>
      </div>
    );
  if (courses === null)
    return (
      <p className="course-loading" role="status">
        {labels.loading}
      </p>
    );
  if (!courses.length) return <p className="muted">{labels.noCourse}</p>;
  return (
    <div className={`course-shelf ${compact ? "is-compact" : ""}`}>
      {courses.map((item) => (
        <CourseCard key={item.course.id} item={item} compact={compact} />
      ))}
    </div>
  );
}

export function CourseContinueCard() {
  const { courses } = useCurrentCourses();
  const state = useCourseState();
  const labels = courseLabels();
  if (!courses?.length) return null;
  const item =
    courses.find((value) => value.course.id === state.last?.courseId) ??
    courses[0];
  const { course, support } = item;
  const lesson = nextCourseLesson(item, state);
  const started = course.lessons.some(
    (value) => state.lessons[courseLessonKey(course.id, value.id)],
  );
  return (
    <a
      className="course-continue panel"
      href={href({
        page: "course",
        course: course.id,
        lesson: started ? lesson?.id : undefined,
      })}
    >
      <img src={courseAsset(course.cover)} alt="" loading="lazy" />
      <div>
        <p className="eyebrow">
          <Droplets size={14} />
          {labels.course}
        </p>
        <h2 lang="en" dir="ltr">
          {course.title}
        </h2>
        <p data-native-copy>
          {lesson ? support.lessons[lesson.id]?.title : labels.allDone}
        </p>
        <span className="link">
          {started ? labels.continue : labels.open}
          <ArrowUpRight size={15} />
        </span>
      </div>
    </a>
  );
}

export function CourseProgressSummary() {
  const { courses } = useCurrentCourses();
  const state = useCourseState();
  const labels = courseLabels();
  if (!courses?.length && !courseSaveError()) return null;
  return (
    <section className="panel course-progress-summary">
      <h2>
        <Droplets size={18} />
        {labels.progress}
      </h2>
      {courseSaveError() && (
        <p className="course-save-error" role="alert">
          {labels.saveError}
        </p>
      )}
      {(courses ?? []).map((item) => {
        const { course, support } = item;
        const completed = course.lessons.filter((lesson) =>
          isCurrentCourseComplete(
            item,
            state.lessons[courseLessonKey(course.id, lesson.id)],
          ),
        ).length;
        return (
          <a key={course.id} href={href({ page: "course", course: course.id })}>
            <span data-native-copy>{support.title}</span>
            <span>
              <Check size={15} />
              {completed} / {course.lessons.length}
            </span>
            <span>
              <Clock size={14} />
              8–12 {labels.minutes}
            </span>
          </a>
        );
      })}
    </section>
  );
}
