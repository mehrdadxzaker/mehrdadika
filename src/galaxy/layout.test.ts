import assert from "node:assert/strict";
import { test } from "node:test";
import type { Atlas, WordRef } from "../atlas/types";
import { layoutGalaxy, topicColor, type GalaxyLayout } from "./layout";

type Item = { id: string; domain: string; level?: number };
function fixture(domains: string[], items: Item[]): Atlas {
  const words: WordRef[] = items.map((item, order) => ({
    id: item.id,
    word: item.id,
    fa: item.id,
    ipa: "",
    media: 0,
    cefr: item.level ?? 2,
    topic: domains.indexOf(item.domain),
    order,
    lexicalId: item.id,
    domainIds: [item.domain],
  }));
  return { topics: domains.map((id) => [id, `برچسب ${id}`]), words } as Atlas;
}
function bytes(
  layout: GalaxyLayout,
  id: string,
  field: "positions" | "colors" | "seeds",
) {
  const channels = field === "seeds" ? 1 : 3;
  const values = layout[field];
  const index = layout.index.get(id);
  assert.notEqual(index, undefined);
  return new Uint8Array(
    values.buffer,
    values.byteOffset + index! * channels * 4,
    channels * 4,
  ).slice();
}
function assertStable(before: GalaxyLayout, after: GalaxyLayout) {
  for (const id of before.ids)
    for (const field of ["positions", "colors", "seeds"] as const)
      assert.deepEqual(
        bytes(before, id, field),
        bytes(after, id, field),
        `${id}: ${field} changed`,
      );
}
const original: Item[] = [
  { id: "pressure", domain: "medicine-healthcare", level: 2 },
  { id: "bake", domain: "cooking-food-drink", level: 1 },
  { id: "engine", domain: "engineering", level: 3 },
];
const domains = ["medicine-healthcare", "cooking-food-drink", "engineering"];

test("publishing more words and new domains preserves every existing star byte for byte", () => {
  const before = layoutGalaxy(fixture(domains, original));
  const added = Array.from({ length: 60 }, (_, i) => ({
    id: `new-${i}`,
    domain: i % 2 ? "cooking-food-drink" : "gaming-digital-culture",
    level: i % 6,
  }));
  const after = layoutGalaxy(
    fixture(
      ["gaming-digital-culture", ...domains, "law-public-affairs"],
      [...added, ...original],
    ),
  );
  assertStable(before, after);
  assert.equal(after.n, 63);
});

test("category and word reordering preserves coordinates, colours and aligned topic centres", () => {
  const first = fixture(domains, original);
  const reordered = fixture([...domains].reverse(), [...original].reverse());
  const before = layoutGalaxy(first),
    after = layoutGalaxy(reordered);
  assertStable(before, after);
  for (const [id] of first.topics)
    assert.deepEqual(
      before.topicCenters[first.topics.findIndex(([key]) => key === id)],
      after.topicCenters[reordered.topics.findIndex(([key]) => key === id)],
    );
  assert.equal(topicColor(domains[0]), topicColor([...domains].reverse()[2]));
});

test("valid catalogues have one indexed star per lexical ID and only finite geometry", () => {
  const layout = layoutGalaxy(
    fixture(domains, [
      ...original,
      { id: "unknown-level", domain: "missing-domain", level: Number.NaN },
      {
        id: "extreme-level",
        domain: "engineering",
        level: Number.POSITIVE_INFINITY,
      },
    ]),
  );
  assert.equal(new Set(layout.ids).size, layout.n);
  assert.equal(layout.index.size, layout.n);
  layout.ids.forEach((id, index) => assert.equal(layout.index.get(id), index));
  for (const values of [
    layout.positions,
    layout.colors,
    layout.seeds,
    ...layout.topicCenters,
  ])
    assert.ok([...values].every(Number.isFinite));
});

test("duplicate or empty lexical identities are rejected instead of creating duplicate stars", () => {
  assert.throws(
    () => layoutGalaxy(fixture(domains, [original[0], original[0]])),
    /تکراری/,
  );
  assert.throws(
    () => layoutGalaxy(fixture(domains, [{ id: "", domain: domains[0] }])),
    /خالی/,
  );
});

test("empty catalogues remain a valid finite layout", () => {
  const layout = layoutGalaxy(fixture([], []));
  assert.equal(layout.n, 0);
  assert.deepEqual([...layout.positions], []);
  assert.deepEqual(layout.topicCenters, []);
});
