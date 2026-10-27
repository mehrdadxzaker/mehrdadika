import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  prepareContent,
  reviewContentHash,
  readingReviewHash,
} from "./build-content.mjs";
const taxonomy = {
  domains: Array.from({ length: 32 }, (_, i) => ({
    id: `d${i}`,
    labelFa: `حوزه ${i}`,
    labelEn: `Domain ${i}`,
    subcategories: [],
    discoveryGroupId: "g",
  })),
  discoveryGroups: [
    { id: "g", domainIds: Array.from({ length: 32 }, (_, i) => `d${i}`) },
  ],
};
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mehrdadika-release-"));
  fs.mkdirSync(path.join(root, "public/media"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "public/media/test.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg"/>',
  );
  const source = {
    corpusId: "mehrdadika-en-fa",
    releaseId: "test-1",
    channel: "preview",
    entries: [
      {
        id: "pressure",
        w: "pressure",
        uk: "",
        us: "",
        cefr: "B1",
        topic: "d0",
        senses: [
          {
            id: "pressure:mechanical",
            pos: "n.",
            fa: "فشار",
            en: "Force on a surface.",
            domainIds: ["d0"],
            review: { status: "preview" },
          },
          {
            id: "pressure:social",
            pos: "n.",
            fa: "فشار روانی",
            en: "A strong demand.",
            domainIds: ["d1"],
            review: { status: "draft" },
          },
        ],
        ex: [{ en: "Measure pressure.", fa: "فشار را اندازه بگیرید." }],
        media: { img: "media/test.svg" },
        provenance: { license: "CC-BY-4.0" },
      },
    ],
  };
  return { root, source };
}
test("immutable release is deterministic and draft meanings are excluded", () => {
  const { root, source } = fixture();
  try {
    const a = prepareContent(source, taxonomy, { root });
    const b = prepareContent(source, taxonomy, { root });
    assert.equal(a.manifestText, b.manifestText);
    assert.equal(a.manifest.counts.meanings, 1);
    assert.equal(
      JSON.parse(a.payloadText).entries[0].senses[0].id,
      "pressure:mechanical",
    );
    assert.match(
      JSON.parse(a.payloadText).entries[0].media.img,
      /^content\/media\/[a-f0-9]{64}\.svg$/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test("stable channel rejects absent human approval evidence", () => {
  const { root, source } = fixture();
  try {
    assert.throws(
      () => prepareContent(source, taxonomy, { root, channel: "stable" }),
      /human approval/,
    );
    source.entries[0].senses[0].review = {
      status: "approved",
      human: true,
      reviewer: "Human reviewer fixture",
    };
    source.entries[0].senses[0].review.contentHash = reviewContentHash(
      source.entries[0],
      { root },
    );
    assert.equal(
      prepareContent(source, taxonomy, { root, channel: "stable" }).manifest
        .release.channel,
      "stable",
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test("duplicate meaning IDs and invalid asset paths fail closed", () => {
  const { root, source } = fixture();
  try {
    source.entries[0].senses[1].id = source.entries[0].senses[0].id;
    assert.throws(
      () => prepareContent(source, taxonomy, { root }),
      /duplicate sense/,
    );
    source.entries[0].senses.pop();
    source.entries[0].media.img = "../secret.svg";
    assert.throws(
      () => prepareContent(source, taxonomy, { root }),
      /Unsafe asset/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("stable medical and engineering meanings require an additional qualified domain review", () => {
  const { root, source } = fixture();
  try {
    const specialistTaxonomy = structuredClone(taxonomy);
    specialistTaxonomy.domains[0].id = "medicine-healthcare";
    specialistTaxonomy.domains[1].id = "engineering";
    specialistTaxonomy.discoveryGroups[0].domainIds[0] = "medicine-healthcare";
    specialistTaxonomy.discoveryGroups[0].domainIds[1] = "engineering";
    const item = source.entries[0];
    item.topic = "medicine-healthcare";
    item.senses[0].domainIds = ["medicine-healthcare"];
    item.senses[1].domainIds = ["engineering"];
    item.senses[0].review = {
      status: "approved",
      human: true,
      reviewer: "Language reviewer test fixture",
    };
    assert.throws(
      () =>
        prepareContent(source, specialistTaxonomy, { root, channel: "stable" }),
      /qualified domain review/,
    );
    item.senses[0].review.domainReviewer =
      "Qualified domain reviewer test fixture";
    item.senses[0].review.domainQualified = true;
    item.senses[0].review.contentHash = reviewContentHash(item, { root });
    assert.equal(
      prepareContent(source, specialistTaxonomy, { root, channel: "stable" })
        .manifest.counts.meanings,
      1,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("author-only draft fields are never copied to the public card payload", () => {
  const { root, source } = fixture();
  try {
    source.entries[0].privateDrafts = [{ secretDraft: "unreleased" }];
    source.entries[0].provenance.internalNotes = "unreleased";
    source.entries[0].senses[0].unreleasedTranslation = "unreleased";
    const release = prepareContent(source, taxonomy, { root });
    const serialized =
      [...release.shardData.values()].join(" ") + release.payloadText;
    assert.doesNotMatch(
      serialized,
      /secretDraft|internalNotes|unreleasedTranslation/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("stable approvals are bound to exact text and media, excluding review metadata", () => {
  const { root, source } = fixture();
  try {
    const item = source.entries[0];
    item.senses[0].review = {
      status: "approved",
      humanReviewed: true,
      reviewer: "Named reviewer fixture",
    };
    item.senses[0].review.contentHash = reviewContentHash(item, { root });
    assert.equal(
      prepareContent(source, taxonomy, { root, channel: "stable" }).manifest
        .release.channel,
      "stable",
    );
    const approved = item.senses[0].review.contentHash;
    item.senses[0].review.reviewer = "Renamed reviewer fixture";
    assert.equal(reviewContentHash(item, { root }), approved);
    item.senses[0].en = "A changed definition.";
    assert.throws(
      () => prepareContent(source, taxonomy, { root, channel: "stable" }),
      /review digest.*stale/,
    );
    item.senses[0].en = "Force on a surface.";
    fs.writeFileSync(
      path.join(root, "public/media/test.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg"><path/></svg>',
    );
    assert.throws(
      () => prepareContent(source, taxonomy, { root, channel: "stable" }),
      /review digest.*stale/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test("examples belonging only to draft meanings are excluded", () => {
  const { root, source } = fixture();
  try {
    source.entries[0].ex.push({
      en: "Draft meaning example.",
      fa: "نمونهٔ پیش‌نویس",
      senseId: "pressure:social",
    });
    const release = prepareContent(source, taxonomy, { root });
    assert.doesNotMatch(
      [...release.shardData.values()].join(" "),
      /Draft meaning example/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test("reading digests change with text edits but not approval metadata", () => {
  const item = {
    id: "passage:test",
    paragraphs: [
      { id: "p", sentences: [{ id: "s", en: "A book.", fa: "یک کتاب." }] },
    ],
    publication: "preview",
    review: { status: "preview" },
  };
  const digest = readingReviewHash(item);
  item.publication = "published";
  item.review = {
    status: "approved",
    humanReviewed: true,
    reviewer: "Human fixture",
  };
  assert.equal(readingReviewHash(item), digest);
  item.paragraphs[0].sentences[0].fa = "کتابی دیگر.";
  assert.notEqual(readingReviewHash(item), digest);
});
