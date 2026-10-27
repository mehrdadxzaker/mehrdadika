import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

export const COURSE_LOCALES = ["fa", "pt-BR", "es-419"];
const digest = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
const fail = (condition, message) => {
  if (!condition) throw new Error(`Course content: ${message}`);
};
const object = (value) =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value, maximum = 6000) =>
  typeof value === "string" && !!value.trim() && value.length <= maximum;
const id = (value) =>
  typeof value === "string" &&
  /^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,159}$/.test(value) &&
  !["__proto__", "constructor", "prototype"].includes(value);
const list = (value, maximum) =>
  Array.isArray(value) && value.length > 0 && value.length <= maximum;
const shape = (value, allowed, where) =>
  fail(
    object(value) && Object.keys(value).every((key) => allowed.includes(key)),
    `${where} has unsupported fields`,
  );
const safeAsset = (value) =>
  text(value, 500) &&
  !value.startsWith("/") &&
  !value.includes("..") &&
  !/^[a-z]+:/i.test(value) &&
  /\.(svg|webp|png|jpe?g)$/i.test(value);
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : object(value)
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
const stripReview = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(
      ([key]) => !["review", "publication"].includes(key),
    ),
  );
export function courseSourceHash(course, { root = process.cwd() } = {}) {
  const media = {};
  for (const asset of [
    course.cover,
    ...course.lessons.map((lesson) => lesson.image),
  ]) {
    fail(safeAsset(asset), `unsafe asset ${asset}`);
    const file = path.resolve(root, "public", asset);
    fail(fs.existsSync(file), `missing asset ${asset}`);
    fail(
      fs
        .realpathSync(file)
        .startsWith(fs.realpathSync(path.join(root, "public")) + path.sep),
      `asset escapes public ${asset}`,
    );
    media[asset] = digest(fs.readFileSync(file));
  }
  return digest(
    `mehrdadika-course-v1:${JSON.stringify(canonical({ course: stripReview(course), media }))}`,
  );
}
export function courseOverlayHash(overlay) {
  return digest(
    `mehrdadika-course-overlay-v1:${JSON.stringify(canonical(stripReview(overlay)))}`,
  );
}
function review(
  value,
  expectedHash,
  where,
  science = false,
  published = false,
) {
  shape(
    value,
    [
      "status",
      "humanReviewed",
      "reviewer",
      "domainReviewer",
      "domainQualified",
      "contentHash",
    ],
    `${where} review`,
  );
  fail(
    object(value) &&
      ["preview", "approved"].includes(value.status) &&
      typeof value.humanReviewed === "boolean",
    `${where} needs honest review metadata`,
  );
  if (value.status === "approved" || published) {
    fail(
      value.status === "approved" &&
        value.humanReviewed === true &&
        text(value.reviewer, 300),
      `${where} published/approved content requires recorded human language review`,
    );
    fail(
      value.contentHash === expectedHash,
      `${where} approval digest is missing or stale`,
    );
    if (science)
      fail(
        value.domainQualified === true && text(value.domainReviewer, 300),
        `${where} requires qualified science review`,
      );
  } else
    fail(
      value.humanReviewed === false,
      `${where} preview must not imply approval`,
    );
}
function unique(values, where) {
  fail(
    values.every(id) && new Set(values).size === values.length,
    `${where} has invalid or duplicate IDs`,
  );
}
export function validateCourse(
  course,
  { root = process.cwd(), senseIds = null } = {},
) {
  shape(
    course,
    [
      "id",
      "revision",
      "title",
      "subtitle",
      "level",
      "subjectDepth",
      "cover",
      "visualStyle",
      "publication",
      "review",
      "provenance",
      "lessons",
    ],
    "course",
  );
  fail(
    object(course) && id(course.id) && text(course.revision, 100),
    "course identity is invalid",
  );
  fail(
    ["draft", "preview", "published", "withdrawn"].includes(course.publication),
    "publication is invalid",
  );
  for (const field of [
    "title",
    "subtitle",
    "level",
    "subjectDepth",
    "visualStyle",
  ])
    fail(text(course[field]), `missing course ${field}`);
  fail(
    object(course.provenance) &&
      text(course.provenance.license) &&
      text(course.provenance.source) &&
      typeof course.provenance.aiAssisted === "boolean",
    "provenance is incomplete",
  );
  shape(course.provenance, ["license", "source", "aiAssisted"], "provenance");
  fail(list(course.lessons, 64), "lessons must be a bounded nonempty list");
  if (course.id === "science-water-weather")
    fail(
      course.lessons.length === 8,
      "Water and Weather requires eight lessons",
    );
  unique(
    course.lessons.map((lesson) => lesson.id),
    "lessons",
  );
  const targets = new Set();
  for (const lesson of course.lessons) {
    shape(
      lesson,
      [
        "id",
        "title",
        "question",
        "englishGoal",
        "scienceGoal",
        "minutes",
        "image",
        "imageAlt",
        "sentences",
        "targetSenseIds",
        "pattern",
        "patternExample",
        "activities",
        "production",
      ],
      `${lesson.id} lesson`,
    );
    for (const field of [
      "title",
      "question",
      "englishGoal",
      "scienceGoal",
      "imageAlt",
      "pattern",
      "patternExample",
    ])
      fail(text(lesson[field]), `${lesson.id} needs ${field}`);
    fail(
      Number.isFinite(lesson.minutes) &&
        lesson.minutes >= 1 &&
        lesson.minutes <= 60,
      `${lesson.id} invalid duration`,
    );
    fail(safeAsset(lesson.image), `${lesson.id} unsafe image`);
    fail(list(lesson.sentences, 30), `${lesson.id} missing English passage`);
    unique(
      lesson.sentences.map((sentence) => sentence.id),
      `${lesson.id} sentences`,
    );
    for (const sentence of lesson.sentences)
      shape(sentence, ["id", "en"], `${lesson.id} sentence`);
    fail(
      lesson.sentences.every((sentence) => text(sentence.en, 2000)),
      `${lesson.id} empty English sentence`,
    );
    const words = lesson.sentences
      .map((sentence) => sentence.en)
      .join(" ")
      .trim()
      .split(/\s+/).length;
    fail(
      words >= 90 && words <= 180,
      `${lesson.id} passage must be approximately 100–160 words (received ${words})`,
    );
    fail(list(lesson.targetSenseIds, 8), `${lesson.id} missing target senses`);
    unique(lesson.targetSenseIds, `${lesson.id} targets`);
    for (const sense of lesson.targetSenseIds) {
      fail(
        !senseIds || senseIds.has(sense),
        `${lesson.id} unknown target sense ${sense}`,
      );
      targets.add(sense);
    }
    fail(
      Array.isArray(lesson.activities) && lesson.activities.length === 4,
      `${lesson.id} requires four closed activities`,
    );
    unique(
      lesson.activities.map((activity) => activity.id),
      `${lesson.id} activities`,
    );
    fail(
      lesson.activities.filter((activity) => activity.checks === "english")
        .length >= 2,
      `${lesson.id} needs two English activities`,
    );
    for (const activity of lesson.activities) {
      shape(
        activity,
        ["id", "kind", "checks", "prompt", "choices", "answer", "explanation"],
        `${activity.id} activity`,
      );
      fail(
        ["choice", "cloze", "label", "sequence"].includes(activity.kind) &&
          ["english", "science"].includes(activity.checks),
        `${activity.id} invalid activity kind/check`,
      );
      fail(
        text(activity.prompt) && text(activity.explanation),
        `${activity.id} missing prompt/feedback`,
      );
      fail(
        list(activity.choices, 12) && activity.choices.length >= 2,
        `${activity.id} missing choices`,
      );
      unique(
        activity.choices.map((choice) => choice.id),
        `${activity.id} choices`,
      );
      for (const choice of activity.choices)
        shape(choice, ["id", "text"], `${activity.id} choice`);
      fail(
        activity.choices.every((choice) => text(choice.text, 1000)),
        `${activity.id} empty choice`,
      );
      fail(list(activity.answer, 12), `${activity.id} missing answer`);
      unique(activity.answer, `${activity.id} answer`);
      const choices = new Set(activity.choices.map((choice) => choice.id));
      fail(
        activity.answer.every((answer) => choices.has(answer)),
        `${activity.id} dangling answer`,
      );
      fail(
        activity.kind === "sequence"
          ? activity.answer.length === activity.choices.length
          : activity.answer.length === 1,
        `${activity.id} invalid answer count`,
      );
    }
    const production = lesson.production;
    shape(
      production,
      ["prompt", "starter", "models", "checklist"],
      `${lesson.id} production`,
    );
    fail(
      object(production) && text(production.prompt) && text(production.starter),
      `${lesson.id} missing production prompt`,
    );
    fail(
      list(production.models, 5) &&
        production.models.length >= 2 &&
        production.models.every((model) => text(model)),
      `${lesson.id} requires alternative model answers`,
    );
    fail(
      list(production.checklist, 8) &&
        production.checklist.every((item) => text(item)),
      `${lesson.id} requires writing checklist`,
    );
  }
  fail(targets.size <= 24, "course exceeds 24 target senses");
  const sourceHash = courseSourceHash(course, { root });
  review(
    course.review,
    sourceHash,
    course.id,
    true,
    course.publication === "published",
  );
  return sourceHash;
}
export function validateCourseOverlay(overlay, course, sourceHash) {
  shape(
    overlay,
    [
      "schemaVersion",
      "locale",
      "courseId",
      "sourceHash",
      "publication",
      "review",
      "title",
      "subtitle",
      "lessons",
    ],
    "overlay",
  );
  fail(
    object(overlay) &&
      overlay.schemaVersion === 1 &&
      COURSE_LOCALES.includes(overlay.locale) &&
      overlay.courseId === course.id,
    "overlay identity is invalid",
  );
  fail(
    ["draft", "preview", "published", "withdrawn"].includes(
      overlay.publication,
    ),
    "overlay publication is invalid",
  );
  fail(
    overlay.sourceHash === sourceHash,
    `${overlay.locale} English source binding is stale; explicitly rebind after reviewing changed material`,
  );
  fail(
    text(overlay.title) && text(overlay.subtitle) && object(overlay.lessons),
    `${overlay.locale} overlay metadata missing`,
  );
  fail(
    Object.keys(overlay.lessons).length === course.lessons.length,
    `${overlay.locale} lesson coverage mismatch`,
  );
  for (const lesson of course.lessons) {
    const support = overlay.lessons[lesson.id];
    shape(
      support,
      [
        "title",
        "question",
        "englishGoal",
        "scienceGoal",
        "imageAlt",
        "sentences",
        "patternTip",
        "activities",
        "production",
      ],
      `${overlay.locale} ${lesson.id} support`,
    );
    fail(object(support), `${overlay.locale} missing lesson ${lesson.id}`);
    for (const field of [
      "title",
      "question",
      "englishGoal",
      "scienceGoal",
      "imageAlt",
      "patternTip",
    ])
      fail(
        text(support[field]),
        `${overlay.locale} ${lesson.id} missing ${field}`,
      );
    fail(
      object(support.sentences) &&
        Object.keys(support.sentences).length === lesson.sentences.length &&
        lesson.sentences.every((sentence) =>
          text(support.sentences[sentence.id]),
        ),
      `${overlay.locale} ${lesson.id} incomplete sentence support`,
    );
    fail(
      object(support.activities) &&
        Object.keys(support.activities).length === lesson.activities.length &&
        lesson.activities.every(
          (activity) =>
            object(support.activities[activity.id]) &&
            text(support.activities[activity.id].prompt) &&
            text(support.activities[activity.id].explanation),
        ),
      `${overlay.locale} ${lesson.id} incomplete activity support`,
    );
    for (const activity of Object.values(support.activities))
      shape(activity, ["prompt", "explanation"], "activity support");
    shape(
      support.production,
      ["prompt", "starterTip", "checklist"],
      "writing support",
    );
    fail(
      object(support.production) &&
        text(support.production.prompt) &&
        text(support.production.starterTip) &&
        Array.isArray(support.production.checklist) &&
        support.production.checklist.length ===
          lesson.production.checklist.length &&
        support.production.checklist.every((item) => text(item)),
      `${overlay.locale} ${lesson.id} incomplete writing support`,
    );
  }
  review(
    overlay.review,
    courseOverlayHash(overlay),
    `${overlay.locale} support`,
    false,
    overlay.publication === "published",
  );
  return overlay;
}
/** Read authoring sources, fail closed on stale support, and return only publishable records. */
export function compileCourseSources({
  root = process.cwd(),
  senseIds = null,
  rewriteAsset = (asset) => asset,
} = {}) {
  const directory = path.join(root, "content/courses");
  const bundle = {
    schemaVersion: 1,
    sourceHashes: {},
    courses: [],
    overlays: [],
  };
  if (!fs.existsSync(directory)) return bundle;
  for (const name of fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(".json") && !name.endsWith(".media.json"))
    .sort()) {
    const course = JSON.parse(
      fs.readFileSync(path.join(directory, name), "utf8"),
    );
    fail(
      id(course.id) && !Object.hasOwn(bundle.sourceHashes, course.id),
      "duplicate/invalid course ID",
    );
    if (["draft", "withdrawn"].includes(course.publication)) continue;
    const sourceHash = validateCourse(course, { root, senseIds });
    bundle.sourceHashes[course.id] = sourceHash;
    const compiled = structuredClone(course);
    compiled.cover = rewriteAsset(course.cover);
    compiled.lessons = course.lessons.map((lesson) => ({
      ...lesson,
      image: rewriteAsset(lesson.image),
    }));
    bundle.courses.push(compiled);
    for (const locale of COURSE_LOCALES) {
      const filename = path.join(
        root,
        `content/locales/courses.${course.id}.${locale}.json`,
      );
      if (!fs.existsSync(filename)) continue;
      const overlay = JSON.parse(fs.readFileSync(filename, "utf8"));
      if (["draft", "withdrawn"].includes(overlay.publication)) continue;
      validateCourseOverlay(overlay, course, sourceHash);
      bundle.overlays.push(overlay);
    }
  }
  return bundle;
}

/** Author action: bind translations to the exact source inspected, never a build side effect. */
export function bindCourseOverlays({ root = process.cwd() } = {}) {
  const directory = path.join(root, "content/courses");
  for (const name of fs
    .readdirSync(directory)
    .filter(
      (name) => name.endsWith(".json") && !name.endsWith(".media.json"),
    )) {
    const course = JSON.parse(
      fs.readFileSync(path.join(directory, name), "utf8"),
    );
    const sourceHash = courseSourceHash(course, { root });
    for (const locale of COURSE_LOCALES) {
      const filename = path.join(
        root,
        `content/locales/courses.${course.id}.${locale}.json`,
      );
      if (!fs.existsSync(filename)) continue;
      const overlay = JSON.parse(fs.readFileSync(filename, "utf8"));
      fail(
        overlay.review?.status !== "approved",
        "approved overlays must undergo renewed review before rebinding",
      );
      overlay.sourceHash = sourceHash;
      fs.writeFileSync(filename, JSON.stringify(overlay, null, 2) + "\n");
    }
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.includes("--bind")) bindCourseOverlays();
  else {
    const bundle = compileCourseSources();
    console.log(
      `${bundle.courses.length} course(s), ${bundle.overlays.length} support editions validated`,
    );
  }
}
