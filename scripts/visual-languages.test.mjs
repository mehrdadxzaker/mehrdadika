import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  checkVisualLanguages,
  validateVisualRegistry,
  validateVisualBatch,
  visualLanguageHash,
} from "./check-visual-languages.mjs";
import { loadPublishedRelease, compileLocale } from "./build-locales.mjs";
import { gap } from "../src/lib/text.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (relative) =>
  JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
function fixture() {
  const domains = ["a", "b"].map((id) => ({ id }));
  const registry = {
    schemaVersion: 1,
    status: "editorial-preview",
    review: { humanReviewed: false },
    profiles: domains.map(({ id }) => ({
      id,
      revision: 1,
      label: id,
      medium: "A clear category medium",
      palette: ["#112233", "#ddeeff"],
      composition: "Square close-up",
      semanticChecks: "Actual word cue",
      avoid: "No decorative text",
    })),
  };
  const batch = {
    schemaVersion: 1,
    review: { humanReviewed: false },
    modules: domains.map(({ id }) => ({
      categoryId: id,
      status: "published-preview",
      visualLanguageId: id,
      review: { humanReviewed: false },
      entryIds: [id + "1", id + "2"],
    })),
  };
  const entries = batch.modules.flatMap((module) =>
    module.entryIds.map((id) => ({ id, topic: module.categoryId })),
  );
  const published = { manifest: { taxonomy: { domains } }, entries };
  const audit = {
    entries: entries.map((entry) => ({
      entryId: entry.id,
      asset: { path: `atlas/img/${entry.id}.webp` },
      visual: {
        decision: "added",
        languageId: entry.topic,
        languageSha256: visualLanguageHash(
          registry.profiles.find((p) => p.id === entry.topic),
        ),
        styleInspection: "Inspected actual full-size and thumbnail pixels",
      },
      review: { humanReviewed: false },
    })),
  };
  const provenance = {
    assets: audit.entries.map((item) => ({
      entryId: item.entryId,
      kind: "img",
      path: item.asset.path,
      visualLanguage: {
        id: item.visual.languageId,
        sha256: item.visual.languageSha256,
      },
    })),
  };
  return { registry, batch, published, audit, provenance };
}
const check = (f) =>
  validateVisualBatch(f.registry, f.batch, f.published, f.audit, f.provenance);

test("category briefs cover the whole published taxonomy without duplicate identities", () => {
  const f = fixture();
  assert.deepEqual(check(f), { categories: 2, words: 4, humanReviewed: false });
  f.registry.profiles.pop();
  assert.throws(
    () =>
      validateVisualRegistry(f.registry, f.published.manifest.taxonomy.domains),
    /every category/,
  );
  f.registry.profiles.push(f.registry.profiles[0]);
  assert.throws(
    () =>
      validateVisualRegistry(f.registry, f.published.manifest.taxonomy.domains),
    /duplicate/,
  );
});

test("changing a category medium or swapping its attribution invalidates previous visual assessments", () => {
  const changed = fixture();
  changed.registry.profiles[0].medium = "An unrelated medium";
  assert.throws(() => check(changed), /Stale category visual brief/);
  const swapped = fixture();
  swapped.audit.entries[0].visual.languageId = "b";
  assert.throws(() => check(swapped), /Stale category visual brief/);
  const rights = fixture();
  rights.provenance.assets[0].visualLanguage.sha256 = "0".repeat(64);
  assert.throws(() => check(rights), /Stale visual provenance/);
});

test("a style inspection cannot be omitted or upgraded into an unrecorded human approval", () => {
  const absent = fixture();
  absent.audit.entries[0].visual.styleInspection = "";
  assert.throws(() => check(absent), /Missing AI style inspection/);
  const falseApproval = fixture();
  falseApproval.audit.entries[0].review.humanReviewed = true;
  assert.throws(() => check(falseApproval), /unsupported review claim/);
  const misplaced = fixture();
  misplaced.published.entries[0].topic = "b";
  assert.throws(() => check(misplaced), /misplaced visual vocabulary/);
});

test("the new release adds two genuinely new entries in every category and preserves previous identities", () => {
  const batch = read("content/category-expansion-5.json"),
    current = loadPublishedRelease({ root });
  const baseline = read(`public/${batch.baseline.manifest}`);
  const old = baseline.dataFiles
    .filter((file) => file.path.startsWith("content/entries/"))
    .flatMap((file) => read(`public/${file.path}`));
  const all = new Map(current.entries.map((entry) => [entry.id, entry]));
  assert.equal(old.length, 127);
  for (const entry of old) {
    assert.ok(all.has(entry.id), entry.id);
    assert.equal(all.get(entry.id).w, entry.w);
    assert.deepEqual(
      all.get(entry.id).senses.map((s) => s.id),
      entry.senses.map((s) => s.id),
    );
  }
  assert.deepEqual(checkVisualLanguages({ root }), {
    categories: 32,
    words: 64,
    humanReviewed: false,
  });
  assert.ok(current.entries.length >= 191);
  for (const module of batch.modules)
    for (const id of module.entryIds) {
      assert.ok(!old.some((entry) => entry.id === id), id);
      const entry = all.get(id);
      assert.deepEqual(entry.domainIds, [module.categoryId]);
      assert.ok(gap(entry.ex[0].en, entry.w), id);
      assert.ok(fs.existsSync(path.join(root, "public", entry.media.img)));
      assert.equal(entry.senses[0].review.humanReviewed, false);
    }
});

test("every new word retains complete English-bound Portuguese and Spanish explanations and practice examples", () => {
  const published = loadPublishedRelease({ root }),
    batch = read("content/category-expansion-5.json");
  const all = new Map(published.entries.map((entry) => [entry.id, entry]));
  for (const locale of ["pt-BR", "es-419"]) {
    const native = compileLocale(
      read(`content/locales/${locale}.json`),
      published,
    );
    for (const module of batch.modules)
      for (const id of module.entryIds) {
        const source = all.get(id),
          entry = native.entries[id];
        assert.equal(entry?.sourceWord, source.w, id);
        assert.deepEqual(
          Object.keys(entry.senses),
          source.senses.map((sense) => sense.id),
        );
        assert.deepEqual(
          entry.examples.map((example) => example.en),
          source.ex.map((example) => example.en),
        );
        assert.equal(entry.examples.length, 2, id);
        assert.equal(entry.collocations.length, 3, id);
        assert.ok(entry.tip.trim(), id);
      }
  }
});
