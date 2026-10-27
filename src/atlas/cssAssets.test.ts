import assert from "node:assert/strict";
import { test } from "node:test";
import { cssAssetReferences } from "./cssAssets";

test("quoted SVG data URLs consume nested paint references without inventing network assets", () => {
  const css = `.one{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='url(%23n)'/%3E%3C/svg%3E")}
  .two{background:url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3Cpath fill="url(%23paint)"/%3E%3C/svg%3E')}
  @font-face{src:url("./vazirmatn.woff2") format("woff2")}`;
  assert.deepEqual(cssAssetReferences(css), ["./vazirmatn.woff2"]);
});

test("single, double and unquoted asset references work while fragments and data are skipped", () => {
  const css = `a{background:url('/mehrdadika/assets/a.webp')}b{src:url(./font.woff2)}c{background:url("#gradient")}d{background:url(#mask)}e{src:url(data:font/woff2;base64,AAAA)}f{src:url('./font.woff2')}`;
  assert.deepEqual(cssAssetReferences(css), [
    "/mehrdadika/assets/a.webp",
    "./font.woff2",
  ]);
});

test("escaped quotes inside a quoted data URL do not expose its inner url token", () => {
  const css = String.raw`.icon{background:url("data:image/svg+xml,<svg fill=\"url(%23n)\"/>")} .photo{background:url("./photo.webp")}`;
  assert.deepEqual(cssAssetReferences(css), ["./photo.webp"]);
});
