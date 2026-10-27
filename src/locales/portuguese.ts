import rawCatalog from "./published/pt-BR.json";
import type { WordRef } from "../atlas/types";
import { normalizePortugueseSearch } from "./registry";
import type { PortugueseCatalog } from "./types";

export const portugueseCatalog = rawCatalog as unknown as PortugueseCatalog;

/** A translation overlay never creates entries or exposes senses absent from the published release. */
export function availablePortugueseWords(words: readonly WordRef[]): WordRef[] {
  return words.filter((word) => {
    const translation = portugueseCatalog.entries[word.id];
    return (
      translation?.sourceWord === word.word &&
      word.senseIds?.some((id) => translation.senses[id])
    );
  });
}

export function portugueseGloss(word: WordRef): string {
  const translation = portugueseCatalog.entries[word.id];
  return [
    ...new Set(
      (word.senseIds ?? []).flatMap(
        (id) => translation?.senses[id]?.gloss ?? [],
      ),
    ),
  ].join("; ");
}

export function matchesPortugueseSearch(word: WordRef, query: string): boolean {
  const normalized = normalizePortugueseSearch(query);
  if (!normalized) return true;
  const translation = portugueseCatalog.entries[word.id];
  const definitions = (word.senseIds ?? [])
    .flatMap((id) => translation?.senses[id]?.definition ?? [])
    .join(" ");
  return normalizePortugueseSearch(
    `${word.word} ${portugueseGloss(word)} ${definitions}`,
  ).includes(normalized);
}

export function portugueseCategoryLabel(id: string): string {
  return portugueseCatalog.categories[id]?.label ?? "Categoria em preparação";
}
