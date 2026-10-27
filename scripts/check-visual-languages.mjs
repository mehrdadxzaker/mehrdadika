import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { loadPublishedRelease } from "./build-locales.mjs";

const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};
const nonempty = (value) =>
  typeof value === "string" && value.trim().length > 0;
export const visualLanguageHash = (profile) =>
  crypto.createHash("sha256").update(JSON.stringify(profile)).digest("hex");

export function validateVisualRegistry(registry, domains) {
  requireValue(
    registry?.schemaVersion === 1 &&
      registry.status === "editorial-preview" &&
      registry.review?.humanReviewed === false &&
      Array.isArray(registry.profiles),
    "Expected honestly unreviewed visual language registry",
  );
  const domainIds = new Set(domains.map((domain) => domain.id));
  const profiles = new Map();
  for (const profile of registry.profiles) {
    requireValue(
      profile && domainIds.has(profile.id) && !profiles.has(profile.id),
      "Invalid or duplicate category visual language",
    );
    requireValue(
      Number.isInteger(profile.revision) &&
        profile.revision > 0 &&
        ["label", "medium", "composition", "semanticChecks", "avoid"].every(
          (key) => nonempty(profile[key]),
        ),
      "Incomplete category visual brief",
    );
    requireValue(
      Array.isArray(profile.palette) &&
        profile.palette.length >= 2 &&
        profile.palette.every((color) => /^#[a-f0-9]{6}$/i.test(color)),
      "Invalid category visual palette",
    );
    profiles.set(profile.id, profile);
  }
  requireValue(
    profiles.size === domainIds.size,
    "Visual languages must cover every category exactly once",
  );
  return profiles;
}

/** Validate recorded AI assessments and exact brief bindings, not semantic or stylistic truth. */
export function validateVisualBatch(
  registry,
  batch,
  published,
  audit,
  provenance,
) {
  const profiles = validateVisualRegistry(
    registry,
    published.manifest.taxonomy.domains,
  );
  requireValue(
    batch?.schemaVersion === 1 &&
      batch.review?.humanReviewed === false &&
      Array.isArray(batch.modules),
    "Invalid visual vocabulary batch",
  );
  const words = new Map(published.entries.map((entry) => [entry.id, entry]));
  const assessed = new Map(audit.entries.map((item) => [item.entryId, item]));
  const visited = new Set(),
    categories = new Set();
  for (const module of batch.modules) {
    requireValue(
      profiles.has(module.categoryId) && !categories.has(module.categoryId),
      "Visual batch must cover each category once",
    );
    categories.add(module.categoryId);
    requireValue(
      module.status === "published-preview" &&
        module.visualLanguageId === module.categoryId &&
        module.review?.humanReviewed === false,
      "Unsupported visual module publication or approval claim",
    );
    requireValue(
      Array.isArray(module.entryIds) && module.entryIds.length === 2,
      "Each visual foundation module needs two words",
    );
    const profile = profiles.get(module.categoryId),
      revision = visualLanguageHash(profile);
    for (const id of module.entryIds) {
      requireValue(!visited.has(id), "Duplicate visual batch word");
      visited.add(id);
      const word = words.get(id),
        item = assessed.get(id);
      requireValue(
        word && word.topic === module.categoryId,
        `Unavailable or misplaced visual vocabulary: ${id}`,
      );
      requireValue(
        item?.visual?.decision === "added" &&
          item.visual.languageId === profile.id &&
          item.visual.languageSha256 === revision,
        `Stale category visual brief binding: ${id}`,
      );
      requireValue(
        nonempty(item.visual.styleInspection) &&
          item.review?.humanReviewed === false,
        `Missing AI style inspection or unsupported review claim: ${id}`,
      );
      const rights = provenance.assets.filter(
        (asset) =>
          asset.entryId === id &&
          asset.kind === "img" &&
          asset.path === item.asset.path,
      );
      requireValue(
        rights.length === 1 &&
          rights[0].visualLanguage?.id === profile.id &&
          rights[0].visualLanguage?.sha256 === revision,
        `Stale visual provenance binding: ${id}`,
      );
    }
  }
  requireValue(
    categories.size === profiles.size,
    "Visual batch must cover every category",
  );
  return {
    categories: categories.size,
    words: visited.size,
    humanReviewed: false,
  };
}

export function checkVisualLanguages({ root = process.cwd() } = {}) {
  const read = (relative) =>
    JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
  return validateVisualBatch(
    read("content/visual-languages.json"),
    read("content/category-expansion-5.json"),
    loadPublishedRelease({ root }),
    read("content/illustration-audit.json"),
    read("content/media-provenance.json"),
  );
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  try {
    const report = checkVisualLanguages();
    console.log(
      `Category visual briefs current: ${report.words} new words across ${report.categories} categories. AI pixel judgments remain editorial previews; software checks only their bindings.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
