import portuguese from "./published/readings.pt-BR.json";
import spanish from "./published/readings.es-419.json";
import {
  emptyReadingCatalog,
  type ReadingCatalog,
  type ReadingItem,
  type ParaphraseLevel,
  type ConfusableGroup,
} from "../reading/types";

export type ReadingLocale = "fa" | "pt-BR" | "es-419";
interface ReadingSnapshot {
  schemaVersion: 1;
  locale: Exclude<ReadingLocale, "fa">;
  catalog: ReadingCatalog;
}
const snapshots: Record<Exclude<ReadingLocale, "fa">, unknown> = {
  "pt-BR": portuguese,
  "es-419": spanish,
};
const cache = new WeakMap<ReadingCatalog, Map<ReadingLocale, ReadingCatalog>>();
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** A generated file must identify the requested edition before any of its native copy is used. */
export function readingSnapshotMatchesLocale(
  value: unknown,
  locale: ReadingLocale,
): value is ReadingSnapshot {
  if (!record(value) || locale === "fa") return false;
  const catalog = value.catalog;
  return (
    value.schemaVersion === 1 &&
    value.locale === locale &&
    value.status === "preview" &&
    record(value.review) &&
    value.review.status === "preview" &&
    value.review.humanReviewed === false &&
    record(catalog) &&
    catalog.schemaVersion === 1 &&
    catalog.channel === "preview" &&
    record(catalog.provenance) &&
    catalog.provenance.locale === locale &&
    ["passages", "books", "paraphrases", "confusables"].every((key) =>
      Array.isArray(catalog[key]),
    )
  );
}

/** English identities and answer bindings remain independent of the explanation language. */
export function readingIdentity(item: ReadingItem) {
  return {
    id: item.id,
    titleEn: item.titleEn,
    level: item.level,
    domainId: item.domainId,
    minutes: item.minutes,
    targetWords: item.targetWords,
    paragraphs: item.paragraphs.map((paragraph) => ({
      id: paragraph.id,
      sentences: paragraph.sentences.map((sentence) => ({
        id: sentence.id,
        en: sentence.en,
      })),
    })),
    questions: item.questions.map((question) => ({
      id: question.id,
      statement: question.statement,
      answer: question.answer,
    })),
  };
}
const paraphraseIdentity = (item: ParaphraseLevel) => ({
  id: item.id,
  level: item.level,
  questions: item.questions.map((question) => ({
    id: question.id,
    source: question.source,
    target: question.target,
    prompt: question.prompt,
    options: question.options,
    answer: question.answer,
  })),
});
const confusableIdentity = (item: ConfusableGroup) => ({
  id: item.id,
  level: item.level,
  words: item.words.map((word) => ({
    word: word.word,
    exampleEn: word.exampleEn,
  })),
  questions: item.questions.map((question) => ({
    id: question.id,
    sentence: question.sentence,
    answer: question.answer,
  })),
});
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

/** Localized content is selected from generated public snapshots, never raw authoring files. */
export function localizeReadingCatalog(
  source: ReadingCatalog | undefined,
  locale: ReadingLocale,
): ReadingCatalog {
  if (!source) return emptyReadingCatalog;
  if (locale === "fa") return source;
  const snapshot = snapshots[locale];
  if (!readingSnapshotMatchesLocale(snapshot, locale))
    return emptyReadingCatalog;
  const cached = cache.get(source)?.get(locale);
  if (cached) return cached;
  const native = snapshot.catalog;
  const passages = source.passages.flatMap((item) => {
    const translated = native.passages.find(
      (candidate) => candidate.id === item.id,
    );
    return translated &&
      same(readingIdentity(item), readingIdentity(translated))
      ? [translated]
      : [];
  });
  const books = source.books.flatMap((book) => {
    const translated = native.books.find(
      (candidate) =>
        candidate.id === book.id &&
        candidate.titleEn === book.titleEn &&
        candidate.level === book.level,
    );
    if (!translated) return [];
    const chapters = book.chapters.flatMap((chapter) => {
      const localized = translated.chapters.find(
        (candidate) =>
          candidate.id === chapter.id && candidate.number === chapter.number,
      );
      return localized &&
        same(readingIdentity(chapter), readingIdentity(localized))
        ? [localized]
        : [];
    });
    return chapters.length ? [{ ...translated, chapters }] : [];
  });
  const paraphrases = source.paraphrases.flatMap((item) => {
    const translated = native.paraphrases.find(
      (candidate) => candidate.id === item.id,
    );
    return translated &&
      same(paraphraseIdentity(item), paraphraseIdentity(translated))
      ? [translated]
      : [];
  });
  const confusables = source.confusables.flatMap((item) => {
    const translated = native.confusables.find(
      (candidate) => candidate.id === item.id,
    );
    return translated &&
      same(confusableIdentity(item), confusableIdentity(translated))
      ? [translated]
      : [];
  });
  const result: ReadingCatalog = {
    schemaVersion: 1,
    channel: "preview",
    provenance: native.provenance,
    passages,
    books,
    paraphrases,
    confusables,
  };
  let locales = cache.get(source);
  if (!locales) {
    locales = new Map();
    cache.set(source, locales);
  }
  locales.set(locale, result);
  return result;
}
export const adaptReadingCatalog = localizeReadingCatalog;
