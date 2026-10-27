import assert from "node:assert/strict";
import { test } from "node:test";
import { answer, advance, buildSession } from "./session";
import {
  defaultSettings,
  emptyProgress,
  sanitizeProgress,
  store,
} from "./store";
import { Rating } from "./srs";
import type { Atlas } from "../atlas/types";
import { mergeProgress } from "../lib/persistence";
const atlas = {
  id: "test",
  words: [
    {
      id: "sense-a",
      word: "alpha",
      fa: "آلفا",
      ipa: "",
      cefr: 0,
      topic: 0,
      media: 0,
      order: 0,
    },
  ],
  byId: new Map(),
  topics: [],
  cefr: ["A1"],
  count: 1,
  examples: 0,
  illustrated: 0,
  name: "Test",
  kind: "open",
  entry: async () => {
    throw Error("unused");
  },
  peek: () => undefined,
  img: () => null,
  audio: () => null,
} as Atlas;
atlas.byId = new Map(atlas.words.map((word) => [word.id, word]));
test("a repeated answer cannot grade a pending question twice or duplicate retries", async () => {
  await store.useDataset("test");
  const p = emptyProgress("test");
  const session = buildSession(atlas, p, defaultSettings);
  session.steps = [{ id: "sense-a", kind: "meaning", options: ["sense-a"] }];
  store.progress(() => ({ ...p, session }));
  const step = session.steps[0] as {
    id: string;
    kind: "meaning";
    options: string[];
  };
  answer(atlas, step, false, Rating.Again, "wrong");
  const once = store.get().progress;
  answer(atlas, step, false, Rating.Again, "wrong");
  assert.equal(store.get().progress.days[Object.keys(once.days)[0]].r, 1);
  assert.equal(store.get().progress.cards["sense-a"].reps, 1);
  assert.equal(store.get().progress.session!.steps.length, 2);
  advance(1);
  const after = store.get().progress.session!.index;
  advance(1);
  assert.equal(store.get().progress.session!.index, after);
  await store.settled();
});
test("transaction deltas preserve unrelated cards, bookmarks and daily increments", () => {
  const base = emptyProgress("test");
  const a = {
    ...base,
    bookmarks: ["a"],
    days: { "2026-10-26": { n: 1, r: 1, c: 1, t: 2 } },
  };
  const b = {
    ...base,
    bookmarks: ["b"],
    days: { "2026-10-26": { n: 1, r: 1, c: 0, t: 3 } },
  };
  const merged = mergeProgress(a, base, b);
  assert.deepEqual(new Set(merged.bookmarks), new Set(["a", "b"]));
  assert.deepEqual(merged.days["2026-10-26"], { n: 2, r: 2, c: 1, t: 5 });
});
test("malformed backup session and unsafe keys cannot enter runtime state", () => {
  const value = JSON.parse(
    '{"version":2,"cards":{"__proto__":{"due":0}},"session":{"id":"x","steps":[{"id":"a","kind":"execute"}],"index":0,"graded":{}}}',
  );
  const clean = sanitizeProgress(value, "test");
  assert.equal(clean.session, null);
  assert.equal(Object.keys(clean.cards).length, 0);
  assert.equal(({} as Record<string, unknown>).due, undefined);
});
