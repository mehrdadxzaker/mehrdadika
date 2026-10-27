import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { compileLocale, loadPublishedRelease } from "./build-locales.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const source = read("content/entries.json");
const batch = read("content/new-word-batch.json");
const entries = new Map(source.entries.map((entry) => [entry.id, entry]));

test("the first expansion preserves existing lexical and meaning identities while seeding sparse domains", () => {
  const baseline = read("public/content/releases/2026-10-preview-1-3471bac36b45/manifest.json");
  const oldIndex = read(`public/${baseline.payload.path}`);
  for (const prior of oldIndex.entries) {
    const current = entries.get(prior.id);
    assert.ok(current, `Preserved lexical ID: ${prior.id}`);
    for (const sense of prior.senses) assert.ok(current.senses.some((candidate) => candidate.id === sense.id), sense.id);
  }
  assert.equal(new Set(batch.entryIds).size, 16);
  assert.ok(batch.entryIds.every((id) => !oldIndex.entries.some((prior) => prior.id === id)));
  for (const domain of ["law-public-affairs", "arts-media", "gaming-digital-culture", "safety-emergencies"])
    assert.ok(batch.entryIds.some((id) => entries.get(id)?.domainIds.includes(domain)), domain);
  assert.equal(new Set(source.entries.map((entry) => entry.id)).size, source.entries.length);
});

test("new preview illustrations have original rights records and hashes for their actual self-contained source bytes", () => {
  const provenance = read("content/media-provenance.json");
  for (const id of batch.entryIds) {
    const entry = entries.get(id);
    assert.ok(entry);
    const mediaPath = entry.media.img;
    const asset = provenance.assets.find((candidate) => candidate.entryId === id && candidate.path === mediaPath);
    assert.ok(asset, id);
    assert.equal(asset.license, "CC-BY-4.0");
    assert.match(asset.attribution, /Mehrdadika/);
    const bytes = fs.readFileSync(path.join(root, "public", mediaPath));
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), asset.sha256);
    const svg = bytes.toString("utf8");
    assert.match(svg, /<svg\b/);
    assert.doesNotMatch(svg, /<script\b|(?:href|xlink:href)\s*=\s*["']https?:/i);
    for (const kind of ["uk", "us", "ex", "ex2"]) {
      if (!entry.media[kind]) continue;
      assert.ok(fs.existsSync(path.join(root, "public", entry.media[kind])), `${id}: no invented ${kind} recording`);
    }
  }
});

test("Portuguese and Spanish authoring overlays align to all expanded English meanings and examples", () => {
  const taxonomy = read("docs/category-catalog.json");
  for (const locale of ["pt-BR", "es-419"]) {
    const overlay = read(`content/locales/${locale}.json`);
    assert.equal(overlay.locale, locale);
    assert.equal(overlay.status, "preview");
    assert.equal(overlay.review.humanReviewed, false);
    assert.deepEqual(Object.keys(overlay.categories).sort(), taxonomy.domains.map((domain) => domain.id).sort());
    for (const entry of source.entries) {
      const translation = overlay.entries[entry.id];
      assert.equal(translation?.sourceWord, entry.w, `${locale}: ${entry.id}`);
      assert.deepEqual(Object.keys(translation.senses).sort(), entry.senses.map((sense) => sense.id).sort());
      assert.deepEqual(translation.examples.map((pair) => pair.en), entry.ex.map((example) => example.en));
      assert.deepEqual(translation.collocations.map((pair) => pair.en), entry.col.map((pair) => pair.split(/[｜|]/)[0].trim()));
      for (const sense of Object.values(translation.senses)) {
        assert.ok(sense.gloss.trim());
        assert.ok(sense.definition.trim());
      }
      for (const pair of [...translation.examples, ...translation.collocations]) {
        assert.ok(pair.translation.trim());
        assert.doesNotMatch(pair.translation, /[\u0600-\u06ff]/);
      }
    }
  }
});

test("all 348 Portuguese and Spanish subcategory labels are source-bound and survive published taxonomy compilation", () => {
  const taxonomy = read("docs/category-catalog.json");
  const published = loadPublishedRelease({ root });
  for (const locale of ["pt-BR", "es-419"]) {
    const overlay = read(`content/locales/${locale}.json`);
    const compiled = compileLocale(overlay, published);
    let rawCount = 0;
    let publishedCount = 0;
    for (const domain of taxonomy.domains) {
      const pairs = overlay.categories[domain.id].subcategories;
      assert.deepEqual(pairs.map((pair) => pair.en), domain.subcategories, `${locale}: ${domain.id} source bindings`);
      for (const pair of pairs) {
        assert.ok(pair.translation.trim());
        assert.doesNotMatch(pair.translation, /[\u0600-\u06ff]/);
      }
      rawCount += pairs.length;
    }
    for (const domain of published.manifest.taxonomy.domains) {
      const native = compiled.categories[domain.id].subcategoryLabels;
      const expected = domain.subcategories.map((en) => overlay.categories[domain.id].subcategories.find((pair) => pair.en === en).translation);
      assert.deepEqual(native, expected, `${locale}: ${domain.id} compiled labels`);
      publishedCount += native.length;
    }
    assert.equal(rawCount, 348);
    assert.equal(publishedCount, 348);
  }
});
