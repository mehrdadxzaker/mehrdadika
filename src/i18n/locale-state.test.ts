import assert from "node:assert/strict";
import test from "node:test";

/** A controlled local IndexedDB stand-in; no network, browser processes or timers are left running. */
test(
  "rapid edition changes ignore stale storage successes and failures, and backups cannot cross editions",
  { timeout: 5000 },
  async () => {
    const descriptors = new Map(
      [
        "window",
        "document",
        "localStorage",
        "indexedDB",
        "BroadcastChannel",
      ].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
    );
    const records = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => records.set(key, value),
    };
    type Request = {
      result?: unknown;
      error?: Error;
      onsuccess?: () => void;
      onerror?: () => void;
    };
    const reads = new Map<string, Request>();
    let receive = async (_event: { data: { datasetId: string } }) => {};
    class LocalChannel {
      addEventListener(_event: string, handler: typeof receive) {
        receive = handler;
      }
      postMessage() {}
    }
    let automatic = false;
    const database = {
      transaction: (_store: string, mode: string) => {
        const transaction: {
          oncomplete?: () => void;
          objectStore: () => unknown;
        } = {
          objectStore: () => ({
            get: (id: string) => {
              const request: Request = {};
              if (mode === "readonly" && !automatic) reads.set(id, request);
              else queueMicrotask(() => request.onsuccess?.());
              return request;
            },
            put: () => queueMicrotask(() => transaction.oncomplete?.()),
          }),
        };
        return transaction;
      },
      close: () => {},
    };
    Object.defineProperties(globalThis, {
      window: {
        configurable: true,
        value: {
          localStorage,
          addEventListener: () => {},
          clearTimeout,
          setTimeout,
        },
      },
      document: { configurable: true, value: { addEventListener: () => {} } },
      localStorage: { configurable: true, value: localStorage },
      BroadcastChannel: { configurable: true, value: LocalChannel },
      indexedDB: {
        configurable: true,
        value: {
          open: () => {
            const request: Request = { result: database };
            queueMicrotask(() => request.onsuccess?.());
            return request;
          },
        },
      },
    });
    const { store, exportBackup, importBackup, flush } =
      await import("../store/store");
    const { readingSnapshot, restoreReading, setReadingLocale } =
      await import("../reading/state");
    const untilRead = async (id: string) => {
      for (let index = 0; index < 20 && !reads.has(id); index++)
        await Promise.resolve();
      assert.ok(reads.has(id), `expected a pending local read for ${id}`);
      return reads.get(id)!;
    };
    try {
      const oldLoad = store.useDataset("corpus:pt-BR");
      const oldRead = await untilRead("corpus:pt-BR");
      const newLoad = store.useDataset("corpus:es-419");
      const newRead = await untilRead("corpus:es-419");
      newRead.onsuccess?.();
      await newLoad;
      assert.equal(store.get().progress.datasetId, "corpus:es-419");
      oldRead.error = new Error("an earlier locale's storage failed late");
      oldRead.onerror?.();
      await oldLoad;
      assert.equal(store.get().progress.datasetId, "corpus:es-419");
      assert.equal(store.get().saveError, false);

      const staleSuccess = store.useDataset("corpus");
      const staleRead = await untilRead("corpus");
      reads.delete("corpus:pt-BR");
      const newest = store.useDataset("corpus:pt-BR");
      const latestRead = await untilRead("corpus:pt-BR");
      latestRead.onsuccess?.();
      await newest;
      staleRead.onsuccess?.();
      await staleSuccess;
      assert.equal(store.get().progress.datasetId, "corpus:pt-BR");

      // A slow storage refresh from another tab must also stay inside its original edition.
      reads.delete("corpus:pt-BR");
      const oldTabProgress = {
        ...store.get().progress,
        bookmarks: ["must-not-cross-editions"],
      };
      const oldBroadcast = receive({ data: { datasetId: "corpus:pt-BR" } });
      const oldTabRead = await untilRead("corpus:pt-BR");
      reads.delete("corpus:es-419");
      const switchDuringBroadcast = store.useDataset("corpus:es-419");
      (await untilRead("corpus:es-419")).onsuccess?.();
      await switchDuringBroadcast;
      oldTabRead.result = { progress: oldTabProgress };
      oldTabRead.onsuccess?.();
      await oldBroadcast;
      assert.equal(store.get().progress.datasetId, "corpus:es-419");
      assert.deepEqual(store.get().progress.bookmarks, []);

      automatic = true;
      await store.useDataset("corpus:pt-BR");
      setReadingLocale("pt-BR");
      restoreReading({ version: 1, completed: ["a-clinic-visit"] });
      store.progress((p) => ({
        ...p,
        bookmarks: ["pressure"],
        typing: [{ at: 1, mode: "word", items: 1, wpm: 40, accuracy: 100 }],
      }));
      await store.settled();
      const backup = exportBackup();
      assert.equal(JSON.parse(backup).progress.datasetId, "corpus:pt-BR");
      await store.useDataset("corpus:es-419");
      setReadingLocale("es-419");
      const before = store.get().progress;
      const readerBefore = readingSnapshot();
      assert.equal(importBackup(backup).ok, false);
      assert.deepEqual(store.get().progress, before);
      assert.deepEqual(readingSnapshot(), readerBefore);
      await store.useDataset("corpus:pt-BR");
      setReadingLocale("pt-BR");
      restoreReading(null);
      assert.equal(importBackup(backup).ok, true);
      assert.deepEqual(store.get().progress.bookmarks, ["pressure"]);
      assert.equal(store.get().progress.typing[0]?.wpm, 40);
      assert.deepEqual(readingSnapshot().completed, ["a-clinic-visit"]);
      await store.settled();
    } finally {
      flush();
      setReadingLocale("fa");
      for (const [key, descriptor] of descriptors) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    }
  },
);
