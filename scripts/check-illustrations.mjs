import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { loadPublishedRelease } from "./build-locales.mjs";

const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
const meaningBinding = (entry) => entry.senses.map((sense) => ({ senseId: sense.id, pos: sense.pos, en: sense.en }));
const exampleBinding = (entry) => entry.ex.map((example) => ({ en: example.en, ...(example.senseId ? { senseId: example.senseId } : {}) }));

function assetBytes(root, relative, prefix) {
  requireValue(
    typeof relative === "string" && relative.startsWith(prefix) &&
      !relative.includes("..") && !relative.includes("\\") && !path.isAbsolute(relative) &&
      /\.(?:webp|png|svg|jpe?g)$/i.test(relative),
    `Unsafe illustration asset path: ${relative}`,
  );
  const publicRoot = fs.realpathSync(path.join(root, "public"));
  const target = fs.realpathSync(path.join(publicRoot, relative));
  requireValue(target.startsWith(publicRoot + path.sep), `Illustration asset escapes public/: ${relative}`);
  const stat = fs.statSync(target);
  requireValue(stat.isFile() && stat.size > 0 && stat.size <= 16 * 1024 * 1024, `Invalid illustration asset size: ${relative}`);
  return fs.readFileSync(target);
}

/** Integrity/staleness checks bind an AI assessment to exact content; they do not judge image meaning. */
export function validateIllustrationAudit(audit, published, { root = process.cwd(), source, provenance } = {}) {
  requireValue(
    record(audit) && audit.schemaVersion === 1 && audit.status === "editorial-preview" &&
      audit.review?.humanReviewed === false && nonempty(audit.review?.method) && Array.isArray(audit.entries),
    "Expected an honestly AI-inspected illustration audit schema version 1",
  );
  requireValue(Array.isArray(published?.index?.entries) && Array.isArray(published.entries), "Verified published entries are required");
  requireValue(Array.isArray(source?.entries) && Array.isArray(provenance?.assets), "Source entries and media provenance are required");
  const publishedEntries = new Map(published.entries.map((entry) => [entry.id, entry]));
  const indexIds = new Set(published.index.entries.map((entry) => entry.id));
  requireValue(indexIds.size === published.index.entries.length && publishedEntries.size === published.entries.length, "Duplicate published illustration identity");
  requireValue(indexIds.size === publishedEntries.size && [...indexIds].every((id) => publishedEntries.has(id)), "Published illustration index and entries disagree");
  const sourceEntries = new Map(source.entries.map((entry) => [entry.id, entry]));
  requireValue(sourceEntries.size === source.entries.length, "Duplicate authoring lexical identity");
  const manifestAssets = new Map(published.manifest.assets.map((asset) => [asset.path, asset]));
  const audited = new Map();
  for (const item of audit.entries) {
    requireValue(record(item) && nonempty(item.entryId) && !audited.has(item.entryId), "Invalid or duplicate illustration audit identity");
    requireValue(indexIds.has(item.entryId), `Unknown or unpublished illustration audit record: ${item.entryId}`);
    audited.set(item.entryId, item);
    const entry = publishedEntries.get(item.entryId);
    const author = sourceEntries.get(item.entryId);
    requireValue(author && author.w === entry.w && item.sourceWord === entry.w, `Stale illustration headword binding: ${item.entryId}`);
    requireValue(Array.isArray(author.senses) && Array.isArray(author.ex), `Invalid authoring illustration content: ${item.entryId}`);
    const publishedSenseIds = new Set(entry.senses.map((sense) => sense.id));
    const authorPublishedPart = {
      senses: author.senses.filter((sense) => publishedSenseIds.has(sense.id)),
      ex: author.ex.filter((example) => !example.senseId || publishedSenseIds.has(example.senseId)),
    };
    requireValue(JSON.stringify(meaningBinding(authorPublishedPart)) === JSON.stringify(meaningBinding(entry)), `Stale illustration authoring meaning binding: ${item.entryId}`);
    requireValue(JSON.stringify(exampleBinding(authorPublishedPart)) === JSON.stringify(exampleBinding(entry)), `Stale illustration authoring example binding: ${item.entryId}`);
    requireValue(author.topic === entry.topic, `Stale illustration authoring category binding: ${item.entryId}`);
    requireValue(JSON.stringify(item.meanings) === JSON.stringify(meaningBinding(entry)), `Stale illustration meaning binding: ${item.entryId}`);
    requireValue(JSON.stringify(item.examples) === JSON.stringify(exampleBinding(entry)), `Stale illustration example binding: ${item.entryId}`);
    requireValue(item.categoryId === entry.topic, `Stale illustration category binding: ${item.entryId}`);
    requireValue(
      ["retained", "replaced", "added"].includes(item.visual?.decision) && nonempty(item.visual?.expectedCue) && nonempty(item.visual?.reason) &&
        item.review?.humanReviewed === false && item.review?.method === "AI visual inspection",
      `Missing illustration assessment or unsupported review claim: ${item.entryId}`,
    );
    requireValue(record(item.asset) && /^[a-f0-9]{64}$/.test(item.asset.sha256 ?? ""), `Invalid illustration hash: ${item.entryId}`);
    requireValue(author.media?.img === item.asset.path, `Stale illustration source path: ${item.entryId}`);
    requireValue(hash(assetBytes(root, item.asset.path, "atlas/img/")) === item.asset.sha256, `Stale illustration asset hash: ${item.entryId}`);
    const publishedAsset = manifestAssets.get(entry.media?.img);
    requireValue(publishedAsset?.sha256 === item.asset.sha256, `Published illustration differs from audited image: ${item.entryId}`);
    requireValue(hash(assetBytes(root, entry.media.img, "content/media/")) === publishedAsset.sha256, `Published illustration integrity failed: ${item.entryId}`);
    const rights = provenance.assets.filter((asset) => asset.entryId === item.entryId && asset.kind === "img" && asset.path === item.asset.path);
    requireValue(rights.length === 1, `Missing or ambiguous illustration provenance: ${item.entryId}`);
    if (rights[0].sha256 !== undefined)
      requireValue(rights[0].sha256 === item.asset.sha256, `Stale illustration provenance hash: ${item.entryId}`);
  }
  for (const id of indexIds) requireValue(audited.has(id), `Missing illustration audit record: ${id}`);
  return { words: indexIds.size, added: audit.entries.filter((entry) => entry.visual.decision === "added").length, replaced: audit.entries.filter((entry) => entry.visual.decision === "replaced").length, humanReviewed: false };
}

export function checkIllustrations({ root = process.cwd() } = {}) {
  const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
  return validateIllustrationAudit(read("content/illustration-audit.json"), loadPublishedRelease({ root }), {
    root,
    source: read("content/entries.json"),
    provenance: read("content/media-provenance.json"),
  });
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const result = checkIllustrations();
    console.log(`Illustration bindings current: ${result.words} published words; ${result.replaced} replacements; ${result.added} newly illustrated words. Semantic judgments are AI-inspected previews, not software-proven or independently human-approved.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
