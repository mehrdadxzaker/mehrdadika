import assert from "node:assert/strict";
import test from "node:test";
import {
  lookupTokens,
  matchLookupWord,
  normalizeLookupWord,
} from "./inline-lookup-model";

test("lookup tokenization preserves visible punctuation, spacing, and contractions", () => {
  const text = "Mina’s book, a load-bearing wall — don't fold it.";
  assert.equal(lookupTokens(text).join(""), text);
  assert.ok(lookupTokens(text).includes("Mina’s"));
  assert.ok(lookupTokens(text).includes("load-bearing"));
  assert.ok(lookupTokens(text).includes("don't"));
});
test("exact entries take precedence over conservative inflection matching", () => {
  const dictionary = new Map([
    ["book", "book"],
    ["books", "books-entry"],
    ["study", "study"],
    ["bake", "bake"],
    ["run", "run"],
  ]);
  assert.equal(matchLookupWord("Books", dictionary), "books-entry");
  assert.equal(matchLookupWord("studies", dictionary), "study");
  assert.equal(matchLookupWord("baking", dictionary), "bake");
  assert.equal(matchLookupWord("running", dictionary), "run");
  assert.equal(matchLookupWord("book’s", dictionary), "book");
});
test("unavailable words and unchanging nouns do not invent lexical matches", () => {
  const dictionary = new Map([
    ["new", "new"],
    ["physic", "physic"],
    ["glass", "glass"],
  ]);
  assert.equal(matchLookupWord("news", dictionary), undefined);
  assert.equal(matchLookupWord("physics", dictionary), undefined);
  assert.equal(matchLookupWord("unavailable", dictionary), undefined);
  assert.equal(normalizeLookupWord("Mina’S"), "mina's");
});
