import assert from "node:assert/strict";
import test from "node:test";
import {
  localeRegistry,
  normalizePortugueseSearch,
  parsePortugueseBookmarks,
  parsePortugueseRoute,
  portugueseHref,
  resolveInterfaceLocale,
  serializePortugueseBookmarks,
} from "./registry";

test("Portuguese has explicit LTR preview metadata while European Portuguese remains unselectable", () => {
  const brazil = localeRegistry.find((locale) => locale.id === "pt-BR")!;
  assert.equal(brazil.direction, "ltr");
  assert.equal(brazil.status, "preview");
  assert.equal(brazil.nativeName, "Português (Brasil)");
  assert.equal(
    localeRegistry.find((locale) => locale.id === "pt-PT")?.href,
    null,
  );
  assert.equal(resolveInterfaceLocale("pt_BR"), "pt-BR");
  assert.equal(resolveInterfaceLocale("pt"), "pt-BR");
  assert.equal(resolveInterfaceLocale("pt-PT"), "fa");
  assert.equal(resolveInterfaceLocale("unknown"), "fa");
});

test("Portuguese search accepts accent and case variants without losing the original display text", () => {
  assert.equal(
    normalizePortugueseSearch("  PRESSÃO  arterial "),
    "pressao arterial",
  );
  assert.equal(
    normalizePortugueseSearch("infecção"),
    normalizePortugueseSearch("INFECCAO"),
  );
  assert.equal(normalizePortugueseSearch("área"), "area");
});

test("Portuguese deep links preserve stable category and lexical IDs and bounded query input", () => {
  const source = {
    topic: "medicine-healthcare",
    query: "pressão + força",
    word: "pressure",
    saved: true,
  };
  assert.deepEqual(parsePortugueseRoute(portugueseHref(source)), source);
  assert.equal(
    parsePortugueseRoute("#/pt-BR?q=" + "x".repeat(1000)).query.length,
    200,
  );
  assert.deepEqual(parsePortugueseRoute("#/pt-BR"), {
    topic: "all",
    query: "",
    word: null,
    saved: false,
  });
});

test("Portuguese saved words stay namespaced, validated and separate from Persian learning records", () => {
  const ids = new Set(["pressure", "bake"]);
  assert.deepEqual(
    parsePortugueseBookmarks(
      serializePortugueseBookmarks(["pressure", "pressure", "bake"]),
      ids,
    ),
    ["pressure", "bake"],
  );
  assert.deepEqual(
    parsePortugueseBookmarks('{"version":1,"locale":"fa","ids":["bake"]}', ids),
    [],
  );
  assert.deepEqual(
    parsePortugueseBookmarks(
      '{"version":1,"locale":"pt-BR","ids":["unknown",null,"pressure"]}',
      ids,
    ),
    ["pressure"],
  );
  assert.deepEqual(parsePortugueseBookmarks("broken", ids), []);
});
