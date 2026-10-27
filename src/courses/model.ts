import type { CourseActivity, CourseLesson } from "./types";

export interface CourseBinding {
  manifestPath: string;
  manifestHash: string;
  sourceHash: string;
  bundleHash: string;
  revision: string;
}
export interface CourseAnswer {
  value: string[];
  correct: boolean;
  firstValue: string[];
  firstCorrect: boolean;
  attempts: number;
  helpUsed: boolean;
}
export interface CourseLessonProgress {
  binding: CourseBinding;
  step: number;
  answers: Record<string, CourseAnswer>;
  draft: string;
  previousDraft?: string;
  reviewed: boolean;
  checklist: boolean[];
  helpUsed: boolean;
  completed?: number;
  translations?: string[];
  helpOpen?: boolean;
}
export interface CourseState {
  version: 1;
  datasetId: string;
  lessons: Record<string, CourseLessonProgress>;
  last?: { courseId: string; lessonId: string };
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export const safeCourseId = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,179}$/.test(v) &&
  !["__proto__", "constructor", "prototype"].includes(v);
const hash = (v: unknown): v is string =>
  typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
export const courseLessonKey = (courseId: string, lessonId: string) =>
  `${courseId}/${lessonId}`;
export const freshCourseState = (datasetId: string): CourseState => ({
  version: 1,
  datasetId,
  lessons: {},
});
export function sanitizeCourseBinding(v: unknown): CourseBinding | null {
  if (
    !record(v) ||
    typeof v.manifestPath !== "string" ||
    !/^content\/releases\/[a-zA-Z0-9._-]+\/manifest\.json$/.test(
      v.manifestPath,
    ) ||
    v.manifestPath.includes("..") ||
    !hash(v.manifestHash) ||
    !hash(v.sourceHash) ||
    !hash(v.bundleHash) ||
    !safeCourseId(v.revision)
  )
    return null;
  return {
    manifestPath: v.manifestPath,
    manifestHash: v.manifestHash,
    sourceHash: v.sourceHash,
    bundleHash: v.bundleHash,
    revision: v.revision,
  };
}
const values = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length <= 20 && v.every(safeCourseId);
export function sanitizeCourseState(
  value: unknown,
  datasetId: string,
): CourseState {
  const out = freshCourseState(datasetId);
  if (
    !record(value) ||
    value.version !== 1 ||
    value.datasetId !== datasetId ||
    !record(value.lessons)
  )
    return out;
  for (const [key, raw] of Object.entries(value.lessons).slice(0, 128)) {
    const parts = key.split("/");
    if (parts.length !== 2 || !parts.every(safeCourseId) || !record(raw))
      continue;
    const binding = sanitizeCourseBinding(raw.binding);
    if (!binding) continue;
    const answers: Record<string, CourseAnswer> = {};
    if (record(raw.answers))
      for (const [id, a] of Object.entries(raw.answers).slice(0, 128)) {
        if (
          !safeCourseId(id) ||
          !record(a) ||
          !values(a.value) ||
          !values(a.firstValue) ||
          typeof a.correct !== "boolean" ||
          typeof a.firstCorrect !== "boolean"
        )
          continue;
        answers[id] = {
          value: a.value,
          firstValue: a.firstValue,
          correct: a.correct,
          firstCorrect: a.firstCorrect,
          attempts: Number.isInteger(a.attempts)
            ? Math.max(1, Math.min(10, a.attempts as number))
            : 1,
          helpUsed: a.helpUsed === true,
        };
      }
    out.lessons[key] = {
      binding,
      step:
        typeof raw.step === "number" && Number.isInteger(raw.step)
          ? Math.max(0, Math.min(5, raw.step))
          : 0,
      answers,
      draft: typeof raw.draft === "string" ? raw.draft.slice(0, 6000) : "",
      ...(typeof raw.previousDraft === "string"
        ? { previousDraft: raw.previousDraft.slice(0, 6000) }
        : {}),
      reviewed: raw.reviewed === true,
      checklist: Array.isArray(raw.checklist)
        ? raw.checklist.slice(0, 12).map((v) => v === true)
        : [],
      helpUsed: raw.helpUsed === true,
      translations: Array.isArray(raw.translations)
        ? raw.translations.filter(safeCourseId).slice(0, 64)
        : [],
      helpOpen: raw.helpOpen === true,
      ...(typeof raw.completed === "number" &&
      Number.isFinite(raw.completed) &&
      raw.completed > 0
        ? { completed: raw.completed }
        : {}),
    };
  }
  if (
    record(value.last) &&
    safeCourseId(value.last.courseId) &&
    safeCourseId(value.last.lessonId) &&
    out.lessons[courseLessonKey(value.last.courseId, value.last.lessonId)]
  )
    out.last = { courseId: value.last.courseId, lessonId: value.last.lessonId };
  return out;
}
export function freshLessonProgress(
  binding: CourseBinding,
): CourseLessonProgress {
  return {
    binding,
    step: 0,
    answers: {},
    draft: "",
    reviewed: false,
    checklist: [],
    helpUsed: false,
  };
}
export function gradeCourseAnswer(
  activity: CourseActivity,
  value: string[],
): boolean {
  return (
    value.length === activity.answer.length &&
    value.every((v, i) => v === activity.answer[i])
  );
}
export function applyCourseAnswer(
  previous: CourseLessonProgress,
  activity: CourseActivity,
  value: string[],
  helpUsed: boolean,
): CourseLessonProgress {
  const ids = new Set(activity.choices.map((v) => v.id));
  if (
    !value.length ||
    value.some((v) => !ids.has(v)) ||
    new Set(value).size !== value.length ||
    (activity.kind === "sequence"
      ? value.length !== ids.size
      : value.length !== 1)
  )
    return previous;
  const first = previous.answers[activity.id];
  const correct = gradeCourseAnswer(activity, value);
  return {
    ...previous,
    helpUsed: previous.helpUsed || helpUsed,
    answers: {
      ...previous.answers,
      [activity.id]: {
        value: [...value],
        correct,
        firstValue: first?.firstValue ?? [...value],
        firstCorrect: first?.firstCorrect ?? correct,
        attempts: Math.min(10, (first?.attempts ?? 0) + 1),
        helpUsed: !!first?.helpUsed || helpUsed,
      },
    },
  };
}
export function canCompleteCourseLesson(
  progress: CourseLessonProgress,
  lesson: CourseLesson,
) {
  return (
    lesson.activities.every((a) => !!progress.answers[a.id]) &&
    progress.draft.trim().length >= 10 &&
    progress.reviewed &&
    progress.checklist.length === lesson.production.checklist.length &&
    progress.checklist.every(Boolean)
  );
}
