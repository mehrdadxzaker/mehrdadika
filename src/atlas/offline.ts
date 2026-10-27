import type { Atlas } from "./types";
import { cssAssetReferences } from "./cssAssets";
import { verifiedAssetResponse } from "./assetResponse";
const scope = import.meta.env?.BASE_URL ?? "/";
const KEY = `mehrdadika:offline-pack:${scope}`;
const prefix = `mehrdadika-pack:${encodeURIComponent(scope)}:`;
interface OfflineInfo {
  name: string;
  releaseId: string;
  files: number;
  bytes: number;
  savedAt: number;
}
export function offlinePackInfo(): OfflineInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (
      !value ||
      typeof value !== "object" ||
      typeof value.name !== "string" ||
      !value.name.startsWith(prefix) ||
      typeof value.releaseId !== "string" ||
      value.releaseId.length > 160 ||
      ![value.files, value.bytes, value.savedAt].every(
        (n) => typeof n === "number" && Number.isFinite(n) && n >= 0,
      )
    )
      return null;
    return {
      name: value.name,
      releaseId: value.releaseId,
      files: value.files,
      bytes: value.bytes,
      savedAt: value.savedAt,
    };
  } catch {
    return null;
  }
}
export async function downloadOfflinePack(
  atlas: Atlas,
  onProgress: (done: number, total: number) => void = () => {},
  signal?: AbortSignal,
): Promise<OfflineInfo> {
  if (import.meta.env.DEV)
    throw new Error(
      "دانلود آفلاین در نسخهٔ ساخته‌شده و منتشرشدهٔ برنامه فعال است.",
    );
  if (
    !("caches" in window) ||
    !("serviceWorker" in navigator) ||
    !atlas.release?.manifestPath ||
    !atlas.release.manifestHash
  )
    throw new Error("دانلود آفلاین در این مرورگر در دسترس نیست.");
  const base = new URL(scope, location.origin);
  const name = `${prefix}${atlas.release.manifestHash}-install-${Date.now()}`;
  const cache = await caches.open(name);
  const batch = new AbortController();
  const cancel = () => batch.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) batch.abort();
  let done = 0;
  let bytes = 0;
  const fetched = new Set<string>();
  const relative = (url: string) => {
    const parsed = new URL(url, base);
    if (
      parsed.origin !== base.origin ||
      !parsed.pathname.startsWith(base.pathname)
    )
      throw new Error("بستهٔ آفلاین باید از همین وب‌سایت دریافت شود.");
    return parsed.pathname.slice(base.pathname.length);
  };
  const fetchFile = async (path: string, expectedHash?: string) => {
    if (path.startsWith("/") || path.includes("..") || /^[a-z]+:/i.test(path))
      throw new Error("مسیر بسته معتبر نیست.");
    if (batch.signal.aborted) throw new DOMException("Aborted", "AbortError");
    const controller = new AbortController();
    const abort = () => controller.abort();
    batch.signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, 20000);
    try {
      const url = new URL(path, base);
      const response = await fetch(url, {
        signal: controller.signal,
        credentials: "omit",
        cache: "no-store",
        headers: { "X-Mehrdadika-Pack": "1" },
      });
      const verified = await verifiedAssetResponse(
        response,
        expectedHash,
        path,
      );
      await cache.put(url, verified.response);
      bytes += verified.data.byteLength;
      fetched.add(path);
      return new TextDecoder().decode(verified.data);
    } catch (error) {
      console.warn("Mehrdadika offline asset failed", { path, error });
      throw error;
    } finally {
      clearTimeout(timer);
      batch.signal.removeEventListener("abort", abort);
    }
  };
  try {
    const manifestText = await fetchFile(
      atlas.release.manifestPath,
      atlas.release.manifestHash,
    );
    const manifest = JSON.parse(manifestText) as {
      payload: { path: string; sha256: string };
      assets: { path: string; sha256: string }[];
      appAssets?: { path: string; sha256: string }[];
      dataFiles?: { path: string; sha256: string }[];
    };
    const html = await fetchFile("index.html");
    const appManifest = JSON.parse(
      await fetchFile("app-manifest.json"),
    ) as Record<string, { file: string; css?: string[]; assets?: string[] }>;
    const builtPaths = new Set(
      Object.values(appManifest).flatMap((record) => [
        record.file,
        ...(record.css ?? []),
        ...(record.assets ?? []),
      ]),
    );
    const entryScripts = [...html.matchAll(/src=["']([^"']+\.js)["']/g)].map(
      (match) => relative(match[1]),
    );
    if (
      !entryScripts.length ||
      entryScripts.some((file) => !builtPaths.has(file))
    )
      throw new Error(
        "برنامه در حال به‌روزرسانی است؛ پس از تازه‌سازی دوباره تلاش کنید.",
      );
    // Fonts referenced by CSS may not have their own Vite manifest record.
    for (const css of [...builtPaths].filter((file) => file.endsWith(".css"))) {
      const cssText = await fetchFile(css);
      for (const reference of cssAssetReferences(cssText)) {
        builtPaths.add(relative(new URL(reference, new URL(css, base)).href));
      }
    }
    const files = new Map<string, string | undefined>(
      [...builtPaths].map((file) => [file, undefined]),
    );
    files.set(manifest.payload.path, manifest.payload.sha256);
    [
      ...manifest.assets,
      ...(manifest.appAssets ?? []),
      ...(manifest.dataFiles ?? []),
    ].forEach((asset) => files.set(asset.path, asset.sha256));
    const queue = [...files].filter(([path]) => !fetched.has(path));
    const total = fetched.size + queue.length;
    done = fetched.size;
    onProgress(done, total);
    let cursor = 0;
    let failure: unknown;
    const workers = Array.from(
      { length: Math.min(3, queue.length) },
      async () => {
        try {
          while (cursor < queue.length && !batch.signal.aborted) {
            const [path, sha] = queue[cursor++];
            await fetchFile(path, sha);
            onProgress(++done, total);
          }
        } catch (error) {
          failure ??= error;
          batch.abort();
          throw error;
        }
      },
    );
    await Promise.allSettled(workers);
    if (failure) throw failure;
    if (batch.signal.aborted) throw new DOMException("Aborted", "AbortError");
    await navigator.serviceWorker.register(new URL("sw.js", base));
    let readyTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => {
          readyTimer = setTimeout(
            () =>
              reject(new Error("ذخیرهٔ برنامه کامل نشد؛ دوباره تلاش کنید.")),
            20000,
          );
        }),
      ]);
    } finally {
      clearTimeout(readyTimer);
    }
    if (batch.signal.aborted) throw new DOMException("Aborted", "AbortError");
    const pointer = new Response(
      JSON.stringify({
        schemaVersion: 1,
        manifest: atlas.release.manifestPath,
        sha256: atlas.release.manifestHash,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
    const shell = await caches.open(
      `mehrdadika-shell:${encodeURIComponent(base.href)}:v1`,
    );
    await cache.put(
      base.href,
      (await cache.match(new URL("index.html", base)))!,
    );
    await cache.put(new URL("content/current.json", base), pointer.clone());
    await cache.put(
      new URL("__mehrdadika_pack_complete__", base),
      new Response(
        JSON.stringify({
          releaseId: atlas.release.id,
          manifestHash: atlas.release.manifestHash,
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );
    await shell.put(new URL("content/current.json", base), pointer);
    await shell.put(
      base.href,
      (await cache.match(new URL("index.html", base)))!,
    );
    const info: OfflineInfo = {
      name,
      releaseId: atlas.release.id,
      files: total,
      bytes,
      savedAt: Date.now(),
    };
    const old = offlinePackInfo();
    localStorage.setItem(KEY, JSON.stringify(info));
    if (old?.name && old.name !== name) await caches.delete(old.name);
    return info;
  } catch (error) {
    await caches.delete(name);
    throw error;
  } finally {
    signal?.removeEventListener("abort", cancel);
  }
}
export async function removeOfflinePacks() {
  if ("caches" in window)
    for (const name of await caches.keys())
      if (name.startsWith(prefix)) await caches.delete(name);
  localStorage.removeItem(KEY);
}
