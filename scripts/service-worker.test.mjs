import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import { webcrypto } from "node:crypto";
const script = fs.readFileSync(
  new URL("../public/sw.js", import.meta.url),
  "utf8",
);
const events = new Map();
const context = vm.createContext({
  URL,
  Response,
  Headers,
  Request,
  AbortController,
  setTimeout,
  clearTimeout,
  crypto: webcrypto,
  self: {
    registration: { scope: "https://example.test/mehrdadika/" },
    location: { origin: "https://example.test" },
    addEventListener: (name, handler) => events.set(name, handler),
  },
});
vm.runInContext(script, context);
const rangeResponse = vm.runInContext("rangedResponse", context);
const audio = () =>
  new Response(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]), {
    headers: { "Content-Type": "audio/mpeg", "Content-Encoding": "gzip" },
  });
test("cached audio supports bounded, open and suffix byte ranges without encoded-body headers", async () => {
  for (const [range, expected, start, end] of [
    ["bytes=2-4", [2, 3, 4], 2, 4],
    ["bytes=6-", [6, 7], 6, 7],
    ["bytes=-2", [6, 7], 6, 7],
  ]) {
    const response = await rangeResponse(audio(), range);
    assert.equal(response.status, 206);
    assert.equal(
      response.headers.get("Content-Range"),
      `bytes ${start}-${end}/8`,
    );
    assert.equal(
      response.headers.get("Content-Length"),
      String(expected.length),
    );
    assert.equal(response.headers.get("Content-Type"), "audio/mpeg");
    assert.equal(response.headers.has("Content-Encoding"), false);
    assert.deepEqual(
      [...new Uint8Array(await response.arrayBuffer())],
      expected,
    );
  }
});
test("invalid or unsatisfiable ranges return416 rather than wrong audio data", async () => {
  for (const range of [
    "bytes=9-",
    "bytes=5-2",
    "bytes=-0",
    "bytes=0-1,3-4",
    "bytes=-",
  ]) {
    const response = await rangeResponse(audio(), range);
    assert.equal(response.status, 416);
    assert.equal(response.headers.get("Content-Range"), "bytes */8");
  }
});
test("a subpath is retained when addressing content releases", () => {
  assert.equal(
    vm.runInContext('absolute("content/current.json")', context),
    "https://example.test/mehrdadika/content/current.json",
  );
});

test("pack downloads use fresh network responses without filling the ordinary shell cache", async () => {
  let cached = 0;
  context.caches = {
    open: async () => ({
      put: async () => {
        cached++;
      },
      match: async () => undefined,
    }),
    keys: async () => [],
  };
  context.fetch = async () => new Response("fresh bytes", { status: 200 });
  let responsePromise;
  events.get("fetch")({
    request: new Request("https://example.test/mehrdadika/brand/hero.webp", {
      headers: { "X-Mehrdadika-Pack": "1" },
    }),
    respondWith: (promise) => {
      responsePromise = promise;
    },
  });
  assert.equal(await (await responsePromise).text(), "fresh bytes");
  assert.equal(cached, 0);
});
test("service-worker fetch relays cancellation from the requesting client", async () => {
  const controller = new AbortController();
  context.fetch = async (_request, { signal }) =>
    new Promise((resolve, reject) => {
      if (signal.aborted) reject(new DOMException("Aborted", "AbortError"));
      else
        signal.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
    });
  const boundedFetch = vm.runInContext("boundedFetch", context);
  const pending = boundedFetch(
    new Request("https://example.test/mehrdadika/asset.mp3", {
      signal: controller.signal,
    }),
  );
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
});

test("complete public packs survive VaryOrigin differences on crossorigin module/style requests", async () => {
  const root = "https://example.test/mehrdadika/";
  const packName = `mehrdadika-pack:${encodeURIComponent("/mehrdadika/")}:completed`;
  const marker = new URL("__mehrdadika_pack_complete__", root).href;
  const packed = new Response("export const ready=true", {
    headers: { "Content-Type": "text/javascript", Vary: "Origin" },
  });
  let ignored = false;
  context.caches = {
    keys: async () => [packName],
    open: async (name) => ({
      match: async (request, options) => {
        const url = typeof request === "string" ? request : request.url;
        if (name === packName && url === marker)
          return new Response("complete");
        if (name !== packName) return undefined;
        ignored = options?.ignoreVary === true;
        return ignored ? packed.clone() : undefined;
      },
    }),
  };
  const lookup = vm.runInContext("matchCached", context);
  for (const file of ["assets/app.js", "assets/app.css"]) {
    ignored = false;
    const response = await lookup(
      new Request(new URL(file, root), {
        headers: { Origin: "https://example.test" },
      }),
    );
    assert.equal(await response.text(), "export const ready=true");
    assert.equal(ignored, true);
  }
  ignored = false;
  assert.equal(
    await lookup(
      new Request(new URL("api/session", root), {
        headers: { Origin: "https://example.test" },
      }),
    ),
    undefined,
  );
  assert.equal(ignored, false);
});

test("metadata and asset navigations keep their own cache keys and cannot replace the offline app shell", async () => {
  const root = "https://example.test/mehrdadika/";
  const entries = new Map();
  const requestUrl = (request) =>
    typeof request === "string" ? request : request.url;
  const cache = {
    put: async (request, response) =>
      entries.set(requestUrl(request), response.clone()),
    match: async (request) => entries.get(requestUrl(request))?.clone(),
    keys: async () => [...entries.keys()].map((url) => new Request(url)),
  };
  context.caches = { open: async () => cache, keys: async () => [] };
  let online = true;
  let buildVersion = 1;
  context.fetch = async (request) => {
    if (!online) throw new Error("offline");
    const path = new URL(requestUrl(request)).pathname;
    if (path.endsWith("build-info.json"))
      return new Response(JSON.stringify({ version: buildVersion }), {
        headers: { "Content-Type": "application/json" },
      });
    if (path.endsWith("brand/card.svg"))
      return new Response("<svg>card image</svg>", {
        headers: { "Content-Type": "image/svg+xml" },
      });
    return new Response("<!doctype html><main>Mehrdadika app</main>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  };
  const navigate = async (path) => {
    const request = new Request(new URL(path, root));
    Object.defineProperty(request, "mode", { value: "navigate" });
    let response;
    events.get("fetch")({
      request,
      respondWith: (promise) => {
        response = promise;
      },
    });
    return await response;
  };

  assert.match(await (await navigate("")).text(), /Mehrdadika app/);
  assert.deepEqual(await (await navigate("build-info.json")).json(), {
    version: 1,
  });
  buildVersion = 2;
  assert.deepEqual(await (await navigate("build-info.json")).json(), {
    version: 2,
  });
  assert.equal(
    await (await navigate("brand/card.svg")).text(),
    "<svg>card image</svg>",
  );
  assert.match(await entries.get(root).clone().text(), /Mehrdadika app/);
  assert.equal(
    await entries.get(new URL("brand/card.svg", root).href).clone().text(),
    "<svg>card image</svg>",
  );

  online = false;
  assert.match(await (await navigate("")).text(), /Mehrdadika app/);
  assert.match(await (await navigate("index.html")).text(), /Mehrdadika app/);
  assert.deepEqual(await (await navigate("build-info.json")).json(), {
    version: 2,
  });
  assert.equal(
    await (await navigate("brand/card.svg")).text(),
    "<svg>card image</svg>",
  );
});
