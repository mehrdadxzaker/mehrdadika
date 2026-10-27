import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { test } from "node:test";
import {
  buildLocales,
  compileLocale,
  loadPublishedRelease,
} from "./build-locales.mjs";

function fixture() {
  const publicSense = {
    id: "pressure:mechanical",
    review: { status: "preview" },
  };
  const draftSense = { id: "pressure:social", review: { status: "draft" } };
  const source = {
    id: "pressure",
    w: "pressure",
    senses: [publicSense, draftSense],
    ex: [
      { en: "Measure pressure.", senseId: publicSense.id },
      { en: "SECRET draft example.", senseId: draftSense.id },
    ],
    col: ["pressure gauge｜فشارسنج"],
    authorOnly: { secret: "SECRET source metadata" },
  };
  const published = {
    manifest: {
      schemaVersion: 1,
      release: { id: "test-preview" },
      taxonomy: {
        domains: [{ id: "engineering" }],
        discoveryGroups: [{ id: "technology" }],
      },
    },
    index: { entries: [{ id: source.id, w: source.w, senses: [publicSense] }] },
    entries: [
      source,
      { id: "private", w: "private", senses: [{ id: "private:sense" }] },
    ],
  };
  const overlay = {
    schemaVersion: 1,
    locale: "pt-BR",
    status: "preview",
    review: { humanReviewed: false, authorOnly: "SECRET root review" },
    authorOnly: { secret: "SECRET root metadata" },
    provenance: {
      attribution: "Fixture contributors",
      authorOnly: { secret: "SECRET provenance" },
    },
    categories: {
      engineering: { label: "Engenharia", authorOnly: "SECRET category note" },
      unpublished: { label: "SECRET category" },
    },
    groupLabels: {
      technology: "Tecnologia",
      unpublished: "SECRET discovery group",
    },
    entries: {
      pressure: {
        sourceWord: "pressure",
        authorOnly: { secret: "SECRET entry metadata" },
        senses: {
          "pressure:mechanical": {
            gloss: "pressão",
            definition: "Força por área.",
            authorOnly: "SECRET sense metadata",
          },
          "pressure:social": {
            gloss: "SECRET unavailable gloss",
            definition: "SECRET unavailable definition",
          },
        },
        examples: [
          {
            en: "Measure pressure.",
            translation: "Meça a pressão.",
            authorOnly: { secret: "SECRET example metadata" },
          },
          {
            en: "SECRET draft example.",
            translation: "SECRET draft translation",
          },
        ],
        collocations: [
          {
            en: "pressure gauge",
            translation: "manômetro",
            authorOnly: "SECRET collocation metadata",
          },
          {
            en: "SECRET unpublished phrase",
            translation: "SECRET phrase translation",
          },
        ],
        tip: "SECRET unscoped note about the hidden meaning",
      },
      private: {
        sourceWord: "private",
        senses: {
          "private:sense": {
            gloss: "SECRET private gloss",
            definition: "SECRET private definition",
          },
        },
        examples: [],
        collocations: [],
        tip: "SECRET private note",
      },
    },
  };
  return { published, overlay };
}

test("Portuguese compilation excludes unpublished words, senses, examples and unknown nested authoring fields", () => {
  const { published, overlay } = fixture();
  const result = compileLocale(overlay, published);
  assert.deepEqual(Object.keys(result.entries), ["pressure"]);
  assert.deepEqual(result.entries.pressure.senses, {
    "pressure:mechanical": { gloss: "pressão", definition: "Força por área." },
  });
  assert.deepEqual(result.entries.pressure.examples, [
    { en: "Measure pressure.", translation: "Meça a pressão." },
  ]);
  assert.deepEqual(result.entries.pressure.collocations, [
    { en: "pressure gauge", translation: "manômetro" },
  ]);
  assert.equal(result.entries.pressure.tip, "");
  assert.deepEqual(result.categories, { engineering: { label: "Engenharia" } });
  assert.deepEqual(result.groupLabels, { technology: "Tecnologia" });
  assert.equal(JSON.stringify(result).includes("SECRET"), false);
  assert.deepEqual(result.review, { humanReviewed: false, status: "preview" });
});

test("stale source-word and exact English bindings cannot publish a mismatched translation", () => {
  const { published, overlay } = fixture();
  overlay.entries.pressure.sourceWord = "different word";
  assert.deepEqual(compileLocale(overlay, published).entries, {});
  overlay.entries.pressure.sourceWord = "pressure";
  overlay.entries.pressure.examples[0].en = "Old English wording.";
  overlay.entries.pressure.collocations[0].en = "Old English phrase";
  const translated = compileLocale(overlay, published).entries.pressure;
  assert.deepEqual(translated.examples, []);
  assert.deepEqual(translated.collocations, []);
});

test("draft and withdrawn translation records are excluded even when their English source is published", () => {
  const { published, overlay } = fixture();
  overlay.entries.pressure.examples[0].publication = "draft";
  overlay.entries.pressure.collocations[0].review = { status: "withdrawn" };
  let translated = compileLocale(overlay, published).entries.pressure;
  assert.deepEqual(translated.examples, []);
  assert.deepEqual(translated.collocations, []);
  overlay.entries.pressure.senses["pressure:mechanical"].status = "draft";
  assert.deepEqual(compileLocale(overlay, published).entries, {});
  overlay.entries.pressure.senses["pressure:mechanical"].status = "preview";
  overlay.entries.pressure.publication = "draft";
  assert.deepEqual(compileLocale(overlay, published).entries, {});
  overlay.publication = "draft";
  assert.throws(() => compileLocale(overlay, published), /unreviewed preview/);
});

test("ambiguous translation bindings and duplicate indexed lexical IDs fail closed", () => {
  const { published, overlay } = fixture();
  overlay.entries.pressure.examples.push({
    en: "Measure pressure.",
    translation: "A different translation.",
  });
  assert.throws(() => compileLocale(overlay, published), /Ambiguous/);
  overlay.entries.pressure.examples.pop();
  published.index.entries.push(published.index.entries[0]);
  assert.throws(
    () => compileLocale(overlay, published),
    /duplicate indexed lexical ID/,
  );
});

test("Portuguese preview compiler does not propagate a claimed human approval or arbitrary provenance fields", () => {
  const { published, overlay } = fixture();
  overlay.review.humanReviewed = true;
  assert.throws(() => compileLocale(overlay, published), /unreviewed preview/);
});

test("Spanish uses the same publication filter and does not relabel another locale or expose drafts", () => {
  const { published, overlay } = fixture();
  overlay.locale = "es-419";
  overlay.entries.pressure.senses["pressure:mechanical"] = {
    gloss: "presión",
    definition: "Fuerza por unidad de área.",
  };
  overlay.entries.pressure.examples[0].translation = "Mide la presión.";
  const result = compileLocale(overlay, published);
  assert.equal(result.locale, "es-419");
  assert.deepEqual(Object.keys(result.entries), ["pressure"]);
  assert.equal(
    result.entries.pressure.senses["pressure:mechanical"].gloss,
    "presión",
  );
  assert.equal(result.review.humanReviewed, false);
  assert.ok(!JSON.stringify(result).includes("SECRET"));
  overlay.locale = "unsupported";
  assert.throws(
    () => compileLocale(overlay, published),
    /supported vocabulary locale/,
  );
});

test("subcategory translations bind to public English labels, preserve taxonomy order and exclude drafts", () => {
  for (const locale of ["pt-BR", "es-419"]) {
    const { published, overlay } = fixture();
    overlay.locale = locale;
    published.manifest.taxonomy.domains[0].subcategories = [
      "Tools",
      "Safety",
      "Materials",
    ];
    overlay.categories.engineering.subcategories = [
      {
        en: "Materials",
        translation: "Materiais",
        authorOnly: "SECRET metadata",
      },
      { en: "Old tools label", translation: "SECRET stale translation" },
      { en: "Tools", translation: "Ferramentas" },
      {
        en: "Safety",
        translation: "SECRET draft translation",
        publication: "draft",
      },
      {
        en: "Materials",
        translation: "SECRET withdrawn translation",
        review: { status: "withdrawn" },
      },
      { en: "SECRET unpublished label", translation: "SECRET extra category" },
    ];
    const category = compileLocale(overlay, published).categories.engineering;
    assert.deepEqual(category.subcategoryLabels, [
      "Ferramentas",
      "Safety",
      "Materiais",
    ]);
    assert.equal(JSON.stringify(category).includes("SECRET"), false);
    overlay.categories.engineering.subcategories.push({
      en: "Tools",
      translation: "Conflicting label",
    });
    assert.throws(
      () => compileLocale(overlay, published),
      /Ambiguous .* subcategory translation binding/,
    );
  }
});

function writeRelease(root, fixtureValue, courseBundle) {
  const dir = path.join(root, "public/content");
  fs.mkdirSync(dir, { recursive: true });
  const write = (name, value) => {
    const bytes = JSON.stringify(value);
    fs.writeFileSync(path.join(dir, name), bytes);
    return {
      path: `content/${name}`,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    };
  };
  const shard = write("entries.json", fixtureValue.published.entries);
  const courses = courseBundle
    ? write("courses.json", courseBundle)
    : undefined;
  const indexed = {
    ...fixtureValue.published.index,
    shards: { pressure: shard },
    ...(courses ? { courses } : {}),
  };
  const payload = write("index.json", indexed);
  const manifest = write("manifest.json", {
    ...fixtureValue.published.manifest,
    payload,
    dataFiles: [shard, ...(courses ? [courses] : [])],
  });
  fs.writeFileSync(
    path.join(dir, "current.json"),
    JSON.stringify({
      schemaVersion: 1,
      manifest: manifest.path,
      sha256: manifest.sha256,
    }),
  );
}

test("locale snapshot checks follow the hash-verified published release and detect stale generated output", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mehrdadika-locale-"));
  try {
    const value = fixture();
    writeRelease(root, value);
    fs.mkdirSync(path.join(root, "content/locales"), { recursive: true });
    fs.writeFileSync(
      path.join(root, "content/locales/pt-BR.json"),
      JSON.stringify(value.overlay),
    );
    const loaded = loadPublishedRelease({ root });
    assert.equal(loaded.manifest.release.id, "test-preview");
    assert.equal(Object.keys(buildLocales({ root }).entries).length, 1);
    assert.doesNotThrow(() => buildLocales({ root, check: true }));
    fs.appendFileSync(path.join(root, "src/locales/published/pt-BR.json"), " ");
    assert.throws(
      () => buildLocales({ root, check: true }),
      /snapshot is stale/,
    );
    fs.appendFileSync(path.join(root, "public/content/entries.json"), " ");
    assert.throws(() => loadPublishedRelease({ root }), /integrity failed/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("locale compilation accepts manifest-listed course objects without treating them as vocabulary shards", () => {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "mehrdadika-course-locale-"),
  );
  try {
    const value = fixture();
    writeRelease(root, value, { schemaVersion: 1, courses: [], overlays: [] });
    const loaded = loadPublishedRelease({ root });
    assert.equal(loaded.entries.length, value.published.entries.length);
    assert.equal(
      compileLocale(value.overlay, loaded).entries.pressure.sourceWord,
      "pressure",
    );
    fs.appendFileSync(path.join(root, "public/content/courses.json"), " ");
    assert.throws(() => loadPublishedRelease({ root }), /integrity failed/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
