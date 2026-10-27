import type { Atlas } from "../atlas/types";
import { jsonFile, resolveSessionAtlas } from "../atlas/data";
import type { UiLocale } from "../i18n/locale";
import type { CourseBundle, LocalizedCourse } from "./types";
import { localizeCourseCatalog } from "./localize";

const bundles = new Map<string, Promise<CourseBundle>>();

/** Reuses the atlas four-request pool and 15-second timeout, including offline fetch handling. */
export async function loadCourseCatalog(
  atlas: Atlas,
  locale: UiLocale,
): Promise<LocalizedCourse[]> {
  if (!atlas.courses) return [];
  const ref = atlas.courses;
  if (
    !/^content\/courses\/[a-f0-9]{64}\.json$/.test(ref.path) ||
    !/^[a-f0-9]{64}$/.test(ref.sha256)
  )
    throw new Error("Invalid course bundle reference");
  const key = `${ref.path}:${ref.sha256}`;
  let pending = bundles.get(key);
  if (!pending) {
    pending = jsonFile<CourseBundle>(ref.path, ref.sha256).catch((error) => {
      bundles.delete(key);
      throw error;
    });
    bundles.set(key, pending);
    if (bundles.size > 6) bundles.delete(bundles.keys().next().value!);
  }
  return localizeCourseCatalog(await pending, locale);
}

export async function loadPinnedCourseCatalog(
  current: Atlas,
  locale: UiLocale,
  pin: { manifestPath?: string; manifestHash?: string; releaseId?: string },
): Promise<{ atlas: Atlas; courses: LocalizedCourse[]; unavailable: boolean }> {
  const restored = await resolveSessionAtlas(current, pin);
  if (restored.unavailable)
    return { atlas: current, courses: [], unavailable: true };
  try {
    return {
      atlas: restored.atlas,
      courses: await loadCourseCatalog(restored.atlas, locale),
      unavailable: false,
    };
  } catch {
    return { atlas: restored.atlas, courses: [], unavailable: true };
  }
}
