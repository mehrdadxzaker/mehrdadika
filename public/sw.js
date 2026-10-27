/* Mehrdadika static shell and immutable content cache. Learner progress stays in IndexedDB. */
const ROOT = self.registration.scope;
const PREFIX = `mehrdadika-shell:${encodeURIComponent(ROOT)}`;
const CACHE = `${PREFIX}:v1`;
const PACK_PREFIX = `mehrdadika-pack:${encodeURIComponent(new URL(ROOT).pathname)}:`;
const PACK_MARKER = new URL("__mehrdadika_pack_complete__", ROOT).href;
function publicStaticRequest(request) {
  const url = new URL(typeof request === "string" ? request : request.url);
  const root = new URL(ROOT);
  if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname))
    return false;
  const relative = url.pathname.slice(root.pathname.length);
  return (
    relative === "" ||
    [
      "index.html",
      "app-manifest.json",
      "build-info.json",
      "favicon.svg",
      "manifest.webmanifest",
    ].includes(relative) ||
    /^(?:assets|brand|licenses|content)\//.test(relative)
  );
}
async function matchCached(request) {
  // Vite preview sends Vary: Origin; canonical public pack keys have no Origin header.
  const options = { ignoreVary: publicStaticRequest(request) };
  const shell = await caches.open(CACHE);
  const hit = await shell.match(request, options);
  if (hit) return hit;
  for (const name of await caches.keys()) {
    if (!name.startsWith(PACK_PREFIX)) continue;
    const cache = await caches.open(name);
    if (!(await cache.match(PACK_MARKER))) continue;
    const response = await cache.match(request, options);
    if (response) return response;
  }
  return undefined;
}
/** Audio elements commonly issue Range requests even for locally cached MP3s. */
async function rangedResponse(response, range) {
  const data = await response.arrayBuffer();
  const size = data.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const invalid = () =>
    new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" },
    });
  if (!match || (!match[1] && !match[2]) || size === 0) return invalid();
  let start;
  let end;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (suffix <= 0) return invalid();
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start > end ||
    start >= size
  )
    return invalid();
  return new Response(data.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
    },
  });
}
const requests = new Map();
const absolute = (path) => new URL(path, ROOT).href;
async function boundedFetch(url) {
  const controller = new AbortController();
  const sourceSignal = url instanceof Request ? url.signal : undefined;
  const abort = () => controller.abort();
  sourceSignal?.addEventListener("abort", abort, { once: true });
  if (sourceSignal?.aborted) controller.abort();
  const timer = setTimeout(abort, 15000);
  try {
    return await fetch(url, {
      signal: controller.signal,
      credentials: "omit",
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
    sourceSignal?.removeEventListener("abort", abort);
  }
}
async function digest(buffer) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
async function verified(url, sha) {
  const response = await boundedFetch(url);
  if (response.status !== 200 && response.status !== 206)
    throw new Error("Invalid content response");
  if (response.status === 206 && !sha)
    throw new Error("Unverified partial content response");
  if (!sha) return response;
  const data = await response.arrayBuffer();
  if ((await digest(data)) !== sha)
    throw new Error("Invalid content response hash");
  const headers = new Headers(response.headers);
  headers.delete("Vary");
  headers.delete("Content-Range");
  headers.delete("Content-Encoding");
  headers.delete("Transfer-Encoding");
  headers.set("Content-Length", String(data.byteLength));
  return new Response(data, { status: 200, headers });
}
async function currentPointer() {
  const url = absolute("content/current.json");
  if (requests.has(url)) return (await requests.get(url)).clone();
  const task = (async () => {
    const cache = await caches.open(CACHE);
    try {
      const pointerResponse = await verified(url);
      const pointer = await pointerResponse.clone().json();
      const manifestUrl = absolute(pointer.manifest);
      const manifestResponse = await verified(manifestUrl, pointer.sha256);
      const manifest = await manifestResponse.clone().json();
      const payloadUrl = absolute(manifest.payload.path);
      const payloadResponse = await verified(
        payloadUrl,
        manifest.payload.sha256,
      );
      await cache.put(manifestUrl, manifestResponse);
      await cache.put(payloadUrl, payloadResponse);
      await cache.put(url, pointerResponse.clone());
      return pointerResponse;
    } catch (error) {
      const previous = await cache.match(url);
      if (previous) return previous;
      throw error;
    }
  })();
  requests.set(url, task);
  try {
    return (await task).clone();
  } finally {
    requests.delete(url);
  }
}
async function seedShell() {
  const cache = await caches.open(CACHE);
  const response = await verified(ROOT);
  await cache.put(ROOT, response.clone());
  await cache.put(absolute("index.html"), response.clone());
  const html = await response.text();
  const paths = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)]
    .map((m) => new URL(m[1], ROOT).href)
    .filter((url) => url.startsWith(ROOT));
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, paths.length) }, async () => {
      while (cursor < paths.length) {
        const url = paths[cursor++];
        try {
          const asset = await verified(url);
          await cache.put(url, asset);
        } catch {}
      }
    }),
  );
  try {
    await currentPointer();
  } catch {}
}
self.addEventListener("install", (event) => {
  event.waitUntil(seedShell().then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (
    req.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.href.startsWith(ROOT)
  )
    return;
  // Explicit downloads stage their own cache; do not duplicate them into the shell cache.
  if (req.headers.get("X-Mehrdadika-Pack") === "1") {
    event.respondWith(
      (async () => {
        try {
          const response = await boundedFetch(req);
          if (response.ok) return response;
          return (await matchCached(new Request(req.url))) ?? response;
        } catch {
          return (
            (await matchCached(new Request(req.url))) ??
            new Response("Offline", { status: 503 })
          );
        }
      })(),
    );
    return;
  }
  if (req.headers.has("range")) {
    event.respondWith(
      (async () => {
        const cached = await matchCached(new Request(req.url));
        if (cached?.status === 200)
          return rangedResponse(cached, req.headers.get("range"));
        return boundedFetch(req);
      })().catch(() => new Response("", { status: 503 })),
    );
    return;
  }
  if (url.href === absolute("content/current.json")) {
    event.respondWith(
      currentPointer().catch(() => new Response("Offline", { status: 503 })),
    );
    return;
  }
  if (
    url.pathname === new URL(absolute("app-manifest.json")).pathname ||
    url.pathname === new URL(absolute("build-info.json")).pathname ||
    (url.pathname === new URL(absolute("index.html")).pathname &&
      req.mode !== "navigate")
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const response = await boundedFetch(req);
          if (response.status === 200) {
            await cache.put(req, response.clone());
            return response;
          }
          return (await matchCached(req)) ?? response;
        } catch {
          return (
            (await matchCached(req)) ?? new Response("Offline", { status: 503 })
          );
        }
      })(),
    );
    return;
  }
  // The app uses hash routes. Visiting a JSON file or image must never replace its shell.
  if (
    req.mode === "navigate" &&
    (url.pathname === new URL(ROOT).pathname ||
      url.pathname === new URL(absolute("index.html")).pathname)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const response = await boundedFetch(req);
          if (
            response.status === 200 &&
            /(?:text\/html|application\/xhtml\+xml)/i.test(
              response.headers.get("Content-Type") ?? "",
            )
          ) {
            await cache.put(ROOT, response.clone());
            await cache.put(absolute("index.html"), response.clone());
            return response;
          }
          return (await cache.match(ROOT)) ?? response;
        } catch {
          return (
            (await cache.match(ROOT)) ??
            new Response("برای نخستین بار به اینترنت متصل شوید.", {
              status: 503,
              headers: { "Content-Type": "text/plain;charset=utf-8" },
            })
          );
        }
      })(),
    );
    return;
  }
  event.respondWith(
    (async () => {
      const cached = await matchCached(req);
      if (cached) return cached;
      const response = await boundedFetch(req);
      if (response.status === 200) {
        const cache = await caches.open(CACHE);
        await cache.put(req, response.clone());
        const keys = await cache.keys();
        if (keys.length > 500) {
          const removable = keys.filter(
            (key) =>
              !key.url.includes("/content/releases/") &&
              !key.url.includes("/content/entries/") &&
              !key.url.includes("/content/indexes/") &&
              !key.url.endsWith("/content/current.json") &&
              key.url !== ROOT,
          );
          for (const key of removable.slice(0, Math.max(0, keys.length - 500)))
            await cache.delete(key);
        }
      }
      return response;
    })().catch(() => new Response("", { status: 503 })),
  );
});
