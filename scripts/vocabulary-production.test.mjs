import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import test from "node:test";
import { renderReviewBoard } from "./lib/vocabulary-review-board.mjs";
import {
  importBatch,
  loadQueue,
  stateOf,
  bindingFor,
  recordInspection,
  reconcileAttempts,
  beginGeneration,
  failGeneration,
  intakeCandidate,
  registerTemplate,
  prepareGroup,
  buildBoard,
} from "./lib/vocabulary-production.mjs";

const BATCH = "fixture-production";
const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const clone = (value) => structuredClone(value);
const read = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const write = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2) + "\n");
};

// Real, tiny compressed PNG fixtures; they are test pixels, never atlas artwork.
function png(width, height, shade = 220) {
  const crc32 = (data) => {
    let crc = 0xffffffff;
    for (const byte of data) {
      crc ^= byte;
      for (let n = 0; n < 8; n++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };
  const chunk = (name, data) => {
    const type = Buffer.from(name);
    const result = Buffer.alloc(data.length + 12);
    result.writeUInt32BE(data.length);
    type.copy(result, 4);
    data.copy(result, 8);
    result.writeUInt32BE(crc32(Buffer.concat([type, data])), data.length + 8);
    return result;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const scanlines = Buffer.alloc(height * (width * 3 + 1), shade);
  for (let y = 0; y < height; y++) scanlines[y * (width * 3 + 1)] = 0;
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(scanlines)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Explicit RIFF/VP8X dimension-header fixture, not a decoded or reviewed image.
// Binary-header parsing tests must not confer real-pixel inspection approval.
function webpHeader(width, height) {
  const data = Buffer.alloc(30);
  data.write("RIFF", 0);
  data.writeUInt32LE(22, 4);
  data.write("WEBPVP8X", 8);
  data.writeUInt32LE(10, 16);
  data.writeUIntLE(width - 1, 24, 3);
  data.writeUIntLE(height - 1, 27, 3);
  return data;
}

function sourceEntry(id, word = id.replaceAll("-", " ")) {
  return {
    id,
    w: word,
    uk: "/ˈfɪkstʃə/",
    us: "/ˈfɪkstʃər/",
    cefr: "C1",
    topic: "medicine-healthcare",
    domainIds: ["medicine-healthcare"],
    senses: [
      {
        id: `${id}:meaning-1`,
        pos: "n.",
        fa: "واژهٔ آزمایشی",
        en: "A clearly selected test concept.",
        domainIds: ["medicine-healthcare"],
        review: { status: "preview", humanReviewed: false },
      },
    ],
    ex: [
      {
        en: `The ${word} has a distinct purpose.`,
        fa: "این واژه کاربردی مشخص دارد.",
        senseId: `${id}:meaning-1`,
      },
      {
        en: "The teacher explained its structure.",
        fa: "آموزگار ساختار آن را توضیح داد.",
        senseId: `${id}:meaning-1`,
      },
    ],
    col: [
      "a test concept｜یک مفهوم آزمایشی",
      "a clear structure｜ساختاری روشن",
      "a useful distinction｜تمایزی سودمند",
    ],
    fam: [],
    syn: [],
    ant: [],
    tip: "An explicit selected test sense, with no approval claim.",
    media: { img: `atlas/img/${id}.webp` },
    provenance: {
      license: "CC-BY-4.0",
      aiAssisted: true,
      source: "Original test fixture",
      attribution: "Test fixture",
      modifications: "Human review pending.",
    },
  };
}
function overlay(entry, locale) {
  return {
    sourceWord: entry.w,
    senses: {
      [`${entry.id}:meaning-1`]: {
        gloss: locale === "pt-BR" ? "conceito de teste" : "concepto de prueba",
        definition: "A complete native test definition.",
      },
    },
    examples: entry.ex.map(({ en }) => ({
      en,
      translation: "A complete test translation.",
    })),
    collocations: entry.col.map((col) => ({
      en: col.split("｜")[0],
      translation: "A complete test collocation.",
    })),
    tip: "A useful test distinction; independent human review pending.",
  };
}
async function fixture(t, { count = 1, legacyImages = true } = {}) {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "mehrdadika-production-test-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const batch = path.join(root, ".local/vocabulary-production", BATCH);
  await fs.mkdir(batch, { recursive: true });
  const profile = {
    id: "medicine-healthcare",
    revision: 1,
    label: "Medicine",
    medium: "Precise clinical forms",
    palette: ["#EEF7F3", "#387E78", "#A6C7D6"],
    composition: "Square teaching focus",
    semanticChecks: "Correct selected concept",
    avoid: "No irrelevant props",
  };
  await write(path.join(root, "content/visual-languages.json"), {
    schemaVersion: 1,
    profiles: [profile],
  });
  await fs.mkdir(path.join(root, "public/content"), { recursive: true });
  await fs.writeFile(
    path.join(root, "public/content/current.json"),
    '{"immutable":"published pointer"}\n',
  );
  await fs.writeFile(
    path.join(root, "public/legacy.bin"),
    Buffer.from([0, 1, 2, 254, 255]),
  );
  const entries = Array.from({ length: count }, (_, i) =>
    sourceEntry(`fixture-${i + 1}`),
  );
  const part = {
    entries,
    locales: Object.fromEntries(
      ["pt-BR", "es-419"].map((locale) => [
        locale,
        Object.fromEntries(
          entries.map((entry) => [entry.id, overlay(entry, locale)]),
        ),
      ]),
    ),
    images: [],
    sources: entries.map(({ id }) => ({
      entryId: id,
      url: "https://example.invalid/primary-fixture",
      use: "Offline test fixture only.",
    })),
  };
  const source = path.join(batch, "fixtures/source.png"),
    card = path.join(batch, "fixtures/card.webp"),
    thumbnail = path.join(batch, "fixtures/thumbnail.png");
  await fs.mkdir(path.dirname(source), { recursive: true });
  await fs.writeFile(source, png(1254, 1254));
  await fs.writeFile(card, webpHeader(512, 512));
  await fs.writeFile(thumbnail, png(120, 120));
  if (legacyImages)
    part.images = entries.map(({ id }) => ({
      entryId: id,
      path: `atlas/img/${id}.webp`,
      stagedPath: card,
      thumbnail,
      generatedSource: source,
      sha256: sha(webpHeader(512, 512)),
      prompt: "Original test prompt",
      expectedCue: "Exact test structure",
      inspection: "Legacy author claim, not a receipt",
      styleInspection: "Legacy style claim, not a receipt",
    }));
  await write(path.join(batch, "medical.json"), part);
  await write(path.join(batch, "engineering.json"), {
    entries: [],
    locales: { "pt-BR": {}, "es-419": {} },
    images: [],
    sources: [],
  });
  return {
    root,
    batchId: BATCH,
    batch,
    part,
    profile,
    source,
    card,
    thumbnail,
    draft: path.join(batch, "medical.json"),
    profileFile: path.join(root, "content/visual-languages.json"),
  };
}
const load = (f) => loadQueue({ root: f.root, batchId: f.batchId });
const find = (queue, id = "fixture-1") =>
  queue.records.find((record) => record.id === id);
const receipt = (record, role, extra = {}) => ({
  role,
  reviewerId:
    role === "author"
      ? "author-fixture"
      : role === "second"
        ? "second-fixture"
        : "lexical-fixture",
  accepted: true,
  humanReviewed: false,
  basis: role === "lexical" ? "actual-text" : "actual-pixels",
  finding:
    "Explicit test receipt: fixture-only simulated inspection, never real product approval.",
  inspectedAt: new Date().toISOString(),
  ...(role === "lexical" ? {} : { sizes: [1254, 512, 120] }),
  binding: bindingFor(record, role),
  ...extra,
});

async function ready(f, ids) {
  for (const wordId of ids ?? (await load(f)).records.map(({ id }) => id)) {
    const record = find(await load(f), wordId);
    if (record.generation.legacyUnreconciled)
      await reconcileAttempts({
        root: f.root,
        batchId: f.batchId,
        wordId,
        used: 1,
        evidence:
          "Fixture archive contains exactly one original generation; no retries or uncounted pending outputs.",
      });
    for (const role of ["author", "second", "lexical"]) {
      const current = find(await load(f), wordId);
      await recordInspection({
        root: f.root,
        batchId: f.batchId,
        wordId,
        receipt: receipt(current, role),
      });
    }
  }
}
async function begin(f, wordId = "fixture-1") {
  const record = find(await load(f), wordId);
  if (record.generation.legacyUnreconciled)
    await reconcileAttempts({
      root: f.root,
      batchId: f.batchId,
      wordId,
      used: 0,
      evidence:
        "Fixture has no generation outputs, requests or failures; explicit zero-attempt reconciliation.",
    });
  return beginGeneration({
    root: f.root,
    batchId: f.batchId,
    wordId,
    prompt: "Specific original fixture prompt",
    expectedCue: "A distinct fixture-only shape",
  });
}
const group = (f, groupId, wordIds, runId = "automatic-run-1") =>
  prepareGroup({
    root: f.root,
    batchId: f.batchId,
    groupId,
    releaseId: `fixture-${groupId}`,
    runId,
    wordIds,
  });

// No test simulates a real person's approval: receipts below are explicit fixtures.
test("legacy import preserves original drafts, current pointer and binary assets without inventing receipts", async (t) => {
  const f = await fixture(t);
  const files = [
    f.draft,
    f.source,
    f.card,
    f.thumbnail,
    f.profileFile,
    path.join(f.root, "public/content/current.json"),
    path.join(f.root, "public/legacy.bin"),
  ];
  const before = await Promise.all(files.map((file) => fs.readFile(file)));
  await importBatch(f);
  const queue = await load(f),
    record = find(queue);
  assert.equal(queue.records.length, 1);
  assert.deepEqual(record.entry, f.part.entries[0]);
  assert.deepEqual(record.locales, {
    "pt-BR": f.part.locales["pt-BR"][record.id],
    "es-419": f.part.locales["es-419"][record.id],
  });
  assert.equal(record.candidate.card.sha256, sha(await fs.readFile(f.card)));
  assert.equal(stateOf(record), "needs-attempt-reconciliation");
  for (const role of ["author", "second", "lexical"])
    assert.equal(record.inspections[role], null);
  assert.equal(record.generation.legacyUnreconciled, true);
  assert.ok(
    record.history.length > 0,
    "legacy claims remain history, not accepted reviews",
  );
  const after = await Promise.all(files.map((file) => fs.readFile(file)));
  assert.deepEqual(after, before);
});

test("unchanged import reuses cached identities and preserves valid explicit receipts", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  await ready(f);
  const before = find(await load(f));
  await importBatch(f);
  const after = find(await load(f));
  assert.equal((await load(f)).records.length, 1);
  assert.deepEqual(after.candidate, before.candidate);
  assert.deepEqual(after.inspections, before.inspections);
  assert.equal(after.generation.attemptsUsed, before.generation.attemptsUsed);
  assert.equal(stateOf(after), "ready");
});

test("pixel receipts need actual-pixel basis, current binding, identity, timestamp, finding and all three sizes", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  await reconcileAttempts({
    root: f.root,
    batchId: f.batchId,
    wordId: "fixture-1",
    used: 1,
    evidence:
      "One known fixture generation reconciled before receipt metadata tests.",
  });
  const record = find(await load(f));
  const invalid = [
    { reviewerId: "" },
    { inspectedAt: "not-a-date" },
    { inspectedAt: "2020-01-01" },
    { finding: "" },
    { basis: "prompt-only" },
    { binding: "0".repeat(64) },
    { sizes: [512, 120] },
    { sizes: [1254, 512] },
    { sizes: [1254, 256, 120] },
    { humanReviewed: true },
  ];
  for (const change of invalid)
    await assert.rejects(
      () =>
        recordInspection({
          root: f.root,
          batchId: f.batchId,
          wordId: record.id,
          receipt: receipt(record, "author", change),
        }),
      undefined,
      JSON.stringify(change),
    );
  assert.equal(find(await load(f)).inspections.author, null);
  await recordInspection({
    root: f.root,
    batchId: f.batchId,
    wordId: record.id,
    receipt: receipt(record, "author"),
  });
  assert.equal(stateOf(find(await load(f))), "needs-second-inspection");
});

test("author and independent second pixel reviewer cannot be the same identity", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  const record = find(await load(f));
  await recordInspection({
    root: f.root,
    batchId: f.batchId,
    wordId: record.id,
    receipt: receipt(record, "author"),
  });
  const current = find(await load(f));
  await assert.rejects(() =>
    recordInspection({
      root: f.root,
      batchId: f.batchId,
      wordId: record.id,
      receipt: receipt(current, "second", { reviewerId: "author-fixture" }),
    }),
  );
  assert.equal(find(await load(f)).inspections.second, null);
});

test("lexical review uses actual-text basis and cannot be replaced by pixel approval", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  await reconcileAttempts({
    root: f.root,
    batchId: f.batchId,
    wordId: "fixture-1",
    used: 1,
    evidence:
      "One known fixture generation reconciled before lexical-gate tests.",
  });
  for (const role of ["author", "second"]) {
    const record = find(await load(f));
    await recordInspection({
      root: f.root,
      batchId: f.batchId,
      wordId: record.id,
      receipt: receipt(record, role),
    });
  }
  const record = find(await load(f));
  assert.equal(stateOf(record), "needs-lexical-review");
  await assert.rejects(() =>
    recordInspection({
      root: f.root,
      batchId: f.batchId,
      wordId: record.id,
      receipt: receipt(record, "lexical", { basis: "actual-pixels" }),
    }),
  );
  await assert.rejects(() => group(f, "without-lexical", [record.id]));
});

test("changed selected meaning invalidates pixel and lexical receipts while preserving stale evidence", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  await ready(f);
  const before = find(await load(f));
  f.part.entries[0].senses[0].en =
    "A materially different selected anatomical meaning.";
  await write(f.draft, f.part);
  await importBatch(f);
  const after = find(await load(f));
  for (const role of ["author", "second", "lexical"])
    assert.notEqual(bindingFor(after, role), bindingFor(before, role));
  assert.notEqual(stateOf(after), "ready");
  assert.ok(after.history.length >= before.history.length);
  await assert.rejects(() => group(f, "stale-meaning", [after.id]));
});

test("native-only text changes stale lexical review without discarding an unchanged pixel binding", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  await ready(f);
  const before = find(await load(f));
  f.part.locales["pt-BR"][before.id].tip +=
    " A precise new language distinction.";
  await write(f.draft, f.part);
  await importBatch(f);
  const after = find(await load(f));
  assert.equal(bindingFor(after, "author"), bindingFor(before, "author"));
  assert.notEqual(bindingFor(after, "lexical"), bindingFor(before, "lexical"));
  assert.notEqual(stateOf(after), "ready");
  await assert.rejects(() => group(f, "stale-native", [after.id]));
});

test("profile changes stale reviews; conflicting legacy prompts cannot overwrite a reviewed candidate", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  await ready(f);
  const first = find(await load(f));
  f.profile.medium = "A materially different rendering brief";
  await write(f.profileFile, { profiles: [f.profile] });
  await importBatch(f);
  const changedProfile = find(await load(f));
  assert.notEqual(
    bindingFor(changedProfile, "author"),
    bindingFor(first, "author"),
  );
  assert.notEqual(stateOf(changedProfile), "ready");
  await ready(f);
  const beforePrompt = find(await load(f));
  f.part.images[0].prompt = "A materially different incoming legacy prompt";
  await write(f.draft, f.part);
  await importBatch(f);
  const conflicting = find(await load(f));
  assert.deepEqual(
    conflicting.candidate,
    beforePrompt.candidate,
    "a reviewed current candidate is preserved",
  );
  assert.ok(
    conflicting.legacyConflict,
    "different incoming legacy evidence is quarantined explicitly",
  );
  assert.notEqual(stateOf(conflicting), "ready");
  await assert.rejects(() => group(f, "conflicting-prompt", [conflicting.id]));
  await reconcileAttempts({
    root: f.root,
    batchId: f.batchId,
    wordId: conflicting.id,
    used: 1,
    evidence:
      "Fixture prompt metadata was edited without another generation; retained inspected candidate and reconciled one known original request.",
  });
  await beginGeneration({
    root: f.root,
    batchId: f.batchId,
    wordId: conflicting.id,
    prompt: "A genuinely new queued prompt",
    expectedCue: "Current meaning after explicit reconciliation",
  });
  const token = find(await load(f)).generation.pending.token;
  await intakeCandidate({
    root: f.root,
    batchId: f.batchId,
    wordId: conflicting.id,
    source: f.source,
    card: f.card,
    thumbnail: f.thumbnail,
    token,
  });
  const afterPrompt = find(await load(f));
  assert.notEqual(
    bindingFor(afterPrompt, "author"),
    bindingFor(beforePrompt, "author"),
  );
  assert.equal(afterPrompt.inspections.author, null);
  assert.equal(afterPrompt.inspections.second, null);
  assert.notEqual(stateOf(afterPrompt), "ready");
});

test("conflicting legacy pixels are preserved separately; actual queued replacement invalidates approval", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  await ready(f);
  const before = find(await load(f));
  await fs.writeFile(f.source, png(1254, 1254, 140));
  await importBatch(f);
  const conflicting = find(await load(f));
  assert.equal(
    conflicting.candidate.source.sha256,
    before.candidate.source.sha256,
  );
  assert.ok(conflicting.legacyConflict);
  assert.notEqual(stateOf(conflicting), "ready");
  await assert.rejects(() => group(f, "conflicting-pixels", [conflicting.id]));
  await reconcileAttempts({
    root: f.root,
    batchId: f.batchId,
    wordId: conflicting.id,
    used: 1,
    evidence:
      "One fixture generation; input pixels were changed by this test rather than another image request. Preserve old cache and stage a new explicit queued request.",
  });
  await begin(f);
  const token = find(await load(f)).generation.pending.token;
  await intakeCandidate({
    root: f.root,
    batchId: f.batchId,
    wordId: conflicting.id,
    source: f.source,
    card: f.card,
    thumbnail: f.thumbnail,
    token,
  });
  const after = find(await load(f));
  assert.notEqual(
    after.candidate.source.sha256,
    before.candidate.source.sha256,
  );
  assert.notEqual(bindingFor(after, "author"), bindingFor(before, "author"));
  assert.equal(after.inspections.author, null);
  assert.equal(after.inspections.second, null);
  assert.deepEqual(
    after.inspections.lexical,
    before.inspections.lexical,
    "An image-only replacement reuses the exact genuine unchanged-text receipt",
  );
  assert.equal(after.inspections.lexical.binding, bindingFor(after, "lexical"));
  assert.notEqual(stateOf(after), "ready");
  assert.equal(
    sha(await fs.readFile(before.candidate.source.path)),
    before.candidate.source.sha256,
    "old immutable cached source remains available",
  );
});

test("missing or misbound native content cannot acquire lexical readiness", async (t) => {
  const f = await fixture(t);
  delete f.part.locales["es-419"]["fixture-1"];
  await write(f.draft, f.part);
  await importBatch(f);
  assert.equal(stateOf(find(await load(f))), "needs-content");
  await assert.rejects(() => group(f, "missing-native", ["fixture-1"]));
  f.part.locales["es-419"]["fixture-1"] = overlay(f.part.entries[0], "es-419");
  f.part.locales["es-419"]["fixture-1"].examples[0].en =
    "An unrelated binding.";
  await write(f.draft, f.part);
  await importBatch(f);
  assert.equal(stateOf(find(await load(f))), "needs-content");
  await assert.rejects(() => group(f, "misbound-native", ["fixture-1"]));
});

test("legacy attempt uncertainty must be explicitly reconciled and never silently reset", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  await assert.rejects(() =>
    beginGeneration({
      root: f.root,
      batchId: f.batchId,
      wordId: "fixture-1",
      prompt: "Another attempt",
      expectedCue: "A new cue",
    }),
  );
  await assert.rejects(() =>
    reconcileAttempts({
      root: f.root,
      batchId: f.batchId,
      wordId: "fixture-1",
      used: 1,
      evidence: "",
    }),
  );
  await assert.rejects(() =>
    reconcileAttempts({
      root: f.root,
      batchId: f.batchId,
      wordId: "fixture-1",
      used: 4,
      evidence: "Invalid count",
    }),
  );
  await reconcileAttempts({
    root: f.root,
    batchId: f.batchId,
    wordId: "fixture-1",
    used: 3,
    evidence:
      "Three archived request IDs and all candidate/failure evidence checked; no further request authorized.",
  });
  await importBatch(f);
  assert.equal(find(await load(f)).generation.attemptsUsed, 3);
  await assert.rejects(() =>
    beginGeneration({
      root: f.root,
      batchId: f.batchId,
      wordId: "fixture-1",
      prompt: "Forbidden fourth",
      expectedCue: "No output",
    }),
  );
});

test("generation has one pending token, a three-attempt cap and held failures stay out of groups", async (t) => {
  const f = await fixture(t, { legacyImages: false });
  await importBatch(f);
  for (let i = 0; i < 3; i++) {
    const started = await begin(f);
    const pending = find(await load(f)).generation.pending;
    const token = pending?.token ?? started.token;
    assert.ok(token);
    await assert.rejects(() =>
      beginGeneration({
        root: f.root,
        batchId: f.batchId,
        wordId: "fixture-1",
        prompt: "Concurrent duplicate",
        expectedCue: "Invalid",
      }),
    );
    await assert.rejects(() =>
      failGeneration({
        root: f.root,
        batchId: f.batchId,
        wordId: "fixture-1",
        token: "wrong-token",
        reason: "Unrelated completion",
      }),
    );
    await failGeneration({
      root: f.root,
      batchId: f.batchId,
      wordId: "fixture-1",
      token,
      reason: `Concrete failed fixture candidate ${i + 1}`,
    });
  }
  const final = find(await load(f));
  assert.equal(final.generation.attemptsUsed, 3);
  assert.equal(stateOf(final), "held");
  await assert.rejects(() => begin(f));
  await assert.rejects(() => group(f, "held-group", [final.id]));
  await assert.rejects(() =>
    reconcileAttempts({
      root: f.root,
      batchId: f.batchId,
      wordId: final.id,
      used: 0,
      evidence: "Attempted reset of known failures",
    }),
  );
});

test("intake checks actual binary dimensions instead of filename or caller claims", async (t) => {
  const f = await fixture(t, { legacyImages: false });
  await importBatch(f);
  await begin(f);
  const token = find(await load(f)).generation.pending.token;
  const badCard = path.join(f.batch, "fixtures/wrong-size.webp");
  await fs.writeFile(badCard, webpHeader(511, 512));
  await assert.rejects(() =>
    intakeCandidate({
      root: f.root,
      batchId: f.batchId,
      wordId: "fixture-1",
      source: f.source,
      card: badCard,
      thumbnail: f.thumbnail,
      token,
    }),
  );
  const truncated = path.join(f.batch, "fixtures/truncated.png");
  await fs.writeFile(truncated, Buffer.from("89504e470d0a1a0a", "hex"));
  await assert.rejects(() =>
    intakeCandidate({
      root: f.root,
      batchId: f.batchId,
      wordId: "fixture-1",
      source: truncated,
      card: f.card,
      thumbnail: f.thumbnail,
      token,
    }),
  );
  await intakeCandidate({
    root: f.root,
    batchId: f.batchId,
    wordId: "fixture-1",
    source: f.source,
    card: f.card,
    thumbnail: f.thumbnail,
    token,
  });
  const accepted = find(await load(f));
  assert.equal(accepted.candidate.source.width, 1254);
  assert.equal(accepted.candidate.card.width, 512);
  assert.equal(accepted.candidate.thumbnail.width, 120);
  assert.equal(
    stateOf(accepted),
    "needs-author-inspection",
    "binary intake does not invent a pixel review",
  );
});

test("workspace and batch path escapes, including symlinks, are rejected", async (t) => {
  const f = await fixture(t, { legacyImages: false });
  await importBatch(f);
  await begin(f);
  const outside = await fs.mkdtemp(
    path.join(os.tmpdir(), "mehrdadika-outside-test-"),
  );
  t.after(() => fs.rm(outside, { recursive: true, force: true }));
  const escaped = path.join(outside, "source.png");
  await fs.writeFile(escaped, png(1254, 1254));
  const symlink = path.join(f.batch, "fixtures/source-link.png");
  await fs.symlink(escaped, symlink);
  const token = find(await load(f)).generation.pending.token;
  for (const source of [escaped, symlink])
    await assert.rejects(() =>
      intakeCandidate({
        root: f.root,
        batchId: f.batchId,
        wordId: "fixture-1",
        source,
        card: f.card,
        thumbnail: f.thumbnail,
        token,
      }),
    );
  await assert.rejects(() =>
    importBatch({ root: f.root, batchId: "../../outside" }),
  );
  await assert.rejects(() =>
    prepareGroup({
      root: f.root,
      batchId: f.batchId,
      groupId: "../../public",
      releaseId: "fixture-preview",
      runId: "fixture-run",
      wordIds: ["fixture-1"],
    }),
  );
  assert.equal(
    await fs.readFile(escaped, "hex"),
    png(1254, 1254).toString("hex"),
  );
});

test("legacy imports cannot read asset symlinks outside the authorized workspace", async (t) => {
  const f = await fixture(t);
  const outside = await fs.mkdtemp(
    path.join(os.tmpdir(), "mehrdadika-legacy-outside-"),
  );
  t.after(() => fs.rm(outside, { recursive: true, force: true }));
  const escaped = path.join(outside, "source.png");
  await fs.writeFile(escaped, png(1254, 1254));
  const link = path.join(f.batch, "fixtures/legacy-source-link.png");
  await fs.symlink(escaped, link);
  f.part.images[0].generatedSource = link;
  await write(f.draft, f.part);
  await importBatch(f);
  const record = find(await load(f));
  assert.equal(
    record.candidate?.source,
    undefined,
    "unsafe source is not copied into the cache",
  );
  assert.notEqual(stateOf(record), "ready");
  assert.ok(
    record.history.some(
      (item) =>
        item.type === "legacy-asset-unavailable" &&
        /symlink/i.test(item.reason),
    ),
    "unsafe legacy asset rejection remains explicit evidence",
  );
});

test("group preparation needs readiness, unique membership and the aggregate run24 cap", async (t) => {
  const f = await fixture(t, { count: 25 });
  await importBatch(f);
  await assert.rejects(() => group(f, "unreviewed", ["fixture-1"]));
  await ready(f);
  const ids = (await load(f)).records.map(({ id }) => id);
  await assert.rejects(() => group(f, "duplicate-list", [ids[0], ids[0]]));
  await assert.rejects(() => group(f, "oversized", ids));
  await group(f, "first-dozen", ids.slice(0, 12));
  await assert.rejects(() =>
    group(f, "already-member", [ids[0]], "another-run"),
  );
  await group(f, "second-dozen", ids.slice(12, 24));
  await assert.rejects(() => group(f, "twenty-fifth", ids.slice(24)));
  const queue = await load(f);
  assert.equal(queue.groups.length, 2);
  assert.ok(!JSON.stringify(queue.groups).includes("live-verified"));
  assert.ok(!JSON.stringify(queue.groups).includes('"published":true'));
  assert.equal(
    await fs.readFile(path.join(f.root, "public/content/current.json"), "utf8"),
    '{"immutable":"published pointer"}\n',
  );
});

test("group preparation rechecks cached asset bytes against reviewed hashes", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  await ready(f);
  const record = find(await load(f));
  await fs.writeFile(record.candidate.card.path, webpHeader(511, 512));
  await assert.rejects(() => group(f, "tampered-cache", [record.id]));
});

test("templates preserve ancestry but derivative intake never inherits parent's approval", async (t) => {
  const f = await fixture(t, { count: 2 });
  await importBatch(f);
  await assert.rejects(() =>
    registerTemplate({
      root: f.root,
      batchId: f.batchId,
      wordId: "fixture-1",
      templateId: "unreviewed-template",
      usageNotes: "Would be unreviewed",
    }),
  );
  await ready(f, ["fixture-1"]);
  await registerTemplate({
    root: f.root,
    batchId: f.batchId,
    wordId: "fixture-1",
    templateId: "approved-fixture-template",
    usageNotes:
      "Only a test shape; derivative requires new actual three-size inspection and independent review.",
  });
  await reconcileAttempts({
    root: f.root,
    batchId: f.batchId,
    wordId: "fixture-2",
    used: 1,
    evidence: "One archived fixture request, reconciled explicitly.",
  });
  await beginGeneration({
    root: f.root,
    batchId: f.batchId,
    wordId: "fixture-2",
    templateId: "approved-fixture-template",
    prompt: "A distinct derivative for the second selected word",
    expectedCue: "Different final fixture meaning",
  });
  const token = find(await load(f), "fixture-2").generation.pending.token;
  await intakeCandidate({
    root: f.root,
    batchId: f.batchId,
    wordId: "fixture-2",
    source: f.source,
    card: f.card,
    thumbnail: f.thumbnail,
    token,
  });
  const derived = find(await load(f), "fixture-2");
  assert.equal(stateOf(derived), "needs-author-inspection");
  assert.equal(derived.inspections.author, null);
  assert.equal(derived.inspections.second, null);
  assert.ok(
    JSON.stringify(derived).includes("approved-fixture-template"),
    "derivative ancestry survives intake",
  );
});

test("private board escapes untrusted source text and never adds approval or publication controls", async (t) => {
  const f = await fixture(t);
  const hostile = '<script>alert("fixture")</script>';
  f.part.entries[0].w = hostile;
  f.part.entries[0].ex[0].en = `The ${hostile} has a distinct purpose.`;
  f.part.entries[0].senses[0].en = '<img src=x onerror="fixture()">';
  for (const locale of ["pt-BR", "es-419"])
    f.part.locales[locale]["fixture-1"] = overlay(f.part.entries[0], locale);
  f.part.images[0].prompt = '<img src="x" onerror="prompt()">';
  await write(f.draft, f.part);
  await importBatch(f);
  await buildBoard(f);
  const board = path.join(
    f.root,
    ".local/vocabulary-production/pipeline",
    f.batchId,
    "board/index.html",
  );
  const html = await fs.readFile(board, "utf8");
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes(hostile));
  assert.ok(!html.includes('<img src=x onerror="fixture()">'));
  assert.ok(
    !/<(?:button|form)\b[^>]*(?:id|name|data-action)=["\'][^"\']*(?:approve|publish)/i.test(
      html,
    ),
  );
  assert.ok(!/<button\b[^>]*>\s*(?:approve|publish)\b/i.test(html));
  assert.ok(!/live-verified/i.test(html));
  assert.equal((await load(f)).groups.length, 0);
});

test("concurrent inspection mutations retain every successful receipt or fail explicitly busy", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  const record = find(await load(f));
  const roles = ["author", "lexical"];
  const outcomes = await Promise.allSettled(
    roles.map((role) =>
      recordInspection({
        root: f.root,
        batchId: f.batchId,
        wordId: record.id,
        receipt: receipt(record, role),
      }),
    ),
  );
  assert.ok(outcomes.some(({ status }) => status === "fulfilled"));
  const final = find(await load(f));
  for (let index = 0; index < roles.length; index++) {
    const outcome = outcomes[index],
      role = roles[index];
    if (outcome.status === "rejected") {
      assert.match(String(outcome.reason), /busy|lock|conflict/i);
      assert.equal(final.inspections[role], null);
    } else {
      assert.deepEqual(
        final.inspections[role],
        receipt(record, role, {
          inspectedAt: final.inspections[role].inspectedAt,
        }),
      );
      assert.ok(
        final.history.some(
          (event) =>
            event.type === "inspection-recorded" &&
            event.receipt?.role === role,
        ),
      );
    }
  }
});

test("concurrent groups across separate batch queues cannot lose the shared run24 accounting", async (t) => {
  const f = await fixture(t, { count: 26 });
  const second = {
    ...f,
    batchId: "fixture-second-batch",
    batch: path.join(
      f.root,
      ".local/vocabulary-production/fixture-second-batch",
    ),
  };
  second.draft = path.join(second.batch, "medical.json");
  const subset = (entries) => {
    const ids = new Set(entries.map(({ id }) => id));
    return {
      entries,
      locales: Object.fromEntries(
        ["pt-BR", "es-419"].map((locale) => [
          locale,
          Object.fromEntries(
            Object.entries(f.part.locales[locale]).filter(([id]) =>
              ids.has(id),
            ),
          ),
        ]),
      ),
      images: f.part.images.filter(({ entryId }) => ids.has(entryId)),
      sources: f.part.sources.filter(({ entryId }) => ids.has(entryId)),
    };
  };
  await write(f.draft, subset(f.part.entries.slice(0, 13)));
  await write(second.draft, subset(f.part.entries.slice(13)));
  await importBatch(f);
  await importBatch(second);
  await ready(f);
  await ready(second);
  const firstIds = (await load(f)).records.map(({ id }) => id),
    secondIds = (await load(second)).records.map(({ id }) => id);
  const outcomes = await Promise.allSettled([
    group(f, "parallel-first", firstIds, "shared-run"),
    group(second, "parallel-second", secondIds, "shared-run"),
  ]);
  assert.equal(
    outcomes.filter(({ status }) => status === "fulfilled").length,
    1,
    "26 distinct additions cannot both succeed under run24",
  );
  const rejected = outcomes.find(({ status }) => status === "rejected");
  assert.match(String(rejected.reason), /busy|lock|conflict|24|budget/i);
  const ledger = await read(
    path.join(
      f.root,
      ".local/vocabulary-production/pipeline/runs/shared-run.json",
    ),
  );
  assert.equal(ledger.entries.length, 13);
  assert.equal(ledger.groups.length, 1);
  assert.equal(
    (await load(f)).groups.length + (await load(second)).groups.length,
    1,
  );
  const loser = outcomes[0].status === "rejected" ? f : second;
  const loserIds = outcomes[0].status === "rejected" ? firstIds : secondIds;
  await assert.rejects(
    () => group(loser, "retry-too-many", loserIds, "shared-run"),
    /24|budget/i,
  );
});

test("native completeness rejects empty definitions and glosses even with matching sense IDs", async (t) => {
  const f = await fixture(t);
  const valid = clone(f.part);
  for (const field of ["gloss", "definition"]) {
    f.part = clone(valid);
    f.part.locales["pt-BR"]["fixture-1"].senses["fixture-1:meaning-1"][field] =
      " ";
    await write(f.draft, f.part);
    await importBatch(f);
    assert.equal(
      stateOf(find(await load(f))),
      "needs-content",
      `blank native ${field} is not complete content`,
    );
    await assert.rejects(async () =>
      recordInspection({
        root: f.root,
        batchId: f.batchId,
        wordId: "fixture-1",
        receipt: receipt(find(await load(f)), "lexical"),
      }),
    );
  }
});

test("board renderer refuses outside, traversal and executable asset references", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  const queue = await load(f);
  const references = [
    "file:///Users/private/source.png",
    "https://outside.invalid/image.png",
    "assets/../../outside.png",
    'assets/x.png" onerror="alert(1)',
    "javascript:alert(1)",
  ];
  for (const reference of references) {
    const display = clone(queue);
    for (const key of ["source", "card", "thumbnail"])
      display.records[0].candidate[key].path = reference;
    const html = renderReviewBoard(display);
    assert.ok(!html.includes(`src="${reference}"`));
    assert.ok(!html.includes(`href="${reference}"`));
    assert.ok(html.includes("No private image available."));
  }
});

test("complete source/native fields and first-headword cloze are required before a lexical receipt", async (t) => {
  const f = await fixture(t),
    original = clone(f.part);
  const invalid = [
    [
      "Persian sense",
      (part) => {
        part.entries[0].senses[0].fa = " ";
      },
    ],
    [
      "English sense",
      (part) => {
        part.entries[0].senses[0].en = "";
      },
    ],
    [
      "Persian example",
      (part) => {
        part.entries[0].ex[1].fa = "";
      },
    ],
    [
      "first cloze",
      (part) => {
        part.entries[0].ex[0].en =
          "An unrelated object has a distinct purpose.";
        for (const locale of ["pt-BR", "es-419"])
          part.locales[locale]["fixture-1"].examples[0].en =
            part.entries[0].ex[0].en;
      },
    ],
    [
      "UK pronunciation",
      (part) => {
        part.entries[0].uk = "";
      },
    ],
    [
      "US pronunciation",
      (part) => {
        part.entries[0].us = "";
      },
    ],
    [
      "editorial CEFR",
      (part) => {
        part.entries[0].cefr = "";
      },
    ],
    [
      "honest AI assistance",
      (part) => {
        part.entries[0].provenance.aiAssisted = false;
      },
    ],
    [
      "preview status",
      (part) => {
        part.entries[0].senses[0].review = {
          status: "stable",
          humanReviewed: true,
        };
      },
    ],
  ];
  for (const [label, change] of invalid) {
    const part = clone(original);
    change(part);
    await write(f.draft, part);
    await importBatch(f);
    const record = find(await load(f));
    assert.equal(stateOf(record), "needs-content", label);
    await assert.rejects(
      () =>
        recordInspection({
          root: f.root,
          batchId: f.batchId,
          wordId: record.id,
          receipt: receipt(record, "lexical"),
        }),
      undefined,
      label,
    );
  }
});

test("complete imported pixel/text receipts still cannot bypass unresolved generation history", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  for (const role of ["author", "second", "lexical"]) {
    const record = find(await load(f));
    await recordInspection({
      root: f.root,
      batchId: f.batchId,
      wordId: record.id,
      receipt: receipt(record, role),
    });
  }
  const unresolved = find(await load(f));
  assert.equal(unresolved.generation.legacyUnreconciled, true);
  assert.notEqual(stateOf(unresolved), "ready");
  await assert.rejects(() => group(f, "unreconciled-history", [unresolved.id]));
  await reconcileAttempts({
    root: f.root,
    batchId: f.batchId,
    wordId: unresolved.id,
    used: 1,
    evidence:
      "All archived prompts, candidate and failed-request references inspected; one known attempt and no outstanding requests.",
  });
  assert.equal(stateOf(find(await load(f))), "ready");
});

test("repeat legacy import does not rewind a newer queue-owned candidate", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  await reconcileAttempts({
    root: f.root,
    batchId: f.batchId,
    wordId: "fixture-1",
    used: 1,
    evidence:
      "One prior legacy candidate reconciled before a genuine new queued request.",
  });
  await begin(f);
  const token = find(await load(f)).generation.pending.token;
  const newer = path.join(f.batch, "fixtures/newer-source.png");
  await fs.writeFile(newer, png(1254, 1254, 110));
  await intakeCandidate({
    root: f.root,
    batchId: f.batchId,
    wordId: "fixture-1",
    source: newer,
    card: f.card,
    thumbnail: f.thumbnail,
    token,
  });
  const before = find(await load(f));
  assert.notEqual(
    before.candidate.source.sha256,
    sha(await fs.readFile(f.source)),
  );
  await importBatch(f);
  const after = find(await load(f));
  assert.deepEqual(after.candidate, before.candidate);
  assert.equal(after.generation.attemptsUsed, 2);
  assert.equal(after.generation.legacyUnreconciled, false);
  assert.ok(after.history.some((event) => event.type === "candidate-intaken"));
});

test("a changed on-disk profile blocks generation, templates and preparation until refreshed", async (t) => {
  const f = await fixture(t, { count: 2 });
  await importBatch(f);
  await ready(f);
  f.profile.revision = 2;
  f.profile.medium = "A revised exact category brief";
  await write(f.profileFile, { profiles: [f.profile] });
  await assert.rejects(() =>
    beginGeneration({
      root: f.root,
      batchId: f.batchId,
      wordId: "fixture-2",
      prompt: "Would use an obsolete loaded profile",
      expectedCue: "Old profile",
    }),
  );
  await assert.rejects(() =>
    registerTemplate({
      root: f.root,
      batchId: f.batchId,
      wordId: "fixture-1",
      templateId: "stale-profile-template",
      usageNotes: "Would have obsolete style binding",
    }),
  );
  await assert.rejects(() => group(f, "stale-disk-profile", ["fixture-1"]));
  await importBatch(f);
  assert.notEqual(stateOf(find(await load(f))), "ready");
  await assert.rejects(() =>
    registerTemplate({
      root: f.root,
      batchId: f.batchId,
      wordId: "fixture-1",
      templateId: "without-fresh-inspection",
      usageNotes: "Current profile but stale inspection",
    }),
  );
  await assert.rejects(() =>
    group(f, "without-fresh-profile-review", ["fixture-1"]),
  );
  await ready(f);
  await registerTemplate({
    root: f.root,
    batchId: f.batchId,
    wordId: "fixture-1",
    templateId: "fresh-profile-template",
    usageNotes: "Current revised brief and new fixture inspection receipts.",
  });
  await group(f, "fresh-profile-group", ["fixture-1"]);
  await beginGeneration({
    root: f.root,
    batchId: f.batchId,
    wordId: "fixture-2",
    templateId: "fresh-profile-template",
    prompt: "Derivative with current profile and explicit ancestry",
    expectedCue: "New current-profile fixture cue",
  });
  assert.equal(stateOf(find(await load(f), "fixture-2")), "generating");
});

test("idempotent group preparation rechecks current profile and frozen asset evidence", async (t) => {
  const f = await fixture(t);
  await importBatch(f);
  await ready(f);
  const prepared = await group(f, "frozen-evidence", ["fixture-1"]);
  const originalProfile = clone(f.profile);
  await write(f.profileFile, {
    profiles: [
      { ...f.profile, revision: 2, medium: "Changed after subgroup freeze" },
    ],
  });
  await assert.rejects(() => group(f, "frozen-evidence", ["fixture-1"]));
  await write(f.profileFile, { profiles: [originalProfile] });
  const manifest = await read(prepared.manifestPath);
  const frozenCard = path.join(
    path.dirname(prepared.manifestPath),
    manifest.records[0].candidate.card.path,
  );
  await fs.writeFile(frozenCard, webpHeader(511, 512));
  await assert.rejects(() => group(f, "frozen-evidence", ["fixture-1"]));
});

test("an image-less legacy draft is not proof of zero attempts when failures may be archived", async (t) => {
  const f = await fixture(t, { legacyImages: false });
  await write(path.join(f.batch, "archived-failures.json"), {
    wordId: "fixture-1",
    failures: [
      "request-one failed",
      "request-two failed",
      "request-three failed",
    ],
    acceptedImage: null,
  });
  await importBatch(f);
  const record = find(await load(f));
  assert.equal(record.candidate, null);
  assert.equal(record.generation.legacyUnreconciled, true);
  assert.equal(stateOf(record), "needs-attempt-reconciliation");
  await assert.rejects(() =>
    beginGeneration({
      root: f.root,
      batchId: f.batchId,
      wordId: record.id,
      prompt: "Would silently restart old attempts",
      expectedCue: "No zero-attempt evidence",
    }),
  );
  await reconcileAttempts({
    root: f.root,
    batchId: f.batchId,
    wordId: record.id,
    used: 3,
    evidence:
      "Three concrete failed fixture requests verified in archived-failures.json; no accepted image does not mean no prior requests.",
  });
  await importBatch(f);
  assert.equal(find(await load(f)).generation.attemptsUsed, 3);
  await assert.rejects(() =>
    beginGeneration({
      root: f.root,
      batchId: f.batchId,
      wordId: record.id,
      prompt: "Fourth request",
      expectedCue: "Forbidden",
    }),
  );
});

test("legacy queue migration preserves counts and pending evidence while requiring missing reconciliation", async (t) => {
  const f = await fixture(t, { legacyImages: false });
  await importBatch(f);
  const queueFile = path.join(
    f.root,
    ".local/vocabulary-production/pipeline",
    f.batchId,
    "queue.json",
  );
  const old = await read(queueFile),
    record = find(old);
  delete record.legacyHistoryImported;
  record.generation = {
    attemptsUsed: 2,
    pending: {
      token: "legacy-pending-fixture",
      prompt: "Preserved original pending request",
      expectedCue: "Unresolved original",
      attempt: 2,
      startedAt: new Date().toISOString(),
    },
    legacyUnreconciled: false,
  };
  const before = clone(record.generation);
  await write(queueFile, old);
  await importBatch(f);
  const migrated = find(await load(f));
  assert.equal(migrated.generation.attemptsUsed, before.attemptsUsed);
  assert.deepEqual(migrated.generation.pending, before.pending);
  assert.equal(migrated.generation.legacyUnreconciled, true);
  await assert.rejects(() =>
    reconcileAttempts({
      root: f.root,
      batchId: f.batchId,
      wordId: record.id,
      used: 0,
      evidence: "Cannot reset known pending history",
    }),
  );
});
