import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadPublishedRelease } from "./build-locales.mjs";

const locales = ["pt-BR", "es-419"];
const record = (value) =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= 6000;
const safeId = (value) =>
  typeof value === "string" &&
  /^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,179}$/.test(value) &&
  !["__proto__", "constructor", "prototype"].includes(value);
const eligible = (value) =>
  record(value) &&
  (value.status === undefined ||
    ["preview", "published", "approved", "ai-editorial-preview"].includes(
      value.status,
    )) &&
  (value.publication === undefined ||
    ["preview", "published"].includes(value.publication)) &&
  (value.review?.status === undefined ||
    ["preview", "approved", "ai-editorial-preview"].includes(
      value.review.status,
    ));
const requireValue = (value, message) => {
  if (!value) throw new Error(message);
};
const review = () => ({ status: "ai-editorial-preview", humanReviewed: false });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const serialize = (value) => JSON.stringify(value, null, 2) + "\n";

/** Only published English records and exactly bound, eligible native fields enter learner output. */
export function compileReadingLocale(
  overlay,
  source,
  sourceRelease = {},
  expectedLocale = overlay?.locale,
) {
  requireValue(
    record(overlay) &&
      overlay.schemaVersion === 1 &&
      locales.includes(overlay.locale),
    "Expected a supported reading locale schema",
  );
  requireValue(
    locales.includes(expectedLocale) && overlay.locale === expectedLocale,
    `Reading locale identity mismatch: expected ${expectedLocale}, received ${overlay.locale}`,
  );
  requireValue(
    eligible(overlay) &&
      overlay.status === "preview" &&
      overlay.review?.humanReviewed === false,
    "Reading localization currently publishes honestly unreviewed previews only",
  );
  requireValue(
    record(source) && source.schemaVersion === 1,
    "A published reading catalog is required",
  );
  const reading = (item, translated, chapter = false) => {
    if (
      !safeId(item?.id) ||
      !eligible(item) ||
      !eligible(translated) ||
      translated.sourceTitleEn !== item.titleEn ||
      !text(translated.title)
    )
      return null;
    if (!Array.isArray(item.paragraphs) || !Array.isArray(item.questions))
      return null;
    const seen = new Set();
    const paragraphs = [];
    for (const paragraph of item.paragraphs) {
      if (
        !safeId(paragraph?.id) ||
        seen.has(paragraph.id) ||
        !Array.isArray(paragraph.sentences)
      )
        return null;
      seen.add(paragraph.id);
      const sentences = [];
      for (const sentence of paragraph.sentences) {
        const native = translated.sentences?.[sentence.id];
        if (
          !safeId(sentence.id) ||
          seen.has(sentence.id) ||
          !eligible(native) ||
          native.sourceEn !== sentence.en ||
          !text(native.translation)
        )
          return null;
        seen.add(sentence.id);
        sentences.push({
          id: sentence.id,
          en: sentence.en,
          fa: native.translation.trim(),
        });
      }
      paragraphs.push({ id: paragraph.id, sentences });
    }
    const questions = [];
    for (const question of item.questions) {
      const native = translated.questions?.[question.id];
      if (
        !safeId(question.id) ||
        !eligible(native) ||
        native.sourceStatement !== question.statement ||
        native.sourceAnswer !== question.answer ||
        !text(native.explanation)
      )
        return null;
      questions.push({
        id: question.id,
        statement: question.statement,
        answer: question.answer,
        explanationFa: native.explanation.trim(),
      });
    }
    return {
      id: item.id,
      titleEn: item.titleEn,
      titleFa: translated.title.trim(),
      level: item.level,
      domainId: item.domainId,
      minutes: item.minutes,
      targetWords: [...item.targetWords],
      paragraphs,
      questions,
      publication: "preview",
      review: review(),
      ...(chapter ? { number: item.number } : {}),
    };
  };
  const passages = (source.passages ?? []).flatMap((item) => {
    const compiled = reading(item, overlay.passages?.[item.id]);
    return compiled ? [compiled] : [];
  });
  const books = (source.books ?? []).flatMap((item) => {
    const native = overlay.books?.[item.id];
    if (
      !safeId(item?.id) ||
      !eligible(item) ||
      !eligible(native) ||
      native.sourceTitleEn !== item.titleEn ||
      !text(native.title) ||
      !text(native.author) ||
      !text(native.summary)
    )
      return [];
    const chapters = (item.chapters ?? []).flatMap((chapter) => {
      const compiled = reading(chapter, native.chapters?.[chapter.id], true);
      return compiled ? [compiled] : [];
    });
    return chapters.length
      ? [
          {
            id: item.id,
            titleEn: item.titleEn,
            titleFa: native.title.trim(),
            author: native.author.trim(),
            summaryFa: native.summary.trim(),
            level: item.level,
            chapters,
            publication: "preview",
            review: review(),
          },
        ]
      : [];
  });
  const paraphrases = (source.paraphrases ?? []).flatMap((item) => {
    const native = overlay.paraphrases?.[item.id];
    if (
      !safeId(item?.id) ||
      !eligible(item) ||
      !eligible(native) ||
      !text(native.title)
    )
      return [];
    const questions = [];
    for (const question of item.questions ?? []) {
      const translated = native.questions?.[question.id];
      if (
        !safeId(question.id) ||
        !eligible(translated) ||
        translated.sourceSource !== question.source ||
        translated.sourceTarget !== question.target ||
        translated.sourcePrompt !== question.prompt ||
        !same(translated.sourceOptions, question.options) ||
        translated.sourceAnswer !== question.answer ||
        !text(translated.explanation)
      )
        return [];
      questions.push({
        id: question.id,
        source: question.source,
        target: question.target,
        prompt: question.prompt,
        options: [...question.options],
        answer: question.answer,
        explanationFa: translated.explanation.trim(),
      });
    }
    return questions.length
      ? [
          {
            id: item.id,
            titleFa: native.title.trim(),
            level: item.level,
            questions,
            publication: "preview",
            review: review(),
          },
        ]
      : [];
  });
  const confusables = (source.confusables ?? []).flatMap((item) => {
    const native = overlay.confusables?.[item.id];
    if (
      !safeId(item?.id) ||
      !eligible(item) ||
      !eligible(native) ||
      !same(
        native.sourceWords,
        item.words.map((word) => word.word),
      ) ||
      !text(native.difference) ||
      !text(native.tip)
    )
      return [];
    const words = [];
    for (const word of item.words) {
      const translated = native.words?.[word.word];
      if (
        !eligible(translated) ||
        translated.sourceExampleEn !== word.exampleEn ||
        ![translated.meaning, translated.explanation, translated.example].every(
          text,
        )
      )
        return [];
      words.push({
        word: word.word,
        meaningFa: translated.meaning.trim(),
        explanationFa: translated.explanation.trim(),
        exampleEn: word.exampleEn,
        exampleFa: translated.example.trim(),
      });
    }
    const questions = [];
    for (const question of item.questions ?? []) {
      const translated = native.questions?.[question.id];
      if (
        !safeId(question.id) ||
        !eligible(translated) ||
        translated.sourceSentence !== question.sentence ||
        translated.sourceAnswer !== question.answer ||
        !text(translated.explanation)
      )
        return [];
      questions.push({
        id: question.id,
        sentence: question.sentence,
        answer: question.answer,
        explanationFa: translated.explanation.trim(),
      });
    }
    return questions.length
      ? [
          {
            id: item.id,
            level: item.level,
            differenceFa: native.difference.trim(),
            tipFa: native.tip.trim(),
            words,
            questions,
            publication: "preview",
            review: review(),
          },
        ]
      : [];
  });
  return {
    schemaVersion: 1,
    locale: overlay.locale,
    status: "preview",
    review: { status: "preview", humanReviewed: false },
    sourceRelease: {
      ...(typeof sourceRelease.manifestPath === "string" &&
      /^content\/[a-zA-Z0-9/._-]+\.json$/.test(sourceRelease.manifestPath) &&
      !sourceRelease.manifestPath.includes("..")
        ? { manifest: sourceRelease.manifestPath }
        : {}),
      ...(typeof sourceRelease.manifestHash === "string" &&
      /^[a-f0-9]{64}$/.test(sourceRelease.manifestHash)
        ? { sha256: sourceRelease.manifestHash }
        : {}),
    },
    catalog: {
      schemaVersion: 1,
      channel: "preview",
      provenance: {
        license: "CC-BY-4.0",
        aiAssisted: true,
        locale: overlay.locale,
        attribution: "Mehrdadika contributors — CC BY 4.0",
        reviewNotice:
          "AI-assisted translated editorial preview; independent human and specialist approval is not claimed.",
        narration:
          "Optional browser English device voice; no voice recording or voice model redistributed.",
      },
      passages,
      books,
      paraphrases,
      confusables,
    },
  };
}

export function buildReadingLocales({
  root = process.cwd(),
  check = false,
} = {}) {
  const published = loadPublishedRelease({ root });
  const source = published.index.readings;
  requireValue(source, "The published release has no reading catalog");
  const results = [];
  for (const locale of locales) {
    const overlay = JSON.parse(
      fs.readFileSync(
        path.join(root, `content/locales/readings.${locale}.json`),
        "utf8",
      ),
    );
    const compiled = compileReadingLocale(overlay, source, published, locale);
    const output = path.join(
      root,
      `src/i18n/published/readings.${locale}.json`,
    );
    const bytes = serialize(compiled);
    if (check)
      requireValue(
        fs.existsSync(output) && fs.readFileSync(output, "utf8") === bytes,
        `Reading locale ${locale} snapshot is stale; rebuild reading locales after English content`,
      );
    else {
      fs.mkdirSync(path.dirname(output), { recursive: true });
      const temporary = `${output}.${process.pid}.tmp`;
      try {
        fs.writeFileSync(temporary, bytes);
        fs.renameSync(temporary, output);
      } finally {
        if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
      }
    }
    results.push(compiled);
  }
  return results;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    requireValue(
      process.argv.slice(2).every((argument) => argument === "--check"),
      "Supported argument: --check",
    );
    for (const result of buildReadingLocales({
      check: process.argv.includes("--check"),
    }))
      console.log(
        `${result.locale} reading preview: ${result.catalog.passages.length} passages, ${result.catalog.books.length} books, ${result.catalog.books.reduce((n, book) => n + book.chapters.length, 0)} chapters, ${result.catalog.paraphrases.length} paraphrase levels, ${result.catalog.confusables.length} confusable groups.`,
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
