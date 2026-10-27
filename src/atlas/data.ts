import type {
  Atlas,
  Domain,
  DiscoveryGroup,
  Entry,
  ReleaseInfo,
  WordRef,
} from "./types";
import { MEDIA } from "./types";
import type { ReadingCatalog } from "../reading/types";
import type { CourseRef } from "../courses/types";

const BASE = import.meta.env?.BASE_URL ?? "/";
const contentUrl = (path: string) => `${BASE}${path.replace(/^\//, "")}`;
interface Pointer {
  schemaVersion: number;
  manifest: string;
  sha256: string;
}
interface Manifest {
  schemaVersion: number;
  corpusId: string;
  name: string;
  release: ReleaseInfo;
  payload: { path: string; sha256: string };
  taxonomy: { domains: Domain[]; discoveryGroups: DiscoveryGroup[] };
  appAssets?: { path: string; sha256: string; bytes: number }[];
  assets: { path: string; sha256: string; bytes: number }[];
}
interface Payload {
  entries: Entry[];
  courses?: CourseRef;
  readings?: ReadingCatalog;
  examples?: number;
  shards?: Record<string, { path: string; sha256: string }>;
}

async function sha256(text: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
function safePath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    !path.startsWith("/") &&
    !path.includes("..") &&
    !/^[a-z]+:/i.test(path)
  );
}
let activeRequests = 0;
const requestQueue: (() => void)[] = [];
async function requestSlot() {
  if (activeRequests < 4) activeRequests++;
  else await new Promise<void>((resolve) => requestQueue.push(resolve));
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const next = requestQueue.shift();
    if (next) next();
    else activeRequests--;
  };
}
export async function jsonFile<T>(
  path: string,
  expectedHash?: string,
): Promise<T> {
  if (!safePath(path)) throw new Error("مسیر بستهٔ محتوا معتبر نیست.");
  const releaseSlot = await requestSlot();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(contentUrl(path), {
      signal: controller.signal,
      credentials: "omit",
      cache: path.endsWith("current.json") ? "no-cache" : "default",
    });
    if (!response.ok)
      throw new Error(`دریافت محتوا ناموفق بود (${response.status}).`);
    const text = await response.text();
    if (expectedHash && (await sha256(text)) !== expectedHash)
      throw new Error("یکپارچگی بستهٔ محتوا تأیید نشد. دوباره تلاش کنید.");
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
    releaseSlot();
  }
}

export function createAtlas(payload: Payload, manifest: Manifest): Atlas {
  if (manifest.schemaVersion !== 1 || !Array.isArray(payload.entries))
    throw new Error("نسخهٔ این بستهٔ محتوا پشتیبانی نمی‌شود.");
  const cefr = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const domains = manifest.taxonomy.domains;
  const topics: [string, string][] = domains.map((d) => [d.id, d.labelFa]);
  const entries = new Map(payload.entries.map((entry) => [entry.id, entry]));
  const senseEntries = new Map<string, Entry>();
  const fullCache = new Map<string, Entry>(
    payload.shards ? [] : payload.entries.map((entry) => [entry.id, entry]),
  );
  const pendingChunks = new Map<string, Promise<void>>();
  const senseToLexical = new Map<string, string>();
  const mediaBits = (entry: Entry) =>
    (Object.entries(MEDIA) as [keyof typeof MEDIA, number][]).reduce(
      (bits, [key, bit]) => bits | (entry.media?.[key] ? bit : 0),
      0,
    );
  const toRef = (entry: Entry, order: number): WordRef => ({
    id: entry.id,
    word: entry.w,
    fa: entry.senses.map((sense) => `${sense.pos} ${sense.fa}`).join("؛ "),
    ipa: entry.uk || entry.us,
    cefr: Math.max(0, cefr.indexOf(entry.cefr)),
    topic: Math.max(
      0,
      domains.findIndex((d) => d.id === entry.topic),
    ),
    media: mediaBits(entry),
    order,
    lexicalId: entry.lexicalId ?? entry.id,
    senseIds: entry.senses.map((s) => s.id!).filter(Boolean),
    domainIds: entry.domainIds ?? [entry.topic],
  });
  const words = payload.entries.map(toRef);
  const learningWords: WordRef[] = [];
  for (const entry of payload.entries) {
    for (const sense of entry.senses) {
      if (!sense.id || senseToLexical.has(sense.id))
        throw new Error("شناسهٔ معنی تکراری یا نامعتبر است.");
      senseToLexical.set(sense.id, entry.id);
      const focused: Entry = {
        ...entry,
        id: sense.id,
        lexicalId: entry.id,
        senses: [sense],
        topic: (sense.domainIds ?? entry.domainIds ?? [entry.topic])[0],
        domainIds: sense.domainIds ?? entry.domainIds ?? [entry.topic],
        ex: entry.ex.filter((ex) => !ex.senseId || ex.senseId === sense.id),
      };
      senseEntries.set(sense.id, focused);
      learningWords.push(toRef(focused, learningWords.length));
    }
  }
  const pick = (ref: WordRef | Entry) =>
    entries.get(ref.lexicalId ?? senseToLexical.get(ref.id) ?? ref.id);
  const asset = (path?: string | null) =>
    path && safePath(path) ? contentUrl(path) : null;
  function focused(entry: Entry, senseId: string): Entry {
    const sense = entry.senses.find((s) => s.id === senseId);
    if (!sense) return entry;
    return {
      ...entry,
      id: senseId,
      lexicalId: entry.id,
      senses: [sense],
      topic: (sense.domainIds ?? entry.domainIds ?? [entry.topic])[0],
      domainIds: sense.domainIds ?? entry.domainIds ?? [entry.topic],
      ex: entry.ex.filter((ex) => !ex.senseId || ex.senseId === senseId),
    };
  }
  const peek = (id: string) => {
    const lexical = senseToLexical.get(id) ?? id;
    const entry = fullCache.get(lexical);
    return entry ? (lexical === id ? entry : focused(entry, id)) : undefined;
  };
  async function entry(id: string) {
    const lexical = senseToLexical.get(id) ?? id;
    const hit = peek(id);
    if (hit) return hit;
    const shard = payload.shards?.[lexical];
    if (!shard) throw new Error("این واژه در نسخهٔ کنونی موجود نیست.");
    let pending = pendingChunks.get(shard.path);
    if (!pending) {
      pending = jsonFile<Entry[]>(shard.path, shard.sha256)
        .then((list) => {
          if (!Array.isArray(list))
            throw new Error("ساختار بستهٔ واژه معتبر نیست.");
          for (const item of list)
            if (entries.has(item.id)) fullCache.set(item.id, item);
        })
        .catch((error) => {
          pendingChunks.delete(shard.path);
          throw error;
        });
      pendingChunks.set(shard.path, pending);
    }
    await pending;
    const loaded = peek(id);
    if (!loaded) throw new Error("این معنی در نسخهٔ کنونی موجود نیست.");
    return loaded;
  }
  const common = {
    id: manifest.corpusId,
    name: manifest.name,
    kind: "open" as const,
    topics,
    cefr,
    domains,
    discoveryGroups: manifest.taxonomy.discoveryGroups,
    release: { ...manifest.release },
    senseToLexical,
    readings: payload.readings,
    courses: payload.courses,
    img: (ref: WordRef | Entry) => asset(pick(ref)?.media?.img),
    audio: (ref: WordRef | Entry, kind: "uk" | "us" | "ex" | "ex2") =>
      asset(pick(ref)?.media?.[kind]),
    peek,
    entry,
  };
  const learning: Atlas = {
    ...common,
    words: learningWords,
    byId: new Map(learningWords.map((w) => [w.id, w])),
    count: learningWords.length,
    examples:
      payload.examples ??
      [...senseEntries.values()].reduce((n, e) => n + e.ex.length, 0),
    illustrated: learningWords.filter((w) => w.media & MEDIA.img).length,
  };
  const atlas: Atlas = {
    ...common,
    words,
    byId: new Map(words.map((w) => [w.id, w])),
    count: words.length,
    examples:
      payload.examples ?? payload.entries.reduce((n, e) => n + e.ex.length, 0),
    illustrated: words.filter((w) => w.media & MEDIA.img).length,
    learning,
  };
  return atlas;
}
let loading: Promise<Atlas> | null = null;
export function loadOpenAtlas(): Promise<Atlas> {
  if (loading) return loading;
  loading = (async () => {
    const pointer = await jsonFile<Pointer>("content/current.json");
    if (pointer.schemaVersion !== 1 || !/^[a-f0-9]{64}$/.test(pointer.sha256))
      throw new Error("فهرست انتشار محتوا معتبر نیست.");
    const manifest = await jsonFile<Manifest>(pointer.manifest, pointer.sha256);
    const payload = await jsonFile<Payload>(
      manifest.payload.path,
      manifest.payload.sha256,
    );
    const atlas = createAtlas(payload, manifest);
    atlas.release = {
      ...manifest.release,
      manifestPath: pointer.manifest,
      manifestHash: pointer.sha256,
    };
    if (atlas.learning) atlas.learning.release = atlas.release;
    return atlas;
  })().catch((error) => {
    loading = null;
    throw error;
  });
  return loading;
}
/** Private upstream catalogs are not part of this public Persian corpus. */
export async function loadPrivateAtlas(
  _open: Atlas | null,
): Promise<Atlas | null> {
  return null;
}

/** Restore an immutable release for a paused session without applying old answers again. */
export async function resolveSessionAtlas(
  current: Atlas,
  session: {
    manifestPath?: string;
    manifestHash?: string;
    releaseId?: string;
    finished?: number;
  } | null,
): Promise<{ atlas: Atlas; unavailable: boolean }> {
  if (
    !session ||
    session.finished ||
    !session.manifestHash ||
    session.manifestHash === current.release?.manifestHash
  )
    return { atlas: current, unavailable: false };
  try {
    if (!session.manifestPath) return { atlas: current, unavailable: true };
    const manifest = await jsonFile<Manifest>(
      session.manifestPath,
      session.manifestHash,
    );
    if (manifest.corpusId !== current.id)
      return { atlas: current, unavailable: true };
    const payload = await jsonFile<Payload>(
      manifest.payload.path,
      manifest.payload.sha256,
    );
    const atlas = createAtlas(payload, manifest);
    atlas.release = {
      ...manifest.release,
      manifestPath: session.manifestPath,
      manifestHash: session.manifestHash,
    };
    if (atlas.learning) atlas.learning.release = atlas.release;
    return { atlas, unavailable: false };
  } catch {
    return { atlas: current, unavailable: true };
  }
}
