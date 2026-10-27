import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { test } from "node:test";
import { buildContent } from "./build-content.mjs";
import { checkIllustrations, validateIllustrationAudit } from "./check-illustrations.mjs";
import { loadPublishedRelease } from "./build-locales.mjs";

const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const write = (root, relative, value) => {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value));
};
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mehrdadika-illustration-audit-"));
  const image = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="red"/></svg>';
  const source = {
    corpusId: "test-corpus", releaseId: "test-illustration-1", channel: "preview",
    entries: [{ id: "slice", w: "slice", cefr: "A2", topic: "d0", senses: [{ id: "slice:main", pos: "v.", en: "To cut into thin, flat pieces.", fa: "برش زدن", review: { status: "preview", humanReviewed: false } }], ex: [{ en: "Slice the bread.", fa: "نان را برش بزنید.", senseId: "slice:main" }], col: [], fam: [], syn: [], ant: [], tip: "", provenance: { license: "CC-BY-4.0", aiAssisted: true }, media: { img: "atlas/img/slice.svg" } }],
  };
  const taxonomy = { domains: Array.from({ length: 32 }, (_, i) => ({ id: `d${i}`, labelFa: `حوزه ${i}`, labelEn: `Domain ${i}`, subcategories: [], discoveryGroupId: "g" })), discoveryGroups: [{ id: "g", domainIds: Array.from({ length: 32 }, (_, i) => `d${i}`) }] };
  const provenance = { assets: [{ entryId: "slice", kind: "img", path: "atlas/img/slice.svg", sha256: hash(image) }] };
  const audit = { schemaVersion: 1, status: "editorial-preview", review: { method: "AI visual inspection", humanReviewed: false }, entries: [{ entryId: "slice", sourceWord: "slice", categoryId: "d0", meanings: [{ senseId: "slice:main", pos: "v.", en: "To cut into thin, flat pieces." }], examples: [{ en: "Slice the bread.", senseId: "slice:main" }], asset: { path: "atlas/img/slice.svg", sha256: hash(image) }, visual: { decision: "replaced", expectedCue: "Knife visibly cuts thin bread slices.", reason: "An action cue is required, not a completed loaf alone." }, review: { method: "AI visual inspection", humanReviewed: false } }] };
  write(root, "public/atlas/img/slice.svg", image);
  write(root, "content/entries.json", source);
  write(root, "content/media-provenance.json", provenance);
  write(root, "content/illustration-audit.json", audit);
  write(root, "docs/category-catalog.json", taxonomy);
  buildContent({ root });
  return { root, image, source, provenance, audit, published: loadPublishedRelease({ root }) };
}

test("illustration audit binds current source and immutable published image bytes, rejecting stale source, release and provenance hashes", () => {
  const f = fixture();
  try {
    assert.deepEqual(checkIllustrations({ root: f.root }), { words: 1, added: 0, replaced: 1, humanReviewed: false });
    write(f.root, "public/atlas/img/slice.svg", f.image.replace("red", "blue"));
    assert.throws(() => checkIllustrations({ root: f.root }), /Stale illustration asset hash/);
    write(f.root, "public/atlas/img/slice.svg", f.image);
    const publishedPath = f.published.entries[0].media.img;
    write(f.root, `public/${publishedPath}`, f.image.replace("red", "blue"));
    assert.throws(() => checkIllustrations({ root: f.root }), /Published illustration integrity failed/);
    write(f.root, `public/${publishedPath}`, f.image);
    f.provenance.assets[0].sha256 = "0".repeat(64);
    write(f.root, "content/media-provenance.json", f.provenance);
    assert.throws(() => checkIllustrations({ root: f.root }), /Stale illustration provenance hash/);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test("illustration audit rejects stale English sense or example bindings and cannot assert human approval", () => {
  const f = fixture();
  const check = (audit) => validateIllustrationAudit(audit, f.published, f);
  try {
    const staleSense = structuredClone(f.audit);
    staleSense.entries[0].meanings[0].en = "To remove the skin.";
    assert.throws(() => check(staleSense), /Stale illustration meaning binding/);
    const staleExample = structuredClone(f.audit);
    staleExample.entries[0].examples[0].en = "Peel the carrot.";
    assert.throws(() => check(staleExample), /Stale illustration example binding/);
    const falseApproval = structuredClone(f.audit);
    falseApproval.entries[0].review.humanReviewed = true;
    assert.throws(() => check(falseApproval), /unsupported review claim/);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test("unpublished authoring drafts do not require illustration audit records or affect published coverage", () => {
  const f = fixture();
  try {
    f.source.entries.push({ ...structuredClone(f.source.entries[0]), id: "future-word", w: "future", publication: "draft", senses: [{ ...f.source.entries[0].senses[0], id: "future-word:main", review: { status: "draft", humanReviewed: false } }], media: { img: "atlas/img/not-created-yet.webp" } });
    f.source.entries[0].senses.push({ ...structuredClone(f.source.entries[0].senses[0]), id: "slice:future", en: "A separate unpublished draft meaning.", review: { status: "draft", humanReviewed: false } });
    f.source.entries[0].ex.push({ en: "A draft example for the new meaning.", fa: "نمونهٔ پیش‌نویس", senseId: "slice:future" });
    write(f.root, "content/entries.json", f.source);
    assert.equal(checkIllustrations({ root: f.root }).words, 1);
    buildContent({ root: f.root });
    assert.equal(checkIllustrations({ root: f.root }).words, 1);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test("edits to published meanings, examples or categories in authoring source invalidate the old assessment before rebuilding", () => {
  const f = fixture();
  const check = (source) => validateIllustrationAudit(f.audit, f.published, { root: f.root, source, provenance: f.provenance });
  try {
    const changedMeaning = structuredClone(f.source);
    changedMeaning.entries[0].senses[0].en = "To remove an outer skin.";
    assert.throws(() => check(changedMeaning), /Stale illustration authoring meaning binding/);
    const changedExample = structuredClone(f.source);
    changedExample.entries[0].ex[0].en = "Peel the carrot.";
    assert.throws(() => check(changedExample), /Stale illustration authoring example binding/);
    const changedCategory = structuredClone(f.source);
    changedCategory.entries[0].topic = "d1";
    assert.throws(() => check(changedCategory), /Stale illustration authoring category binding/);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test("published illustration coverage must be complete and cannot contain unknown or duplicate records", () => {
  const f = fixture();
  const check = (audit) => validateIllustrationAudit(audit, f.published, f);
  try {
    assert.throws(() => check({ ...f.audit, entries: [] }), /Missing illustration audit record: slice/);
    const unknown = structuredClone(f.audit);
    unknown.entries.push({ ...unknown.entries[0], entryId: "author-only-draft" });
    assert.throws(() => check(unknown), /Unknown or unpublished illustration audit record/);
    const duplicate = structuredClone(f.audit);
    duplicate.entries.push(duplicate.entries[0]);
    assert.throws(() => check(duplicate), /duplicate illustration audit identity/);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});
