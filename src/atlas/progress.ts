import type { Atlas, WordRef } from "./types";
import type { Progress } from "../store/store";
import type { CardState } from "../store/srs";
import { isMastered } from "../store/srs";

const grouped = new WeakMap<Atlas, Map<string, WordRef[]>>();
function sensesByWord(atlas: Atlas) {
  let index = grouped.get(atlas);
  if (!index) {
    index = new Map();
    for (const ref of atlas.learning?.words ?? []) {
      const id = ref.lexicalId ?? ref.id;
      const list = index.get(id) ?? [];
      list.push(ref);
      index.set(id, list);
    }
    grouped.set(atlas, index);
  }
  return index;
}
/** A partial lexical item is learning; only all scoped meanings can be familiar. */
export function aggregateWordProgress(
  atlas: Atlas,
  progress: Progress,
  domain = "all",
): Progress {
  const cards: Record<string, CardState> = {};
  const index = sensesByWord(atlas);
  for (const word of atlas.words) {
    const senses = (index.get(word.id) ?? []).filter(
      (sense) => domain === "all" || sense.domainIds?.includes(domain),
    );
    if (!senses.length) {
      if (progress.cards[word.id]) cards[word.id] = progress.cards[word.id];
      continue;
    }
    const learned = senses
      .map((s) => progress.cards[s.id])
      .filter((c): c is CardState => !!c);
    if (!learned.length) continue;
    const familiar =
      learned.length === senses.length && learned.every(isMastered);
    const representative = [...learned].sort((a, b) => a.s - b.s)[0];
    cards[word.id] = familiar
      ? representative
      : { ...representative, st: 1, s: Math.min(representative.s, 20) };
  }
  return {
    ...progress,
    cards,
    bookmarks: [
      ...new Set(
        progress.bookmarks.map((id) => atlas.senseToLexical?.get(id) ?? id),
      ),
    ],
  };
}
export const lexicalId = (atlas: Atlas, id: string) =>
  atlas.senseToLexical?.get(id) ?? id;
