import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  availablePortugueseWords,
  matchesPortugueseSearch,
  portugueseCatalog,
  portugueseGloss,
} from "./portuguese";
import type { WordRef } from "../atlas/types";

const publicFile = (path: string) =>
  JSON.parse(
    readFileSync(new URL(`../../public/${path}`, import.meta.url), "utf8"),
  );
const pointer = publicFile("content/current.json");
const manifest = publicFile(pointer.manifest);
const source: {
  entries: {
    id: string;
    w: string;
    senses: { id: string }[];
    ex: { en: string }[];
    col: string[];
  }[];
} = {
  entries: manifest.dataFiles.flatMap((file: { path: string }) =>
    publicFile(file.path),
  ),
};
const taxonomy = manifest.taxonomy;

test("Portuguese overlay covers the same stable lexical/sense identities and source examples without claiming human approval", () => {
  assert.equal(portugueseCatalog.locale, "pt-BR");
  assert.equal(portugueseCatalog.status, "preview");
  assert.equal(portugueseCatalog.review.humanReviewed, false);
  assert.ok(Object.keys(portugueseCatalog.entries).length > 0);
  for (const [id, translation] of Object.entries(portugueseCatalog.entries)) {
    const entry = source.entries.find((candidate) => candidate.id === id);
    assert.ok(entry, id);
    assert.equal(translation.sourceWord, entry.w);
    const publishedSenses = new Set(entry.senses.map((sense) => sense.id));
    assert.ok(Object.keys(translation.senses).length > 0);
    assert.ok(
      Object.keys(translation.senses).every((id) => publishedSenses.has(id)),
    );
    for (const sense of Object.values(translation.senses)) {
      assert.ok(sense.gloss.trim());
      assert.ok(sense.definition.trim());
    }
    const examples = new Set(entry.ex.map((example) => example.en));
    const collocations = new Set(
      entry.col.map((pair) => pair.split(/[｜|]/)[0].trim()),
    );
    assert.ok(translation.examples.every((pair) => examples.has(pair.en)));
    assert.ok(
      translation.collocations.every((pair) => collocations.has(pair.en)),
    );
    assert.equal(
      new Set(translation.examples.map((pair) => pair.en)).size,
      translation.examples.length,
    );
    assert.equal(
      new Set(translation.collocations.map((pair) => pair.en)).size,
      translation.collocations.length,
    );
    for (const pair of [...translation.examples, ...translation.collocations])
      assert.ok(pair.translation.trim());
    assert.equal(typeof translation.tip, "string");
  }
});

test("all 32 category identities and six discovery groups have Portuguese labels", () => {
  assert.equal(Object.keys(portugueseCatalog.categories).length, 32);
  assert.deepEqual(
    Object.keys(portugueseCatalog.categories).sort(),
    taxonomy.domains.map((domain: { id: string }) => domain.id).sort(),
  );
  assert.deepEqual(
    Object.keys(portugueseCatalog.groupLabels).sort(),
    taxonomy.discoveryGroups.map((group: { id: string }) => group.id).sort(),
  );
  assert.ok(
    Object.values(portugueseCatalog.categories).every((category) =>
      category.label.trim(),
    ),
  );
});

test("search and display use published Portuguese senses only, and stale lexical IDs do not attach to another headword", () => {
  const word: WordRef = {
    id: "pressure",
    word: "pressure",
    fa: "",
    ipa: "",
    cefr: 2,
    topic: 0,
    media: 1,
    order: 0,
    senseIds: ["pressure:blood-pressure"],
  };
  assert.ok(matchesPortugueseSearch(word, "pressao"));
  assert.ok(portugueseGloss(word));
  assert.ok(!portugueseGloss(word).includes("força por unidade"));
  assert.deepEqual(
    availablePortugueseWords([
      word,
      { ...word, id: "unknown" },
      { ...word, word: "changed" },
      { ...word, senseIds: ["draft-sense"] },
    ]),
    [word],
  );
});
