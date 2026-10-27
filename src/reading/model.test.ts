import assert from "node:assert/strict";
import test from "node:test";
import {
  chapterPosition,
  rememberParagraph,
  freshReadingState,
  practiceScore,
  recordComprehension,
  sanitizeReadingState,
} from "./model";
import type { BookChapter, ReadingItem } from "./types";
const passage: ReadingItem = {
  id: "reading:one",
  titleEn: "A",
  titleFa: "الف",
  level: "A1",
  domainId: "everyday-life",
  minutes: 1,
  targetWords: [],
  paragraphs: [],
  questions: [
    { id: "q1", statement: "A", answer: "true", explanationFa: "الف" },
  ],
  publication: "preview",
  review: { status: "ai-editorial-preview", humanReviewed: false },
};
test("reading feedback keeps first answer and records completion separately from memory", () => {
  const first = recordComprehension(
    freshReadingState(),
    passage,
    "q1",
    "false",
  );
  assert.equal(first.answers["reading:one:q1"], "false");
  assert.deepEqual(first.completed, ["reading:one"]);
  assert.equal(recordComprehension(first, passage, "q1", "true"), first);
});
test("untrusted reader state is bounded and malformed values cannot become positions", () => {
  const state = sanitizeReadingState({
    version: 1,
    fontScale: 300,
    positions: { good: 5, bad: -1, ["__proto__"]: 12 },
    answers: { q1: "oops", q2: "true" },
    bookmarks: [null, "valid", "<script>"],
  });
  assert.equal(state.fontScale, 1.5);
  assert.deepEqual(state.positions, { good: 5 });
  assert.deepEqual(state.answers, { q2: "true" });
  assert.deepEqual(state.bookmarks, ["valid"]);
});
test("resuming after editorial sentence removal clamps the stored position", () => {
  const chapter = {
    ...passage,
    number: 1,
    paragraphs: [
      { id: "p1", sentences: [{ id: "s1", en: "One.", fa: "یک." }] },
    ],
  } as BookChapter;
  assert.equal(
    chapterPosition(
      { ...freshReadingState(), positions: { [chapter.id]: 99 } },
      chapter,
    ),
    0,
  );
});
test("practice score ignores unattempted questions and counts correct first selections", () => {
  assert.deepEqual(
    practiceScore({ "level:q1": 2 }, "level", [
      { id: "q1", answer: 2 },
      { id: "q2", answer: 0 },
    ]),
    { answered: 1, correct: 1, total: 2 },
  );
});
test("reader resume follows stable sentence identity after insertion", () => {
  const chapter = {
    ...passage,
    number: 1,
    paragraphs: [
      {
        id: "p1",
        sentences: [
          { id: "new", en: "New.", fa: "جدید." },
          { id: "old", en: "Old.", fa: "قدیم." },
        ],
      },
    ],
  } as BookChapter;
  assert.equal(
    chapterPosition(
      {
        ...freshReadingState(),
        positions: { [chapter.id]: 0 },
        sentenceAnchors: { [chapter.id]: "old" },
      },
      chapter,
    ),
    1,
  );
});
test("opening a bookmark resumes its exact paragraph rather than the last reading position", () => {
  const chapter = {
    ...passage,
    number: 1,
    paragraphs: [
      { id: "first", sentences: [{ id: "s1", en: "First.", fa: "اول." }] },
      { id: "second", sentences: [{ id: "s2", en: "Second.", fa: "دوم." }] },
    ],
  } as BookChapter;
  const state = {
    ...freshReadingState(),
    positions: { [chapter.id]: 1 },
    sentenceAnchors: { [chapter.id]: "s2" },
  };
  assert.equal(
    chapterPosition(rememberParagraph(state, chapter, "first"), chapter),
    0,
  );
  assert.equal(rememberParagraph(state, chapter, "missing"), state);
});
