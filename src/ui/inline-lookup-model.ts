export function normalizeLookupWord(word: string) {
  return word.normalize("NFKC").replace(/[’‘]/g, "'").toLocaleLowerCase("en");
}

export function lookupTokens(text: string) {
  return text.split(/(\p{L}+(?:['’‑-]\p{L}+)*)/gu).filter(Boolean);
}

const unchangedNouns = new Set([
  "news",
  "physics",
  "mathematics",
  "species",
  "series",
  "means",
  "headquarters",
  "clothes",
]);
export function matchLookupWord<T>(
  token: string,
  dictionary: Map<string, T>,
): T | undefined {
  const normalized = normalizeLookupWord(token);
  const exact = dictionary.get(normalized);
  if (exact !== undefined) return exact;
  if (unchangedNouns.has(normalized)) return;
  const candidates: string[] = [];
  if (normalized.endsWith("'s")) candidates.push(normalized.slice(0, -2));
  if (normalized.endsWith("ies") && normalized.length > 4)
    candidates.push(`${normalized.slice(0, -3)}y`);
  if (normalized.endsWith("es") && normalized.length > 4)
    candidates.push(normalized.slice(0, -2));
  if (
    normalized.endsWith("s") &&
    normalized.length > 3 &&
    !normalized.endsWith("ss")
  )
    candidates.push(normalized.slice(0, -1));
  if (normalized.endsWith("ed") && normalized.length > 4) {
    const stem = normalized.slice(0, -2);
    candidates.push(
      stem,
      `${stem}e`,
      stem.replace(/([bcdfghjklmnpqrstvwxyz])\1$/, "$1"),
    );
  }
  if (normalized.endsWith("ing") && normalized.length > 5) {
    const stem = normalized.slice(0, -3);
    candidates.push(
      stem,
      `${stem}e`,
      stem.replace(/([bcdfghjklmnpqrstvwxyz])\1$/, "$1"),
    );
  }
  for (const candidate of candidates) {
    const found = dictionary.get(candidate);
    if (found !== undefined) return found;
  }
}
