import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  COURSE_LOCALES,
  courseSourceHash,
  courseOverlayHash,
  validateCourse,
  validateCourseOverlay,
  compileCourseSources,
} from "./course-validation.mjs";
import { prepareContent } from "./build-content.mjs";

function waterFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mehrdadika-course-"));
  fs.mkdirSync(path.join(root, "public/figures"), { recursive: true });
  fs.mkdirSync(path.join(root, "content/courses"), { recursive: true });
  fs.mkdirSync(path.join(root, "content/locales"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "public/figures/water.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg"><title>Water</title></svg>',
  );
  const sentences = [
    {
      id: "observation",
      en: "There is water in the river. ".repeat(16).trim(),
    },
  ];
  const course = {
    id: "fixture-science",
    revision: "1",
    title: "Water",
    subtitle: "Describe an observation",
    level: "A2",
    subjectDepth: "Introductory",
    cover: "figures/water.svg",
    visualStyle: "Paper field guide",
    publication: "preview",
    review: { status: "preview", humanReviewed: false },
    provenance: {
      license: "CC-BY-4.0",
      source: "Original fixture",
      aiAssisted: true,
    },
    lessons: [
      {
        id: "water-around-us",
        title: "Water around us",
        question: "Where is the water?",
        englishGoal: "Describe a place",
        scienceGoal: "Recognize water",
        minutes: 10,
        image: "figures/water.svg",
        imageAlt: "Water in a river",
        sentences,
        targetSenseIds: ["water:liquid"],
        pattern: "There is",
        patternExample: "There is water in the lake.",
        activities: ["choice", "cloze", "label", "sequence"].map(
          (kind, index) => ({
            id: `activity-${index}`,
            kind,
            checks: index < 2 ? "english" : "science",
            prompt: "Choose an observation.",
            choices: [
              { id: "water", text: "Water" },
              { id: "rock", text: "Rock" },
            ],
            answer: kind === "sequence" ? ["water", "rock"] : ["water"],
            explanation: "The diagram shows water.",
          }),
        ),
        production: {
          prompt: "Describe the river.",
          starter: "There is…",
          models: ["There is water in the river.", "The river has water."],
          checklist: ["Use a location.", "Communicate the observation."],
        },
      },
    ],
  };
  const sourceHash = courseSourceHash(course, { root });
  const overlays = COURSE_LOCALES.map((locale) => ({
    schemaVersion: 1,
    locale,
    courseId: course.id,
    sourceHash,
    publication: "preview",
    review: { status: "preview", humanReviewed: false },
    title: "Water support",
    subtitle: "Support in the learner language",
    lessons: {
      "water-around-us": {
        title: "Water support",
        question: "Where is water?",
        englishGoal: "Describe a location",
        scienceGoal: "Recognize water",
        imageAlt: "A river",
        sentences: { observation: "Native support text" },
        patternTip: "Use a location phrase.",
        activities: Object.fromEntries(
          course.lessons[0].activities.map((activity) => [
            activity.id,
            { prompt: "Choose", explanation: "Water is shown." },
          ]),
        ),
        production: {
          prompt: "Write a description",
          starterTip: "Start with a location",
          checklist: ["Location", "Meaning"],
        },
      },
    },
  }));
  const save = () => {
    fs.writeFileSync(
      path.join(root, "content/courses/fixture.json"),
      JSON.stringify(course),
    );
    for (const overlay of overlays)
      fs.writeFileSync(
        path.join(
          root,
          `content/locales/courses.${course.id}.${overlay.locale}.json`,
        ),
        JSON.stringify(overlay),
      );
  };
  save();
  return {
    root,
    course,
    overlays,
    sourceHash,
    save,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

test("course compilation preserves shared English identities and all three exact support bindings", () => {
  const fixture = waterFixture();
  try {
    const bundle = compileCourseSources({
      root: fixture.root,
      senseIds: new Set(["water:liquid"]),
      rewriteAsset: () => "content/media/hashed.svg",
    });
    assert.deepEqual(
      bundle.overlays.map((overlay) => overlay.locale),
      COURSE_LOCALES,
    );
    assert.equal(bundle.sourceHashes[fixture.course.id], fixture.sourceHash);
    assert.equal(bundle.courses[0].lessons[0].activities[0].answer[0], "water");
    assert.equal(
      bundle.courses[0].lessons[0].image,
      "content/media/hashed.svg",
    );
    assert.equal(fixture.course.lessons[0].image, "figures/water.svg");
  } finally {
    fixture.cleanup();
  }
});

test("changed English, answers or diagram bytes invalidate existing translations", () => {
  const fixture = waterFixture();
  try {
    fixture.course.lessons[0].activities[0].answer = ["rock"];
    fixture.save();
    assert.throws(
      () => compileCourseSources({ root: fixture.root }),
      /binding is stale/,
    );
    fixture.course.lessons[0].activities[0].answer = ["water"];
    fs.writeFileSync(
      path.join(fixture.root, "public/figures/water.svg"),
      "changed diagram",
    );
    assert.throws(
      () =>
        validateCourseOverlay(
          fixture.overlays[0],
          fixture.course,
          courseSourceHash(fixture.course, { root: fixture.root }),
        ),
      /binding is stale/,
    );
  } finally {
    fixture.cleanup();
  }
});

test("missing support, unsafe identities and dangling exercise targets fail closed", () => {
  const fixture = waterFixture();
  try {
    delete fixture.overlays[0].lessons["water-around-us"].sentences.observation;
    assert.throws(
      () =>
        validateCourseOverlay(
          fixture.overlays[0],
          fixture.course,
          fixture.sourceHash,
        ),
      /sentence support/,
    );
    assert.throws(
      () =>
        validateCourse(fixture.course, {
          root: fixture.root,
          senseIds: new Set(),
        }),
      /unknown target sense/,
    );
    fixture.course.lessons[0].activities[0].answer = ["missing"];
    assert.throws(
      () => validateCourse(fixture.course, { root: fixture.root }),
      /dangling answer/,
    );
    fixture.course.lessons[0].activities[0].answer = ["water"];
    fixture.course.lessons[0].id = "__proto__";
    assert.throws(
      () => validateCourse(fixture.course, { root: fixture.root }),
      /invalid or duplicate IDs/,
    );
  } finally {
    fixture.cleanup();
  }
});

test("course and support approvals bind separately to exact material, including science review", () => {
  const fixture = waterFixture();
  try {
    fixture.course.publication = "published";
    assert.throws(
      () => validateCourse(fixture.course, { root: fixture.root }),
      /human language review/,
    );
    fixture.course.review = {
      status: "approved",
      humanReviewed: true,
      reviewer: "Language fixture",
      contentHash: fixture.sourceHash,
    };
    assert.throws(
      () => validateCourse(fixture.course, { root: fixture.root }),
      /science review/,
    );
    Object.assign(fixture.course.review, {
      domainReviewer: "Science fixture",
      domainQualified: true,
    });
    assert.equal(
      validateCourse(fixture.course, { root: fixture.root }),
      fixture.sourceHash,
    );
    const overlay = fixture.overlays[0];
    overlay.publication = "published";
    assert.throws(
      () => validateCourseOverlay(overlay, fixture.course, fixture.sourceHash),
      /human language review/,
    );
    overlay.review = {
      status: "approved",
      humanReviewed: true,
      reviewer: "Native fixture",
      contentHash: courseOverlayHash(overlay),
    };
    validateCourseOverlay(overlay, fixture.course, fixture.sourceHash);
    overlay.title = "Changed translation";
    assert.throws(
      () => validateCourseOverlay(overlay, fixture.course, fixture.sourceHash),
      /digest/,
    );
  } finally {
    fixture.cleanup();
  }
});

test("draft and withdrawn courses/support do not enter learner artifacts", () => {
  const fixture = waterFixture();
  try {
    fixture.overlays[0].publication = "draft";
    fixture.save();
    assert.equal(
      compileCourseSources({ root: fixture.root }).overlays.length,
      2,
    );
    fixture.course.publication = "withdrawn";
    fixture.save();
    assert.equal(
      compileCourseSources({ root: fixture.root }).courses.length,
      0,
    );
  } finally {
    fixture.cleanup();
  }
});

test("approval hashing retains translated text whose stable ID resembles review metadata", () => {
  const overlay = {
    review: { status: "preview" },
    publication: "preview",
    lessons: { review: { sentences: { publication: "Original translation" } } },
  };
  const before = courseOverlayHash(overlay);
  overlay.lessons.review.sentences.publication = "Changed translation";
  assert.notEqual(courseOverlayHash(overlay), before);
});

test("the course bundle and diagrams share the atlas immutable manifest and offline file list", () => {
  const fixture = waterFixture();
  try {
    const taxonomy = {
      domains: Array.from({ length: 32 }, (_, index) => ({
        id: `domain-${index}`,
        labelEn: `Domain ${index}`,
        labelFa: `Domain ${index}`,
        subcategories: [],
        discoveryGroupId: "all",
      })),
      discoveryGroups: [
        {
          id: "all",
          domainIds: Array.from(
            { length: 32 },
            (_, index) => `domain-${index}`,
          ),
        },
      ],
    };
    const source = {
      corpusId: "fixture",
      releaseId: "course-fixture-1",
      channel: "preview",
      entries: [
        {
          id: "water",
          w: "water",
          uk: "",
          us: "",
          cefr: "A1",
          topic: "domain-0",
          senses: [
            {
              id: "water:liquid",
              pos: "n.",
              fa: "Water",
              en: "A liquid",
              domainIds: ["domain-0"],
              review: { status: "preview" },
            },
          ],
          ex: [{ en: "There is water.", fa: "Water" }],
          media: { img: "figures/water.svg" },
          provenance: { license: "CC-BY-4.0" },
        },
      ],
    };
    const release = prepareContent(source, taxonomy, { root: fixture.root });
    const payload = JSON.parse(release.payloadText);
    assert.match(
      payload.courses.path,
      /^content\/courses\/[a-f0-9]{64}\.json$/,
    );
    assert.ok(
      release.manifest.dataFiles.some(
        (file) =>
          file.path === payload.courses.path &&
          file.sha256 === payload.courses.sha256,
      ),
    );
    const bundle = JSON.parse(release.shardData.get(payload.courses.path));
    const diagram = bundle.courses[0].lessons[0].image;
    assert.match(diagram, /^content\/media\/[a-f0-9]{64}\.svg$/);
    assert.ok(release.manifest.assets.some((asset) => asset.path === diagram));
    assert.equal(
      prepareContent(source, taxonomy, { root: fixture.root }).manifestText,
      release.manifestText,
    );
    fs.rmSync(path.join(fixture.root, "content/courses"), { recursive: true });
    assert.equal(
      JSON.parse(
        prepareContent(source, taxonomy, { root: fixture.root }).payloadText,
      ).courses,
      undefined,
    );
  } finally {
    fixture.cleanup();
  }
});
