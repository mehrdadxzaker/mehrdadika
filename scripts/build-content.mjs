import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { validateReadings } from "./reading-validation.mjs";

export const hash = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
const serialize = (value) => JSON.stringify(value, null, 2) + "\n";
const pick = (value, keys) =>
  Object.fromEntries(
    keys
      .filter((key) => value?.[key] !== undefined)
      .map((key) => [key, value[key]]),
  );
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};
const safeId = (value) =>
  typeof value === "string" &&
  /^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,159}$/.test(value) &&
  !["__proto__", "constructor", "prototype"].includes(value);
const safeAsset = (value) =>
  typeof value === "string" &&
  !value.startsWith("/") &&
  !value.includes("..") &&
  !/^[a-z]+:/i.test(value) &&
  /\.(webp|png|svg|mp3|m4a|ogg|wav|jpe?g)$/i.test(value);

const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .filter((key) => value[key] !== undefined)
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
const visibleSenses = (input) =>
  input.senses.filter((sense) => sense.review?.status !== "draft");
const visibleExamples = (input, senses) => {
  const ids = new Set(senses.map((sense) => sense.id));
  return input.ex
    .filter((example) => !example.senseId || ids.has(example.senseId))
    .map((example) => pick(example, ["en", "fa", "senseId", "context"]));
};
/** Bind language/domain approvals to exact publishable content and source media bytes. */
export function reviewContentHash(input, { root = process.cwd() } = {}) {
  const senses = visibleSenses(input);
  const material = {
    ...pick(input, [
      "id",
      "w",
      "uk",
      "us",
      "cefr",
      "topic",
      "domainIds",
      "col",
      "fam",
      "syn",
      "ant",
      "tip",
      "note",
    ]),
    senses: senses.map((sense) =>
      pick(sense, ["id", "pos", "fa", "en", "domainIds"]),
    ),
    ex: visibleExamples(input, senses),
    provenance: pick(input.provenance, [
      "license",
      "source",
      "attribution",
      "aiAssisted",
      "modifications",
    ]),
    media: {},
  };
  for (const [kind, asset] of Object.entries(
    pick(input.media, ["img", "uk", "us", "ex", "ex2"]),
  )) {
    if (!asset) continue;
    requireValue(safeAsset(asset), `Unsafe review asset path: ${asset}`);
    const file = path.resolve(root, "public", asset);
    let sha256 = null;
    if (fs.existsSync(file)) {
      requireValue(
        fs
          .realpathSync(file)
          .startsWith(fs.realpathSync(path.join(root, "public")) + path.sep),
        `Review asset escapes public/: ${asset}`,
      );
      sha256 = hash(fs.readFileSync(file));
    }
    material.media[kind] = { path: asset, sha256 };
  }
  return hash(
    `mehrdadika-entry-review-v1:${JSON.stringify(canonical(material))}`,
  );
}
export function readingReviewHash(item) {
  const strip = (value) =>
    Array.isArray(value)
      ? value.map(strip)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .filter(([key]) => key !== "review" && key !== "publication")
              .map(([key, value]) => [key, strip(value)]),
          )
        : value;
  return hash(
    `mehrdadika-reading-review-v1:${JSON.stringify(canonical(strip(item)))}`,
  );
}

export function prepareContent(
  source,
  taxonomy,
  { root = process.cwd(), channel = source.channel ?? "preview" } = {},
) {
  requireValue(
    source && typeof source === "object" && Array.isArray(source.entries),
    "content/entries.json must contain an entries array.",
  );
  requireValue(
    channel === "preview" || channel === "stable",
    "Unknown release channel.",
  );
  requireValue(safeId(source.corpusId), "A stable corpusId is required.");
  requireValue(safeId(source.releaseId), "A releaseId is required.");
  requireValue(
    Array.isArray(taxonomy.domains) && taxonomy.domains.length >= 32,
    "The full 32-domain catalog is required.",
  );
  const domainIds = new Set(taxonomy.domains.map((d) => d.id));
  requireValue(
    domainIds.size === taxonomy.domains.length,
    "Duplicate domain IDs.",
  );
  const lexicalIds = new Set();
  const senseIds = new Set();
  const assets = new Map();
  const rewriteAsset = (value) => {
    requireValue(safeAsset(value), `Unsafe asset path: ${value}`);
    const location = path.resolve(root, "public", value);
    requireValue(
      location.startsWith(path.resolve(root, "public") + path.sep) &&
        fs.existsSync(location),
      `Missing asset: ${value}`,
    );
    requireValue(
      fs
        .realpathSync(location)
        .startsWith(fs.realpathSync(path.resolve(root, "public")) + path.sep),
      `Asset symlink escapes public/: ${value}`,
    );
    const data = fs.readFileSync(location);
    const sha256 = hash(data);
    const assetPath = `content/media/${sha256}${path.extname(value).toLowerCase()}`;
    assets.set(assetPath, {
      path: assetPath,
      sha256,
      bytes: data.length,
      data,
    });
    return assetPath;
  };
  const entries = [];
  for (const input of source.entries) {
    requireValue(
      safeId(input.id) && !lexicalIds.has(input.id),
      `Invalid or duplicate lexical ID: ${input.id}`,
    );
    lexicalIds.add(input.id);
    requireValue(
      typeof input.w === "string" && input.w.trim().length > 0,
      `Missing headword: ${input.id}`,
    );
    requireValue(
      Array.isArray(input.senses) && input.senses.length > 0,
      `Missing senses: ${input.id}`,
    );
    requireValue(
      domainIds.has(input.topic),
      `Unknown primary topic: ${input.id}`,
    );
    const senses = [];
    let expectedReviewHash;
    for (const sense of input.senses) {
      requireValue(
        safeId(sense.id) && !senseIds.has(sense.id),
        `Invalid or duplicate sense ID: ${sense.id}`,
      );
      senseIds.add(sense.id);
      requireValue(
        typeof sense.fa === "string" &&
          sense.fa.trim() &&
          typeof sense.en === "string" &&
          sense.en.trim(),
        `Bilingual definition missing: ${sense.id}`,
      );
      const scope = sense.domainIds ?? input.domainIds ?? [input.topic];
      requireValue(
        Array.isArray(scope) &&
          scope.length > 0 &&
          scope.every((id) => domainIds.has(id)),
        `Unknown sense domain: ${sense.id}`,
      );
      if (
        sense.review?.status === "draft" ||
        input.publication === "draft" ||
        input.publication === "withdrawn"
      )
        continue;
      if (channel === "stable")
        requireValue(
          sense.review?.status === "approved" &&
            (sense.review?.human === true ||
              sense.review?.humanReviewed === true) &&
            typeof sense.review?.reviewer === "string" &&
            sense.review.reviewer.trim(),
          `Stable release requires recorded human approval: ${sense.id}`,
        );
      if (
        channel === "stable" &&
        scope.some((id) => ["medicine-healthcare", "engineering"].includes(id))
      ) {
        requireValue(
          sense.review?.domainQualified === true &&
            typeof sense.review?.domainReviewer === "string" &&
            sense.review.domainReviewer.trim(),
          `Stable specialist content requires recorded qualified domain review: ${sense.id}`,
        );
      }
      if (channel === "stable") {
        expectedReviewHash ??= reviewContentHash(input, { root });
        requireValue(
          sense.review?.contentHash === expectedReviewHash,
          `Stable review digest is missing or stale for ${sense.id}. Expected ${expectedReviewHash}. Inspect the exact content and use node scripts/build-content.mjs --review-hash ${input.id} to display its review digest.`,
        );
      }
      senses.push({
        ...pick(sense, ["id", "pos", "fa", "en", "review"]),
        domainIds: [...new Set(scope)],
      });
    }
    if (!senses.length) continue;
    const declaredLicense = input.provenance?.license;
    requireValue(
      declaredLicense === "CC-BY-4.0" || declaredLicense === "CC BY 4.0",
      `Missing supported content rights record: ${input.id}`,
    );
    requireValue(
      Array.isArray(input.ex) &&
        input.ex.length > 0 &&
        input.ex.every(
          (ex) => typeof ex.en === "string" && typeof ex.fa === "string",
        ),
      `Examples missing: ${input.id}`,
    );
    const examples = visibleExamples(input, senses);
    requireValue(
      examples.length > 0,
      `Published examples missing: ${input.id}`,
    );
    requireValue(
      input.media?.img,
      `An illustrated card needs an image: ${input.id}`,
    );
    const media = Object.fromEntries(
      Object.entries(input.media ?? {})
        .filter(([, value]) => value)
        .map(([kind, value]) => [kind, rewriteAsset(value)]),
    );
    const m = Object.entries({ img: 1, uk: 2, us: 4, ex: 8, ex2: 16 }).reduce(
      (bits, [kind, bit]) => bits | (media[kind] ? bit : 0),
      0,
    );
    entries.push({
      ...pick(input, [
        "id",
        "w",
        "uk",
        "us",
        "cefr",
        "topic",
        "ex",
        "col",
        "fam",
        "syn",
        "ant",
        "tip",
        "note",
      ]),
      ex: examples,
      provenance: pick(input.provenance, [
        "license",
        "source",
        "attribution",
        "aiAssisted",
        "modifications",
      ]),
      senses,
      domainIds: [...new Set(senses.flatMap((s) => s.domainIds))],
      media,
      m,
    });
  }
  requireValue(
    entries.length > 0,
    "A release must contain at least one eligible entry.",
  );
  const readingPath = path.join(root, "content/readings.json");
  let readings;
  if (fs.existsSync(readingPath)) {
    const raw = JSON.parse(fs.readFileSync(readingPath, "utf8"));
    validateReadings(raw);
    const eligible = (item) => {
      if (!item || !["preview", "published"].includes(item.publication))
        return false;
      if (channel === "preview") return true;
      if (
        item.review?.humanReviewed !== true ||
        item.review?.status !== "approved"
      )
        return false;
      if (["medicine-healthcare", "engineering"].includes(item.domainId))
        requireValue(
          item.review?.domainQualified === true &&
            typeof item.review?.domainReviewer === "string" &&
            item.review.domainReviewer.trim(),
          `Stable specialist reading requires recorded qualified domain review: ${item.id}`,
        );
      const expected = readingReviewHash(item);
      requireValue(
        item.review?.contentHash === expected,
        `Stable reading review digest is missing or stale for ${item.id}. Expected ${expected}. Use node scripts/build-content.mjs --review-reading-hash ${item.id} after inspecting the exact material.`,
      );
      return true;
    };
    const rewrite = (value) => {
      if (
        typeof value === "string" &&
        safeAsset(value) &&
        fs.existsSync(path.join(root, "public", value))
      )
        return rewriteAsset(value);
      if (Array.isArray(value)) return value.map(rewrite);
      if (value && typeof value === "object")
        return Object.fromEntries(
          Object.entries(value).map(([key, value]) => [key, rewrite(value)]),
        );
      return value;
    };
    readings = {
      schemaVersion: raw.schemaVersion,
      provenance: pick(raw.provenance, [
        "license",
        "aiAssisted",
        "origin",
        "reviewNotice",
        "narration",
        "source",
        "attribution",
        "modifications",
      ]),
      channel,
      passages: (raw.passages ?? []).filter(eligible),
      books: (raw.books ?? [])
        .filter(eligible)
        .map((book) => ({
          ...book,
          chapters: (book.chapters ?? []).filter(eligible),
        }))
        .filter((book) => book.chapters.length > 0),
      paraphrases: (raw.paraphrases ?? []).filter(eligible),
      confusables: (raw.confusables ?? []).filter(eligible),
    };
    readings = rewrite(readings);
  }
  const dataFiles = [];
  const shardData = new Map();
  const shards = {};
  for (let offset = 0; offset < entries.length; offset += 100) {
    const list = entries.slice(offset, offset + 100);
    const text = serialize(list);
    const sha256 = hash(text);
    const filePath = `content/entries/${sha256}.json`;
    dataFiles.push({ path: filePath, sha256, bytes: Buffer.byteLength(text) });
    shardData.set(filePath, text);
    for (const entry of list) shards[entry.id] = { path: filePath, sha256 };
  }
  const indexEntries = entries.map((entry) => ({
    id: entry.id,
    w: entry.w,
    uk: entry.uk,
    us: entry.us,
    cefr: entry.cefr,
    topic: entry.topic,
    domainIds: entry.domainIds,
    senses: entry.senses,
    media: entry.media,
    m: entry.m,
    ex: [],
    col: [],
    fam: [],
    syn: [],
    ant: [],
    tip: "",
  }));
  const payloadText = serialize({
    entries: indexEntries,
    shards,
    examples: entries.reduce((n, e) => n + e.ex.length, 0),
    ...(readings ? { readings } : {}),
  });
  const payloadHash = hash(payloadText);
  const payloadPath = `content/indexes/${payloadHash}.json`;
  const release = {
    id: source.releaseId,
    channel,
    schemaVersion: 1,
    createdAt: source.createdAt ?? "2026-10-26T00:00:00Z",
  };
  const appAssets = [];
  const scanAppAssets = (relative) => {
    const target = path.join(root, "public", relative);
    if (!fs.existsSync(target)) return;
    requireValue(
      !fs.lstatSync(target).isSymbolicLink(),
      `App asset symlinks are unsupported: ${relative}`,
    );
    if (fs.statSync(target).isDirectory()) {
      for (const child of fs.readdirSync(target).sort())
        scanAppAssets(`${relative}/${child}`);
      return;
    }
    if (
      !fs
        .realpathSync(target)
        .startsWith(fs.realpathSync(path.join(root, "public")) + path.sep)
    )
      throw new Error(`App asset symlink escapes public/: ${relative}`);
    const data = fs.readFileSync(target);
    appAssets.push({ path: relative, sha256: hash(data), bytes: data.length });
  };
  ["brand", "licenses", "favicon.svg", "manifest.webmanifest"].forEach(
    scanAppAssets,
  );
  const manifest = {
    schemaVersion: 1,
    corpusId: source.corpusId,
    name: source.name ?? "مهردادیکا · اطلس انگلیسی–فارسی",
    release,
    payload: { path: payloadPath, sha256: payloadHash },
    taxonomy,
    appAssets,
    dataFiles,
    counts: {
      words: entries.length,
      meanings: entries.reduce((n, e) => n + e.senses.length, 0),
      domains: taxonomy.domains.length,
    },
    assets: [...assets.values()].map(({ data, ...asset }) => asset),
  };
  const manifestText = serialize(manifest);
  const manifestHash = hash(manifestText);
  const manifestPath = `content/releases/${source.releaseId}-${manifestHash.slice(0, 12)}/manifest.json`;
  const pointer = {
    schemaVersion: 1,
    manifest: manifestPath,
    sha256: manifestHash,
  };
  return {
    manifest,
    manifestText,
    manifestPath,
    payloadText,
    payloadPath,
    pointer,
    assets,
    shardData,
  };
}

export function buildContent({
  root = process.cwd(),
  write = true,
  channel,
} = {}) {
  const source = JSON.parse(
    fs.readFileSync(path.join(root, "content/entries.json"), "utf8"),
  );
  const catalogPath = fs.existsSync(path.join(root, "content/taxonomy.json"))
    ? "content/taxonomy.json"
    : "docs/category-catalog.json";
  const taxonomy = JSON.parse(
    fs.readFileSync(path.join(root, catalogPath), "utf8"),
  );
  const release = prepareContent(source, taxonomy, {
    root,
    channel: channel ?? source.channel,
  });
  if (write) {
    const save = (relative, data) => {
      const target = path.join(root, "public", relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (fs.existsSync(target))
        requireValue(
          fs.readFileSync(target).equals(Buffer.from(data)),
          `Immutable file changed: ${relative}`,
        );
      else fs.writeFileSync(target, data);
    };
    save(release.payloadPath, release.payloadText);
    save(release.manifestPath, release.manifestText);
    for (const [file, text] of release.shardData) save(file, text);
    for (const asset of release.assets.values()) save(asset.path, asset.data);
    const current = path.join(root, "public/content/current.json");
    fs.writeFileSync(current + ".tmp", serialize(release.pointer));
    fs.renameSync(current + ".tmp", current);
  }
  return release;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    const entryHashIndex = process.argv.indexOf("--review-hash");
    const readingHashIndex = process.argv.indexOf("--review-reading-hash");
    if (entryHashIndex >= 0) {
      const source = JSON.parse(
        fs.readFileSync("content/entries.json", "utf8"),
      );
      const id = process.argv[entryHashIndex + 1];
      const entry = source.entries.find((entry) => entry.id === id);
      requireValue(entry, `Unknown lexical ID: ${id}`);
      console.log(
        JSON.stringify(
          {
            id,
            contentHash: reviewContentHash(entry),
            senseIds: visibleSenses(entry).map((sense) => sense.id),
          },
          null,
          2,
        ),
      );
    } else if (readingHashIndex >= 0) {
      const raw = JSON.parse(fs.readFileSync("content/readings.json", "utf8"));
      const id = process.argv[readingHashIndex + 1];
      const records = [
        ...(raw.passages ?? []),
        ...(raw.books ?? []),
        ...(raw.books ?? []).flatMap((book) => book.chapters ?? []),
        ...(raw.paraphrases ?? []),
        ...(raw.confusables ?? []),
      ];
      const item = records.find((item) => item.id === id);
      requireValue(item, `Unknown reading/exercise ID: ${id}`);
      console.log(
        JSON.stringify({ id, contentHash: readingReviewHash(item) }, null, 2),
      );
    } else {
      const channelIndex = process.argv.indexOf("--channel");
      const release = buildContent({
        write: !process.argv.includes("--check"),
        channel: channelIndex >= 0 ? process.argv[channelIndex + 1] : undefined,
      });
      console.log(
        `${release.manifest.release.channel}: ${release.manifest.counts.words} words, ${release.manifest.counts.meanings} meanings, ${release.manifest.counts.domains} domains. Immutable release ${release.manifest.release.id}.`,
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
