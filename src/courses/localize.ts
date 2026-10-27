import type { UiLocale } from "../i18n/locale";
import type {
  CourseBundle,
  CourseLesson,
  CourseOverlay,
  LocalizedCourse,
} from "./types";

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const eligible = (publication: unknown) =>
  publication === "preview" || publication === "published";

function completeLesson(lesson: CourseLesson, overlay: CourseOverlay) {
  const support = overlay.lessons?.[lesson.id];
  return (
    record(support) &&
    [
      support.title,
      support.question,
      support.englishGoal,
      support.scienceGoal,
      support.imageAlt,
      support.patternTip,
    ].every(text) &&
    record(support.sentences) &&
    lesson.sentences.every((sentence) =>
      text(support.sentences[sentence.id]),
    ) &&
    record(support.activities) &&
    lesson.activities.every((activity) => {
      const translated = support.activities[activity.id];
      return (
        record(translated) &&
        text(translated.prompt) &&
        text(translated.explanation)
      );
    }) &&
    record(support.production) &&
    text(support.production.prompt) &&
    text(support.production.starterTip) &&
    Array.isArray(support.production.checklist) &&
    support.production.checklist.length ===
      lesson.production.checklist.length &&
    support.production.checklist.every(text)
  );
}

/** Select complete, source-bound support only. Native overlays never replace English answers. */
export function localizeCourseCatalog(
  bundle: CourseBundle,
  locale: UiLocale,
): LocalizedCourse[] {
  if (
    !bundle ||
    bundle.schemaVersion !== 1 ||
    !Array.isArray(bundle.courses) ||
    !Array.isArray(bundle.overlays) ||
    !record(bundle.sourceHashes)
  )
    return [];
  return bundle.courses.flatMap((course) => {
    const sourceHash = bundle.sourceHashes[course.id];
    if (
      !eligible(course.publication) ||
      !/^[a-f0-9]{64}$/.test(sourceHash) ||
      !Array.isArray(course.lessons)
    )
      return [];
    const support = bundle.overlays.find(
      (overlay) =>
        overlay.locale === locale &&
        overlay.courseId === course.id &&
        eligible(overlay.publication) &&
        overlay.sourceHash === sourceHash,
    );
    if (
      !support ||
      !course.lessons.every((lesson) => completeLesson(lesson, support))
    )
      return [];
    return [{ course, support, sourceHash }];
  });
}
