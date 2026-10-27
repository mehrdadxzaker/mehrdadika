import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { gap, normalize } from "../src/lib/text.ts";
import { loadPublishedRelease, compileLocale } from "./build-locales.mjs";
import {
  categoryCoverage,
  validateExpansionPlan,
  loadCategoryCoverage,
} from "./content-coverage.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (relative) =>
  JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const plan = read("content/category-expansion.json");
const source = read("content/entries.json");
const entries = new Map(source.entries.map((entry) => [entry.id, entry]));
const cooking = plan.modules.find(
  (module) => module.id === "cooking-foundations-1",
);

test("the cooking foundation adds 36 original identities while preserving every earlier word and sense", () => {
  const baseline = read(
    "public/content/releases/2026-10-science-preview-1-c6700fd324b2/manifest.json",
  );
  const previous = baseline.dataFiles
    .filter((shard) => shard.path.startsWith("content/entries/"))
    .flatMap((shard) => read(`public/${shard.path}`));
  assert.equal(previous.length, 91);
  for (const before of previous) {
    const current = entries.get(before.id);
    assert.ok(current, before.id);
    assert.equal(current.w, before.w);
    assert.deepEqual(
      current.senses.map((sense) => sense.id),
      before.senses.map((sense) => sense.id),
    );
  }
  assert.equal(cooking.entryIds.length, 36);
  assert.equal(new Set(cooking.entryIds).size, 36);
  for (const id of cooking.entryIds) {
    assert.ok(!previous.some((entry) => entry.id === id), id);
    assert.equal(entries.get(id).topic, "cooking-food-drink");
    assert.deepEqual(entries.get(id).domainIds, ["cooking-food-drink"]);
  }
  const report = loadCategoryCoverage({ root });
  assert.ok(report.words >= 127);
  assert.ok(report.meanings >= 128);
  assert.ok(
    report.categories.find((category) => category.id === "cooking-food-drink")
      .words >= 50,
  );
});

test("all new cooking words have complete source-bound native overlays and genuine media references", () => {
  const published = loadPublishedRelease({ root });
  for (const locale of ["pt-BR", "es-419"]) {
    const overlay = read(`content/locales/${locale}.json`);
    const native = compileLocale(overlay, published);
    for (const id of cooking.entryIds) {
      const entry = entries.get(id),
        translation = native.entries[id];
      assert.equal(translation?.sourceWord, entry.w);
      assert.deepEqual(
        Object.keys(translation.senses),
        entry.senses.map((sense) => sense.id),
      );
      assert.deepEqual(
        translation.examples.map((example) => example.en),
        entry.ex.map((example) => example.en),
      );
      assert.equal(translation.examples.length, 2);
      assert.equal(translation.collocations.length, 3);
      assert.ok(translation.tip.trim());
      assert.equal(entry.senses[0].review.humanReviewed, false);
      assert.ok(fs.existsSync(path.join(root, "public", entry.media.img)));
      for (const kind of ["uk", "us", "ex", "ex2"])
        if (entry.media[kind])
          assert.ok(
            fs.existsSync(path.join(root, "public", entry.media[kind])),
          );
    }
  }
});

test("the category queue rejects missing or repeated domains and inconsistent module units", () => {
  const domains = read("docs/category-catalog.json").domains;
  assert.doesNotThrow(() => validateExpansionPlan(plan, domains));
  const missing = structuredClone(plan);
  missing.categoryOrder.pop();
  assert.throws(
    () => validateExpansionPlan(missing, domains),
    /every category exactly once/,
  );
  const duplicate = structuredClone(plan);
  duplicate.categoryOrder[0] = duplicate.categoryOrder[1];
  assert.throws(
    () => validateExpansionPlan(duplicate, domains),
    /every category exactly once/,
  );
  const units = structuredClone(plan);
  units.modules[0].units[0].entryIds.pop();
  assert.throws(
    () => validateExpansionPlan(units, domains),
    /cover its vocabulary exactly once/,
  );
});

test("coverage counts a shared English word once globally and once in each of its categories", () => {
  const smallPlan = {
    schemaVersion: 1,
    categoryOrder: ["a", "b"],
    currentCategoryId: "a",
    nextCategoryId: "b",
    milestones: [{ targetWordsPerCategory: 50 }],
    modules: [],
  };
  const published = {
    manifest: {
      release: { id: "test" },
      taxonomy: {
        domains: [
          { id: "a", labelEn: "A" },
          { id: "b", labelEn: "B" },
        ],
      },
    },
    entries: [
      {
        id: "shared",
        topic: "a",
        domainIds: ["a", "b"],
        senses: [{ id: "shared:one" }, { id: "shared:two" }],
      },
    ],
  };
  const report = categoryCoverage(published, smallPlan);
  assert.equal(report.words, 1);
  assert.equal(report.meanings, 2);
  assert.deepEqual(
    report.categories.map((category) => category.words),
    [1, 1],
  );
});

test("every new cooking sense has a usable first example for cloze practice, including multiword headwords", () => {
  for (const id of cooking.entryIds) {
    const entry = entries.get(id);
    const example = entry.ex[0];
    assert.equal(example.senseId, entry.senses[0].id);
    const cloze = gap(example.en, entry.w);
    assert.ok(cloze, id);
    if (entry.w.includes(" "))
      assert.equal(normalize(cloze.hidden), normalize(entry.w));
    assert.ok(cloze.before.length + cloze.after.length > 5, id);
  }
});
