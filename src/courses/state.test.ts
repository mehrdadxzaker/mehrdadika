import assert from "node:assert/strict";
import { test } from "node:test";
import {
  courseSnapshot,
  courseLessonKey,
  courseStorageKey,
  restoreCourses,
  setCourseDataset,
  updateCourseLesson,
} from "./state";
import { freshLessonProgress } from "./model";
import {
  exportBackup,
  importBackup,
  resetProgress,
  store,
} from "../store/store";

test("course drafts are isolated across editions and old backups clear course state", async () => {
  await store.useDataset("course-state-test:pt-BR");
  const key = courseLessonKey("water", "puddles");
  const binding = {
    manifestPath: "content/releases/science-1/manifest.json",
    manifestHash: "a".repeat(64),
    sourceHash: "b".repeat(64),
    bundleHash: "c".repeat(64),
    revision: "science-1",
  };
  restoreCourses({
    version: 1,
    datasetId: "course-state-test:pt-BR",
    lessons: {
      [key]: { ...freshLessonProgress(binding), draft: "A puddle dries." },
    },
  });
  const backup = JSON.parse(exportBackup());
  await store.useDataset("course-state-test:es-419");
  assert.equal(courseSnapshot().lessons[key], undefined);
  assert.equal(importBackup(JSON.stringify(backup)).ok, false);
  await store.useDataset("course-state-test:pt-BR");
  assert.equal(courseSnapshot().lessons[key].draft, "A puddle dries.");
  const old = { ...backup };
  delete old.courses;
  assert.equal(importBackup(JSON.stringify(old)).ok, true);
  assert.deepEqual(courseSnapshot().lessons, {});
  assert.equal(importBackup(JSON.stringify(backup)).ok, true);
  updateCourseLesson("water", "puddles", { draft: "A puddle slowly dries." });
  assert.equal(courseSnapshot().lessons[key].draft, "A puddle slowly dries.");
  resetProgress();
  assert.deepEqual(courseSnapshot().lessons, {});
  assert.deepEqual(store.get().progress.cards, {});
  setCourseDataset("uninitialized");
});
test("switching editions reads changes saved by another tab instead of a stale cached draft", () => {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => storage.set(k, v),
      },
    },
  });
  try {
    const dataset = "cross-tab:pt-BR",
      key = courseLessonKey("water", "puddles");
    const binding = {
      manifestPath: "content/releases/science-1/manifest.json",
      manifestHash: "a".repeat(64),
      sourceHash: "b".repeat(64),
      bundleHash: "c".repeat(64),
      revision: "science-1",
    };
    setCourseDataset(dataset);
    restoreCourses({
      version: 1,
      datasetId: dataset,
      lessons: {
        [key]: { ...freshLessonProgress(binding), draft: "First tab" },
      },
    });
    setCourseDataset("cross-tab:fa");
    const remote = JSON.parse(storage.get(courseStorageKey(dataset))!);
    remote.lessons[key].draft = "A newer explanation from another tab.";
    storage.set(courseStorageKey(dataset), JSON.stringify(remote));
    setCourseDataset(dataset);
    assert.equal(
      courseSnapshot().lessons[key].draft,
      remote.lessons[key].draft,
    );
  } finally {
    Reflect.deleteProperty(globalThis, "window");
    setCourseDataset("uninitialized");
  }
});
