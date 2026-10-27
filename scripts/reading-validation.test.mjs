import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { validateReadings } from "./reading-validation.mjs";
const seed = JSON.parse(
  fs.readFileSync(new URL("../content/readings.json", import.meta.url), "utf8"),
);
const copy = () => structuredClone(seed);
test("all original preview passages, chapters and exercise sets satisfy the reader schema", () =>
  assert.equal(validateReadings(seed), seed));
test("duplicate stable sentence identity fails before publication", () => {
  const value = copy();
  value.passages[0].paragraphs[0].sentences[1].id =
    value.passages[0].paragraphs[0].sentences[0].id;
  assert.throws(() => validateReadings(value), /repeats ID/);
});
test("malformed comprehension answers and exercise option indices are rejected", () => {
  const truth = copy();
  truth.passages[0].questions[0].answer = "maybe";
  assert.throws(() => validateReadings(truth), /answer is invalid/);
  const options = copy();
  options.paraphrases[0].questions[0].answer = 500;
  assert.throws(() => validateReadings(options), /out of range/);
});
test("chapter numbers and required review evidence are validated", () => {
  const numbers = copy();
  numbers.books[0].chapters[1].number = numbers.books[0].chapters[0].number;
  assert.throws(() => validateReadings(numbers), /repeats a chapter/);
  const review = copy();
  delete review.passages[0].review;
  assert.throws(() => validateReadings(review), /must be an object/);
});
test("human approval cannot be asserted without a named reviewer", () => {
  const value = copy();
  value.passages[0].review = { status: "approved", humanReviewed: true };
  assert.throws(() => validateReadings(value), /reviewer/);
});
test("unsupported nested publication fields cannot hide draft content in an approved item", () => {
  const value = copy();
  value.passages[0].paragraphs[0].publication = "draft";
  assert.throws(() => validateReadings(value), /unsupported fields/);
});
test("authoring draft and withdrawn items remain structurally valid for compiler exclusion", () => {
  const value = copy();
  value.passages[0].publication = "draft";
  value.books[0].publication = "withdrawn";
  assert.equal(validateReadings(value), value);
});
