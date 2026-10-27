import type { Progress } from "../store/store";

export interface ProgressOperation {
  id: string;
  before: Progress;
  after: Progress;
  replace?: boolean;
}
const DB = "mehrdadika-progress";
const STORE = "progress";
let opened: Promise<IDBDatabase | null> | null = null;
function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined")
    return Promise.resolve(null);
  if (opened) return opened;
  opened = new Promise((resolve, reject) => {
    let finished = false;
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => {
      if (finished) {
        request.result.close();
        return;
      }
      finished = true;
      request.result.onversionchange = () => {
        request.result.close();
        opened = null;
      };
      resolve(request.result);
    };
    request.onerror = () => {
      finished = true;
      opened = null;
      reject(request.error ?? new Error("Storage unavailable"));
    };
    request.onblocked = () => {
      finished = true;
      opened = null;
      reject(
        new Error("بستن برگه‌های قدیمی برای به‌روزرسانی ذخیره‌سازی لازم است."),
      );
    };
  });
  return opened;
}
interface Saved {
  progress: Progress;
  operations: string[];
}
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
/** Merge a delta in a single read/write transaction, preserving unrelated changes from other tabs. */
export function mergeProgress(
  current: Progress,
  before: Progress,
  after: Progress,
): Progress {
  const cards = { ...current.cards };
  for (const [id, card] of Object.entries(after.cards)) {
    if (same(before.cards[id], card)) continue;
    const existing = cards[id];
    if (
      !existing ||
      (card.last ?? card.seen) >= (existing.last ?? existing.seen)
    )
      cards[id] = card;
  }
  const bookmarks = new Set(current.bookmarks);
  after.bookmarks
    .filter((id) => !before.bookmarks.includes(id))
    .forEach((id) => bookmarks.add(id));
  before.bookmarks
    .filter((id) => !after.bookmarks.includes(id))
    .forEach((id) => bookmarks.delete(id));
  const days = { ...current.days };
  for (const [day, stat] of Object.entries(after.days)) {
    const old = before.days[day] ?? { n: 0, r: 0, c: 0, t: 0 };
    const saved = current.days[day] ?? { n: 0, r: 0, c: 0, t: 0 };
    days[day] = {
      n: saved.n + Math.max(0, stat.n - old.n),
      r: saved.r + Math.max(0, stat.r - old.r),
      c: saved.c + Math.max(0, stat.c - old.c),
      t: saved.t + Math.max(0, stat.t - old.t),
    };
  }
  const rounds = new Map(
    current.typing.map((round) => [`${round.at}:${round.mode}`, round]),
  );
  after.typing
    .filter(
      (round) =>
        !before.typing.some(
          (old) => old.at === round.at && old.mode === round.mode,
        ),
    )
    .forEach((round) => rounds.set(`${round.at}:${round.mode}`, round));
  let session = current.session;
  if (!same(before.session, after.session)) {
    const next = after.session;
    if (next && session?.id === next.id)
      session = {
        ...(next.index >= session.index ? next : session),
        graded: { ...session.graded, ...next.graded },
      };
    else if (!next && (!session || session.id === before.session?.id))
      session = null;
    else if (next && (!session || next.started >= session.started))
      session = next;
  }
  return {
    ...current,
    cards,
    bookmarks: [...bookmarks],
    days,
    session,
    typing: [...rounds.values()].sort((a, b) => a.at - b.at).slice(-500),
    mistakes: [
      ...new Set([
        ...after.mistakes.filter((id) => !before.mistakes.includes(id)),
        ...current.mistakes,
      ]),
    ].slice(0, 300),
  };
}
export async function readProgress(
  datasetId: string,
): Promise<Progress | null> {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(datasetId);
    request.onsuccess = () =>
      resolve((request.result as Saved | undefined)?.progress ?? null);
    request.onerror = () => reject(request.error);
  });
}
export async function persistOperation(
  operation: ProgressOperation,
): Promise<Progress> {
  const db = await openDatabase();
  if (!db) return operation.after;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const request = store.get(operation.after.datasetId);
    let result = operation.after;
    request.onsuccess = () => {
      const saved = request.result as Saved | undefined;
      if (saved?.operations.includes(operation.id)) {
        result = saved.progress;
        return;
      }
      result =
        operation.replace || !saved
          ? operation.after
          : mergeProgress(saved.progress, operation.before, operation.after);
      store.put(
        {
          progress: result,
          operations: [...(saved?.operations ?? []), operation.id].slice(
            -50000,
          ),
        } satisfies Saved,
        operation.after.datasetId,
      );
    };
    request.onerror = () => tx.abort();
    tx.oncomplete = () => resolve(result);
    tx.onerror = () =>
      reject(tx.error ?? new Error("ذخیرهٔ پیشرفت ناموفق بود."));
    tx.onabort = () => reject(tx.error ?? new Error("ذخیرهٔ پیشرفت لغو شد."));
  });
}
