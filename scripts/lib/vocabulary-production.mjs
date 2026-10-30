import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { homedir } from "node:os";

const JSON_LIMIT = 32 * 1024 * 1024;
const IMAGE_LIMIT = 32 * 1024 * 1024;
const ROLES = ["author", "second", "lexical"];
const LOCALES = ["pt-BR", "es-419"];
const hash = (b) => crypto.createHash("sha256").update(b).digest("hex");
const clone = (x) => structuredClone(x);
const now = () => new Date().toISOString();
const fail = (message) => {
  throw new Error(message);
};
const isObject = (x) => x && typeof x === "object" && !Array.isArray(x);
function canonical(x) {
  if (Array.isArray(x)) return x.map(canonical);
  if (isObject(x))
    return Object.fromEntries(
      Object.keys(x)
        .sort()
        .map((k) => [k, canonical(x[k])]),
    );
  return x;
}
export const fingerprint = (x) => hash(JSON.stringify(canonical(x)));
function identifier(x, label = "identifier") {
  if (
    typeof x !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(x) ||
    x === "." ||
    x === ".."
  )
    fail("Unsafe " + label);
  return x;
}
function text(x, label, max = 64000) {
  if (typeof x !== "string" || !x.trim() || x.length > max)
    fail("Missing or oversized " + label);
  return x.trim();
}
const inside = (base, p) => p === base || p.startsWith(base + path.sep);
async function noLinks(base, target, allowMissing = false) {
  if (!inside(base, target)) fail("Path escapes workspace");
  const rel = path.relative(base, target);
  let p = base;
  for (const part of rel.split(path.sep).filter(Boolean)) {
    p = path.join(p, part);
    let s;
    try {
      s = await fs.lstat(p);
    } catch (e) {
      if (e.code === "ENOENT" && allowMissing) return;
      throw e;
    }
    if (s.isSymbolicLink()) fail("Symlink path is not allowed: " + p);
  }
}
async function mkdirSafe(base, target) {
  await noLinks(base, target, true);
  await fs.mkdir(target, { recursive: true, mode: 0o700 });
  await noLinks(base, target);
  if (!inside(base, await fs.realpath(target)))
    fail("Directory escapes workspace");
}
async function context({ root = process.cwd(), batchId }, create = false) {
  identifier(batchId, "batch ID");
  const actualRoot = await fs.realpath(root);
  if (!(await fs.stat(actualRoot)).isDirectory())
    fail("Workspace is not a directory");
  const pipeline = path.join(
    actualRoot,
    ".local/vocabulary-production/pipeline",
  );
  const dir = path.join(pipeline, batchId);
  if (create) await mkdirSafe(actualRoot, dir);
  else await noLinks(actualRoot, dir);
  return {
    root: actualRoot,
    batchId,
    pipeline,
    dir,
    queuePath: path.join(dir, "queue.json"),
  };
}
async function boundedBytes(file, limit, base, external = false) {
  const input = path.resolve(base, file);
  if (!external || inside(base, input)) await noLinks(base, input);
  const stat = await fs.lstat(input);
  if (stat.isSymbolicLink() || !stat.isFile())
    fail("Expected a regular non-symlink file: " + input);
  const real = await fs.realpath(input);
  if (!external && !inside(base, real)) fail("File escapes workspace");
  if (stat.size > limit) fail("File exceeds bounded size: " + input);
  const bytes = await fs.readFile(real);
  if (bytes.length > limit) fail("File exceeds bounded size");
  return { bytes, real };
}
async function jsonFile(file, base) {
  const { bytes } = await boundedBytes(file, JSON_LIMIT, base);
  return JSON.parse(bytes.toString("utf8"));
}
async function optionalJson(file, base) {
  try {
    return await jsonFile(file, base);
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}
async function atomicJson(base, target, value) {
  await mkdirSafe(base, path.dirname(target));
  await noLinks(base, target, true);
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + "\n");
  if (bytes.length > JSON_LIMIT)
    fail("Queue/manifest exceeds bounded JSON size");
  const temp = target + ".tmp-" + crypto.randomUUID();
  try {
    await fs.writeFile(temp, bytes, { flag: "wx", mode: 0o600 });
    await fs.rename(temp, target);
  } finally {
    await fs.rm(temp, { force: true });
  }
}
async function lock(base, file, fn) {
  await mkdirSafe(base, path.dirname(file));
  await noLinks(base, file, true);
  let handle;
  const token = crypto.randomUUID();
  for (let retry = 0; retry <= 3; retry++) {
    try {
      handle = await fs.open(file, "wx", 0o600);
      break;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      if (retry === 3)
        fail(
          "Queue/run is busy after3 bounded retries; no stale-lock deletion",
        );
      await new Promise((resolve) =>
        setTimeout(resolve, 50 * 2 ** retry + crypto.randomInt(0, 25)),
      );
      await noLinks(base, file, true);
    }
  }
  try {
    await handle.writeFile(
      JSON.stringify({ token, pid: process.pid, createdAt: now() }),
    );
    return await fn();
  } finally {
    await handle.close();
    const current = await jsonFile(file, base);
    if (current.token !== token)
      fail("Lock ownership changed; refusing to remove another owner lock");
    await fs.rm(file);
  }
}
function semantic(record) {
  const e = record.entry || {};
  return {
    word: e.w || record.word,
    categoryId: e.topic || record.categoryId,
    domainIds: e.domainIds,
    senses: e.senses,
    examples: e.ex,
    collocations: e.col,
    tip: e.tip,
    nativeSenses: Object.fromEntries(
      LOCALES.map((l) => [l, record.locales?.[l]?.senses || null]),
    ),
  };
}
function profileHash(record) {
  const p = { ...(record.profile || {}) };
  delete p.sha256;
  return fingerprint(p);
}
function contentHash(record) {
  return fingerprint({ entry: record.entry, locales: record.locales });
}
function assetsBinding(candidate) {
  if (!candidate) return null;
  return Object.fromEntries(
    ["source", "card", "thumbnail"].map((k) => {
      const a = candidate[k];
      return [
        k,
        a
          ? {
              sha256: a.sha256,
              width: a.width,
              height: a.height,
              format: a.format,
            }
          : null,
      ];
    }),
  );
}
function candidateHash(record) {
  return fingerprint({
    assets: assetsBinding(record.candidate),
    prompt: record.candidate?.prompt,
    expectedCue: record.candidate?.expectedCue,
  });
}
function refresh(record) {
  delete record.profileStale;
  delete record.profileStaleReason;
  record.word = record.entry?.w || record.word || record.id;
  record.categoryId = record.entry?.topic || record.categoryId;
  record.contentHash = contentHash(record);
  record.semanticHash = fingerprint(semantic(record));
  if (record.profile) record.profile.sha256 = profileHash(record);
  record.inspections ||= { author: null, second: null, lexical: null };
  record.history ||= [];
  record.generation ||= {
    attemptsUsed: 0,
    pending: null,
    legacyUnreconciled: false,
  };
  return record;
}
export function bindingFor(record, role) {
  if (!ROLES.includes(role)) fail("Unknown inspection role");
  if (role === "lexical")
    return fingerprint({ role, contentHash: contentHash(record) });
  return fingerprint({
    role,
    semanticHash: fingerprint(semantic(record)),
    profileHash: profileHash(record),
    candidateHash: candidateHash(record),
  });
}
const nonempty = (x) => typeof x === "string" && x.trim().length > 0;
function actualTimestamp(x) {
  return (
    typeof x === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      x,
    ) &&
    Number.isFinite(Date.parse(x)) &&
    Date.parse(x) <= Date.now() + 300000
  );
}
function completeContent(r) {
  const e = r.entry;
  if (
    !isObject(e) ||
    e.id !== r.id ||
    !nonempty(e.w) ||
    !nonempty(e.topic) ||
    !Array.isArray(e.domainIds) ||
    !e.domainIds.includes(e.topic) ||
    !nonempty(e.uk) ||
    !/^\/[^/\n]+\/$/.test(e.uk) ||
    !nonempty(e.us) ||
    !/^\/[^/\n]+\/$/.test(e.us) ||
    !["A1", "A2", "B1", "B2", "C1", "C2"].includes(e.cefr) ||
    !nonempty(e.tip) ||
    !Array.isArray(e.senses) ||
    !e.senses.length ||
    new Set(e.senses.map((s) => s.id)).size !== e.senses.length ||
    !e.senses.every(
      (s) =>
        nonempty(s.id) &&
        s.id.startsWith(e.id + ":") &&
        nonempty(s.pos) &&
        nonempty(s.en) &&
        nonempty(s.fa) &&
        s.review?.status === "preview" &&
        s.review?.humanReviewed === false,
    ) ||
    !Array.isArray(e.ex) ||
    e.ex.length !== 2 ||
    !e.ex.every(
      (x) =>
        nonempty(x.en) &&
        nonempty(x.fa) &&
        e.senses.some((s) => s.id === x.senseId),
    ) ||
    !Array.isArray(e.col) ||
    e.col.length !== 3 ||
    !e.col.every(
      (x) =>
        typeof x === "string" &&
        x.split("｜").length === 2 &&
        x.split("｜").every(nonempty),
    ) ||
    e.provenance?.license !== "CC-BY-4.0" ||
    e.provenance?.aiAssisted !== true ||
    !["source", "attribution", "modifications"].every((k) =>
      nonempty(e.provenance[k]),
    )
  )
    return false;
  const escaped = [...e.w]
    .map((c) => ("\\^$.*+?()[]{}|".includes(c) ? "\\" + c : c))
    .join("");
  if (
    !new RegExp("(?<![A-Za-z])" + escaped + "(?![A-Za-z])", "i").test(
      e.ex[0].en,
    )
  )
    return false;
  return LOCALES.every((l) => {
    const v = r.locales?.[l];
    return (
      isObject(v) &&
      v.sourceWord === e.w &&
      nonempty(v.tip) &&
      fingerprint(Object.keys(v.senses || {}).sort()) ===
        fingerprint(e.senses.map((s) => s.id).sort()) &&
      Object.values(v.senses || {}).every(
        (s) => isObject(s) && nonempty(s.gloss) && nonempty(s.definition),
      ) &&
      v.examples?.length === 2 &&
      v.collocations?.length === 3 &&
      v.examples.every(
        (x, i) => x.en === e.ex[i].en && nonempty(x.translation),
      ) &&
      v.collocations.every(
        (x, i) => x.en === e.col[i].split("｜")[0] && nonempty(x.translation),
      )
    );
  });
}
function completeCandidate(r) {
  const c = r.candidate;
  return (
    c &&
    ["source", "card", "thumbnail"].every((k) => c[k]?.sha256 && c[k]?.path) &&
    c.source.width === c.source.height &&
    c.source.width >= 1024 &&
    c.card.width === 512 &&
    c.card.height === 512 &&
    c.card.format === "webp" &&
    c.thumbnail.width === 120 &&
    c.thumbnail.height === 120 &&
    c.thumbnail.format === "png" &&
    c.prompt &&
    c.expectedCue
  );
}
function validReceipt(r, role) {
  const x = r.inspections?.[role];
  if (
    !x ||
    x.role !== role ||
    x.accepted !== true ||
    x.humanReviewed !== false ||
    x.binding !== bindingFor(r, role) ||
    !x.reviewerId ||
    !x.finding ||
    !actualTimestamp(x.inspectedAt)
  )
    return false;
  if (role === "lexical") return x.basis === "actual-text";
  return (
    x.basis === "actual-pixels" &&
    Array.isArray(x.sizes) &&
    [r.candidate?.source?.width, 512, 120].every((n) => x.sizes.includes(n))
  );
}
export function stateOf(record) {
  if (record.held) return "held";
  if (record.generation?.pending) return "generating";
  if (!completeContent(record) || record.profile?.id !== record.categoryId)
    return "needs-content";
  if (record.profileStale) return "needs-profile-refresh";
  if (!completeCandidate(record))
    return record.generation?.legacyUnreconciled
      ? "needs-attempt-reconciliation"
      : "needs-image";
  if (record.generation?.legacyUnreconciled)
    return "needs-attempt-reconciliation";
  if (
    ["author", "second"].some(
      (role) =>
        record.inspections?.[role]?.accepted === false &&
        record.inspections[role].binding === bindingFor(record, role),
    )
  )
    return "needs-correction";
  if (!validReceipt(record, "author")) return "needs-author-inspection";
  if (
    !validReceipt(record, "second") ||
    record.inspections.author.reviewerId ===
      record.inspections.second.reviewerId
  )
    return "needs-second-inspection";
  if (!validReceipt(record, "lexical")) return "needs-lexical-review";
  return "ready";
}
function dimensions(bytes) {
  if (
    bytes.length >= 24 &&
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    bytes.toString("ascii", 12, 16) === "IHDR"
  )
    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
      format: "png",
    };
  if (
    bytes.length >= 20 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    if (bytes.readUInt32LE(4) + 8 !== bytes.length)
      fail("Invalid WebP container size");
    for (let pos = 12; pos + 8 <= bytes.length;) {
      const kind = bytes.toString("ascii", pos, pos + 4),
        size = bytes.readUInt32LE(pos + 4),
        d = bytes.subarray(pos + 8, pos + 8 + size);
      if (pos + 8 + size > bytes.length) fail("Truncated WebP chunk");
      if (kind === "VP8X" && d.length >= 10)
        return {
          width: 1 + d.readUIntLE(4, 3),
          height: 1 + d.readUIntLE(7, 3),
          format: "webp",
        };
      if (kind === "VP8 " && d.length >= 10) {
        const p = d.indexOf(Buffer.from([157, 1, 42]));
        if (p >= 0 && p + 7 <= d.length)
          return {
            width: d.readUInt16LE(p + 3) & 16383,
            height: d.readUInt16LE(p + 5) & 16383,
            format: "webp",
          };
      }
      if (kind === "VP8L" && d.length >= 5 && d[0] === 47) {
        const n = d.readUInt32LE(1);
        return {
          width: 1 + (n & 16383),
          height: 1 + ((n >>> 14) & 16383),
          format: "webp",
        };
      }
      pos += 8 + size + (size % 2);
    }
  }
  fail("Only bounded PNG/WebP images are supported");
}
async function cacheAsset(ctx, file, allowGenerated = false) {
  if (typeof file !== "string" || !file) fail("Image file path required");
  const input = path.resolve(ctx.root, file);
  let base = ctx.root;
  if (!inside(base, input)) {
    if (!allowGenerated) fail("Image path escapes workspace");
    const configured = path.resolve(
      process.env.CODEX_HOME || path.join(homedir(), ".codex"),
      "generated_images",
    );
    let generated;
    try {
      generated = await fs.realpath(configured);
    } catch {
      fail("External source is not in configured generated_images");
    }
    if (!inside(generated, input))
      fail("External source must be in configured generated_images");
    base = generated;
  }
  const { bytes } = await boundedBytes(input, IMAGE_LIMIT, base, false);
  const size = dimensions(bytes);
  if (!size.width || !size.height || size.width * size.height > 16777216)
    fail("Invalid or oversized image dimensions");
  const sha256 = hash(bytes),
    dir = path.join(ctx.pipeline, "cache");
  await mkdirSafe(ctx.root, dir);
  const target = path.join(dir, sha256 + "." + size.format);
  await noLinks(ctx.root, target, true);
  try {
    await fs.writeFile(target, bytes, { flag: "wx", mode: 0o600 });
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
    const old = await boundedBytes(target, IMAGE_LIMIT, ctx.root);
    if (hash(old.bytes) !== sha256)
      fail("Hash cache collision or modified cache file");
  }
  return { path: target, sha256, bytes: bytes.length, ...size };
}
async function assertCurrentProfile(ctx, record) {
  const data = await jsonFile(
    path.join(ctx.root, "content/visual-languages.json"),
    ctx.root,
  );
  const profiles = Array.isArray(data) ? data : data.profiles;
  const actual = profiles?.find((p) => p.id === record.categoryId);
  if (
    !actual ||
    record.profile?.id !== record.categoryId ||
    profileHash({ profile: actual }) !== profileHash(record)
  )
    fail(
      "Category profile changed on disk; reimport and record fresh pixel inspections",
    );
}
async function validateAssets(ctx, record) {
  if (!completeCandidate(record))
    fail("Complete original/512 WebP/120 PNG candidate required");
  for (const k of ["source", "card", "thumbnail"]) {
    const a = record.candidate[k];
    const { bytes } = await boundedBytes(a.path, IMAGE_LIMIT, ctx.root);
    const d = dimensions(bytes);
    if (
      hash(bytes) !== a.sha256 ||
      d.width !== a.width ||
      d.height !== a.height ||
      d.format !== a.format
    )
      fail("Asset bytes/dimensions changed: " + k);
  }
}
function event(r, type, detail = {}) {
  if (r.history.length >= 2000)
    fail("History limit reached; archive explicitly before continuing");
  r.history.push({ at: now(), type, ...detail });
}
function recordFor(q, id) {
  identifier(id, "word ID");
  const r = q.records.find((x) => x.id === id);
  if (!r) fail("Unknown word ID: " + id);
  return refresh(r);
}
async function mutate(options, fn) {
  const ctx = await context(options, true);
  return lock(ctx.root, path.join(ctx.dir, "queue.lock"), async () => {
    const q = await jsonFile(ctx.queuePath, ctx.root);
    if (
      q.schemaVersion !== 1 ||
      q.batchId !== ctx.batchId ||
      !Array.isArray(q.records)
    )
      fail("Unsupported queue");
    q.records.forEach(refresh);
    const result = await fn(q, ctx);
    q.updatedAt = now();
    await atomicJson(ctx.root, ctx.queuePath, q);
    return result ?? q;
  });
}
export async function loadQueue(options) {
  const ctx = await context(options);
  const q = await jsonFile(ctx.queuePath, ctx.root);
  if (
    q.schemaVersion !== 1 ||
    q.batchId !== ctx.batchId ||
    !Array.isArray(q.records)
  )
    fail("Unsupported queue");
  q.records.forEach(refresh);
  for (const r of q.records) {
    try {
      await assertCurrentProfile(ctx, r);
      r.profileStale = false;
    } catch (e) {
      r.profileStale = true;
      r.profileStaleReason = e.message;
    }
  }
  return q;
}
function imageList(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (Array.isArray(x.images)) return x.images;
  return Object.values(x).filter((v) => isObject(v) && v.entryId);
}
export async function importBatch(options) {
  const ctx = await context(options, true);
  return lock(ctx.root, path.join(ctx.dir, "queue.lock"), async () => {
    const legacy = path.join(
      ctx.root,
      ".local/vocabulary-production",
      ctx.batchId,
    );
    await noLinks(ctx.root, legacy);
    const profileFile = path.join(ctx.root, "content/visual-languages.json");
    const profileData = await jsonFile(profileFile, ctx.root);
    const profiles = Array.isArray(profileData)
      ? profileData
      : profileData.profiles;
    if (!Array.isArray(profiles)) fail("Visual language profiles required");
    const plan = await optionalJson(
      path.join(legacy, "batch-plan.json"),
      ctx.root,
    );
    const parts = [];
    const importedSources = [];
    for (const name of ["medical.json", "engineering.json"]) {
      const p = path.join(legacy, name),
        d = await optionalJson(p, ctx.root);
      if (d) {
        parts.push(d);
        importedSources.push({
          path: p,
          sha256: hash((await boundedBytes(p, JSON_LIMIT, ctx.root)).bytes),
        });
      }
    }
    if (!parts.length)
      fail("At least one legacy medical/engineering draft required");
    const supplement =
      (await optionalJson(path.join(legacy, "supplemental.json"), ctx.root)) ||
      (await optionalJson(
        path.join(legacy, "root-image-draft.json"),
        ctx.root,
      ));
    const images = new Map();
    for (const x of [
      ...parts.flatMap((p) => imageList(p)),
      ...imageList(supplement),
    ]) {
      if (x.entryId) images.set(x.entryId, x);
    }
    const existing = await optionalJson(ctx.queuePath, ctx.root);
    const q = existing || {
      schemaVersion: 1,
      batchId: ctx.batchId,
      createdAt: now(),
      updatedAt: now(),
      publication: {
        status: "unverified",
        basis:
          "Local drafts/caches are not deployed or live-verified evidence.",
      },
      records: [],
      groups: [],
      templates: [],
      history: [],
    };
    const seen = new Set();
    const all = parts.flatMap((p) =>
      (p.entries || []).map((entry) => ({
        entry,
        locales: Object.fromEntries(
          LOCALES.map((l) => [l, p.locales?.[l]?.[entry.id] || null]),
        ),
      })),
    );
    const files = await fs.readdir(legacy);
    if (files.length > 20000) fail("Legacy directory inventory too large");
    for (const name of files.filter(
      (n) => /^held-[A-Za-z0-9._-]+\.json$/.test(n) && !n.includes("before-"),
    )) {
      const h = await jsonFile(path.join(legacy, name), ctx.root);
      if (
        h.entry?.id &&
        (h.published === false || String(h.status).includes("held")) &&
        !all.some((x) => x.entry.id === h.entry.id)
      )
        all.push({
          entry: h.entry,
          locales: h.locales,
          held: {
            reason: h.reason || "Legacy held entry",
            evidencePath: path.join(legacy, name),
          },
        });
    }
    for (const data of all) {
      const id = identifier(data.entry.id, "word ID");
      if (seen.has(id)) fail("Duplicate imported word ID: " + id);
      seen.add(id);
      const profile = profiles.find((p) => p.id === data.entry.topic);
      if (!profile)
        fail("Missing category visual profile: " + data.entry.topic);
      let r = q.records.find((x) => x.id === id);
      if (!r) {
        r = {
          id,
          word: data.entry.w,
          categoryId: data.entry.topic,
          entry: clone(data.entry),
          locales: clone(data.locales),
          profile: clone(profile),
          candidate: null,
          inspections: { author: null, second: null, lexical: null },
          generation: {
            attemptsUsed: 0,
            pending: null,
            legacyUnreconciled: true,
          },
          held: data.held || null,
          history: [],
        };
        q.records.push(r);
      } else if (
        fingerprint({
          entry: r.entry,
          locales: r.locales,
          profile: r.profile && { ...r.profile, sha256: undefined },
        }) !==
        fingerprint({ entry: data.entry, locales: data.locales, profile })
      ) {
        event(r, "content-import-changed", {
          previous: {
            entry: r.entry,
            locales: r.locales,
            profile: r.profile,
            inspections: r.inspections,
          },
        });
      }
      if (!r.legacyHistoryImported) {
        if (!r.history.some((x) => x.type === "attempts-reconciled"))
          r.generation.legacyUnreconciled = true;
        r.legacyHistoryImported = true;
        event(r, "legacy-history-imported", {
          finding:
            "No image record does not prove zero earlier requests; reconcile preserved attempts explicitly.",
        });
      }
      r.entry = clone(data.entry);
      r.locales = clone(data.locales);
      r.profile = clone(profile);
      if (data.held) r.held ||= data.held;
      const image = images.get(id);
      if (image && !r.generation.pending) {
        const candidate = {
          prompt: image.prompt || image.generationPrompt || "",
          expectedCue: image.expectedCue || image.description || "",
          importedFinding: image.inspection || image.finding || "",
          historicalEvidence: clone(image),
        };
        const locations = {
          source: image.generatedSource,
          card: image.stagedPath,
          thumbnail: image.thumbnail,
        };
        for (const [k, file] of Object.entries(locations)) {
          if (!file) continue;
          try {
            candidate[k] = await cacheAsset(
              ctx,
              path.resolve(legacy, file),
              k === "source",
            );
          } catch (e) {
            event(r, "legacy-asset-unavailable", {
              role: k,
              reason: e.message,
              path: String(file),
            });
          }
        }
        const legacyFingerprint = fingerprint({
          metadata: image,
          assets: assetsBinding(candidate),
        });
        if (r.legacyFingerprint !== legacyFingerprint) {
          const preserveCurrent =
            r.candidate &&
            (r.candidateOrigin === "pipeline" ||
              ROLES.some((role) => validReceipt(r, role)));
          if (preserveCurrent) {
            event(r, "legacy-candidate-conflict", {
              previous: r.candidate,
              inspections: r.inspections,
              incoming: candidate,
            });
            r.legacyConflict = {
              fingerprint: legacyFingerprint,
              candidate,
              at: now(),
              resolution:
                "Current candidate retained; explicit attempt reconciliation must document the choice.",
            };
            r.generation.legacyUnreconciled = true;
          } else if (candidateHash({ ...r, candidate }) !== candidateHash(r)) {
            if (r.candidate)
              event(r, "candidate-replaced-by-legacy-import", {
                previous: r.candidate,
                inspections: r.inspections,
              });
            r.candidate = candidate;
            r.candidateOrigin = "legacy";
            r.inspections = {
              author: null,
              second: null,
              lexical: validReceipt(r, "lexical")
                ? r.inspections.lexical
                : null,
            };
            r.generation.legacyUnreconciled = true;
            event(r, "legacy-candidate-imported", {
              finding: "Historical metadata is not an acceptance receipt.",
              historicalEvidence: clone(image),
            });
          }
          r.legacyFingerprint = legacyFingerprint;
        }
      }
      refresh(r);
    }
    for (const r of q.records)
      if (!seen.has(r.id) && !r.held) {
        r.held = {
          reason:
            "Removed from current legacy sources; manual resolution required",
          at: now(),
        };
        event(r, "legacy-entry-removed");
      }
    q.importedSources = importedSources;
    q.importedPlan = plan
      ? {
          id: plan.id,
          status: plan.status,
          releaseId: plan.releaseId,
          informationalOnly: true,
        }
      : null;
    q.publication = {
      status: "unverified",
      basis: "Local drafts/caches are not deployed or live-verified evidence.",
    };
    q.heldReferences =
      (
        await optionalJson(
          path.join(
            ctx.root,
            ".local/vocabulary-production/deferred-entries.json",
          ),
          ctx.root,
        )
      )?.entries || [];
    q.updatedAt = now();
    await atomicJson(ctx.root, ctx.queuePath, q);
    return q;
  });
}
export async function recordInspection(options) {
  return mutate(options, async (q, ctx) => {
    const r = recordFor(q, options.wordId),
      x = clone(options.receipt);
    if (
      !isObject(x) ||
      !ROLES.includes(x.role) ||
      typeof x.accepted !== "boolean" ||
      x.humanReviewed !== false
    )
      fail("Explicit AI-only inspection receipt required");
    x.reviewerId = text(x.reviewerId, "reviewer ID", 200);
    x.finding = text(x.finding, "inspection finding");
    if (!actualTimestamp(x.inspectedAt))
      fail("Full ISO date-time with timezone required");
    if (x.binding !== bindingFor(r, x.role)) fail("Stale inspection binding");
    if (!completeContent(r)) fail("Complete source/native content required");
    if (x.role === "lexical") {
      if (x.basis !== "actual-text")
        fail("Lexical receipt requires actual-text basis");
    } else {
      if (
        x.basis !== "actual-pixels" ||
        !Array.isArray(x.sizes) ||
        ![r.candidate?.source?.width, 512, 120].every((n) =>
          x.sizes.includes(n),
        )
      )
        fail("Actual original/512/120 inspection sizes required");
      await assertCurrentProfile(ctx, r);
      await validateAssets(ctx, r);
      const other = r.inspections[x.role === "author" ? "second" : "author"];
      if (
        other?.accepted &&
        other.binding === bindingFor(r, other.role) &&
        other.reviewerId === x.reviewerId
      )
        fail("Author and second reviewer IDs must differ");
    }
    if (r.inspections[x.role])
      event(r, "inspection-superseded", { receipt: r.inspections[x.role] });
    r.inspections[x.role] = x;
    event(r, "inspection-recorded", { receipt: x });
    if (!x.accepted && x.role !== "lexical" && r.generation.attemptsUsed >= 3)
      r.held = {
        reason:
          "Three-attempt budget exhausted after rejected actual inspection",
        at: now(),
      };
    return { record: r, state: stateOf(r) };
  });
}
export async function reconcileAttempts(options) {
  return mutate(options, (q) => {
    const r = recordFor(q, options.wordId),
      used = options.used,
      g = r.generation;
    if (
      !Number.isInteger(used) ||
      used < 0 ||
      used > 3 ||
      used < g.attemptsUsed ||
      (r.candidate?.source && used < 1)
    )
      fail("Attempt reconciliation must respect known history and max3");
    if (g.pending)
      fail("Finish or fail the pending generation before reconciliation");
    const evidence = text(options.evidence, "attempt reconciliation evidence");
    event(r, "attempts-reconciled", { previous: clone(g), used, evidence });
    g.attemptsUsed = used;
    g.legacyUnreconciled = false;
    if (r.legacyConflict) {
      event(r, "legacy-conflict-reconciled", {
        conflict: r.legacyConflict,
        evidence,
        retainedCandidateHash: candidateHash(r),
      });
      delete r.legacyConflict;
    }
    return { record: r, state: stateOf(r) };
  });
}
async function templateAt(ctx, id) {
  const p = path.join(
    ctx.pipeline,
    "templates",
    identifier(id, "template ID") + ".json",
  );
  const t = await jsonFile(p, ctx.root),
    body = { ...t };
  delete body.sha256;
  if (fingerprint(body) !== t.sha256 || stateOf(t.record) !== "ready")
    fail("Template is not bound to reviewed content");
  await validateAssets(ctx, t.record);
  return t;
}
export async function beginGeneration(options) {
  return mutate(options, async (q, ctx) => {
    const r = recordFor(q, options.wordId),
      g = r.generation;
    if (r.held)
      fail(
        "Held entry requires manual resolution; automatic generation is blocked",
      );
    if (g.pending) fail("Generation already pending");
    if (!completeContent(r) || r.profile?.id !== r.categoryId)
      fail("Complete content and category profile required before generation");
    if (g.legacyUnreconciled)
      fail("Reconcile unresolved imported generation attempts first");
    if (g.attemptsUsed >= 3) fail("Maximum3 generation attempts reached");
    await assertCurrentProfile(ctx, r);
    let referencePath = r.candidate?.source?.path || null;
    if (options.templateId) {
      const t = await templateAt(ctx, options.templateId);
      if (
        profileHash(r) !== profileHash(t.record) ||
        r.categoryId !== t.record.categoryId
      )
        fail("Template category/profile does not match");
      referencePath = t.record.candidate.source.path;
    }
    const prompt = text(options.prompt, "generation prompt"),
      expectedCue = text(options.expectedCue, "expected teaching cue");
    const token = crypto.randomUUID();
    g.attemptsUsed++;
    g.pending = {
      token,
      prompt,
      expectedCue,
      attempt: g.attemptsUsed,
      startedAt: now(),
      semanticHash: fingerprint(semantic(r)),
      profileHash: profileHash(r),
      templateId: options.templateId || null,
      referencePath,
    };
    event(r, "generation-begun", { ...g.pending });
    return { batchId: q.batchId, wordId: r.id, ...g.pending };
  });
}
export async function failGeneration(options) {
  return mutate(options, (q) => {
    const r = recordFor(q, options.wordId),
      g = r.generation;
    if (!g.pending || g.pending.token !== options.token)
      fail("Pending generation token mismatch");
    event(r, "generation-failed", {
      pending: clone(g.pending),
      reason: text(options.reason, "failure reason"),
    });
    g.pending = null;
    if (g.attemptsUsed >= 3)
      r.held = {
        reason: "Three-attempt generation budget exhausted",
        at: now(),
      };
    return { record: r, state: stateOf(r) };
  });
}
const PILLOW_CODE =
  "import sys\\nfrom PIL import Image\\nImage.MAX_IMAGE_PIXELS=16777216\\nim=Image.open(sys.argv[1]); im.load()\\nassert im.width==im.height and 1024<=im.width<=4096\\nim=im.convert('RGB')\\nim.resize((512,512),Image.Resampling.LANCZOS).save(sys.argv[2],'WEBP',quality=92,method=6)\\nim.resize((120,120),Image.Resampling.LANCZOS).save(sys.argv[3],'PNG')\\n".replaceAll(
    "\\n",
    "\n",
  );
async function transcode(ctx, source, python) {
  if (!python)
    fail(
      "Supply both512/120 assets or an explicit already-installed Python/Pillow path",
    );
  const executable = await fs.realpath(path.resolve(ctx.root, python));
  if (!/^python(?:[0-9.]+)?$/.test(path.basename(executable)))
    fail("Explicit Python executable required");
  const stat = await fs.stat(executable);
  if (!stat.isFile()) fail("Python executable is not a file");
  const dir = path.join(ctx.dir, "tmp-" + crypto.randomUUID());
  await mkdirSafe(ctx.root, dir);
  const card = path.join(dir, "card.webp"),
    thumbnail = path.join(dir, "thumbnail.png");
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(
        executable,
        ["-c", PILLOW_CODE, source, card, thumbnail],
        {
          shell: false,
          stdio: ["ignore", "pipe", "pipe"],
          timeout: 30000,
          env: { ...process.env, PYTHONNOUSERSITE: "1" },
        },
      );
      let stderr = "",
        size = 0;
      const collect = (data) => {
        size += data.length;
        if (size > 65536) child.kill("SIGTERM");
      };
      child.stdout.on("data", collect);
      child.stderr.on("data", (data) => {
        collect(data);
        if (stderr.length < 4096) stderr += data.toString();
      });
      child.once("error", reject);
      child.once("close", (code, signal) =>
        code === 0 && !signal && size <= 65536
          ? resolve()
          : reject(
              new Error(
                "Bounded Pillow conversion failed: " +
                  (stderr || signal || code),
              ),
            ),
      );
    });
    return {
      card: await cacheAsset(ctx, card),
      thumbnail: await cacheAsset(ctx, thumbnail),
    };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
export async function intakeCandidate(options) {
  // Decode/convert before the queue lock; commit checks the exact word/token version again.
  const preCtx = await context(options, true),
    preQueue = await loadQueue(options);
  const preRecord = recordFor(preQueue, options.wordId);
  if (preRecord.held)
    fail("Held entry cannot receive an automatic replacement");
  const version = fingerprint({
    content: contentHash(preRecord),
    profile: profileHash(preRecord),
    candidate: candidateHash(preRecord),
    generation: preRecord.generation,
  });
  if (options.token && preRecord.generation.pending?.token !== options.token)
    fail("Pending generation token mismatch");
  if (preRecord.generation.pending && !options.token)
    fail("Pending generation requires its token");
  const source = await cacheAsset(preCtx, options.source, true);
  if (source.width !== source.height || source.width < 1024)
    fail("Full-size square original required");
  if (Boolean(options.card) !== Boolean(options.thumbnail))
    fail("Supply both card and thumbnail");
  const derivatives = options.card
    ? {
        card: await cacheAsset(preCtx, options.card),
        thumbnail: await cacheAsset(preCtx, options.thumbnail),
      }
    : await transcode(preCtx, source.path, options.python);
  if (
    derivatives.card.format !== "webp" ||
    derivatives.card.width !== 512 ||
    derivatives.card.height !== 512 ||
    derivatives.thumbnail.format !== "png" ||
    derivatives.thumbnail.width !== 120 ||
    derivatives.thumbnail.height !== 120
  )
    fail("Required512WebP/120PNG dimensions/formats do not match");
  return mutate(options, async (q, ctx) => {
    const r = recordFor(q, options.wordId),
      g = r.generation;
    await assertCurrentProfile(ctx, r);
    if (
      fingerprint({
        content: contentHash(r),
        profile: profileHash(r),
        candidate: candidateHash(r),
        generation: g,
      }) !== version
    )
      fail("Record changed during intake; retry from a fresh queue");
    if (r.held) fail("Held entry cannot receive an automatic replacement");
    const pending = g.pending;
    if (options.token && (!pending || pending.token !== options.token))
      fail("Pending generation token mismatch");
    if (pending && !options.token)
      fail("Pending generation requires its token");
    if (
      pending &&
      (pending.semanticHash !== fingerprint(semantic(r)) ||
        pending.profileHash !== profileHash(r))
    )
      fail("Content/profile changed during generation");
    const c = {
      source,
      ...derivatives,
      prompt: pending?.prompt || r.candidate?.prompt || "",
      expectedCue: pending?.expectedCue || r.candidate?.expectedCue || "",
      templateId: pending?.templateId || null,
    };
    const changed = candidateHash({ ...r, candidate: c }) !== candidateHash(r);
    if (!pending && changed && source.sha256 !== r.candidate?.source?.sha256) {
      if (g.legacyUnreconciled)
        fail(
          "Reconcile imported attempts before an untracked new-source intake",
        );
      if (g.attemptsUsed >= 3)
        fail("Maximum3 total attempts; untracked source cannot bypass budget");
      g.attemptsUsed++;
      g.legacyUnreconciled = true;
      event(r, "untracked-source-intake", {
        finding:
          "External new-source intake counts conservatively and requires explicit attempt reconciliation before another generation.",
      });
    }
    if (changed) {
      if (r.candidate)
        event(r, "candidate-superseded", {
          candidate: r.candidate,
          inspections: r.inspections,
        });
      r.candidate = c;
      r.candidateOrigin = "pipeline";
      r.inspections = {
        author: null,
        second: null,
        lexical: validReceipt(r, "lexical") ? r.inspections.lexical : null,
      };
      event(r, "candidate-intaken", {
        candidateHash: candidateHash(r),
        token: options.token || null,
        assets: assetsBinding(c),
      });
    }
    g.pending = null;
    return { record: refresh(r), state: stateOf(r) };
  });
}
export async function registerTemplate(options) {
  return mutate(options, async (q, ctx) => {
    const r = recordFor(q, options.wordId);
    if (stateOf(r) !== "ready")
      fail("Only explicitly reviewed ready records can become templates");
    await assertCurrentProfile(ctx, r);
    await validateAssets(ctx, r);
    const templateId = identifier(options.templateId, "template ID"),
      usageNotes = text(options.usageNotes, "template usage notes");
    return lock(
      ctx.root,
      path.join(ctx.pipeline, "templates", templateId + ".lock"),
      async () => {
        const body = {
          schemaVersion: 1,
          templateId,
          createdAt: now(),
          sourceBatchId: q.batchId,
          sourceWordId: r.id,
          usageNotes,
          record: clone(r),
          humanReviewed: false,
        };
        const t = { ...body, sha256: fingerprint(body) },
          file = path.join(ctx.pipeline, "templates", templateId + ".json");
        if (await optionalJson(file, ctx.root))
          fail(
            "Template ID already exists; create a new reviewed template revision",
          );
        await atomicJson(ctx.root, file, t);
        q.templates.push({ templateId, sha256: t.sha256, path: file });
        event(r, "template-registered", { templateId, sha256: t.sha256 });
        return t;
      },
    );
  });
}
async function copyAsset(ctx, a, dir) {
  const { bytes } = await boundedBytes(a.path, IMAGE_LIMIT, ctx.root);
  if (hash(bytes) !== a.sha256) fail("Asset changed before copy");
  await mkdirSafe(ctx.root, dir);
  const name = a.sha256 + "." + a.format,
    target = path.join(dir, name);
  await noLinks(ctx.root, target, true);
  try {
    await fs.writeFile(target, bytes, { flag: "wx", mode: 0o600 });
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
    if (
      hash((await boundedBytes(target, IMAGE_LIMIT, ctx.root)).bytes) !==
      a.sha256
    )
      fail("Modified frozen/board asset");
  }
  return { ...a, path: "assets/" + name };
}
export async function prepareGroup(options) {
  identifier(options.groupId, "group ID");
  identifier(options.releaseId, "release ID");
  identifier(options.runId, "run ID");
  if (
    !Array.isArray(options.wordIds) ||
    !options.wordIds.length ||
    new Set(options.wordIds).size !== options.wordIds.length ||
    options.wordIds.length > 24
  )
    fail("Group needs1–24 distinct word IDs");
  options.wordIds.forEach((x) => identifier(x, "word ID"));
  return mutate(options, async (q, ctx) =>
    lock(
      ctx.root,
      path.join(ctx.pipeline, "runs", options.runId + ".lock"),
      async () => {
        const ledgerFile = path.join(
          ctx.pipeline,
          "runs",
          options.runId + ".json",
        );
        const ledger = (await optionalJson(ledgerFile, ctx.root)) || {
          schemaVersion: 1,
          runId: options.runId,
          entries: [],
          groups: [],
        };
        const old = q.groups.find((g) => g.groupId === options.groupId);
        const prior = ledger.groups.find(
          (g) => g.batchId === q.batchId && g.groupId === options.groupId,
        );
        if (old || prior) {
          const g = old || prior;
          if (
            g.releaseId !== options.releaseId ||
            g.runId !== options.runId ||
            fingerprint(g.wordIds) !== fingerprint(options.wordIds)
          )
            fail("Group ID already bound to different inputs");
          const manifest = await jsonFile(g.manifestPath, ctx.root);
          if (
            hash(
              (await boundedBytes(g.manifestPath, JSON_LIMIT, ctx.root)).bytes,
            ) !== g.sha256
          )
            fail("Prepared manifest changed");
          if (
            manifest.batchId !== q.batchId ||
            manifest.groupId !== g.groupId ||
            manifest.releaseId !== g.releaseId ||
            manifest.runId !== g.runId ||
            fingerprint(manifest.records?.map((r) => r.id)) !==
              fingerprint(options.wordIds)
          )
            fail("Prepared manifest identity changed");
          const groupDir = path.dirname(g.manifestPath);
          for (const frozen of manifest.records) {
            const current = recordFor(q, frozen.id);
            if (
              stateOf(current) !== "ready" ||
              stateOf(frozen) !== "ready" ||
              contentHash(current) !== contentHash(frozen) ||
              fingerprint(semantic(current)) !==
                fingerprint(semantic(frozen)) ||
              profileHash(current) !== profileHash(frozen) ||
              candidateHash(current) !== candidateHash(frozen)
            )
              fail(
                "Prepared group is stale against current queue; preserve it and use explicit recovery",
              );
            await assertCurrentProfile(ctx, current);
            await assertCurrentProfile(ctx, frozen);
            await validateAssets(ctx, current);
            const resolved = clone(frozen);
            for (const k of ["source", "card", "thumbnail"]) {
              const relative = resolved.candidate[k].path;
              if (
                typeof relative !== "string" ||
                path.isAbsolute(relative) ||
                !relative.startsWith("assets/")
              )
                fail("Unsafe frozen asset path");
              const actual = path.resolve(groupDir, relative);
              if (!inside(path.join(groupDir, "assets"), actual))
                fail("Frozen asset escapes prepared group");
              resolved.candidate[k].path = actual;
            }
            await validateAssets(ctx, resolved);
          }
          if (!old) {
            q.groups.push(g);
          }
          return { ...g, manifest };
        }
        const records = options.wordIds.map((id) => recordFor(q, id));
        if (records.some((r) => stateOf(r) !== "ready"))
          fail("Only explicitly reviewed ready records can be prepared");
        for (const r of records) {
          await assertCurrentProfile(ctx, r);
          await validateAssets(ctx, r);
        }
        const previous = q.groups.flatMap((g) => g.wordIds);
        if (options.wordIds.some((id) => previous.includes(id)))
          fail("Word is already assigned to a release group");
        if (
          q.groups.some((g) => g.releaseId === options.releaseId) ||
          ledger.groups.some((g) => g.releaseId === options.releaseId)
        )
          fail("Release ID already assigned");
        if (ledger.entries.length + records.length > 24)
          fail("Run budget exceeds24 distinct new IDs across all groups");
        const keys = records.map((r) => r.word.trim().toLocaleLowerCase("en"));
        if (
          new Set(keys).size !== keys.length ||
          records.some((r) =>
            ledger.entries.some(
              (e) =>
                e.wordId === r.id ||
                e.wordKey === r.word.trim().toLocaleLowerCase("en"),
            ),
          )
        )
          fail("Duplicate word/ID grouping in run");
        const dir = path.join(ctx.dir, "groups", options.groupId),
          frozen = [];
        for (const r of records) {
          const c = clone(r.candidate);
          for (const k of ["source", "card", "thumbnail"])
            c[k] = await copyAsset(
              ctx,
              r.candidate[k],
              path.join(dir, "assets"),
            );
          frozen.push({ ...clone(r), candidate: c });
        }
        for (const r of records) await assertCurrentProfile(ctx, r);
        const manifest = {
          schemaVersion: 1,
          batchId: q.batchId,
          groupId: options.groupId,
          releaseId: options.releaseId,
          runId: options.runId,
          preparedAt: now(),
          status: "prepared-unpublished",
          publicationVerified: false,
          records: frozen,
          count: frozen.length,
        };
        const file = path.join(dir, "manifest.json");
        if (await optionalJson(file, ctx.root))
          fail("Unregistered existing manifest requires explicit recovery");
        await atomicJson(ctx.root, file, manifest);
        const g = {
          batchId: q.batchId,
          groupId: options.groupId,
          releaseId: options.releaseId,
          runId: options.runId,
          wordIds: clone(options.wordIds),
          manifestPath: file,
          sha256: hash((await boundedBytes(file, JSON_LIMIT, ctx.root)).bytes),
          status: "prepared-unpublished",
        };
        ledger.groups.push(g);
        ledger.entries.push(
          ...records.map((r) => ({
            batchId: q.batchId,
            groupId: g.groupId,
            wordId: r.id,
            wordKey: r.word.trim().toLocaleLowerCase("en"),
          })),
        );
        await atomicJson(ctx.root, ledgerFile, ledger);
        q.groups.push(g);
        q.history.push({
          at: now(),
          type: "group-prepared",
          groupId: g.groupId,
          manifestSha256: g.sha256,
        });
        return { ...g, manifest };
      },
    ),
  );
}
export async function buildBoard(options) {
  const ctx = await context(options),
    q = await loadQueue(options),
    display = clone(q),
    dir = path.join(ctx.dir, "board");
  await mkdirSafe(ctx.root, dir);
  for (const r of display.records)
    if (r.candidate) {
      for (const k of ["source", "card", "thumbnail"])
        if (r.candidate[k])
          r.candidate[k] = await copyAsset(
            ctx,
            r.candidate[k],
            path.join(dir, "assets"),
          );
    }
  const { renderReviewBoard } = await import("./vocabulary-review-board.mjs");
  const html = renderReviewBoard(display);
  if (typeof html !== "string" || Buffer.byteLength(html) > JSON_LIMIT)
    fail("Invalid/oversized private board");
  const file = path.join(dir, "index.html");
  await noLinks(ctx.root, file, true);
  const temp = file + ".tmp-" + crypto.randomUUID();
  try {
    await fs.writeFile(temp, html, { flag: "wx", mode: 0o600 });
    await fs.rename(temp, file);
  } finally {
    await fs.rm(temp, { force: true });
  }
  return {
    path: file,
    batchId: q.batchId,
    records: q.records.length,
    publicationVerified: false,
  };
}
export async function readInputJson({ root = process.cwd(), file }) {
  const actual = await fs.realpath(root);
  return jsonFile(path.resolve(actual, file), actual);
}
