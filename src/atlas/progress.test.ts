import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { createAtlas } from "./data";
import { aggregateWordProgress } from "./progress";
import { emptyProgress, defaultSettings } from "../store/store";
import { todayPlan, buildSession } from "../store/session";
import { isMastered } from "../store/srs";
const manifest = {
  schemaVersion: 1,
  corpusId: "mehrdadika-en-fa",
  name: "Test",
  release: {
    id: "test",
    channel: "preview" as const,
    schemaVersion: 1,
    createdAt: "2026-10-26T00:00:00Z",
  },
  payload: { path: "content/test.json", sha256: "" },
  taxonomy: {
    domains: [
      {
        id: "medicine-healthcare",
        labelEn: "Medicine",
        labelFa: "پزشکی",
        subcategories: [],
        discoveryGroupId: "g",
      },
      {
        id: "engineering",
        labelEn: "Engineering",
        labelFa: "مهندسی",
        subcategories: [],
        discoveryGroupId: "g",
      },
    ],
    discoveryGroups: [
      {
        id: "g",
        labelEn: "Group",
        labelFa: "گروه",
        domainIds: ["medicine-healthcare", "engineering"],
      },
    ],
  },
  assets: [],
};
const atlas = createAtlas(
  {
    entries: [
      {
        id: "pressure",
        w: "pressure",
        uk: "",
        us: "",
        cefr: "B1",
        topic: "medicine-healthcare",
        senses: [
          {
            id: "pressure:medical",
            pos: "n.",
            fa: "فشار خون",
            en: "Pressure in blood vessels.",
            domainIds: ["medicine-healthcare"],
          },
          {
            id: "pressure:engineering",
            pos: "n.",
            fa: "فشار مکانیکی",
            en: "Force on a surface.",
            domainIds: ["engineering"],
          },
        ],
        ex: [{ en: "Measure pressure.", fa: "فشار را اندازه بگیرید." }],
        col: [],
        fam: [],
        syn: [],
        ant: [],
        tip: "",
        m: 0,
      },
    ],
  },
  manifest,
);
const familiar = {
  due: 0,
  s: 40,
  d: 5,
  el: 0,
  sd: 1,
  ls: 0,
  reps: 4,
  lapses: 0,
  st: 2 as const,
  seen: 1,
};
test("one lexical card and star retain independent meanings and searchable Persian glosses", () => {
  assert.equal(atlas.words.length, 1);
  assert.equal(atlas.learning?.words.length, 2);
  assert.match(atlas.words[0].fa, /خون/);
  assert.match(atlas.words[0].fa, /مکانیکی/);
  const p = emptyProgress(atlas.id);
  p.cards["pressure:medical"] = familiar;
  assert.equal(
    isMastered(aggregateWordProgress(atlas, p).cards.pressure),
    false,
  );
  assert.equal(
    isMastered(
      aggregateWordProgress(atlas, p, "medicine-healthcare").cards.pressure,
    ),
    true,
  );
  assert.equal(p.cards["pressure:engineering"], undefined);
  p.cards["pressure:engineering"] = familiar;
  assert.equal(
    isMastered(aggregateWordProgress(atlas, p).cards.pressure),
    true,
  );
});
test("category limits new meanings while due reviews remain available globally", () => {
  const p = emptyProgress(atlas.id);
  p.cards["pressure:medical"] = familiar;
  const settings = { ...defaultSettings, topic: "engineering", dailyNew: 10 };
  const plan = todayPlan(atlas, p, settings);
  assert.deepEqual(plan.fresh, ["pressure:engineering"]);
  assert.deepEqual(plan.due, ["pressure:medical"]);
  const session = buildSession(atlas, p, settings);
  assert.ok(session.steps.every((step) => step.kind !== "listen"));
  assert.deepEqual(session.newIds, ["pressure:engineering"]);
});

test("full cards load lazily from one shared hash-verified shard", async () => {
  const full = atlas.peek("pressure")!;
  const body = JSON.stringify([full]);
  const sha256 = createHash("sha256").update(body).digest("hex");
  const lazy = createAtlas(
    {
      entries: [{ ...full, ex: [], tip: "" }],
      shards: { pressure: { path: "content/entries/test.json", sha256 } },
    },
    manifest,
  );
  assert.equal(lazy.peek("pressure"), undefined);
  let calls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    calls++;
    return new Response(body, { status: 200 });
  };
  try {
    const [word, sense] = await Promise.all([
      lazy.entry("pressure"),
      lazy.entry("pressure:engineering"),
    ]);
    assert.equal(calls, 1);
    assert.equal(word.ex.length, 1);
    assert.equal(sense.senses[0].id, "pressure:engineering");
    assert.ok(lazy.peek("pressure"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test("a corrupt shard is rejected and a later deliberate retry can recover", async () => {
  const full = atlas.peek("pressure")!;
  const body = JSON.stringify([full]);
  const sha256 = createHash("sha256").update(body).digest("hex");
  const lazy = createAtlas(
    {
      entries: [full],
      shards: { pressure: { path: "content/entries/test.json", sha256 } },
    },
    manifest,
  );
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () =>
    new Response(++calls === 1 ? "corrupt" : body, { status: 200 });
  try {
    await assert.rejects(lazy.entry("pressure"), /یکپارچگی/);
    assert.equal(lazy.peek("pressure"), undefined);
    assert.equal((await lazy.entry("pressure")).w, "pressure");
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
