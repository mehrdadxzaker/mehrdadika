import { useSyncExternalStore } from "react";
import type { Atlas } from "../atlas/types";
import type { CourseActivity, CourseLesson, LocalizedCourse } from "./types";
import {
  applyCourseAnswer,
  canCompleteCourseLesson,
  courseLessonKey,
  freshCourseState,
  freshLessonProgress,
  sanitizeCourseBinding,
  sanitizeCourseState,
  type CourseLessonProgress,
  type CourseState,
} from "./model";
export { courseLessonKey } from "./model";
export type { CourseLessonProgress, CourseState, CourseBinding } from "./model";

let datasetId = "uninitialized";
let state: CourseState = freshCourseState(datasetId);
let saveError = false;
const cache = new Map<string, CourseState>();
const failures = new Map<string, boolean>();
const listeners = new Set<() => void>();
export const courseStorageKey = (id: string) =>
  `mehrdadika:courses:v1:${encodeURIComponent(id)}`;
const emit = () => listeners.forEach((fn) => fn());
function save(next: CourseState) {
  state = sanitizeCourseState(next, datasetId);
  cache.set(datasetId, state);
  try {
    if (typeof window !== "undefined")
      window.localStorage.setItem(
        courseStorageKey(datasetId),
        JSON.stringify(state),
      );
    saveError = false;
  } catch {
    saveError = true;
  }
  failures.set(datasetId, saveError);
  emit();
}
export function setCourseDataset(next: string) {
  if (next === datasetId) return;
  cache.set(datasetId, state);
  failures.set(datasetId, saveError);
  datasetId = next;
  if (failures.get(next) && cache.has(next)) state = cache.get(next)!;
  else {
    try {
      state =
        typeof window !== "undefined"
          ? sanitizeCourseState(
              JSON.parse(
                window.localStorage.getItem(courseStorageKey(next)) ?? "null",
              ),
              next,
            )
          : (cache.get(next) ?? freshCourseState(next));
    } catch {
      state = cache.get(next) ?? freshCourseState(next);
    }
  }
  saveError = failures.get(next) ?? false;
  emit();
}
export function useCourseState() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
    () => state,
  );
}
export const courseSnapshot = () => state;
export const courseSaveError = () => saveError;
export function restoreCourses(value: unknown) {
  save(sanitizeCourseState(value, datasetId));
}
export function beginCourseLesson(
  localized: LocalizedCourse,
  lesson: CourseLesson,
  atlas: Atlas,
): boolean {
  const binding = sanitizeCourseBinding({
    manifestPath: atlas.release?.manifestPath,
    manifestHash: atlas.release?.manifestHash,
    sourceHash: localized.sourceHash,
    bundleHash: atlas.courses?.sha256,
    revision: localized.course.revision,
  });
  if (!binding) return false;
  const key = courseLessonKey(localized.course.id, lesson.id);
  const prev = state.lessons[key];
  if (
    prev &&
    (prev.binding.sourceHash !== binding.sourceHash ||
      prev.binding.bundleHash !== binding.bundleHash)
  )
    return false;
  save({
    ...state,
    last: { courseId: localized.course.id, lessonId: lesson.id },
    lessons: { ...state.lessons, [key]: prev ?? freshLessonProgress(binding) },
  });
  return true;
}
export function updateCourseLesson(
  courseId: string,
  lessonId: string,
  patch: Partial<CourseLessonProgress>,
) {
  const key = courseLessonKey(courseId, lessonId),
    prev = state.lessons[key];
  if (!prev) return;
  const next = { ...prev };
  if (patch.step !== undefined) next.step = patch.step;
  if (patch.helpUsed !== undefined)
    next.helpUsed = prev.helpUsed || patch.helpUsed;
  if (patch.translations !== undefined) next.translations = patch.translations;
  if (patch.helpOpen !== undefined) next.helpOpen = patch.helpOpen;
  if (patch.draft !== undefined && patch.draft !== prev.draft) {
    if (prev.reviewed) next.previousDraft = prev.draft;
    next.draft = patch.draft.slice(0, 6000);
    next.reviewed = false;
    next.checklist = [];
    delete next.completed;
  }
  if (patch.reviewed !== undefined) next.reviewed = patch.reviewed;
  if (patch.checklist !== undefined) next.checklist = patch.checklist;
  save({ ...state, lessons: { ...state.lessons, [key]: next } });
}
export function recordCourseAnswer(
  courseId: string,
  lessonId: string,
  activity: CourseActivity,
  value: string[],
  helpUsed: boolean,
) {
  const key = courseLessonKey(courseId, lessonId),
    prev = state.lessons[key];
  if (prev)
    save({
      ...state,
      lessons: {
        ...state.lessons,
        [key]: applyCourseAnswer(prev, activity, value, helpUsed),
      },
    });
}
export function completeCourseLesson(
  courseId: string,
  lesson: CourseLesson,
): boolean {
  const key = courseLessonKey(courseId, lesson.id),
    prev = state.lessons[key];
  if (!prev || !canCompleteCourseLesson(prev, lesson)) return false;
  save({
    ...state,
    lessons: {
      ...state.lessons,
      [key]: { ...prev, step: 5, completed: prev.completed ?? Date.now() },
    },
  });
  return true;
}
if (typeof window !== "undefined")
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== courseStorageKey(datasetId)) return;
    if (event.key === null) cache.clear();
    try {
      state = sanitizeCourseState(
        JSON.parse(event.newValue ?? "null"),
        datasetId,
      );
      saveError = false;
      cache.set(datasetId, state);
      failures.delete(datasetId);
      emit();
    } catch {
      /* ignore corrupt external writes */
    }
  });
