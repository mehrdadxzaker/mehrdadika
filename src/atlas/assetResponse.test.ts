import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { AssetResponseError, verifiedAssetResponse } from "./assetResponse";
const full = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
const hash = createHash("sha256").update(full).digest("hex");
test("a206 containing the full known-hash body becomes a cacheable200", async () => {
  const verified = await verifiedAssetResponse(
    new Response(full, {
      status: 206,
      headers: {
        "Content-Range": "bytes 0-7/8",
        "Content-Encoding": "gzip",
        "Content-Type": "audio/mpeg",
        Vary: "Origin",
      },
    }),
    hash,
    "content/media/test.mp3",
  );
  assert.equal(verified.response.status, 200);
  assert.equal(verified.response.headers.has("Content-Range"), false);
  assert.equal(verified.response.headers.has("Vary"), false);
  assert.equal(verified.response.headers.has("Content-Encoding"), false);
  assert.equal(verified.response.headers.get("Content-Length"), "8");
  assert.equal(verified.response.headers.get("Content-Type"), "audio/mpeg");
  assert.deepEqual(
    [...new Uint8Array(await verified.response.arrayBuffer())],
    [...full],
  );
});
test("partial known-hash and unknown-hash206 responses fail before cache storage", async () => {
  await assert.rejects(
    verifiedAssetResponse(
      new Response(full.slice(0, 4), { status: 206 }),
      hash,
      "audio.mp3",
    ),
    (error) =>
      error instanceof AssetResponseError &&
      error.kind === "integrity" &&
      error.path === "audio.mp3",
  );
  await assert.rejects(
    verifiedAssetResponse(
      new Response(full, { status: 206 }),
      undefined,
      "app.js",
    ),
    (error) => error instanceof AssetResponseError && error.kind === "partial",
  );
});
test("normal200 bodies are verified while failedHTTP responses remain errors", async () => {
  assert.equal(
    (await verifiedAssetResponse(new Response(full), hash, "audio.mp3"))
      .response.status,
    200,
  );
  await assert.rejects(
    verifiedAssetResponse(
      new Response("missing", { status: 404 }),
      undefined,
      "missing.webp",
    ),
    (error) => error instanceof AssetResponseError && error.kind === "http",
  );
});
