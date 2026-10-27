import type { Atlas } from "../atlas/types";
import { resolveSessionAtlas } from "../atlas/data";
import { currentUiLocale } from "../i18n/locale";
import { loadVocabularyLocale, localizeAtlas } from "../i18n/atlas";
import { buildSession } from "../store/session";
import { store } from "../store/store";
import { go } from "../lib/router";
import type { CourseBinding } from "./model";
import type { CourseLesson, LocalizedCourse } from "./types";

export async function resolveCourseAtlas(
  atlas: Atlas,
  binding?: CourseBinding,
): Promise<Atlas> {
  if (!binding) return atlas;
  if (atlas.release?.manifestHash === binding.manifestHash) {
    if (atlas.courses?.sha256 !== binding.bundleHash)
      throw new Error("Pinned course bundle unavailable");
    return atlas;
  }
  const base = { ...atlas, id: atlas.id.replace(/:(?:pt-BR|es-419)$/, "") };
  const restored = await resolveSessionAtlas(base, binding);
  if (
    restored.unavailable ||
    restored.atlas.release?.manifestHash !== binding.manifestHash ||
    restored.atlas.courses?.sha256 !== binding.bundleHash
  )
    throw new Error("Pinned course release unavailable");
  const locale = currentUiLocale();
  if (locale === "fa") return restored.atlas;
  return localizeAtlas(
    restored.atlas,
    locale,
    await loadVocabularyLocale(locale),
  );
}
export async function startCourseReview(
  atlas: Atlas,
  localized: LocalizedCourse,
  lesson: CourseLesson,
): Promise<"started" | "resumed" | "unavailable"> {
  const current = store.get();
  if (current.progress.session && !current.progress.session.finished) {
    go({ page: "learn" });
    return "resumed";
  }
  const learning = atlas.learning ?? atlas;
  if (
    !lesson.targetSenseIds.length ||
    lesson.targetSenseIds.some((id) => !learning.byId.has(id))
  )
    return "unavailable";
  if (localized.course.lessons.every((l) => l.id !== lesson.id))
    return "unavailable";
  const session = buildSession(learning, current.progress, current.settings, {
    ids: lesson.targetSenseIds,
  });
  if (!session.steps.length) return "unavailable";
  store.progress((p) => ({ ...p, session }));
  go({ page: "learn" });
  return "started";
}
