// All entries, assets, findings and receipts below are SIMULATED fixtures.
// No test data represents an actual image inspection or publication approval.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  assertCorrectionBaseline,
  correctionOutputs,
} from "./lib/image-correction.mjs";

const copy = (x) => structuredClone(x);
const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const createdAt = "2026-01-02T03:04:05.000Z";
const selectedId = "fixture-lever";
const otherId = "fixture-bearing";
const oldPath = "atlas/img/fixture-lever-v1.webp";
const newPath = "atlas/img/fixture-lever-v2.webp";
const names = {
  entries: "content/entries.json",
  audit: "content/illustration-audit.json",
  media: "content/media-provenance.json",
  campaign: "content/expansion-campaign.json",
  ledger: "content/category-expansion.json",
  profiles: "content/visual-languages.json",
};
const mutableNames = [
  names.entries,
  names.audit,
  names.media,
  names.campaign,
  names.ledger,
];

function entry(id, image) {
  return {
    id,
    w: id === selectedId ? "fixture lever" : "fixture bearing",
    uk: "/ˈfɪkstʃə/",
    us: "/ˈfɪkstʃər/",
    cefr: "B2",
    topic: "fixture-mechanics",
    domainIds: ["engineering"],
    senses: [
      {
        id: `${id}-meaning-1`,
        pos: "noun",
        en: "SIMULATED selected definition",
        fa: "تعریف آزمایشی",
      },
    ],
    ex: [
      {
        en: "The fixture lever moves the simulated part.",
        fa: "نمونهٔ آزمایشی",
        senseId: `${id}-meaning-1`,
      },
      {
        en: "A second simulated example describes the part.",
        fa: "مثال دوم آزمایشی",
        senseId: `${id}-meaning-1`,
      },
    ],
    col: [
      "fixture part｜قطعهٔ آزمایشی",
      "fixture support｜تکیه‌گاه آزمایشی",
      "fixture motion｜حرکت آزمایشی",
    ],
    fam: [],
    syn: [],
    ant: [],
    tip: "A simulated usage note.",
    media: { img: image, audio: "fixture-audio.mp3" },
    provenance: { license: "CC-BY-4.0", humanReviewed: false, fixture: true },
  };
}
function overlay(id, locale) {
  return {
    senses: [
      {
        id: `${id}-meaning-1`,
        gloss: `${locale} simulated gloss`,
        definition: `${locale} simulated definition`,
      },
    ],
    examples: [
      {
        en: "The fixture lever moves the simulated part.",
        translation: `${locale} first fixture example`,
      },
      {
        en: "A second simulated example describes the part.",
        translation: `${locale} second fixture example`,
      },
    ],
    collocations: [
      { en: "fixture part", translation: `${locale} fixture part` },
    ],
    tip: `${locale} simulated usage note`,
  };
}
function fixture() {
  const oldSha = sha("SIMULATED old card bytes");
  const newSha = sha("SIMULATED corrected card bytes");
  const original = entry(selectedId, oldPath);
  const other = entry(otherId, "atlas/img/fixture-bearing-v1.webp");
  const state = {
    [names.entries]: {
      releaseId: "fixture-release-v1",
      createdAt: "2026-01-01T00:00:00.000Z",
      categories: [{ id: "engineering", entryIds: [selectedId, otherId] }],
      entries: [original, other],
    },
    [names.audit]: {
      schemaVersion: 1,
      entries: [
        {
          entryId: selectedId,
          asset: { path: oldPath, sha256: oldSha },
          visual: {
            decision: "replace",
            reason: "SIMULATED old negative assessment",
          },
          review: {
            humanReviewed: false,
            finding: "SIMULATED historical finding",
          },
        },
        {
          entryId: otherId,
          asset: {
            path: other.media.img,
            sha256: sha("SIMULATED other bytes"),
          },
          visual: {
            decision: "retain",
            reason: "SIMULATED untouched assessment",
          },
          review: { humanReviewed: false },
        },
      ],
    },
    [names.media]: {
      assets: [
        {
          entryId: selectedId,
          path: oldPath,
          sha256: oldSha,
          description: "SIMULATED prior provenance",
          license: "CC-BY-4.0",
        },
        {
          entryId: otherId,
          path: other.media.img,
          sha256: sha("SIMULATED other bytes"),
          description: "SIMULATED untouched provenance",
        },
      ],
    },
    [names.campaign]: {
      activeWorkBatchId: "fixture-correction-parent",
      targets: { engineering: 500, medicine: 500 },
      batches: [
        {
          id: "fixture-historical-batch",
          releaseId: "fixture-release-v1",
          newEnglishWords: 2,
          modules: [{ id: "fixture-unit", entryIds: [selectedId, otherId] }],
        },
      ],
    },
    [names.ledger]: {
      activePassId: "fixture-historical-batch",
      categories: [{ id: "engineering", count: 2, target: 500 }],
      passes: [
        {
          id: "fixture-historical-batch",
          words: 2,
          entryIds: [selectedId, otherId],
        },
      ],
      imageCorrections: [
        {
          id: "fixture-older-correction",
          newEnglishWords: 0,
          entryIds: [otherId],
        },
      ],
    },
    [names.profiles]: {
      profiles: [
        {
          id: "engineering",
          revision: 3,
          medium: "SIMULATED section study",
          palette: ["#101010", "#aaaaaa"],
        },
      ],
    },
    "content/locales/pt-BR.json": {
      entries: {
        [selectedId]: overlay(selectedId, "pt-BR"),
        [otherId]: overlay(otherId, "pt-BR"),
      },
    },
    "content/locales/es-419.json": {
      entries: {
        [selectedId]: overlay(selectedId, "es-419"),
        [otherId]: overlay(otherId, "es-419"),
      },
    },
    "content/courses/fixture.json": {
      lessons: [{ id: "fixture-course", wordIds: [selectedId, otherId] }],
    },
  };
  const corrected = copy(original);
  corrected.media.img = newPath;
  const receipt = (role, reviewerId) => ({
    role,
    reviewerId,
    accepted: true,
    humanReviewed: false,
    basis: role === "lexical" ? "actual-text" : "actual-pixels",
    finding: "SIMULATED receipt only; no actual pixels or text reviewed",
    inspectedAt: createdAt,
    sizes: [1254, 512, 120],
    binding: sha(`SIMULATED ${role} binding`),
  });
  const record = {
    id: selectedId,
    word: original.w,
    categoryId: "engineering",
    entry: corrected,
    locales: {
      "pt-BR": copy(state["content/locales/pt-BR.json"].entries[selectedId]),
      "es-419": copy(state["content/locales/es-419.json"].entries[selectedId]),
    },
    candidate: {
      source: { sha256: sha("SIMULATED source") },
      card: { sha256: newSha, bytes: 512 },
      thumbnail: { sha256: sha("SIMULATED thumbnail") },
      prompt: "SIMULATED corrected object prompt",
      expectedCue: "SIMULATED continuous supported part",
      templateId: "fixture-template",
    },
    inspections: {
      author: receipt("author", "fixture-author"),
      second: receipt("second", "fixture-second"),
      lexical: receipt("lexical", "fixture-lexical"),
    },
    history: [
      { type: "generation-begun", prompt: "SIMULATED first prompt" },
      { type: "generation-failed", reason: "SIMULATED earlier negative" },
      { type: "generation-begun", prompt: "SIMULATED corrected object prompt" },
    ],
  };
  return {
    state,
    records: [record],
    corrections: [
      {
        entryId: selectedId,
        oldImagePath: oldPath,
        oldImageSha256: oldSha,
        newImagePath: newPath,
        newImageSha256: newSha,
      },
    ],
    group: {
      kind: "existing-image-correction",
      newEnglishWords: 0,
      groupId: "fixture-correction-ready-1",
      batchId: "fixture-correction-parent",
      releaseId: "fixture-release-v2",
    },
    baseline: {
      releaseId: "fixture-release-v1",
      currentPointer: {
        manifest: "content/releases/fixture-v1/manifest.json",
        sha256: sha("SIMULATED manifest"),
      },
      words: 2,
      meanings: 2,
    },
    createdAt,
  };
}
const wordsAndSenses = (source) => ({
  words: source.entries.length,
  senses: source.entries.reduce((n, e) => n + e.senses.length, 0),
});

function unchangedAfterFailure(mutator, message) {
  const input = fixture();
  mutator(input);
  const before = copy(input);
  assert.throws(() => correctionOutputs(input), message);
  assert.deepEqual(
    input,
    before,
    "Rejected projection must not mutate its inputs",
  );
}

test("correction projects only the five allowed source files without mutating fixtures", () => {
  const input = fixture();
  const before = copy(input);
  const { outputs, images } = correctionOutputs(input);
  assert.deepEqual(Object.keys(outputs), mutableNames);
  assert.deepEqual(input, before);
  const expected = copy(before.state[names.entries]);
  expected.entries[0].media.img = newPath;
  expected.releaseId = input.group.releaseId;
  expected.createdAt = createdAt;
  assert.deepEqual(
    outputs[names.entries],
    expected,
    "Only selected media.img and release metadata may change",
  );
  assert.deepEqual(
    wordsAndSenses(outputs[names.entries]),
    wordsAndSenses(before.state[names.entries]),
  );
  assert.deepEqual(
    outputs[names.entries].entries[1],
    before.state[names.entries].entries[1],
  );
  for (const locale of ["pt-BR", "es-419"]) {
    const filename = `content/locales/${locale}.json`;
    assert.equal(
      Object.hasOwn(outputs, filename),
      false,
      "Native source must not be rewritten",
    );
    assert.deepEqual(input.state[filename], before.state[filename]);
  }
  assert.equal(Object.hasOwn(outputs, "content/courses/fixture.json"), false);
  assert.deepEqual(images, [
    {
      entryId: selectedId,
      oldPath,
      oldSha256: input.corrections[0].oldImageSha256,
      newPath,
      newSha256: input.corrections[0].newImageSha256,
    },
  ]);
});

test("old assessments and provenance remain in untouched input while unselected output evidence stays exact", () => {
  const input = fixture();
  const oldState = copy(input.state);
  const { outputs } = correctionOutputs(input);
  assert.deepEqual(
    input.state,
    oldState,
    "Historical baseline/state remains immutable",
  );
  const audit = outputs[names.audit];
  assert.equal(audit.entries.length, oldState[names.audit].entries.length);
  assert.deepEqual(audit.entries[1], oldState[names.audit].entries[1]);
  assert.deepEqual(audit.entries[0].asset, {
    path: newPath,
    sha256: input.corrections[0].newImageSha256,
  });
  assert.equal(audit.entries[0].visual.decision, "replaced");
  assert.equal(audit.entries[0].review.humanReviewed, false);
  assert.equal(
    audit.entries[0].review.secondaryInspection.humanReviewed,
    false,
  );
  assert.deepEqual(
    audit.entries[0].review.secondaryInspection.inspectedSizes,
    [1254, 512, 120],
  );
  const assets = outputs[names.media].assets;
  assert.deepEqual(assets.slice(0, -1), oldState[names.media].assets);
  assert.equal(assets.length, oldState[names.media].assets.length + 1);
  assert.equal(assets.at(-1).path, newPath);
  assert.equal(assets.at(-1).sha256, input.records[0].candidate.card.sha256);
  assert.equal(
    assets.at(-1).sourceImageSha256,
    input.records[0].candidate.source.sha256,
  );
  assert.equal(
    assets.at(-1).thumbnailSha256,
    input.records[0].candidate.thumbnail.sha256,
  );
  assert.equal(assets.at(-1).referenceTemplateId, "fixture-template");
  assert.equal(assets.at(-1).humanReviewed, false);
});

test("correction appends count-neutral ledgers and preserves every historical row and category target", () => {
  const input = fixture();
  const { outputs } = correctionOutputs(input);
  const campaign = outputs[names.campaign];
  const ledger = outputs[names.ledger];
  assert.deepEqual(
    campaign.batches.slice(0, -1),
    input.state[names.campaign].batches,
  );
  assert.deepEqual(campaign.targets, input.state[names.campaign].targets);
  assert.deepEqual(ledger.passes, input.state[names.ledger].passes);
  assert.deepEqual(ledger.categories, input.state[names.ledger].categories);
  assert.deepEqual(
    ledger.imageCorrections.slice(0, -1),
    input.state[names.ledger].imageCorrections,
  );
  const appended = campaign.batches.at(-1);
  assert.equal(appended.kind, "existing-image-correction");
  assert.equal(appended.newEnglishWords, 0);
  assert.deepEqual(appended.modules, []);
  assert.deepEqual(appended.imageRefreshEntryIds, [selectedId]);
  assert.equal(appended.baseline.words, 2);
  assert.equal(ledger.imageCorrections.at(-1).newEnglishWords, 0);
  assert.deepEqual(ledger.imageCorrections.at(-1).entryIds, [selectedId]);
  assert.equal(campaign.activeWorkBatchId, null);
  assert.equal(ledger.activePassId, input.group.groupId);
});

test("a two-existing-entry correction remains count neutral and retains unrelated metadata", () => {
  const input = fixture();
  const second = copy(input.records[0]);
  const old = input.state[names.entries].entries[1];
  second.id = otherId;
  second.word = old.w;
  second.entry = copy(old);
  second.entry.media.img = "atlas/img/fixture-bearing-v2.webp";
  second.candidate.card.sha256 = sha("SIMULATED second corrected bytes");
  for (const locale of ["pt-BR", "es-419"])
    second.locales[locale] = copy(
      input.state[`content/locales/${locale}.json`].entries[otherId],
    );
  input.records.push(second);
  input.corrections.push({
    entryId: otherId,
    oldImagePath: old.media.img,
    oldImageSha256: input.state[names.audit].entries[1].asset.sha256,
    newImagePath: second.entry.media.img,
    newImageSha256: second.candidate.card.sha256,
  });
  const { outputs, images } = correctionOutputs(input);
  assert.equal(images.length, 2);
  assert.deepEqual(wordsAndSenses(outputs[names.entries]), {
    words: 2,
    senses: 2,
  });
  assert.deepEqual(
    outputs[names.entries].categories,
    input.state[names.entries].categories,
  );
  assert.deepEqual(
    outputs[names.campaign].batches.at(-1).imageRefreshEntryIds,
    [selectedId, otherId],
  );
});

test("wrong existing identity and entirely new English identity cannot enter a correction", async (t) => {
  await t.test("different existing identity", () =>
    unchangedAfterFailure((f) => {
      f.records[0].id = otherId;
    }, /Wrong existing correction identity/),
  );
  await t.test("new identity", () =>
    unchangedAfterFailure((f) => {
      f.records[0].id = "fixture-new-word";
      f.records[0].entry.id = "fixture-new-word";
      f.corrections[0].entryId = "fixture-new-word";
    }, /Wrong existing correction identity/),
  );
});

test("selected definitions, examples, collocations, membership and provenance cannot be changed", async (t) => {
  const mutations = {
    definition: (e) => {
      e.senses[0].en += " changed";
    },
    example: (e) => {
      e.ex[1].fa += " changed";
    },
    collocation: (e) => {
      e.col[0] += " changed";
    },
    membership: (e) => {
      e.domainIds.push("medicine");
    },
    provenance: (e) => {
      e.provenance.humanReviewed = true;
    },
    audio: (e) => {
      e.media.audio = "changed-audio.mp3";
    },
  };
  for (const [name, mutate] of Object.entries(mutations))
    await t.test(name, () =>
      unchangedAfterFailure(
        (f) => mutate(f.records[0].entry),
        /Correction changes lexical/,
      ),
    );
});

test("both native overlays must remain exact, including usage and translated examples", async (t) => {
  await t.test("Portuguese usage", () =>
    unchangedAfterFailure((f) => {
      f.records[0].locales["pt-BR"].tip += " changed";
    }, /Correction changes native overlay/),
  );
  await t.test("Spanish example", () =>
    unchangedAfterFailure((f) => {
      f.records[0].locales["es-419"].examples[0].translation += " changed";
    }, /Correction changes native overlay/),
  );
});

test("old and new image paths and digests must bind the selected existing image", async (t) => {
  const cases = {
    "old path": [
      (f) => {
        f.corrections[0].oldImagePath = "atlas/img/wrong-v1.webp";
      },
      /Wrong existing correction identity/,
    ],
    "old hash": [
      (f) => {
        f.corrections[0].oldImageSha256 = sha("wrong old bytes");
      },
      /Old audit binding differs/,
    ],
    "new path": [
      (f) => {
        f.corrections[0].newImagePath = "atlas/img/wrong-v2.webp";
      },
      /Wrong existing correction identity/,
    ],
    "new hash": [
      (f) => {
        f.corrections[0].newImageSha256 = sha("wrong new bytes");
      },
      /Wrong existing correction identity/,
    ],
  };
  for (const [name, [mutate, pattern]] of Object.entries(cases))
    await t.test(name, () => unchangedAfterFailure(mutate, pattern));
});

test("distinct accepted author and second evidence is required", async (t) => {
  await t.test("same reviewer", () =>
    unchangedAfterFailure((f) => {
      f.records[0].inspections.second.reviewerId =
        f.records[0].inspections.author.reviewerId;
    }, /Incomplete distinct-AI correction evidence/),
  );
  for (const role of ["author", "second"])
    await t.test(`${role} negative`, () =>
      unchangedAfterFailure((f) => {
        f.records[0].inspections[role].accepted = false;
      }, /Incomplete distinct-AI correction evidence/),
    );
});

test("correction budget, duplicate identities and already-used release/provenance fail closed", async (t) => {
  const cases = {
    "wrong kind": [
      (f) => {
        f.group.kind = "new-words";
      },
      /kind\/budget invalid/,
    ],
    "new English words": [
      (f) => {
        f.group.newEnglishWords = 1;
      },
      /kind\/budget invalid/,
    ],
    "empty records": [
      (f) => {
        f.records = [];
        f.corrections = [];
      },
      /kind\/budget invalid/,
    ],
    "over two records": [
      (f) => {
        f.records = Array.from({ length: 3 }, () => copy(f.records[0]));
      },
      /kind\/budget invalid/,
    ],
    "duplicate identities": [
      (f) => {
        f.records.push(copy(f.records[0]));
        f.corrections.push(copy(f.corrections[0]));
      },
      /Correction identities differ/,
    ],
    "same historical group": [
      (f) => {
        f.group.groupId = f.state[names.campaign].batches[0].id;
      },
      /identity already exists/,
    ],
    "same historical release": [
      (f) => {
        f.group.releaseId = f.state[names.campaign].batches[0].releaseId;
      },
      /identity already exists/,
    ],
    "existing provenance path": [
      (f) => {
        f.state[names.media].assets.push({ path: newPath });
      },
      /provenance path already exists/,
    ],
  };
  for (const [name, [mutate, pattern]] of Object.entries(cases))
    await t.test(name, () => unchangedAfterFailure(mutate, pattern));
});

test("machine-private generation paths cannot leak into generated public source", () => {
  unchangedAfterFailure((f) => {
    f.records[0].candidate.prompt += " generated_images/private-fixture.png";
  }, /Private correction path leaked/);
});

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    timeout: 5000,
    maxBuffer: 1024 * 1024,
    env: {
      ...process.env,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_TERMINAL_PROMPT: "0",
    },
  }).trim();
}
function baselineFixture(t) {
  const container = fs.mkdtempSync(
    path.join(os.tmpdir(), "mehrdadika-correction-test-"),
  );
  t.after(() => fs.rmSync(container, { recursive: true, force: true }));
  const root = path.join(container, "project");
  const outside = path.join(container, "outside");
  fs.mkdirSync(root);
  fs.mkdirSync(outside);
  const protectedFiles = {
    "content/courses/fixture.json": "SIMULATED immutable course\n",
    "content/locales/pt-BR.json": "SIMULATED native source\n",
    "public/atlas/img/fixture-old.webp":
      "SIMULATED image bytes, not product artwork\n",
  };
  for (const [name, bytes] of Object.entries(protectedFiles)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), bytes);
  }
  git(root, ["init", "--quiet"]);
  git(root, ["add", "--", ...Object.keys(protectedFiles)]);
  git(root, [
    "-c",
    "user.name=Simulated Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "-c",
    "core.hooksPath=/dev/null",
    "commit",
    "--quiet",
    "-m",
    "simulated baseline",
  ]);
  return {
    root: fs.realpathSync(root),
    outside,
    baseline: {
      schemaVersion: 1,
      kind: "existing-image-correction",
      sourceRevision: git(root, ["rev-parse", "HEAD"]),
      files: Object.fromEntries(
        Object.entries(protectedFiles).map(([name, bytes]) => [
          name,
          sha(bytes),
        ]),
      ),
    },
  };
}

test("baseline guard accepts its own tiny Git fixture and performs no writes", (t) => {
  const f = baselineFixture(t);
  const before = git(f.root, ["status", "--porcelain"]);
  assert.doesNotThrow(() => assertCorrectionBaseline(f));
  assert.equal(git(f.root, ["status", "--porcelain"]), before);
});

for (const filename of [
  "content/courses/fixture.json",
  "content/locales/pt-BR.json",
  "public/atlas/img/fixture-old.webp",
]) {
  test(`baseline guard rejects altered protected ${filename}`, (t) => {
    const f = baselineFixture(t);
    fs.appendFileSync(path.join(f.root, filename), "changed\n");
    assert.throws(
      () => assertCorrectionBaseline(f),
      /Protected baseline file changed/,
    );
  });
}

test("baseline guard rejects a different Git HEAD even with unchanged protected bytes", (t) => {
  const f = baselineFixture(t);
  git(f.root, [
    "-c",
    "user.name=Simulated Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "-c",
    "core.hooksPath=/dev/null",
    "commit",
    "--allow-empty",
    "--quiet",
    "-m",
    "changed head",
  ]);
  assert.throws(
    () => assertCorrectionBaseline(f),
    /Correction source head changed/,
  );
});

test("baseline guard rejects wrong kind/schema before trusting file hashes", (t) => {
  const f = baselineFixture(t);
  assert.throws(
    () =>
      assertCorrectionBaseline({
        ...f,
        baseline: { ...f.baseline, kind: "new-word-batch" },
      }),
    /Wrong correction baseline kind/,
  );
  assert.throws(
    () =>
      assertCorrectionBaseline({
        ...f,
        baseline: { ...f.baseline, schemaVersion: 2 },
      }),
    /Wrong correction baseline kind/,
  );
});

test("baseline guard rejects symlink file, directory and dangling paths without reading outside", async (t) => {
  const f = baselineFixture(t);
  const bytes = "SIMULATED outside sentinel";
  fs.writeFileSync(path.join(f.outside, "sentinel.json"), bytes);
  fs.symlinkSync(
    path.join(f.outside, "sentinel.json"),
    path.join(f.root, "linked.json"),
  );
  fs.symlinkSync(f.outside, path.join(f.root, "linked-dir"), "dir");
  fs.symlinkSync(
    path.join(f.outside, "missing.json"),
    path.join(f.root, "dangling.json"),
  );
  for (const relative of [
    "linked.json",
    "linked-dir/sentinel.json",
    "dangling.json",
  ])
    await t.test(relative, () => {
      assert.throws(
        () =>
          assertCorrectionBaseline({
            ...f,
            baseline: { ...f.baseline, files: { [relative]: sha(bytes) } },
          }),
        /Symlink correction path/,
      );
    });
  assert.equal(
    fs.readFileSync(path.join(f.outside, "sentinel.json"), "utf8"),
    bytes,
  );
});

test("baseline guard rejects absolute, traversal, ambiguous and backslash paths", async (t) => {
  const f = baselineFixture(t);
  const unsafe = [
    path.join(f.outside, "sentinel"),
    "../outside/sentinel",
    "content/../sentinel",
    "content//sentinel",
    "./content/file",
    "content/./file",
    "content\\file",
    "",
    "content/fixture\0file",
  ];
  for (const relative of unsafe)
    await t.test(JSON.stringify(relative), () => {
      assert.throws(
        () =>
          assertCorrectionBaseline({
            ...f,
            baseline: { ...f.baseline, files: { [relative]: sha("sentinel") } },
          }),
        /Unsafe relative correction path/,
      );
    });
});

test("baseline guard rejects missing files and directories instead of accepting guessed digests", (t) => {
  const f = baselineFixture(t);
  assert.throws(
    () =>
      assertCorrectionBaseline({
        ...f,
        baseline: {
          ...f.baseline,
          files: { "content/missing.json": sha("missing") },
        },
      }),
    /ENOENT/,
  );
  assert.throws(
    () =>
      assertCorrectionBaseline({
        ...f,
        baseline: { ...f.baseline, files: { content: sha("directory") } },
      }),
    /Oversized correction input/,
  );
});

// These additional snapshot fixtures remain entirely synthetic and independent
// of the current corpus, correction version, and any genuine review evidence.
const { readCorrectionBaselineState } = await import("./lib/image-correction.mjs");
const requiredSnapshotNames = [
  ...mutableNames,
  "content/locales/pt-BR.json",
  "content/locales/es-419.json",
  names.profiles,
];

function snapshotBaselineFixture(t) {
  const container = fs.mkdtempSync(
    path.join(os.tmpdir(), "mehrdadika-correction-snapshots-"),
  );
  t.after(() => fs.rmSync(container, { recursive: true, force: true }));
  const root = fs.realpathSync(container);
  const dir = ".local/vocabulary-production/pipeline/fixture-image-refresh";
  const state = Object.fromEntries(
    requiredSnapshotNames.map((name) => [
      name,
      { fixture: "SIMULATED committed source", sourceName: name, revision: 1 },
    ]),
  );
  const originals = Object.fromEntries(
    Object.entries(state).map(([name, value]) => [
      name,
      JSON.stringify(value, null, 2) + "\n",
    ]),
  );
  for (const [name, bytes] of Object.entries(originals)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), bytes);
  }
  git(root, ["init", "--quiet"]);
  git(root, ["add", "--", ...requiredSnapshotNames]);
  git(root, [
    "-c", "user.name=Simulated Fixture",
    "-c", "user.email=fixture@example.invalid",
    "-c", "commit.gpgsign=false",
    "-c", "core.hooksPath=/dev/null",
    "commit", "--quiet", "-m", "immutable simulated snapshot originals",
  ]);
  const baseline = {
    schemaVersion: 1,
    kind: "existing-image-correction",
    sourceRevision: git(root, ["rev-parse", "HEAD"]),
    files: Object.fromEntries(
      Object.entries(originals).map(([name, bytes]) => [name, sha(bytes)]),
    ),
    snapshotFiles: Object.fromEntries(
      Object.entries(originals).map(([name, bytes]) => [
        name,
        { path: `${dir}/baseline-source/${name}`, sha256: sha(bytes) },
      ]),
    ),
  };
  for (const [name, ref] of Object.entries(baseline.snapshotFiles)) {
    fs.mkdirSync(path.dirname(path.join(root, ref.path)), { recursive: true });
    fs.writeFileSync(path.join(root, ref.path), originals[name]);
  }
  return { root, dir, baseline, state, originals };
}
const loadSnapshotFixture = (f) =>
  readCorrectionBaselineState(f.root, f.baseline, f.dir);
const snapshotRejection = /snapshot|baseline|Git|blob/i;

function substituteSnapshot(f, name = names.entries) {
  const bytes = JSON.stringify({
    fixture: "SIMULATED substituted snapshot, never committed",
    sourceName: name,
    revision: 999,
  }) + "\n";
  fs.writeFileSync(
    path.join(f.root, f.baseline.snapshotFiles[name].path),
    bytes,
  );
  return sha(bytes);
}

test("snapshot reader loads exactly eight committed JSON sources without changing baseline or files", (t) => {
  const f = snapshotBaselineFixture(t);
  const before = copy(f.baseline);
  assert.equal(typeof readCorrectionBaselineState, "function");
  assert.deepEqual(loadSnapshotFixture(f), f.state);
  assert.deepEqual(f.baseline, before);
  assert.equal(Object.keys(f.baseline.snapshotFiles).length, 8);
  for (const [name, ref] of Object.entries(f.baseline.snapshotFiles)) {
    assert.equal(ref.path, `${f.dir}/baseline-source/${name}`);
    assert.equal(ref.sha256, f.baseline.files[name]);
    assert.equal(sha(fs.readFileSync(path.join(f.root, ref.path))), ref.sha256);
    assert.equal(sha(fs.readFileSync(path.join(f.root, name))), ref.sha256);
  }
});

test("snapshot reader rejects missing, extra and wrong exact-eight source key sets", async (t) => {
  const mutations = {
    "missing required key": (f) => {
      delete f.baseline.snapshotFiles[names.entries];
    },
    "extra source key": (f) => {
      f.baseline.snapshotFiles["content/unexpected.json"] =
        copy(f.baseline.snapshotFiles[names.entries]);
    },
    "wrong key while retaining eight references": (f) => {
      const ref = f.baseline.snapshotFiles[names.entries];
      delete f.baseline.snapshotFiles[names.entries];
      f.baseline.snapshotFiles["content/replacement.json"] = ref;
    },
    "absent snapshot map": (f) => {
      delete f.baseline.snapshotFiles;
    },
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    await t.test(name, (child) => {
      const f = snapshotBaselineFixture(child);
      mutate(f);
      assert.throws(() => loadSnapshotFixture(f), snapshotRejection);
    });
  }
});

test("snapshot reader rejects a redirected reference even when bytes and digest are identical", (t) => {
  const f = snapshotBaselineFixture(t);
  const ref = f.baseline.snapshotFiles[names.entries];
  const redirected = `${f.dir}/redirected-snapshots/content/entries.json`;
  fs.mkdirSync(path.dirname(path.join(f.root, redirected)), { recursive: true });
  fs.writeFileSync(path.join(f.root, redirected), f.originals[names.entries]);
  ref.path = redirected;
  assert.throws(() => loadSnapshotFixture(f), snapshotRejection);
});

test("snapshot reader rejects snapshot-only substitution and ref-digest substitution against baseline.files", async (t) => {
  await t.test("snapshot bytes changed with original reference digest", (child) => {
    const f = snapshotBaselineFixture(child);
    substituteSnapshot(f);
    assert.throws(() => loadSnapshotFixture(f), snapshotRejection);
  });
  await t.test("snapshot and reference forged but committed baseline digest retained", (child) => {
    const f = snapshotBaselineFixture(child);
    f.baseline.snapshotFiles[names.entries].sha256 = substituteSnapshot(f);
    assert.notEqual(
      f.baseline.snapshotFiles[names.entries].sha256,
      f.baseline.files[names.entries],
    );
    assert.throws(() => loadSnapshotFixture(f), snapshotRejection);
  });
  await t.test("required source digest missing from baseline.files", (child) => {
    const f = snapshotBaselineFixture(child);
    delete f.baseline.files[names.entries];
    assert.throws(() => loadSnapshotFixture(f), snapshotRejection);
  });
});

test("snapshot reader rejects jointly forged reference and baseline.files digest using immutable Git original", (t) => {
  const f = snapshotBaselineFixture(t);
  const name = names.entries;
  const committedDigest = f.baseline.files[name];
  const forgedDigest = substituteSnapshot(f, name);
  f.baseline.snapshotFiles[name].sha256 = forgedDigest;
  f.baseline.files[name] = forgedDigest;
  // Ordinary self-consistency would pass: both mutable hashes match the forgery.
  assert.equal(
    sha(fs.readFileSync(path.join(f.root, f.baseline.snapshotFiles[name].path))),
    f.baseline.files[name],
  );
  assert.notEqual(forgedDigest, committedDigest);
  const committedBytes = execFileSync(
    "git", ["show", `${f.baseline.sourceRevision}:${name}`],
    { cwd: f.root, timeout: 5000, maxBuffer: 1024 * 1024 },
  );
  assert.equal(sha(committedBytes), committedDigest);
  assert.throws(() => loadSnapshotFixture(f), snapshotRejection);
  assert.equal(sha(fs.readFileSync(path.join(f.root, name))), committedDigest);
});

const { assertCorrectionIndexEmpty } = await import("./lib/image-correction.mjs");

test("index guard rejects a staged unrelated change hidden by restoring working bytes to HEAD", (t) => {
  const f = baselineFixture(t);
  const filename = "content/courses/fixture.json";
  const fullPath = path.join(f.root, filename);
  const committedBytes = fs.readFileSync(fullPath);
  fs.appendFileSync(fullPath, "SIMULATED unrelated staged course change\n");
  git(f.root, ["add", "--", filename]);
  fs.writeFileSync(fullPath, committedBytes);
  assert.equal(git(f.root, ["diff", "HEAD", "--", filename]), "");
  assert.equal(git(f.root, ["diff", "--cached", "--name-only"]), filename);
  assert.throws(
    () => assertCorrectionIndexEmpty(f.root),
    /requires an empty index/,
  );
  // Restore only this test-owned path in this disposable Git fixture's index.
  git(f.root, ["reset", "--quiet", "HEAD", "--", filename]);
  assert.equal(git(f.root, ["status", "--porcelain"]), "");
  assert.doesNotThrow(() => assertCorrectionIndexEmpty(f.root));
});
