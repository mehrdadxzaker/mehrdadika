import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

const serialize = (value) => JSON.stringify(value, null, 2) + "\n";
export const SUPPORTED_VOCABULARY_LOCALES = ["pt-BR", "es-419"];
const localeName = { "pt-BR": "Brazilian Portuguese", "es-419": "Latin-American Spanish" };
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};
const record = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const safeId = (value) =>
  typeof value === "string" &&
  /^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,159}$/.test(value) &&
  !["__proto__", "constructor", "prototype"].includes(value);
const text = (value, max = 6000) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
const visible = (value) =>
  record(value) &&
  (value.status === undefined ||
    ["preview", "published", "approved"].includes(value.status)) &&
  (value.publication === undefined ||
    ["preview", "published"].includes(value.publication)) &&
  (value.review?.status === undefined ||
    ["preview", "approved"].includes(value.review.status));
const englishCollocation = (value) =>
  typeof value === "string" ? value.split(/[｜|]/)[0].trim() : "";

const subcategoryLabels = (input, source, locale, domainId) => {
  const allowed = source.filter((value) => text(value, 300));
  const sourceLabels = new Set(allowed);
  const matches = new Map();
  for (const pair of Array.isArray(input) ? input : []) {
    if (
      !visible(pair) ||
      !text(pair.en, 300) ||
      !text(pair.translation, 300) ||
      !sourceLabels.has(pair.en)
    )
      continue;
    requireValue(
      !matches.has(pair.en) || matches.get(pair.en) === pair.translation.trim(),
      `Ambiguous ${locale} subcategory translation binding: ${domainId}`,
    );
    matches.set(pair.en, pair.translation.trim());
  }
  // Keep taxonomy positions stable; an untranslated label falls back only to its public English source.
  return allowed.map((en) => matches.get(en) ?? en);
};

/** Pure, conservative publication filter. No authoring record is copied wholesale. */
export function compileLocale(overlay, published) {
  requireValue(
    record(overlay) &&
      overlay.schemaVersion === 1 &&
      SUPPORTED_VOCABULARY_LOCALES.includes(overlay.locale),
    "Expected a supported vocabulary locale schema version 1",
  );
  requireValue(
    overlay.status === "preview" &&
      visible(overlay) &&
      overlay.review?.humanReviewed === false,
    "The vocabulary locale publisher currently supports only honestly unreviewed preview content",
  );
  requireValue(
    Array.isArray(published?.index?.entries) &&
      Array.isArray(published.entries),
    "Published index and entry shards are required",
  );
  requireValue(
    record(overlay.entries) &&
      record(overlay.categories) &&
      record(overlay.groupLabels),
    "Locale entries and category/group labels are required",
  );
  const fullEntries = new Map();
  for (const entry of published.entries) {
    requireValue(
      safeId(entry?.id) && !fullEntries.has(entry.id),
      "Invalid or duplicate published lexical ID",
    );
    fullEntries.set(entry.id, entry);
  }
  const indexIds = new Set();
  const entries = {};
  for (const indexed of published.index.entries) {
    requireValue(
      safeId(indexed?.id) && !indexIds.has(indexed.id),
      "Invalid or duplicate indexed lexical ID",
    );
    indexIds.add(indexed.id);
    const input = overlay.entries[indexed.id];
    const source = fullEntries.get(indexed.id);
    if (
      !visible(indexed) ||
      !visible(source) ||
      !visible(input) ||
      input.sourceWord !== indexed.w ||
      source.w !== indexed.w
    )
      continue;
    const indexedSenses = new Set(
      (indexed.senses ?? []).filter(visible).map((sense) => sense.id),
    );
    const availableSenses = (source.senses ?? []).filter(
      (sense) =>
        visible(sense) && safeId(sense.id) && indexedSenses.has(sense.id),
    );
    const senses = {};
    for (const sense of availableSenses) {
      const translation = input.senses?.[sense.id];
      if (
        !visible(translation) ||
        !text(translation.gloss) ||
        !text(translation.definition)
      )
        continue;
      senses[sense.id] = {
        gloss: translation.gloss.trim(),
        definition: translation.definition.trim(),
      };
    }
    const translatedIds = new Set(Object.keys(senses));
    if (!translatedIds.size) continue;
    const pairList = (inputPairs, publishedEnglish) => {
      const allowed = [
        ...new Set(publishedEnglish.filter((value) => text(value))),
      ];
      const matches = new Map();
      for (const pair of Array.isArray(inputPairs) ? inputPairs : []) {
        if (
          !visible(pair) ||
          !text(pair.en) ||
          !text(pair.translation) ||
          !allowed.includes(pair.en)
        )
          continue;
        requireValue(
          !matches.has(pair.en) ||
            matches.get(pair.en) === pair.translation.trim(),
          `Ambiguous ${overlay.locale} translation binding: ${indexed.id}`,
        );
        matches.set(pair.en, pair.translation.trim());
      }
      return allowed.flatMap((en) =>
        matches.has(en) ? [{ en, translation: matches.get(en) }] : [],
      );
    };
    const examples = pairList(
      input.examples,
      (source.ex ?? [])
        .filter(
          (example) =>
            visible(example) &&
            (!example.senseId || translatedIds.has(example.senseId)),
        )
        .map((example) => example.en),
    );
    const collocations = pairList(
      input.collocations,
      (source.col ?? []).map(englishCollocation),
    );
    // An unscoped note may discuss a hidden meaning; omit it whenever that entry loses a translated sense.
    const allTranslatedSensesPublished = Object.keys(input.senses ?? {}).every(
      (id) => translatedIds.has(id),
    );
    entries[indexed.id] = {
      sourceWord: indexed.w,
      senses,
      examples,
      collocations,
      tip:
        allTranslatedSensesPublished && text(input.tip) ? input.tip.trim() : "",
    };
  }
  const taxonomy = published.manifest?.taxonomy;
  requireValue(
    Array.isArray(taxonomy?.domains) &&
      Array.isArray(taxonomy?.discoveryGroups),
    "Published taxonomy is required",
  );
  const categories = Object.fromEntries(
    taxonomy.domains.flatMap((domain) => {
      const translation = overlay.categories[domain.id];
      return safeId(domain.id) &&
        visible(domain) &&
        visible(translation) &&
        text(translation.label, 300)
        ? [[
          domain.id,
          {
            label: translation.label.trim(),
            ...(Array.isArray(domain.subcategories)
              ? {
                subcategoryLabels: subcategoryLabels(
                  translation.subcategories,
                  domain.subcategories,
                  overlay.locale,
                  domain.id,
                ),
              }
              : {}),
          },
        ]]
        : [];
    }),
  );
  const groupLabels = Object.fromEntries(
    taxonomy.discoveryGroups.flatMap((group) =>
      safeId(group.id) &&
      visible(group) &&
      text(overlay.groupLabels[group.id], 300)
        ? [[group.id, overlay.groupLabels[group.id].trim()]]
        : [],
    ),
  );
  const provenance = {
    license: "CC-BY-4.0",
    aiAssisted: true,
    attribution: text(overlay.provenance?.attribution, 1200)
      ? overlay.provenance.attribution.trim()
      : "Mehrdadika contributors; Word Atlas contributors — CC BY 4.0",
    modifications:
      `${localeName[overlay.locale]} preview translations filtered against the published English release. No independent human language or specialist review is claimed.`,
  };
  return {
    schemaVersion: 1,
    locale: overlay.locale,
    status: "preview",
    review: { humanReviewed: false, status: "preview" },
    provenance,
    sourceRelease: {
      id: text(published.manifest?.release?.id, 160)
        ? published.manifest.release.id
        : "unknown",
      ...(typeof published.manifestPath === "string" &&
      /^content\/[a-zA-Z0-9/._-]+\.json$/.test(published.manifestPath) &&
      !published.manifestPath.includes("..")
        ? { manifest: published.manifestPath }
        : {}),
      ...(typeof published.manifestHash === "string" &&
      /^[a-f0-9]{64}$/.test(published.manifestHash)
        ? { sha256: published.manifestHash }
        : {}),
    },
    categories,
    groupLabels,
    entries,
  };
}

/** Load only hash-verified artifacts selected by public/content/current.json. No authoring corpus is read. */
export function loadPublishedRelease({ root = process.cwd() } = {}) {
  const publicRoot = fs.realpathSync(path.join(root, "public"));
  let totalBytes = 0;
  const readJson = (relative, expectedHash, verify = true) => {
    requireValue(
      typeof relative === "string" &&
        relative.startsWith("content/") &&
        !relative.includes("..") &&
        !relative.includes("\\") &&
        !path.isAbsolute(relative),
      "Unsafe published artifact path",
    );
    const file = fs.realpathSync(path.join(publicRoot, relative));
    requireValue(
      file.startsWith(publicRoot + path.sep),
      "Published artifact escapes public/",
    );
    const stat = fs.statSync(file);
    totalBytes += stat.size;
    requireValue(
      stat.isFile() &&
        stat.size <= 16 * 1024 * 1024 &&
        totalBytes <= 256 * 1024 * 1024,
      "Published artifacts exceed locale compiler limits",
    );
    const bytes = fs.readFileSync(file);
    if (verify)
      requireValue(
        typeof expectedHash === "string" &&
          /^[a-f0-9]{64}$/.test(expectedHash) &&
          hash(bytes) === expectedHash,
        `Published artifact integrity failed: ${relative}`,
      );
    return JSON.parse(bytes.toString("utf8"));
  };
  const pointer = readJson("content/current.json", undefined, false);
  requireValue(
    pointer.schemaVersion === 1,
    "Unsupported published pointer schema",
  );
  const manifest = readJson(pointer.manifest, pointer.sha256);
  requireValue(
    manifest.schemaVersion === 1,
    "Unsupported published manifest schema",
  );
  const index = readJson(manifest.payload?.path, manifest.payload?.sha256);
  requireValue(
    Array.isArray(index.entries) && record(index.shards),
    "Malformed published locale index",
  );
  requireValue(
    Array.isArray(manifest.dataFiles) && manifest.dataFiles.length <= 512,
    "Published entry shard count exceeds locale compiler limits",
  );
  const shardFiles = new Map();
  const entryPaths = new Map();
  const entries = [];
  for (const shard of manifest.dataFiles) {
    requireValue(
      !shardFiles.has(shard.path),
      "Duplicate published entry shard",
    );
    shardFiles.set(shard.path, shard.sha256);
    const content = readJson(shard.path, shard.sha256);
    requireValue(
      Array.isArray(content),
      "Published entry shard must be an array",
    );
    for (const entry of content) {
      requireValue(
        safeId(entry?.id) && !entryPaths.has(entry.id),
        "Invalid or duplicate published lexical ID",
      );
      entryPaths.set(entry.id, shard.path);
      entries.push(entry);
    }
  }
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]));
  for (const entry of index.entries) {
    const shard = index.shards[entry.id];
    requireValue(
      shard &&
        shardFiles.get(shard.path) === shard.sha256 &&
        entryPaths.get(entry.id) === shard.path &&
        entriesById.get(entry.id)?.w === entry.w,
      `Missing verified published card: ${entry.id}`,
    );
  }
  return {
    manifest,
    index,
    entries,
    manifestPath: pointer.manifest,
    manifestHash: pointer.sha256,
  };
}

export function buildLocales({ root = process.cwd(), check = false, locale = "pt-BR" } = {}) {
  requireValue(SUPPORTED_VOCABULARY_LOCALES.includes(locale), "Unsupported vocabulary locale");
  const overlay = JSON.parse(
    fs.readFileSync(path.join(root, `content/locales/${locale}.json`), "utf8"),
  );
  requireValue(overlay.locale === locale, "Vocabulary locale file identity does not match its path");
  const compiled = compileLocale(overlay, loadPublishedRelease({ root }));
  const output = path.join(root, `src/locales/published/${locale}.json`);
  const expected = serialize(compiled);
  if (check) {
    requireValue(
      fs.existsSync(output) && fs.readFileSync(output, "utf8") === expected,
      "Published locale snapshot is stale; run node scripts/build-locales.mjs after building content",
    );
  } else {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    const temporary = `${output}.${process.pid}.tmp`;
    try {
      fs.writeFileSync(temporary, expected);
      fs.renameSync(temporary, output);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }
  return compiled;
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
    for (const locale of SUPPORTED_VOCABULARY_LOCALES) {
      const compiled = buildLocales({ locale, check: process.argv.includes("--check") });
      console.log(
        `${locale} preview: ${Object.keys(compiled.entries).length} published words, ${Object.values(compiled.entries).reduce((count, entry) => count + Object.keys(entry.senses).length, 0)} meanings, ${Object.keys(compiled.categories).length} categories${process.argv.includes("--check") ? "; snapshot current" : "; snapshot generated"}.`,
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
