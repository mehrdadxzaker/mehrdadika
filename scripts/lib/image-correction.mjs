// Existing-image publication only. No image generation or semantic approval occurs here.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  loadQueue,
  validateReadyRecord,
  existingImageCorrections,
  fingerprint,
} from "./vocabulary-production.mjs";
import { loadPublishedRelease, compileLocale } from "../build-locales.mjs";
import { compileReadingLocale } from "../build-reading-locales.mjs";
import { buildContent } from "../build-content.mjs";
import { visualLanguageHash } from "../check-visual-languages.mjs";

const requireValue = (v, m) => {
  if (!v) throw new Error(m);
};
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const clone = (x) => structuredClone(x);
const encoded = (x) => JSON.stringify(x, null, 2) + "\n";
const privatePrefix = ".local/vocabulary-production/";
const mutableSources = [
  "content/entries.json",
  "content/illustration-audit.json",
  "content/media-provenance.json",
  "content/expansion-campaign.json",
  "content/category-expansion.json",
];
const snapshots = [
  ...mutableSources,
  "content/locales/pt-BR.json",
  "content/locales/es-419.json",
  "content/visual-languages.json",
];
const compiled = [
  "src/locales/published/pt-BR.json",
  "src/locales/published/es-419.json",
  "src/i18n/published/readings.pt-BR.json",
  "src/i18n/published/readings.es-419.json",
];
const id = (x) =>
  requireValue(
    typeof x === "string" &&
      /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(x) &&
      ![".", ".."].includes(x),
    "Unsafe correction identifier",
  );
function safe(root, relative, missing = false) {
  requireValue(
    typeof relative === "string" &&
      relative &&
      !path.isAbsolute(relative) &&
      !relative.includes("\\") &&
      !relative.includes("\0") &&
      !relative.split("/").some((x) => [".", "..", ""].includes(x)),
    "Unsafe relative correction path",
  );
  let p = root;
  for (const piece of relative.split("/")) {
    p = path.join(p, piece);
    try {
      requireValue(
        !fs.lstatSync(p).isSymbolicLink(),
        "Symlink correction path",
      );
    } catch (e) {
      if (e.code !== "ENOENT" || !missing) throw e;
    }
  }
  requireValue(p.startsWith(root + path.sep), "Correction path escape");
  return p;
}
function read(root, relative) {
  const file = safe(root, relative),
    stat = fs.statSync(file);
  requireValue(
    stat.isFile() && stat.size <= 32 * 1024 * 1024,
    "Oversized correction input",
  );
  return fs.readFileSync(file);
}
const json = (root, relative) => JSON.parse(read(root, relative));
function atomic(root, relative, data) {
  const file = safe(root, relative, true),
    temp = file + ".tmp-" + crypto.randomUUID();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  safe(root, relative, true);
  try {
    fs.writeFileSync(temp, data, { flag: "wx" });
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}
const git = (root, args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    timeout: 20000,
    maxBuffer: 8 * 1024 * 1024,
  });
const paths = (text) => text.split("\0").filter(Boolean);
function context(options) {
  id(options.batchId);
  if (options.groupId) id(options.groupId);
  const root = fs.realpathSync(options.root || process.cwd());
  const dir = privatePrefix + "pipeline/" + options.batchId;
  safe(root, dir);
  return {
    root,
    dir,
    groupDir: options.groupId ? dir + "/groups/" + options.groupId : null,
  };
}
export function assertCorrectionIndexEmpty(root) {
  requireValue(
    !git(root, ["diff", "--cached", "--name-only", "-z"]).length,
    "Correction validation requires an empty index before publication staging",
  );
}
export function assertCorrectionBaseline({ root, baseline }) {
  assertCorrectionIndexEmpty(root);
  requireValue(
    baseline.kind === "existing-image-correction" &&
      baseline.schemaVersion === 1,
    "Wrong correction baseline kind",
  );
  requireValue(
    git(root, ["rev-parse", "HEAD"]).trim() === baseline.sourceRevision,
    "Correction source head changed",
  );
  for (const [relative, digest] of Object.entries(baseline.files))
    requireValue(
      sha(read(root, relative)) === digest,
      "Protected baseline file changed: " + relative,
    );
}
export function captureCorrectionBaseline(options) {
  const { root, dir } = context(options),
    relative = options.baseline || dir + "/baseline.json";
  requireValue(
    relative.startsWith(privatePrefix),
    "Correction baseline must stay private",
  );
  safe(root, relative, true);
  if (fs.existsSync(safe(root, relative, true))) {
    const baseline = json(root, relative);
    assertCorrectionBaseline({ root, baseline });
    return baseline;
  }
  requireValue(
    !git(root, ["status", "--porcelain"]).trim(),
    "Commit tooling separately before capturing a clean correction baseline",
  );
  const published = loadPublishedRelease({ root }),
    pointer = json(root, "public/content/current.json"),
    files = {};
  for (const f of paths(git(root, ["ls-files", "-z"])))
    files[f] = sha(read(root, f));
  const snapshotFiles = {};
  for (const f of snapshots) {
    const dest = dir + "/baseline-source/" + f,
      bytes = read(root, f);
    if (fs.existsSync(safe(root, dest, true)))
      requireValue(
        read(root, dest).equals(bytes),
        "Preserve an interrupted baseline snapshot: " + f,
      );
    else atomic(root, dest, bytes);
    snapshotFiles[f] = { path: dest, sha256: files[f] };
  }
  const baseline = {
    schemaVersion: 1,
    kind: "existing-image-correction",
    sourceRevision: git(root, ["rev-parse", "HEAD"]).trim(),
    capturedAt: new Date().toISOString(),
    currentPointer: pointer,
    releaseId: published.manifest.release.id,
    words: published.entries.length,
    meanings: published.entries.reduce((n, e) => n + e.senses.length, 0),
    files,
    snapshotFiles,
  };
  atomic(root, relative, encoded(baseline));
  return baseline;
}
export function readCorrectionBaselineState(root, baseline, directory) {
  requireValue(
    baseline.snapshotFiles &&
      fingerprint(Object.keys(baseline.snapshotFiles).sort()) ===
        fingerprint([...snapshots].sort()),
    "Correction baseline requires the exact source snapshot set",
  );
  return Object.fromEntries(
    Object.entries(baseline.snapshotFiles).map(([name, ref]) => {
      requireValue(
        ref.path === directory + "/baseline-source/" + name &&
          ref.sha256 === baseline.files[name],
        "Correction snapshot is not bound to its protected baseline file: " +
          name,
      );
      const bytes = read(root, ref.path);
      requireValue(
        sha(bytes) === ref.sha256,
        "Historical correction snapshot changed: " + name,
      );
      const committed = execFileSync(
        "git",
        ["show", baseline.sourceRevision + ":" + name],
        {
          cwd: root,
          timeout: 20000,
          maxBuffer: 32 * 1024 * 1024,
        },
      );
      requireValue(
        sha(committed) === ref.sha256,
        "Correction snapshot differs from the immutable source revision: " +
          name,
      );
      return [name, JSON.parse(bytes)];
    }),
  );
}

async function frozenContext(options) {
  const ctx = context(options),
    q = await loadQueue(options),
    g = q.groups.find((x) => x.groupId === options.groupId);
  requireValue(
    g && g.kind === "existing-image-correction" && g.newEnglishWords === 0,
    "Explicit correction group required",
  );
  requireValue(
    g.manifestPath === safe(ctx.root, ctx.groupDir + "/manifest.json"),
    "Wrong correction manifest location",
  );
  const bytes = read(ctx.root, ctx.groupDir + "/manifest.json"),
    m = JSON.parse(bytes);
  requireValue(
    sha(bytes) === g.sha256 &&
      m.kind === "existing-image-correction" &&
      m.newEnglishWords === 0 &&
      m.status === "prepared-unpublished" &&
      m.publicationVerified === false &&
      m.count === m.records.length &&
      m.count >= 1 &&
      m.count <= 2,
    "Invalid frozen correction group",
  );
  requireValue(
    m.batchId === q.batchId &&
      m.groupId === g.groupId &&
      m.releaseId === g.releaseId &&
      m.runId === g.runId,
    "Frozen correction identity mismatch",
  );
  for (const frozen of m.records) {
    const current = q.records.find((r) => r.id === frozen.id);
    requireValue(
      current && !current.publication,
      "Already published or missing correction queue record",
    );
    await validateReadyRecord({ ...options, wordId: current.id });
    for (const key of [
      "entry",
      "locales",
      "profile",
      "inspections",
      "generation",
    ])
      requireValue(
        fingerprint(current[key]) === fingerprint(frozen[key]),
        "Stale frozen correction " + key,
      );
    const resolved = clone(frozen);
    for (const key of ["source", "card", "thumbnail"]) {
      const a = frozen.candidate[key],
        b = current.candidate[key];
      requireValue(
        a.sha256 === b.sha256 &&
          a.path.startsWith("assets/") &&
          a.path.split("/").length === 2,
        "Stale/unsafe frozen correction asset",
      );
      resolved.candidate[key].path = safe(
        ctx.root,
        ctx.groupDir + "/" + a.path,
      );
    }
    requireValue(
      frozen.candidate.prompt === current.candidate.prompt &&
        frozen.candidate.expectedCue === current.candidate.expectedCue,
      "Stale correction prompt/cue",
    );
    await validateReadyRecord({ ...options, record: resolved });
  }
  return { ...ctx, q, g, m };
}

/** Pure source transformation, with exact old lexical/native values preserved. */
export function correctionOutputs({
  state,
  records,
  corrections,
  group,
  baseline,
  createdAt,
}) {
  requireValue(
    group.kind === "existing-image-correction" &&
      group.newEnglishWords === 0 &&
      records.length > 0 &&
      records.length <= 2,
    "Correction output kind/budget invalid",
  );
  const out = clone(state),
    source = out["content/entries.json"],
    audit = out["content/illustration-audit.json"],
    media = out["content/media-provenance.json"],
    campaign = out["content/expansion-campaign.json"],
    ledger = out["content/category-expansion.json"],
    profiles = out["content/visual-languages.json"].profiles;
  requireValue(
    !campaign.batches.some(
      (b) => b.id === group.groupId || b.releaseId === group.releaseId,
    ),
    "Correction ledger/release identity already exists",
  );
  requireValue(
    corrections.length === records.length &&
      new Set(corrections.map((c) => c.entryId)).size === records.length,
    "Correction identities differ",
  );
  const images = [];
  for (const r of records) {
    const correction = corrections.find((c) => c.entryId === r.id),
      old = source.entries.find((e) => e.id === r.id);
    requireValue(
      old &&
        correction &&
        old.media.img === correction.oldImagePath &&
        r.entry.media.img === correction.newImagePath &&
        r.candidate.card.sha256 === correction.newImageSha256,
      "Wrong existing correction identity or image binding",
    );
    const expected = clone(old);
    expected.media.img = correction.newImagePath;
    requireValue(
      fingerprint(expected) === fingerprint(r.entry),
      "Correction changes lexical/sense/example fields",
    );
    for (const locale of ["pt-BR", "es-419"])
      requireValue(
        fingerprint(
          state["content/locales/" + locale + ".json"].entries[r.id],
        ) === fingerprint(r.locales[locale]),
        "Correction changes native overlay",
      );
    const profile = profiles.find((p) => p.id === r.categoryId),
      digest = visualLanguageHash(profile),
      a = r.inspections.author,
      s = r.inspections.second;
    requireValue(
      profile && a.accepted && s.accepted && a.reviewerId !== s.reviewerId,
      "Incomplete distinct-AI correction evidence",
    );
    const at = audit.entries.findIndex((e) => e.entryId === r.id);
    requireValue(
      at >= 0 && audit.entries[at].asset.sha256 === correction.oldImageSha256,
      "Old audit binding differs",
    );
    audit.entries[at] = {
      entryId: r.id,
      sourceWord: r.word,
      categoryId: r.categoryId,
      meanings: r.entry.senses.map((x) => ({
        senseId: x.id,
        pos: x.pos,
        en: x.en,
      })),
      examples: r.entry.ex.map((x) => ({ en: x.en, senseId: x.senseId })),
      asset: {
        path: correction.newImagePath,
        sha256: correction.newImageSha256,
      },
      visual: {
        expectedCue: r.candidate.expectedCue,
        decision: "replaced",
        reason: a.finding,
        languageId: profile.id,
        languageSha256: digest,
        styleInspection: a.finding,
      },
      review: {
        method: "AI visual inspection",
        humanReviewed: false,
        inspectedAt: a.inspectedAt,
        reviewerId: a.reviewerId,
        secondaryInspection: {
          method: "Second AI visual inspection",
          humanReviewed: false,
          assetSha256: correction.newImageSha256,
          inspectedAt: s.inspectedAt,
          inspectedSizes: s.sizes,
          finding: s.finding,
          reviewerId: s.reviewerId,
        },
      },
    };
    requireValue(
      !media.assets.some((x) => x.path === correction.newImagePath),
      "Correction provenance path already exists",
    );
    media.assets.push({
      entryId: r.id,
      kind: "img",
      path: correction.newImagePath,
      sourceUrl:
        "https://github.com/mehrdadxzaker/mehrdadika/blob/main/public/" +
        correction.newImagePath,
      license: "CC-BY-4.0",
      attribution: "Mehrdadika contributors — CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      origin:
        "Original AI-generated illustration using the OpenAI built-in image generation tool",
      humanReviewed: false,
      modifications:
        "Existing-image correction; actual original/512px/120px author and distinct second AI inspections recorded. Prior canonical and immutable media retained; independent human language and specialist review pending.",
      description: r.candidate.expectedCue,
      generationPrompt: r.candidate.prompt,
      promptHistory: [
        ...new Set(
          r.history
            .filter((h) => h.type === "generation-begun")
            .map((h) => h.prompt),
        ),
      ],
      sha256: r.candidate.card.sha256,
      width: 512,
      height: 512,
      bytes: r.candidate.card.bytes,
      visualLanguage: {
        id: profile.id,
        revision: profile.revision,
        sha256: digest,
      },
      sourceImageSha256: r.candidate.source.sha256,
      thumbnailSha256: r.candidate.thumbnail.sha256,
      ...(r.candidate.templateId
        ? { referenceTemplateId: r.candidate.templateId }
        : {}),
    });
    old.media.img = correction.newImagePath;
    images.push({
      entryId: r.id,
      oldPath: correction.oldImagePath,
      oldSha256: correction.oldImageSha256,
      newPath: correction.newImagePath,
      newSha256: correction.newImageSha256,
    });
  }
  source.releaseId = group.releaseId;
  source.createdAt = createdAt;
  const row = {
    id: group.groupId,
    parentBatchId: group.batchId,
    kind: "existing-image-correction",
    status: "published-preview",
    releaseId: group.releaseId,
    newEnglishWords: 0,
    baseline: {
      releaseId: baseline.releaseId,
      manifest: baseline.currentPointer.manifest,
      manifestSha256: baseline.currentPointer.sha256,
      words: baseline.words,
    },
    modules: [],
    imageRefreshEntryIds: records.map((r) => r.id),
    images,
    completedAt: createdAt,
    review: {
      humanReviewed: false,
      status: "AI-assisted editorial preview",
      bindings: records.map((r) => ({
        entryId: r.id,
        lexicalBinding: r.inspections.lexical.binding,
        sourceImageSha256: r.candidate.source.sha256,
        cardSha256: r.candidate.card.sha256,
        thumbnailSha256: r.candidate.thumbnail.sha256,
        authorPixelBinding: r.inspections.author.binding,
        secondPixelBinding: r.inspections.second.binding,
      })),
    },
  };
  campaign.batches.push(row);
  campaign.activeWorkBatchId = null;
  ledger.imageCorrections ??= [];
  ledger.imageCorrections.push({
    id: row.id,
    kind: row.kind,
    releaseId: row.releaseId,
    status: row.status,
    newEnglishWords: 0,
    baseline: clone(row.baseline),
    entryIds: clone(row.imageRefreshEntryIds),
    images: clone(images),
    review: { humanReviewed: false },
  });
  ledger.activePassId = row.id;
  const outputs = Object.fromEntries(mutableSources.map((f) => [f, out[f]]));
  for (const data of Object.values(outputs))
    requireValue(
      !/\/Users\/|generated_images\/|\.local\/vocabulary-production\//.test(
        encoded(data),
      ),
      "Private correction path leaked into public source",
    );
  return { outputs, images };
}
export async function integrateImageCorrection(options) {
  const ctx = await frozenContext(options),
    baseline = json(ctx.root, options.baseline || ctx.dir + "/baseline.json");
  assertCorrectionBaseline({ root: ctx.root, baseline });
  const corrections = await existingImageCorrections(
    options,
    ctx.q.records.filter((r) => ctx.g.wordIds.includes(r.id)),
  );
  requireValue(
    fingerprint(corrections) === fingerprint(ctx.m.corrections),
    "Correction old/new bindings changed since preparation",
  );
  const createdAt = new Date().toISOString(),
    planned = correctionOutputs({
      state: readCorrectionBaselineState(ctx.root, baseline, ctx.dir),
      records: ctx.m.records,
      corrections,
      group: { ...ctx.g, kind: ctx.m.kind, newEnglishWords: 0 },
      baseline,
      createdAt,
    });
  const report = {
    schemaVersion: 1,
    kind: "existing-image-correction",
    batchId: ctx.q.batchId,
    groupId: ctx.g.groupId,
    releaseId: ctx.g.releaseId,
    createdAt,
    newDistinctWords: 0,
    newMeanings: 0,
    newImagePairs: ctx.m.records.length,
    sourceWords: baseline.words,
    sourceMeanings: baseline.meanings,
    sourceWrites: Object.keys(planned.outputs),
    images: planned.images,
    applied: options.apply === true,
  };
  if (options.apply) {
    const lock = safe(ctx.root, ctx.groupDir + "/integration.lock", true);
    const handle = fs.openSync(lock, "wx");
    try {
      assertCorrectionBaseline({ root: ctx.root, baseline });
      for (const r of ctx.m.records) {
        const image = safe(ctx.root, "public/" + r.entry.media.img, true);
        fs.mkdirSync(path.dirname(image), { recursive: true });
        fs.copyFileSync(
          safe(ctx.root, ctx.groupDir + "/" + r.candidate.card.path),
          image,
          fs.constants.COPYFILE_EXCL,
        );
      }
      for (const [relative, data] of Object.entries(planned.outputs))
        atomic(ctx.root, relative, encoded(data));
      atomic(ctx.root, ctx.groupDir + "/integration.json", encoded(report));
    } finally {
      fs.closeSync(handle);
      fs.unlinkSync(lock);
    }
  }
  return report;
}
export async function auditImageCorrection(options) {
  assertCorrectionIndexEmpty(fs.realpathSync(options.root || process.cwd()));
  const ctx = await frozenContext(options),
    baseline = json(ctx.root, options.baseline || ctx.dir + "/baseline.json"),
    integration = json(ctx.root, ctx.groupDir + "/integration.json");
  requireValue(
    git(ctx.root, ["rev-parse", "HEAD"]).trim() === baseline.sourceRevision,
    "Audit source head changed",
  );
  const expected = correctionOutputs({
    state: readCorrectionBaselineState(ctx.root, baseline, ctx.dir),
    records: ctx.m.records,
    corrections: ctx.m.corrections,
    group: { ...ctx.g, kind: ctx.m.kind, newEnglishWords: 0 },
    baseline,
    createdAt: integration.createdAt,
  });
  for (const [f, data] of Object.entries(expected.outputs))
    requireValue(
      fingerprint(json(ctx.root, f)) === fingerprint(data),
      "Correction changed unintended source value: " + f,
    );
  const allowed = new Set([
    ...mutableSources,
    ...compiled,
    "public/content/current.json",
    ...expected.images.map((i) => "public/" + i.newPath),
  ]);
  for (const [f, digest] of Object.entries(baseline.files))
    if (!allowed.has(f))
      requireValue(
        sha(read(ctx.root, f)) === digest,
        "Protected file changed during correction: " + f,
      );
  for (const image of expected.images)
    requireValue(
      sha(read(ctx.root, "public/" + image.newPath)) === image.newSha256,
      "New canonical correction bytes changed",
    );
  const release = buildContent({ root: ctx.root, write: false }),
    graph = new Map(
      [
        ["public/" + release.payloadPath, release.payloadText],
        ["public/" + release.manifestPath, release.manifestText],
        ...release.shardData.entries(),
      ].map(([f, data]) => [
        f.startsWith("public/") ? f : "public/" + f,
        Buffer.from(data),
      ]),
    );
  for (const a of release.assets.values())
    graph.set("public/" + a.path, a.data);
  for (const [f, bytes] of graph) {
    requireValue(
      read(ctx.root, f).equals(bytes),
      "Incorrect compiled correction graph: " + f,
    );
    allowed.add(f);
  }
  requireValue(
    fingerprint(json(ctx.root, "public/content/current.json")) ===
      fingerprint(release.pointer),
    "Stale correction content pointer",
  );
  const published = loadPublishedRelease({ root: ctx.root });
  requireValue(
    published.entries.length === baseline.words &&
      published.entries.reduce((n, e) => n + e.senses.length, 0) ===
        baseline.meanings,
    "Correction changed English counts",
  );
  for (const locale of ["pt-BR", "es-419"]) {
    const vocabulary = compileLocale(
      json(ctx.root, "content/locales/" + locale + ".json"),
      published,
    );
    requireValue(
      fingerprint(vocabulary) ===
        fingerprint(
          json(ctx.root, "src/locales/published/" + locale + ".json"),
        ),
      "Incorrect compiled native correction vocabulary",
    );
    const reading = compileReadingLocale(
      json(ctx.root, "content/locales/readings." + locale + ".json"),
      published.index.readings,
      published,
      locale,
    );
    requireValue(
      fingerprint(reading) ===
        fingerprint(
          json(ctx.root, "src/i18n/published/readings." + locale + ".json"),
        ),
      "Incorrect compiled native correction readings",
    );
  }
  const changed = new Set([
    ...paths(git(ctx.root, ["diff", "HEAD", "--name-only", "-z"])),
    ...paths(
      git(ctx.root, ["ls-files", "--others", "--exclude-standard", "-z"]),
    ),
  ]);
  requireValue(
    [...changed].every((f) => allowed.has(f)),
    "Unexpected changed/untracked file outside correction allowlist",
  );
  const report = {
    schemaVersion: 1,
    kind: "existing-image-correction",
    accepted: true,
    humanReviewed: false,
    publicationVerified: false,
    batchId: ctx.q.batchId,
    groupId: ctx.g.groupId,
    releaseId: ctx.g.releaseId,
    baselineRevision: baseline.sourceRevision,
    frozenManifestSha256: ctx.g.sha256,
    newDistinctWords: 0,
    newMeanings: 0,
    newImagePairs: ctx.m.records.length,
    sourceWords: baseline.words,
    sourceMeanings: baseline.meanings,
    categoryCounts: Object.fromEntries(
      published.manifest.taxonomy.domains.map((d) => [
        d.id,
        published.entries.filter((e) => e.domainIds.includes(d.id)).length,
      ]),
    ),
    recordEvidence: ctx.m.records.map((r) => ({
      id: r.id,
      sourceSha256: r.candidate.source.sha256,
      cardSha256: r.candidate.card.sha256,
      thumbnailSha256: r.candidate.thumbnail.sha256,
      authorPixelBinding: r.inspections.author.binding,
      secondPixelBinding: r.inspections.second.binding,
      lexicalBinding: r.inspections.lexical.binding,
    })),
    existingTrackedFilesGuarded: Object.keys(baseline.files).length,
    allowedPaths: [...changed].sort(),
    allowedPathCount: changed.size,
    images: expected.images,
    limits:
      "Exact stored source/media/receipt and compiler integrity only; no new semantic, human or live approval. All unchanged old source, native, course and immutable files remain protected.",
  };
  if (options.writeReport)
    atomic(ctx.root, ctx.groupDir + "/final-ai-audit.json", encoded(report));
  return report;
}
