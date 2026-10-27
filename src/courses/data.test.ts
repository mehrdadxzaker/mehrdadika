import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import type { Atlas } from "../atlas/types";
import type { CourseBundle, CourseOverlay, ScienceCourse } from "./types";
import { loadCourseCatalog, loadPinnedCourseCatalog } from "./data";
import { localizeCourseCatalog } from "./localize";

function courseFixture(): CourseBundle {
  const course: ScienceCourse = {
    id: "water",
    revision: "1",
    title: "Water",
    subtitle: "English through science",
    level: "A2",
    subjectDepth: "Introductory",
    cover: "content/media/cover.webp",
    visualStyle: "Paper",
    publication: "preview",
    review: { status: "preview", humanReviewed: false },
    provenance: { license: "CC-BY-4.0", source: "Fixture", aiAssisted: true },
    lessons: [
      {
        id: "observe",
        title: "Observe",
        question: "Where is water?",
        englishGoal: "Describe",
        scienceGoal: "Observe",
        minutes: 10,
        image: "content/media/diagram.svg",
        imageAlt: "River",
        sentences: [{ id: "s1", en: "There is water in the river." }],
        targetSenseIds: ["water:liquid"],
        pattern: "There is",
        patternExample: "There is water.",
        activities: [
          {
            id: "a1",
            kind: "choice",
            checks: "english",
            prompt: "Choose",
            choices: [
              { id: "one", text: "Water" },
              { id: "two", text: "Rock" },
            ],
            answer: ["one"],
            explanation: "The river has water.",
          },
        ],
        production: {
          prompt: "Describe",
          starter: "There is",
          models: ["There is water.", "The river has water."],
          checklist: ["Meaning"],
        },
      },
    ],
  };
  const overlays: CourseOverlay[] = (["fa", "pt-BR", "es-419"] as const).map(
    (locale) => ({
      schemaVersion: 1,
      locale,
      courseId: "water",
      sourceHash: "a".repeat(64),
      publication: "preview",
      review: { status: "preview", humanReviewed: false },
      title: `${locale} Water`,
      subtitle: "English",
      lessons: {
        observe: {
          title: "Water",
          question: "Where?",
          englishGoal: "Describe",
          scienceGoal: "Observe",
          imageAlt: "A river",
          sentences: { s1: `${locale} translation` },
          patternTip: "Location",
          activities: { a1: { prompt: "Choose", explanation: "A river" } },
          production: {
            prompt: "Write",
            starterTip: "Start",
            checklist: ["Meaning"],
          },
        },
      },
    }),
  );
  return {
    schemaVersion: 1,
    sourceHashes: { water: "a".repeat(64) },
    courses: [course],
    overlays,
  };
}

test("support selection preserves English and grading while withholding stale or incomplete editions", () => {
  const bundle = courseFixture();
  const fa = localizeCourseCatalog(bundle, "fa")[0];
  const pt = localizeCourseCatalog(bundle, "pt-BR")[0];
  assert.equal(fa.course, pt.course);
  assert.deepEqual(fa.course.lessons[0].activities[0].answer, ["one"]);
  assert.notEqual(fa.support.title, pt.support.title);
  bundle.overlays[0].sourceHash = "b".repeat(64);
  assert.equal(localizeCourseCatalog(bundle, "fa").length, 0);
  delete bundle.overlays[1].lessons.observe.sentences.s1;
  assert.equal(localizeCourseCatalog(bundle, "pt-BR").length, 0);
  assert.equal(localizeCourseCatalog(bundle, "es-419").length, 1);
});

test("older atlas releases without a course remain usable and make no course request", async () => {
  assert.deepEqual(await loadCourseCatalog({} as Atlas, "fa"), []);
});

test("course loader verifies integrity, evicts a failed request, and reuses one successful bundle across editions", async () => {
  const original = globalThis.fetch;
  const body = JSON.stringify(courseFixture());
  const sha256 = createHash("sha256").update(body).digest("hex");
  const atlas = {
    courses: { path: `content/courses/${sha256}.json`, sha256 },
  } as Atlas;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return new Response(requests === 1 ? "tampered" : body);
  };
  try {
    await assert.rejects(loadCourseCatalog(atlas, "fa"), /یکپارچگی/);
    assert.equal((await loadCourseCatalog(atlas, "fa")).length, 1);
    assert.equal((await loadCourseCatalog(atlas, "pt-BR")).length, 1);
    assert.equal(requests, 2);
  } finally {
    globalThis.fetch = original;
  }
});

test("pinned loader reports unavailable content rather than substituting the latest release", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("missing", { status: 404 });
  try {
    const current = {
      id: "atlas",
      release: { manifestHash: "a".repeat(64) },
    } as Atlas;
    const result = await loadPinnedCourseCatalog(current, "fa", {
      manifestPath: "content/releases/old/manifest.json",
      manifestHash: "b".repeat(64),
    });
    assert.equal(result.unavailable, true);
    assert.deepEqual(result.courses, []);
  } finally {
    globalThis.fetch = original;
  }
});

test("pinned loader restores the matching vocabulary and course bundle from one older manifest", async () => {
  const original = globalThis.fetch;
  const bundle = courseFixture();
  bundle.courses[0].title = "Older course title";
  const bundleText = JSON.stringify(bundle);
  const sha = (value: string) =>
    createHash("sha256").update(value).digest("hex");
  const bundleHash = sha(bundleText);
  const coursePath = `content/courses/${bundleHash}.json`;
  const payloadText = JSON.stringify({
    entries: [
      {
        id: "water",
        w: "water",
        uk: "",
        us: "",
        cefr: "A1",
        topic: "science",
        senses: [
          { id: "water:liquid", pos: "n.", fa: "Water", en: "Older meaning" },
        ],
        ex: [],
        col: [],
        fam: [],
        syn: [],
        ant: [],
        tip: "",
        m: 0,
      },
    ],
    courses: { path: coursePath, sha256: bundleHash },
  });
  const payloadHash = sha(payloadText);
  const payloadPath = `content/indexes/${payloadHash}.json`;
  const manifestText = JSON.stringify({
    schemaVersion: 1,
    corpusId: "atlas",
    name: "Atlas",
    release: {
      id: "older",
      channel: "preview",
      schemaVersion: 1,
      createdAt: "2026-10-26T00:00:00Z",
    },
    payload: { path: payloadPath, sha256: payloadHash },
    taxonomy: {
      domains: [
        {
          id: "science",
          labelEn: "Science",
          labelFa: "Science",
          subcategories: [],
          discoveryGroupId: "all",
        },
      ],
      discoveryGroups: [],
    },
    assets: [],
  });
  const manifestHash = sha(manifestText);
  const files: Record<string, string> = {
    "content/releases/older/manifest.json": manifestText,
    [payloadPath]: payloadText,
    [coursePath]: bundleText,
  };
  globalThis.fetch = async (input) => {
    const body = files[String(input).replace(/^\//, "")];
    return body ? new Response(body) : new Response("missing", { status: 404 });
  };
  try {
    const current = {
      id: "atlas",
      release: { manifestHash: "f".repeat(64) },
    } as Atlas;
    const result = await loadPinnedCourseCatalog(current, "fa", {
      manifestPath: "content/releases/older/manifest.json",
      manifestHash,
    });
    assert.equal(result.unavailable, false);
    assert.equal(result.atlas.release?.manifestHash, manifestHash);
    assert.equal(result.atlas.courses?.sha256, bundleHash);
    assert.equal(result.courses[0].course.title, "Older course title");
    assert.equal(
      (await result.atlas.entry("water:liquid")).senses[0].en,
      "Older meaning",
    );
  } finally {
    globalThis.fetch = original;
  }
});
