import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createAtlas } from "../atlas/data";
import type { ActiveSession } from "../store/store";
import type { PortugueseTranslation } from "../locales/types";
import {
  localizeAtlas,
  resolveLocalizedSessionAtlas,
  type VocabularyCatalog,
} from "./atlas";

const entry = {
  id: "pressure",
  w: "pressure",
  uk: "/ˈpreʃə/",
  us: "/ˈpreʃər/",
  cefr: "B1",
  topic: "medicine-healthcare",
  domainIds: ["medicine-healthcare", "engineering"],
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
  col: ["blood pressure｜فشار خون"],
  fam: [],
  syn: [],
  ant: [],
  tip: "نکته",
  note: "یادداشت",
  m: 1,
  media: { img: "content/media/p.svg", uk: "content/media/p.mp3" },
};
const payload = {
  entries: [
    entry,
    {
      ...entry,
      id: "untranslated",
      w: "untranslated",
      senses: [{ ...entry.senses[0], id: "untranslated:main" }],
    },
    {
      ...entry,
      id: "valve",
      w: "valve",
      senses: [{ ...entry.senses[0], id: "valve:main" }],
    },
  ],
};
const manifest = {
  schemaVersion: 1,
  corpusId: "english-corpus",
  name: "Atlas",
  release: {
    id: "old-release",
    channel: "preview" as const,
    schemaVersion: 1,
    createdAt: "2026-10-26T00:00:00Z",
  },
  payload: { path: "content/old-payload.json", sha256: "" },
  assets: [],
  taxonomy: {
    domains: [
      {
        id: "medicine-healthcare",
        labelEn: "Medicine",
        labelFa: "پزشکی",
        subcategories: ["Blood", "Clinical care"],
        subcategoryLabelsFa: ["خون", "درمان"],
        discoveryGroupId: "science",
      },
      {
        id: "engineering",
        labelEn: "Engineering",
        labelFa: "مهندسی",
        subcategories: [],
        discoveryGroupId: "science",
      },
    ],
    discoveryGroups: [
      {
        id: "science",
        labelEn: "Science",
        labelFa: "علم",
        domainIds: ["medicine-healthcare", "engineering"],
      },
    ],
  },
};
const overlay = (locale: "pt-BR" | "es-419"): VocabularyCatalog => ({
  schemaVersion: 1,
  locale,
  status: "preview",
  review: { humanReviewed: false },
  categories: {
    "medicine-healthcare": {
      label: locale === "pt-BR" ? "Medicina" : "Medicina",
      subcategoryLabels:
        locale === "pt-BR"
          ? ["Sangue", "Cuidados clínicos"]
          : ["Sangre", "Atención clínica"],
    },
    engineering: { label: "Engenharia" },
  },
  groupLabels: { science: "Ciência" },
  entries: Object.fromEntries(
    ["pressure", "valve"].map((id): [string, PortugueseTranslation] => [
      id,
      {
        sourceWord: id,
        senses:
          id === "pressure"
            ? {
                "pressure:medical": {
                  gloss: "pressão arterial",
                  definition: "Pressão nos vasos sanguíneos.",
                },
                "pressure:engineering": {
                  gloss: "pressão mecânica",
                  definition: "Força em uma superfície.",
                },
              }
            : {
                "valve:main": {
                  gloss: "válvula",
                  definition: "Dispositivo de controle.",
                },
              },
        examples: [{ en: "Measure pressure.", translation: "Meça a pressão." }],
        collocations: [
          { en: "blood pressure", translation: "pressão arterial" },
        ],
        tip: "Compare os dois sentidos.",
      },
    ]),
  ),
});

test("native atlases retain English sense identity, independent scheduling and lazy media while translating every display field", async () => {
  const base = createAtlas(payload, manifest);
  assert.equal(localizeAtlas(base, "fa"), base);
  for (const locale of ["pt-BR", "es-419"] as const) {
    const localized = localizeAtlas(base, locale, overlay(locale));
    assert.equal(localized.id, `english-corpus:${locale}`);
    assert.equal(localized.learning?.id, localized.id);
    assert.deepEqual(
      localized.words.map((w) => [w.id, w.order]),
      [
        ["pressure", 0],
        ["valve", 1],
      ],
    );
    assert.equal(localized.learning?.words.length, 3);
    assert.deepEqual(
      localized.learning?.words.slice(0, 2).map((w) => w.id),
      ["pressure:medical", "pressure:engineering"],
    );
    const medical = await localized.learning!.entry("pressure:medical");
    const engineering = await localized.learning!.entry("pressure:engineering");
    assert.equal(medical.senses.length, 1);
    assert.equal(medical.senses[0].fa, "pressão arterial");
    assert.equal(engineering.senses[0].fa, "pressão mecânica");
    assert.equal(medical.senses[0].en, entry.senses[0].en);
    assert.equal(medical.lexicalId, "pressure");
    assert.equal(localized.img(medical), base.img(entry));
    assert.equal(localized.audio(medical, "uk"), base.audio(entry, "uk"));
    assert.deepEqual(
      localized.domains![0].subcategoryLabelsFa,
      overlay(locale).categories["medicine-healthcare"].subcategoryLabels,
    );
    const native = await localized.entry("pressure");
    assert.equal(native.ex[0].fa, "Meça a pressão.");
    assert.equal(native.col[0], "blood pressure｜pressão arterial");
    assert.equal(native.note, undefined);
    assert.equal(
      /[\u0600-\u06ff]/u.test(
        JSON.stringify([
          native,
          localized.words,
          localized.topics,
          localized.domains?.map((d) => d.labelFa),
          localized.discoveryGroups?.map((g) => g.labelFa),
        ]),
      ),
      false,
    );
    assert.equal(localized.peek("pressure"), native);
    await assert.rejects(() => localized.entry("untranslated"));
  }
  assert.equal(base.words.length, 3);
  assert.equal(base.peek("pressure")?.senses[0].fa, "فشار خون");
});

test("stale source words and untranslated meanings cannot enter a published native edition", async () => {
  const catalog = overlay("pt-BR");
  catalog.entries.valve.sourceWord = "an old valve spelling";
  delete catalog.entries.pressure.senses["pressure:engineering"];
  const native = localizeAtlas(
    createAtlas(payload, manifest),
    "pt-BR",
    catalog,
  );
  assert.deepEqual(
    native.words.map((w) => w.id),
    ["pressure"],
  );
  assert.deepEqual(
    native.learning!.words.map((w) => w.id),
    ["pressure:medical"],
  );
  assert.equal(native.learning!.peek("pressure:engineering"), undefined);
  assert.throws(
    () => localizeAtlas(native, "es-419", catalog),
    /matching published/,
  );
});

test("current native sessions recover when a remaining meaning or saved distractor is withdrawn", async () => {
  const current = createAtlas(payload, manifest);
  const session: ActiveSession = {
    id: "paused-current",
    started: 1,
    index: 0,
    graded: { "valve:main": 3 },
    steps: [
      {
        id: "pressure:medical",
        kind: "meaning",
        options: ["pressure:medical", "pressure:engineering"],
      },
    ],
    newIds: ["pressure:medical"],
    reviewIds: [],
  };
  const missingTarget = overlay("pt-BR");
  delete missingTarget.entries.pressure.senses["pressure:medical"];
  assert.equal(
    (
      await resolveLocalizedSessionAtlas(
        current,
        session,
        "pt-BR",
        missingTarget,
      )
    ).unavailable,
    true,
  );
  const missingDistractor = overlay("pt-BR");
  delete missingDistractor.entries.pressure.senses["pressure:engineering"];
  assert.equal(
    (
      await resolveLocalizedSessionAtlas(
        current,
        session,
        "pt-BR",
        missingDistractor,
      )
    ).unavailable,
    true,
  );
  assert.deepEqual(session.graded, { "valve:main": 3 });
  assert.equal(session.index, 0);
  const alreadyCompleted = {
    ...session,
    index: 1,
    steps: [
      { id: "pressure:engineering", kind: "intro" as const },
      { id: "pressure:medical", kind: "meaning" as const },
    ],
  };
  assert.equal(
    (
      await resolveLocalizedSessionAtlas(
        current,
        alreadyCompleted,
        "pt-BR",
        missingDistractor,
      )
    ).unavailable,
    false,
  );
});

test("a paused old English release is restored before native dataset namespacing", async () => {
  const text = JSON.stringify(payload);
  const oldManifest = {
    ...manifest,
    payload: {
      ...manifest.payload,
      sha256: createHash("sha256").update(text).digest("hex"),
    },
  };
  const manifestText = JSON.stringify(oldManifest);
  const hash = createHash("sha256").update(manifestText).digest("hex");
  const current = createAtlas(
    { entries: [] },
    { ...manifest, release: { ...manifest.release, id: "new-release" } },
  );
  current.release = { ...current.release!, manifestHash: "f".repeat(64) };
  const session: ActiveSession = {
    id: "paused",
    started: 1,
    steps: [{ id: "pressure:medical", kind: "meaning" }],
    index: 0,
    graded: {},
    newIds: ["pressure:medical"],
    reviewIds: [],
    manifestPath: "content/old-manifest.json",
    manifestHash: hash,
    releaseId: "old-release",
  };
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (input) => {
    calls++;
    return new Response(
      String(input).endsWith("old-manifest.json") ? manifestText : text,
    );
  };
  try {
    const restored = await resolveLocalizedSessionAtlas(
      current,
      session,
      "pt-BR",
      overlay("pt-BR"),
    );
    assert.equal(restored.unavailable, false);
    assert.equal(restored.atlas.release?.id, "old-release");
    assert.equal(restored.atlas.id, "english-corpus:pt-BR");
    assert.equal(restored.atlas.learning!.byId.has("pressure:medical"), true);
    assert.equal(session.index, 0);
    assert.deepEqual(session.graded, {});
    assert.equal(calls, 2);
    assert.equal(current.id, "english-corpus");
    const withdrawn = overlay("pt-BR");
    delete withdrawn.entries.pressure.senses["pressure:medical"];
    const recovered = await resolveLocalizedSessionAtlas(
      current,
      session,
      "pt-BR",
      withdrawn,
    );
    assert.equal(recovered.unavailable, true);
    assert.equal(recovered.atlas.release?.id, "new-release");
    assert.equal(recovered.atlas.id, "english-corpus:pt-BR");
    const distractor = {
      ...session,
      steps: [
        {
          id: "pressure:engineering",
          kind: "meaning" as const,
          options: ["pressure:engineering", "pressure:medical"],
        },
      ],
    };
    const recoveredDistractor = await resolveLocalizedSessionAtlas(
      current,
      distractor,
      "pt-BR",
      withdrawn,
    );
    assert.equal(recoveredDistractor.unavailable, true);
    assert.equal(recoveredDistractor.atlas.release?.id, "new-release");
    assert.deepEqual(session.graded, {});
  } finally {
    globalThis.fetch = original;
  }
});
