import { createContext, useContext, useEffect, useState } from "react";
import type { Atlas, Entry } from "./types";

export const AtlasContext = createContext<Atlas | null>(null);

export function useAtlas() {
  const a = useContext(AtlasContext);
  if (!a) throw new Error("Atlas not loaded");
  return a;
}

export function useLearningAtlas() {
  const atlas = useAtlas();
  return atlas.learning ?? atlas;
}

/** Full entry for an id; returns the cached copy synchronously when available. */
export function useEntry(id: string | null | undefined) {
  const atlas = useAtlas();
  const [entry, setEntry] = useState<Entry | undefined>(() =>
    id ? atlas.peek(id) : undefined,
  );
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    const hit = atlas.peek(id);
    setEntry(hit);
    setError(null);
    if (hit) return;
    let live = true;
    atlas.entry(id).then(
      (e) => live && setEntry(e),
      (e: Error) => live && setError(e.message),
    );
    return () => {
      live = false;
    };
  }, [atlas, id]);
  return { entry: entry?.id === id ? entry : undefined, error };
}

/** Warm the chunks for a list of ids (e.g. a learning session). */
export async function prefetch(atlas: Atlas, ids: string[]) {
  const pending = [...new Set(ids)];
  const results: (Entry | null)[] = Array(pending.length).fill(null);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, pending.length) }, async () => {
      while (cursor < pending.length) {
        const index = cursor++;
        results[index] = await atlas.entry(pending[index]).catch(() => null);
      }
    }),
  );
  return results;
}
