import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  compileReadingLocale,
  buildReadingLocales,
} from "./build-reading-locales.mjs";
import { loadPublishedRelease } from "./build-locales.mjs";

const published = loadPublishedRelease();
const source = published.index.readings;
const raw = (locale) =>
  JSON.parse(
    fs.readFileSync(`content/locales/readings.${locale}.json`, "utf8"),
  );
const clone = (value) => JSON.parse(JSON.stringify(value));
const sourceIdentities = (catalog) => ({
  passages: catalog.passages.map((item) => [
    item.id,
    item.paragraphs.map((p) => [p.id, p.sentences.map((s) => [s.id, s.en])]),
    item.questions.map((q) => [q.id, q.statement, q.answer]),
  ]),
  books: catalog.books.map((book) => [
    book.id,
    book.chapters.map((item) => [
      item.id,
      item.number,
      item.paragraphs.map((p) => [p.id, p.sentences.map((s) => [s.id, s.en])]),
    ]),
  ]),
  paraphrases: catalog.paraphrases.map((item) => [
    item.id,
    item.questions.map((q) => [
      q.id,
      q.source,
      q.target,
      q.prompt,
      q.options,
      q.answer,
    ]),
  ]),
  confusables: catalog.confusables.map((item) => [
    item.id,
    item.words.map((w) => [w.word, w.exampleEn]),
    item.questions.map((q) => [q.id, q.sentence, q.answer]),
  ]),
});

test("Portuguese and Spanish reading catalogs cover every published item while retaining English identities and answer keys", () => {
  for (const locale of ["pt-BR", "es-419"]) {
    const result = compileReadingLocale(raw(locale), source, published);
    assert.equal(result.locale, locale);
    assert.equal(result.review.humanReviewed, false);
    assert.equal(result.catalog.channel, "preview");
    assert.deepEqual(
      sourceIdentities(result.catalog),
      sourceIdentities(source),
    );
    assert.equal(result.catalog.passages.length, 3);
    assert.equal(result.catalog.books[0].chapters.length, 3);
    assert.equal(result.catalog.paraphrases.length, 2);
    assert.equal(result.catalog.confusables.length, 3);
    assert.equal(
      /[\u0600-\u06ff]/u.test(JSON.stringify(result.catalog)),
      false,
    );
  }
});

test("only published English and eligible native records can appear in reading bundles", () => {
  const overlay = raw("pt-BR");
  const original = clone(source);
  original.passages[0].publication = "draft";
  overlay.passages["reading:quiet-kitchen"].status = "draft";
  overlay.books["a-light-in-the-window"].chapters[
    "book:window:chapter:2"
  ].status = "withdrawn";
  overlay.confusables["borrow-lend"].words.borrow.status = "draft";
  overlay.passages["author-only"] = { title: "SECRET_DRAFT" };
  const result = compileReadingLocale(overlay, original);
  assert.deepEqual(
    result.catalog.passages.map((p) => p.id),
    ["reading:water-workshop"],
  );
  assert.deepEqual(
    result.catalog.books[0].chapters.map((c) => c.number),
    [1, 3],
  );
  assert.ok(!result.catalog.confusables.some((g) => g.id === "borrow-lend"));
  assert.ok(!JSON.stringify(result).includes("SECRET_DRAFT"));
});

test("stale sentence, question, option-order and answer bindings exclude the affected translated item", () => {
  const overlay = raw("pt-BR");
  overlay.passages["reading:library-afternoon"].sentences[
    "reading:library-afternoon:p1:s1"
  ].sourceEn = "Old source sentence.";
  overlay.passages["reading:quiet-kitchen"].questions.q1.sourceAnswer = "false";
  overlay.paraphrases[
    "everyday-equivalents"
  ].questions.q1.sourceOptions.reverse();
  overlay.confusables["recipe-receipt"].questions.q1.sourceSentence =
    "An old question ____.";
  const result = compileReadingLocale(overlay, source);
  assert.deepEqual(
    result.catalog.passages.map((p) => p.id),
    ["reading:water-workshop"],
  );
  assert.deepEqual(
    result.catalog.paraphrases.map((p) => p.id),
    ["academic-equivalents"],
  );
  assert.ok(!result.catalog.confusables.some((g) => g.id === "recipe-receipt"));
});

test("native authoring metadata cannot replace English answer keys or enter learner output", () => {
  const overlay = raw("es-419");
  overlay.authorOnly = "SECRET_DRAFT";
  overlay.provenance.secret = "SECRET_DRAFT";
  overlay.passages["reading:library-afternoon"].questions.q1.answer = "false";
  overlay.passages["reading:library-afternoon"].questions.q1.internal =
    "SECRET_DRAFT";
  overlay.books["a-light-in-the-window"].chapters[
    "book:window:chapter:1"
  ].private = { text: "SECRET_DRAFT" };
  const result = compileReadingLocale(overlay, source);
  assert.equal(result.catalog.passages[0].questions[0].answer, "true");
  assert.ok(!JSON.stringify(result).includes("SECRET_DRAFT"));
  overlay.review.humanReviewed = true;
  assert.throws(
    () => compileReadingLocale(overlay, source),
    /honestly unreviewed previews/,
  );
});

function readingReleaseFixture(t) {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "mehrdadika-reading-locales-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const pointer = JSON.parse(
    fs.readFileSync("public/content/current.json", "utf8"),
  );
  const manifest = JSON.parse(
    fs.readFileSync(`public/${pointer.manifest}`, "utf8"),
  );
  for (const name of [
    "content/current.json",
    pointer.manifest,
    manifest.payload.path,
    ...manifest.dataFiles.map((file) => file.path),
  ]) {
    fs.mkdirSync(path.dirname(path.join(root, "public", name)), {
      recursive: true,
    });
    fs.copyFileSync(path.join("public", name), path.join(root, "public", name));
  }
  fs.mkdirSync(path.join(root, "content/locales"), { recursive: true });
  for (const locale of ["pt-BR", "es-419"])
    fs.copyFileSync(
      `content/locales/readings.${locale}.json`,
      path.join(root, `content/locales/readings.${locale}.json`),
    );
  return { root, manifest };
}

test("a swapped reading locale file cannot publish content under the wrong edition", (t) => {
  const { root } = readingReleaseFixture(t);
  fs.copyFileSync(
    path.join(root, "content/locales/readings.es-419.json"),
    path.join(root, "content/locales/readings.pt-BR.json"),
  );
  assert.throws(
    () => buildReadingLocales({ root }),
    /Reading locale identity mismatch: expected pt-BR, received es-419/,
  );
  assert.equal(
    fs.existsSync(path.join(root, "src/i18n/published/readings.pt-BR.json")),
    false,
  );
  assert.throws(
    () => compileReadingLocale({ ...raw("pt-BR"), schemaVersion: 2 }, source),
    /supported reading locale schema/,
  );
});

test("reading locale snapshot checks use hash-verified publication artifacts and detect stale output", (t) => {
  const { root, manifest } = readingReleaseFixture(t);
  assert.equal(buildReadingLocales({ root }).length, 2);
  assert.doesNotThrow(() => buildReadingLocales({ root, check: true }));
  fs.appendFileSync(
    path.join(root, "src/i18n/published/readings.pt-BR.json"),
    " ",
  );
  assert.throws(
    () => buildReadingLocales({ root, check: true }),
    /snapshot is stale/,
  );
  fs.appendFileSync(path.join(root, "public", manifest.payload.path), " ");
  assert.throws(() => buildReadingLocales({ root }), /integrity failed/);
});
