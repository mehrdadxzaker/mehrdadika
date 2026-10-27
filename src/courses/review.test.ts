import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { createAtlas } from "../atlas/data";
import type { Atlas } from "../atlas/types";
import { emptyProgress, store } from "../store/store";
import { resolveCourseAtlas, startCourseReview } from "./review";
import {
  beginCourseLesson,
  completeCourseLesson,
  courseSnapshot,
  recordCourseAnswer,
  setCourseDataset,
  updateCourseLesson,
} from "./state";
import type { CourseBinding } from "./model";
import type { CourseLesson, LocalizedCourse } from "./types";

const binding: CourseBinding = {
  manifestPath: "content/releases/old-course/manifest.json",
  manifestHash: "a".repeat(64),
  bundleHash: "b".repeat(64),
  sourceHash: "c".repeat(64),
  revision: "one",
};
const lesson: CourseLesson = {
  id: "observe",
  title: "Observe",
  question: "Where is water?",
  englishGoal: "Describe",
  scienceGoal: "Observe",
  minutes: 10,
  image: "diagram.svg",
  imageAlt: "River",
  sentences: [],
  targetSenseIds: ["library:meaning-1"],
  pattern: "There is",
  patternExample: "There is a library.",
  activities: [
    {
      id: "location",
      kind: "choice",
      checks: "english",
      prompt: "Where?",
      choices: [
        { id: "in", text: "in" },
        { id: "because", text: "because" },
      ],
      answer: ["in"],
      explanation: "In introduces a location.",
    },
  ],
  production: {
    prompt: "Describe",
    starter: "There is",
    models: ["There is water.", "I can see water."],
    checklist: ["Meaning", "English"],
  },
};
const localized = {
  course: { id: "water", revision: "one", lessons: [lesson] },
  sourceHash: binding.sourceHash,
} as LocalizedCourse;

function rawAtlas(): Atlas {
  const atlas = createAtlas(
    {
      entries: [
        {
          id: "library",
          w: "library",
          uk: "",
          us: "",
          senses: [
            {
              id: "library:meaning-1",
              pos: "n.",
              fa: "کتابخانه",
              en: "Older definition",
            },
          ],
          ex: [],
          col: [],
          fam: [],
          syn: [],
          ant: [],
          tip: "",
          cefr: "A1",
          topic: "science",
          m: 0,
        },
      ],
      courses: {
        path: `content/courses/${binding.bundleHash}.json`,
        sha256: binding.bundleHash,
      },
    },
    {
      schemaVersion: 1,
      corpusId: "atlas",
      name: "Atlas",
      release: {
        id: "old-course",
        channel: "preview",
        schemaVersion: 1,
        createdAt: "2026-10-26T00:00:00Z",
      },
      payload: { path: "unused", sha256: "unused" },
      taxonomy: {
        domains: [
          {
            id: "science",
            labelEn: "Science",
            labelFa: "علوم",
            subcategories: [],
            discoveryGroupId: "all",
          },
        ],
        discoveryGroups: [],
      },
      assets: [],
    },
  );
  atlas.release = {
    ...atlas.release!,
    manifestPath: binding.manifestPath,
    manifestHash: binding.manifestHash,
  };
  atlas.learning!.release = atlas.release;
  return atlas;
}
async function browserLocation<T>(
  hash: string,
  action: () => Promise<T>,
): Promise<T> {
  const keys = ["location", "history", "document"] as const;
  const saved = Object.fromEntries(
    keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  const location = { hash };
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: location,
  });
  Object.defineProperty(globalThis, "history", {
    configurable: true,
    value: {
      pushState: (_state: unknown, _unused: string, url: string) => {
        location.hash = url;
      },
      replaceState: (_state: unknown, _unused: string, url: string) => {
        location.hash = url;
      },
    },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {},
  });
  try {
    return await action();
  } finally {
    for (const key of keys) {
      if (saved[key]) Object.defineProperty(globalThis, key, saved[key]!);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

test("course completion records participation without creating or grading vocabulary cards", async () => {
  const datasetId = "course-completion-fixture";
  await store.useDataset(datasetId);
  store.progress(() => emptyProgress(datasetId));
  await store.settled();
  setCourseDataset(datasetId);
  const before = structuredClone(store.get().progress);
  assert.equal(beginCourseLesson(localized, lesson, rawAtlas()), true);
  recordCourseAnswer(
    "water",
    lesson.id,
    lesson.activities[0],
    ["because"],
    false,
  );
  updateCourseLesson("water", lesson.id, {
    draft: "There is water in the river.",
    reviewed: true,
    checklist: [true, true],
  });
  assert.equal(completeCourseLesson("water", lesson), true);
  assert.deepEqual(store.get().progress, before);
});

test("course-linked vocabulary review preserves the exact release and an existing active session", async () => {
  await browserLocation("#/", async () => {
    const atlas = rawAtlas();
    await store.useDataset("course-review-fixture");
    store.progress(() => emptyProgress("course-review-fixture"));
    await store.settled();
    assert.equal(await startCourseReview(atlas, localized, lesson), "started");
    const session = store.get().progress.session!;
    assert.equal(session.manifestHash, binding.manifestHash);
    assert.equal(session.manifestPath, binding.manifestPath);
    assert.ok(session.steps.every((step) => step.id === "library:meaning-1"));
    assert.deepEqual(store.get().progress.cards, {});
    assert.equal(
      await startCourseReview(atlas, localized, {
        ...lesson,
        targetSenseIds: ["missing:meaning"],
      }),
      "resumed",
    );
    assert.equal(store.get().progress.session!.id, session.id);
    store.progress((progress) => ({ ...progress, session: null }));
    assert.equal(
      await startCourseReview(atlas, localized, {
        ...lesson,
        targetSenseIds: ["missing:meaning"],
      }),
      "unavailable",
    );
    await store.settled();
  });
});

test("same English source does not silently rebind progress to a changed support bundle", () => {
  setCourseDataset("course-binding-fixture");
  const atlas = rawAtlas();
  assert.equal(beginCourseLesson(localized, lesson, atlas), true);
  const changed = {
    ...atlas,
    courses: { ...atlas.courses!, sha256: "d".repeat(64) },
  };
  assert.equal(beginCourseLesson(localized, lesson, changed), false);
  assert.equal(
    courseSnapshot().lessons["water/observe"].binding.bundleHash,
    binding.bundleHash,
  );
  assert.equal(
    courseSnapshot().lessons["water/observe"].binding.manifestHash,
    binding.manifestHash,
  );
});

test("an older Portuguese course resolves its raw manifest and reapplies matching native vocabulary", async () => {
  await browserLocation("#/pt-BR/courses/water/observe", async () => {
    const original = globalThis.fetch;
    const sha = (text: string) =>
      createHash("sha256").update(text).digest("hex");
    const atlas = rawAtlas();
    const entry = await atlas.entry("library");
    const payloadText = JSON.stringify({
      entries: [entry],
      courses: atlas.courses,
    });
    const payloadHash = sha(payloadText);
    const payloadPath = `content/indexes/${payloadHash}.json`;
    const manifestText = JSON.stringify({
      schemaVersion: 1,
      corpusId: "atlas",
      name: "Atlas",
      release: atlas.release,
      payload: { path: payloadPath, sha256: payloadHash },
      taxonomy: { domains: atlas.domains, discoveryGroups: [] },
      assets: [],
    });
    const manifestHash = sha(manifestText);
    const files: Record<string, string> = {
      [binding.manifestPath]: manifestText,
      [payloadPath]: payloadText,
    };
    globalThis.fetch = async (input) => {
      const body = files[String(input).replace(/^\//, "")];
      return body
        ? new Response(body)
        : new Response("missing", { status: 404 });
    };
    try {
      const current = {
        ...atlas,
        id: "atlas:pt-BR",
        release: { ...atlas.release!, manifestHash: "f".repeat(64) },
      };
      const restored = await resolveCourseAtlas(current, {
        ...binding,
        manifestHash,
      });
      assert.equal(restored.id, "atlas:pt-BR");
      assert.equal(restored.release?.manifestHash, manifestHash);
      assert.equal(restored.courses?.sha256, binding.bundleHash);
      const word = await restored.entry("library:meaning-1");
      assert.equal(word.senses[0].fa, "biblioteca");
      assert.equal(word.senses[0].en, "Older definition");
    } finally {
      globalThis.fetch = original;
    }
  });
});
