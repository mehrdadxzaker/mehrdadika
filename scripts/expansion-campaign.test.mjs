import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  campaignProgress,
  loadCampaign,
  validateCampaign,
  validateCampaignAssets,
  validateCampaignCoverage,
  loadCampaignBaseline,
} from "./expansion-campaign.mjs";
import { gap } from "../src/lib/text.ts";
import { loadPublishedRelease } from "./build-locales.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const read = (relative) =>
  JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const campaign = () => structuredClone(read("content/expansion-campaign.json"));
const live = () => loadPublishedRelease({ root });
function fixture(medicine = 16, engineering = 17) {
  const published = live();
  published.entries = [
    ...Array.from({ length: medicine }, (_, i) => ({
      id: `m${i}`,
      w: `medical word ${i}`,
      topic: "medicine-healthcare",
    })),
    ...Array.from({ length: engineering }, (_, i) => ({
      id: `e${i}`,
      w: `engineering word ${i}`,
      topic: "engineering",
    })),
  ];
  return published;
}
test("published counts ignore planned quotas and draft batches", () => {
  const c = campaign(),
    p = campaignProgress(fixture(), c);
  assert.deepEqual(
    p.priorityTargets.map((t) => [t.publishedWords, t.remainingWords]),
    [
      [16, 484],
      [17, 483],
    ],
  );
  assert.deepEqual(
    p.nextBatch.map((t) => [t.categoryId, t.newEntries]),
    [
      ["medicine-healthcare", 12],
      ["engineering", 12],
    ],
  );
  assert.equal(p.prioritiesComplete, false);
  assert.equal(p.allConfiguredTargetsComplete, false);
});
test("the next batch caps each priority at 500 before starting another category", () => {
  const c = campaign();
  assert.deepEqual(campaignProgress(fixture(499, 500), c).nextBatch, [
    { categoryId: "medicine-healthcare", targetWords: 500, newEntries: 1 },
  ]);
  const p = campaignProgress(fixture(500, 500), c);
  assert.equal(p.prioritiesComplete, true);
  assert.deepEqual(p.nextBatch, [
    {
      categoryId: c.remainingCategoryOrder[0],
      targetWords: 50,
      newEntries: 24,
    },
  ]);
  const complete = fixture(500, 500);
  for (const id of c.remainingCategoryOrder)
    complete.entries.push(
      ...Array.from({ length: 400 }, (_, i) => ({
        id: `${id}-${i}`,
        w: `${id} word ${i}`,
        topic: id,
      })),
    );
  c.status = "complete";
  assert.equal(
    campaignProgress(complete, c).allConfiguredTargetsComplete,
    true,
  );
});
test("repeated English headwords and early completion cannot pad progress", () => {
  const c = campaign(),
    p = fixture();
  p.entries.push({
    id: "duplicate",
    w: "  MEDICAL   WORD 0  ",
    topic: "medicine-healthcare",
  });
  assert.throws(
    () => campaignProgress(p, c),
    /Duplicate or missing English headword/,
  );
  c.status = "complete";
  assert.throws(() => campaignProgress(fixture(), c), /cannot be complete/);
});
test("production cannot widen resource bounds, lose categories or inflate editorial quotas", () => {
  const domains = live().manifest.taxonomy.domains;
  for (const mutate of [
    (c) => (c.production.maxOutboundRequests = 9),
    (c) => (c.production.maxConcurrentAgents = 4),
    (c) => c.production.requiredLocales.pop(),
    (c) => c.remainingCategoryOrder.pop(),
    (c) => c.editorialCoverage.engineering[0].plannedVocabularySlots++,
    (c) =>
      c.batches[0].modules[0].entryIds.push(
        c.batches[0].modules[0].entryIds[0],
      ),
  ]) {
    const c = campaign();
    mutate(c);
    assert.throws(() => validateCampaign(c, domains));
  }
});
test("published campaign additions retain exact category, style and both native bindings", () => {
  const report = loadCampaign({ root, checkAssets: true });
  const c = campaign();
  assert.equal(
    report.publishedCampaignWords,
    c.batches
      .filter((b) => b.status === "published-preview")
      .flatMap((b) => b.modules)
      .reduce((n, m) => n + m.entryIds.length, 0),
  );
  const first = c.batches.find((b) => b.status === "published-preview")
    ?.modules[0].entryIds[0];
  if (!first) return;
  const published = live(),
    registry = read("content/visual-languages.json"),
    audit = read("content/illustration-audit.json"),
    provenance = read("content/media-provenance.json"),
    overlays = {
      "pt-BR": read("content/locales/pt-BR.json"),
      "es-419": read("content/locales/es-419.json"),
    };
  const check = () =>
    validateCampaignAssets(
      c,
      published,
      registry,
      audit,
      provenance,
      overlays,
      loadCampaignBaseline(c, { root }),
    );
  const assessment = audit.entries.find((e) => e.entryId === first),
    original = assessment.visual.languageSha256;
  assessment.visual.languageSha256 = "0".repeat(64);
  assert.throws(check, /Stale or missing campaign style inspection/);
  assessment.visual.languageSha256 = original;
  const second = assessment.review.secondaryInspection;
  delete assessment.review.secondaryInspection;
  assert.throws(check, /second AI image assessment/);
  assessment.review.secondaryInspection = second;
  delete overlays["pt-BR"].entries[first];
  assert.throws(check, /Incomplete campaign native edition/);
});

// The baseline is immutable, so this also protects an expansion from silently replacing existing learning material.
test("specialist batches preserve prior word and sense identities and offer real cloze prompts", () => {
  const c = campaign(),
    published = live(),
    entries = new Map(published.entries.map((e) => [e.id, e]));
  for (const batch of c.batches.filter(
    (b) => b.status === "published-preview",
  )) {
    const baseline = read(`public/${batch.baseline.manifest}`);
    const old = baseline.dataFiles
      .filter((f) => f.path.startsWith("content/entries/"))
      .flatMap((f) => read(`public/${f.path}`));
    assert.equal(old.length, batch.baseline.words);
    for (const entry of old) {
      assert.equal(entries.get(entry.id)?.w, entry.w, entry.id);
      assert.ok(
        entry.senses.every((s) =>
          entries.get(entry.id).senses.some((current) => current.id === s.id),
        ),
        entry.id,
      );
    }
    const oldIds = new Set(old.map((e) => e.id));
    for (const module of batch.modules)
      for (const id of module.entryIds) {
        assert.equal(oldIds.has(id), false, id);
        const entry = entries.get(id);
        assert.ok(gap(entry.ex[0].en, entry.w), id);
        assert.equal(entry.senses[0].review.humanReviewed, false, id);
      }
  }
});

test("unledgered published additions and oversized automatic drafts cannot bypass qualification", () => {
  const c = campaign(),
    published = live(),
    baseline = loadCampaignBaseline(c, { root });
  published.entries.push({
    id: "unledgered",
    w: "unledgered word",
    senses: [{ id: "unledgered:sense" }],
  });
  assert.throws(
    () => validateCampaignCoverage(c, published, baseline),
    /no completed campaign ledger/,
  );
  c.batches.push({
    id: "oversized",
    status: "draft",
    review: { humanReviewed: false },
    modules: [
      {
        categoryId: "engineering",
        visualLanguageId: "engineering",
        entryIds: Array.from({ length: 25 }, (_, i) => `extra-${i}`),
      },
    ],
  });
  assert.throws(
    () => validateCampaign(c, published.manifest.taxonomy.domains),
    /at most 24/,
  );
  c.baseline.manifestSha256 = "0".repeat(64);
  assert.throws(() => loadCampaignBaseline(c, { root }), /integrity failed/);
});

test("an interrupted draft must remain discoverable through its active pointer", () => {
  const c = campaign(),
    domains = live().manifest.taxonomy.domains;
  c.batches = c.batches.filter((b) => b.status !== "draft");
  c.batches.push({
    id: "resumable",
    status: "draft",
    review: { humanReviewed: false },
    modules: [
      {
        categoryId: "engineering",
        visualLanguageId: "engineering",
        entryIds: ["pending-word"],
      },
    ],
  });
  c.activeWorkBatchId = null;
  assert.throws(() => validateCampaign(c, domains), /sole resumable draft/);
  c.activeWorkBatchId = "resumable";
  assert.doesNotThrow(() => validateCampaign(c, domains));
});
