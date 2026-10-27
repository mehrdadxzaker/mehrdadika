import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { test } from "node:test";
import { compileCourseSources } from "./course-validation.mjs";
import { compileLocale, loadPublishedRelease } from "./build-locales.mjs";

test("Water and Weather publishes eight complete English lessons and three source-bound support editions", () => {
  const published = loadPublishedRelease();
  const senseIds = new Set(
    published.entries.flatMap((entry) => entry.senses.map((sense) => sense.id)),
  );
  const bundle = compileCourseSources({ senseIds });
  const course = bundle.courses.find(
    (item) => item.id === "science-water-weather",
  );
  assert.ok(course);
  assert.equal(course.lessons.length, 8);
  assert.equal(
    course.lessons.flatMap((lesson) => lesson.activities).length,
    32,
  );
  assert.equal(
    course.lessons.flatMap((lesson) => lesson.production.models).length,
    16,
  );
  assert.equal(
    new Set(course.lessons.flatMap((lesson) => lesson.targetSenseIds)).size,
    22,
  );
  assert.equal(course.review.status, "preview");
  assert.equal(course.review.humanReviewed, false);
  const media = JSON.parse(
    fs.readFileSync("content/courses/science-water-weather.media.json", "utf8"),
  );
  assert.equal(media.humanReviewed, false);
  for (const path of new Set([
    course.cover,
    ...course.lessons.map((lesson) => lesson.image),
  ])) {
    const rights = media.assets.filter((asset) => asset.path === path);
    assert.equal(rights.length, 1, `One provenance record for ${path}`);
    assert.equal(rights[0].license, "CC-BY-4.0");
    assert.ok(rights[0].source);
    assert.equal(
      rights[0].sha256,
      crypto
        .createHash("sha256")
        .update(fs.readFileSync(`public/${path}`))
        .digest("hex"),
    );
  }
  for (const lesson of course.lessons) {
    const words = lesson.sentences
      .map((sentence) => sentence.en)
      .join(" ")
      .split(/\s+/).length;
    assert.ok(words >= 100 && words <= 160, `${lesson.id}: ${words} words`);
    assert.ok(
      lesson.activities.filter((activity) => activity.checks === "english")
        .length >= 2,
    );
  }
  for (const locale of ["fa", "pt-BR", "es-419"]) {
    const overlay = bundle.overlays.find(
      (item) => item.locale === locale && item.courseId === course.id,
    );
    assert.ok(overlay);
    assert.equal(overlay.sourceHash, bundle.sourceHashes[course.id]);
    assert.equal(overlay.review.humanReviewed, false);
    if (locale === "fa") continue;
    const vocabulary = compileLocale(
      JSON.parse(fs.readFileSync(`content/locales/${locale}.json`, "utf8")),
      published,
    );
    for (const senseId of new Set(
      course.lessons.flatMap((lesson) => lesson.targetSenseIds),
    )) {
      const lexical = published.entries.find((entry) =>
        entry.senses.some((sense) => sense.id === senseId),
      );
      assert.ok(
        vocabulary.entries[lexical.id]?.senses[senseId],
        `${locale}: missing course vocabulary ${senseId}`,
      );
    }
  }
});
