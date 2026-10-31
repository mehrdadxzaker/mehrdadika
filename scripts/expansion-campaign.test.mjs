import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
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
import {
  categoryCoverage,
  validateExpansionPlan,
} from "./content-coverage.mjs";
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

test("legacy image refreshes are bounded and never counted as new vocabulary", () => {
  const c = campaign(),
    domains = live().manifest.taxonomy.domains;
  c.batches[0].imageRefreshEntryIds = ["force", "force"];
  assert.throws(() => validateCampaign(c, domains), /Image refreshes/);
  c.batches[0].imageRefreshEntryIds = [c.batches[0].modules[0].entryIds[0]];
  assert.throws(() => validateCampaign(c, domains), /Image refreshes/);
  const published = live(),
    byId = new Map(published.entries.map((e) => [e.id, e]));
  let refreshed = 0;
  for (const batch of campaign().batches.filter(
    (b) => b.status === "published-preview",
  )) {
    const pinned = loadPublishedRelease({
      root,
      pointer: {
        schemaVersion: 1,
        manifest: batch.baseline.manifest,
        sha256: batch.baseline.manifestSha256,
      },
    });
    for (const id of batch.imageRefreshEntryIds ?? []) {
      const previous = pinned.entries.find((e) => e.id === id),
        current = byId.get(id);
      assert.equal(current.w, previous.w);
      assert.deepEqual(
        current.senses.map((s) => s.id),
        previous.senses.map((s) => s.id),
      );
      assert.notEqual(current.media.img, previous.media.img);
      const bytes = fs.readFileSync(
        path.join(root, "public", previous.media.img),
      );
      assert.equal(
        crypto.createHash("sha256").update(bytes).digest("hex"),
        pinned.manifest.assets.find((a) => a.path === previous.media.img)
          .sha256,
      );
      refreshed++;
    }
  }
  assert.equal(loadCampaign({ root }).refreshedCampaignImages, refreshed);
});

function imageCorrectionBatch() {
  const historical = campaign().batches.find((b) =>
    b.imageRefreshEntryIds?.includes("force"),
  );
  return {
    id: "existing-image-correction-fixture",
    kind: "existing-image-correction",
    newEnglishWords: 0,
    status: "published-preview",
    releaseId: "fixture-correction-release",
    baseline: structuredClone(historical.baseline),
    modules: [],
    imageRefreshEntryIds: ["force"],
    review: { humanReviewed: false },
  };
}

test("only explicit zero-addition corrections may omit category modules", () => {
  const domains = live().manifest.taxonomy.domains,
    valid = campaign();
  valid.batches.push(imageCorrectionBatch());
  assert.doesNotThrow(() => validateCampaign(valid, domains));
  assert.deepEqual(
    campaignProgress(live(), valid),
    campaignProgress(live(), campaign()),
  );
  for (const mutate of [
    (b) => delete b.kind,
    (b) => (b.newEnglishWords = 1),
    (b) => (b.imageRefreshEntryIds = []),
    (b) => (b.imageRefreshEntryIds = ["force", "force"]),
    (b) => (b.imageRefreshEntryIds = ["force", "current", "beam"]),
    (b) =>
      (b.modules = [
        {
          categoryId: "engineering",
          visualLanguageId: "engineering",
          entryIds: ["force"],
        },
      ]),
    (b) => (b.review.humanReviewed = true),
    (b) => (b.baseline.manifestSha256 = "not-a-hash"),
  ]) {
    const c = campaign(),
      batch = imageCorrectionBatch();
    mutate(batch);
    c.batches.push(batch);
    assert.throws(() => validateCampaign(c, domains));
  }
});

test("refresh validation proves old membership in each hash-verified batch baseline", () => {
  const published = live(),
    registry = read("content/visual-languages.json"),
    audit = read("content/illustration-audit.json"),
    provenance = read("content/media-provenance.json"),
    overlays = {
      "pt-BR": read("content/locales/pt-BR.json"),
      "es-419": read("content/locales/es-419.json"),
    };
  const check = (batch) => {
    const c = campaign();
    c.batches = [batch];
    return validateCampaignAssets(
      c,
      published,
      registry,
      audit,
      provenance,
      overlays,
      published,
      { root },
    );
  };
  const valid = imageCorrectionBatch();
  assert.ok(
    published.entries.length > valid.baseline.words,
    "Later words must not make a historical refresh invalid",
  );
  const report = check(valid);
  assert.equal(report.publishedCampaignWords, 0);
  assert.equal(report.refreshedCampaignImages, 1);
  const futureId = structuredClone(valid);
  futureId.imageRefreshEntryIds = ["garden-bench"];
  assert.ok(published.entries.some((e) => e.id === "garden-bench"));
  assert.throws(
    () => check(futureId),
    /did not exist in its pinned batch baseline/,
  );
  const badHash = structuredClone(valid);
  badHash.baseline.manifestSha256 = "0".repeat(64);
  assert.throws(() => check(badHash), /integrity failed/);
  const wrongWords = structuredClone(valid);
  wrongWords.baseline.words++;
  assert.throws(() => check(wrongWords), /baseline metadata differs/);
  const unchanged = structuredClone(valid),
    pointer = read("public/content/current.json");
  unchanged.baseline = {
    releaseId: published.manifest.release.id,
    manifest: pointer.manifest,
    manifestSha256: pointer.sha256,
    words: published.entries.length,
  };
  assert.throws(() => check(unchanged), /must change the baseline image/);
});

function imageCorrectionLedger() {
  const plan = read("content/category-expansion.json"),
    published = live();
  const source = read("content/entries.json").entries.find(
    (e) => e.id === "force",
  );
  const rights = read("content/media-provenance.json").assets.find(
    (a) =>
      a.entryId === "force" && a.kind === "img" && a.path !== source.media.img,
  );
  const oldSha256 = crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(root, "public", rights.path)))
    .digest("hex");
  const current = published.entries.find((e) => e.id === "force");
  const newSha256 = current.media.img.match(/([a-f0-9]{64})\.webp$/)[1];
  const record = {
    id: "fixture-correction",
    kind: "existing-image-correction",
    releaseId: "fixture-correction-release",
    status: "published-preview",
    newEnglishWords: 0,
    baseline: imageCorrectionBatch().baseline,
    entryIds: ["force"],
    images: [
      {
        entryId: "force",
        oldPath: rights.path,
        oldSha256,
        newPath: source.media.img,
        newSha256,
      },
    ],
    review: { humanReviewed: false },
  };
  plan.imageCorrections = [record];
  return { plan, published, record };
}

test("separate correction ledger reports zero new words without fake modules", () => {
  const { plan, published } = imageCorrectionLedger();
  const before = categoryCoverage(published, { ...plan, imageCorrections: [] });
  const after = categoryCoverage(published, plan);
  assert.equal(after.words, before.words);
  assert.equal(after.meanings, before.meanings);
  assert.deepEqual(after.categories, before.categories);
  assert.deepEqual(after.imageCorrections, {
    batches: 1,
    images: 1,
    newEnglishWords: 0,
  });
  const absent = structuredClone(plan);
  delete absent.imageCorrections;
  assert.deepEqual(categoryCoverage(published, absent).imageCorrections, {
    batches: 0,
    images: 0,
    newEnglishWords: 0,
  });
});

test("correction ledger rejects malformed identity, baseline, paths, hashes and approval", () => {
  const domains = live().manifest.taxonomy.domains;
  for (const mutate of [
    (p, r) => (p.imageCorrections = {}),
    (p, r) => (r.kind = "ordinary-module"),
    (p, r) => (r.newEnglishWords = 1),
    (p, r) => (r.review.humanReviewed = true),
    (p, r) => p.imageCorrections.push(structuredClone(r)),
    (p, r) => (r.baseline.manifest = "content/releases/../../private.json"),
    (p, r) => (r.baseline.manifestSha256 = "bad"),
    (p, r) => (r.entryIds = ["force", "force"]),
    (p, r) => (r.images = []),
    (p, r) => (r.images[0].entryId = "current"),
    (p, r) => (r.images[0].oldPath = "atlas/img/../force.webp"),
    (p, r) => (r.images[0].newPath = "atlas/img/current-v2.webp"),
    (p, r) => (r.images[0].newPath = "atlas/img/force-v1.webp"),
    (p, r) => (r.images[0].newSha256 = r.images[0].oldSha256),
    (p, r) => (r.images[0].newSha256 = "bad"),
  ]) {
    const { plan, record } = imageCorrectionLedger();
    mutate(plan, record);
    assert.throws(() => validateExpansionPlan(plan, domains));
  }
  const { plan, published } = imageCorrectionLedger();
  plan.imageCorrections[0].entryIds = ["missing"];
  plan.imageCorrections[0].images[0].entryId = "missing";
  plan.imageCorrections[0].images[0].newPath = "atlas/img/missing-v2.webp";
  assert.throws(
    () => categoryCoverage(published, plan),
    /unavailable or stale/,
  );
});

test("later image versions retain historical rows without inflating vocabulary", () => {
  const { plan, published, record } = imageCorrectionLedger(),
    second = structuredClone(record);
  second.id = "fixture-correction-2";
  second.releaseId = "fixture-correction-release-2";
  second.images[0].oldPath = record.images[0].newPath;
  second.images[0].oldSha256 = record.images[0].newSha256;
  const version = Number(record.images[0].newPath.match(/-v(\d+)\.webp$/)[1]);
  second.images[0].newPath = "atlas/img/force-v" + (version + 1) + ".webp";
  second.images[0].newSha256 = "b".repeat(64);
  plan.imageCorrections.push(second);
  assert.throws(
    () => categoryCoverage(published, plan),
    /unavailable or stale/,
  );
  published.entries.find((e) => e.id === "force").media.img =
    "content/media/" + "b".repeat(64) + ".webp";
  const after = categoryCoverage(published, plan);
  assert.equal(after.words, published.entries.length);
  assert.deepEqual(after.imageCorrections, {
    batches: 2,
    images: 2,
    newEnglishWords: 0,
  });
  const repeatedVersion = structuredClone(second);
  repeatedVersion.id = "duplicate-version";
  plan.imageCorrections.push(repeatedVersion);
  assert.throws(
    () => categoryCoverage(published, plan),
    /duplicate image correction asset/,
  );
});
