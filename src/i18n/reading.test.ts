import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  localizeReadingCatalog,
  readingIdentity,
  readingSnapshotMatchesLocale,
} from "./reading";
import portugueseReadingSnapshot from "./published/readings.pt-BR.json";
import spanishReadingSnapshot from "./published/readings.es-419.json";
import type { ReadingCatalog } from "../reading/types";
import {
  freshReadingState,
  chapterPosition,
  recordComprehension,
  practiceScore,
  sanitizeReadingState,
  sentenceList,
} from "../reading/model";
import { observedParagraphPosition } from "../reading/position";
import { readingChapterCount, readingMinutes } from "../reading/labels";
import {
  readingSnapshot,
  readingStorageKey,
  restoreReading,
  setReadingLocale,
} from "../reading/state";

const pointer = JSON.parse(
  readFileSync(
    new URL("../../public/content/current.json", import.meta.url),
    "utf8",
  ),
);
const manifest = JSON.parse(
  readFileSync(
    new URL(`../../public/${pointer.manifest}`, import.meta.url),
    "utf8",
  ),
);
const source = JSON.parse(
  readFileSync(
    new URL(`../../public/${manifest.payload.path}`, import.meta.url),
    "utf8",
  ),
).readings as ReadingCatalog;

test("generated reading snapshots must match their requested locale and supported schema", () => {
  assert.ok(readingSnapshotMatchesLocale(portugueseReadingSnapshot, "pt-BR"));
  assert.ok(readingSnapshotMatchesLocale(spanishReadingSnapshot, "es-419"));
  assert.equal(
    readingSnapshotMatchesLocale(spanishReadingSnapshot, "pt-BR"),
    false,
  );
  assert.equal(
    readingSnapshotMatchesLocale(portugueseReadingSnapshot, "es-419"),
    false,
  );
  assert.equal(
    readingSnapshotMatchesLocale(
      { ...portugueseReadingSnapshot, schemaVersion: 2 },
      "pt-BR",
    ),
    false,
  );
  const wrongProvenance = structuredClone(portugueseReadingSnapshot);
  wrongProvenance.catalog.provenance.locale = "es-419";
  assert.equal(readingSnapshotMatchesLocale(wrongProvenance, "pt-BR"), false);
});

test("paragraph observation preserves an exact resumed sentence in every edition and still follows manual scrolling", () => {
  for (const locale of ["fa", "pt-BR", "es-419"] as const) {
    const chapter = localizeReadingCatalog(source, locale).books[0].chapters[0];
    const sentences = sentenceList(chapter);
    for (const position of [1, 3]) {
      const saved = sanitizeReadingState(
        JSON.parse(
          JSON.stringify({
            ...freshReadingState(),
            bookmarks: [chapter.paragraphs[1].id],
            positions: { [chapter.id]: position },
            sentenceAnchors: { [chapter.id]: sentences[position].id },
          }),
        ),
      );
      const paragraph = chapter.paragraphs.find((item) =>
        item.sentences.some(
          (sentence) => sentence.id === sentences[position].id,
        ),
      )!;
      // The observer's initial visibility notification must not snap sentence
      // two/four back to the first sentence of its containing paragraph.
      assert.equal(
        observedParagraphPosition(
          chapter,
          paragraph.id,
          chapterPosition(saved, chapter),
        ),
        undefined,
        `${locale}: sentence ${position + 1} survives reload`,
      );
      assert.equal(chapterPosition(saved, chapter), position);
      assert.deepEqual(saved.bookmarks, [chapter.paragraphs[1].id]);
    }
    assert.equal(
      observedParagraphPosition(chapter, chapter.paragraphs[1].id, 1),
      2,
    );
    assert.equal(
      observedParagraphPosition(chapter, chapter.paragraphs[0].id, 3),
      0,
    );
    assert.equal(observedParagraphPosition(chapter, "missing", 1), undefined);
  }
});

test("reading duration and chapter counts use native singular and plural labels", () => {
  for (const locale of ["pt-BR", "es-419"] as const) {
    assert.equal(readingMinutes(1, locale), "1 minuto");
    assert.equal(readingMinutes(3, locale), "3 minutos");
    assert.equal(readingChapterCount(1, locale), "1 capítulo");
    assert.equal(readingChapterCount(3, locale), "3 capítulos");
  }
  assert.equal(readingMinutes(1, "fa"), "۱ دقیقه");
  assert.equal(readingChapterCount(3, "fa"), "۳ فصل");
});

test("reading adapters retain every published English sentence, stable anchor and answer key in both new editions", () => {
  assert.equal(localizeReadingCatalog(source, "fa"), source);
  for (const locale of ["pt-BR", "es-419"] as const) {
    const localized = localizeReadingCatalog(source, locale);
    assert.deepEqual(
      localized.passages.map(readingIdentity),
      source.passages.map(readingIdentity),
    );
    assert.deepEqual(
      localized.books.flatMap((b) => b.chapters.map(readingIdentity)),
      source.books.flatMap((b) => b.chapters.map(readingIdentity)),
    );
    assert.equal(/[\u0600-\u06ff]/u.test(JSON.stringify(localized)), false);
    const passage = localized.passages[0];
    const answered = passage.questions.reduce(
      (state, question) =>
        recordComprehension(state, passage, question.id, question.answer),
      freshReadingState(),
    );
    assert.ok(answered.completed.includes(passage.id));
    assert.equal(Object.keys(answered.answers).length, 3);
    assert.deepEqual(
      localized.paraphrases.map((p) => p.questions.map((q) => q.answer)),
      source.paraphrases.map((p) => p.questions.map((q) => q.answer)),
    );
    assert.deepEqual(
      localized.confusables.map((p) => p.questions.map((q) => q.answer)),
      source.confusables.map((p) => p.questions.map((q) => q.answer)),
    );
    for (const level of localized.paraphrases) {
      const answers = Object.fromEntries(
        level.questions.map((question) => [
          `paraphrase:${level.id}:${question.id}`,
          question.answer,
        ]),
      );
      const original = source.paraphrases.find((item) => item.id === level.id)!;
      assert.deepEqual(
        practiceScore(answers, `paraphrase:${level.id}`, level.questions),
        practiceScore(answers, `paraphrase:${level.id}`, original.questions),
      );
    }
  }
});

test("stale translated reading content cannot attach to edited English or changed answer options", () => {
  const modified = structuredClone(source);
  modified.passages[0].paragraphs[0].sentences[0].en =
    "A revised story sentence.";
  modified.paraphrases[0].questions[0].options.reverse();
  const translated = localizeReadingCatalog(modified, "pt-BR");
  assert.ok(!translated.passages.some((p) => p.id === modified.passages[0].id));
  assert.ok(
    !translated.paraphrases.some((p) => p.id === modified.paraphrases[0].id),
  );
  assert.equal(translated.books[0].chapters.length, 3);
});

test("Persian, Portuguese and Spanish reader progress remain independent without changing stable content identities", () => {
  assert.equal(readingStorageKey("fa"), "mehrdadika:reading:v1");
  assert.notEqual(readingStorageKey("pt-BR"), readingStorageKey("es-419"));
  const initial = readingSnapshot();
  try {
    restoreReading({
      ...freshReadingState(),
      completed: ["reading:library-afternoon"],
    });
    setReadingLocale("pt-BR");
    restoreReading({
      ...freshReadingState(),
      bookmarks: ["book:window:chapter:1:p1"],
      positions: { "book:window:chapter:1": 2 },
    });
    setReadingLocale("es-419");
    assert.deepEqual(readingSnapshot().bookmarks, []);
    assert.deepEqual(readingSnapshot().completed, []);
    restoreReading({
      ...freshReadingState(),
      lastPassage: "reading:quiet-kitchen",
    });
    setReadingLocale("pt-BR");
    assert.deepEqual(readingSnapshot().bookmarks, ["book:window:chapter:1:p1"]);
    assert.equal(readingSnapshot().positions["book:window:chapter:1"], 2);
    assert.deepEqual(readingSnapshot().completed, []);
    setReadingLocale("fa");
    assert.deepEqual(readingSnapshot().completed, [
      "reading:library-afternoon",
    ]);
    assert.deepEqual(readingSnapshot().bookmarks, []);
  } finally {
    setReadingLocale("pt-BR");
    restoreReading(freshReadingState());
    setReadingLocale("es-419");
    restoreReading(freshReadingState());
    setReadingLocale("fa");
    restoreReading(initial);
  }
});
